import type { ProviderName } from "@/lib/types";

interface PricingRule {
  matcher: RegExp;
  inputPer1k: number;
  outputPer1k: number;
}

const PRICING: Record<ProviderName, PricingRule[]> = {
  openai: [
    { matcher: /gpt-4\.1|gpt-4o/i, inputPer1k: 0.005, outputPer1k: 0.015 },
    { matcher: /gpt-4o-mini|gpt-4\.1-mini/i, inputPer1k: 0.0006, outputPer1k: 0.0024 },
    { matcher: /gpt-3\.5|gpt-4o-realtime/i, inputPer1k: 0.0015, outputPer1k: 0.006 },
  ],
  anthropic: [
    { matcher: /claude-3-7-sonnet|claude-sonnet-4/i, inputPer1k: 0.003, outputPer1k: 0.015 },
    { matcher: /claude-3-5-haiku|claude-haiku/i, inputPer1k: 0.0008, outputPer1k: 0.004 },
  ],
  google: [
    { matcher: /gemini-2\.5-pro|gemini-1\.5-pro/i, inputPer1k: 0.00125, outputPer1k: 0.005 },
    { matcher: /gemini-2\.5-flash|gemini-1\.5-flash|gemini-2\.0-flash/i, inputPer1k: 0.00035, outputPer1k: 0.0014 },
  ],
  moltbook: [{ matcher: /.*/, inputPer1k: 0.001, outputPer1k: 0.003 }],
};

export function estimateCostUsd(
  provider: ProviderName,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const normalizedModel = model.trim();
  const rule = PRICING[provider].find((candidate) => candidate.matcher.test(normalizedModel));

  if (!rule) {
    return 0;
  }

  const inputCost = (Math.max(inputTokens, 0) / 1000) * rule.inputPer1k;
  const outputCost = (Math.max(outputTokens, 0) / 1000) * rule.outputPer1k;
  return Number((inputCost + outputCost).toFixed(6));
}
