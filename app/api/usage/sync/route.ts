import { NextResponse } from "next/server";
import { appendUsage } from "@/lib/database/store";
import { fetchAnthropicUsage } from "@/lib/providers/anthropic";
import { fetchGoogleUsage } from "@/lib/providers/google";
import { fetchMoltbookUsage } from "@/lib/providers/moltbook";
import { fetchOpenAiUsage } from "@/lib/providers/openai";

export async function POST() {
  const [openai, anthropic, google, moltbook] = await Promise.all([
    fetchOpenAiUsage(),
    fetchAnthropicUsage(),
    fetchGoogleUsage(),
    fetchMoltbookUsage(),
  ]);

  const all = [...openai, ...anthropic, ...google, ...moltbook];
  await appendUsage(all);

  return NextResponse.json({
    message: `Synced ${all.length} usage records from 4 providers.`,
  });
}
