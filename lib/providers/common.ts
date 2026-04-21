import { createHash } from "node:crypto";
import { UsageRecord } from "@/lib/types";

export function makeUsageId(record: Omit<UsageRecord, "id">): string {
  const hash = createHash("sha256")
    .update(
      `${record.provider}|${record.model}|${record.workflow}|${record.agentId}|${record.timestamp}|${record.totalTokens}|${record.costUsd}`
    )
    .digest("hex")
    .slice(0, 24);

  return `${record.provider}_${hash}`;
}

export function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function parseArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData;
    }

    const maybeRecords = (payload as { records?: unknown }).records;
    if (Array.isArray(maybeRecords)) {
      return maybeRecords;
    }
  }

  return [];
}
