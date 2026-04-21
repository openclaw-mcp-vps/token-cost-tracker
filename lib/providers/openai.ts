import OpenAI from "openai";
import { ProviderConfig, UsageRecord } from "@/lib/types";
import { estimateCostUsd } from "@/lib/providers/pricing";
import { makeUsageId, normalizeNumber } from "@/lib/providers/common";

interface OpenAIUsageBucket {
  start_time?: number;
  end_time?: number;
  results?: Array<Record<string, unknown>>;
}

export async function fetchOpenAIUsage(config: ProviderConfig, start: Date, end: Date): Promise<UsageRecord[]> {
  if (!config.apiKey || !config.enabled) {
    return [];
  }

  const client = new OpenAI({ apiKey: config.apiKey, organization: config.organizationId });

  try {
    await client.models.list();
  } catch {
    return [];
  }

  const url = new URL("https://api.openai.com/v1/organization/usage/completions");
  url.searchParams.set("start_time", String(Math.floor(start.getTime() / 1000)));
  url.searchParams.set("end_time", String(Math.floor(end.getTime() / 1000)));
  url.searchParams.set("bucket_width", "1d");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.organizationId ? { "OpenAI-Organization": config.organizationId } : {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: OpenAIUsageBucket[] };
  const records: UsageRecord[] = [];

  for (const bucket of payload.data ?? []) {
    const bucketTimestamp = new Date((bucket.start_time ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();

    for (const result of bucket.results ?? []) {
      const model = String(result.model ?? "openai-unknown");
      const inputTokens = normalizeNumber(result.input_tokens ?? result.n_context_tokens_total);
      const outputTokens = normalizeNumber(result.output_tokens ?? result.n_generated_tokens_total);
      const totalTokens = normalizeNumber(result.total_tokens) || inputTokens + outputTokens;
      const agentId = String(result.project_id ?? result.api_key_id ?? result.user_id ?? "openai-unattributed");
      const workflow = String(result.operation ?? result.endpoint ?? "unattributed");
      const maybeCost = normalizeNumber(result.cost_usd);
      const costUsd = maybeCost > 0 ? maybeCost : estimateCostUsd("openai", model, inputTokens, outputTokens);

      const base = {
        provider: "openai" as const,
        model,
        workflow,
        agentId,
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd,
        timestamp: bucketTimestamp,
        source: "provider_api" as const
      };

      records.push({
        ...base,
        id: makeUsageId(base)
      });
    }
  }

  return records;
}
