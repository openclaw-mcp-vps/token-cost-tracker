import { NextResponse } from "next/server";
import { fetchOpenAiUsage } from "@/lib/providers/openai";

export async function GET() {
  const usage = await fetchOpenAiUsage();
  return NextResponse.json({ provider: "openai", usage });
}
