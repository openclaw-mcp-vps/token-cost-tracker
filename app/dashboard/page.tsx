import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AgentTable } from "@/components/AgentTable";
import { AlertSettings } from "@/components/AlertSettings";
import { CostChart } from "@/components/CostChart";
import { getDailyAgentCosts, getRecentUsage } from "@/lib/database";

function groupByDay(rows: Awaited<ReturnType<typeof getRecentUsage>>) {
  const aggregate = new Map<string, number>();

  for (const row of rows) {
    const key = row.used_at.slice(0, 10);
    aggregate.set(key, (aggregate.get(key) ?? 0) + Number(row.cost_usd));
  }

  return [...aggregate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, costUsd]) => ({ date, costUsd }));
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("paid_access")?.value === "true";

  if (!hasAccess) {
    redirect("/");
  }

  const [dailyRows, usageRows] = await Promise.all([getDailyAgentCosts(30), getRecentUsage(30)]);

  const chartData = groupByDay(usageRows);
  const tableRows = dailyRows.map((row) => ({
    date: row.date,
    agentId: row.agent_id,
    provider: row.provider,
    model: row.model,
    workflow: row.workflow,
    totalTokens: Number(row.total_tokens),
    totalCostUsd: Number(row.total_cost_usd)
  }));

  const totalMonth = usageRows
    .filter((row) => row.used_at.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((sum, row) => sum + Number(row.cost_usd), 0);

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Token Cost Tracker Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-100">Per-Agent Spend Visibility</h1>
            <p className="mt-2 text-sm text-slate-400">30-day monthly spend: ${totalMonth.toFixed(2)}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200">
              Back to landing
            </Link>
            <form action="/api/access" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="rounded-lg border border-rose-700 px-4 py-2 text-sm text-rose-200">Log out</button>
            </form>
          </div>
        </header>

        <CostChart data={chartData} />
        <AgentTable rows={tableRows} />
        <AlertSettings />
      </div>
    </main>
  );
}
