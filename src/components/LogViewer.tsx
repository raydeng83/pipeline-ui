"use client";

import { useEffect, useRef, useState } from "react";
import { LogEntry } from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: LogEntry[];
  running: boolean;
  exitCode: number | null;
  onClear?: () => void;
}

export function LogViewer({ logs, running, exitCode, onClear }: LogViewerProps) {
  const mainPaneRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // All log lines render in the same pane — stdout, stderr, and errors
  // inline. stderr is styled amber so it's distinguishable without needing
  // a separate console.
  const visibleLogs = logs;

  const handleCopy = () => {
    const text = visibleLogs
      .map((e) => (e.type === "exit" ? `\n[Process exited with code ${e.code}]` : e.data))
      .join("");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Auto-scroll the log pane itself (not the page) when new lines arrive,
  // and only if the user was already pinned to the bottom — so manual
  // scrolling up to inspect earlier output isn't yanked back.
  const prevLogsRef = useRef(logs);
  useEffect(() => {
    const el = mainPaneRef.current;
    if (!el) return;
    const tabSwitched = logs !== prevLogsRef.current;
    prevLogsRef.current = logs;
    if (tabSwitched) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    const pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (pinned) el.scrollTop = el.scrollHeight;
  }, [logs, visibleLogs.length]);

  const statusText =
    exitCode === null
      ? running
        ? "Running..."
        : "Ready"
      : exitCode === 0
      ? "Completed successfully"
      : `Completed with errors (exit code ${exitCode})`;

  return (
    <div className="card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 rounded-t-xl">
        <span className={cn(
          "inline-block w-2 h-2 rounded-full shrink-0",
          running ? "bg-amber-400 animate-pulse"
            : exitCode === 0 ? "bg-emerald-400"
            : exitCode !== null ? "bg-rose-400"
            : "bg-slate-300"
        )} />
        <span className={cn(
          "text-[12px] font-medium",
          exitCode === null
            ? (running ? "text-amber-700" : "text-slate-500")
            : exitCode === 0 ? "text-emerald-700" : "text-rose-700"
        )}>
          {statusText}
        </span>
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

      {/* Unified output — stdout, stderr, and errors render together. */}
      <div ref={mainPaneRef} className="overflow-y-auto bg-slate-900 p-4 font-mono text-[12px] leading-5 min-h-[320px] max-h-[520px] rounded-b-xl">
        {visibleLogs.length === 0 && !running && (
          <span className="text-slate-500">No output yet. Run a command to see logs.</span>
        )}
        {visibleLogs.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap break-all leading-5",
              entry.type === "error" && "text-red-400",
              entry.type === "stderr" && "text-amber-300/90",
              entry.type === "exit" && entry.code === 0 && "text-green-400 font-bold",
              entry.type === "exit" && entry.code !== 0 && "text-red-400 font-bold",
              entry.type === "stdout" && "text-slate-100"
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
