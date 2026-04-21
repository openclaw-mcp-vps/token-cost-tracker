import { ProviderConfig, ProviderId, UsageRecord } from "@/lib/types";
import { fetchOpenAIUsage } from "@/lib/providers/openai";
import { fetchAnthropicUsage } from "@/lib/providers/anthropic";
import { fetchGoogleUsage } from "@/lib/providers/google";
import { fetchMoltbookUsage } from "@/lib/providers/moltbook";

export async function pullProviderUsage(provider: ProviderId, config: ProviderConfig, start: Date, end: Date): Promise<UsageRecord[]> {
  switch (provider) {
    case "openai":
      return fetchOpenAIUsage(config, start, end);
    case "anthropic":
      return fetchAnthropicUsage(config, start, end);
    case "google":
      return fetchGoogleUsage(config, start, end);
    case "moltbook":
      return fetchMoltbookUsage(config, start, end);
    default:
      return [];
  }
}
