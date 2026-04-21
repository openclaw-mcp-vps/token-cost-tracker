import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProviderConfig, UsageRecord } from "@/lib/types";
import { estimateCostUsd } from "@/lib/providers/pricing";
import { makeUsageId, normalizeNumber, parseArrayPayload } from "@/lib/providers/common";

function buildGoogleUsageUrl(config: ProviderConfig, start: Date, end: Date): string {
  if (config.baseUrl) {
    const custom = new URL(config.baseUrl);
    custom.pathname = `${custom.pathname.replace(/\/$/, "")}/usage`;
    custom.searchParams.set("start", start.toISOString());
    custom.searchParams.set("end", end.toISOString());
    return custom.toString();
  }

  const defaultUrl = new URL("https://generativelanguage.googleapis.com/v1beta/usage");
  defaultUrl.searchParams.set("startTime", start.toISOString());
  defaultUrl.searchParams.set("endTime", end.toISOString());
  return defaultUrl.toString();
}

export async function fetchGoogleUsage(config: ProviderConfig, start: Date, end: Date): Promise<UsageRecord[]> {
  if (!config.apiKey || !config.enabled) {
    return [];
  }

  const genAI = new GoogleGenerativeAI(config.apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.countTokens("health check for token-cost-tracker");
  } catch {
    return [];
  }

  const response = await fetch(buildGoogleUsageUrl(config, start, end), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "x-goog-api-key": config.apiKey
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
    const model = String(raw.model ?? "gemini-unknown");
    const inputTokens = normalizeNumber(raw.input_tokens ?? raw.prompt_tokens);
    const outputTokens = normalizeNumber(raw.output_tokens ?? raw.completion_tokens);
    const totalTokens = normalizeNumber(raw.total_tokens) || inputTokens + outputTokens;
    const agentId = String(raw.agent_id ?? raw.project_id ?? raw.client_id ?? "google-unattributed");
    const workflow = String(raw.workflow ?? raw.use_case ?? "unattributed");
    const timestamp = String(raw.timestamp ?? raw.date ?? new Date().toISOString());
    const maybeCost = normalizeNumber(raw.cost_usd ?? raw.cost);
    const costUsd = maybeCost > 0 ? maybeCost : estimateCostUsd("google", model, inputTokens, outputTokens);

    const base = {
      provider: "google" as const,
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
