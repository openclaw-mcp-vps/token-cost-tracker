export const PROVIDERS = ["openai", "anthropic", "google", "moltbook"] as const;

export type ProviderName = (typeof PROVIDERS)[number];

export type UsageSource = "provider_sync" | "agent_ingest";

export interface UsageEvent {
  id: string;
  timestamp: string;
  provider: ProviderName;
  model: string;
  workflow: string;
  agent: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  requests: number;
  source: UsageSource;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProviderStatus {
  provider: ProviderName;
  configured: boolean;
  connected: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface AlertSettings {
  monthlyAgentBudgetUsd: number;
  monthlyWorkspaceBudgetUsd: number;
  discordWebhookUrl: string | null;
}

export interface Entitlement {
  email: string;
  source: "stripe_webhook";
  checkoutSessionId: string;
  customerId: string | null;
  purchasedAt: string;
}

export interface DataStore {
  usageEvents: UsageEvent[];
  providerStatus: Record<ProviderName, ProviderStatus>;
  alertSettings: AlertSettings;
  entitlements: Entitlement[];
  sentAlerts: string[];
}

export interface ProviderSyncOptions {
  start: Date;
  end: Date;
}

export interface ProviderSyncResult {
  provider: ProviderName;
  events: UsageEvent[];
  connected: boolean;
  error?: string;
}

export interface DashboardSummary {
  totals: {
    costUsd: number;
    totalTokens: number;
    requests: number;
  };
  daily: Array<{
    date: string;
    costUsd: number;
    totalTokens: number;
    requests: number;
  }>;
  providers: Array<{
    provider: ProviderName;
    costUsd: number;
    totalTokens: number;
    requests: number;
  }>;
  models: Array<{
    model: string;
    provider: ProviderName;
    costUsd: number;
    totalTokens: number;
    requests: number;
  }>;
  workflows: Array<{
    workflow: string;
    costUsd: number;
    totalTokens: number;
    requests: number;
  }>;
  agents: Array<{
    agent: string;
    workflow: string;
    provider: ProviderName;
    model: string;
    costUsd: number;
    totalTokens: number;
    requests: number;
  }>;
}
