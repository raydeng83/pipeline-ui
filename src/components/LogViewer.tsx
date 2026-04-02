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
  const bottomRef = useRef<HTMLDivElement>(null);
  const debugBottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const mainLogs = logs.filter((e) => e.type !== "stderr");
  const debugLogs = logs.filter((e) => e.type === "stderr");

  const handleCopy = () => {
    const text = mainLogs
      .map((e) => (e.type === "exit" ? `\n[Process exited with code ${e.code}]` : e.data))
      .join("");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mainLogs.length]);

  useEffect(() => {
    if (debugOpen) debugBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debugLogs.length, debugOpen]);

  const statusColor =
    exitCode === null
      ? "text-yellow-400"
      : exitCode === 0
      ? "text-green-400"
      : "text-red-400";

  const statusText =
    exitCode === null
      ? running
        ? "Running..."
        : "Ready"
      : exitCode === 0
      ? "Completed successfully"
      : `Failed (exit code ${exitCode})`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-y border-slate-700">
        <span className={cn(
          "inline-block w-2 h-2 rounded-full shrink-0",
          running ? "bg-yellow-400 animate-pulse"
            : exitCode === 0 ? "bg-green-400"
            : exitCode !== null ? "bg-red-400"
            : "bg-slate-500"
        )} />
        <span className={cn("text-xs font-mono", statusColor)}>{statusText}</span>
        {logs.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <button onClick={handleCopy} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
            {!running && (
              <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main output — stdout only */}
      <div className="overflow-y-auto bg-slate-900 p-3 font-mono text-xs min-h-[300px] max-h-[500px]">
        {mainLogs.length === 0 && !running && (
          <span className="text-slate-500">No output yet. Run a command to see logs.</span>
        )}
        {mainLogs.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap break-all leading-5",
              entry.type === "error" && "text-red-400",
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
        <div ref={bottomRef} />
      </div>

      {/* Debug panel — stderr, collapsible */}
      {debugLogs.length > 0 && (
        <div className="border-t border-slate-700 rounded-b-md overflow-hidden">
          <button
            onClick={() => setDebugOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg
              className={cn("w-3 h-3 transition-transform shrink-0", debugOpen ? "" : "-rotate-90")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span>Debug output</span>
            <span className="ml-1 text-slate-500">({debugLogs.length} lines)</span>
          </button>
          {debugOpen && (
            <div className="overflow-y-auto bg-slate-950 p-3 font-mono text-xs max-h-[300px]">
              {debugLogs.map((entry, i) => (
                <div key={i} className="whitespace-pre-wrap break-all leading-5 text-yellow-300/80">
                  {entry.data}
                </div>
              ))}
              <div ref={debugBottomRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
