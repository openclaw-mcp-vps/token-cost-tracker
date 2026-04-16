import { AlertTriangle } from "lucide-react";
import type { AgentRollup } from "@/lib/usage";
import { asCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface BudgetAlertsProps {
  rows: AgentRollup[];
}

export function BudgetAlerts({ rows }: BudgetAlertsProps) {
  const flagged = rows.filter((row) => row.overBudget || row.budgetUsedPct >= 80);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Budget Alerts</h3>
          <p className="text-sm text-muted">Agents crossing 80% monthly budget or running over cap.</p>
        </div>
        <form action="/api/alerts/discord" method="POST">
          <Button size="sm" variant="outline" type="submit">
            Send Discord Summary
          </Button>
        </form>
      </div>
      <div className="mt-4 space-y-3">
        {flagged.length === 0 ? (
          <div className="rounded-md border border-[var(--border)] p-3 text-sm text-muted">
            All agents are under 80% of budget this month.
          </div>
        ) : (
          flagged.map((row) => (
            <div key={`${row.agentName}-${row.provider}-${row.workflow}-${row.model}`} className="rounded-md border border-[#da3633]/50 bg-[#da3633]/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#ffaba8]">
                <AlertTriangle className="h-4 w-4" />
                {row.agentName} ({row.workflow}) is at {Math.round(row.budgetUsedPct)}%
              </div>
              <p className="mt-1 text-xs text-[#ffaba8]/90">
                Spent {asCurrency(row.totalCostUsd)} on {row.model}; budget is {asCurrency(row.monthlyBudgetUsd)}.
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
