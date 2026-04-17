import Anthropic from "@anthropic-ai/sdk";
import { ModelServiceClient } from "@google-ai/generativelanguage";
import OpenAI from "openai";
import { z } from "zod";

const usageSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "moltbook"]),
  model: z.string().min(1),
  agentId: z.string().min(1),
  workflow: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  usedAt: z.string().datetime().optional()
});

export type NormalizedUsageEvent = z.infer<typeof usageSchema>;

export function parseUsageEvent(payload: unknown) {
  return usageSchema.parse(payload);
}

export async function fetchOpenAIUsageSnapshot() {
  if (!process.env.OPENAI_API_KEY) {
    return { connected: false, records: [] as NormalizedUsageEvent[] };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    await client.models.list();
    return { connected: true, records: [] as NormalizedUsageEvent[] };
  } catch (error) {
    return { connected: false, records: [] as NormalizedUsageEvent[], error: error instanceof Error ? error.message : "OpenAI request failed" };
  }
}

export async function fetchAnthropicUsageSnapshot() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { connected: false, records: [] as NormalizedUsageEvent[] };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    await client.models.list();
    return { connected: true, records: [] as NormalizedUsageEvent[] };
  } catch (error) {
    return {
      connected: false,
      records: [] as NormalizedUsageEvent[],
      error: error instanceof Error ? error.message : "Anthropic request failed"
    };
  }
}

export async function fetchGoogleUsageSnapshot() {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return { connected: false, records: [] as NormalizedUsageEvent[] };
  }

  const client = new ModelServiceClient({
    apiKey: process.env.GOOGLE_AI_API_KEY
  });

  try {
    await client.listModels({});
    return { connected: true, records: [] as NormalizedUsageEvent[] };
  } catch (error) {
    return {
      connected: false,
      records: [] as NormalizedUsageEvent[],
      error: error instanceof Error ? error.message : "Google request failed"
    };
  }
}

export async function fetchMoltbookUsageSnapshot() {
  const baseUrl = process.env.MOLTBOOK_BASE_URL;
  const apiKey = process.env.MOLTBOOK_API_KEY;

  if (!baseUrl || !apiKey) {
    return { connected: false, records: [] as NormalizedUsageEvent[] };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/usage`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        connected: false,
        records: [] as NormalizedUsageEvent[],
        error: `Moltbook responded with status ${response.status}`
      };
    }

    const payload = (await response.json()) as { records?: unknown[] };
    const records = (payload.records ?? [])
      .map((record) => usageSchema.safeParse(record))
      .filter((result): result is { success: true; data: NormalizedUsageEvent } => result.success)
      .map((result) => result.data);

    return { connected: true, records };
  } catch (error) {
    return {
      connected: false,
      records: [] as NormalizedUsageEvent[],
      error: error instanceof Error ? error.message : "Moltbook request failed"
    };
  }
}
