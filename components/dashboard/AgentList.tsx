"use client";

import { AlertTriangle, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentListProps {
  agents: Array<{ agentId: string; costUsd: number; tokens: number; providers: Record<string, number> }>;
  runawayAgents: Array<{ agentId: string; jumpFactor: number }>;
  budgetBreaches: Array<{ agentId: string; spendUsd: number; budgetUsd: number }>;
}

export function AgentList({ agents, runawayAgents, budgetBreaches }: AgentListProps) {
  const runawaySet = new Map(runawayAgents.map((agent) => [agent.agentId, agent]));
  const breachSet = new Map(budgetBreaches.map((agent) => [agent.agentId, agent]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Cost Leaderboard</CardTitle>
        <CardDescription>
          Rank agents by spend with runaway spikes and monthly budget overages highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agents.length === 0 ? (
            <p className="text-sm text-[var(--muted-text)]">No usage events yet. Connect providers or ingest records via `/api/usage`.</p>
          ) : null}

          {agents.slice(0, 12).map((agent) => {
            const runaway = runawaySet.get(agent.agentId);
            const breach = breachSet.get(agent.agentId);

            return (
              <div
                key={agent.agentId}
                className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[#0f1620] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--text)]">{agent.agentId}</p>
                    {runaway ? (
                      <Badge variant="warning" className="gap-1">
                        <Flame className="h-3 w-3" />
                        {runaway.jumpFactor}x vs baseline
                      </Badge>
                    ) : null}
                    {breach ? (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over budget
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--muted-text)]">
                    {Object.entries(agent.providers)
                      .map(([provider, cost]) => `${provider}: $${cost.toFixed(2)}`)
                      .join(" · ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold">${agent.costUsd.toFixed(2)}</p>
                  <p className="text-xs text-[var(--muted-text)]">{agent.tokens.toLocaleString()} tokens</p>
                  {breach ? (
                    <p className="text-xs text-[#f85149]">
                      ${breach.spendUsd.toFixed(2)} / ${breach.budgetUsd.toFixed(2)} monthly budget
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
