import { NextResponse } from "next/server";
import { fetchAnthropicUsage } from "@/lib/providers/anthropic";

export async function GET() {
  const usage = await fetchAnthropicUsage();
  return NextResponse.json({ provider: "anthropic", usage });
}
