export type ProviderId = "openai" | "anthropic" | "google" | "moltbook";

export interface UsageRecord {
  id: string;
  provider: ProviderId;
  model: string;
  workflow: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  timestamp: string;
  source: "provider_api" | "manual";
}

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  enabled: boolean;
  organizationId?: string;
  baseUrl?: string;
  updatedAt: string;
}

export interface AlertSettings {
  enabled: boolean;
  monthlyBudgetUsd: number;
  discordWebhookUrl?: string;
  notifiedAgentMonths: string[];
}

export interface Entitlement {
  email: string;
  createdAt: string;
  source: "stripe_webhook" | "manual_dev";
}

export interface AppDatabase {
  usageRecords: UsageRecord[];
  providers: Record<ProviderId, ProviderConfig | null>;
  alertSettings: AlertSettings;
  entitlements: Entitlement[];
}

export interface UsageQuery {
  start: Date;
  end: Date;
  includeFreshPull: boolean;
}
