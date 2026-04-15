"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogViewer } from "@/components/LogViewer";
import { ScopeSelector } from "@/components/ScopeSelector";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import type { Environment, DiffSummary } from "@/lib/fr-config";
import type { ConfigScope } from "@/lib/fr-config-types";

type Direction = "pull" | "push";

interface StoredState {
  tenant: string;
  direction: Direction;
  scopes: string[];
}

const STORAGE_KEY = "aic:sync:last";

export function SyncForm({ environments }: { environments: Environment[] }) {
  const params = useSearchParams();

  const [tenant, setTenant] = useState<string>(environments[0]?.name ?? "");
  const [direction, setDirection] = useState<Direction>(
    (params.get("direction") as Direction) || "pull"
  );
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeRun, setActiveRun] = useState<{
    direction: Direction;
    tenant: string;
    scopes: ConfigScope[];
  } | null>(null);

  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();

  useEffect(() => {
    setBusy(running);
  }, [running, setBusy]);

  // Walk logs to derive per-scope status from scope-start / scope-end events.
  // scope-end carries the exit code, so failed scopes get marked separately.
  // Also count stdout lines per scope as a live activity indicator.
  const { currentScope, completedScopes, erroredScopes, scopeLineCounts } = useMemo(() => {
    const starts: string[] = [];
    const completed = new Set<string>();
    const errored = new Set<string>();
    const lineCounts = new Map<string, number>();
    let activeScope: string | null = null;
    for (const entry of logs) {
      if (entry.type === "scope-start" && entry.scope) {
        starts.push(entry.scope);
        activeScope = entry.scope;
      } else if (entry.type === "scope-end" && entry.scope) {
        if (entry.code === 0) completed.add(entry.scope);
        else errored.add(entry.scope);
        activeScope = null;
      } else if ((entry.type === "stdout" || entry.type === "stderr") && activeScope) {
        lineCounts.set(activeScope, (lineCounts.get(activeScope) ?? 0) + 1);
      }
    }
    // Fallback: if no scope-end was emitted (e.g. older runner), treat earlier
    // scope-starts as completed once a later one begins.
    if (starts.length > 0 && completed.size === 0 && errored.size === 0) {
      starts.slice(0, running ? -1 : starts.length).forEach((s) => completed.add(s));
    }
    const lastStarted = starts[starts.length - 1] ?? null;
    const current = running && lastStarted && !completed.has(lastStarted) && !errored.has(lastStarted)
      ? lastStarted
      : null;
    return { currentScope: current, completedScopes: completed, erroredScopes: errored, scopeLineCounts: lineCounts };
  }, [logs, running]);

  // Load last state from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as StoredState;
      if (s.tenant && environments.some((e) => e.name === s.tenant)) setTenant(s.tenant);
      if (s.direction === "pull" || s.direction === "push") setDirection(s.direction);
      if (Array.isArray(s.scopes)) setScopes(s.scopes as ConfigScope[]);
    } catch {
      // ignore malformed storage
    }
  }, [environments]);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tenant, direction, scopes }));
  }, [tenant, direction, scopes]);

  const tenantEnv = environments.find((e) => e.name === tenant);
  const isProd = tenantEnv?.color === "red";

  const diffLoader = useMemo(
    (): (() => Promise<DiffSummary[]>) =>
      async () => {
        const res = await fetch("/api/diff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: tenant, scopes, mode: "dry-run" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "diff failed");
        }
        return res.json() as Promise<DiffSummary[]>;
      },
    [tenant, scopes]
  );

  function startRun() {
    if (!tenant || scopes.length === 0) return;
    const url = direction === "pull" ? "/api/pull" : "/api/push";
    setActiveRun({ direction, tenant, scopes: [...scopes] });
    // Both /api/pull and /api/push accept { environment, scopes }
    run(url, { environment: tenant, scopes });
  }

  function handleSubmit() {
    if (direction === "push") {
      setConfirmOpen(true);
      return;
    }
    startRun();
  }

  const scopeCount = scopes.length;
  const runButtonLabel =
    direction === "pull"
      ? `Pull ${scopeCount || ""}${scopeCount ? " scope" : ""}${scopeCount === 1 ? "" : scopeCount > 1 ? "s" : ""} from ${tenant || "…"}`.trim()
      : `Push ${scopeCount || ""}${scopeCount ? " scope" : ""}${scopeCount === 1 ? "" : scopeCount > 1 ? "s" : ""} to ${tenant || "…"}`.trim();

  const runButtonClass =
    direction === "pull" ? "btn-primary" : isProd ? "btn-danger-solid" : "btn-danger-outline";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* LEFT: form controls */}
      <div className="card-padded space-y-5">
        {/* Tenant select */}
        <div>
          <div className="label-xs mb-1.5">TENANT</div>
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            disabled={running}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>
                {env.label} — {env.name}
              </option>
            ))}
          </select>
        </div>

        {/* Direction — pull only for now */}
        <div>
          <div className="label-xs mb-1.5">DIRECTION</div>
          <div className="bg-slate-100 p-1 rounded-xl inline-flex">
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-[13px] font-medium bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              <ArrowDown className="w-4 h-4" /> Pull
            </button>
          </div>
        </div>

        {/* Scope selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="label-xs">SCOPES</span>
            <span className="text-[11px] text-slate-400">{scopes.length} selected</span>
          </div>
          <ScopeSelector
            selected={scopes}
            onChange={setScopes}
            disabled={running}
            action={direction}
          />
        </div>

        {/* Run / abort buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!tenant || scopes.length === 0 || running}
            className={cn("flex-1 justify-center", runButtonClass)}
          >
            {running ? "Running…" : runButtonLabel}
          </button>
          {running && (
            <button
              type="button"
              onClick={abort}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
            >
              Abort
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: run summary + log viewer */}
      <div className="flex flex-col gap-3 min-w-0">
        {activeRun && (
          <div className="card-padded">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {activeRun.direction === "pull" ? (
                  <ArrowDown className="w-4 h-4 text-indigo-600" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-rose-600" />
                )}
                <span className="text-[13px] font-semibold capitalize">
                  {activeRun.direction}
                </span>
                <span className="text-[13px] text-slate-500">·</span>
                <span className="text-[13px] font-mono text-slate-700">
                  {activeRun.tenant}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {activeRun.scopes.length} scope{activeRun.scopes.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeRun.scopes.map((s) => {
                const isCurrent = s === currentScope;
                const isErrored = erroredScopes.has(s);
                const isDone = completedScopes.has(s);
                return (
                  <span
                    key={s}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full ring-1 font-mono transition-colors",
                      isCurrent
                        ? "bg-indigo-600 text-white ring-indigo-600 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
                        : isErrored
                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                          : isDone
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-50 text-slate-500 ring-slate-200"
                    )}
                  >
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                    {isErrored && <span>✗</span>}
                    {!isErrored && isDone && <span>✓</span>}
                    {s}
                    {(isCurrent || isDone || isErrored) && (scopeLineCounts.get(s) ?? 0) > 0 && (
                      <span className={cn(
                        "text-[9px] tabular-nums",
                        isCurrent ? "text-indigo-200" : isDone ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {scopeLineCounts.get(s)}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
      </div>

      {/* Push confirmation dialog */}
      {tenantEnv && (
        <DangerousConfirmDialog
          open={confirmOpen}
          title={`Push to ${tenantEnv.label}`}
          subtitle={
            isProd
              ? "This writes repo config to a live production tenant. Review the preview below."
              : "Review the changes below before pushing."
          }
          tenantName={tenantEnv.name}
          requireTypeToConfirm={isProd}
          blockUntilDiffLoaded={isProd}
          diffLoader={diffLoader}
          onConfirm={() => {
            setConfirmOpen(false);
            startRun();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
