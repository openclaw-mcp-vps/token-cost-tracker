import { NextResponse } from "next/server";
import { fetchMoltbookUsage } from "@/lib/providers/moltbook";

export async function GET() {
  const usage = await fetchMoltbookUsage();
  return NextResponse.json({ provider: "moltbook", usage });
}
