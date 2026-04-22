"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toCurrency } from "@/lib/utils";

interface AlertSettingsState {
  monthlyAgentBudgetUsd: number;
  monthlyWorkspaceBudgetUsd: number;
  discordWebhookUrl: string | null;
}

interface AlertsPanelProps {
  settings: AlertSettingsState;
  monthlySpendUsd: number;
  violationCount: number;
  onSaved: () => Promise<void>;
}

export function AlertSettings({
  settings,
  monthlySpendUsd,
  violationCount,
  onSaved,
}: AlertsPanelProps): React.JSX.Element {
  const [agentBudget, setAgentBudget] = useState(String(settings.monthlyAgentBudgetUsd));
  const [workspaceBudget, setWorkspaceBudget] = useState(String(settings.monthlyWorkspaceBudgetUsd));
  const [webhookUrl, setWebhookUrl] = useState(settings.discordWebhookUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const healthTone = useMemo(() => {
    if (violationCount > 0) {
      return "text-red-300";
    }
    if (monthlySpendUsd > settings.monthlyWorkspaceBudgetUsd * 0.8) {
      return "text-orange-300";
    }
    return "text-emerald-300";
  }, [monthlySpendUsd, settings.monthlyWorkspaceBudgetUsd, violationCount]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          monthlyAgentBudgetUsd: Number(agentBudget),
          monthlyWorkspaceBudgetUsd: Number(workspaceBudget),
          discordWebhookUrl: webhookUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save alert settings");
      }

      setMessage("Alert settings updated and budget checks re-evaluated.");
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Alert Controls</CardTitle>
        <CardDescription>
          Set hard spend limits and route runaway warnings straight to Discord.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agentBudget">Monthly Agent Budget (USD)</Label>
            <Input
              id="agentBudget"
              type="number"
              min={1}
              value={agentBudget}
              onChange={(event) => setAgentBudget(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspaceBudget">Monthly Workspace Budget (USD)</Label>
            <Input
              id="workspaceBudget"
              type="number"
              min={1}
              value={workspaceBudget}
              onChange={(event) => setWorkspaceBudget(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
          <Input
            id="discordWebhook"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
          />
        </div>

        <div className={`rounded-md border border-slate-700 bg-[#0f1826] p-3 text-sm ${healthTone}`}>
          Current month spend: <span className="font-semibold">{toCurrency(monthlySpendUsd)}</span>
          {violationCount > 0 ? ` · ${violationCount} active violations` : " · no active violations"}
        </div>

        {message ? <p className="text-sm text-slate-300">{message}</p> : null}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Alert Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
