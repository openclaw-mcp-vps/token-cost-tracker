import { PrismaClient } from '@prisma/client';
import { endOfDay, startOfDay, subDays } from 'date-fns';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type UsageInsert = {
  provider: string;
  model: string;
  workflow: string;
  agent: string;
  date: Date;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  totalTokens: number;
  estimatedCost: number;
};

type AgentAccumulator = {
  agent: string;
  cost: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  providers: Set<string>;
  models: Set<string>;
  workflows: Set<string>;
};

export type BudgetRow = {
  id: string;
  agent: string;
  monthlyBudgetUsd: number;
  discordWebhookUrl: string | null;
  updatedAt: Date;
};

export async function saveUsageRecords(records: UsageInsert[]) {
  if (records.length === 0) {
    return { count: 0 };
  }

  const normalized = records.map((record) => ({
    ...record,
    cachedTokens: record.cachedTokens ?? 0,
  }));

  await prisma.usageRecord.createMany({
    data: normalized,
  });

  return { count: normalized.length };
}

export async function getDashboardSnapshot(days = 30) {
  const from = startOfDay(subDays(new Date(), days - 1));
  const to = endOfDay(new Date());

  const [records, budgets] = await Promise.all([
    prisma.usageRecord.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    }),
    prisma.budget.findMany(),
  ]);

  const byDay = new Map<string, { date: string; cost: number; tokens: number }>();
  const byAgent = new Map<string, AgentAccumulator>();

  let totalCost = 0;
  let totalTokens = 0;

  for (const row of records) {
    const dayKey = row.date.toISOString().slice(0, 10);
    const dayBucket = byDay.get(dayKey) ?? { date: dayKey, cost: 0, tokens: 0 };
    dayBucket.cost += row.estimatedCost;
    dayBucket.tokens += row.totalTokens;
    byDay.set(dayKey, dayBucket);

    const existing = byAgent.get(row.agent);
    const agentBucket: AgentAccumulator =
      existing ?? {
        agent: row.agent,
        cost: 0,
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        providers: new Set<string>(),
        models: new Set<string>(),
        workflows: new Set<string>(),
      };

    agentBucket.cost += row.estimatedCost;
    agentBucket.tokens += row.totalTokens;
    agentBucket.inputTokens += row.inputTokens;
    agentBucket.outputTokens += row.outputTokens;
    agentBucket.providers.add(row.provider);
    agentBucket.models.add(row.model);
    agentBucket.workflows.add(row.workflow);
    byAgent.set(row.agent, agentBucket);

    totalCost += row.estimatedCost;
    totalTokens += row.totalTokens;
  }

  const budgetMap = new Map(budgets.map((budget) => [budget.agent, budget]));

  const monthlyFrom = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthlySpendRows = await prisma.usageRecord.findMany({
    where: {
      date: {
        gte: monthlyFrom,
        lte: to,
      },
    },
  });

  const monthlySpend = new Map<string, number>();
  for (const row of monthlySpendRows) {
    monthlySpend.set(row.agent, (monthlySpend.get(row.agent) ?? 0) + row.estimatedCost);
  }

  const runawayAgents = Array.from(monthlySpend.entries())
    .map(([agent, spend]) => {
      const budget = budgetMap.get(agent);
      return {
        agent,
        spend,
        budget: budget?.monthlyBudgetUsd ?? 0,
        overBy: budget ? Math.max(0, spend - budget.monthlyBudgetUsd) : 0,
      };
    })
    .filter((entry) => entry.budget > 0 && entry.spend > entry.budget)
    .sort((a, b) => b.overBy - a.overBy);

  const agentRows = Array.from(byAgent.values())
    .map((entry) => ({
      agent: entry.agent,
      cost: Number(entry.cost.toFixed(4)),
      tokens: entry.tokens,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      providers: Array.from(entry.providers),
      models: Array.from(entry.models),
      workflows: Array.from(entry.workflows),
      monthlyBudgetUsd: budgetMap.get(entry.agent)?.monthlyBudgetUsd ?? null,
      monthlySpendUsd: Number((monthlySpend.get(entry.agent) ?? 0).toFixed(4)),
    }))
    .sort((a, b) => b.cost - a.cost);

  return {
    totalCost: Number(totalCost.toFixed(4)),
    totalTokens,
    from: from.toISOString(),
    to: to.toISOString(),
    byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
    agents: agentRows,
    runawayAgents,
  };
}

export async function getBudgets(): Promise<BudgetRow[]> {
  return prisma.budget.findMany({
    orderBy: [{ updatedAt: 'desc' }, { agent: 'asc' }],
    select: {
      id: true,
      agent: true,
      monthlyBudgetUsd: true,
      discordWebhookUrl: true,
      updatedAt: true,
    },
  });
}

export async function activateSubscription(activationCode: string) {
  const sub = await prisma.subscription.findUnique({ where: { activationCode } });
  if (!sub || sub.status !== 'active') {
    return null;
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { activatedAt: new Date() },
  });

  return sub;
}

export async function upsertSubscription(params: {
  lemonOrderId: string;
  customerEmail: string;
  status: string;
  activationCode: string;
}) {
  return prisma.subscription.upsert({
    where: { lemonOrderId: params.lemonOrderId },
    create: params,
    update: {
      customerEmail: params.customerEmail,
      status: params.status,
      activationCode: params.activationCode,
    },
  });
}

export async function getRunawayAlertsWithWebhooks() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [rows, budgets] = await Promise.all([
    prisma.usageRecord.findMany({ where: { date: { gte: monthStart } } }),
    prisma.budget.findMany({ where: { discordWebhookUrl: { not: null } } }),
  ]);

  const spendByAgent = new Map<string, number>();
  for (const row of rows) {
    spendByAgent.set(row.agent, (spendByAgent.get(row.agent) ?? 0) + row.estimatedCost);
  }

  return budgets
    .map((budget) => {
      const spend = spendByAgent.get(budget.agent) ?? 0;
      return {
        agent: budget.agent,
        spend,
        budget: budget.monthlyBudgetUsd,
        discordWebhookUrl: budget.discordWebhookUrl,
      };
    })
    .filter((item) => item.discordWebhookUrl && item.spend > item.budget);
}
