import { getCurrentMonthRange, summarizeUsage } from "@/lib/analytics";
import { sendDiscordAlert } from "@/lib/discord";
import type { AlertSettings, UsageEvent } from "@/lib/types";

export interface BudgetViolation {
  key: string;
  title: string;
  body: string;
  fields: Array<{ name: string; value: string }>;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function detectBudgetViolations(
  events: UsageEvent[],
  settings: AlertSettings,
): BudgetViolation[] {
  const { start, end, monthKey } = getCurrentMonthRange();
  const thisMonthEvents = events.filter((event) => {
    const ts = new Date(event.timestamp).getTime();
    return ts >= start.getTime() && ts <= end.getTime();
  });

  const summary = summarizeUsage(thisMonthEvents);
  const violations: BudgetViolation[] = [];

  if (summary.totals.costUsd > settings.monthlyWorkspaceBudgetUsd) {
    violations.push({
      key: `${monthKey}:workspace:${settings.monthlyWorkspaceBudgetUsd}`,
      title: "Workspace Budget Exceeded",
      body: `Workspace spend is ${formatUsd(summary.totals.costUsd)} this month, above the cap of ${formatUsd(settings.monthlyWorkspaceBudgetUsd)}.`,
      fields: [
        { name: "Current Spend", value: formatUsd(summary.totals.costUsd) },
        { name: "Budget", value: formatUsd(settings.monthlyWorkspaceBudgetUsd) },
        { name: "Requests", value: String(summary.totals.requests) },
      ],
    });
  }

  const perAgent = new Map<string, number>();

  for (const row of summary.agents) {
    perAgent.set(row.agent, (perAgent.get(row.agent) ?? 0) + row.costUsd);
  }

  for (const [agent, costUsd] of perAgent.entries()) {
    if (costUsd > settings.monthlyAgentBudgetUsd) {
      violations.push({
        key: `${monthKey}:agent:${agent}:${settings.monthlyAgentBudgetUsd}`,
        title: "Agent Budget Exceeded",
        body: `${agent} reached ${formatUsd(costUsd)} this month, above the per-agent cap of ${formatUsd(settings.monthlyAgentBudgetUsd)}.`,
        fields: [
          { name: "Agent", value: agent },
          { name: "Current Spend", value: formatUsd(costUsd) },
          { name: "Budget", value: formatUsd(settings.monthlyAgentBudgetUsd) },
        ],
      });
    }
  }

  return violations;
}

export async function sendBudgetViolationToDiscord(
  violation: BudgetViolation,
  webhookUrl: string | null,
): Promise<{ success: boolean; error?: string }> {
  return sendDiscordAlert(
    {
      title: violation.title,
      body: violation.body,
      fields: violation.fields,
    },
    webhookUrl,
  );
}
