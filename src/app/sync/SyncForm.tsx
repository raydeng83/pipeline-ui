"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogViewer } from "@/components/LogViewer";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useStreamingLogs, type LogEntry } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import type { Environment } from "@/lib/fr-config-types";
import type { ConfigScope } from "@/lib/fr-config-types";

const STORAGE_KEY = "aic:sync:last";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Per-environment pull job ────────────────────────────────────────────────

interface PullJob {
  env: string;
  label: string;
  color: string;
  status: "pending" | "running" | "done" | "failed";
  logs: LogEntry[];
  exitCode: number | null;
}

function usePullJobs() {
  const [jobs, setJobs] = useState<PullJob[]>([]);
  // Store logs in a ref to avoid re-rendering the entire component on every line.
  // A counter state triggers re-renders at a throttled rate.
  const logsRef = useRef<Map<string, LogEntry[]>>(new Map());
  const [logTick, setLogTick] = useState(0);
  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const scheduleLogTick = useCallback(() => {
    if (tickTimer.current) return;
    tickTimer.current = setTimeout(() => {
      tickTimer.current = null;
      setLogTick((n) => n + 1);
    }, 150);
  }, []);

  const getLogsForEnv = useCallback((env: string): LogEntry[] => {
    return logsRef.current.get(env) ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logTick]);

  const startAll = useCallback((envs: Environment[], scopes: ConfigScope[]) => {
    logsRef.current.clear();
    const initial: PullJob[] = envs.map((env) => ({
      env: env.name,
      label: env.label,
      color: env.color,
      status: "running",
      logs: [],
      exitCode: null,
    }));
    for (const env of envs) logsRef.current.set(env.name, []);
    setJobs(initial);
    abortControllers.current.clear();

    for (const env of envs) {
      const ac = new AbortController();
      abortControllers.current.set(env.name, ac);

      fetch("/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: env.name, scopes }),
        signal: ac.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            setJobs((prev) => prev.map((j) => j.env === env.name ? { ...j, status: "failed", exitCode: 1 } : j));
            return;
          }
          const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            let hasExit = false;
            let exitEntry: LogEntry | null = null;
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const entry = JSON.parse(line) as LogEntry;
                logsRef.current.get(env.name)?.push(entry);
                if (entry.type === "exit") { hasExit = true; exitEntry = entry; }
              } catch { /* skip */ }
            }
            if (hasExit && exitEntry) {
              setJobs((prev) => prev.map((j) =>
                j.env === env.name
                  ? { ...j, status: ((exitEntry as LogEntry).code ?? 1) === 0 ? "done" : "failed", exitCode: (exitEntry as LogEntry).code ?? 1 }
                  : j
              ));
              scheduleLogTick();
              return;
            }
            scheduleLogTick();
          }
          setJobs((prev) => prev.map((j) =>
            j.env === env.name && j.status === "running" ? { ...j, status: "done", exitCode: 0 } : j
          ));
          scheduleLogTick();
        })
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          logsRef.current.get(env.name)?.push({ type: "error", data: String(err), ts: Date.now() });
          setJobs((prev) => prev.map((j) =>
            j.env === env.name ? { ...j, status: "failed", exitCode: 1 } : j
          ));
          scheduleLogTick();
        });
    }
  }, [scheduleLogTick]);

  const abortAll = useCallback(() => {
    for (const ac of abortControllers.current.values()) ac.abort();
    setJobs((prev) => prev.map((j) => j.status === "running" ? { ...j, status: "failed", exitCode: 1 } : j));
  }, []);

  const clearJobs = useCallback(() => {
    setJobs([]);
    logsRef.current.clear();
  }, []);

  const anyRunning = jobs.some((j) => j.status === "running");

  return { jobs, getLogsForEnv, startAll, abortAll, clearJobs, anyRunning };
}

// ── Main component ──────────────────────────────────────────────────────────

