"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Environment,
  ConfigScope,
  CONFIG_SCOPES,
  PROMOTE_SUBCOMMANDS,
  PromoteSubcommand,
} from "@/lib/fr-config-types";
import type { PromotionTask, TaskStatus } from "@/lib/promotion-tasks";
import { LogViewer } from "@/components/LogViewer";
import { ScopedLogViewer } from "@/components/ScopedLogViewer";
import { DiffReport } from "@/app/compare/DiffReport";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";
import { useDialog } from "@/components/ConfirmDialog";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { cn } from "@/lib/utils";

// ── Types & phase definitions ─────────────────────────────────────────────────

export type PhaseId = "prepare" | "dry-run" | "promote" | "verify";
export type PhaseStatus = "pending" | "running" | "done" | "failed" | "skipped";

const PHASE_DEFS: { id: PhaseId; label: string; description: string }[] = [
  { id: "prepare",  label: "Prepare",  description: "Pull source config" },
  { id: "dry-run",  label: "Dry Run",  description: "Compare source vs target" },
  { id: "promote",  label: "Promote",  description: "Push all scopes to target" },
  { id: "verify",   label: "Verify",   description: "Pull target & re-compare" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCommandType(scope: string): "fr-config" | "frodo" | "iga-api" {
  return CONFIG_SCOPES.find((s) => s.value === scope)?.commandType ?? "fr-config";
}

function scopeLabel(scope: string): string {
  return CONFIG_SCOPES.find((s) => s.value === scope)?.label ?? scope;
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({
  statuses,
  active,
  onClick,
}: {
  statuses: Record<PhaseId, PhaseStatus>;
  active: PhaseId;
  onClick: (id: PhaseId) => void;
}) {
  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {PHASE_DEFS.map((phase, i) => {
        const status = statuses[phase.id];
        const isActive = phase.id === active;
        const isSkipped = status === "skipped";

        const dot = cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-colors",
          status === "done"    && "bg-emerald-500 border-emerald-500 text-white",
          status === "failed"  && "bg-red-500 border-red-500 text-white",
          status === "running" && "bg-sky-500 border-sky-500 text-white animate-pulse",
          status === "skipped" && "bg-slate-100 border-slate-200 text-slate-400",
          status === "pending" && !isActive && "bg-white border-slate-300 text-slate-400",
          status === "pending" && isActive  && "bg-sky-50 border-sky-500 text-sky-600",
        );

        return (
          <div key={phase.id} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (isSkipped) return;
                // Block jumping to promote if dry-run hasn't completed
                if (phase.id === "promote" && statuses["dry-run"] !== "done" && statuses["dry-run"] !== "skipped") return;
                onClick(phase.id);
              }}
              disabled={isSkipped || (phase.id === "promote" && statuses["dry-run"] !== "done" && statuses["dry-run"] !== "skipped")}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors min-w-[64px]",
                isSkipped ? "opacity-40 cursor-default"
                  : (phase.id === "promote" && statuses["dry-run"] !== "done" && statuses["dry-run"] !== "skipped")
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-slate-50 cursor-pointer"
              )}
            >
              <div className={dot}>
                {status === "done"    && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                {status === "failed"  && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                {status === "skipped" && <span>—</span>}
                {(status === "pending" || status === "running") && <span>{i + 1}</span>}
              </div>
              <div className="text-center">
                <div className={cn("text-[10px] font-semibold whitespace-nowrap leading-tight", isActive ? "text-sky-700" : "text-slate-500")}>
                  {phase.label}
                </div>
                <div className="text-[9px] text-slate-400 whitespace-nowrap leading-tight">{phase.description}</div>
              </div>
            </button>
            {i < PHASE_DEFS.length - 1 && (
              <div className={cn("h-px w-4 shrink-0 mx-0.5 mt-[-16px]", status === "done" ? "bg-emerald-300" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Subcommand card styles (fr-config promote) ────────────────────────────────

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

// ── Phase 1: Prepare ──────────────────────────────────────────────────────────

function PreparePhase({
  task,
  visible,
  onComplete,
}: {
  task: PromotionTask;
  visible: boolean;
  onComplete: (s: PhaseStatus) => void;
}) {
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);

  useEffect(() => {
    if (exitCode !== null && !running) onCompleteRef.current(exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  const pullSource = () =>
    run("/api/pull", { environment: task.source.environment, scopes: task.items.map((i) => i.scope) });

  return (
    <div className={cn(!visible && "hidden")}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Pull the latest config from the source environment before promoting.
        </p>

        <div className="flex flex-wrap gap-2">
          {task.source.mode !== "local" && (
            <button
              onClick={pullSource}
              disabled={running}
              className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {running ? "Pulling…" : "Pull Source"}
            </button>
          )}

          {running && (
            <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
              Abort
            </button>
          )}
        </div>

        {(running || logs.length > 0) && (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Phase 2: Dry Run ──────────────────────────────────────────────────────────

function DryRunPhase({
  task,
  visible,
  includeDeps,
  onIncludeDepsChange,
  hasJourneys,
  onComplete,
  onReport,
}: {
  task: PromotionTask;
  visible: boolean;
  includeDeps: boolean;
  onIncludeDepsChange: (v: boolean) => void;
  hasJourneys: boolean;
  onComplete: (s: PhaseStatus) => void;
  onReport: (r: import("@/lib/diff-types").CompareReport) => void;
}) {
  const { logs, running, exitCode, report, run, abort } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  const onReportRef = useRef(onReport);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { onReportRef.current = onReport; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);

  // Cache the report for step 3's diff preview
  useEffect(() => {
    if (report) onReportRef.current(report);
  }, [report]);

  useEffect(() => {
    if (exitCode !== null && !running) onCompleteRef.current(exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  // Use the task's item selections for item-level comparison
  const scopeSelections = task.items.filter((i) =>
    getCommandType(i.scope) === "fr-config"
  );

  const compare = () =>
    run("/api/compare", {
      source: task.source,
      target: task.target,
      scopeSelections,
      includeDeps: hasJourneys ? includeDeps : false,
      mode: "dry-run",
      diffOptions: { includeMetadata: false, ignoreWhitespace: true },
    });

  const sourceLogs = logs.filter((l) => l.side === "source");
  const targetLogs = logs.filter((l) => l.side === "target");
  const sourceExitCode = logs.find((l) => l.type === "exit" && l.side === "source")?.code ?? null;
  const targetExitCode = logs.find((l) => l.type === "exit" && l.side === "target")?.code ?? null;
  const sourceRunning = running && sourceExitCode === null;
  const targetRunning = running && targetExitCode === null;
  const showConsole = logs.length > 0 || running;

  return (
    <div className={cn(!visible && "hidden")}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Simulate what will change on the target (<span className="font-mono">{task.target.environment}</span>) if the source (<span className="font-mono">{task.source.environment}</span>) is promoted to it. Review the diff carefully before proceeding.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={compare}
            disabled={running}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {running ? "Running…" : "Start Dry-run"}
          </button>
          {running && (
            <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
              Abort
            </button>
          )}
          {hasJourneys && (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDeps}
                onChange={(e) => onIncludeDepsChange(e.target.checked)}
                disabled={running}
                className="accent-sky-600"
              />
              <span>Include Dependencies (InnerTree, Scripts…)</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded", includeDeps ? "text-sky-700 bg-sky-50" : "text-slate-400 bg-slate-100")}>
                {includeDeps ? "on" : "off"}
              </span>
            </label>
          )}
        </div>

        {/* Console panels */}
        {showConsole && (
          <div className="rounded-lg border border-slate-700 overflow-hidden grid grid-cols-2 divide-x divide-slate-700">
            <div className="min-w-0 flex flex-col">
              <div className="px-3 py-1.5 bg-slate-700 border-b border-slate-600">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Source — {task.source.environment}</span>
              </div>
              <ScopedLogViewer logs={sourceLogs} running={sourceRunning} exitCode={sourceExitCode} />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="px-3 py-1.5 bg-slate-700 border-b border-slate-600">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Target — {task.target.environment}</span>
              </div>
              <ScopedLogViewer logs={targetLogs} running={targetRunning} exitCode={targetExitCode} />
            </div>
          </div>
        )}

        {/* Missing dependencies warning */}
        {report && !running && report.missingDeps &&
          (report.missingDeps.missingJourneys.length > 0 || report.missingDeps.missingScripts.length > 0) && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="space-y-1.5">
                <p className="font-semibold text-amber-800">
                  Missing dependencies in target ({task.target.environment})
                </p>
                <p className="text-xs text-amber-700">
                  The selected journeys reference the following dependencies that do not exist on the target.
                  Pushing without them may cause failures. Consider enabling &quot;Include Dependencies&quot; in the task.
                </p>
                {report.missingDeps.missingJourneys.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-800 mt-1">Sub-journeys</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {report.missingDeps.missingJourneys.map((name) => (
                        <li key={name} className="text-xs text-amber-700 font-mono pl-3">• {name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.missingDeps.missingScripts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-800 mt-1">Scripts</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {report.missingDeps.missingScripts.map((name) => (
                        <li key={name} className="text-xs text-amber-700 font-mono pl-3">• {name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Diff report */}
        {report && !running && <DiffReport report={report} mode="dry-run" />}
      </div>
    </div>
  );
}

// ── Phase 3: Promote (item-level push with ID remapping) ─────────────────────

function FrConfigSection({
  task,
  targetIsControlled,
  includeDeps,
  isProdTarget,
  dryRunReport,
  onComplete,
  onTaskStatusChange,
}: {
  task: PromotionTask;
  targetIsControlled?: boolean;
  includeDeps: boolean;
  isProdTarget: boolean;
  dryRunReport: import("@/lib/diff-types").CompareReport | null;
  onComplete: (s: PhaseStatus) => void;
  onTaskStatusChange: (s: TaskStatus) => void;
}) {
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onTaskStatusRef = useRef(onTaskStatusChange);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { onTaskStatusRef.current = onTaskStatusChange; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);

  useEffect(() => {
    if (exitCode !== null && !running) {
      onCompleteRef.current(exitCode === 0 ? "done" : "failed");
      onTaskStatusRef.current(exitCode === 0 ? "completed" : "failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  const frConfigItems = task.items.filter((i) => getCommandType(i.scope) === "fr-config");
  const hasJourneys = task.items.some((i) => i.scope === "journeys");

  // DCC helper — calls /api/dcc endpoint for controlled environments
  const callDcc = async (subcommand: string, dccArgs: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
    const res = await fetch("/api/dcc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment: task.target.environment, subcommand, args: dccArgs }),
    });
    return res.json();
  };

  const diffLoader = useCallback(async () => {
    if (!dryRunReport) throw new Error("Run the dry-run first to generate a diff preview");
    const { summarizeReport } = await import("@/lib/compare");
    return summarizeReport(dryRunReport);
  }, [dryRunReport]);

  const runActualPromote = async () => {
    if (task.status === "new") onTaskStatusChange("in-progress");

    if (targetIsControlled) {
      // DCC Step 1: Check state
      const stateRes = await callDcc("direct-control-state");
      let stateJson: { status?: string } = {};
      try { stateJson = JSON.parse(stateRes.stdout.trim()); } catch { /* ignore */ }

      if (stateJson.status && stateJson.status !== "NO_SESSION") {
        // Session already active — skip init, go straight to push
      } else {
        // DCC Step 2: Init session
        const initRes = await callDcc("direct-control-init");
        if (initRes.exitCode !== 0) {
          onTaskStatusChange("failed");
          return;
        }

        // Poll until SESSION_INITIALISED
        const pollStart = Date.now();
        while (Date.now() - pollStart < 120_000) {
          await new Promise((r) => setTimeout(r, 5000));
          const pollRes = await callDcc("direct-control-state");
          let pollState: { status?: string } = {};
          try { pollState = JSON.parse(pollRes.stdout.trim()); } catch { /* ignore */ }
          if (pollState.status === "SESSION_INITIALISED") break;
          if (pollState.status === "ERROR") {
            await callDcc("direct-control-abort");
            onTaskStatusChange("failed");
            return;
          }
        }
      }
    }

    // DCC Step 3 (or normal): Push with directControl flag
    run("/api/promote-items", {
      sourceEnvironment: task.source.environment,
      targetEnvironment: task.target.environment,
      includeDeps: hasJourneys ? includeDeps : false,
      scopeSelections: frConfigItems,
      directControl: targetIsControlled,
    });
  };

  // DCC Step 4: Apply after push completes (handled via effect on exitCode)
  useEffect(() => {
    if (!targetIsControlled || exitCode === null || running) return;

    if (exitCode === 0) {
      // Push succeeded — apply DCC changes
      callDcc("direct-control-apply", ["--wait"]).then((res) => {
        if (res.exitCode !== 0) {
          callDcc("direct-control-abort");
        }
      });
    } else {
      // Push failed — abort DCC session
      callDcc("direct-control-abort");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Push selected items from <span className="font-medium text-slate-700">{task.source.environment}</span> to <span className="font-medium text-slate-700">{task.target.environment}</span> with automatic ID remapping.
        After push, target is automatically pulled to sync local files for verification.
      </p>

      {targetIsControlled && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>Controlled environment — changes will go through Direct Config Control (init &rarr; push via /mutable &rarr; apply).</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {frConfigItems.map(({ scope, items }) => (
          <span key={scope} className="px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600">
            {scopeLabel(scope)}
            {items && <span className="text-slate-400 ml-1">×{items.length}</span>}
          </span>
        ))}
      </div>

      {hasJourneys && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Include Dependencies:</span>
          <span className={cn("px-1.5 py-0.5 rounded font-medium", includeDeps ? "text-sky-700 bg-sky-50" : "text-slate-500 bg-slate-100")}>
            {includeDeps ? "on" : "off"}
          </span>
          <span className="text-slate-400">— set in Step 2 Dry Run.</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPromoteConfirmOpen(true)}
          disabled={running || frConfigItems.length === 0}
          className="px-4 py-1.5 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {running ? "Promoting…" : "Promote Selected Items"}
        </button>
        {running && (
          <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
            Abort
          </button>
        )}
      </div>

      {(running || logs.length > 0) && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <ScopedLogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
        </div>
      )}

      <DangerousConfirmDialog
        open={promoteConfirmOpen}
        title={`Promote → ${task.target.environment}`}
        subtitle={
          isProdTarget
            ? "This writes config to a live production tenant. Review the diff preview below before confirming."
            : "This writes config to the target tenant. Review the diff preview below before confirming."
        }
        tenantName={task.target.environment}
        requireTypeToConfirm={isProdTarget}
        blockUntilDiffLoaded={isProdTarget}
        diffLoader={diffLoader}
        onConfirm={() => { setPromoteConfirmOpen(false); void runActualPromote(); }}
        onCancel={() => setPromoteConfirmOpen(false)}
      />
    </div>
  );
}

function FrodoSection({
  task,
  frodoScopes,
  onComplete,
}: {
  task: PromotionTask;
  frodoScopes: string[];
  onComplete: (s: PhaseStatus) => void;
}) {
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);
  useEffect(() => {
    if (exitCode !== null && !running) onCompleteRef.current(exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Push Frodo-managed scopes to target <span className="font-medium text-slate-700">{task.target.environment}</span> using the frodo CLI.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {frodoScopes.map((s) => (
          <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 border border-purple-200 font-mono">
            {scopeLabel(s)}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => run("/api/push", { environment: task.target.environment, scopes: frodoScopes })}
          disabled={running}
          className="px-3 py-1.5 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {running ? "Pushing…" : "Push Frodo Scopes"}
        </button>
        {running && (
          <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">Abort</button>
        )}
      </div>
      {(running || logs.length > 0) && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
        </div>
      )}
    </div>
  );
}

function IgaSection({
  task,
  igaScopes,
  onComplete,
}: {
  task: PromotionTask;
  igaScopes: string[];
  onComplete: (s: PhaseStatus) => void;
}) {
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);
  useEffect(() => {
    if (exitCode !== null && !running) onCompleteRef.current(exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Push IGA API scopes to target <span className="font-medium text-slate-700">{task.target.environment}</span> via the IGA REST API.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {igaScopes.map((s) => (
          <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-teal-50 text-teal-700 border border-teal-200 font-mono">
            {scopeLabel(s)}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => run("/api/push", { environment: task.target.environment, scopes: igaScopes })}
          disabled={running}
          className="px-3 py-1.5 text-xs font-medium rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {running ? "Pushing…" : "Push IGA Scopes"}
        </button>
        {running && (
          <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">Abort</button>
        )}
      </div>
      {(running || logs.length > 0) && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
        </div>
      )}
    </div>
  );
}

function PromotePhase({
  task,
  frConfigScopes,
  frodoScopes,
  igaScopes,
  targetIsControlled,
  isProdTarget,
  visible,
  includeDeps,
  dryRunReport,
  onComplete,
  onTaskStatusChange,
}: {
  task: PromotionTask;
  frConfigScopes: ConfigScope[];
  frodoScopes: string[];
  igaScopes: string[];
  targetIsControlled?: boolean;
  isProdTarget: boolean;
  visible: boolean;
  includeDeps: boolean;
  dryRunReport: import("@/lib/diff-types").CompareReport | null;
  onComplete: (s: PhaseStatus) => void;
  onTaskStatusChange: (s: TaskStatus) => void;
}) {
  const sections = [
    frConfigScopes.length > 0 && "fr-config",
    frodoScopes.length > 0    && "frodo",
    igaScopes.length > 0      && "iga",
  ].filter(Boolean) as string[];

  const showSectionHeaders = sections.length > 1;

  const sectionHeader = (label: string, color: string) =>
    showSectionHeaders ? (
      <div className={cn("text-[10px] font-semibold uppercase tracking-widest mb-2", color)}>
        {label}
      </div>
    ) : null;

  return (
    <div className={cn(!visible && "hidden")}>
      <div className="space-y-6">
        {frConfigScopes.length > 0 && (
          <div>
            {sectionHeader("fr-config Promote", "text-slate-500")}
            <FrConfigSection
              task={task}
              targetIsControlled={targetIsControlled}
              includeDeps={includeDeps}
              isProdTarget={isProdTarget}
              dryRunReport={dryRunReport}
              onComplete={onComplete}
              onTaskStatusChange={onTaskStatusChange}
            />
          </div>
        )}
        {frodoScopes.length > 0 && (
          <div>
            {sectionHeader("Frodo Agents", "text-purple-500")}
            <FrodoSection
              task={task}
              frodoScopes={frodoScopes}
              onComplete={onComplete}
            />
          </div>
        )}
        {igaScopes.length > 0 && (
          <div>
            {sectionHeader("IGA API", "text-teal-600")}
            <IgaSection
              task={task}
              igaScopes={igaScopes}
              onComplete={onComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Phase 4: Verify ───────────────────────────────────────────────────────────

function VerifyPhase({
  task,
  visible,
  includeDeps,
  onComplete,
}: {
  task: PromotionTask;
  visible: boolean;
  includeDeps: boolean;
  onComplete: (s: PhaseStatus) => void;
}) {
  const { logs, running, exitCode, report, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);
  useEffect(() => {
    if (exitCode !== null && !running)
      onCompleteRef.current(exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitCode, running]);

  const scopeSelections = task.items.filter((i) => getCommandType(i.scope) === "fr-config");

  // Verify swaps the compare direction: the just-promoted target is treated as
  // the baseline and checked against the original source. Post-promotion the
  // two should match exactly for the selected items. Both sides are forced to
  // local mode — Step 1 Prepare pulled source and Step 3 Promote pulled target
  // after the push, so the local config dirs are already in sync and another
  // remote pull would be wasted work.
  const compare = () => {
    run("/api/compare", {
      source: { ...task.target, mode: "local" },
      target: { ...task.source, mode: "local" },
      scopeSelections,
      includeDeps,
      mode: "compare",
      diffOptions: { includeMetadata: false, ignoreWhitespace: true },
    });
  };

  const sourceLogs = logs.filter((l) => l.side === "source");
  const targetLogs = logs.filter((l) => l.side === "target");
  const sourceExitCode = logs.find((l) => l.type === "exit" && l.side === "source")?.code ?? null;
  const targetExitCode = logs.find((l) => l.type === "exit" && l.side === "target")?.code ?? null;
  const sourceRunning = running && sourceExitCode === null;
  const targetRunning = running && targetExitCode === null;
  const showConsole = logs.length > 0 || running;

  return (
    <div className={cn(!visible && "hidden")}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Check the promoted target (<span className="font-mono">{task.target.environment}</span>, used as the verify source) against the original source (<span className="font-mono">{task.source.environment}</span>, used as the verify target). The diff should be empty — any remaining differences flag an incomplete or drifted promotion.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={compare}
            disabled={running || scopeSelections.length === 0}
            title={scopeSelections.length === 0 ? "No fr-config scopes in this task" : undefined}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {running ? "Verifying…" : "Start Verify"}
          </button>
          {running && (
            <button onClick={abort} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
              Abort
            </button>
          )}
        </div>

        {/* Console panels */}
        {showConsole && (
          <div className="rounded-lg border border-slate-700 overflow-hidden grid grid-cols-2 divide-x divide-slate-700">
            <div className="min-w-0 flex flex-col">
              <div className="px-3 py-1.5 bg-slate-700 border-b border-slate-600">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Source — {task.target.environment}</span>
              </div>
              <ScopedLogViewer logs={sourceLogs} running={sourceRunning} exitCode={sourceExitCode} />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="px-3 py-1.5 bg-slate-700 border-b border-slate-600">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Target — {task.source.environment}</span>
              </div>
              <ScopedLogViewer logs={targetLogs} running={targetRunning} exitCode={targetExitCode} />
            </div>
          </div>
        )}

        {/* Diff report */}
        {report && !running && <DiffReport report={report} mode="compare" showUnchangedByDefault />}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PromoteExecution({
  task,
  environments,
  onTaskStatusChange,
}: {
  task: PromotionTask;
  environments: Environment[];
  onTaskStatusChange: (status: TaskStatus) => void;
}) {
  const { confirm } = useDialog();
  const frConfigScopes = useMemo(
    () => task.items.filter((i) => getCommandType(i.scope) === "fr-config").map((i) => i.scope as ConfigScope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.items]
  );
  const frodoScopes = useMemo(
    () => task.items.filter((i) => getCommandType(i.scope) === "frodo").map((i) => i.scope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.items]
  );
  const igaScopes = useMemo(
    () => task.items.filter((i) => getCommandType(i.scope) === "iga-api").map((i) => i.scope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.items]
  );

  const [phaseStatuses, setPhaseStatuses] = useState<Record<PhaseId, PhaseStatus>>(() => ({
    prepare:   "pending",
    "dry-run": frConfigScopes.length > 0 ? "pending" : "skipped",
    promote:   "pending",
    verify:    "pending",
  }));

  const [activePhase, setActivePhase] = useState<PhaseId>("prepare");

  // Shared "include dependencies" toggle for dry-run + promote. Initialized
  // from the task's saved preference; toggling it in the Dry Run phase affects
  // both the compare call and the subsequent promote call, so the user can
  // preview the effect and carry it through without going back to edit the task.
  const [includeDeps, setIncludeDeps] = useState<boolean>(task.includeDeps ?? false);
  const [dryRunReport, setDryRunReport] = useState<import("@/lib/diff-types").CompareReport | null>(null);
  useEffect(() => { setIncludeDeps(task.includeDeps ?? false); }, [task.id, task.includeDeps]);
  const hasJourneys = task.items.some((i) => i.scope === "journeys");

  // Sync dry-run skipped ↔ pending when scope counts change
  useEffect(() => {
    setPhaseStatuses((prev) => {
      const next = { ...prev };
      const hasFrConfig = frConfigScopes.length > 0;
      if (!hasFrConfig && next["dry-run"] !== "skipped") next["dry-run"] = "skipped";
      if (hasFrConfig  && next["dry-run"] === "skipped") next["dry-run"] = "pending";
      return next;
    });
  }, [frConfigScopes.length]);

  // Track run start time and whether history has been emitted for this run,
  // so a re-run starts a fresh record.
  const runStartedAtRef = useRef<{ iso: string; ms: number } | null>(null);
  const historyEmittedRef = useRef(false);

  // Per-phase timings — captured on every status transition so the history
  // record can show what each phase actually took.
  type PhaseTimingClient = {
    status: PhaseStatus;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    _startMs?: number;
  };
  const phaseTimingsRef = useRef<Record<PhaseId, PhaseTimingClient>>({
    prepare:   { status: "pending" },
    "dry-run": { status: "pending" },
    promote:   { status: "pending" },
    verify:    { status: "pending" },
  });

  const updatePhase = (id: PhaseId, status: PhaseStatus) => {
    setPhaseStatuses((prev) => {
      const nowDate = new Date();
      const nowIso = nowDate.toISOString();
      const nowMs = nowDate.getTime();

      // On first transition into "running" for any phase, stamp the run start.
      if (status === "running" && !runStartedAtRef.current) {
        runStartedAtRef.current = { iso: nowIso, ms: nowMs };
      }
      // If the user re-runs after a previous emission (promote phase cycles
      // back to running), reset the emitted flag and reset all timings.
      if (id === "promote" && status === "running" && historyEmittedRef.current) {
        historyEmittedRef.current = false;
        runStartedAtRef.current = { iso: nowIso, ms: nowMs };
        phaseTimingsRef.current = {
          prepare:   { status: "pending" },
          "dry-run": { status: "pending" },
          promote:   { status: "pending" },
          verify:    { status: "pending" },
        };
      }

      // Record this phase's timing transition.
      const timing = { ...(phaseTimingsRef.current[id] ?? { status: "pending" }) };
      timing.status = status;
      if (status === "running") {
        timing.startedAt = nowIso;
        timing._startMs = nowMs;
        timing.completedAt = undefined;
        timing.durationMs = undefined;
      } else if (status === "done" || status === "failed") {
        timing.completedAt = nowIso;
        if (timing._startMs != null) timing.durationMs = nowMs - timing._startMs;
      }
      phaseTimingsRef.current = { ...phaseTimingsRef.current, [id]: timing };

      return { ...prev, [id]: status };
    });
  };

  // Emit a history record when the promote phase reaches a terminal state.
  useEffect(() => {
    const promoteStatus = phaseStatuses.promote;
    if (promoteStatus !== "done" && promoteStatus !== "failed") return;
    if (historyEmittedRef.current) return;
    historyEmittedRef.current = true;

    const started = runStartedAtRef.current ?? { iso: new Date().toISOString(), ms: Date.now() };
    const completedMs = Date.now();
    const completedAt = new Date(completedMs).toISOString();

    const phaseOutcomes: Record<string, PhaseStatus> = {
      prepare:   phaseStatuses.prepare,
      "dry-run": phaseStatuses["dry-run"],
      promote:   phaseStatuses.promote,
      verify:    phaseStatuses.verify,
    };

    // Strip _startMs (internal-only) before serializing.
    const phaseTimings: Record<string, { status: string; startedAt?: string; completedAt?: string; durationMs?: number }> = {};
    for (const [pid, t] of Object.entries(phaseTimingsRef.current)) {
      phaseTimings[pid] = {
        status: t.status,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        durationMs: t.durationMs,
      };
    }

    const scopeNames = task.items.map((i) => i.scope);
    const itemsList = task.items.map((sel) => ({ scope: sel.scope, items: sel.items }));

    // Derive diff totals from the cached dry-run report (if we have one).
    let diffTotals: { added: number; modified: number; removed: number; perScope?: Record<string, { added: number; modified: number; removed: number }> } | undefined;
    if (dryRunReport) {
      const perScope: Record<string, { added: number; modified: number; removed: number }> = {};
      for (const f of dryRunReport.files) {
        if (f.status === "unchanged") continue;
        const scope = f.scope ?? "(unknown)";
        const entry = perScope[scope] ?? { added: 0, modified: 0, removed: 0 };
        if (f.status === "added") entry.added += 1;
        else if (f.status === "modified") entry.modified += 1;
        else if (f.status === "removed") entry.removed += 1;
        perScope[scope] = entry;
      }
      diffTotals = {
        added: dryRunReport.summary.added,
        modified: dryRunReport.summary.modified,
        removed: dryRunReport.summary.removed,
        perScope,
      };
    }

    const itemCount = task.items.reduce((acc, sel) => acc + (sel.items?.length ?? 0), 0);
    const summaryBase = `${promoteStatus === "done" ? "Promoted" : "Promote failed"}: ${task.name}`;
    const summaryDetail = diffTotals
      ? ` — ${itemCount || "all"} item${itemCount === 1 ? "" : "s"} across ${scopeNames.length} scope${scopeNames.length === 1 ? "" : "s"} (+${diffTotals.added} ~${diffTotals.modified} -${diffTotals.removed})`
      : ` (${scopeNames.length} scope${scopeNames.length === 1 ? "" : "s"})`;

    const payload = {
      type: "promote" as const,
      environment: `${task.source.environment} → ${task.target.environment}`,
      source: task.source,
      target: task.target,
      scopes: scopeNames.length ? scopeNames : ["all"],
      status: (promoteStatus === "done" ? "success" : "failed") as "success" | "failed",
      startedAt: started.iso,
      durationMs: completedMs - started.ms,
      summary: summaryBase + summaryDetail,
      taskId: task.id,
      taskName: task.name,
      phaseOutcomes,
      items: itemsList,
      diffTotals,
      phaseTimings,
    };
    // Suppress unused warning for completedAt (kept for potential future use)
    void completedAt;

    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => { /* non-fatal */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseStatuses.promote, phaseStatuses.prepare, phaseStatuses["dry-run"], phaseStatuses.verify]);

  const nextPhase = PHASE_DEFS
    .slice(PHASE_DEFS.findIndex((p) => p.id === activePhase) + 1)
    .find((p) => phaseStatuses[p.id] !== "skipped");

  if (task.items.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          No scope items selected — edit the task to choose what to promote before running.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Stepper statuses={phaseStatuses} active={activePhase} onClick={setActivePhase} />

      <div className="border-t border-slate-100 pt-4 space-y-3">
        {/* Phase header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-700">
              Phase {PHASE_DEFS.findIndex((p) => p.id === activePhase) + 1}: {PHASE_DEFS.find((p) => p.id === activePhase)?.label}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {PHASE_DEFS.find((p) => p.id === activePhase)?.description}
            </p>
          </div>
          {nextPhase && (() => {
            // Block advancing to promote unless dry-run is done or skipped
            const blocked = nextPhase.id === "promote" &&
              phaseStatuses["dry-run"] !== "done" &&
              phaseStatuses["dry-run"] !== "skipped";

            return (
              <button
                type="button"
                disabled={blocked}
                title={blocked ? "Run the dry-run comparison first" : undefined}
                onClick={async () => {
                  if (blocked) return;
                  if (
                    nextPhase.id === "dry-run" &&
                    task.target.mode === "local"
                  ) {
                    const ok = await confirm({
                      title: "Local target mode",
                      message: `The task target "${task.target.environment}" is set to Local mode.\n\nDry run compares the source against the target environment. A local target means no live remote data will be fetched.\n\nContinue anyway?`,
                      confirmLabel: "Continue",
                      variant: "warning",
                    });
                    if (!ok) return;
                  }
                  setActivePhase(nextPhase.id);
                }}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors shrink-0",
                  blocked
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-sky-600 hover:text-sky-800"
                )}
              >
                Next: {nextPhase.label}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })()}
        </div>

        {/* All phase panels — always mounted, only active one visible */}
        <PreparePhase
          task={task}
          visible={activePhase === "prepare"}
          onComplete={(s) => updatePhase("prepare", s)}
        />
        <DryRunPhase
          task={task}
          visible={activePhase === "dry-run"}
          includeDeps={includeDeps}
          onIncludeDepsChange={setIncludeDeps}
          hasJourneys={hasJourneys}
          onComplete={(s) => updatePhase("dry-run", s)}
          onReport={setDryRunReport}
        />
        <PromotePhase
          task={task}
          frConfigScopes={frConfigScopes}
          frodoScopes={frodoScopes}
          igaScopes={igaScopes}
          targetIsControlled={(() => { const t = environments.find((e) => e.name === task.target.environment); return t?.type === "controlled" && !t?.devEnvironment; })()}
          isProdTarget={environments.find((e) => e.name === task.target.environment)?.color === "red"}
          visible={activePhase === "promote"}
          includeDeps={hasJourneys ? includeDeps : false}
          dryRunReport={dryRunReport}
          onComplete={(s) => updatePhase("promote", s)}
          onTaskStatusChange={onTaskStatusChange}
        />
        <VerifyPhase
          task={task}
          visible={activePhase === "verify"}
          includeDeps={hasJourneys ? includeDeps : false}
          onComplete={(s) => updatePhase("verify", s)}
        />
      </div>
    </div>
  );
}
