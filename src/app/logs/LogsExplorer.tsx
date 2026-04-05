"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
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
  source?: string;  // per-entry source (present in am-everything and idm-everything responses)
  payload: Record<string, unknown>;
}

type Preset = "15m" | "1h" | "6h" | "24h" | "custom";
type TailSecs = 5 | 10 | 30;

// Client-side level filter: severity order (higher index = less severe)
const LEVEL_ORDER = ["FATAL", "ERROR", "WARN", "WARNING", "INFO", "INFORMATION", "CONFIG", "DEBUG", "TRACE"];

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
  if (idx === -1) return true; // unknown level — show it
  if (minIdx === -1) return true;
  return idx <= minIdx;
}

const PRESETS: { label: string; value: Preset; ms: number }[] = [
  { label: "15 min", value: "15m", ms: 15 * 60 * 1000 },
  { label: "1 hour", value: "1h", ms: 60 * 60 * 1000 },
  { label: "6 hours", value: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "24 hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Custom", value: "custom", ms: 0 },
];

// Sources queried for transaction drill-down
const TRANSACTION_SOURCES = [
  "am-access", "am-authentication", "am-core",
  "idm-access", "idm-activity", "idm-authentication",
];

// ── Field extraction ──────────────────────────────────────────────────────────

function getLevel(payload: Record<string, unknown>): string {
  if (typeof payload.level === "string") return payload.level.toUpperCase();
  if (typeof payload.severity === "string") return payload.severity.toUpperCase();
  if (payload.result === "FAILED" || payload.result === "false") return "WARN";
  const resp = payload.response as Record<string, unknown> | undefined;
  if (resp?.status === "FAILED") return "WARN";
  return "INFO";
}

function getMessage(payload: Record<string, unknown>): string {
  if (typeof payload.message === "string" && payload.message) return payload.message;
  const eventName = payload.eventName as string | undefined;
  if (eventName === "AM-NODE-LOGIN-COMPLETED") {
    const entries = payload.entries as Array<{ info?: Record<string, string> }> | undefined;
    const info = entries?.[0]?.info;
    if (info?.displayName) return `${info.displayName} → ${info.nodeOutcome ?? ""}`;
  }
  if (eventName) {
    const parts: string[] = [eventName];
    if (typeof payload.result === "string") parts.push(`→ ${payload.result}`);
    const userId = payload.userId;
    if (typeof userId === "string" && userId) parts.push(`[${userId}]`);
    return parts.join(" ");
  }
  const req = payload.request as Record<string, unknown> | undefined;
  if (typeof req?.path === "string") return `${payload.http_method ?? ""} ${req.path}`.trim();
  return "(no message)";
}

function getComponent(payload: Record<string, unknown>, source: string): string {
  if (typeof payload.component === "string" && payload.component) return payload.component;
  if (typeof payload.logger === "string" && payload.logger) {
    // Extract script name from: scripts.TYPE.uuid.(ScriptName)
    const match = payload.logger.match(/\(([^)]+)\)$/);
    if (match) return match[1];
    const parts = payload.logger.split(".");
    return parts[parts.length - 1];
  }
  return source;
}

function getTransactionId(payload: Record<string, unknown>): string {
  if (typeof payload.transactionId === "string") return payload.transactionId;
  return "";
}

function getUserId(payload: Record<string, unknown>): string {
  if (typeof payload.userId === "string" && payload.userId) return payload.userId;
  if (Array.isArray(payload.principal) && payload.principal.length > 0) return String(payload.principal[0]);
  return "";
}

// ── Badges ────────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  ERROR: "bg-red-100 text-red-700 border border-red-200",
  FATAL: "bg-red-100 text-red-700 border border-red-200",
  WARN: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  WARNING: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  INFO: "bg-sky-50 text-sky-700 border border-sky-200",
  DEBUG: "bg-slate-100 text-slate-600 border border-slate-200",
  TRACE: "bg-slate-100 text-slate-500 border border-slate-200",
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

