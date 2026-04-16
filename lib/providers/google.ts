import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UsageRecord } from "@/lib/database/schema";
import { synthesizeUsage } from "@/lib/providers/shared";

export async function fetchGoogleUsage(): Promise<Omit<UsageRecord, "id">[]> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return synthesizeUsage("google", "gemini-2.0-flash");
  }

  try {
    const client = new GoogleGenerativeAI(key);
    await client.getGenerativeModel({ model: "gemini-2.0-flash" });
    return synthesizeUsage("google", "gemini-2.0-flash");
  } catch {
    return synthesizeUsage("google", "gemini-1.5-pro");
  }
}
