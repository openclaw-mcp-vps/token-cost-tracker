import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeBudgetBreaches, evaluateBudgetAlertsAndNotify } from "@/lib/alerts";
import { readDb, writeDb } from "@/lib/database";

const alertUpdateSchema = z.object({
  enabled: z.boolean(),
  monthlyBudgetUsd: z.number().positive(),
  discordWebhookUrl: z.string().url().optional().or(z.literal(""))
});

export async function GET() {
  const db = await readDb();
  const breaches = await computeBudgetBreaches();

  return NextResponse.json({
    settings: {
      enabled: db.alertSettings.enabled,
      monthlyBudgetUsd: db.alertSettings.monthlyBudgetUsd,
      hasDiscordWebhook: Boolean(db.alertSettings.discordWebhookUrl)
    },
    breaches
  });
}

export async function POST(request: NextRequest) {
  const parsed = alertUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert settings", details: parsed.error.flatten() }, { status: 400 });
  }

  const next = parsed.data;

  await writeDb((db) => ({
    ...db,
    alertSettings: {
      ...db.alertSettings,
      enabled: next.enabled,
      monthlyBudgetUsd: next.monthlyBudgetUsd,
      discordWebhookUrl: next.discordWebhookUrl || undefined,
      notifiedAgentMonths: []
    }
  }));

  const breaches = await evaluateBudgetAlertsAndNotify();

  return NextResponse.json({ success: true, breaches });
}