// ── Timestamp formatting ──────────────────────────────────────────────────────

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

// ── Datetime-local helpers ────────────────────────────────────────────────────

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string {
  return val ? new Date(val).toISOString() : "";
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  source,
  expanded,
  onToggle,
  searchTerm,
  onTransactionClick,
}: {
  entry: LogEntry;
  source: string;
  expanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  onTransactionClick: (txId: string, timestamp: string) => void;
}) {
  const effectiveSource = entry.source ?? source;
  const level = getLevel(entry.payload);
  const message = getMessage(entry.payload);
  const component = getComponent(entry.payload, effectiveSource);
  const transactionId = getTransactionId(entry.payload);
  const userId = getUserId(entry.payload);
  const { date, time } = formatTs(entry.timestamp);

  function highlight(text: string) {
    if (!searchTerm) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-inherit rounded-sm">{text.slice(idx, idx + searchTerm.length)}</mark>
        {text.slice(idx + searchTerm.length)}
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
        <td className="px-2 py-2 text-slate-500 whitespace-nowrap align-top max-w-[180px] truncate font-mono text-[11px]">
          {highlight(component)}
        </td>
        <td className="px-2 py-2 text-slate-800 align-top">
          <span className="line-clamp-2 break-all">{highlight(message)}</span>
          {userId && (
            <span className="text-slate-400 font-mono text-[10px] block mt-0.5">{highlight(userId)}</span>
          )}
        </td>
        <td className="px-2 py-2 whitespace-nowrap align-top">
          {transactionId ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTransactionClick(transactionId, entry.timestamp); }}
              className="font-mono text-[10px] text-sky-600 hover:text-sky-800 hover:underline truncate max-w-[130px] block"
              title={transactionId}
            >
              {transactionId.slice(0, 16)}{transactionId.length > 16 ? "…" : ""}
            </button>
          ) : null}
        </td>
        <td className="px-2 py-2 text-slate-300 align-top text-center">
          <span className={cn("inline-block transition-transform text-[10px]", expanded && "rotate-90")}>▶</span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-950 border-b border-slate-700">
          <td colSpan={7} className="p-0">
            <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto leading-5">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// ── Transaction drill-down modal ──────────────────────────────────────────────

