import axios from 'axios';
import { z } from 'zod';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { saveUsageRecords, type UsageInsert } from '@/lib/database';

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'moltbook';

const usageItemSchema = z.object({
  agent: z.string().default('unknown-agent'),
  workflow: z.string().default('default-workflow'),
  model: z.string().default('unknown-model'),
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  cachedTokens: z.number().int().nonnegative().optional().default(0),
  timestamp: z.string(),
});

const costPerMillionTokens: Record<string, { input: number; output: number; cached?: number }> = {
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2, output: 8 },
  'claude-3-7-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 3.5, output: 10.5 },
  'default': { input: 2, output: 8 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number, cachedTokens: number) {
  const pricing = costPerMillionTokens[model] ?? costPerMillionTokens.default;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cachedCost = (cachedTokens / 1_000_000) * (pricing.cached ?? pricing.input * 0.25);
  return Number((inputCost + outputCost + cachedCost).toFixed(6));
}

function normalizeItems(provider: ProviderName, raw: unknown[]): UsageInsert[] {
  const normalized: UsageInsert[] = [];

  for (const item of raw) {
    const parsed = usageItemSchema.safeParse(item);
    if (!parsed.success) {
      continue;
    }

    const row = parsed.data;
    const totalTokens = row.inputTokens + row.outputTokens + (row.cachedTokens ?? 0);
    normalized.push({
      provider,
      model: row.model,
      workflow: row.workflow,
      agent: row.agent,
      date: new Date(row.timestamp),
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      cachedTokens: row.cachedTokens ?? 0,
      totalTokens,
      estimatedCost: estimateCost(row.model, row.inputTokens, row.outputTokens, row.cachedTokens ?? 0),
    });
  }

  return normalized;
}

function extractUsageArray(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const listCandidates = ['usage', 'items', 'data', 'results'];

  for (const key of listCandidates) {
    if (Array.isArray(data[key])) {
      return data[key] as unknown[];
    }
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getWindowForYesterday() {
  const start = startOfDay(subDays(new Date(), 1));
  const end = endOfDay(subDays(new Date(), 1));
  return { start, end };
}

async function fetchOpenAIUsage() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { start, end } = getWindowForYesterday();
  const response = await axios.get('https://api.openai.com/v1/organization/usage/completions', {
    params: {
      start_time: Math.floor(start.getTime() / 1000),
      end_time: Math.floor(end.getTime() / 1000),
    },
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'OpenAI-Organization': process.env.OPENAI_ORG_ID,
    },
  });

  const items = extractUsageArray(response.data).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      agent: (row.project_name as string) ?? 'openai-agent',
      workflow: (row.api_key_name as string) ?? 'openai-workflow',
      model: (row.model as string) ?? 'gpt-4o',
      inputTokens: Number(row.input_tokens ?? 0),
      outputTokens: Number(row.output_tokens ?? 0),
      cachedTokens: Number(row.input_cached_tokens ?? 0),
      timestamp: new Date(Number(row.start_time ?? Date.now()) * 1000).toISOString(),
    };
  });

  return normalizeItems('openai', items);
}

async function fetchAnthropicUsage() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const { start, end } = getWindowForYesterday();
  const response = await axios.get('https://api.anthropic.com/v1/usage', {
    params: {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    },
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });

  const items = extractUsageArray(response.data).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      agent: (row.agent as string) ?? (row.workspace as string) ?? 'anthropic-agent',
      workflow: (row.workflow as string) ?? 'anthropic-workflow',
      model: (row.model as string) ?? 'claude-3-7-sonnet',
      inputTokens: Number(row.input_tokens ?? row.inputTokens ?? 0),
      outputTokens: Number(row.output_tokens ?? row.outputTokens ?? 0),
      cachedTokens: Number(row.cache_read_input_tokens ?? 0),
      timestamp: (row.timestamp as string) ?? new Date().toISOString(),
    };
  });

  return normalizeItems('anthropic', items);
}

async function fetchGoogleUsage() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  const { start, end } = getWindowForYesterday();
  const response = await axios.get('https://generativelanguage.googleapis.com/v1/usage', {
    params: {
      key: apiKey,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });

  const items = extractUsageArray(response.data).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      agent: (row.agent as string) ?? 'google-agent',
      workflow: (row.workflow as string) ?? 'google-workflow',
      model: (row.model as string) ?? 'gemini-2.0-flash',
      inputTokens: Number(row.input_tokens ?? row.prompt_tokens ?? 0),
      outputTokens: Number(row.output_tokens ?? row.completion_tokens ?? 0),
      cachedTokens: Number(row.cached_tokens ?? 0),
      timestamp: (row.timestamp as string) ?? new Date().toISOString(),
    };
  });

  return normalizeItems('google', items);
}

async function fetchMoltbookUsage() {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY is not configured');
  }

  const { start, end } = getWindowForYesterday();
  const baseUrl = process.env.MOLTBOOK_BASE_URL || 'https://api.moltbook.com';

  const response = await axios.get(`${baseUrl}/v1/usage`, {
    params: {
      from: start.toISOString(),
      to: end.toISOString(),
    },
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const items = extractUsageArray(response.data).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      agent: (row.agent as string) ?? 'moltbook-agent',
      workflow: (row.workflow as string) ?? 'moltbook-workflow',
      model: (row.model as string) ?? 'default',
      inputTokens: Number(row.input_tokens ?? 0),
      outputTokens: Number(row.output_tokens ?? 0),
      cachedTokens: Number(row.cached_tokens ?? 0),
      timestamp: (row.timestamp as string) ?? new Date().toISOString(),
    };
  });

  return normalizeItems('moltbook', items);
}

export async function syncProvider(provider: ProviderName) {
  let records: UsageInsert[] = [];

  if (provider === 'openai') {
    records = await fetchOpenAIUsage();
  }
  if (provider === 'anthropic') {
    records = await fetchAnthropicUsage();
  }
  if (provider === 'google') {
    records = await fetchGoogleUsage();
  }
  if (provider === 'moltbook') {
    records = await fetchMoltbookUsage();
  }

  await saveUsageRecords(records);

  return {
    provider,
    imported: records.length,
    records,
  };
}
