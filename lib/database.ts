import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppDatabase, ProviderId, UsageRecord } from "@/lib/types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "store.json");

const defaultDb = (): AppDatabase => ({
  usageRecords: [],
  providers: {
    openai: null,
    anthropic: null,
    google: null,
    moltbook: null
  },
  alertSettings: {
    enabled: false,
    monthlyBudgetUsd: 100,
    notifiedAgentMonths: []
  },
  entitlements: []
});

async function ensureDb(): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf-8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(defaultDb(), null, 2), "utf-8");
  }
}

export async function readDb(): Promise<AppDatabase> {
  await ensureDb();
  const raw = await readFile(DB_FILE, "utf-8");
  const parsed = JSON.parse(raw) as AppDatabase;

  return {
    ...defaultDb(),
    ...parsed,
    providers: {
      ...defaultDb().providers,
      ...(parsed.providers ?? {})
    }
  };
}

let writeQueue = Promise.resolve();

export async function writeDb(updater: (db: AppDatabase) => AppDatabase | Promise<AppDatabase>): Promise<AppDatabase> {
  writeQueue = writeQueue.then(async () => {
    const current = await readDb();
    const next = await updater(current);
    await writeFile(DB_FILE, JSON.stringify(next, null, 2), "utf-8");
  });

  await writeQueue;
  return readDb();
}

export async function upsertUsageRecords(records: UsageRecord[]): Promise<void> {
  if (records.length === 0) {
    return;
  }

  await writeDb((db) => {
    const existing = new Set(db.usageRecords.map((r) => r.id));
    const merged = [...db.usageRecords];

    for (const record of records) {
      if (!existing.has(record.id)) {
        existing.add(record.id);
        merged.push(record);
      }
    }

    merged.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return {
      ...db,
      usageRecords: merged.slice(0, 20000)
    };
  });
}

export function getProviderConfigFromEnv(provider: ProviderId) {
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider,
      apiKey: process.env.OPENAI_API_KEY,
      enabled: true,
      organizationId: process.env.OPENAI_ORG_ID,
      updatedAt: new Date().toISOString()
    };
  }

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return {
      provider,
      apiKey: process.env.ANTHROPIC_API_KEY,
      enabled: true,
      updatedAt: new Date().toISOString()
    };
  }

  if (provider === "google" && process.env.GOOGLE_API_KEY) {
    return {
      provider,
      apiKey: process.env.GOOGLE_API_KEY,
      enabled: true,
      updatedAt: new Date().toISOString()
    };
  }

  if (provider === "moltbook" && process.env.MOLTBOOK_API_KEY) {
    return {
      provider,
      apiKey: process.env.MOLTBOOK_API_KEY,
      enabled: true,
      baseUrl: process.env.MOLTBOOK_BASE_URL,
      updatedAt: new Date().toISOString()
    };
  }

  return null;
}
