import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { endOfMonth, format } from 'date-fns';

import { AgentTable } from '@/components/AgentTable';
import { BudgetManager } from '@/components/BudgetManager';
import { BudgetAlerts } from '@/components/BudgetAlerts';
import { CostChart } from '@/components/CostChart';
import { SyncProviders } from '@/components/SyncProviders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBudgets, getDashboardSnapshot } from '@/lib/database';
import { getPaywallCookieName, verifyPaywallValue } from '@/lib/paywall';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(getPaywallCookieName())?.value;

  if (!verifyPaywallValue(accessCookie)) {
    redirect('/?paywall=required');
  }

  const [snapshot, budgets] = await Promise.all([getDashboardSnapshot(30), getBudgets()]);
  const monthEnd = endOfMonth(new Date());

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-white">Usage Dashboard</h1>
          <p className="text-sm text-slate-400">
            Last 30 days, with monthly budget monitoring through {format(monthEnd, 'MMM d, yyyy')}.
          </p>
        </div>
        <SyncProviders />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Cost (30d)</CardDescription>
            <CardTitle className="text-3xl">${snapshot.totalCost.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Tokens (30d)</CardDescription>
            <CardTitle className="text-3xl">{snapshot.totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Agents Tracked</CardDescription>
            <CardTitle className="text-3xl">{snapshot.agents.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daily Cost Trend</CardTitle>
          <CardDescription>Per-day cost burn across all providers and workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <CostChart data={snapshot.byDay} />
        </CardContent>
      </Card>

      <BudgetAlerts agents={snapshot.runawayAgents} />

      <BudgetManager
        knownAgents={snapshot.agents.map((row) => row.agent)}
        initialBudgets={budgets.map((item) => ({
          id: item.id,
          agent: item.agent,
          monthlyBudgetUsd: item.monthlyBudgetUsd,
          discordWebhookUrl: item.discordWebhookUrl,
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Per-Agent Spend</CardTitle>
          <CardDescription>Cost, token usage, models, providers, and workflow breadth.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentTable rows={snapshot.agents} />
        </CardContent>
      </Card>
    </main>
  );
}
