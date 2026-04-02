"use client";

import { useState } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";

export function PushForm({ environments }: { environments: Environment[] }) {
  const [environment, setEnvironment] = useState(environments[0]?.name ?? "");
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();

  const isProd = environments.find((e) => e.name === environment)?.color === "red";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run("/api/push", { environment, scopes });
  };

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

        <ScopeSelector selected={scopes} onChange={setScopes} disabled={running} />

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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={running || !environment || (isProd && !confirmed)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Pushing..." : "Push Config"}
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
