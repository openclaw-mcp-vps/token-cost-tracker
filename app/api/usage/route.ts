import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { filterEventsByDateRange, getUtcDayRange, getYesterdayUtcRange, summarizeUsage } from "@/lib/analytics";
import { detectBudgetViolations, sendBudgetViolationToDiscord } from "@/lib/alerts";
import { requirePaidAccess } from "@/lib/api-auth";
import { addUsageEvents, getAlertSettings, markAlertSent, readStore, setProviderStatus, wasAlertSent } from "@/lib/database";
import { syncAllProviders } from "@/lib/providers/sync";
import { PROVIDERS, type ProviderName, type UsageEvent } from "@/lib/types";

export const runtime = "nodejs";

const usageEventSchema = z.object({
  timestamp: z.string().datetime().optional(),
  provider: z.enum(["openai", "anthropic", "google", "moltbook"]),
  model: z.string().min(1),
  workflow: z.string().min(1),
  agent: z.string().min(1),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0).optional(),
  costUsd: z.number().min(0),
  requests: z.number().int().min(1).optional(),
});

const usagePayloadSchema = z.object({
  events: z.array(usageEventSchema).min(1),
});

const providerEnvMap: Record<ProviderName, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  moltbook: "MOLTBOOK_API_KEY",
};

async function sendAnyNewViolations(events: UsageEvent[]): Promise<number> {
  const settings = await getAlertSettings();
  const violations = detectBudgetViolations(events, settings);
  let sent = 0;

  for (const violation of violations) {
    if (await wasAlertSent(violation.key)) {
      continue;
    }

    const result = await sendBudgetViolationToDiscord(violation, settings.discordWebhookUrl);
    if (result.success) {
      await markAlertSent(violation.key);
      sent += 1;
    }
  }

  return sent;
}

async function syncYesterdayProviders(): Promise<{ addedEvents: number }> {
  const { start, end } = getYesterdayUtcRange();
  const results = await syncAllProviders(start, end);
  const now = new Date().toISOString();

  const events = results.flatMap((result) => result.events);
  const insertResult = await addUsageEvents(events);

  for (const provider of PROVIDERS) {
    const result = results.find((entry) => entry.provider === provider);
    const configured = Boolean(process.env[providerEnvMap[provider]]);

    await setProviderStatus(provider, {
      configured,
      connected: Boolean(result?.connected),
      lastSyncAt: now,
      lastError: result?.error ?? null,
    });
  }

  return { addedEvents: insertResult.added };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  const sync = request.nextUrl.searchParams.get("sync") === "1";
  if (sync) {
    await syncYesterdayProviders();
  }

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const boundedDays = Number.isFinite(days) ? Math.max(1, Math.min(90, Math.floor(days))) : 30;

  const store = await readStore();
  const range = getUtcDayRange(boundedDays);
  const rangeEvents = filterEventsByDateRange(store.usageEvents, range.start, range.end);
  const summary = summarizeUsage(rangeEvents);

  const yesterday = getYesterdayUtcRange();
  const yesterdayEvents = filterEventsByDateRange(store.usageEvents, yesterday.start, yesterday.end);
  const yesterdaySummary = summarizeUsage(yesterdayEvents);

  return NextResponse.json({
    range: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      days: boundedDays,
    },
    summary,
    yesterday: {
      date: yesterday.start.toISOString().slice(0, 10),
      costUsd: yesterdaySummary.totals.costUsd,
      totalTokens: yesterdaySummary.totals.totalTokens,
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  const json = (await request.json()) as unknown;
  const parsed = usagePayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid usage payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const incoming: UsageEvent[] = parsed.data.events.map((event, index) => {
    const timestamp = event.timestamp ?? new Date().toISOString();
    const totalTokens = event.totalTokens ?? event.inputTokens + event.outputTokens;
    const requests = event.requests ?? 1;

    return {
      id: `${event.provider}-${timestamp}-${event.agent}-${event.workflow}-${event.model}-${index}`,
      timestamp,
      provider: event.provider,
      model: event.model,
      workflow: event.workflow,
      agent: event.agent,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      totalTokens,
      costUsd: event.costUsd,
      requests,
      source: "agent_ingest",
    };
  });

  const insertResult = await addUsageEvents(incoming);
  const store = await readStore();
  const alertsSent = await sendAnyNewViolations(store.usageEvents);

  return NextResponse.json({
    received: parsed.data.events.length,
    added: insertResult.added,
    alertsSent,
  });
}
