import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentBudget, DatabaseState, UsageRecord } from "@/lib/database/schema";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

const INITIAL_DB: DatabaseState = {
  usage: [],
  budgets: [
    { agentName: "support-agent", monthlyBudgetUsd: 150 },
    { agentName: "sales-outreach-agent", monthlyBudgetUsd: 220 },
    { agentName: "mcp-doc-agent", monthlyBudgetUsd: 95 },
  ],
  purchases: [],
};

async function ensureDb() {
  await mkdir(DB_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, "utf-8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<DatabaseState> {
  await ensureDb();
  const raw = await readFile(DB_FILE, "utf-8");
  return JSON.parse(raw) as DatabaseState;
}

export async function writeDb(nextState: DatabaseState) {
  await ensureDb();
  await writeFile(DB_FILE, JSON.stringify(nextState, null, 2), "utf-8");
}

export async function appendUsage(records: Omit<UsageRecord, "id">[]) {
  const db = await readDb();
  db.usage.push(...records.map((r) => ({ ...r, id: randomUUID() })));
  await writeDb(db);
}

export async function upsertBudgets(budgets: AgentBudget[]) {
  const db = await readDb();
  for (const budget of budgets) {
    const existing = db.budgets.find((b) => b.agentName === budget.agentName);
    if (existing) {
      existing.monthlyBudgetUsd = budget.monthlyBudgetUsd;
    } else {
      db.budgets.push(budget);
    }
  }
  await writeDb(db);
}
