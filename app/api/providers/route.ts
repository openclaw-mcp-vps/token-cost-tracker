import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProviderConfigFromEnv, readDb, writeDb } from "@/lib/database";
import { ProviderId } from "@/lib/types";
import { maskApiKey } from "@/lib/utils";

const providerSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "moltbook"]),
  apiKey: z.string().min(10),
  enabled: z.boolean().default(true),
  baseUrl: z.string().url().optional(),
  organizationId: z.string().optional()
});

function getEffectiveProvider(dbProvider: Awaited<ReturnType<typeof readDb>>["providers"][ProviderId], providerId: ProviderId) {
  return dbProvider ?? getProviderConfigFromEnv(providerId);
}

export async function GET() {
  const db = await readDb();

  const providers = (Object.keys(db.providers) as ProviderId[]).map((providerId) => {
    const config = getEffectiveProvider(db.providers[providerId], providerId);

    if (!config) {
      return {
        provider: providerId,
        connected: false,
        enabled: false,
        updatedAt: null,
        apiKeyMasked: null,
        baseUrl: null,
        organizationId: null
      };
    }

    return {
      provider: providerId,
      connected: true,
      enabled: config.enabled,
      updatedAt: config.updatedAt,
      apiKeyMasked: maskApiKey(config.apiKey),
      baseUrl: config.baseUrl ?? null,
      organizationId: config.organizationId ?? null
    };
  });

  return NextResponse.json({ providers });
}

export async function POST(request: NextRequest) {
  const parsed = providerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  await writeDb((db) => ({
    ...db,
    providers: {
      ...db.providers,
      [body.provider]: {
        provider: body.provider,
        apiKey: body.apiKey,
        enabled: body.enabled,
        baseUrl: body.baseUrl,
        organizationId: body.organizationId,
        updatedAt: new Date().toISOString()
      }
    }
  }));

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider") as ProviderId | null;

  if (!provider || !["openai", "anthropic", "google", "moltbook"].includes(provider)) {
    return NextResponse.json({ error: "Missing provider query param" }, { status: 400 });
  }

  await writeDb((db) => ({
    ...db,
    providers: {
      ...db.providers,
      [provider]: null
    }
  }));

  return NextResponse.json({ success: true });
}
