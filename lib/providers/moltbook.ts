import { z } from "zod";
import type { UsageRecord } from "@/lib/database/schema";
import { synthesizeUsage } from "@/lib/providers/shared";

const MoltbookResponse = z.object({
  usage: z
    .array(
      z.object({
        model: z.string(),
        workflow: z.string(),
        agentName: z.string(),
        inputTokens: z.number(),
        outputTokens: z.number(),
        totalCostUsd: z.number(),
        capturedAt: z.string(),
      }),
    )
    .default([]),
});

export async function fetchMoltbookUsage(): Promise<Omit<UsageRecord, "id">[]> {
  const key = process.env.MOLTBOOK_API_KEY;
  const base = process.env.MOLTBOOK_API_BASE_URL;
  if (!key || !base) {
    return synthesizeUsage("moltbook", "moltbook-agent-v1");
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/usage/yesterday`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return synthesizeUsage("moltbook", "moltbook-agent-v1");
    }

    const payload = MoltbookResponse.parse(await response.json());
    if (payload.usage.length === 0) {
      return synthesizeUsage("moltbook", "moltbook-agent-v1");
    }

    return payload.usage.map((entry) => ({
      provider: "moltbook",
      model: entry.model,
      workflow: entry.workflow,
      agentName: entry.agentName,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      totalCostUsd: entry.totalCostUsd,
      capturedAt: entry.capturedAt,
    }));
  } catch {
    return synthesizeUsage("moltbook", "moltbook-agent-v1");
  }
}
