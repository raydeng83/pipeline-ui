import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { CompareReport, CompareEndpoint } from "./diff-types";

const ENVIRONMENTS_DIR = path.join(process.cwd(), "environments");
const HISTORY_PATH = path.join(ENVIRONMENTS_DIR, "history.json");
const HISTORY_DIR = path.join(ENVIRONMENTS_DIR, "history");
const MAX_ENTRIES = 200;
const LOG_SEARCH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScopeDetail {
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface LogEntry {
  type: string;
  data?: string;
  code?: number;
  scope?: string;
  side?: string;
  action?: string;
  hash?: string;
  message?: string;
  ts: number;
}

/** Lightweight index record — stored in history.json */
export interface HistoryRecord {
  id: string;
  type: "pull" | "push" | "compare" | "log-search" | "promote";
  environment: string;
  /** Compare / promote: source endpoint */
  source?: CompareEndpoint;
  /** Compare / promote: target endpoint */
  target?: CompareEndpoint;
  scopes: string[];
  status: "success" | "failed";
  commitHash: string | null;
  startedAt: string;
  completedAt: string;
  duration: number;
  summary: string;
  /** Log search: source name */
  logSource?: string;
  /** Log search: mode used */
  logMode?: "search" | "tail" | "transaction";
  /** Log search: time preset */
  logPreset?: string;
  /** Log search: total log entries */
  logEntryCount?: number;
  /** Promote: originating PromotionTask id */
  taskId?: string;
  /** Promote: originating PromotionTask name */
  taskName?: string;
  /** Promote: per-phase status snapshot at emission time (prepare / dry-run / promote / verify) */
  phaseOutcomes?: Record<string, "done" | "failed" | "skipped" | "pending" | "running">;
}

/** Full detail — stored in history/{id}.json */
export interface HistoryDetail {
  scopeDetails?: Record<string, ScopeDetail>;
  compareReport?: CompareReport;
  logs?: LogEntry[];
  /** Log search: stored log entries from Ping API */
  logSearchEntries?: unknown[];
}

// ── Index read / write ───────────────────────────────────────────────────────

export function readHistory(): HistoryRecord[] {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function appendHistory(record: HistoryRecord, detail?: HistoryDetail): void {
  // Save detail file if provided
  if (detail) {
    saveDetail(record.id, detail);
  }

  // Update index
  const records = readHistory();
  records.unshift(record);

  // Cleanup: remove log-search records older than 7 days
  const cutoff = Date.now() - LOG_SEARCH_MAX_AGE_MS;
  const expired = records.filter(
    (r) => r.type === "log-search" && new Date(r.completedAt).getTime() < cutoff
  );
  const active = records.filter(
    (r) => !(r.type === "log-search" && new Date(r.completedAt).getTime() < cutoff)
  );

  // Apply 200-entry cap on remaining records
  const pruned = active.length > MAX_ENTRIES ? active.slice(MAX_ENTRIES) : [];
  if (active.length > MAX_ENTRIES) active.length = MAX_ENTRIES;

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(active, null, 2));

  // Delete detail files for expired + pruned records
  for (const r of [...expired, ...pruned]) {
    deleteDetail(r.id);
  }
}

// ── Detail read / write ──────────────────────────────────────────────────────

function detailPath(id: string): string {
  return path.join(HISTORY_DIR, `${id}.json`);
}

function saveDetail(id: string, detail: HistoryDetail): void {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
  fs.writeFileSync(detailPath(id), JSON.stringify(detail));
}

export function readDetail(id: string): HistoryDetail | null {
  const p = detailPath(id);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function deleteDetail(id: string): void {
  const p = detailPath(id);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }
}

/** Remove a record from the index and delete its detail file. */
export function deleteHistoryRecord(id: string): boolean {
  const records = readHistory();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(records, null, 2));
  deleteDetail(id);
  return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function createHistoryRecord(
  opts: Omit<HistoryRecord, "id" | "completedAt" | "duration"> & { startTime: number }
): HistoryRecord {
  const now = Date.now();
  const record: HistoryRecord = {
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
  };
  if (opts.source) record.source = opts.source;
  if (opts.target) record.target = opts.target;
  return record;
}
