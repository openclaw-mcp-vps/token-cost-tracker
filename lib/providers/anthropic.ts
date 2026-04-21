import Anthropic from "@anthropic-ai/sdk";
import { ProviderConfig, UsageRecord } from "@/lib/types";
import { estimateCostUsd } from "@/lib/providers/pricing";
import { makeUsageId, normalizeNumber, parseArrayPayload } from "@/lib/providers/common";

export async function fetchAnthropicUsage(config: ProviderConfig, start: Date, end: Date): Promise<UsageRecord[]> {
  if (!config.apiKey || !config.enabled) {
    return [];
  }

  const client = new Anthropic({ apiKey: config.apiKey });

  try {
    await client.models.list();
  } catch {
    return [];
  }

  const url = new URL("https://api.anthropic.com/v1/organizations/usage_report/messages");
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  url.searchParams.set("end_date", end.toISOString().slice(0, 10));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const rows = parseArrayPayload(payload);
  const records: UsageRecord[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const raw = row as Record<string, unknown>;
    const model = String(raw.model ?? "claude-unknown");
    const inputTokens = normalizeNumber(raw.input_tokens);
    const outputTokens = normalizeNumber(raw.output_tokens);
    const totalTokens = normalizeNumber(raw.total_tokens) || inputTokens + outputTokens;
    const agentId = String(raw.workspace_id ?? raw.api_key_name ?? raw.user_id ?? "anthropic-unattributed");
    const workflow = String(raw.service_tier ?? raw.request_type ?? "unattributed");
    const timestamp = String(raw.date ?? raw.timestamp ?? new Date().toISOString());
    const maybeCost = normalizeNumber(raw.cost_usd ?? raw.cost);
    const costUsd = maybeCost > 0 ? maybeCost : estimateCostUsd("anthropic", model, inputTokens, outputTokens);

    const base = {
      provider: "anthropic" as const,
      model,
      workflow,
      agentId,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      timestamp,
      source: "provider_api" as const
    };

    records.push({
      ...base,
      id: makeUsageId(base)
    });
  }

  return records;
}
