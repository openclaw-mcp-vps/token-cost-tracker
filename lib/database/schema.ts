export type Provider = "openai" | "anthropic" | "google" | "moltbook";

export interface UsageRecord {
  id: string;
  provider: Provider;
  model: string;
  workflow: string;
  agentName: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  totalCostUsd: number;
  capturedAt: string;
}

export interface AgentBudget {
  agentName: string;
  monthlyBudgetUsd: number;
}

export interface PurchaseRecord {
  orderId: string;
  email: string;
  createdAt: string;
}

export interface DatabaseState {
  usage: UsageRecord[];
  budgets: AgentBudget[];
  purchases: PurchaseRecord[];
}
