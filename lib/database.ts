import { promises as fs } from "node:fs";
import path from "node:path";

import { PROVIDERS, type AlertSettings, type DataStore, type Entitlement, type ProviderName, type ProviderStatus, type UsageEvent } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function defaultProviderStatus(provider: ProviderName): ProviderStatus {
  return {
    provider,
    configured: false,
    connected: false,
    lastSyncAt: null,
    lastError: null,
  };
}

function createDefaultStore(): DataStore {
  const providerStatus = Object.fromEntries(
    PROVIDERS.map((provider) => [provider, defaultProviderStatus(provider)]),
  ) as Record<ProviderName, ProviderStatus>;

  return {
    usageEvents: [],
    providerStatus,
    alertSettings: {
      monthlyAgentBudgetUsd: 250,
      monthlyWorkspaceBudgetUsd: 1500,
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || null,
    },
    entitlements: [],
    sentAlerts: [],
  };
}

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, `${JSON.stringify(createDefaultStore(), null, 2)}\n`, "utf8");
  }
}

function normalizeStore(store: DataStore): DataStore {
  const normalized = createDefaultStore();

  return {
    ...normalized,
    ...store,
    providerStatus: {
      ...normalized.providerStatus,
      ...store.providerStatus,
    },
    alertSettings: {
      ...normalized.alertSettings,
      ...store.alertSettings,
    },
    usageEvents: store.usageEvents ?? [],
    entitlements: store.entitlements ?? [],
    sentAlerts: store.sentAlerts ?? [],
  };
}

export async function readStore(): Promise<DataStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as DataStore;
  return normalizeStore(parsed);
}

async function writeStore(store: DataStore): Promise<void> {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function updateStore(
  mutator: (store: DataStore) => void | Promise<void>,
): Promise<DataStore> {
  const runner = writeQueue.then(async () => {
    const store = await readStore();
    await mutator(store);
    await writeStore(store);
    return store;
  });

  writeQueue = runner.then(
    () => undefined,
    () => undefined,
  );

  return runner;
}

export async function addUsageEvents(events: UsageEvent[]): Promise<{ added: number; total: number }> {
  if (events.length === 0) {
    const store = await readStore();
    return { added: 0, total: store.usageEvents.length };
  }

  let added = 0;
  const store = await updateStore((draft) => {
    const ids = new Set(draft.usageEvents.map((event) => event.id));
    for (const event of events) {
      if (!ids.has(event.id)) {
        draft.usageEvents.push(event);
        ids.add(event.id);
        added += 1;
      }
    }

    draft.usageEvents.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
  });

  return {
    added,
    total: store.usageEvents.length,
  };
}

export async function setProviderStatus(
  provider: ProviderName,
  patch: Partial<Omit<ProviderStatus, "provider">>,
): Promise<ProviderStatus> {
  const store = await updateStore((draft) => {
    draft.providerStatus[provider] = {
      ...defaultProviderStatus(provider),
      ...draft.providerStatus[provider],
      ...patch,
      provider,
    };
  });

  return store.providerStatus[provider];
}

export async function listProviderStatus(): Promise<ProviderStatus[]> {
  const store = await readStore();
  return PROVIDERS.map((provider) => store.providerStatus[provider]);
}

export async function getAlertSettings(): Promise<AlertSettings> {
  const store = await readStore();
  return store.alertSettings;
}

export async function saveAlertSettings(patch: Partial<AlertSettings>): Promise<AlertSettings> {
  const store = await updateStore((draft) => {
    draft.alertSettings = {
      ...draft.alertSettings,
      ...patch,
    };
  });

  return store.alertSettings;
}

export async function addEntitlement(record: Entitlement): Promise<void> {
  await updateStore((draft) => {
    const exists = draft.entitlements.some(
      (entry) =>
        entry.email === record.email &&
        entry.checkoutSessionId === record.checkoutSessionId,
    );

    if (!exists) {
      draft.entitlements.push(record);
    }
  });
}

export async function hasEntitlement(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const store = await readStore();
  return store.entitlements.some((entry) => entry.email.trim().toLowerCase() === normalized);
}

export async function markAlertSent(key: string): Promise<boolean> {
  const store = await updateStore((draft) => {
    if (!draft.sentAlerts.includes(key)) {
      draft.sentAlerts.push(key);
    }
  });

  return store.sentAlerts.includes(key);
}

export async function wasAlertSent(key: string): Promise<boolean> {
  const store = await readStore();
  return store.sentAlerts.includes(key);
}
