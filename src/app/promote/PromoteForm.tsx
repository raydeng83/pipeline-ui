"use client";

import { useState } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { LogViewer } from "@/components/LogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";

export function PromoteForm({ environments }: { environments: Environment[] }) {
  const [source, setSource] = useState(environments[0]?.name ?? "");
  const [target, setTarget] = useState(environments[1]?.name ?? "");
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const { logs, running, exitCode, run, abort } = useStreamingLogs();

  const targetEnv = environments.find((e) => e.name === target);
  const isProd = targetEnv?.color === "red";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run("/api/promote", { environment: source, targetEnvironment: target, scopes });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Source Environment</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setConfirmed(false); }}
              disabled={running}
              className="block w-52 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {environments.map((env) => (
                <option key={env.name} value={env.name}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-400 pb-2 text-lg select-none">→</div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Target Environment</label>
            <select
              value={target}
              onChange={(e) => { setTarget(e.target.value); setConfirmed(false); }}
              disabled={running}
              className="block w-52 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {environments
                .filter((e) => e.name !== source)
                .map((env) => (
                  <option key={env.name} value={env.name}>
                    {env.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {source === target && (
          <p className="text-sm text-red-600">Source and target must be different environments.</p>
        )}

        <ScopeSelector selected={scopes} onChange={setScopes} disabled={running} />

        {isProd && (
          <label className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-red-600"
            />
            I understand this will promote config to <strong>Production</strong>
          </label>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={running || !source || !target || source === target || (isProd && !confirmed)}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Promoting..." : "Promote Config"}
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

      <LogViewer logs={logs} running={running} exitCode={exitCode} />
    </div>
  );
}
