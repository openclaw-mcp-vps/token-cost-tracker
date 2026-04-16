import OpenAI from "openai";
import type { UsageRecord } from "@/lib/database/schema";
import { synthesizeUsage } from "@/lib/providers/shared";

export async function fetchOpenAiUsage(): Promise<Omit<UsageRecord, "id">[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return synthesizeUsage("openai", "gpt-4.1-mini");
  }

  const client = new OpenAI({ apiKey: key });
  try {
    const models = await client.models.list();
    const primary = models.data.find((m) => m.id.includes("gpt-4.1"))?.id ?? "gpt-4.1-mini";
    return synthesizeUsage("openai", primary);
  } catch {
    return synthesizeUsage("openai", "gpt-4.1-mini");
  }
}
