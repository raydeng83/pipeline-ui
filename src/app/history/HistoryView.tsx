"use client";

import { useMemo, useState } from "react";
import type { Environment } from "@/lib/fr-config-types";
import type { HistoryRecord } from "@/lib/op-history";
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
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Types / badges ───────────────────────────────────────────────────────────

type TypeFilter = "all" | "pull" | "push" | "compare" | "promote" | "log-search";

const TYPE_BADGE: Record<string, { bg: string; label: string }> = {
  pull: { bg: "bg-sky-100 text-sky-700", label: "Pull" },
  push: { bg: "bg-emerald-100 text-emerald-700", label: "Push" },
  compare: { bg: "bg-violet-100 text-violet-700", label: "Compare" },
  promote: { bg: "bg-orange-100 text-orange-700", label: "Promote" },
  "log-search": { bg: "bg-amber-100 text-amber-700", label: "Log Search" },
};

// ── Filter bar ───────────────────────────────────────────────────────────────

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
        {(["all", "pull", "push", "compare", "promote", "log-search"] as TypeFilter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              typeFilter === t
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {t === "all"
              ? "All"
              : t === "log-search"
              ? "Log Search"
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Record row ───────────────────────────────────────────────────────────────

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
  const envLabel = environment?.label ?? record.environment;

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div
        className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <span className={cn("shrink-0 px-2 py-0.5 rounded text-xs font-medium", badge.bg)}>
          {badge.label}
        </span>

        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
            environment
              ? envColorMap[environment.color] ?? "bg-slate-100 text-slate-700"
              : "bg-slate-100 text-slate-700",
          )}
        >
          {envLabel}
        </span>

        <span className="flex-1 text-sm text-slate-700 truncate">{record.summary}</span>

        <span className="shrink-0">
          {record.status === "success" ? (
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>

        <span className="shrink-0 text-xs text-slate-400 font-mono tabular-nums w-14 text-right">
          {formatDuration(record.duration)}
        </span>

        {record.commitHash && (
          <code className="shrink-0 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            {record.commitHash}
          </code>
        )}

        <span
          className="shrink-0 text-xs text-slate-400 w-20 text-right"
          title={formatTimestamp(record.startedAt)}
        >
          {relativeTime(record.startedAt)}
        </span>

        <svg
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform shrink-0",
            expanded ? "" : "-rotate-90",
          )}
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

// ── Expanded detail ──────────────────────────────────────────────────────────

function ExpandedDetail({ record }: { record: HistoryRecord }) {
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs text-slate-600">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-slate-400">Kind</dt>
        <dd className="font-mono">{record.kind === "commit" ? "git commit" : "op log"}</dd>

        <dt className="text-slate-400">Started</dt>
        <dd className="font-mono">{formatTimestamp(record.startedAt)}</dd>

        {record.completedAt && record.completedAt !== record.startedAt && (
          <>
            <dt className="text-slate-400">Completed</dt>
            <dd className="font-mono">{formatTimestamp(record.completedAt)}</dd>
          </>
        )}

        <dt className="text-slate-400">Duration</dt>
        <dd className="font-mono">{formatDuration(record.duration)}</dd>

        {record.scopes.length > 0 && (
          <>
            <dt className="text-slate-400">Scopes</dt>
            <dd className="font-mono">{record.scopes.join(", ")}</dd>
          </>
        )}

        {record.author && (
          <>
            <dt className="text-slate-400">Author</dt>
            <dd className="font-mono">{record.author}</dd>
          </>
        )}

        {record.commitHash && (
          <>
            <dt className="text-slate-400">Commit</dt>
            <dd className="font-mono">{record.commitHash}</dd>
          </>
        )}

        {record.source && (
          <>
            <dt className="text-slate-400">Source</dt>
            <dd className="font-mono">
              {typeof record.source === "string"
                ? record.source
                : `${record.source.environment} (${record.source.mode})`}
            </dd>
          </>
        )}

        {record.target && (
          <>
            <dt className="text-slate-400">Target</dt>
            <dd className="font-mono">
              {typeof record.target === "string"
                ? record.target
                : `${record.target.environment} (${record.target.mode})`}
            </dd>
          </>
        )}

        {record.taskName && (
          <>
            <dt className="text-slate-400">Task</dt>
            <dd className="font-mono">{record.taskName}</dd>
          </>
        )}
      </dl>

      {record.phaseOutcomes && Object.keys(record.phaseOutcomes).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(record.phaseOutcomes).map(([phase, outcome]) => (
            <span
              key={phase}
              className="px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px] font-medium"
            >
              {phase}: {outcome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export function HistoryView({
  environments,
  history,
}: {
  environments: Environment[];
  history: HistoryRecord[];
}) {
  const [envFilter, setEnvFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return history.filter((r) => {
      if (envFilter) {
        const match =
          r.environment === envFilter ||
          (typeof r.source !== "string" && r.source?.environment === envFilter) ||
          (typeof r.target !== "string" && r.target?.environment === envFilter);
        if (!match) return false;
      }
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      return true;
    });
  }, [history, envFilter, typeFilter]);

  const envByName = useMemo(() => {
    const map = new Map<string, Environment>();
    for (const env of environments) map.set(env.name, env);
    return map;
  }, [environments]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <FilterBar
        environments={environments}
        envFilter={envFilter}
        typeFilter={typeFilter}
        onEnvChange={(v) => {
          setEnvFilter(v);
          setPage(0);
        }}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setPage(0);
        }}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {pageRows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No history entries match the current filters.
          </div>
        ) : (
          pageRows.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              environment={envByName.get(record.environment)}
              expanded={expandedId === record.id}
              onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
            />
          ))
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <span>
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
