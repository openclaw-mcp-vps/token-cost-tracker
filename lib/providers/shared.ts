import { subDays, formatISO } from "date-fns";
import type { Provider, UsageRecord } from "@/lib/database/schema";

const AGENTS = ["support-agent", "sales-outreach-agent", "mcp-doc-agent", "qa-regression-agent"];
const WORKFLOWS = ["ticket-triage", "lead-research", "doc-summarization", "deployment-watch"];

export function synthesizeUsage(provider: Provider, model: string): Omit<UsageRecord, "id">[] {
  const yesterday = subDays(new Date(), 1);
  return AGENTS.map((agent, i) => {
    const inputTokens = 18000 + i * 5300;
    const outputTokens = 6400 + i * 1700;
    const totalCostUsd = Number(((inputTokens + outputTokens) / 1_000_000 * (0.8 + i * 0.4)).toFixed(4));
    return {
      provider,
      model,
      workflow: WORKFLOWS[i % WORKFLOWS.length],
      agentName: agent,
      inputTokens,
      outputTokens,
      cachedTokens: Math.round(inputTokens * 0.18),
      totalCostUsd,
      capturedAt: formatISO(yesterday),
    };
  });
}
