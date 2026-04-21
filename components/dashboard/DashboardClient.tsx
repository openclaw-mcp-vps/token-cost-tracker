"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AlertSettings } from "@/components/dashboard/AlertSettings";
import { AgentList } from "@/components/dashboard/AgentList";
import { CostChart } from "@/components/dashboard/CostChart";
import { ProviderSetup } from "@/components/providers/ProviderSetup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UsagePayload {
  summary: {
    totalCostUsd: number;
    totalTokens: number;
    byDay: Array<{ day: string; costUsd: number; tokens: number }>;
    byAgent: Array<{ agentId: string; costUsd: number; tokens: number; providers: Record<string, number> }>;
    byProvider: Array<{ provider: string; costUsd: number; tokens: number }>;
    byModel: Array<{ model: string; costUsd: number; tokens: number }>;
    byWorkflow: Array<{ workflow: string; costUsd: number; tokens: number }>;
  };
  runawayAgents: Array<{ agentId: string; jumpFactor: number }>;
  budgetBreaches: Array<{ agentId: string; spendUsd: number; budgetUsd: number }>;
}

const initialPayload: UsagePayload = {
  summary: {
    totalCostUsd: 0,
    totalTokens: 0,
    byDay: [],
    byAgent: [],
    byProvider: [],
    byModel: [],
    byWorkflow: []
  },
  runawayAgents: [],
  budgetBreaches: []
};

export function DashboardClient() {
  const [payload, setPayload] = useState<UsagePayload>(initialPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsage(sync = true) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usage?sync=${sync ? "1" : "0"}`, { cache: "no-store" });

      if (!response.ok) {
        const errPayload = (await response.json()) as { error?: string };
        throw new Error(errPayload.error ?? "Failed to load usage data");
      }

      const json = (await response.json()) as UsagePayload;
      setPayload(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unknown dashboard error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsage(true);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Cost Tracker</h1>
          <p className="text-sm text-[var(--muted-text)]">
            Per-agent cost visibility across OpenAI, Anthropic, Google, and Moltbook.
          </p>
        </div>

        <Button variant="secondary" onClick={() => void loadUsage(true)} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Spend</CardDescription>
            <CardTitle>${payload.summary.totalCostUsd.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tokens</CardDescription>
            <CardTitle>{payload.summary.totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Agents</CardDescription>
            <CardTitle>{payload.summary.byAgent.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Runaway Flags</CardDescription>
            <CardTitle>{payload.runawayAgents.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[#f85149]">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <CostChart daily={payload.summary.byDay} providerBreakdown={payload.summary.byProvider} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AgentList
          agents={payload.summary.byAgent}
          runawayAgents={payload.runawayAgents}
          budgetBreaches={payload.budgetBreaches}
        />
        <AlertSettings onSave={() => void loadUsage(false)} />
      </div>

      <ProviderSetup onSaved={() => void loadUsage(true)} />

      <Card>
        <CardHeader>
          <CardTitle>Ingest Usage from Your Agents</CardTitle>
          <CardDescription>
            Send explicit per-workflow attribution from your own agent runtime to get clean per-agent reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-[#0d1117] p-3 text-xs text-[#8b949e]">
{`curl -X POST http://localhost:3000/api/usage \\
  -H 'content-type: application/json' \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "workflow": "customer-support-triage",
    "agentId": "support-agent-prod",
    "inputTokens": 1200,
    "outputTokens": 830
  }'`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
