"use client";

import { useEffect, useRef } from "react";
import { LogEntry } from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: LogEntry[];
  running: boolean;
  exitCode: number | null;
}

export function LogViewer({ logs, running, exitCode }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 rounded-t-md">
        {running && (
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        )}
        {!running && exitCode === 0 && (
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
        )}
        {!running && exitCode !== null && exitCode !== 0 && (
          <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
        )}
        {!running && exitCode === null && (
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
        )}
        <span className={cn("text-xs font-mono", statusColor)}>{statusText}</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900 rounded-b-md p-3 font-mono text-xs min-h-[300px] max-h-[500px]">
        {logs.length === 0 && !running && (
          <span className="text-slate-500">No output yet. Run a command to see logs.</span>
        )}
        {logs.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap break-all leading-5",
              entry.type === "stderr" && "text-yellow-300",
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
    </div>
  );
}
