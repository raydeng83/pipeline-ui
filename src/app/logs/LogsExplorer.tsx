"use client";

import { useState, useEffect, useRef, Fragment, startTransition, useDeferredValue, useCallback } from "react";
import { Environment } from "@/lib/fr-config-types";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnvWithLogApi extends Environment {
  hasLogApi: boolean;
}

interface LogEntry {
  timestamp: string;
  type: string;
  source?: string;
  payload: Record<string, unknown> | string;
}

/** Safely access payload as an object. Returns empty object for text/plain entries. */
function payloadObj(entry: LogEntry): Record<string, unknown> {
  return typeof entry.payload === "object" && entry.payload !== null ? entry.payload : {};
}

/** Check if entry is plain text (idm-core, am-core text logs). */
function isTextEntry(entry: LogEntry): boolean {
  return entry.type === "text/plain" || typeof entry.payload === "string";
}

/** Get the display text for a plain-text entry. */
function getTextPayload(entry: LogEntry): string {
  return typeof entry.payload === "string" ? entry.payload : "";
}

type TailSecs = 5 | 10 | 30;

// Client-side level filter
const LEVEL_ORDER = ["FATAL", "SEVERE", "ERROR", "WARN", "WARNING", "INFO", "INFORMATION", "CONFIG", "DEBUG", "FINE", "FINER", "TRACE", "FINEST"];

const LEVEL_FILTERS = [
  { value: "ERROR", label: "ERROR+" },
  { value: "WARN",  label: "WARN+" },
  { value: "INFO",  label: "INFO+" },
  { value: "DEBUG", label: "DEBUG+" },
  { value: "ALL",   label: "ALL" },
];

function levelPassesFilter(level: string, minLevel: string): boolean {
  if (minLevel === "ALL") return true;
  const idx = LEVEL_ORDER.indexOf(level.toUpperCase());
  const minIdx = LEVEL_ORDER.indexOf(minLevel.toUpperCase());
  if (idx === -1) return true;
  if (minIdx === -1) return true;
  return idx <= minIdx;
}

// Sources queried for transaction drill-down
const TRANSACTION_SOURCES = [
  "am-access", "am-authentication", "am-core",
  "idm-access", "idm-activity", "idm-authentication",
];

// ── Tab config (shared between parent controls and tab content) ──────────────

export interface TabConfig {
  env: string;
  source: string;
  sources: string[];
  sourcesLoading: boolean;
  sourcesError: string;
  levelFilter: string;
  tailSecs: TailSecs;
  tailing: boolean;
  loading: boolean;
}

// ── Field extraction ────────────────────────────────────────────────────────

/** Parse level from plain-text log line (e.g. "FINE:", "WARNING:", "SEVERE:") */
function parseTextLevel(text: string): string {
  const match = text.match(/^(FINEST|FINER|FINE|CONFIG|INFO|INFORMATION|WARNING|SEVERE|FATAL):/);
  if (match) return match[1].toUpperCase();
  return "INFO";
}

/** Parse class name from plain-text log line (e.g. "[147] Apr 05 ... org.foo.Bar method") */
function parseTextComponent(text: string): string {
  // Pattern: [threadId] date time AM/PM org.package.Class methodName
  const match = text.match(/\d{4}\s+(?:AM|PM)\s+([\w.]+)\s+\w+$/);
  if (match) {
    const parts = match[1].split(".");
    return parts[parts.length - 1];
  }
  return "";
}

function getLevel(entry: LogEntry): string {
  if (isTextEntry(entry)) {
    const text = getTextPayload(entry);
    return parseTextLevel(text);
  }
  const p = payloadObj(entry);
  if (typeof p.level === "string") return p.level.toUpperCase();
  if (typeof p.severity === "string") return p.severity.toUpperCase();
  if (p.result === "FAILED" || p.result === "false") return "WARN";
  const resp = p.response as Record<string, unknown> | undefined;
  if (resp?.status === "FAILED") return "WARN";
  return "INFO";
}

