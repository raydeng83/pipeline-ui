"use client";

import { useState, useCallback, useRef } from "react";

export interface LogEntry {
  type: "stdout" | "stderr" | "exit" | "error";
  data?: string;
  code?: number;
  ts: number;
}

export function useStreamingLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  const run = useCallback(async (url: string, body: object) => {
    setLogs([]);
    setExitCode(null);
    setRunning(true);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        setLogs([{ type: "error", data: text || "Request failed", ts: Date.now() }]);
        setRunning(false);
        return;
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      readerRef.current = reader;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry: LogEntry = JSON.parse(line);
            setLogs((prev) => [...prev, entry]);
            if (entry.type === "exit") {
              setExitCode(entry.code ?? null);
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        { type: "error", data: String(err), ts: Date.now() },
      ]);
    } finally {
      setRunning(false);
      readerRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    readerRef.current?.cancel();
    setRunning(false);
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    setExitCode(null);
  }, []);

  return { logs, running, exitCode, run, abort, clear };
}
