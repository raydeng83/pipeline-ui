import fs from "fs";
import path from "path";
import crypto from "crypto";

const HISTORY_PATH = path.join(process.cwd(), "environments", "history.json");
const MAX_ENTRIES = 200;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScopeDetail {
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface HistoryRecord {
  id: string;
  type: "pull" | "push";
  environment: string;
  scopes: string[];
  status: "success" | "failed";
  commitHash: string | null;
  startedAt: string;
  completedAt: string;
  duration: number;
  summary: string;
  details: Record<string, ScopeDetail>;
}

// ── Read / Write ─────────────────────────────────────────────────────────────

export function readHistory(): HistoryRecord[] {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function appendHistory(record: HistoryRecord): void {
  const records = readHistory();
  records.unshift(record);
  if (records.length > MAX_ENTRIES) records.length = MAX_ENTRIES;
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(records, null, 2));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function createHistoryRecord(
  opts: Omit<HistoryRecord, "id" | "completedAt" | "duration"> & { startTime: number }
): HistoryRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    type: opts.type,
    environment: opts.environment,
    scopes: opts.scopes,
    status: opts.status,
    commitHash: opts.commitHash,
    startedAt: opts.startedAt,
    completedAt: new Date(now).toISOString(),
    duration: now - opts.startTime,
    summary: opts.summary,
    details: opts.details,
  };
}
