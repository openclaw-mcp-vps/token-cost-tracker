import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : null;

export type UsageRow = {
  id: number;
  provider: string;
  model: string;
  agent_id: string;
  workflow: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  used_at: string;
};

export type DailyAgentCost = {
  date: string;
  agent_id: string;
  provider: string;
  model: string;
  workflow: string;
  total_tokens: string;
  total_cost_usd: string;
};

export async function ensureTables() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id BIGSERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      workflow TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      total_tokens INTEGER NOT NULL,
      cost_usd NUMERIC(14, 6) NOT NULL,
      used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id BIGSERIAL PRIMARY KEY,
      lemon_order_id TEXT UNIQUE NOT NULL,
      email TEXT,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function insertUsageEvent(event: {
  provider: string;
  model: string;
  agentId: string;
  workflow: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  usedAt?: string;
}) {
  if (!pool) {
    return null;
  }

  await ensureTables();

  const result = await pool.query<UsageRow>(
    `
      INSERT INTO usage_events
        (provider, model, agent_id, workflow, input_tokens, output_tokens, total_tokens, cost_usd, used_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()))
      RETURNING *;
    `,
    [
      event.provider,
      event.model,
      event.agentId,
      event.workflow,
      event.inputTokens,
      event.outputTokens,
      event.totalTokens,
      event.costUsd,
      event.usedAt ?? null
    ]
  );

  return result.rows[0];
}

export async function getRecentUsage(days = 30) {
  if (!pool) {
    return [] as UsageRow[];
  }

  await ensureTables();

  const result = await pool.query<UsageRow>(
    `
      SELECT *
      FROM usage_events
      WHERE used_at >= NOW() - ($1::text || ' days')::interval
      ORDER BY used_at DESC;
    `,
    [days]
  );

  return result.rows;
}

export async function getDailyAgentCosts(days = 30) {
  if (!pool) {
    return [] as DailyAgentCost[];
  }

  await ensureTables();

  const result = await pool.query<DailyAgentCost>(
    `
      SELECT
        DATE(used_at)::text as date,
        agent_id,
        provider,
        model,
        workflow,
        SUM(total_tokens)::text as total_tokens,
        SUM(cost_usd)::text as total_cost_usd
      FROM usage_events
      WHERE used_at >= NOW() - ($1::text || ' days')::interval
      GROUP BY DATE(used_at), agent_id, provider, model, workflow
      ORDER BY DATE(used_at) DESC, SUM(cost_usd) DESC;
    `,
    [days]
  );

  return result.rows;
}

export async function getMonthlyAgentSpend() {
  if (!pool) {
    return [] as { agent_id: string; total_cost_usd: string }[];
  }

  await ensureTables();

  const result = await pool.query<{ agent_id: string; total_cost_usd: string }>(`
    SELECT
      agent_id,
      SUM(cost_usd)::text as total_cost_usd
    FROM usage_events
    WHERE date_trunc('month', used_at) = date_trunc('month', NOW())
    GROUP BY agent_id;
  `);

  return result.rows;
}

export async function upsertSubscription(input: {
  lemonOrderId: string;
  email?: string;
  status: string;
}) {
  if (!pool) {
    return;
  }

  await ensureTables();

  await pool.query(
    `
      INSERT INTO subscriptions (lemon_order_id, email, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (lemon_order_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        status = EXCLUDED.status;
    `,
    [input.lemonOrderId, input.email ?? null, input.status]
  );
}

export async function isAnySubscriptionActive() {
  if (!pool) {
    return false;
  }

  await ensureTables();

  const result = await pool.query<{ active_count: string }>(`
    SELECT COUNT(*)::text as active_count
    FROM subscriptions
    WHERE status IN ('paid', 'active', 'on_trial');
  `);

  return Number(result.rows[0]?.active_count ?? 0) > 0;
}
