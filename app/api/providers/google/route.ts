import { NextResponse } from "next/server";
import { fetchGoogleUsage } from "@/lib/providers/google";

export async function GET() {
  const usage = await fetchGoogleUsage();
  return NextResponse.json({ provider: "google", usage });
}
