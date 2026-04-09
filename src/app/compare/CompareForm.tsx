"use client";

import { useState, useEffect } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { DiffReport } from "./DiffReport";
import { cn } from "@/lib/utils";
import type { PromotionTask } from "@/lib/promotion-tasks";

type Mode = "local" | "remote";

interface Endpoint {
  environment: string;
  mode: Mode;
}

// ── Endpoint selector ─────────────────────────────────────────────────────────

function EndpointSelector({
  label,
  value,
  onChange,
  environments,
  disabled,
}: {
  label: string;
  value: Endpoint;
  onChange: (v: Endpoint) => void;
  environments: Environment[];
  disabled?: boolean;
}) {
  return (
    <div className="flex-1 space-y-2.5 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</div>
      <select
        value={value.environment}
        onChange={(e) => onChange({ ...value, environment: e.target.value })}
        disabled={disabled}
        className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
      >
        {environments.map((env) => (
          <option key={env.name} value={env.name}>{env.label}</option>
        ))}
      </select>
      <div className="flex gap-1.5">
        {(["local", "remote"] as Mode[]).map((m) => (
          <label
            key={m}
            className={cn(
              "flex-1 flex items-center justify-center py-1.5 rounded border text-xs font-medium transition-colors select-none",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              value.mode === m
                ? "bg-sky-600 border-sky-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-sky-400"
            )}
          >
            <input
              type="radio"
              className="sr-only"
              value={m}
              checked={value.mode === m}
              onChange={() => !disabled && onChange({ ...value, mode: m })}
              disabled={disabled}
            />
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Local config placeholder ───────────────────────────────────────────────────

function LocalPanel({ envName, done }: { envName: string; done: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", done ? "bg-green-400" : "bg-slate-500")} />
        <span className="text-xs font-mono text-slate-400">
          {done ? "Local config ready" : "Local config"}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-900 text-center">
        <svg className="w-6 h-6 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-xs text-slate-500">Local config</p>
        <p className="text-xs font-mono text-slate-600 mt-0.5">{envName}</p>
      </div>
    </div>
  );
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 bg-slate-700 border-b border-slate-600">
      <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function CompareForm({ environments, tasks = [] }: { environments: Environment[]; tasks?: PromotionTask[] }) {
  const defaultEnv = environments[0]?.name ?? "";
  const [source, setSource] = useState<Endpoint>({ environment: defaultEnv, mode: "local" });
  const [target, setTarget] = useState<Endpoint>({ environment: defaultEnv, mode: "remote" });
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  const { logs, running, sourceExitCode, targetExitCode, report, run, abort, clear } =
    useStreamingLogs();
  const { setBusy } = useBusyState();

  useEffect(() => { setBusy(running); }, [running, setBusy]);

  const sourceLogs = logs.filter((l) => l.side === "source");
  const targetLogs = logs.filter((l) => l.side === "target");
  const sourceRunning = running && sourceExitCode === null;
  const targetRunning = running && targetExitCode === null;

  const showConsole = logs.length > 0 || running;

  const handleCompare = () => {
    run("/api/compare", {
      source,
      target,
      scopes,
      diffOptions: { includeMetadata, ignoreWhitespace: true },
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Selector card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex items-stretch gap-3">
          <EndpointSelector
            label="Source"
            value={source}
            onChange={setSource}
            environments={environments}
            disabled={running}
          />

          <div className="flex flex-col items-center justify-center shrink-0 self-center mt-5 gap-1.5">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <button
              type="button"
              title="Swap source and target"
              disabled={running}
              onClick={() => { setSource(target); setTarget(source); }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
              </svg>
            </button>
          </div>

          <EndpointSelector
            label="Target"
            value={target}
            onChange={setTarget}
            environments={environments}
            disabled={running}
          />
        </div>

        <ScopeSelector selected={scopes} onChange={setScopes} disabled={running} action="compare" />

        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={handleCompare}
            disabled={running || !source.environment || !target.environment || scopes.length === 0}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Comparing…" : "Compare"}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              disabled={running}
              className="accent-sky-600"
            />
            Include metadata (createdBy, dates, etc.)
          </label>
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

      {/* ── Console panels ───────────────────────────────────────────────── */}
      {showConsole && (
        <div className="rounded-lg border border-slate-700 overflow-hidden grid grid-cols-2 divide-x divide-slate-700">
          {/* Source */}
          <div className="min-w-0 flex flex-col">
            <PanelHeader label={`Source — ${source.environment}${source.mode === "local" ? " (local)" : ""}`} />
            {source.mode === "local" ? (
              <LocalPanel envName={source.environment} done={sourceExitCode !== null} />
            ) : (
              <ScopedLogViewer
                logs={sourceLogs}
                running={sourceRunning}
                exitCode={sourceExitCode}
                onClear={!running ? clear : undefined}
              />
            )}
          </div>

          {/* Target */}
          <div className="min-w-0 flex flex-col">
            <PanelHeader label={`Target — ${target.environment}${target.mode === "local" ? " (local)" : ""}`} />
            {target.mode === "local" ? (
              <LocalPanel envName={target.environment} done={targetExitCode !== null} />
            ) : (
              <ScopedLogViewer
                logs={targetLogs}
                running={targetRunning}
                exitCode={targetExitCode}
                onClear={!running ? clear : undefined}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Diff report ──────────────────────────────────────────────────── */}
      {report && !running && <DiffReport report={report} tasks={tasks} />}
    </div>
  );
}
