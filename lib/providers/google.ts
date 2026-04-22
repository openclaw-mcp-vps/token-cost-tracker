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

function parseGoogleRows(raw: unknown): UsageEvent[] {
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
    const model = typeof item.model === "string" ? item.model : "gemini-unknown";
    const timestamp =
      (typeof item.timestamp === "string" && item.timestamp) ||
      (typeof item.created_at === "string" && item.created_at) ||
      new Date().toISOString();

    const inputTokens = toNumber(item.input_tokens) || toNumber(item.prompt_tokens);
    const outputTokens = toNumber(item.output_tokens) || toNumber(item.candidate_tokens);
    const totalTokens = toNumber(item.total_tokens) || inputTokens + outputTokens;
    const requests = Math.max(1, toNumber(item.requests) || toNumber(item.request_count) || 1);
    const providerCost = toNumber(item.cost_usd) || toNumber(item.cost);

    const workflow =
      (typeof item.workflow === "string" && item.workflow) ||
      (typeof item.project === "string" && item.project) ||
      "default-workflow";
    const agent =
      (typeof item.agent === "string" && item.agent) ||
      (typeof item.user === "string" && item.user) ||
      "unattributed-agent";

    events.push({
      id: `google-${timestamp}-${model}-${agent}-${workflow}`,
      timestamp,
      provider: "google",
      model,
      workflow,
      agent,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd:
        providerCost > 0
          ? providerCost
          : estimateCostUsd("google", model, inputTokens, outputTokens),
      requests,
      source: "provider_sync",
    });
  }

  return events;
}

export async function fetchGoogleUsage(options: ProviderSyncOptions): Promise<ProviderSyncResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      provider: "google",
      events: [],
      connected: false,
      error: "Missing GOOGLE_API_KEY",
    };
  }

  // Validate API key against the public model list endpoint.
  const modelResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { cache: "no-store" },
  );

  if (!modelResponse.ok) {
    const body = await modelResponse.text();
    return {
      provider: "google",
      events: [],
      connected: false,
      error: `Google API key validation failed (${modelResponse.status}): ${body.slice(0, 200)}`,
    };
  }

  const usageEndpoint = process.env.GOOGLE_USAGE_ENDPOINT;
  if (!usageEndpoint) {
    return {
      provider: "google",
      events: [],
      connected: true,
      error:
        "GOOGLE_USAGE_ENDPOINT is not configured. Key is valid, but usage sync needs a billing export endpoint.",
    };
  }

  const response = await fetch(usageEndpoint, {
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
      provider: "google",
      events: [],
      connected: false,
      error: `Google usage endpoint returned ${response.status}: ${body.slice(0, 240)}`,
    };
  }

  const payload = (await response.json()) as unknown;
  return {
    provider: "google",
    events: parseGoogleRows(payload),
    connected: true,
  };
}
