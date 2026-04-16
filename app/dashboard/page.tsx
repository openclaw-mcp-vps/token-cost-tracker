import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ApiKeyForm } from "@/components/providers/ApiKeyForm";
import { BudgetAlerts } from "@/components/dashboard/BudgetAlerts";
import { CostChart } from "@/components/dashboard/CostChart";
import { AgentTable } from "@/components/dashboard/AgentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYWALL_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth";
import { asCurrency } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/usage";

export default async function DashboardPage() {
  const jar = await cookies();
  const raw = jar.get(PAYWALL_COOKIE_NAME)?.value;
  if (!verifyAccessCookieValue(raw).valid) {
    redirect("/");
  }

  const metrics = await getDashboardMetrics();

  return (
    <main className="container-shell py-8 md:py-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Token Cost Dashboard</h1>
          <p className="text-muted mt-1">Per-agent usage and cost attribution across all connected providers.</p>
        </div>
        <div className="text-sm text-muted">Current month total: <span className="text-[var(--text)] font-semibold">{asCurrency(metrics.monthlyTotal)}</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(metrics.providerTotals).map(([provider, total]) => (
          <Card key={provider}>
            <CardHeader>
              <CardTitle className="capitalize text-base">{provider}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{asCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ApiKeyForm />
      <CostChart data={metrics.dailyCosts} />
      <BudgetAlerts rows={metrics.agentRows} />
      <AgentTable rows={metrics.agentRows} />
    </main>
  );
}
