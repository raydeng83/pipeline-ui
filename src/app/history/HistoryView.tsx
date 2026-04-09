"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Environment } from "@/lib/fr-config-types";
import type { HistoryRecord, HistoryDetail, ScopeDetail } from "@/lib/history";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Filter bar ───────────────────────────────────────────────────────────────

type TypeFilter = "all" | "pull" | "push" | "compare" | "log-search";

function FilterBar({
  environments,
  envFilter,
  typeFilter,
  onEnvChange,
  onTypeChange,
}: {
  environments: Environment[];
  envFilter: string;
  typeFilter: TypeFilter;
  onEnvChange: (v: string) => void;
  onTypeChange: (v: TypeFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={envFilter}
        onChange={(e) => onEnvChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <option value="">All Environments</option>
        {environments.map((env) => (
          <option key={env.name} value={env.name}>
            {env.label}
          </option>
        ))}
      </select>

      <div className="flex rounded-md border border-slate-300 overflow-hidden">
        {(["all", "pull", "push", "compare", "log-search"] as TypeFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              typeFilter === t
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t === "all" ? "All" : t === "log-search" ? "Log Search" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Scope detail panel ───────────────────────────────────────────────────────

function ScopeDetailPanel({ scopeDetails }: { scopeDetails: Record<string, ScopeDetail> }) {
  const scopes = Object.entries(scopeDetails);
  if (scopes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scope Changes</div>
      {scopes.map(([scope, detail]) => {
        const hasItems = detail.added.length + detail.modified.length + detail.deleted.length > 0;
        return (
          <div key={scope}>
            <div className="text-xs font-semibold text-slate-600 mb-1">{scope}</div>
            {hasItems ? (
              <div className="font-mono text-xs space-y-0.5 pl-2">
                {detail.added.map((name) => (
                  <div key={`a-${name}`} className="text-emerald-600">+ {name}</div>
                ))}
                {detail.modified.map((name) => (
                  <div key={`m-${name}`} className="text-amber-600">~ {name}</div>
                ))}
                {detail.deleted.map((name) => (
                  <div key={`d-${name}`} className="text-red-500">- {name}</div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 pl-2">all items</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Compare summary panel ────────────────────────────────────────────────────

function CompareDetailPanel({ detail }: { detail: HistoryDetail }) {
  const report = detail.compareReport;
  if (!report) return <div className="text-xs text-slate-400">No compare data available.</div>;

  const { summary, files } = report;
  const changedFiles = files.filter((f) => f.status !== "unchanged");

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compare Results</div>
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-600 font-medium">{summary.added} added</span>
        <span className="text-red-500 font-medium">{summary.removed} removed</span>
        <span className="text-amber-600 font-medium">{summary.modified} modified</span>
        <span className="text-slate-400">{summary.unchanged} unchanged</span>
      </div>
      {changedFiles.length > 0 && (
        <div className="font-mono text-xs space-y-0.5 pl-2 max-h-64 overflow-y-auto">
          {changedFiles.map((f) => (
            <div
              key={f.relativePath}
              className={cn(
                f.status === "added" && "text-emerald-600",
                f.status === "removed" && "text-red-500",
                f.status === "modified" && "text-amber-600"
              )}
            >
              {f.status === "added" ? "+" : f.status === "removed" ? "-" : "~"} {f.relativePath}
              {f.linesAdded || f.linesRemoved ? (
                <span className="text-slate-400 ml-2">
                  (+{f.linesAdded ?? 0} -{f.linesRemoved ?? 0})
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Log search detail panel ──────────────────────────────────────────────────

function LogSearchDetailPanel({ record, detail }: { record: HistoryRecord; detail: HistoryDetail }) {
  const entries = detail.logSearchEntries ?? [];
  const [showCount, setShowCount] = useState(50);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Log Search Results</div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {record.logSource && <span>Source: <span className="font-mono text-slate-700">{record.logSource}</span></span>}
        {record.logMode && <span>Mode: <span className="font-medium text-slate-700">{record.logMode}</span></span>}
        {record.logPreset && <span>Range: <span className="font-medium text-slate-700">{record.logPreset}</span></span>}
        <span>{(record.logEntryCount ?? entries.length).toLocaleString()} entries</span>
      </div>
      {entries.length > 0 ? (
        <div className="font-mono text-xs bg-slate-900 rounded p-3 max-h-80 overflow-y-auto space-y-0.5">
          {(entries as Array<{ timestamp?: string; payload?: Record<string, unknown> | string; source?: string }>).slice(0, showCount).map((entry, i) => {
            const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
            const msg = typeof entry.payload === "string"
              ? entry.payload
              : typeof entry.payload === "object" && entry.payload
              ? (entry.payload.message as string) ?? (entry.payload.eventName as string) ?? JSON.stringify(entry.payload).slice(0, 120)
              : "";
            return (
              <div key={i} className="text-slate-300 whitespace-pre-wrap break-all leading-5">
                <span className="text-slate-500">{ts}</span>
                {entry.source && <span className="text-purple-400 ml-2">{entry.source}</span>}
                <span className="ml-2">{msg}</span>
              </div>
            );
          })}
          {entries.length > showCount && (
            <button
              type="button"
              onClick={() => setShowCount((c) => c + 100)}
              className="text-sky-400 hover:text-sky-300 mt-2"
            >
              Show more ({entries.length - showCount} remaining)
            </button>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400">No entries stored.</div>
      )}
    </div>
  );
}

// ── Log search helpers ───────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

// ── Log panel ────────────────────────────────────────────────────────────────

function LogPanel({ detail }: { detail: HistoryDetail }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const logs = detail.logs;
  if (!logs || logs.length === 0) return null;

  const query = search.trim().toLowerCase();
  const filteredLogs = query
    ? logs.filter((e) => {
        const text = e.data ?? e.message ?? e.scope ?? "";
        return text.toLowerCase().includes(query);
      })
    : logs;

  function renderText(text: string | undefined) {
    if (!text) return null;
    return search ? highlightMatches(text, search) : text;
  }

  return (
    <div className="border-t border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-0 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg
          className={cn("w-3 h-3 transition-transform shrink-0", open ? "" : "-rotate-90")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        Logs ({logs.length} entries)
      </button>
      {open && (
        <div className="space-y-0">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-t">
            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="flex-1 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 outline-none"
            />
            {search && (
              <>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
                </span>
                <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="font-mono text-xs bg-slate-900 rounded-b p-3 max-h-64 overflow-y-auto space-y-0.5">
            {filteredLogs.map((entry, i) => {
              if (entry.type === "stdout") {
                return <div key={i} className="text-slate-300 whitespace-pre-wrap break-all">{renderText(entry.data)}</div>;
              }
              if (entry.type === "stderr" || entry.type === "error") {
                return <div key={i} className="text-red-400 whitespace-pre-wrap break-all">{renderText(entry.data)}</div>;
              }
              if (entry.type === "git") {
                return <div key={i} className="text-emerald-400">{renderText(entry.message)}</div>;
              }
              if (entry.type === "scope-start") {
                return <div key={i} className="text-sky-400 mt-1">▶ {renderText(entry.scope)}</div>;
              }
              if (entry.type === "scope-end") {
                return <div key={i} className={entry.code === 0 ? "text-green-400" : "text-red-400"}>■ {renderText(entry.scope)} — exit {entry.code}</div>;
              }
              return null;
            })}
            {query && filteredLogs.length === 0 && (
              <div className="text-slate-600 py-2">No matching log entries</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expanded detail (fetches on demand) ──────────────────────────────────────

function ExpandedDetail({ record }: { record: HistoryRecord }) {
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  const fetchDetail = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${record.id}`);
      if (!res.ok) throw new Error("Not found");
      setDetail(await res.json());
    } catch {
      setError("Could not load details.");
    } finally {
      setLoading(false);
    }
  }, [record.id]);

  // Fetch on first render
  if (!fetched.current && !loading && !error) {
    fetchDetail();
  }

  if (loading) {
    return (
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
        Loading details…
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
        {error ?? "No details available."}
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-4">
      {/* Scope details for pull/push */}
      {detail.scopeDetails && Object.keys(detail.scopeDetails).length > 0 && (
        <ScopeDetailPanel scopeDetails={detail.scopeDetails} />
      )}

      {/* Compare report */}
      {record.type === "compare" && <CompareDetailPanel detail={detail} />}

      {/* Log search results */}
      {record.type === "log-search" && <LogSearchDetailPanel record={record} detail={detail} />}

      {/* Operation logs */}
      {record.type !== "log-search" && <LogPanel detail={detail} />}
    </div>
  );
}

// ── Record row ───────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  pull: { bg: "bg-sky-100 text-sky-700", label: "Pull" },
  push: { bg: "bg-emerald-100 text-emerald-700", label: "Push" },
  compare: { bg: "bg-violet-100 text-violet-700", label: "Compare" },
  "log-search": { bg: "bg-amber-100 text-amber-700", label: "Log Search" },
};

function RecordRow({
  record,
  environment,
  expanded,
  onToggle,
}: {
  record: HistoryRecord;
  environment: Environment | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const envColorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  const badge = TYPE_BADGE[record.type] ?? TYPE_BADGE.pull;

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div
        className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        {/* Type badge */}
        <span className={cn("shrink-0 px-2 py-0.5 rounded text-xs font-medium", badge.bg)}>
          {badge.label}
        </span>

        {/* Environment badge */}
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
            environment
              ? envColorMap[environment.color] ?? "bg-slate-100 text-slate-700"
              : "bg-slate-100 text-slate-700"
          )}
        >
          {environment?.label ?? record.environment}
        </span>

        {/* Summary */}
        <span className="flex-1 text-sm text-slate-700 truncate">
          {record.summary}
        </span>

        {/* Status */}
        <span className="shrink-0">
          {record.status === "success" ? (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>

        {/* Duration */}
        <span className="shrink-0 text-xs text-slate-400 font-mono tabular-nums w-14 text-right">
          {formatDuration(record.duration)}
        </span>

        {/* Commit hash */}
        {record.commitHash && (
          <code className="shrink-0 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            {record.commitHash}
          </code>
        )}

        {/* Timestamp */}
        <span
          className="shrink-0 text-xs text-slate-400 w-20 text-right"
          title={formatTimestamp(record.startedAt)}
        >
          {relativeTime(record.startedAt)}
        </span>

        {/* Chevron */}
        <svg
          className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", expanded ? "" : "-rotate-90")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && <ExpandedDetail record={record} />}
    </div>
  );
}

// ── Pagination bar ───────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function PaginationBar({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex-wrap gap-2">
      <span>
        {total === 0 ? "0 results" : `${from}–${to} of ${total}`}
      </span>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(0)}
            disabled={page === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="First page"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="px-2 tabular-nums">
            {totalPages === 0 ? "0 / 0" : `${page + 1} / ${totalPages}`}
          </span>

          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => onPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
            title="Last page"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function HistoryView({
  environments,
  history,
}: {
  environments: Environment[];
  history: HistoryRecord[];
}) {
  const [envFilter, setEnvFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    let records = history;
    if (envFilter) records = records.filter((r) => r.environment.includes(envFilter));
    if (typeFilter !== "all") records = records.filter((r) => r.type === typeFilter);
    return records;
  }, [history, envFilter, typeFilter]);

  // Reset to page 0 when filters or page size change
  const handleEnvChange = (v: string) => { setEnvFilter(v); setPage(0); setExpandedId(null); };
  const handleTypeChange = (v: TypeFilter) => { setTypeFilter(v); setPage(0); setExpandedId(null); };
  const handlePageSize = (s: number) => { setPageSize(s); setPage(0); setExpandedId(null); };
  const handlePage = (p: number) => { setPage(p); setExpandedId(null); };

  const paginated = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize]
  );

  const envMap = useMemo(() => {
    const map = new Map<string, Environment>();
    for (const e of environments) map.set(e.name, e);
    return map;
  }, [environments]);

  return (
    <div className="space-y-4">
      <FilterBar
        environments={environments}
        envFilter={envFilter}
        typeFilter={typeFilter}
        onEnvChange={handleEnvChange}
        onTypeChange={handleTypeChange}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {paginated.length > 0 ? (
          <>
            {paginated.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                environment={envMap.get(record.environment)}
                expanded={expandedId === record.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === record.id ? null : record.id))
                }
              />
            ))}
            <PaginationBar
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPage={handlePage}
              onPageSize={handlePageSize}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-slate-400">
            {history.length === 0
              ? "No operations recorded yet."
              : "No results match the selected filters."}
          </div>
        )}
      </div>
    </div>
  );
}
