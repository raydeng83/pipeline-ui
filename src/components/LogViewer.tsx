"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogEntry } from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: LogEntry[];
  running: boolean;
  exitCode: number | null;
  onClear?: () => void;
  /** Full list of scopes the caller queued up, so the checklist is pre-populated. */
  expectedScopes?: string[];
}

type ScopeStatus = "pending" | "running" | "done" | "failed";

interface ScopeRow {
  name: string;
  status: ScopeStatus;
  code: number | null;
  warning: string | null;
  lines: LogEntry[];
}

interface ParsedLogs {
  preamble: LogEntry[];
  scopes: ScopeRow[];
  postamble: LogEntry[];
}

function parseLogs(logs: LogEntry[], expectedScopes: string[]): ParsedLogs {
  const preamble: LogEntry[] = [];
  const postamble: LogEntry[] = [];
  const byScope = new Map<string, ScopeRow>();
  const order: string[] = [];

  for (const s of expectedScopes) {
    if (!byScope.has(s)) {
      byScope.set(s, { name: s, status: "pending", code: null, warning: null, lines: [] });
      order.push(s);
    }
  }

  let currentScope: string | null = null;
  let anyScopeSeen = false;

  for (const entry of logs) {
    if (entry.type === "scope-start" && entry.scope) {
      currentScope = entry.scope;
      anyScopeSeen = true;
      let row = byScope.get(currentScope);
      if (!row) {
        row = { name: currentScope, status: "running", code: null, warning: null, lines: [] };
        byScope.set(currentScope, row);
        order.push(currentScope);
      } else {
        row.status = "running";
      }
      continue;
    }
    if (entry.type === "scope-end" && entry.scope) {
      const row = byScope.get(entry.scope);
      if (row) {
        const code = entry.code ?? 0;
        row.status = code === 0 ? "done" : "failed";
        row.code = code;
        if (entry.warning) row.warning = entry.warning;
      }
      if (currentScope === entry.scope) currentScope = null;
      continue;
    }
    if (entry.type === "exit") {
      postamble.push(entry);
      continue;
    }
    // stdout / stderr / error: route to current scope's lines, or preamble if
    // no scope is open, or postamble if exit has already arrived.
    if (!anyScopeSeen) {
      preamble.push(entry);
    } else if (currentScope) {
      const row = byScope.get(currentScope);
      if (row) row.lines.push(entry);
    } else {
      postamble.push(entry);
    }
  }

  return { preamble, scopes: order.map((s) => byScope.get(s)!), postamble };
}

function statusIcon(status: ScopeStatus) {
  if (status === "pending") return <span className="text-slate-500">○</span>;
  if (status === "running") return <span className="text-amber-400 animate-pulse">◐</span>;
  if (status === "done") return <span className="text-emerald-400">✓</span>;
  return <span className="text-rose-400">✗</span>;
}

function formatScopeLabel(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LogViewer({ logs, running, exitCode, onClear, expectedScopes }: LogViewerProps) {
  const mainPaneRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const parsed = useMemo(() => parseLogs(logs, expectedScopes ?? []), [logs, expectedScopes]);
  const hasStructuredScopes = parsed.scopes.length > 0;

  // Auto-failed scopes should default-expand so the user sees stderr.
  const autoExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const s of parsed.scopes) if (s.status === "failed") set.add(s.name);
    return set;
  }, [parsed.scopes]);

  const isExpanded = (name: string) => expanded.has(name) || autoExpanded.has(name);
  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const handleCopy = () => {
    const text = logs
      .map((e) => (e.type === "exit" ? `\n[Process exited with code ${e.code}]` : (e.data ?? "")))
      .join("");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Always scroll to bottom when new lines arrive. Checklist is compact so we
  // don't fight the user — the pane barely needs to scroll unless many rows
  // are expanded.
  useEffect(() => {
    const el = mainPaneRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs, expanded]);

  const statusText =
    exitCode === null
      ? running
        ? "Running..."
        : "Ready"
      : exitCode === 0
      ? "Completed successfully"
      : `Completed with errors (exit code ${exitCode})`;

  // Summary counts for the header.
  const counts = parsed.scopes.reduce(
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
        {hasStructuredScopes && (
          <span className="text-[11px] text-slate-500">
            {counts.done} of {parsed.scopes.length} done{counts.failed ? ` · ${counts.failed} failed` : ""}
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

      {/* Output pane */}
      <div ref={mainPaneRef} className="overflow-y-auto bg-slate-900 p-4 font-mono text-[12px] leading-5 min-h-[320px] max-h-[560px] rounded-b-xl">
        {logs.length === 0 && !running && (
          <span className="text-slate-500">No output yet. Run a command to see logs.</span>
        )}

        {/* Preamble (lines before any scope-start, e.g. "Acquiring token…") */}
        {parsed.preamble.map((entry, i) => (
          <div
            key={`pre-${i}`}
            className={cn(
              "whitespace-pre-wrap break-all",
              entry.type === "stderr" && "text-amber-300/90",
              entry.type === "error" && "text-red-400",
              entry.type === "stdout" && "text-slate-100",
            )}
          >
            {entry.data}
          </div>
        ))}

        {/* Scope checklist */}
        {parsed.scopes.map((row) => (
          <div key={row.name} className="mt-1">
            <button
              type="button"
              onClick={() => toggle(row.name)}
              disabled={row.lines.length === 0}
              className={cn(
                "w-full flex items-center gap-2 text-left py-0.5 text-slate-200",
                row.lines.length > 0 && "hover:text-white cursor-pointer",
                row.lines.length === 0 && "cursor-default",
              )}
            >
              <span className="w-4 text-center shrink-0">{statusIcon(row.status)}</span>
              <span className={cn(
                "shrink-0",
                row.status === "done" && "text-emerald-300",
                row.status === "failed" && "text-rose-300",
                row.status === "running" && "text-amber-200",
                row.status === "pending" && "text-slate-400",
              )}>
                {formatScopeLabel(row.name)}
              </span>
              {row.warning && (
                <span className="text-xs text-amber-400/70 italic">({row.warning})</span>
              )}
              {row.status === "failed" && row.code !== null && (
                <span className="text-xs text-rose-400/70">exit {row.code}</span>
              )}
              {row.lines.length > 0 && (
                <span className="ml-auto text-[10px] text-slate-500">
                  {row.lines.length} line{row.lines.length === 1 ? "" : "s"}
                  {" "}
                  <span className="text-slate-600">{isExpanded(row.name) ? "▾" : "▸"}</span>
                </span>
              )}
            </button>
            {isExpanded(row.name) && row.lines.length > 0 && (
              <div className="ml-6 border-l border-slate-700 pl-3 py-1">
                {row.lines.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap break-all",
                      entry.type === "stderr" && "text-amber-300/90",
                      entry.type === "error" && "text-red-400",
                      entry.type === "stdout" && "text-slate-300",
                    )}
                  >
                    {entry.data}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Postamble (exit + any lines after last scope-end) */}
        {parsed.postamble.map((entry, i) => (
          <div
            key={`post-${i}`}
            className={cn(
              "whitespace-pre-wrap break-all mt-1",
              entry.type === "stderr" && "text-amber-300/90",
              entry.type === "error" && "text-red-400",
              entry.type === "stdout" && "text-slate-200",
              entry.type === "exit" && entry.code === 0 && "text-green-400 font-bold",
              entry.type === "exit" && entry.code !== 0 && "text-red-400 font-bold",
            )}
          >
            {entry.type === "exit"
              ? `\n[Process exited with code ${entry.code}]`
              : entry.data}
          </div>
        ))}
      </div>
    </div>
  );
}
