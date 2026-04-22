import { estimateCostUsd } from "@/lib/pricing";
import type { ProviderSyncOptions, ProviderSyncResult, UsageEvent } from "@/lib/types";

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseAnthropicUsage(raw: unknown): UsageEvent[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const payload = raw as Record<string, unknown>;
  const rows = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.results)
      ? payload.results
      : [];

  const events: UsageEvent[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const item = row as Record<string, unknown>;
    const model = typeof item.model === "string" ? item.model : "claude-unknown";
    const timestampRaw =
      (typeof item.timestamp === "string" && item.timestamp) ||
      (typeof item.created_at === "string" && item.created_at) ||
      new Date().toISOString();

    const inputTokens = toNumber(item.input_tokens) || toNumber(item.prompt_tokens);
    const outputTokens = toNumber(item.output_tokens) || toNumber(item.completion_tokens);
    const totalTokens = toNumber(item.total_tokens) || inputTokens + outputTokens;
    const requests = Math.max(1, toNumber(item.requests) || toNumber(item.request_count) || 1);

    const costFromProvider = toNumber(item.cost_usd) || toNumber(item.cost);
    const costUsd =
      costFromProvider > 0
        ? costFromProvider
        : estimateCostUsd("anthropic", model, inputTokens, outputTokens);

    const workflow =
      (typeof item.workspace === "string" && item.workspace) ||
      (typeof item.workflow === "string" && item.workflow) ||
      "default-workflow";

    const agent =
      (typeof item.agent === "string" && item.agent) ||
      (typeof item.user === "string" && item.user) ||
      "unattributed-agent";

    events.push({
      id: `anthropic-${timestampRaw}-${model}-${agent}-${workflow}`,
      timestamp: timestampRaw,
      provider: "anthropic",
      model,
      workflow,
      agent,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      requests,
      source: "provider_sync",
    });
  }

  return events;
}

export async function fetchAnthropicUsage(options: ProviderSyncOptions): Promise<ProviderSyncResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      provider: "anthropic",
      events: [],
      connected: false,
      error: "Missing ANTHROPIC_API_KEY",
    };
  }

  const baseUrl = process.env.ANTHROPIC_USAGE_URL ?? "https://api.anthropic.com/v1/organizations/usage_report/messages";
  const startDate = options.start.toISOString().slice(0, 10);
  const endDate = options.end.toISOString().slice(0, 10);

  const response = await fetch(`${baseUrl}?start_date=${startDate}&end_date=${endDate}`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      provider: "anthropic",
      events: [],
      connected: false,
      error: `Anthropic usage API returned ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as unknown;
  return {
    provider: "anthropic",
    events: parseAnthropicUsage(payload),
    connected: true,
  };
}