export function SyncForm({
  environments,
  lastPullMap,
}: {
  environments: Environment[];
  lastPullMap: Record<string, string>;
}) {
  const [selectedEnvs, setSelectedEnvs] = useState<Set<string>>(new Set());
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { setBusy } = useBusyState();
  const { jobs, getLogsForEnv, startAll, abortAll, clearJobs, anyRunning } = usePullJobs();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const logViewerRef = useRef<HTMLDivElement>(null);

  const focusLog = useCallback((env: string) => {
    setActiveTab(env);
    requestAnimationFrame(() => {
      logViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => { setBusy(anyRunning); }, [anyRunning, setBusy]);

  // Load saved scopes
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as { scopes?: string[] };
      if (Array.isArray(s.scopes)) setScopes(s.scopes as ConfigScope[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scopes }));
  }, [scopes]);

  // Set initial active tab when jobs start
  useEffect(() => {
    if (jobs.length > 0 && !activeTab) setActiveTab(jobs[0].env);
  }, [jobs, activeTab]);

  const toggleEnv = (name: string) => {
    setSelectedEnvs((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const allSelected = selectedEnvs.size === environments.length;
  const toggleAll = () => {
    if (allSelected) setSelectedEnvs(new Set());
    else setSelectedEnvs(new Set(environments.map((e) => e.name)));
  };

  const handlePull = () => {
    if (selectedEnvs.size === 0 || scopes.length === 0) return;
    const envs = environments.filter((e) => selectedEnvs.has(e.name));
    setActiveTab(envs[0].name);
    startAll(envs, scopes);
  };

  const deferredActiveTab = useDeferredValue(activeTab);
  const activeJob = jobs.find((j) => j.env === deferredActiveTab) ?? null;
  const activeJobLogs = deferredActiveTab ? getLogsForEnv(deferredActiveTab) : [];
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const runningCount = jobs.filter((j) => j.status === "running").length;

  const lastErrorFor = (envName: string): string | null => {
    const entries = getLogsForEnv(envName);
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      if (e.type === "error" || e.type === "stderr") {
        const s = String(e.data ?? "").trim();
        if (s) return s.split("\n").filter(Boolean).pop() ?? s;
      }
    }
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      if (e.type === "stdout") {
        const s = String(e.data ?? "").trim();
        if (s) return s.split("\n").filter(Boolean).pop() ?? s;
      }
    }
    return null;
  };

  const failedJobs = jobs.filter((j) => j.status === "failed");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: environment list + scopes */}
        <div className="space-y-5">
          {/* Environment list */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <span className="label-xs">ENVIRONMENTS</span>
              <button
                type="button"
                onClick={toggleAll}
                disabled={anyRunning}
                className="text-xs text-sky-600 hover:text-sky-800 disabled:opacity-40"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {environments.map((env) => {
                const checked = selectedEnvs.has(env.name);
                const lastPull = lastPullMap[env.name];
                const job = jobs.find((j) => j.env === env.name);
                return (
                  <label
                    key={env.name}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer",
                      anyRunning ? "opacity-60 cursor-default" : "hover:bg-slate-50",
                      checked && !anyRunning && "bg-sky-50/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEnv(env.name)}
                      disabled={anyRunning}
                      className="w-3.5 h-3.5 accent-sky-600 shrink-0"
                    />
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", `bg-${env.color}-400`)} style={{ backgroundColor: `var(--color-${env.color}-400, currentColor)` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{env.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{env.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {lastPull ? `Last pull: ${mounted ? timeAgo(lastPull) : "…"}` : "Never pulled"}
                      </div>
                      {job?.status === "failed" && (() => {
                        const err = lastErrorFor(env.name);
                        return err ? (
                          <div
                            className="text-[10px] text-red-600 mt-0.5 truncate font-mono"
                            title={err}
                          >
                            {err}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    {/* Job status indicator */}
                    {job && (
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        job.status === "running" && "bg-sky-100 text-sky-700 animate-pulse",
                        job.status === "done" && "bg-emerald-100 text-emerald-700",
                        job.status === "failed" && "bg-red-100 text-red-700",
                        job.status === "pending" && "bg-slate-100 text-slate-500",
                      )}>
                        {job.status === "running" ? "pulling…" : job.status === "failed" ? "with errors" : job.status}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Scope selector */}
          <div className="card-padded">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-xs">SCOPES</span>
              <span className="text-[11px] text-slate-400">{scopes.length} selected</span>
            </div>
            <ScopeSelector selected={scopes} onChange={setScopes} disabled={anyRunning} action="pull" />
          </div>

          {/* Pull button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePull}
              disabled={selectedEnvs.size === 0 || scopes.length === 0 || anyRunning}
              className="btn-primary flex-1 justify-center"
            >
              {anyRunning
                ? `Pulling ${runningCount} environment${runningCount !== 1 ? "s" : ""}…`
                : `Pull ${selectedEnvs.size || ""} environment${selectedEnvs.size === 1 ? "" : "s"}`}
            </button>
            {anyRunning && (
              <button
                type="button"
                onClick={abortAll}
                className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
              >
                Abort All
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: log viewer with env tabs */}
        <div className="flex flex-col gap-3 min-w-0">
          {jobs.length > 0 && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{jobs.length} environment{jobs.length !== 1 ? "s" : ""}</span>
                {doneCount > 0 && <span className="text-emerald-600">{doneCount} done</span>}
                {failedCount > 0 && <span className="text-red-600">{failedCount} with errors</span>}
                {runningCount > 0 && <span className="text-sky-600">{runningCount} running</span>}
                {!anyRunning && (
                  <button type="button" onClick={clearJobs} className="text-[10px] text-slate-400 hover:text-slate-600">
                    Clear
                  </button>
                )}
              </div>

              {/* Failure banner */}
              {failedJobs.length > 0 && !anyRunning && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-red-700 mb-1">
                    {failedJobs.length} environment{failedJobs.length !== 1 ? "s" : ""} completed with errors
                  </div>
                  <ul className="space-y-1">
                    {failedJobs.map((j) => {
                      const err = lastErrorFor(j.env);
                      return (
                        <li key={j.env} className="flex items-start gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => focusLog(j.env)}
                            className="shrink-0 font-medium text-red-700 hover:underline"
                          >
                            {j.label}
                          </button>
                          <span className="text-red-500">
                            {j.exitCode != null ? `(exit ${j.exitCode})` : ""}
                          </span>
                          <span
                            className="flex-1 min-w-0 truncate font-mono text-red-600"
                            title={err ?? undefined}
                          >
                            {err ?? "No output"}
                          </span>
                          <button
                            type="button"
                            onClick={() => focusLog(j.env)}
                            className="shrink-0 text-[10px] text-red-600 hover:text-red-800 underline"
                          >
                            View log
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Environment tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {jobs.map((job) => (
                  <button
                    key={job.env}
                    type="button"
                    onClick={() => setActiveTab(job.env)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full ring-1 transition-colors whitespace-nowrap",
                      activeTab === job.env
                        ? "bg-indigo-600 text-white ring-indigo-600"
                        : job.status === "done"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                          : job.status === "failed"
                            ? "bg-red-50 text-red-700 ring-red-200 hover:bg-red-100"
                            : job.status === "running"
                              ? "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100"
                              : "bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {job.status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
                    {job.status === "done" && <span>✓</span>}
                    {job.status === "failed" && <span>✗</span>}
                    {job.label}
                    {(() => {
                      const logCount = getLogsForEnv(job.env).filter((l) => l.type === "stdout" || l.type === "stderr").length;
                      return logCount > 0 ? (
                        <span className={cn(
                          "text-[9px] tabular-nums",
                          activeTab === job.env ? "text-indigo-200" : "text-slate-400"
                        )}>
                          {logCount}
                        </span>
                      ) : null;
                    })()}
                  </button>
                ))}
              </div>

              {/* Log viewer for active tab */}
              {activeJob && (
                <div ref={logViewerRef}>
                  <LogViewer
                    logs={activeJobLogs}
                    running={activeJob.status === "running"}
                    exitCode={activeJob.exitCode}
                  />
                </div>
              )}
            </>
          )}

          {jobs.length === 0 && (
            <div className="card-padded text-center text-sm text-slate-400 py-10">
              Select environments and scopes, then click Pull.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
