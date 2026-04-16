'use client';

import { useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BudgetItem = {
  id: string;
  agent: string;
  monthlyBudgetUsd: number;
  discordWebhookUrl: string | null;
  updatedAt: string;
};

type Props = {
  knownAgents: string[];
  initialBudgets: BudgetItem[];
};

export function BudgetManager({ knownAgents, initialBudgets }: Props) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [agent, setAgent] = useState(knownAgents[0] ?? '');
  const [monthlyBudget, setMonthlyBudget] = useState('250');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const suggestedAgents = useMemo(
    () => knownAgents.filter((name) => !budgets.some((entry) => entry.agent === name)),
    [budgets, knownAgents],
  );

  async function saveBudget() {
    setSaving(true);
    setStatus('Saving budget rule...');

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agent.trim(),
          monthlyBudgetUsd: Number(monthlyBudget),
          discordWebhookUrl: webhookUrl.trim() || undefined,
        }),
      });

      const body = (await res.json()) as { budget?: BudgetItem; error?: string };
      if (!res.ok || !body.budget) {
        throw new Error(body.error || 'Failed to save budget');
      }

      setBudgets((prev) => {
        const next = prev.filter((entry) => entry.agent !== body.budget!.agent);
        next.unshift(body.budget!);
        return next;
      });

      setStatus(`Saved budget for ${body.budget.agent}. Run a provider sync to evaluate new alert conditions.`);
      setWebhookUrl('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Rules</CardTitle>
        <CardDescription>
          Set a monthly spend limit per agent and optional Discord webhook for runaway alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="budget-agent">Agent</Label>
            <Input
              id="budget-agent"
              list="known-agents"
              placeholder="support-bot-prod"
              value={agent}
              onChange={(event) => setAgent(event.target.value)}
            />
            <datalist id="known-agents">
              {suggestedAgents.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Monthly Budget (USD)</Label>
            <Input
              id="budget-amount"
              type="number"
              min="1"
              step="1"
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-discord">Discord Webhook (optional)</Label>
            <Input
              id="budget-discord"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
          </div>
        </div>

        <Button onClick={saveBudget} disabled={saving || !agent.trim() || Number(monthlyBudget) <= 0}>
          {saving ? 'Saving...' : 'Save Budget Rule'}
        </Button>

        {status ? <p className="rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-300">{status}</p> : null}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Configured Budgets</h3>
          {budgets.length === 0 ? (
            <p className="text-sm text-slate-400">No budget rules yet. Add at least one to activate runaway detection.</p>
          ) : (
            <div className="space-y-2">
              {budgets.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
                  <p className="font-medium text-slate-100">
                    {item.agent} · ${item.monthlyBudgetUsd.toFixed(2)}/month
                  </p>
                  <p className="text-slate-400">
                    {item.discordWebhookUrl ? 'Discord webhook enabled' : 'Discord webhook not set'} · updated{' '}
                    {formatDistanceToNowStrict(new Date(item.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
