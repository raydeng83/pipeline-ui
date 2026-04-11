"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
          {task.source.mode === "local" ? (
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Source is local — pull not needed
            </div>
          ) : (
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
  onComplete,
}: {
  task: PromotionTask;
  visible: boolean;
  onComplete: (s: PhaseStatus) => void;
}) {
  const { logs, running, exitCode, report, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(running); }, [running, setBusy]);

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
      includeDeps: task.includeDeps ?? false,
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
          Compare source against target for the selected scopes to preview what will change. Review the diff carefully before proceeding.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={compare}
            disabled={running}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {running ? "Comparing…" : "Compare Source vs Target"}
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

        {/* Diff report */}
        {report && !running && <DiffReport report={report} />}
      </div>
    </div>
  );
}

// ── Phase 3: Promote (item-level push with ID remapping) ─────────────────────

function FrConfigSection({
  task,
  targetIsControlled,
  onComplete,
  onTaskStatusChange,
}: {
  task: PromotionTask;
  targetIsControlled?: boolean;
  onComplete: (s: PhaseStatus) => void;
  onTaskStatusChange: (s: TaskStatus) => void;
}) {
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [includeDeps, setIncludeDeps] = useState(task.includeDeps ?? false);
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

  const handlePromote = async () => {
    if (!confirmPromote) { setConfirmPromote(true); return; }
    setConfirmPromote(false);
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
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeps}
            onChange={(e) => setIncludeDeps(e.target.checked)}
            disabled={running}
            className="accent-sky-600"
          />
          <span>
            Include Dependencies (InnerTree, Scripts...)
          </span>
        </label>
      )}

      <div className="flex items-center gap-2">
        {confirmPromote ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-700 font-medium">This will push to {task.target.environment}. Continue?</span>
            <button
              onClick={handlePromote}
              disabled={running}
              className="px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Yes, Promote
            </button>
            <button
              onClick={() => setConfirmPromote(false)}
              className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handlePromote}
            disabled={running || frConfigItems.length === 0}
            className="px-4 py-1.5 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {running ? "Promoting…" : "Promote Selected Items"}
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
          <ScopedLogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
        </div>
      )}
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
  visible,
  onComplete,
  onTaskStatusChange,
}: {
  task: PromotionTask;
  frConfigScopes: ConfigScope[];
  frodoScopes: string[];
  igaScopes: string[];
  targetIsControlled?: boolean;
  visible: boolean;
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
  onComplete,
}: {
  task: PromotionTask;
  visible: boolean;
  onComplete: (s: PhaseStatus) => void;
}) {
  const pullHook = useStreamingLogs();
  const compareHook = useStreamingLogs();
  const { setBusy } = useBusyState();
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { setBusy(pullHook.running || compareHook.running); }, [pullHook.running, compareHook.running, setBusy]);
  useEffect(() => {
    if (compareHook.exitCode !== null && !compareHook.running)
      onCompleteRef.current(compareHook.exitCode === 0 ? "done" : "failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareHook.exitCode, compareHook.running]);

  const frConfigItems = task.items.filter((i) => getCommandType(i.scope) === "fr-config");
  const anyRunning = pullHook.running || compareHook.running;

  const pullTarget = () => {
    pullHook.run("/api/pull", { environment: task.target.environment, scopes: task.items.map((i) => i.scope) });
  };

  const compare = () => {
    compareHook.run("/api/compare", {
      source: task.source,
      target: task.target,
      scopeSelections: frConfigItems,
      diffOptions: { includeMetadata: false, ignoreWhitespace: true },
    });
  };

  const compareLogs = compareHook.logs;
  const sourceLogs = compareLogs.filter((l) => l.side === "source");
  const targetLogs = compareLogs.filter((l) => l.side === "target");
  const sourceExitCode = compareLogs.find((l) => l.type === "exit" && l.side === "source")?.code ?? null;
  const targetExitCode = compareLogs.find((l) => l.type === "exit" && l.side === "target")?.code ?? null;
  const sourceRunning = compareHook.running && sourceExitCode === null;
  const targetRunning = compareHook.running && targetExitCode === null;

  return (
    <div className={cn(!visible && "hidden")}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Pull the target environment to confirm changes landed, then re-compare against source for the selected items — the diff should now be empty or show only expected differences.
        </p>
        <div className="flex flex-wrap gap-2">
          {task.target.mode === "local" ? (
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Target is local — pull not needed
            </div>
          ) : (
            <button
              onClick={pullTarget}
              disabled={anyRunning}
              className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {pullHook.running ? "Pulling…" : "Pull Target"}
            </button>
          )}
          <button
            onClick={compare}
            disabled={anyRunning || frConfigItems.length === 0}
            title={frConfigItems.length === 0 ? "No fr-config scopes in this task" : undefined}
            className="px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {compareHook.running ? "Comparing…" : "Re-compare Source vs Target"}
          </button>
          {anyRunning && (
            <button
              onClick={() => { pullHook.abort(); compareHook.abort(); }}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
            >
              Abort
            </button>
          )}
        </div>

        {/* Pull logs */}
        {(pullHook.running || pullHook.logs.length > 0) && (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <ScopedLogViewer logs={pullHook.logs} running={pullHook.running} exitCode={pullHook.exitCode} onClear={pullHook.clear} />
          </div>
        )}

        {/* Compare console */}
        {(compareHook.running || compareLogs.length > 0) && (
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

        {/* Diff report */}
        {compareHook.report && !compareHook.running && <DiffReport report={compareHook.report} />}
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

  const updatePhase = (id: PhaseId, status: PhaseStatus) =>
    setPhaseStatuses((prev) => ({ ...prev, [id]: status }));

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
                onClick={() => {
                  if (blocked) return;
                  if (
                    nextPhase.id === "dry-run" &&
                    task.target.mode === "local"
                  ) {
                    if (!window.confirm(
                      `The task target "${task.target.environment}" is set to Local mode.\n\nDry run compares the source against the target environment. A local target means no live remote data will be fetched.\n\nContinue anyway?`
                    )) return;
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
          onComplete={(s) => updatePhase("dry-run", s)}
        />
        <PromotePhase
          task={task}
          frConfigScopes={frConfigScopes}
          frodoScopes={frodoScopes}
          igaScopes={igaScopes}
          targetIsControlled={(() => { const t = environments.find((e) => e.name === task.target.environment); return t?.type === "controlled" && !t?.devEnvironment; })()}
          visible={activePhase === "promote"}
          onComplete={(s) => updatePhase("promote", s)}
          onTaskStatusChange={onTaskStatusChange}
        />
        <VerifyPhase
          task={task}
          visible={activePhase === "verify"}
          onComplete={(s) => updatePhase("verify", s)}
        />
      </div>
    </div>
  );
}
