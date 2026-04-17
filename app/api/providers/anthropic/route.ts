import { NextResponse } from "next/server";
import { insertUsageEvent } from "@/lib/database";
import { fetchAnthropicUsageSnapshot, parseUsageEvent } from "@/lib/providers";

export async function GET() {
  const snapshot = await fetchAnthropicUsageSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const usage = parseUsageEvent({ ...payload, provider: "anthropic" });
    const created = await insertUsageEvent(usage);
    return NextResponse.json({ success: true, created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
