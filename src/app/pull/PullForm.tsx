"use client";

import { useState } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { LogViewer } from "@/components/LogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";

export function PullForm({ environments }: { environments: Environment[] }) {
  const [environment, setEnvironment] = useState(environments[0]?.name ?? "");
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run("/api/pull", { environment, scopes });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Environment</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={running || !environment}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Pulling..." : "Pull Config"}
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

      <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
    </div>
  );
}
