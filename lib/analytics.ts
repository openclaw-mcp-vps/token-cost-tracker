import { type DashboardSummary, type ProviderName, type UsageEvent } from "@/lib/types";

export function toDateKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function getUtcDayRange(daysBack: number): { start: Date; end: Date } {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (daysBack - 1));
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}

export function getYesterdayUtcRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  end.setUTCHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}

export function filterEventsByDateRange(events: UsageEvent[], start: Date, end: Date): UsageEvent[] {
  return events.filter((event) => {
    const ts = new Date(event.timestamp).getTime();
    return ts >= start.getTime() && ts <= end.getTime();
  });
}

export function summarizeUsage(events: UsageEvent[]): DashboardSummary {
  const dailyMap = new Map<string, { costUsd: number; totalTokens: number; requests: number }>();
  const providerMap = new Map<ProviderName, { costUsd: number; totalTokens: number; requests: number }>();
  const modelMap = new Map<string, { model: string; provider: ProviderName; costUsd: number; totalTokens: number; requests: number }>();
  const workflowMap = new Map<string, { workflow: string; costUsd: number; totalTokens: number; requests: number }>();
  const agentMap = new Map<string, { agent: string; workflow: string; provider: ProviderName; model: string; costUsd: number; totalTokens: number; requests: number }>();

  let totalCost = 0;
  let totalTokens = 0;
  let totalRequests = 0;

  for (const event of events) {
    totalCost += event.costUsd;
    totalTokens += event.totalTokens;
    totalRequests += event.requests;

    const day = toDateKey(event.timestamp);
    const dayEntry = dailyMap.get(day) ?? { costUsd: 0, totalTokens: 0, requests: 0 };
    dayEntry.costUsd += event.costUsd;
    dayEntry.totalTokens += event.totalTokens;
    dayEntry.requests += event.requests;
    dailyMap.set(day, dayEntry);

    const providerEntry = providerMap.get(event.provider) ?? { costUsd: 0, totalTokens: 0, requests: 0 };
    providerEntry.costUsd += event.costUsd;
    providerEntry.totalTokens += event.totalTokens;
    providerEntry.requests += event.requests;
    providerMap.set(event.provider, providerEntry);

    const modelKey = `${event.provider}:${event.model}`;
    const modelEntry = modelMap.get(modelKey) ?? {
      model: event.model,
      provider: event.provider,
      costUsd: 0,
      totalTokens: 0,
      requests: 0,
    };
    modelEntry.costUsd += event.costUsd;
    modelEntry.totalTokens += event.totalTokens;
    modelEntry.requests += event.requests;
    modelMap.set(modelKey, modelEntry);

    const workflowEntry = workflowMap.get(event.workflow) ?? {
      workflow: event.workflow,
      costUsd: 0,
      totalTokens: 0,
      requests: 0,
    };
    workflowEntry.costUsd += event.costUsd;
    workflowEntry.totalTokens += event.totalTokens;
    workflowEntry.requests += event.requests;
    workflowMap.set(event.workflow, workflowEntry);

    const agentKey = `${event.agent}:${event.workflow}:${event.provider}:${event.model}`;
    const agentEntry = agentMap.get(agentKey) ?? {
      agent: event.agent,
      workflow: event.workflow,
      provider: event.provider,
      model: event.model,
      costUsd: 0,
      totalTokens: 0,
      requests: 0,
    };

    agentEntry.costUsd += event.costUsd;
    agentEntry.totalTokens += event.totalTokens;
    agentEntry.requests += event.requests;
    agentMap.set(agentKey, agentEntry);
  }

  return {
    totals: {
      costUsd: Number(totalCost.toFixed(4)),
      totalTokens,
      requests: totalRequests,
    },
    daily: Array.from(dailyMap.entries())
      .map(([date, value]) => ({
        date,
        costUsd: Number(value.costUsd.toFixed(4)),
        totalTokens: value.totalTokens,
        requests: value.requests,
      }))
      .sort((a, b) => (a.date > b.date ? 1 : -1)),
    providers: Array.from(providerMap.entries())
      .map(([provider, value]) => ({
        provider,
        costUsd: Number(value.costUsd.toFixed(4)),
        totalTokens: value.totalTokens,
        requests: value.requests,
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    models: Array.from(modelMap.values())
      .map((entry) => ({
        ...entry,
        costUsd: Number(entry.costUsd.toFixed(4)),
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    workflows: Array.from(workflowMap.values())
      .map((entry) => ({
        ...entry,
        costUsd: Number(entry.costUsd.toFixed(4)),
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    agents: Array.from(agentMap.values())
      .map((entry) => ({
        ...entry,
        costUsd: Number(entry.costUsd.toFixed(4)),
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
  };
}

export function getCurrentMonthRange(): { start: Date; end: Date; monthKey: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return { start, end, monthKey };
}
