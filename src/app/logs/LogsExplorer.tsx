"use client";

import { useState, useEffect, useCallback } from "react";
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
  payload: Record<string, unknown>;
}

type Preset = "15m" | "1h" | "6h" | "24h" | "custom";

const PRESETS: { label: string; value: Preset; ms: number }[] = [
  { label: "15 min", value: "15m", ms: 15 * 60 * 1000 },
  { label: "1 hour", value: "1h", ms: 60 * 60 * 1000 },
  { label: "6 hours", value: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "24 hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Custom", value: "custom", ms: 0 },
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
  if (typeof payload.eventName === "string") {
    const parts: string[] = [payload.eventName as string];
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
    const parts = (payload.logger as string).split(".");
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

// ── Level badge ───────────────────────────────────────────────────────────────

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

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  source,
  expanded,
  onToggle,
  searchTerm,
}: {
  entry: LogEntry;
  source: string;
  expanded: boolean;
  onToggle: () => void;
  searchTerm: string;
}) {
  const level = getLevel(entry.payload);
  const message = getMessage(entry.payload);
  const component = getComponent(entry.payload, source);
  const transactionId = getTransactionId(entry.payload);
  const userId = getUserId(entry.payload);
  const { date, time } = formatTs(entry.timestamp);

  const rawJson = JSON.stringify(entry.payload, null, 2);

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
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer text-xs border-b border-slate-100 hover:bg-slate-50 transition-colors",
          expanded && "bg-slate-50"
        )}
      >
        {/* Timestamp */}
        <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap align-top">
          <span className="text-slate-300 text-[10px]">{date} </span>{time}
        </td>
        {/* Level */}
        <td className="px-2 py-2 whitespace-nowrap align-top">
          <LevelBadge level={level} />
        </td>
        {/* Component */}
        <td className="px-2 py-2 text-slate-500 whitespace-nowrap align-top max-w-[180px] truncate font-mono text-[11px]">
          {highlight(component)}
        </td>
        {/* Message */}
        <td className="px-2 py-2 text-slate-800 align-top">
          <span className="line-clamp-2 break-all">{highlight(message)}</span>
          {userId && (
            <span className="text-slate-400 font-mono text-[10px] block mt-0.5">{highlight(userId)}</span>
          )}
        </td>
        {/* Transaction ID */}
        <td className="px-2 py-2 text-slate-400 font-mono text-[10px] whitespace-nowrap align-top max-w-[140px] truncate">
          {transactionId ? highlight(transactionId.slice(0, 16) + (transactionId.length > 16 ? "…" : "")) : ""}
        </td>
        {/* Expand indicator */}
        <td className="px-2 py-2 text-slate-300 align-top text-center">
          <span className={cn("inline-block transition-transform text-[10px]", expanded && "rotate-90")}>▶</span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-950 border-b border-slate-700">
          <td colSpan={6} className="p-0">
            <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto leading-5">
              {rawJson}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Datetime-local helpers ────────────────────────────────────────────────────

function toDatetimeLocal(iso: string): string {
  // "2024-01-01T12:00:00.000Z" → "2024-01-01T12:00"
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string {
  return val ? new Date(val).toISOString() : "";
}

// ── Main component ────────────────────────────────────────────────────────────

export function LogsExplorer({ environments }: { environments: EnvWithLogApi[] }) {
  const defaultEnv = environments.find((e) => e.hasLogApi) ?? environments[0];

  const [env, setEnv] = useState(defaultEnv?.name ?? "");
  const [sources, setSources] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState("");
  const [source, setSource] = useState("");

  const [preset, setPreset] = useState<Preset>("1h");
  const [customBegin, setCustomBegin] = useState(() => toDatetimeLocal(new Date(Date.now() - 3600000).toISOString()));
  const [customEnd, setCustomEnd] = useState(() => toDatetimeLocal(new Date().toISOString()));

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [cookie, setCookie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
      return {
        beginTime: fromDatetimeLocal(customBegin),
        endTime: fromDatetimeLocal(customEnd),
      };
    }
    const ms = PRESETS.find((p) => p.value === preset)!.ms;
    const now = new Date();
    return {
      beginTime: new Date(now.getTime() - ms).toISOString(),
      endTime: now.toISOString(),
    };
  }

  // ── Fetch logs ──
  const fetchLogs = useCallback(async (append = false, overrideCookie?: string | null) => {
    if (!env || !source) return;
    const { beginTime, endTime } = getRange();

    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          env,
          source,
          beginTime,
          endTime,
          pageSize: 50,
          cookie: append ? (overrideCookie ?? cookie) : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }

      const newEntries: LogEntry[] = Array.isArray(data.result) ? data.result : [];
      setEntries((prev) => append ? [...prev, ...newEntries] : newEntries);
      setCookie(data.pagedResultsCookie ?? null);
      setFetched(true);
      setExpandedIdx(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, source, preset, customBegin, customEnd, cookie]);

  // ── Filtered entries ──
  const filtered = search
    ? entries.filter((e) => JSON.stringify(e).toLowerCase().includes(search.toLowerCase()))
    : entries;

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
              onChange={(e) => setEnv(e.target.value)}
              disabled={loading}
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
              onChange={(e) => setSource(e.target.value)}
              disabled={loading || sourcesLoading || sources.length === 0}
              className="block rounded border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 min-w-[180px]"
            >
              {sourcesLoading && <option>Loading sources…</option>}
              {!sourcesLoading && sources.length === 0 && <option>No sources available</option>}
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
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
              onClick={() => setPreset(p.value)}
              className={cn(
                "px-2.5 py-1 text-xs rounded border transition-colors",
                preset === p.value
                  ? "bg-sky-600 border-sky-600 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
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

        {/* Row 3: fetch button + errors */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fetchLogs(false)}
            disabled={loading || !source || !!sourcesError}
            className="px-4 py-1.5 text-sm font-medium bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Fetching…" : "Fetch Logs"}
          </button>
          {fetched && !loading && (
            <span className="text-xs text-slate-400">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} retrieved
              {filtered.length !== entries.length && ` · ${filtered.length} matching`}
            </span>
          )}
          {sourcesError && (
            <span className="text-xs text-red-500">{sourcesError}</span>
          )}
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
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
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
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
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Load more */}
          {cookie && !search && (
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
    </div>
  );
}
