import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { detectBudgetViolations, sendBudgetViolationToDiscord } from "@/lib/alerts";
import { requirePaidAccess } from "@/lib/api-auth";
import { filterEventsByDateRange, getCurrentMonthRange, summarizeUsage } from "@/lib/analytics";
import { getAlertSettings, markAlertSent, readStore, saveAlertSettings, wasAlertSent } from "@/lib/database";

export const runtime = "nodejs";

const alertSchema = z.object({
  monthlyAgentBudgetUsd: z.number().positive().max(100000),
  monthlyWorkspaceBudgetUsd: z.number().positive().max(1000000),
  discordWebhookUrl: z.string().url().nullable(),
});

async function getAlertsPayload(): Promise<{
  settings: {
    monthlyAgentBudgetUsd: number;
    monthlyWorkspaceBudgetUsd: number;
    discordWebhookUrl: string | null;
  };
  monthlySpendUsd: number;
  activeViolations: number;
}> {
  const store = await readStore();
  const settings = await getAlertSettings();

  const { start, end } = getCurrentMonthRange();
  const monthlyEvents = filterEventsByDateRange(store.usageEvents, start, end);
  const monthlySummary = summarizeUsage(monthlyEvents);
  const violations = detectBudgetViolations(monthlyEvents, settings);

  return {
    settings,
    monthlySpendUsd: monthlySummary.totals.costUsd,
    activeViolations: violations.length,
  };
}

async function sendNewViolations(): Promise<number> {
  const store = await readStore();
  const settings = await getAlertSettings();
  const violations = detectBudgetViolations(store.usageEvents, settings);

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  return NextResponse.json(await getAlertsPayload());
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  const payload = (await request.json()) as unknown;
  const parsed = alertSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid alert settings payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  await saveAlertSettings(parsed.data);
  const sent = await sendNewViolations();

  return NextResponse.json({
    ...(await getAlertsPayload()),
    sentNewAlerts: sent,
  });
}