function getMessage(entry: LogEntry): string {
  if (isTextEntry(entry)) return getTextPayload(entry);
  const p = payloadObj(entry);
  if (typeof p.message === "string" && p.message) return p.message;
  const eventName = p.eventName as string | undefined;
  if (eventName === "AM-NODE-LOGIN-COMPLETED") {
    const entries = p.entries as Array<{ info?: Record<string, string> }> | undefined;
    const info = entries?.[0]?.info;
    if (info?.displayName) return `${info.displayName} → ${info.nodeOutcome ?? ""}`;
  }
  if (eventName) {
    const parts: string[] = [eventName];
    if (typeof p.result === "string") parts.push(`→ ${p.result}`);
    const userId = p.userId;
    if (typeof userId === "string" && userId) parts.push(`[${userId}]`);
    return parts.join(" ");
  }
  // IDM access: show operation + task/path
  const req = p.request as Record<string, unknown> | undefined;
  if (req) {
    const op = typeof req.operation === "string" ? req.operation : "";
    const detail = req.detail as Record<string, unknown> | undefined;
    const taskName = typeof detail?.taskName === "string" ? detail.taskName : "";
    const path = typeof req.path === "string" ? req.path : "";
    if (op && taskName) return `${op}: ${taskName}`;
    if (op && path) return `${op} ${path}`;
    if (path) return `${p.http_method ?? ""} ${path}`.trim();
  }
  return "(no message)";
}

function getComponent(entry: LogEntry, source: string): string {
  if (isTextEntry(entry)) return parseTextComponent(getTextPayload(entry)) || source;
  const p = payloadObj(entry);
  if (typeof p.component === "string" && p.component) return p.component;
  if (typeof p.logger === "string" && p.logger) {
    const match = p.logger.match(/\(([^)]+)\)$/);
    if (match) return match[1];
    const parts = p.logger.split(".");
    return parts[parts.length - 1];
  }
  // IDM access: show protocol
  const req = p.request as Record<string, unknown> | undefined;
  if (typeof req?.protocol === "string") return req.protocol;
  return source;
}

function getTransactionId(entry: LogEntry): string {
  const p = payloadObj(entry);
  if (typeof p.transactionId === "string") return p.transactionId;
  // Check mdc.transactionId (am-core pattern)
  const mdc = p.mdc as Record<string, unknown> | undefined;
  if (typeof mdc?.transactionId === "string") return mdc.transactionId;
  return "";
}

function getUserId(entry: LogEntry): string {
  const p = payloadObj(entry);
  if (typeof p.userId === "string" && p.userId) return p.userId;
  if (Array.isArray(p.principal) && p.principal.length > 0) return String(p.principal[0]);
  return "";
}

function getStatus(entry: LogEntry): string {
  const p = payloadObj(entry);
  const resp = p.response as Record<string, unknown> | undefined;
  if (typeof resp?.status === "string") return resp.status;
  if (typeof p.result === "string") return p.result;
  return "";
}

// ── Badges ────────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  ERROR: "bg-red-100 text-red-700 border border-red-200",
  FATAL: "bg-red-100 text-red-700 border border-red-200",
  SEVERE: "bg-red-100 text-red-700 border border-red-200",
  WARN: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  WARNING: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  INFO: "bg-sky-50 text-sky-700 border border-sky-200",
  INFORMATION: "bg-sky-50 text-sky-700 border border-sky-200",
  CONFIG: "bg-sky-50 text-sky-700 border border-sky-200",
  DEBUG: "bg-slate-100 text-slate-600 border border-slate-200",
  FINE: "bg-slate-100 text-slate-600 border border-slate-200",
  FINER: "bg-slate-100 text-slate-500 border border-slate-200",
  TRACE: "bg-slate-100 text-slate-500 border border-slate-200",
  FINEST: "bg-slate-100 text-slate-500 border border-slate-200",
};

function LevelBadge({ level }: { level: string }) {
  const style = LEVEL_STYLES[level] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold leading-none", style)}>
      {level}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isAm = source.startsWith("am-");
  return (
    <span className={cn(
      "inline-block px-1.5 py-0.5 rounded text-[10px] font-mono leading-none whitespace-nowrap",
      isAm ? "bg-purple-100 text-purple-700" : "bg-teal-50 text-teal-700"
    )}>
      {source}
    </span>
  );
}

// ── Timestamp formatting ────────────────────────────────────────────────────