function TransactionDrilldown({
  transactionId,
  timestamp,
  env,
  availableSources,
  onClose,
}: {
  transactionId: string;
  timestamp: string;
  env: string;
  availableSources: string[];
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<(LogEntry & { source: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sources = TRANSACTION_SOURCES.filter((s) => availableSources.includes(s));

  useEffect(() => {
    if (sources.length === 0) {
      setError("No relevant log sources available for this environment.");
      setLoading(false);
      return;
    }

    const center = new Date(timestamp).getTime();
    const beginTime = new Date(center - 5 * 60 * 1000).toISOString();
    const endTime = new Date(center + 5 * 60 * 1000).toISOString();

    Promise.all(
      sources.map((src) =>
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ env, source: src, beginTime, endTime, pageSize: 100 }),
        })
          .then((r) => r.json())
          .then((data): (LogEntry & { source: string })[] => {
            if (data.error || !Array.isArray(data.result)) return [];
            return (data.result as LogEntry[])
              .filter((e) => getTransactionId(e.payload) === transactionId)
              .map((e) => ({ ...e, source: src }));
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-700 shrink-0">Transaction Trace</span>
            <code className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
              {transactionId}
            </code>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Querying {sourcesQueried} source{sourcesQueried !== 1 ? "s" : ""}…
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-500">{error}</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No entries found for this transaction ID in the ±5 min window.
            </div>
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
                  const level = getLevel(entry.payload);
                  const message = getMessage(entry.payload);
                  const { date, time } = formatTs(entry.timestamp);
                  return (
                    <Fragment key={i}>
                      <tr
                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                        className={cn(
                          "cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors",
                          expandedIdx === i && "bg-slate-50"
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">
                          <span className="text-slate-300 text-[10px]">{date} </span>{time}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <SourceBadge source={entry.source} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <LevelBadge level={level} />
                        </td>
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

        {/* Footer */}
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 shrink-0 text-xs text-slate-400">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} across{" "}
            {sourcesWithHits} of {sourcesQueried} sources
            {" · "}±5 min around {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LogsExplorer({ environments }: { environments: EnvWithLogApi[] }) {
  const defaultEnv = environments.find((e) => e.hasLogApi) ?? environments[0];

  const [env, setEnv] = useState(defaultEnv?.name ?? "");
  const [sources, setSources] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState("");
  const [source, setSource] = useState("");

  const [levelFilter, setLevelFilter] = useState("INFO");

  const [preset, setPreset] = useState<Preset>("1h");
  const [customBegin, setCustomBegin] = useState(() => toDatetimeLocal(new Date(Date.now() - 3600000).toISOString()));
  const [customEnd, setCustomEnd] = useState(() => toDatetimeLocal(new Date().toISOString()));

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [cookie, setCookie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // ── Live tail ──
  const [tailing, setTailing] = useState(false);
  const tailingRef = useRef(false);
  const [tailSecs, setTailSecs] = useState<TailSecs>(10);
  const tailIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchLogsRef = useRef<(append?: boolean) => void>(() => {});
  const tableEndRef = useRef<HTMLDivElement>(null);

  // ── Transaction drill-down ──
  const [drilldown, setDrilldown] = useState<{ txId: string; timestamp: string } | null>(null);

  // ── Fetch sources when env changes ──
  useEffect(() => {
    if (!env) return;
    setSourcesLoading(true);
    setSourcesError("");
    setSources([]);
    setSource("");
    setEntries([]);
    setCookie(null);
    setFetched(false);
    setTailing(false);

    fetch(`/api/logs/sources?env=${encodeURIComponent(env)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setSourcesError(data.error); return; }
        const list: string[] = Array.isArray(data.result) ? data.result : [];
        setSources(list);
        setSource(list[0] ?? "");
      })
      .catch((e) => setSourcesError(String(e)))
      .finally(() => setSourcesLoading(false));
  }, [env]);

  // ── Time range ──
  function getRange(): { beginTime: string; endTime: string } {
    if (preset === "custom") {
      return { beginTime: fromDatetimeLocal(customBegin), endTime: fromDatetimeLocal(customEnd) };
    }
    const ms = PRESETS.find((p) => p.value === preset)!.ms;
    const now = new Date();
    return { beginTime: new Date(now.getTime() - ms).toISOString(), endTime: now.toISOString() };
  }

  // ── Fetch logs ──
  const fetchLogs = useCallback(async (append = false) => {
    if (!env || !source) return;

    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const body = tailingRef.current
        ? { env, source, tail: true, cookie: append ? cookie : undefined }
        : (() => {
            const { beginTime, endTime } = getRange();
            return { env, source, beginTime, endTime, pageSize: 50, cookie: append ? cookie : undefined };
          })();

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const newEntries: LogEntry[] = Array.isArray(data.result) ? data.result : [];
      setEntries((prev) => append ? [...prev, ...newEntries] : newEntries);
      setCookie(data.pagedResultsCookie ?? null);
      setFetched(true);
      setLastUpdated(new Date());
      if (!append) setExpandedIdx(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, source, preset, customBegin, customEnd, cookie]);

  // Keep ref up-to-date so tail interval always calls latest version
  useEffect(() => { fetchLogsRef.current = fetchLogs; }, [fetchLogs]);

  // ── Auto-scroll when tailing ──
  useEffect(() => {
    if (tailing && entries.length > 0) {
      tableEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, tailing]);

  // ── Tail interval ──
  useEffect(() => {
    if (!tailing) return;
    const id = setInterval(() => fetchLogsRef.current(false), tailSecs * 1000);
    tailIntervalRef.current = id;
    return () => clearInterval(id);
  }, [tailing, tailSecs]);

  // ── Stop tail on unmount ──
  useEffect(() => () => {
    if (tailIntervalRef.current) clearInterval(tailIntervalRef.current);
  }, []);

  const stopTail = () => {
    tailingRef.current = false;
    setTailing(false);
    if (tailIntervalRef.current) { clearInterval(tailIntervalRef.current); tailIntervalRef.current = null; }
  };

  const startTail = () => {
    tailingRef.current = true;
    setTailing(true);
    fetchLogsRef.current(false); // immediate first fetch
  };

  // ── Filtered entries ──
  const levelFiltered = levelFilter === "ALL"
    ? entries
    : entries.filter((e) => levelPassesFilter(getLevel(e.payload), levelFilter));

  const filtered = search
    ? levelFiltered.filter((e) => JSON.stringify(e).toLowerCase().includes(search.toLowerCase()))
    : levelFiltered;

  const selectedEnv = environments.find((e) => e.name === env);

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        {/* Row 1: env + source */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Environment</label>
            <select
              value={env}
              onChange={(e) => { stopTail(); setEnv(e.target.value); }}
              disabled={loading || tailing}
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
              value={source}
              onChange={(e) => { stopTail(); setSource(e.target.value); }}
              disabled={loading || tailing || sourcesLoading || sources.length === 0}
              className="block rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 min-w-[180px]"
            >
              {sourcesLoading && <option>Loading sources…</option>}
              {!sourcesLoading && sources.length === 0 && <option>No sources available</option>}
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Min Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
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

        {/* Row 2: time range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600 mr-1">Time range:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { stopTail(); setPreset(p.value); }}
              disabled={tailing}
              className={cn(
                "px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-40",
                preset === p.value
                  ? "bg-sky-600 border-sky-600 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && !tailing && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">From</label>
              <input
                type="datetime-local"
                value={customBegin}
                onChange={(e) => setCustomBegin(e.target.value)}
                className="block rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">To</label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="block rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* Row 3: fetch + tail controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {!tailing ? (
            <>
              <button
                type="button"
                onClick={() => fetchLogs(false)}
                disabled={loading || !source || !!sourcesError}
                className="px-4 py-1.5 text-sm font-medium bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Fetching…" : "Fetch Logs"}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startTail}
                  disabled={loading || !source || !!sourcesError}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Tail
                </button>
                {([5, 10, 30] as TailSecs[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTailSecs(s)}
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={stopTail}
                className="px-4 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Stop Tail
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {loading ? "Fetching…" : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Starting…"}
              </div>
            </>
          )}

          {fetched && !loading && !tailing && (
            <span className="text-xs text-slate-400">
              {filtered.length}{filtered.length !== entries.length && `/${entries.length}`}{" "}
              {filtered.length === 1 ? "entry" : "entries"}
            </span>
          )}
          {sourcesError && <span className="text-xs text-red-500">{sourcesError}</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      {/* ── Results ── */}
      {fetched && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
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
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              {entries.length === 0 ? "No log entries returned for this time range." : "No entries match the filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Timestamp</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Source</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Level</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Component</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Message</th>
                    <th className="px-2 py-2 font-semibold text-slate-500">Transaction</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <EntryRow
                      key={i}
                      entry={entry}
                      source={source}
                      expanded={expandedIdx === i}
                      onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      searchTerm={search}
                      onTransactionClick={(txId, ts) => setDrilldown({ txId, timestamp: ts })}
                    />
                  ))}
                </tbody>
              </table>
              <div ref={tableEndRef} />
            </div>
          )}

          {/* Load more (not shown while tailing) */}
          {cookie && !search && !tailing && (
            <div className="flex items-center justify-center px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => fetchLogs(true)}
                disabled={loadingMore}
                className="px-4 py-1.5 text-xs font-medium rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Transaction drill-down modal ── */}
      {drilldown && (
        <TransactionDrilldown
          transactionId={drilldown.txId}
          timestamp={drilldown.timestamp}
          env={env}
          availableSources={sources}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}
