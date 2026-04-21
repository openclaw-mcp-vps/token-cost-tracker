import { format, subDays } from "date-fns";
import { UsageRecord } from "@/lib/types";
import { roundUsd } from "@/lib/utils";

export interface AggregatedUsage {
  totalCostUsd: number;
  totalTokens: number;
  byDay: Array<{ day: string; costUsd: number; tokens: number }>;
  byAgent: Array<{ agentId: string; costUsd: number; tokens: number; providers: Record<string, number> }>;
  byProvider: Array<{ provider: string; costUsd: number; tokens: number }>;
  byModel: Array<{ model: string; costUsd: number; tokens: number }>;
  byWorkflow: Array<{ workflow: string; costUsd: number; tokens: number }>;
}

export interface RunawayAgent {
  agentId: string;
  yesterdayCostUsd: number;
  baselineCostUsd: number;
  jumpFactor: number;
}

function sumNumberMap(map: Map<string, number>): Array<{ key: string; value: number }> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, value: roundUsd(value) }));
}

export function aggregateUsage(records: UsageRecord[]): AggregatedUsage {
  const byDayCost = new Map<string, number>();
  const byDayTokens = new Map<string, number>();
  const byProviderCost = new Map<string, number>();
  const byProviderTokens = new Map<string, number>();
  const byModelCost = new Map<string, number>();
  const byModelTokens = new Map<string, number>();
  const byWorkflowCost = new Map<string, number>();
  const byWorkflowTokens = new Map<string, number>();

  const agentTotals = new Map<string, { cost: number; tokens: number; providers: Record<string, number> }>();

  let totalCostUsd = 0;
  let totalTokens = 0;

  for (const record of records) {
    const day = format(new Date(record.timestamp), "yyyy-MM-dd");

    totalCostUsd += record.costUsd;
    totalTokens += record.totalTokens;

    byDayCost.set(day, (byDayCost.get(day) ?? 0) + record.costUsd);
    byDayTokens.set(day, (byDayTokens.get(day) ?? 0) + record.totalTokens);

    byProviderCost.set(record.provider, (byProviderCost.get(record.provider) ?? 0) + record.costUsd);
    byProviderTokens.set(record.provider, (byProviderTokens.get(record.provider) ?? 0) + record.totalTokens);

    byModelCost.set(record.model, (byModelCost.get(record.model) ?? 0) + record.costUsd);
    byModelTokens.set(record.model, (byModelTokens.get(record.model) ?? 0) + record.totalTokens);

    byWorkflowCost.set(record.workflow, (byWorkflowCost.get(record.workflow) ?? 0) + record.costUsd);
    byWorkflowTokens.set(record.workflow, (byWorkflowTokens.get(record.workflow) ?? 0) + record.totalTokens);

    const currentAgent = agentTotals.get(record.agentId) ?? { cost: 0, tokens: 0, providers: {} };
    currentAgent.cost += record.costUsd;
    currentAgent.tokens += record.totalTokens;
    currentAgent.providers[record.provider] = (currentAgent.providers[record.provider] ?? 0) + record.costUsd;
    agentTotals.set(record.agentId, currentAgent);
  }

  return {
    totalCostUsd: roundUsd(totalCostUsd),
    totalTokens,
    byDay: Array.from(byDayCost.entries())
      .map(([day, costUsd]) => ({ day, costUsd: roundUsd(costUsd), tokens: Math.round(byDayTokens.get(day) ?? 0) }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
    byAgent: Array.from(agentTotals.entries())
      .map(([agentId, totals]) => ({
        agentId,
        costUsd: roundUsd(totals.cost),
        tokens: Math.round(totals.tokens),
        providers: Object.fromEntries(Object.entries(totals.providers).map(([provider, value]) => [provider, roundUsd(value)]))
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    byProvider: sumNumberMap(byProviderCost).map((entry) => ({
      provider: entry.key,
      costUsd: entry.value,
      tokens: Math.round(byProviderTokens.get(entry.key) ?? 0)
    })),
    byModel: sumNumberMap(byModelCost).map((entry) => ({
      model: entry.key,
      costUsd: entry.value,
      tokens: Math.round(byModelTokens.get(entry.key) ?? 0)
    })),
    byWorkflow: sumNumberMap(byWorkflowCost).map((entry) => ({
      workflow: entry.key,
      costUsd: entry.value,
      tokens: Math.round(byWorkflowTokens.get(entry.key) ?? 0)
    }))
  };
}

export function detectRunawayAgents(records: UsageRecord[]): RunawayAgent[] {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const baselineDays = new Set(Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i + 2), "yyyy-MM-dd")));

  const yesterdayTotals = new Map<string, number>();
  const baselineTotals = new Map<string, number>();

  for (const record of records) {
    const day = format(new Date(record.timestamp), "yyyy-MM-dd");

    if (day === yesterday) {
      yesterdayTotals.set(record.agentId, (yesterdayTotals.get(record.agentId) ?? 0) + record.costUsd);
    }

    if (baselineDays.has(day)) {
      baselineTotals.set(record.agentId, (baselineTotals.get(record.agentId) ?? 0) + record.costUsd);
    }
  }

  const runaway: RunawayAgent[] = [];

  for (const [agentId, yCost] of yesterdayTotals.entries()) {
    const baselineTotal = baselineTotals.get(agentId) ?? 0;
    const baselineAvg = baselineTotal / 7;

    if (yCost >= 10 && baselineAvg > 0 && yCost / baselineAvg >= 2) {
      runaway.push({
        agentId,
        yesterdayCostUsd: roundUsd(yCost),
        baselineCostUsd: roundUsd(baselineAvg),
        jumpFactor: Number((yCost / baselineAvg).toFixed(2))
      });
    }
  }

  return runaway.sort((a, b) => b.yesterdayCostUsd - a.yesterdayCostUsd);
}

export function monthlySpendByAgent(records: UsageRecord[]): Map<string, { total: number; providerBreakdown: Record<string, number> }> {
  const month = format(new Date(), "yyyy-MM");
  const totals = new Map<string, { total: number; providerBreakdown: Record<string, number> }>();

  for (const record of records) {
    const recordMonth = format(new Date(record.timestamp), "yyyy-MM");
    if (recordMonth !== month) {
      continue;
    }

    const item = totals.get(record.agentId) ?? { total: 0, providerBreakdown: {} };
    item.total += record.costUsd;
    item.providerBreakdown[record.provider] = (item.providerBreakdown[record.provider] ?? 0) + record.costUsd;
    totals.set(record.agentId, item);
  }

  return totals;
}
