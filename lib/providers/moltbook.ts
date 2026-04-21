import { ProviderConfig, UsageRecord } from "@/lib/types";
import { estimateCostUsd } from "@/lib/providers/pricing";
import { makeUsageId, normalizeNumber, parseArrayPayload } from "@/lib/providers/common";

function buildMoltbookUrl(config: ProviderConfig, start: Date, end: Date): string {
  const base = config.baseUrl?.trim() || "https://api.moltbook.com/v1";
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/usage`;
  url.searchParams.set("start", start.toISOString());
  url.searchParams.set("end", end.toISOString());
  return url.toString();
}

export async function fetchMoltbookUsage(config: ProviderConfig, start: Date, end: Date): Promise<UsageRecord[]> {
  if (!config.apiKey || !config.enabled) {
    return [];
  }

  const response = await fetch(buildMoltbookUrl(config, start, end), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`
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
    const model = String(raw.model ?? "moltbook-model");
    const inputTokens = normalizeNumber(raw.input_tokens);
    const outputTokens = normalizeNumber(raw.output_tokens);
    const totalTokens = normalizeNumber(raw.total_tokens) || inputTokens + outputTokens;
    const agentId = String(raw.agent_id ?? raw.workflow_id ?? "moltbook-unattributed");
    const workflow = String(raw.workflow ?? raw.pipeline ?? "unattributed");
    const timestamp = String(raw.timestamp ?? new Date().toISOString());
    const maybeCost = normalizeNumber(raw.cost_usd ?? raw.cost);
    const costUsd = maybeCost > 0 ? maybeCost : estimateCostUsd("moltbook", model, inputTokens, outputTokens);

    const base = {
      provider: "moltbook" as const,
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
