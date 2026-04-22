"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Coins, Cpu, RefreshCcw } from "lucide-react";

import { AgentTable } from "@/components/dashboard/AgentTable";
import { AlertSettings } from "@/components/dashboard/AlertSettings";
import { CostChart } from "@/components/dashboard/CostChart";
import { ProviderSetup } from "@/components/providers/ProviderSetup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, toCurrency } from "@/lib/utils";

interface UsageResponse {
  summary: {
    totals: {
      costUsd: number;
      totalTokens: number;
      requests: number;
    };
    daily: Array<{ date: string; costUsd: number; totalTokens: number; requests: number }>;
    providers: Array<{ provider: string; costUsd: number; totalTokens: number; requests: number }>;
    agents: Array<{
      agent: string;
      workflow: string;
      provider: string;
      model: string;
      costUsd: number;
      totalTokens: number;
      requests: number;
    }>;
  };
  yesterday: {
    date: string;
    costUsd: number;
    totalTokens: number;
  };
}

interface AlertsResponse {
  settings: {
    monthlyAgentBudgetUsd: number;
    monthlyWorkspaceBudgetUsd: number;
    discordWebhookUrl: string | null;
  };
  monthlySpendUsd: number;
  activeViolations: number;
}

interface ProvidersResponse {
  providers: Array<{
    provider: string;
    configured: boolean;
    connected: boolean;
    lastSyncAt: string | null;
    lastError: string | null;
  }>;
}

export function DashboardClient(): React.JSX.Element {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (syncProviders = false) => {
    setError(null);
    if (!usage) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const query = syncProviders ? "?sync=1" : "";
      const [usageRes, alertsRes, providersRes] = await Promise.all([
        fetch(`/api/usage${query}`, { cache: "no-store" }),
        fetch("/api/alerts", { cache: "no-store" }),
        fetch("/api/providers", { cache: "no-store" }),
      ]);

      if (!usageRes.ok || !alertsRes.ok || !providersRes.ok) {
        throw new Error("Failed to load one or more dashboard resources.");
      }

      const [usagePayload, alertsPayload, providersPayload] = (await Promise.all([
        usageRes.json(),
        alertsRes.json(),
        providersRes.json(),
      ])) as [UsageResponse, AlertsResponse, ProvidersResponse];

      setUsage(usagePayload);
      setAlerts(alertsPayload);
      setProviders(providersPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usage]);

  useEffect(() => {
    void load(true);
  }, [load]);

  const headlineCards = useMemo(() => {
    if (!usage || !alerts) {
      return [];
    }

    return [
      {
        label: "Yesterday",
        value: toCurrency(usage.yesterday.costUsd),
        sub: `${formatInt(usage.yesterday.totalTokens)} tokens`,
        icon: Coins,
      },
      {
        label: "30-Day Spend",
        value: toCurrency(usage.summary.totals.costUsd),
        sub: `${formatInt(usage.summary.totals.requests)} requests`,
        icon: Cpu,
      },
      {
        label: "Monthly Budget Health",
        value: toCurrency(alerts.monthlySpendUsd),
        sub: `${alerts.activeViolations} active violations`,
        icon: Bell,
      },
    ];
  }, [usage, alerts]);

  if (loading) {
    return <p className="text-slate-300">Loading dashboard data...</p>;
  }

  if (!usage || !alerts || !providers) {
    return (
      <div className="space-y-3">
        <p className="text-red-300">Unable to load dashboard data.</p>
        <Button onClick={() => void load(true)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Token Cost Tracker Dashboard</h1>
          <p className="text-sm text-slate-400">
            Live per-agent spend visibility across OpenAI, Anthropic, Google, and Moltbook.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {error ? <Badge variant="danger">{error}</Badge> : null}
          <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {headlineCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                    <p className="text-xs text-slate-400">{card.sub}</p>
                  </div>
                  <Icon className="h-5 w-5 text-orange-300" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProviderSetup providers={providers.providers} onSyncCompleted={() => load(false)} />

      <CostChart daily={usage.summary.daily} providers={usage.summary.providers} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AgentTable rows={usage.summary.agents} budgetLimitUsd={alerts.settings.monthlyAgentBudgetUsd} />
        </div>
        <div className="lg:col-span-2">
          <AlertSettings
            settings={alerts.settings}
            monthlySpendUsd={alerts.monthlySpendUsd}
            violationCount={alerts.activeViolations}
            onSaved={() => load(false)}
          />
        </div>
      </div>
    </div>
  );
}
