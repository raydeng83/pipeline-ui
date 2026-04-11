"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Environment, ConfigScope } from "@/lib/fr-config-types";
import { ScopeSelector } from "@/components/ScopeSelector";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { cn } from "@/lib/utils";

const cardColor: Record<NonNullable<Environment["color"]>, { base: string; selected: string }> = {
  blue:   { base: "border-blue-200 hover:border-blue-400",   selected: "border-blue-500 bg-blue-50 ring-2 ring-blue-200" },
  green:  { base: "border-green-200 hover:border-green-400", selected: "border-green-500 bg-green-50 ring-2 ring-green-200" },
  yellow: { base: "border-yellow-200 hover:border-yellow-400", selected: "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200" },
  red:    { base: "border-red-200 hover:border-red-400",     selected: "border-red-500 bg-red-50 ring-2 ring-red-200" },
  purple: { base: "border-purple-200 hover:border-purple-400", selected: "border-purple-500 bg-purple-50 ring-2 ring-purple-200" },
  orange: { base: "border-orange-200 hover:border-orange-400", selected: "border-orange-500 bg-orange-50 ring-2 ring-orange-200" },
  teal:   { base: "border-teal-200 hover:border-teal-400",   selected: "border-teal-500 bg-teal-50 ring-2 ring-teal-200" },
  pink:   { base: "border-pink-200 hover:border-pink-400",   selected: "border-pink-500 bg-pink-50 ring-2 ring-pink-200" },
  indigo: { base: "border-indigo-200 hover:border-indigo-400", selected: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" },
  gray:   { base: "border-gray-200 hover:border-gray-400",   selected: "border-gray-500 bg-gray-50 ring-2 ring-gray-200" },
};

const dotColor: Record<NonNullable<Environment["color"]>, string> = {
  blue: "bg-blue-500", green: "bg-green-500", yellow: "bg-yellow-500", red: "bg-red-500",
  purple: "bg-purple-500", orange: "bg-orange-500", teal: "bg-teal-500", pink: "bg-pink-500",
  indigo: "bg-indigo-500", gray: "bg-gray-500",
};

export function PullForm({ environments }: { environments: Environment[] }) {
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [scopes, setScopes] = useState<ConfigScope[]>([]);
  const [currentEnvIndex, setCurrentEnvIndex] = useState(-1);
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const queueRef = useRef<string[]>([]);
  const abortedRef = useRef(false);

  useEffect(() => { setBusy(running); }, [running, setBusy]);

  const toggleEnv = (name: string) => {
    setSelectedEnvs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // When one pull finishes, start the next in the queue
  const startNext = useCallback(() => {
    if (abortedRef.current) return;
    const nextIndex = queueRef.current.length > 0 ? selectedEnvs.indexOf(queueRef.current[0]) : -1;
    const nextEnv = queueRef.current.shift();
    if (nextEnv) {
      setCurrentEnvIndex(nextIndex);
      run("/api/pull", { environment: nextEnv, scopes });
    } else {
      setCurrentEnvIndex(-1);
    }
  }, [selectedEnvs, scopes, run]);

  useEffect(() => {
    if (exitCode !== null && !running && queueRef.current.length > 0) {
      startNext();
    }
  }, [exitCode, running, startNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEnvs.length === 0 || scopes.length === 0) return;
    abortedRef.current = false;
    queueRef.current = [...selectedEnvs.slice(1)];
    setCurrentEnvIndex(0);
    run("/api/pull", { environment: selectedEnvs[0], scopes });
  };

  const handleAbort = () => {
    abortedRef.current = true;
    queueRef.current = [];
    abort();
  };

  const isPulling = running || queueRef.current.length > 0;
  const currentEnvName = currentEnvIndex >= 0 ? selectedEnvs[currentEnvIndex] : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Environments</label>
          <div className="flex flex-wrap gap-2">
            {environments.map((env) => {
              const isSelected = selectedEnvs.includes(env.name);
              const colors = cardColor[env.color];
              const isActive = running && currentEnvName === env.name;
              return (
                <button
                  key={env.name}
                  type="button"
                  onClick={() => toggleEnv(env.name)}
                  disabled={isPulling}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all select-none disabled:cursor-not-allowed",
                    isSelected ? colors.selected : colors.base,
                    !isSelected && !isPulling && "bg-white",
                    isPulling && "opacity-70"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor[env.color])} />
                  <span className={cn(isSelected ? "text-slate-800" : "text-slate-600")}>
                    {env.label}
                  </span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedEnvs.length > 1 && !isPulling && (
            <p className="text-[10px] text-slate-400 mt-1">
              {selectedEnvs.length} environments selected — will pull one by one
            </p>
          )}
          {isPulling && currentEnvName && (
            <p className="text-[10px] text-sky-600 mt-1 font-medium">
              Pulling {currentEnvName}
              {queueRef.current.length > 0 && ` (${queueRef.current.length} remaining)`}
              ...
            </p>
          )}
        </div>

        <ScopeSelector selected={scopes} onChange={setScopes} disabled={isPulling} action="pull" />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPulling || selectedEnvs.length === 0 || scopes.length === 0}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPulling ? "Pulling..." : `Pull Config${selectedEnvs.length > 1 ? ` (${selectedEnvs.length})` : ""}`}
          </button>
          {isPulling && (
            <button
              type="button"
              onClick={handleAbort}
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
