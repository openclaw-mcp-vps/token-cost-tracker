import { NextResponse } from "next/server";
import { asCurrency } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/usage";

export async function POST(request: Request) {
  const metrics = await getDashboardMetrics();
  const flagged = metrics.agentRows.filter((r) => r.overBudget || r.budgetUsedPct >= 80).slice(0, 8);

  if (flagged.length === 0) {
    return NextResponse.redirect(new URL("/dashboard?alert=none", request.url));
  }

  const webhookUrl = process.env.DISCORD_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.redirect(new URL("/dashboard?alert=missing-webhook", request.url));
  }

  const lines = flagged.map(
    (f) => `• **${f.agentName}** (${f.provider}/${f.model}) — ${Math.round(f.budgetUsedPct)}% used, ${asCurrency(f.totalCostUsd)} of ${asCurrency(f.monthlyBudgetUsd)} (${f.workflow})`,
  );

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Token Cost Tracker",
      content: `Budget threshold reached:\n${lines.join("\n")}`,
    }),
  });

  return NextResponse.redirect(new URL("/dashboard?alert=sent", request.url));
}
