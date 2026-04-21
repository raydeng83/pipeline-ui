// src/app/data/pull/PullPanel.tsx
"use client";

import { useState, useMemo } from "react";
import { useDataPullJobs } from "@/hooks/useDataPullJobs";
import { JobCard } from "./JobCard";
import type { Environment } from "@/lib/fr-config";

export function PullPanel({
  environments,
  typesByEnv,
}: {
  environments: Environment[];
  typesByEnv: Record<string, string[]>;
}) {
  const [env, setEnv] = useState(environments[0]?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { jobs, start, abort } = useDataPullJobs({ pollMs: 2000, includeFinished: true });
  const types = typesByEnv[env] ?? [];
  const active = useMemo(
    () => jobs.find((j) => j.env === env && (j.status === "running" || j.status === "queued" || j.status === "aborting")),
    [jobs, env],
  );

  const toggle = (t: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(t)) next.delete(t); else next.add(t);
    return next;
  });
  const selectAll = () => setSelected(new Set(types));
  const deselectAll = () => setSelected(new Set());

  const canStart = !active && selected.size > 0;

  const onStart = async () => {
    setError(null);
    const res = await start(env, [...selected]);
    if (!res.ok) {
      setError(res.status === 409
        ? `A pull for ${env} is already running (${res.body.jobId}).`
        : res.body.error ?? `Start failed (${res.status}).`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">Environment</label>
            <select
              value={env}
              onChange={(e) => { setEnv(e.target.value); setSelected(new Set()); }}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {environments.map((e) => (
                <option key={e.name} value={e.name}>{e.label ?? e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50"
            >Select all</button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50"
            >Deselect all</button>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart}
            title={active ? `Job ${active.id} already running` : undefined}
            className="ml-auto px-4 py-1.5 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {active ? "Pull in progress…" : "Start pull"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {types.length === 0 && (
            <p className="text-xs text-slate-400 italic">No managed object schema found for this env.</p>
          )}
          {types.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(t)}
                onChange={() => toggle(t)}
                className="accent-sky-600"
              />
              <span className="font-mono text-slate-700">{t}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Active & recent jobs</h2>
        {jobs.length === 0 && (
          <p className="text-xs text-slate-400 italic">No jobs yet.</p>
        )}
        {jobs.map((j) => <JobCard key={j.id} job={j} onAbort={() => abort(j.id)} />)}
      </div>
    </div>
  );
}
