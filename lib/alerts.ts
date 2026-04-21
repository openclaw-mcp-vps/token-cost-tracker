import { format } from "date-fns";
import { readDb, writeDb } from "@/lib/database";
import { monthlySpendByAgent } from "@/lib/analytics";
import { sendDiscordBudgetAlert } from "@/lib/discord";

export interface BudgetBreach {
  agentId: string;
  spendUsd: number;
  budgetUsd: number;
  providerBreakdown: Record<string, number>;
}

export async function computeBudgetBreaches(): Promise<BudgetBreach[]> {
  const db = await readDb();
  const totals = monthlySpendByAgent(db.usageRecords);
  const budget = db.alertSettings.monthlyBudgetUsd;

  const breaches: BudgetBreach[] = [];
  for (const [agentId, value] of totals.entries()) {
    if (value.total > budget) {
      breaches.push({
        agentId,
        spendUsd: Number(value.total.toFixed(6)),
        budgetUsd: budget,
        providerBreakdown: Object.fromEntries(
          Object.entries(value.providerBreakdown).map(([provider, amount]) => [provider, Number(amount.toFixed(6))])
        )
      });
    }
  }

  return breaches.sort((a, b) => b.spendUsd - a.spendUsd);
}

export async function evaluateBudgetAlertsAndNotify(): Promise<BudgetBreach[]> {
  const db = await readDb();

  if (!db.alertSettings.enabled || !db.alertSettings.discordWebhookUrl) {
    return [];
  }

  const month = format(new Date(), "yyyy-MM");
  const breaches = await computeBudgetBreaches();

  if (breaches.length === 0) {
    return [];
  }

  const notifiedKey = (agentId: string) => `${month}:${agentId}`;
  const currentNotified = new Set(db.alertSettings.notifiedAgentMonths);
  const newToNotify = breaches.filter((item) => !currentNotified.has(notifiedKey(item.agentId)));

  for (const breach of newToNotify) {
    await sendDiscordBudgetAlert(db.alertSettings.discordWebhookUrl, {
      agentId: breach.agentId,
      month,
      spendUsd: breach.spendUsd,
      budgetUsd: breach.budgetUsd,
      providerBreakdown: breach.providerBreakdown
    });
  }

  if (newToNotify.length > 0) {
    await writeDb((current) => ({
      ...current,
      alertSettings: {
        ...current.alertSettings,
        notifiedAgentMonths: [
          ...new Set([
            ...current.alertSettings.notifiedAgentMonths,
            ...newToNotify.map((item) => notifiedKey(item.agentId))
          ])
        ]
      }
    }));
  }

  return breaches;
}