function formatTs(ts: string): { date: string; time: string } {
  try {
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      + "." + String(d.getMilliseconds()).padStart(3, "0");
    return { date, time };
  } catch {
    return { date: "", time: ts };
  }
}

// ── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  source,
  expanded,
  onToggle,
  searchTerm,
  keywords,
  onTransactionClick,
}: {
  entry: LogEntry;
  source: string;
  expanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  keywords: string[];
  onTransactionClick: (txId: string) => void;
}) {
  const effectiveSource = entry.source ?? source;
  const level = getLevel(entry);
  const message = getMessage(entry);
  const component = getComponent(entry, effectiveSource);
  const transactionId = getTransactionId(entry);
  const userId = getUserId(entry);
  const status = getStatus(entry);
  const { date, time } = formatTs(entry.timestamp);
  const isText = isTextEntry(entry);

  function highlight(text: string) {
    const terms = [searchTerm, ...keywords].filter(Boolean);
    if (terms.length === 0) return <>{text}</>;
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(regex);
    if (parts.length === 1) return <>{text}</>;
    // Reset lastIndex between test calls by using source + flags
    const testRe = new RegExp(`^(?:${escaped.join("|")})$`, "i");
    return (
      <>
        {parts.map((part, i) =>
          testRe.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  }

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer text-xs border-b border-slate-100 hover:bg-slate-50 transition-colors",
          expanded && "bg-slate-50"
        )}
      >
        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap align-top">
          <span className="text-slate-300 text-[10px]">{date} </span>{time}
        </td>
        <td className="px-2 py-2 whitespace-nowrap align-top">
          <SourceBadge source={effectiveSource} />
        </td>
        <td className="px-2 py-2 whitespace-nowrap align-top">
          <LevelBadge level={level} />
        </td>
        {isText ? (
          <td colSpan={2} className="px-2 py-2 text-slate-700 align-top font-mono text-[11px]">
            <span className="line-clamp-2 break-all whitespace-pre-wrap">{highlight(message)}</span>
          </td>
        ) : (
          <>
            <td className="px-2 py-2 text-slate-800 align-top">
              <span className="line-clamp-2 break-all">{highlight(message)}</span>
              <span className="flex items-center gap-2 mt-0.5">
                {userId && (
                  <span className="text-slate-400 font-mono text-[10px]">{highlight(userId)}</span>
                )}
                {status && (
                  <span className={cn(
                    "text-[10px] font-mono px-1 py-0.5 rounded leading-none",
                    status === "SUCCESSFUL" ? "text-emerald-700 bg-emerald-50" : status === "FAILED" ? "text-red-700 bg-red-50" : "text-slate-500 bg-slate-50"
                  )}>
                    {status}
                  </span>
                )}
              </span>
            </td>
            <td className="px-2 py-2 whitespace-nowrap align-top">
              {transactionId ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTransactionClick(transactionId); }}
                  className="font-mono text-[10px] text-sky-600 hover:text-sky-800 hover:underline truncate max-w-[130px] block"
                  title={transactionId}
                >
                  {transactionId.length > 20 ? `${transactionId.slice(0, 8)}…${transactionId.slice(-8)}` : transactionId}
                </button>
              ) : null}
            </td>
          </>
        )}
        <td className="px-2 py-2 text-slate-300 align-top text-center">
          <span className={cn("inline-block transition-transform text-[10px]", expanded && "rotate-90")}>▶</span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-950 border-b border-slate-700">
          <td colSpan={6} className="p-0">
            <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto leading-5">
              {isText ? getTextPayload(entry) : JSON.stringify(entry.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// ── Transaction drill-down modal ────────────────────────────────────────────

function TransactionDrilldown({
  transactionId,
  env,
  availableSources,
  onClose,
}: {
  transactionId: string;
  env: string;
  availableSources: string[];
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<(LogEntry & { source: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Prefer aggregate sources for full coverage; fall back to individual sources
  const AM_INDIVIDUAL = ["am-access", "am-authentication", "am-core"];
  const IDM_INDIVIDUAL = ["idm-access", "idm-activity", "idm-authentication"];
  const amSources = availableSources.includes("am-everything")
    ? ["am-everything"]
    : AM_INDIVIDUAL.filter((s) => availableSources.includes(s));
  const idmSources = availableSources.includes("idm-everything")
    ? ["idm-everything"]
    : IDM_INDIVIDUAL.filter((s) => availableSources.includes(s));
  const sources = [...amSources, ...idmSources];

  useEffect(() => {
    if (sources.length === 0) {
      setError("No relevant log sources available for this environment.");
      setLoading(false);
      return;
    }

    // Use the indexed transactionId param — Ping searches the full retention window
    Promise.all(
      sources.map((src) =>
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ env, source: src, transactionId, pageSize: 1000 }),
        })
          .then((r) => r.json())
          .then((data): (LogEntry & { source: string })[] => {
            if (data.error || !Array.isArray(data.result)) return [];
            return (data.result as LogEntry[]).map((e) => ({ ...e, source: src }));
          })
          .catch(() => [] as (LogEntry & { source: string })[])
      )
    ).then((results) => {
      const merged = results
        .flat()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setEntries(merged);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const sourcesQueried = sources.length;
  const sourcesWithHits = new Set(entries.map((e) => e.source)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-700 shrink-0">Transaction Trace</span>
            <code className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
              {transactionId}
            </code>
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Querying {sourcesQueried} source{sourcesQueried !== 1 ? "s" : ""}…</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-500">{error}</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No entries found for this transaction ID.</div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left sticky top-0">
                  <th className="px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Timestamp</th>
                  <th className="px-2 py-2 font-semibold text-slate-500">Source</th>
                  <th className="px-2 py-2 font-semibold text-slate-500">Level</th>
                  <th className="px-2 py-2 font-semibold text-slate-500">Message</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const level = getLevel(entry);
                  const message = getMessage(entry);
                  const { date, time } = formatTs(entry.timestamp);
                  return (
                    <Fragment key={i}>
                      <tr
                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                        className={cn("cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors", expandedIdx === i && "bg-slate-50")}
                      >
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">
                          <span className="text-slate-300 text-[10px]">{date} </span>{time}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap"><SourceBadge source={entry.source} /></td>
                        <td className="px-2 py-2 whitespace-nowrap"><LevelBadge level={level} /></td>
                        <td className="px-2 py-2 text-slate-800 break-all">{message}</td>
                        <td className="px-2 py-2 text-slate-300 text-center">
                          <span className={cn("inline-block transition-transform text-[10px]", expandedIdx === i && "rotate-90")}>▶</span>
                        </td>
                      </tr>
                      {expandedIdx === i && (
                        <tr className="bg-slate-950 border-b border-slate-700">
                          <td colSpan={5} className="p-0">
                            <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto leading-5">
                              {JSON.stringify(entry.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 shrink-0 text-xs text-slate-400">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} across{" "}
            {sourcesWithHits} of {sourcesQueried} source{sourcesQueried !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LogsExplorer (tab content — no controls, receives config from parent) ───

export function LogsExplorer({
  environments,
  config,
  onConfigChange,
  onLabelChange,
  isActive = true,
  tabs = [],
  activeTabId,
  onTabSwitch,
  fullscreen = false,
  onFullscreenChange,
  txSearchId,
}: {
  environments: EnvWithLogApi[];
  config: TabConfig;
  onConfigChange: (updates: Partial<TabConfig>) => void;
  onLabelChange?: (label: string) => void;
  isActive?: boolean;
  tabs?: { id: number; label: string }[];
  activeTabId?: number;
  onTabSwitch?: (id: number) => void;
  fullscreen?: boolean;
  onFullscreenChange?: (v: boolean) => void;
  txSearchId?: { id: string; seq: number };
}) {
  const { env, source, sources, sourcesLoading, sourcesError, levelFilter, tailSecs, tailing, loading } = config;

  const [keywordsRaw, setKeywordsRaw] = useState("");
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Resize ──
  const [tableHeight, setTableHeight] = useState(420);
  const grow = () => setTableHeight((h) => Math.min(window.innerHeight - 100, h + 50));
  const shrink = () => setTableHeight((h) => Math.max(200, h - 50));

  // ── Transaction drill-down (from clicking inline txId in table) ──
  const [drilldown, setDrilldown] = useState<{ txId: string } | null>(null);

  // ── Transaction search from control section → load into main table ──
  useEffect(() => {
    if (!txSearchId || !env || sources.length === 0) return;

    // Stop any active tail
    onConfigChange({ tailing: false });
    workerRef.current?.postMessage({ type: "tail-stop" });

    setError("");
    onConfigChange({ loading: true });
    setEntries([]);
    setFetched(false);
    setExpandedIdx(null);

    // Determine which aggregate/individual sources to query
    const AM_INDIVIDUAL = ["am-access", "am-authentication", "am-core"];
    const IDM_INDIVIDUAL = ["idm-access", "idm-activity", "idm-authentication"];
    const amSrcs = sources.includes("am-everything") ? ["am-everything"] : AM_INDIVIDUAL.filter((s) => sources.includes(s));
    const idmSrcs = sources.includes("idm-everything") ? ["idm-everything"] : IDM_INDIVIDUAL.filter((s) => sources.includes(s));
    const querySources = [...amSrcs, ...idmSrcs];

    Promise.all(
      querySources.map((src) =>
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ env, source: src, transactionId: txSearchId.id, pageSize: 1000 }),
        })
          .then((r) => r.json())
          .then((data): LogEntry[] => {
            if (data.error || !Array.isArray(data.result)) return [];
            return (data.result as LogEntry[]).map((e) => ({ ...e, source: e.source ?? src }));
          })
          .catch(() => [] as LogEntry[])
      )
    ).then((results) => {
      const merged = results.flat().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setEntries(merged);
      setFetched(true);
      setLastUpdated(new Date());
      setPage(Infinity);
      onConfigChange({ loading: false });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txSearchId]);

  const deferredIsActive = useDeferredValue(isActive);

  // ── Web Worker ──
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker("/log-worker.js");
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as
        | { type: "entries"; entries: LogEntry[]; append: boolean }
        | { type: "status"; loading: boolean }
        | { type: "error"; message: string };

      if (msg.type === "entries") {
        startTransition(() => {
          setEntries((prev) => msg.append ? [...prev, ...msg.entries] : msg.entries);
          setFetched(true);
          setLastUpdated(new Date());
          if (!msg.append) { setExpandedIdx(null); setPage(Infinity); }
        });
      } else if (msg.type === "status") {
        onConfigChange({ loading: msg.loading });
      } else if (msg.type === "error") {
        setError(msg.message);
        onConfigChange({ loading: false });
      }
    };
    workerRef.current = worker;
    return () => worker.terminate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync tab label ──
  useEffect(() => {
    onLabelChange?.(source ? source : env);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, source]);

  // ── Fetch sources when env changes ──
  useEffect(() => {
    if (!env) return;
    workerRef.current?.postMessage({ type: "cancel" });
    onConfigChange({ sourcesLoading: true, sourcesError: "", sources: [], source: "", tailing: false });
    setEntries([]);
    setFetched(false);

    fetch(`/api/logs/sources?env=${encodeURIComponent(env)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { onConfigChange({ sourcesError: data.error, sourcesLoading: false }); return; }
        const list: string[] = Array.isArray(data.result) ? data.result : [];
        const defaultSource = list.includes("am-everything") ? "am-everything" : list[0] ?? "";
        onConfigChange({ sources: list, source: defaultSource, sourcesLoading: false });
      })
      .catch((e) => onConfigChange({ sourcesError: String(e), sourcesLoading: false }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  // ── Auto-scroll when tailing ──
  useEffect(() => {
    if (tailing && entries.length > 0 && isActive) {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [entries, tailing, isActive]);

  // ── React to tailing / tailSecs changes from parent config ──
  const prevTailing = useRef(false);

  useEffect(() => {
    if (tailing && !prevTailing.current) {
      // Start tail
      setError("");
      workerRef.current?.postMessage({ type: "tail-start", env, source, tailSecs });
    } else if (!tailing && prevTailing.current) {
      // Stop tail
      workerRef.current?.postMessage({ type: "tail-stop" });
    } else if (tailing && prevTailing.current) {
      // Restart tail (tailSecs changed)
      workerRef.current?.postMessage({ type: "tail-start", env, source, tailSecs });
    }
    prevTailing.current = tailing;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailing, tailSecs]);

  // ── Filtered entries ──
  const levelFiltered = levelFilter === "ALL"
    ? entries
    : entries.filter((e) => levelPassesFilter(getLevel(e), levelFilter));

  const filtered = search
    ? levelFiltered.filter((e) => JSON.stringify(e).toLowerCase().includes(search.toLowerCase()))
    : levelFiltered;

  // ── Pagination (page 1 = oldest, last page = newest) ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStartIdx = (currentPage - 1) * pageSize;
  const pageEndIdx = Math.min(currentPage * pageSize, filtered.length);
  const pageEntries = filtered.slice(pageStartIdx, pageEndIdx);

  useEffect(() => { setPage(Math.max(1, Math.ceil(filtered.length / pageSize))); setExpandedIdx(null); }, [search, levelFilter, filtered.length, pageSize]);

  return (
    <div className="space-y-4">
      {/* ── Tail status bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {tailing && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {loading ? "Fetching…" : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Starting…"}
          </div>
        )}
        {fetched && (
          <span className="text-xs text-slate-400">
            {filtered.length}{filtered.length !== entries.length && `/${entries.length}`}{" "}
            {entries.length === 1 ? "entry" : "entries"}
            {loading && !tailing && " · loading…"}
          </span>
        )}
        {sourcesError && <span className="text-xs text-red-500">{sourcesError}</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
        <div className="ml-auto flex items-center gap-3">
          {fetched && !tailing && (
            <>
              <button
                type="button"
                onClick={() => {
                  const data = JSON.stringify(filtered.map((e) => ({ timestamp: e.timestamp, source: e.source, type: e.type, payload: e.payload })), null, 2);
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `logs-${source}-${new Date().toISOString().slice(0, 19).replace(/:/g, "")}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm(`Clear all ${entries.length} log entries?`)) { setEntries([]); setFetched(false); setError(""); setSearch(""); setExpandedIdx(null); } }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Log window ── */}
      <div className={cn(
        "bg-white border border-slate-200 flex flex-col",
        fullscreen ? "fixed inset-0 z-50 rounded-none overflow-hidden" : "rounded-lg"
      )}>
          {/* Fullscreen tab bar */}
          {fullscreen && tabs.length > 0 && (
            <div className="flex items-end gap-0 border-b border-slate-200 bg-slate-50 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabSwitch?.(tab.id)}
                  className={cn(
                    "px-3 py-2 text-xs border-b-2 transition-colors whitespace-nowrap",
                    tab.id === activeTabId
                      ? "border-sky-600 text-slate-900 font-medium bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col border-b border-slate-100 bg-slate-50/50 shrink-0">
            {/* Row 1: tail button + keyword highlights */}
            <div className="flex items-center gap-2 px-4 py-2">
              {!tailing ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onConfigChange({ tailing: true })}
                    disabled={loading || !source || !!sourcesError}
                    className="px-3 py-1 text-xs font-medium bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Fetching…" : "Tail Logs"}
                  </button>
                  {([5, 10, 30] as TailSecs[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onConfigChange({ tailSecs: s })}
                      className={cn(
                        "px-2 py-1 text-xs rounded border transition-colors",
                        tailSecs === s
                          ? "bg-slate-700 border-slate-700 text-white"
                          : "border-slate-300 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onConfigChange({ tailing: false })}
                  className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors shrink-0"
                >
                  Stop Tail
                </button>
              )}
              <span className="text-slate-300 select-none shrink-0">|</span>
              <label className="text-xs font-medium text-slate-500 shrink-0">Highlight</label>
              <input
                type="text"
                value={keywordsRaw}
                onChange={(e) => setKeywordsRaw(e.target.value)}
                placeholder="Keywords to highlight, comma-separated…"
                className="flex-1 text-xs rounded border border-slate-200 px-2.5 py-1 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              {keywordsRaw && (
                <>
                  <span className="text-xs text-amber-600 whitespace-nowrap">
                    {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setKeywordsRaw("")}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>

            {/* Row 2: filter + count + height controls + fullscreen */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-100">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setExpandedIdx(null); }}
                placeholder="Filter entries…"
                className="flex-1 text-xs rounded border border-slate-300 px-3 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {filtered.length} / {entries.length}
              </span>
              {!fullscreen && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={shrink}
                    title="Shrink"
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={grow}
                    title="Grow"
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => onFullscreenChange?.(!fullscreen)}
                title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                {fullscreen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable log window — CSS resize handle at bottom-right corner */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "overflow-y-auto overflow-x-auto",
              fullscreen ? "flex-1" : "resize-y min-h-[200px]"
            )}
            style={fullscreen ? undefined : { height: tableHeight }}
          >
            {!fetched ? (
              <div className="flex items-center justify-center h-full min-h-[160px]">
                <p className="text-sm text-slate-400">Select a source and click Tail Logs to start</p>
              </div>
            ) : !deferredIsActive ? null : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                {entries.length === 0 ? "No log entries returned for this time range." : "No entries match the filter."}
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Timestamp</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Source</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Level</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Message</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Transaction</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {pageEntries.map((entry, i) => {
                    const globalIdx = pageStartIdx + i;
                    return (
                      <EntryRow
                        key={globalIdx}
                        entry={entry}
                        source={source}
                        expanded={expandedIdx === globalIdx}
                        onToggle={() => setExpandedIdx(expandedIdx === globalIdx ? null : globalIdx)}
                        searchTerm={search}
                        keywords={keywords}
                        onTransactionClick={(txId) => setDrilldown({ txId })}
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination controls */}
          {fetched && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Showing {pageStartIdx + 1}–{pageEndIdx} of {filtered.length}
                  {currentPage === totalPages && " (latest)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(Infinity); setExpandedIdx(null); }}
                  className="text-xs rounded border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {[50, 100, 200, 500].map((s) => (
                    <option key={s} value={s}>{s} / page</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setPage(1); setExpandedIdx(null); scrollContainerRef.current?.scrollTo(0, 0); }} disabled={currentPage <= 1} className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Oldest (page 1)">Oldest</button>
                  <button type="button" onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpandedIdx(null); scrollContainerRef.current?.scrollTo(0, 0); }} disabled={currentPage <= 1} className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Older entries">← Older</button>
                  <span className="text-xs text-slate-500 px-2 tabular-nums">{currentPage} / {totalPages}</span>
                  <button type="button" onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setExpandedIdx(null); scrollContainerRef.current?.scrollTo(0, 0); }} disabled={currentPage >= totalPages} className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Newer entries">Newer →</button>
                  <button type="button" onClick={() => { setPage(totalPages); setExpandedIdx(null); scrollContainerRef.current?.scrollTo(0, 0); }} disabled={currentPage >= totalPages} className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Latest (last page)">Latest</button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* ── Transaction drill-down modal ── */}
      {drilldown && (
        <TransactionDrilldown
          transactionId={drilldown.txId}
          env={env}
          availableSources={sources}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}

// ── Tabs wrapper with shared controls above ──────────────────────────────────

interface TabDef {
  id: number;
  label: string;
  config: TabConfig;
}

function makeDefaultConfig(environments: EnvWithLogApi[]): TabConfig {
  const defaultEnv = environments.find((e) => e.hasLogApi) ?? environments[0];
  return {
    env: defaultEnv?.name ?? "",
    source: "",
    sources: [],
    sourcesLoading: false,
    sourcesError: "",
    levelFilter: "ALL",
    tailSecs: 5,
    tailing: false,
    loading: false,
  };
}

let _nextTabId = 2;

export function LogsExplorerTabs({ environments }: { environments: EnvWithLogApi[] }) {
  const [tabs, setTabs] = useState<TabDef[]>([
    { id: 1, label: "Tab 1", config: makeDefaultConfig(environments) },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullscreen]);

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const cfg = activeTab?.config;

  const [txInput, setTxInput] = useState("");
  const [txSearch, setTxSearch] = useState<{ id: string; seq: number } | undefined>(undefined);

  function submitTxSearch() {
    const id = txInput.trim();
    if (id) setTxSearch((prev) => ({ id, seq: (prev?.seq ?? 0) + 1 }));
  }

  const updateActiveConfig = useCallback((updates: Partial<TabConfig>) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, config: { ...t.config, ...updates } } : t
      )
    );
  }, [activeId]);

  function addTab() {
    const id = _nextTabId++;
    setTabs((prev) => [...prev, { id, label: `Tab ${id}`, config: makeDefaultConfig(environments) }]);
    setActiveId(id);
  }

  function closeTab(id: number) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeId === id) {
        const idx = prev.findIndex((t) => t.id === id);
        const fallback = prev[idx + 1] ?? prev[idx - 1];
        if (fallback) setActiveId(fallback.id);
      }
      return next;
    });
  }

  function updateLabel(id: number, label: string) {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }

  const selectedEnv = environments.find((e) => e.name === cfg?.env);

  return (
    <div className="space-y-0">
      {/* ── Controls (above tabs) ── */}
      {cfg && (
        <div className="bg-white rounded-t-lg border border-b-0 border-slate-200 p-4 space-y-4">
          {/* Row 1: env + source + level */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Environment</label>
              <select
                value={cfg.env}
                onChange={(e) => updateActiveConfig({ env: e.target.value, tailing: false })}
                disabled={cfg.loading || cfg.tailing}
                className="block rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {environments.map((e) => (
                  <option key={e.name} value={e.name} disabled={!e.hasLogApi}>
                    {e.label}{!e.hasLogApi ? " (no credentials)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Log Source</label>
              <select
                value={cfg.source}
                onChange={(e) => updateActiveConfig({ source: e.target.value, tailing: false })}
                disabled={cfg.loading || cfg.tailing || cfg.sourcesLoading || cfg.sources.length === 0}
                className="block rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 min-w-[180px]"
              >
                {cfg.sourcesLoading && <option>Loading sources…</option>}
                {!cfg.sourcesLoading && cfg.sources.length === 0 && <option>No sources available</option>}
                {cfg.sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Min Level</label>
              <select
                value={cfg.levelFilter}
                onChange={(e) => updateActiveConfig({ levelFilter: e.target.value })}
                className="block rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {LEVEL_FILTERS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {selectedEnv && (
              <div className="pb-0.5">
                <EnvironmentBadge env={selectedEnv} />
              </div>
            )}
          </div>

          {/* Row 2: transaction ID search */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 shrink-0">Transaction ID</label>
            <input
              type="text"
              value={txInput}
              onChange={(e) => setTxInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTxSearch(); }}
              placeholder="Paste a transaction ID to trace…"
              className="text-xs rounded border border-slate-300 px-3 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 w-96"
            />
            <button
              type="button"
              onClick={submitTxSearch}
              disabled={!txInput.trim() || !cfg?.env}
              className="px-3 py-1.5 text-xs font-medium bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Trace
            </button>
            {txInput && (
              <button type="button" onClick={() => { setTxInput(""); setTxSearch(undefined); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex items-end gap-0 border-b border-slate-200 bg-white border-x border-slate-200">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 cursor-pointer select-none transition-colors",
              tab.id === activeId
                ? "border-sky-600 text-slate-900 font-medium bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <span onClick={() => setActiveId(tab.id)} className="max-w-[160px] truncate">
              {tab.label}
            </span>
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="text-slate-300 hover:text-slate-500 leading-none text-sm ml-0.5"
                title="Close tab"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTab}
          className="px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-base leading-none transition-colors"
          title="New tab"
        >
          +
        </button>
      </div>

      {/* ── Tab panels ── */}
      {tabs.map((tab) => (
        <div key={tab.id} className={tab.id === activeId ? "" : "hidden"}>
          <div className="pt-4">
            <LogsExplorer
              environments={environments}
              config={tab.config}
              onConfigChange={(updates) =>
                setTabs((prev) =>
                  prev.map((t) =>
                    t.id === tab.id ? { ...t, config: { ...t.config, ...updates } } : t
                  )
                )
              }
              isActive={tab.id === activeId}
              onLabelChange={(label) => updateLabel(tab.id, label)}
              tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
              activeTabId={activeId}
              onTabSwitch={setActiveId}
              fullscreen={fullscreen}
              onFullscreenChange={setFullscreen}
              txSearchId={tab.id === activeId ? txSearch : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
