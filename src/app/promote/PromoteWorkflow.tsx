"use client";

import { useState } from "react";
import { Environment, PROMOTE_SUBCOMMANDS, PromoteSubcommand } from "@/lib/fr-config-types";
import { LogViewer } from "@/components/LogViewer";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  default: "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-700",
  info:    "border-blue-200 bg-blue-50 hover:border-blue-400 text-blue-800",
  warning: "border-yellow-200 bg-yellow-50 hover:border-yellow-400 text-yellow-800",
  danger:  "border-red-200 bg-red-50 hover:border-red-400 text-red-800",
};

const VARIANT_BUTTON_STYLES = {
  default: "bg-slate-700 hover:bg-slate-800 text-white",
  info:    "bg-blue-600 hover:bg-blue-700 text-white",
  warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
  danger:  "bg-red-600 hover:bg-red-700 text-white",
};

export function PromoteWorkflow({ environments }: { environments: Environment[] }) {
  const [environment, setEnvironment] = useState(environments[0]?.name ?? "");
  const [activeSubcommand, setActiveSubcommand] = useState<PromoteSubcommand | null>(null);
  const [confirmDanger, setConfirmDanger] = useState<PromoteSubcommand | null>(null);
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();

  const handleRun = (subcommand: PromoteSubcommand) => {
    const def = PROMOTE_SUBCOMMANDS.find((s) => s.value === subcommand)!;
    if (def.variant === "danger" && confirmDanger !== subcommand) {
      setConfirmDanger(subcommand);
      return;
    }
    setConfirmDanger(null);
    setActiveSubcommand(subcommand);
    run("/api/promote", { environment, subcommand });
  };

  return (
    <div className="space-y-6">
      {/* Environment selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Environment</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            disabled={running}
            className="block w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>
                {env.label}
              </option>
            ))}
          </select>
        </div>
        {running && (
          <button
            onClick={abort}
            className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors"
          >
            Abort
          </button>
        )}
      </div>

      {/* Workflow operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROMOTE_SUBCOMMANDS.map((cmd) => {
          const isActive = activeSubcommand === cmd.value && (running || exitCode !== null);
          const isPendingConfirm = confirmDanger === cmd.value;

          return (
            <div
              key={cmd.value}
              className={cn(
                "rounded-lg border-2 p-4 transition-colors",
                VARIANT_STYLES[cmd.variant],
                isActive && "ring-2 ring-offset-1 ring-slate-400"
              )}
            >
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-sm">{cmd.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{cmd.description}</p>
                </div>

                {isPendingConfirm ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-red-700 font-medium">Are you sure?</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRun(cmd.value)}
                        disabled={running}
                        className="flex-1 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Yes, run
                      </button>
                      <button
                        onClick={() => setConfirmDanger(null)}
                        className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRun(cmd.value)}
                    disabled={running || !environment}
                    className={cn(
                      "w-full px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      VARIANT_BUTTON_STYLES[cmd.variant]
                    )}
                  >
                    {running && activeSubcommand === cmd.value ? "Running..." : "Run"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log output */}
      <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
    </div>
  );
}
