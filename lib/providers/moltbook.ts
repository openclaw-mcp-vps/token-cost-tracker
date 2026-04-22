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

function parseMoltbookEvents(raw: unknown): UsageEvent[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const payload = raw as Record<string, unknown>;
  const rows = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.events)
      ? payload.events
      : [];

  const events: UsageEvent[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const item = row as Record<string, unknown>;
    const timestamp =
      (typeof item.timestamp === "string" && item.timestamp) ||
      (typeof item.created_at === "string" && item.created_at) ||
      new Date().toISOString();

    const model = typeof item.model === "string" ? item.model : "moltbook-default";
    const workflow = typeof item.workflow === "string" ? item.workflow : "default-workflow";
    const agent = typeof item.agent === "string" ? item.agent : "unattributed-agent";

    const inputTokens = toNumber(item.input_tokens) || toNumber(item.prompt_tokens);
    const outputTokens = toNumber(item.output_tokens) || toNumber(item.completion_tokens);
    const totalTokens = toNumber(item.total_tokens) || inputTokens + outputTokens;
    const requests = Math.max(1, toNumber(item.requests) || toNumber(item.request_count) || 1);
    const explicitCost = toNumber(item.cost_usd) || toNumber(item.cost);

    events.push({
      id: `moltbook-${timestamp}-${model}-${agent}-${workflow}`,
      timestamp,
      provider: "moltbook",
      model,
      workflow,
      agent,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd:
        explicitCost > 0
          ? explicitCost
          : estimateCostUsd("moltbook", model, inputTokens, outputTokens),
      requests,
      source: "provider_sync",
    });
  }

  return events;
}

export async function fetchMoltbookUsage(options: ProviderSyncOptions): Promise<ProviderSyncResult> {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    return {
      provider: "moltbook",
      events: [],
      connected: false,
      error: "Missing MOLTBOOK_API_KEY",
    };
  }

  const baseUrl = (process.env.MOLTBOOK_BASE_URL ?? "https://api.moltbook.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/v1/usage/events`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      start_time: options.start.toISOString(),
      end_time: options.end.toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      provider: "moltbook",
      events: [],
      connected: false,
      error: `Moltbook usage API returned ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as unknown;

  return {
    provider: "moltbook",
    events: parseMoltbookEvents(payload),
    connected: true,
  };
}
