"use client";

import { useEffect, useState } from "react";
import { Environment, ConfigScope, CONFIG_SCOPES } from "@/lib/fr-config-types";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { PushPlanPanel, PlanSelections } from "./PushPlanPanel";
import { DiffReport } from "../compare/DiffReport";

/** All scopes that CLI tools can actually push */
const ALL_SCOPES = CONFIG_SCOPES
  .filter((s) => s.cliSupported !== false)
  .map((s) => s.value as ConfigScope);

export function PushForm({ environments }: { environments: Environment[] }) {
  const [environment, setEnvironment] = useState(environments[0]?.name ?? "");
  const [scopes, setScopes] = useState<ConfigScope[]>(ALL_SCOPES);
  const [confirmed, setConfirmed] = useState(false);
  const [planSelections, setPlanSelections] = useState<PlanSelections>(() => {
    const initial: PlanSelections = {};
    for (const s of ALL_SCOPES) initial[s] = [];
    return initial;
  });
  const push = useStreamingLogs();
  const dryRun = useStreamingLogs();
  const { setBusy } = useBusyState();

  const running = push.running;
  const dryRunning = dryRun.running;

  useEffect(() => { setBusy(running || dryRunning); }, [running, dryRunning, setBusy]);

  const isProd = environments.find((e) => e.name === environment)?.color === "red";

  // Keep planSelections in sync with scope changes
  useEffect(() => {
    setPlanSelections((prev) => {
      const next: PlanSelections = {};
      for (const scope of scopes) {
        next[scope] = Object.prototype.hasOwnProperty.call(prev, scope) ? prev[scope] : [];
      }
      return next;
    });
  }, [scopes]);

  // Clear dry run report when selections change
  useEffect(() => {
    if (dryRun.report) dryRun.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSelections, environment]);

  const handleScopeToggle = (scope: ConfigScope, included: boolean) => {
    if (included) {
      setScopes((prev) => (prev.includes(scope) ? prev : [...prev, scope]));
      setPlanSelections((prev) => ({ ...prev, [scope]: [] }));
    } else {
      setScopes((prev) => prev.filter((s) => s !== scope));
      setPlanSelections((prev) => {
        const next = { ...prev };
        delete next[scope];
        return next;
      });
    }
  };

  const buildScopeSelections = () =>
    Object.entries(planSelections).map(([scope, items]) => ({
      scope: scope as ConfigScope,
      items: items ?? undefined,
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    push.run("/api/push", { environment, scopeSelections: buildScopeSelections() });
  };

  const handleDryRun = () => {
    dryRun.run("/api/push/dry-run", { environment, scopeSelections: buildScopeSelections() });
  };

  const canSubmit = Object.values(planSelections).some(
    (items) => items === null || (items && items.length > 0)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Target Environment</label>
            <select
              value={environment}
              onChange={(e) => { setEnvironment(e.target.value); setConfirmed(false); }}
              disabled={running || dryRunning}
              className="block w-full sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {environments.map((env) => (
                <option key={env.name} value={env.name}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>

          {/* Local files to push — always shown with all scopes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Local Files to Push</label>
            <PushPlanPanel
              environment={environment}
              scopes={scopes}
              selections={planSelections}
              onScopeToggle={handleScopeToggle}
              onItemsChange={(scope, items) =>
                setPlanSelections((prev) => ({ ...prev, [scope]: items }))
              }
            />
          </div>

          {isProd && (
            <label className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="accent-red-600"
              />
              I understand this will push to <strong>Production</strong>
            </label>
          )}

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={handleDryRun}
              disabled={!canSubmit || running || dryRunning}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {dryRunning ? "Running Dry Run…" : "Dry Run"}
            </button>

            <button
              type="submit"
              disabled={running || dryRunning || !environment || !canSubmit || (isProd && !confirmed)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "Pushing..." : "Push"}
            </button>

            {(running || dryRunning) && (
              <button
                type="button"
                onClick={running ? push.abort : dryRun.abort}
                className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
              >
                Abort
              </button>
            )}
          </div>
        </form>

        {/* Dry run console — shown when dry run has logs */}
        {dryRun.logs.length > 0 && (
          <ScopedLogViewer
            logs={dryRun.logs}
            running={dryRunning}
            exitCode={dryRun.exitCode}
            onClear={!dryRunning ? dryRun.clear : undefined}
          />
        )}

        {/* Push console — shown when push has logs */}
        {push.logs.length > 0 && (
          <ScopedLogViewer
            logs={push.logs}
            running={running}
            exitCode={push.exitCode}
            onClear={!running ? push.clear : undefined}
          />
        )}
      </div>

      {/* Dry run diff report */}
      {dryRun.report && !dryRunning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Dry Run Results — Changes That Will Be Applied</h2>
            <button
              onClick={dryRun.clear}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
          <DiffReport report={dryRun.report} />
        </div>
      )}
    </div>
  );
}
