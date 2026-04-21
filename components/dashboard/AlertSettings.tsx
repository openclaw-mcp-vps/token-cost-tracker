"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AlertSettingsProps {
  onSave?: () => void;
}

export function AlertSettings({ onSave }: AlertSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(300);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/alerts", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        settings: { enabled: boolean; monthlyBudgetUsd: number; hasDiscordWebhook: boolean };
      };

      setEnabled(payload.settings.enabled);
      setMonthlyBudgetUsd(payload.settings.monthlyBudgetUsd);
      if (!payload.settings.hasDiscordWebhook) {
        setDiscordWebhookUrl("");
      }
    }

    void load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled,
          monthlyBudgetUsd,
          discordWebhookUrl
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? "Unable to save alert settings.");
      } else {
        setStatus("Alert settings updated. Discord notifications will trigger on new budget breaches.");
        onSave?.();
      }
    } catch {
      setStatus("Network error while saving alert settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#58a6ff]" />
          Budget Alerts
        </CardTitle>
        <CardDescription>
          Trigger Discord alerts when any single agent exceeds a monthly spend ceiling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border border-[var(--border)] bg-[#0d1117]"
            />
            Enable Discord budget alerts
          </label>

          <div className="space-y-1">
            <Label htmlFor="budget">Monthly budget per agent (USD)</Label>
            <Input
              id="budget"
              type="number"
              min={1}
              step={1}
              value={monthlyBudgetUsd}
              onChange={(event) => setMonthlyBudgetUsd(Number(event.target.value))}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="discord">Discord Webhook URL</Label>
            <Input
              id="discord"
              type="url"
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Alert Settings"}
          </Button>

          {status ? <p className="text-sm text-[var(--muted-text)]">{status}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
