import { Badge } from "@/components/ui/badge";
import { asCurrency } from "@/lib/format";
import type { AgentRollup } from "@/lib/usage";

interface AgentTableProps {
  rows: AgentRollup[];
}

export function AgentTable({ rows }: AgentTableProps) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold">Per-Agent Cost Attribution</h3>
        <p className="text-sm text-muted mt-1">Provider, model, and workflow-level breakdown for each agent.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-[var(--border)]">
              <th className="p-3">Agent</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Model</th>
              <th className="p-3">Workflow</th>
              <th className="p-3">Input</th>
              <th className="p-3">Output</th>
              <th className="p-3">Month Cost</th>
              <th className="p-3">Budget</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.agentName}-${row.provider}-${row.workflow}-${row.model}`} className="border-b border-[var(--border)]/60">
                <td className="p-3 font-medium">{row.agentName}</td>
                <td className="p-3">{row.provider}</td>
                <td className="p-3">{row.model}</td>
                <td className="p-3">{row.workflow}</td>
                <td className="p-3">{row.inputTokens.toLocaleString()}</td>
                <td className="p-3">{row.outputTokens.toLocaleString()}</td>
                <td className="p-3 font-medium">{asCurrency(row.totalCostUsd)}</td>
                <td className="p-3">
                  <Badge variant={row.overBudget ? "danger" : row.budgetUsedPct > 80 ? "warning" : "default"}>
                    {Math.round(row.budgetUsedPct)}% of {asCurrency(row.monthlyBudgetUsd)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
