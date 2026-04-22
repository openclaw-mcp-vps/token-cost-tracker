import { NextRequest, NextResponse } from "next/server";

import { getYesterdayUtcRange } from "@/lib/analytics";
import { requirePaidAccess } from "@/lib/api-auth";
import { addUsageEvents, listProviderStatus, setProviderStatus } from "@/lib/database";
import { syncAllProviders } from "@/lib/providers/sync";
import { PROVIDERS, type ProviderName, type ProviderStatus } from "@/lib/types";

export const runtime = "nodejs";

const providerEnvMap: Record<ProviderName, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  moltbook: "MOLTBOOK_API_KEY",
};

function withConfiguredFlags(statuses: ProviderStatus[]): ProviderStatus[] {
  return statuses.map((status) => ({
    ...status,
    configured: Boolean(process.env[providerEnvMap[status.provider]]),
  }));
}

async function runSync(): Promise<{
  providers: ProviderStatus[];
  addedEvents: number;
  errors: Array<{ provider: string; error: string }>;
}> {
  const { start, end } = getYesterdayUtcRange();
  const results = await syncAllProviders(start, end);
  const now = new Date().toISOString();

  const events = results.flatMap((result) => result.events);
  const insertResult = await addUsageEvents(events);
  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of PROVIDERS) {
    const result = results.find((entry) => entry.provider === provider);
    const configured = Boolean(process.env[providerEnvMap[provider]]);

    if (!result) {
      await setProviderStatus(provider, {
        configured,
        connected: false,
        lastSyncAt: now,
        lastError: "Provider did not return a result",
      });
      errors.push({ provider, error: "Provider did not return a result" });
      continue;
    }

    if (result.error) {
      errors.push({ provider, error: result.error });
    }

    await setProviderStatus(provider, {
      configured,
      connected: result.connected,
      lastSyncAt: now,
      lastError: result.error ?? null,
    });
  }

  const providers = withConfiguredFlags(await listProviderStatus());
  return {
    providers,
    addedEvents: insertResult.added,
    errors,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  const sync = request.nextUrl.searchParams.get("sync") === "1";
  if (sync) {
    const payload = await runSync();
    return NextResponse.json(payload);
  }

  const providers = withConfiguredFlags(await listProviderStatus());
  return NextResponse.json({ providers });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const forbidden = requirePaidAccess(request);
  if (forbidden) {
    return forbidden;
  }

  let shouldSync = true;

  try {
    const body = (await request.json()) as { sync?: boolean };
    if (typeof body.sync === "boolean") {
      shouldSync = body.sync;
    }
  } catch {
    shouldSync = true;
  }

  if (!shouldSync) {
    const providers = withConfiguredFlags(await listProviderStatus());
    return NextResponse.json({ providers, addedEvents: 0, errors: [] });
  }

  const payload = await runSync();
  return NextResponse.json(payload);
}
