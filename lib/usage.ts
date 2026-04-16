import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subDays } from "date-fns";
import { readDb } from "@/lib/database/store";

export interface DailyCostPoint {
  date: string;
  cost: number;
}

export interface AgentRollup {
  agentName: string;
  provider: string;
  workflow: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  monthlyBudgetUsd: number;
  budgetUsedPct: number;
  overBudget: boolean;
}

export async function getDashboardMetrics() {
  const db = await readDb();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthUsage = db.usage.filter((u) => {
    const dt = parseISO(u.capturedAt);
    return isWithinInterval(dt, { start: monthStart, end: monthEnd });
  });

  const byAgent = new Map<string, AgentRollup>();
  for (const row of monthUsage) {
    const key = `${row.agentName}-${row.provider}-${row.workflow}-${row.model}`;
    const existing = byAgent.get(key);
    const budget = db.budgets.find((b) => b.agentName === row.agentName)?.monthlyBudgetUsd ?? 150;
    if (existing) {
      existing.inputTokens += row.inputTokens;
      existing.outputTokens += row.outputTokens;
      existing.totalCostUsd += row.totalCostUsd;
      existing.budgetUsedPct = (existing.totalCostUsd / budget) * 100;
      existing.overBudget = existing.totalCostUsd > budget;
      byAgent.set(key, existing);
      continue;
    }

    byAgent.set(key, {
      agentName: row.agentName,
      provider: row.provider,
      workflow: row.workflow,
      model: row.model,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      totalCostUsd: row.totalCostUsd,
      monthlyBudgetUsd: budget,
      budgetUsedPct: (row.totalCostUsd / budget) * 100,
      overBudget: row.totalCostUsd > budget,
    });
  }

  const last14: DailyCostPoint[] = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(now, 13 - i);
    const label = format(date, "MMM d");
    const total = db.usage
      .filter((u) => format(parseISO(u.capturedAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
      .reduce((acc, row) => acc + row.totalCostUsd, 0);
    return { date: label, cost: Number(total.toFixed(2)) };
  });

  const providerTotals = db.usage.reduce<Record<string, number>>((acc, row) => {
    acc[row.provider] = (acc[row.provider] ?? 0) + row.totalCostUsd;
    return acc;
  }, {});

  return {
    dailyCosts: last14,
    agentRows: [...byAgent.values()].sort((a, b) => b.totalCostUsd - a.totalCostUsd),
    providerTotals,
    monthlyTotal: Number(monthUsage.reduce((acc, row) => acc + row.totalCostUsd, 0).toFixed(2)),
  };
}
