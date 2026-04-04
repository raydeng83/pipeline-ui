"use client";

import { useMemo, useState } from "react";
import { Environment } from "@/lib/fr-config-types";
import type { HistoryRecord } from "@/lib/history";
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

type TypeFilter = "all" | "pull" | "push";

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
        {(["all", "pull", "push"] as TypeFilter[]).map((t) => (
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
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ record }: { record: HistoryRecord }) {
  const scopes = Object.entries(record.details);
  if (scopes.length === 0) {
    return (
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-400">
        No item-level details available.
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
      {scopes.map(([scope, detail]) => {
        const hasItems = detail.added.length + detail.modified.length + detail.deleted.length > 0;
        return (
          <div key={scope}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {scope}
            </div>
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

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div
        className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        {/* Type badge */}
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded text-xs font-medium",
            record.type === "pull"
              ? "bg-sky-100 text-sky-700"
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          {record.type === "pull" ? "Pull" : "Push"}
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

      {expanded && <DetailPanel record={record} />}
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

  const filtered = useMemo(() => {
    let records = history;
    if (envFilter) records = records.filter((r) => r.environment === envFilter);
    if (typeFilter !== "all") records = records.filter((r) => r.type === typeFilter);
    return records;
  }, [history, envFilter, typeFilter]);

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
        onEnvChange={setEnvFilter}
        onTypeChange={setTypeFilter}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              environment={envMap.get(record.environment)}
              expanded={expandedId === record.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === record.id ? null : record.id))
              }
            />
          ))
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
