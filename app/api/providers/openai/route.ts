import { NextResponse } from "next/server";
import { insertUsageEvent } from "@/lib/database";
import { fetchOpenAIUsageSnapshot, parseUsageEvent } from "@/lib/providers";

export async function GET() {
  const snapshot = await fetchOpenAIUsageSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const usage = parseUsageEvent({ ...payload, provider: "openai" });
    const created = await insertUsageEvent(usage);
    return NextResponse.json({ success: true, created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
