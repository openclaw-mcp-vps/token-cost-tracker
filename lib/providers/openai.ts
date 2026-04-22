import { estimateCostUsd } from "@/lib/pricing";
import type { ProviderSyncOptions, ProviderSyncResult, UsageEvent } from "@/lib/types";

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseOpenAIResponse(raw: unknown): UsageEvent[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const payload = raw as Record<string, unknown>;
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const events: UsageEvent[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const item = row as Record<string, unknown>;
    const model = typeof item.model === "string" ? item.model : "unknown-model";
    const timestampUnix = asNumber(item.aggregation_timestamp) || asNumber(item.timestamp);
    const timestamp = timestampUnix > 0 ? new Date(timestampUnix * 1000).toISOString() : new Date().toISOString();

    const inputTokens = asNumber(item.input_tokens) || asNumber(item.n_context_tokens_total);
    const outputTokens = asNumber(item.output_tokens) || asNumber(item.n_generated_tokens_total);
    const totalTokens = asNumber(item.total_tokens) || inputTokens + outputTokens;
    const requests = Math.max(1, asNumber(item.num_model_requests) || asNumber(item.n_requests) || 1);

    const rawCost = asNumber(item.cost_usd) || asNumber(item.cost);
    const costUsd = rawCost > 0 ? rawCost : estimateCostUsd("openai", model, inputTokens, outputTokens);

    const workflow =
      (typeof item.project_id === "string" && item.project_id) ||
      (typeof item.project_name === "string" && item.project_name) ||
      "default-workflow";

    const agent =
      (typeof item.api_key_name === "string" && item.api_key_name) ||
      (typeof item.user_id === "string" && item.user_id) ||
      "unattributed-agent";

    events.push({
      id: `openai-${timestampUnix || Date.now()}-${model}-${agent}-${workflow}`,
      timestamp,
      provider: "openai",
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

export async function fetchOpenAIUsage(options: ProviderSyncOptions): Promise<ProviderSyncResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      provider: "openai",
      events: [],
      connected: false,
      error: "Missing OPENAI_API_KEY",
    };
  }

  const startUnix = Math.floor(options.start.getTime() / 1000);
  const endUnix = Math.floor(options.end.getTime() / 1000);

  const response = await fetch(
    `https://api.openai.com/v1/organization/usage/completions?start_time=${startUnix}&end_time=${endUnix}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENAI_ORG_ID ? { "OpenAI-Organization": process.env.OPENAI_ORG_ID } : {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    return {
      provider: "openai",
      events: [],
      connected: false,
      error: `OpenAI usage API returned ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as unknown;

  return {
    provider: "openai",
    events: parseOpenAIResponse(payload),
    connected: true,
  };
}
