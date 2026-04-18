"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogEntry } from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: LogEntry[];
  running: boolean;
  exitCode: number | null;
  onClear?: () => void;
  /** Full list of scopes the caller queued up, so the pill row is pre-populated. */
  expectedScopes?: string[];
}

type ScopeStatus = "pending" | "running" | "done" | "failed";

function deriveScopeStatuses(
  logs: LogEntry[],
  expectedScopes: string[],
): { name: string; status: ScopeStatus; code: number | null }[] {
  // Seed from expectedScopes when provided so the pill row is a stable
  // checklist. When no expectedScopes are given (e.g. promote final push),
  // fall back to discovering scopes from the log stream in arrival order.
  const map = new Map<string, { name: string; status: ScopeStatus; code: number | null }>();
  const order: string[] = [];
  const hasExpected = expectedScopes.length > 0;

  for (const s of expectedScopes) {
    if (!map.has(s)) {
      map.set(s, { name: s, status: "pending", code: null });
      order.push(s);
    }
  }

  for (const entry of logs) {
    if (entry.type === "scope-start" && entry.scope) {
      if (!map.has(entry.scope)) {
        // Only add dynamically when we have no pre-declared checklist.
        // When expectedScopes is set, a scope-start for an unknown name
        // is ignored rather than growing the pill row mid-run.
        if (!hasExpected) {
          map.set(entry.scope, { name: entry.scope, status: "running", code: null });
          order.push(entry.scope);
        }
      } else {
        const row = map.get(entry.scope)!;
        if (row.status === "pending") row.status = "running";
      }
    } else if (entry.type === "scope-end" && entry.scope) {
      const row = map.get(entry.scope);
      if (row) {
        const code = entry.code ?? 0;
        row.status = code === 0 ? "done" : "failed";
        row.code = code;
      }
    }
  }

  return order.map((s) => map.get(s)!);
}

function formatScopeLabel(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusGlyph(status: ScopeStatus): string {
  if (status === "pending") return "○";
  if (status === "running") return "◐";
  if (status === "done") return "✓";
  return "✗";
}

function pillClasses(status: ScopeStatus): string {
  if (status === "done") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "failed") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  if (status === "running") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 animate-pulse";
  return "bg-slate-100 text-slate-500 ring-1 ring-slate-200";
}

export function LogViewer({ logs, running, exitCode, onClear, expectedScopes }: LogViewerProps) {
  const mainPaneRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // SyncForm mutates the logs array in place and bumps a tick to re-render,
  // so the array reference is stable but length grows. Keying these memos on
  // logs.length (plus reference, to catch clear/reset) ensures recompute.
  const scopeRows = useMemo(
    () => deriveScopeStatuses(logs, expectedScopes ?? []),
    [logs, logs.length, expectedScopes],
  );

  // Flat log view: all stdout/stderr/error lines in arrival order, plus
  // subtle separators for scope-start / scope-end and the final exit line.
  const flatLines = useMemo(
    () => logs.filter((e) => e.type === "stdout" || e.type === "stderr" || e.type === "error" || e.type === "exit" || e.type === "scope-start" || e.type === "scope-end"),
    [logs, logs.length],
  );

  const handleCopy = () => {
    const text = logs
      .map((e) => {
        if (e.type === "exit") return `\n[Process exited with code ${e.code}]`;
        if (e.type === "scope-start" && e.scope) return `\n=== ${e.scope} ===\n`;
        if (e.type === "scope-end" && e.scope) return `--- ${e.scope} (exit ${e.code ?? 0}) ---\n`;
        return e.data ?? "";
      })
      .join("");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Auto-scroll to bottom on every new line. logs.length captures in-place
  // pushes from SyncForm's mutable log array (reference is stable).
  useEffect(() => {
    const el = mainPaneRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs, logs.length]);

  const statusText =
    exitCode === null
      ? running
        ? "Running..."
        : "Ready"
      : exitCode === 0
      ? "Completed successfully"
      : `Completed with errors (exit code ${exitCode})`;

  const counts = scopeRows.reduce(
    (acc, s) => {
      acc[s.status]++;
      return acc;
    },
    { pending: 0, running: 0, done: 0, failed: 0 } as Record<ScopeStatus, number>,
  );

  return (
    <div className="card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 rounded-t-xl">
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full shrink-0",
            running ? "bg-amber-400 animate-pulse"
              : exitCode === 0 ? "bg-emerald-400"
              : exitCode !== null ? "bg-rose-400"
              : "bg-slate-300",
          )}
        />
        <span
          className={cn(
            "text-[12px] font-medium",
            exitCode === null
              ? (running ? "text-amber-700" : "text-slate-500")
              : exitCode === 0 ? "text-emerald-700" : "text-rose-700",
          )}
        >
          {statusText}
        </span>
        {scopeRows.length > 0 && (
          <span className="text-[11px] text-slate-500">
            {counts.done} of {scopeRows.length} done{counts.failed ? ` · ${counts.failed} failed` : ""}
          </span>
        )}
        {logs.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
            <button onClick={handleCopy} className="hover:text-slate-800 transition-colors">
              {copied ? "Copied" : "Copy"}
            </button>
            {!running && onClear && (
              <button onClick={onClear} className="hover:text-slate-800 transition-colors">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Scope pills — compact status row above the log pane. */}
      {scopeRows.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 bg-white border-b border-slate-200/60">
          {scopeRows.map((row) => (
            <span
              key={row.name}
              title={row.status === "failed" && row.code !== null ? `exit ${row.code}` : row.status}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                pillClasses(row.status),
              )}
            >
              <span className="text-[10px]">{statusGlyph(row.status)}</span>
              {formatScopeLabel(row.name)}
            </span>
          ))}
        </div>
      )}

      {/* Main log pane — flat stream of stdout/stderr/error/scope markers. */}
      <div ref={mainPaneRef} className="overflow-y-auto bg-slate-900 p-4 font-mono text-[12px] leading-5 min-h-[320px] max-h-[560px] rounded-b-xl">
        {flatLines.length === 0 && !running && (
          <span className="text-slate-500">No output yet. Run a command to see logs.</span>
        )}
        {flatLines.map((entry, i) => {
          if (entry.type === "scope-start") {
            return (
              <div key={i} className="mt-2 text-cyan-400/90 font-semibold">
                ━━━ {formatScopeLabel(entry.scope ?? "")} ━━━
              </div>
            );
          }
          if (entry.type === "scope-end") {
            const ok = (entry.code ?? 0) === 0;
            return (
              <div
                key={i}
                className={cn("text-[11px] italic", ok ? "text-emerald-500/80" : "text-rose-400/90")}
              >
                {ok ? "✓ " : "✗ "}{formatScopeLabel(entry.scope ?? "")} finished{ok ? "" : ` (exit ${entry.code})`}
              </div>
            );
          }
          if (entry.type === "exit") {
            return (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap break-all mt-2 font-bold",
                  entry.code === 0 ? "text-green-400" : "text-red-400",
                )}
              >
                {`\n[Process exited with code ${entry.code}]`}
              </div>
            );
          }
          return (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap break-all",
                entry.type === "error" && "text-red-400",
                entry.type === "stderr" && "text-amber-300/90",
                entry.type === "stdout" && "text-slate-100",
              )}
            >
              {entry.data}
            </div>
          );
        })}
      </div>
    </div>
  );
}
