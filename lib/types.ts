export type DailyCostPoint = {
  date: string;
  cost: number;
  tokens: number;
};

export type AgentRow = {
  agent: string;
  cost: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  providers: string[];
  models: string[];
  workflows: string[];
  monthlyBudgetUsd: number | null;
  monthlySpendUsd: number;
};

export type RunawayAgent = {
  agent: string;
  spend: number;
  budget: number;
  overBy: number;
};

export type DashboardSnapshot = {
  totalCost: number;
  totalTokens: number;
  from: string;
  to: string;
  byDay: DailyCostPoint[];
  agents: AgentRow[];
  runawayAgents: RunawayAgent[];
};
