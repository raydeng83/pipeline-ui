"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogViewer } from "@/components/LogViewer";
import { ScopeSelector } from "@/components/ScopeSelector";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
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

  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();

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
  const isDangerous = direction === "push" && isProd;

  const diffLoader = useMemo(
    (): (() => Promise<DiffSummary[]>) =>
      async () => {
        const sp = new URLSearchParams({
          source: "repo",
          target: tenant,
          scopes: scopes.join(","),
        });
        const res = await fetch(`/api/diff?${sp.toString()}`);
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
    // Both /api/pull and /api/push accept { environment, scopes }
    run(url, { environment: tenant, scopes });
  }

  function handleSubmit() {
    if (isDangerous) {
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

        {/* Direction segmented control */}
        <div>
          <div className="label-xs mb-1.5">DIRECTION</div>
          <div
            className={cn(
              "grid grid-cols-2 gap-1 p-1 rounded-xl",
              direction === "push" && isProd ? "bg-rose-50" : "bg-slate-100"
            )}
          >
            <button
              type="button"
              onClick={() => setDirection("pull")}
              disabled={running}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-50",
                direction === "pull"
                  ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowDown className="w-4 h-4" /> Pull
            </button>
            <button
              type="button"
              onClick={() => setDirection("push")}
              disabled={running}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-50",
                direction === "push"
                  ? isProd
                    ? "bg-white text-rose-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowUp className="w-4 h-4" /> Push
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

      {/* RIGHT: log viewer */}
      <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />

      {/* Push-to-prod confirmation dialog */}
      {tenantEnv && (
        <DangerousConfirmDialog
          open={confirmOpen}
          title={`Push to ${tenantEnv.label}`}
          subtitle="This writes repo config to a live tenant. Review the preview below."
          tenantName={tenantEnv.name}
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
