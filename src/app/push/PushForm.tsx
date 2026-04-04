"use client";

import { useEffect, useState } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { PushAudit } from "./PushAudit";
import { PushPlanPanel, PlanSelections } from "./PushPlanPanel";
import { cn } from "@/lib/utils";

export function PushForm({ environments }: { environments: Environment[] }) {
  const [environment, setEnvironment] = useState(environments[0]?.name ?? "");
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [planSelections, setPlanSelections] = useState<PlanSelections>({});
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();

  useEffect(() => { setBusy(running); }, [running, setBusy]);

  const isProd = environments.find((e) => e.name === environment)?.color === "red";

  // Keep planSelections in sync with scope changes
  useEffect(() => {
    if (!planMode) return;
    setPlanSelections((prev) => {
      const next: PlanSelections = {};
      for (const scope of scopes) {
        next[scope] = Object.prototype.hasOwnProperty.call(prev, scope) ? prev[scope] : null;
      }
      return next;
    });
  }, [scopes, planMode]);

  const handleTogglePlanMode = () => {
    if (!planMode) {
      // Activate: initialise selections with all scopes = all items
      const initial: PlanSelections = {};
      for (const s of scopes) initial[s] = null;
      setPlanSelections(initial);
    } else {
      setPlanSelections({});
    }
    setPlanMode((m) => !m);
  };

  const handleScopeToggle = (scope: ConfigScope, included: boolean) => {
    if (included) {
      setScopes((prev) => (prev.includes(scope) ? prev : [...prev, scope]));
      setPlanSelections((prev) => ({ ...prev, [scope]: null }));
    } else {
      setScopes((prev) => prev.filter((s) => s !== scope));
      setPlanSelections((prev) => {
        const next = { ...prev };
        delete next[scope];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scopeSelections = Object.entries(planSelections).map(([scope, items]) => ({
      scope: scope as ConfigScope,
      items: items ?? undefined,
    }));
    run("/api/push", { environment, scopeSelections });
  };

  const canSubmit = Object.keys(planSelections).length > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Target Environment</label>
          <select
            value={environment}
            onChange={(e) => { setEnvironment(e.target.value); setConfirmed(false); }}
            disabled={running}
            className="block w-full sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>
                {env.label}
              </option>
            ))}
          </select>
        </div>

        <ScopeSelector
          selected={scopes}
          onChange={setScopes}
          disabled={running || planMode}
          action="push"
        />

        {/* Local files to push */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Local Files to Push</label>
          {planMode ? (
            <PushPlanPanel
              environment={environment}
              scopes={scopes}
              selections={planSelections}
              onScopeToggle={handleScopeToggle}
              onItemsChange={(scope, items) =>
                setPlanSelections((prev) => ({ ...prev, [scope]: items }))
              }
            />
          ) : scopes.length === 0 ? (
            <div className="flex items-center justify-center h-32 rounded-md border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-400">Select scopes above to see local files</p>
            </div>
          ) : (
            <PushAudit environment={environment} scopes={scopes} />
          )}
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
            onClick={handleTogglePlanMode}
            disabled={running || scopes.length === 0}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              planMode
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-white border border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-700"
            )}
          >
            {planMode ? "Cancel Plan" : "Plan"}
          </button>

          <button
            type="submit"
            disabled={running || !environment || !planMode || !canSubmit || (isProd && !confirmed)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Pushing..." : "Push Plan"}
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
      </form>

      <ScopedLogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
    </div>
  );
}

