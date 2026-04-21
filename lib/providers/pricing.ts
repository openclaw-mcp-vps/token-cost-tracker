import { ProviderId } from "@/lib/types";

interface Rate {
  input: number;
  output: number;
}

const perMillionRates: Record<ProviderId, Record<string, Rate>> = {
  openai: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4.1": { input: 2, output: 8 },
    "gpt-4.1-mini": { input: 0.4, output: 1.6 },
    "default": { input: 1.5, output: 6 }
  },
  anthropic: {
    "claude-3-7-sonnet-latest": { input: 3, output: 15 },
    "claude-3-5-sonnet-latest": { input: 3, output: 15 },
    "claude-3-5-haiku-latest": { input: 0.8, output: 4 },
    "default": { input: 3, output: 15 }
  },
  google: {
    "gemini-2.5-pro": { input: 3.5, output: 10.5 },
    "gemini-2.0-flash": { input: 0.35, output: 0.7 },
    "default": { input: 0.8, output: 2.4 }
  },
  moltbook: {
    "default": { input: 1.5, output: 6 }
  }
};

function findRate(provider: ProviderId, model: string): Rate {
  const rates = perMillionRates[provider];

  const direct = rates[model];
  if (direct) {
    return direct;
  }

  const byPrefix = Object.entries(rates).find(([key]) => key !== "default" && model.startsWith(key));
  if (byPrefix) {
    return byPrefix[1];
  }

  return rates.default;
}

export function estimateCostUsd(provider: ProviderId, model: string, inputTokens: number, outputTokens: number): number {
  const rate = findRate(provider, model);
  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  return Number((inputCost + outputCost).toFixed(6));
}
