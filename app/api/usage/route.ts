import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { aggregateUsage, detectRunawayAgents } from "@/lib/analytics";
import { getProviderConfigFromEnv, readDb, upsertUsageRecords } from "@/lib/database";
import { evaluateBudgetAlertsAndNotify } from "@/lib/alerts";
import { pullProviderUsage } from "@/lib/providers";
import { makeUsageId } from "@/lib/providers/common";
import { estimateCostUsd } from "@/lib/providers/pricing";
import { ProviderId, UsageRecord } from "@/lib/types";
import { toEndOfDay, toStartOfDay } from "@/lib/utils";

const usageIngestSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "moltbook"]),
  model: z.string().min(1),
  workflow: z.string().min(1),
  agentId: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  timestamp: z.string().datetime().optional(),
  costUsd: z.number().nonnegative().optional()
});

function parseDateParam(raw: string | null, fallback: Date): Date {
  if (!raw) {
    return fallback;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

async function pullAllProviderData(start: Date, end: Date): Promise<UsageRecord[]> {
  const db = await readDb();

  const providerIds: ProviderId[] = ["openai", "anthropic", "google", "moltbook"];
  const jobs = providerIds.map(async (provider) => {
    const configured = db.providers[provider] ?? getProviderConfigFromEnv(provider);
    if (!configured || !configured.enabled) {
      return [];
    }

    try {
      return await pullProviderUsage(provider, configured, start, end);
    } catch {
      return [];
    }
  });

  const settled = await Promise.all(jobs);
  return settled.flat();
}

export async function GET(request: NextRequest) {
  const start = toStartOfDay(parseDateParam(request.nextUrl.searchParams.get("start"), subDays(new Date(), 30)));
  const end = toEndOfDay(parseDateParam(request.nextUrl.searchParams.get("end"), new Date()));
  const includeFreshPull = request.nextUrl.searchParams.get("sync") !== "0";

  if (includeFreshPull) {
    const freshRecords = await pullAllProviderData(start, end);
    await upsertUsageRecords(freshRecords);
  }

  const providerFilter = request.nextUrl.searchParams.get("provider");
  const agentFilter = request.nextUrl.searchParams.get("agentId");
  const workflowFilter = request.nextUrl.searchParams.get("workflow");

  const db = await readDb();
  const filtered = db.usageRecords.filter((record) => {
    const ts = new Date(record.timestamp).getTime();
    if (Number.isNaN(ts)) {
      return false;
    }

    if (ts < start.getTime() || ts > end.getTime()) {
      return false;
    }

    if (providerFilter && record.provider !== providerFilter) {
      return false;
    }

    if (agentFilter && record.agentId !== agentFilter) {
      return false;
    }

    if (workflowFilter && record.workflow !== workflowFilter) {
      return false;
    }

    return true;
  });

  const summary = aggregateUsage(filtered);
  const runawayAgents = detectRunawayAgents(filtered);

  const breaches = await evaluateBudgetAlertsAndNotify();

  return NextResponse.json({
    period: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    summary,
    runawayAgents,
    budgetBreaches: breaches,
    records: filtered.slice(0, 200)
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const rows = Array.isArray(payload) ? payload : [payload];

  const parsed = z.array(usageIngestSchema).safeParse(rows);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid usage payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const records: UsageRecord[] = parsed.data.map((row) => {
    const totalTokens = row.inputTokens + row.outputTokens;
    const costUsd = row.costUsd ?? estimateCostUsd(row.provider, row.model, row.inputTokens, row.outputTokens);
    const base = {
      provider: row.provider,
      model: row.model,
      workflow: row.workflow,
      agentId: row.agentId,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      totalTokens,
      costUsd,
      timestamp: row.timestamp ?? now,
      source: "manual" as const
    };

    return {
      ...base,
      id: makeUsageId(base)
    };
  });

  await upsertUsageRecords(records);
  const breaches = await evaluateBudgetAlertsAndNotify();

  return NextResponse.json({
    success: true,
    inserted: records.length,
    month: format(new Date(), "yyyy-MM"),
    budgetBreaches: breaches
  });
}
