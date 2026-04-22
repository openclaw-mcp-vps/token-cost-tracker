import { fetchAnthropicUsage } from "@/lib/providers/anthropic";
import { fetchGoogleUsage } from "@/lib/providers/google";
import { fetchMoltbookUsage } from "@/lib/providers/moltbook";
import { fetchOpenAIUsage } from "@/lib/providers/openai";
import type { ProviderSyncResult } from "@/lib/types";

export async function syncAllProviders(start: Date, end: Date): Promise<ProviderSyncResult[]> {
  return Promise.all([
    fetchOpenAIUsage({ start, end }),
    fetchAnthropicUsage({ start, end }),
    fetchGoogleUsage({ start, end }),
    fetchMoltbookUsage({ start, end }),
  ]);
}
