"use client";

import { useState, useEffect, useRef } from "react";
import {
  Environment,
  ConfigScope,
  ScopeSelection,
  PROMOTE_SUBCOMMANDS,
  PromoteSubcommand,
} from "@/lib/fr-config-types";
import type { PromotionTask, TaskStatus, TaskEndpoint } from "@/lib/promotion-tasks";
import { PromotionItemPicker } from "./PromotionItemPicker";
import { LogViewer } from "@/components/LogViewer";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import { useBusyState } from "@/hooks/useBusyState";
import { cn } from "@/lib/utils";

// ── Status ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
  "new":         { label: "New",         badge: "bg-slate-100 text-slate-600 border-slate-200",          dot: "bg-slate-400" },
  "in-progress": { label: "In Progress", badge: "bg-sky-100 text-sky-700 border-sky-200",                dot: "bg-sky-500 animate-pulse" },
  "completed":   { label: "Completed",   badge: "bg-emerald-100 text-emerald-700 border-emerald-200",    dot: "bg-emerald-500" },
  "failed":      { label: "Failed",      badge: "bg-red-100 text-red-700 border-red-200",                dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0", cfg.badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Endpoint selector ─────────────────────────────────────────────────────────

type Mode = "local" | "remote";

function EndpointSelector({
  label,
  value,
  onChange,
  environments,
  disabled,
}: {
  label: string;
  value: TaskEndpoint;
  onChange: (v: TaskEndpoint) => void;
  environments: Environment[];
  disabled?: boolean;
}) {
  return (
    <div className="flex-1 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</div>
      <select
        value={value.environment}
        onChange={(e) => onChange({ ...value, environment: e.target.value })}
        disabled={disabled}
        className="block w-full rounded border border-slate-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
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
              "flex-1 flex items-center justify-center py-1 rounded border text-xs font-medium transition-colors select-none",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              value.mode === m
                ? "bg-sky-600 border-sky-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-sky-400"
            )}
          >
            <input
              type="radio"
              className="sr-only"
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

// ── Subcommand card styles ────────────────────────────────────────────────────

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

// ── Task form state ───────────────────────────────────────────────────────────

interface TaskFormState {
  name: string;
  description: string;
  source: TaskEndpoint;
  target: TaskEndpoint;
  items: ScopeSelection[];
}

function emptyForm(environments: Environment[]): TaskFormState {
  const first = environments[0]?.name ?? "";
  return {
    name: "",
    description: "",
    source: { environment: first, mode: "remote" },
    target: { environment: first, mode: "remote" },
    items: [],
  };
}

function taskToForm(task: PromotionTask): TaskFormState {
  return {
    name: task.name,
    description: task.description,
    source: task.source,
    target: task.target,
    items: task.items,
  };
}

// ── Task form ─────────────────────────────────────────────────────────────────

function TaskForm({
  form,
  environments,
  saving,
  isEdit,
  onChange,
  onSave,
  onCancel,
}: {
  form: TaskFormState;
  environments: Environment[];
  saving: boolean;
  isEdit: boolean;
  onChange: (patch: Partial<TaskFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800">{isEdit ? "Edit Task" : "New Task"}</h2>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-260px)]">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Promote journeys to SIT"
            className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Optional notes about this promotion…"
            className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        {/* Source → Target */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Pipeline Direction</label>
          <div className="flex items-center gap-2">
            <EndpointSelector
              label="Source"
              value={form.source}
              onChange={(source) => onChange({ source })}
              environments={environments}
            />
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <EndpointSelector
              label="Target"
              value={form.target}
              onChange={(target) => onChange({ target })}
              environments={environments}
            />
          </div>
        </div>

        {/* Items to promote */}
        <PromotionItemPicker
          environment={form.source.environment}
          value={form.items}
          onChange={(items) => onChange({ items })}
        />
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="px-4 py-1.5 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </div>
  );
}

// ── Task detail + execution panel ─────────────────────────────────────────────

function TaskDetail({
  task,
  environments,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: PromotionTask;
  environments: Environment[];
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const envMap = new Map(environments.map((e) => [e.name, e]));
  const sourceEnv = envMap.get(task.source.environment);
  const targetEnv = envMap.get(task.target.environment);

  const [activeSubcommand, setActiveSubcommand] = useState<PromoteSubcommand | null>(null);
  const [confirmDanger, setConfirmDanger] = useState<PromoteSubcommand | null>(null);
  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();
  const { setBusy } = useBusyState();

  // Keep onStatusChange stable inside effects via a ref
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; });

  useEffect(() => { setBusy(running); }, [running, setBusy]);

  // Auto-update status on run-promotion completion
  useEffect(() => {
    if (activeSubcommand === "run-promotion" && exitCode !== null && !running) {
      onStatusChangeRef.current(exitCode === 0 ? "completed" : "failed");
    }
  }, [exitCode, running, activeSubcommand]);

  const handleRun = (subcommand: PromoteSubcommand) => {
    const def = PROMOTE_SUBCOMMANDS.find((s) => s.value === subcommand)!;
    if (def.variant === "danger" && confirmDanger !== subcommand) {
      setConfirmDanger(subcommand);
      return;
    }
    setConfirmDanger(null);
    setActiveSubcommand(subcommand);
    if (task.status === "new") onStatusChange("in-progress");
    run("/api/promote", { environment: task.target.environment, subcommand });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-800">{task.name}</h2>
              <StatusBadge status={task.status} />
            </div>
            {task.description && (
              <p className="text-xs text-slate-500">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
              disabled={running}
              className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <button
              onClick={onEdit}
              disabled={running}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={running}
              className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Source → Target */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {sourceEnv
              ? <EnvironmentBadge env={sourceEnv} />
              : <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 border border-slate-200">{task.source.environment}</span>
            }
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{task.source.mode}</span>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="flex items-center gap-1.5">
            {targetEnv
              ? <EnvironmentBadge env={targetEnv} />
              : <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 border border-slate-200">{task.target.environment}</span>
            }
            <span className="text-[10px] text-slate-400 font-semibold uppercase">{task.target.mode}</span>
          </div>
        </div>

        {/* Scopes */}
        {task.items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.items.map(({ scope }) => (
              <span key={scope} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono border border-slate-200">
                {scope}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Execution */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-500">
            Running against:{" "}
            <span className="font-medium text-slate-700">{targetEnv?.label ?? task.target.environment}</span>
            <span className="text-slate-400 ml-1">({task.target.mode})</span>
          </p>
          {running && (
            <button
              onClick={abort}
              className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors"
            >
              Abort
            </button>
          )}
        </div>
        {task.items.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            No scope items selected — edit the task to choose what to promote before running.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PROMOTE_SUBCOMMANDS.map((cmd) => {
            const isActive = activeSubcommand === cmd.value && (running || exitCode !== null);
            const isPendingConfirm = confirmDanger === cmd.value;
            return (
              <div
                key={cmd.value}
                className={cn(
                  "rounded-lg border-2 p-3 transition-colors",
                  VARIANT_STYLES[cmd.variant],
                  isActive && "ring-2 ring-offset-1 ring-slate-400"
                )}
              >
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-xs">{cmd.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{cmd.description}</p>
                  </div>
                  {isPendingConfirm ? (
                    <div className="space-y-1">
                      <p className="text-xs text-red-700 font-medium">Are you sure?</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRun(cmd.value)}
                          disabled={running}
                          className="flex-1 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDanger(null)}
                          className="flex-1 px-2 py-1 text-xs rounded border border-slate-300 hover:bg-white"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRun(cmd.value)}
                      disabled={running || task.items.length === 0}
                      className={cn(
                        "w-full px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                        VARIANT_BUTTON_STYLES[cmd.variant]
                      )}
                    >
                      {running && activeSubcommand === cmd.value ? "Running…" : "Run"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(running || logs.length > 0) && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type PanelMode = "select" | "new" | "edit" | "view";

export function PromoteWorkflow({
  environments,
  initialTasks,
}: {
  environments: Environment[];
  initialTasks: PromotionTask[];
}) {
  const [tasks, setTasks] = useState<PromotionTask[]>(initialTasks);
  const [selectedId, setSelectedId] = useState<string | null>(initialTasks[0]?.id ?? null);
  const [panelMode, setPanelMode] = useState<PanelMode>(initialTasks.length > 0 ? "view" : "select");
  const [form, setForm] = useState<TaskFormState>(emptyForm(environments));
  const [saving, setSaving] = useState(false);
  const { busy } = useBusyState();

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  const openNew = () => {
    setForm(emptyForm(environments));
    setPanelMode("new");
    setSelectedId(null);
  };

  const openEdit = () => {
    if (!selectedTask) return;
    setForm(taskToForm(selectedTask));
    setPanelMode("edit");
  };

  const cancelForm = () => {
    if (selectedId && tasks.find((t) => t.id === selectedId)) {
      setPanelMode("view");
    } else {
      setSelectedId(tasks[0]?.id ?? null);
      setPanelMode(tasks.length > 0 ? "view" : "select");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const items = form.items;

    if (panelMode === "new") {
      const res = await fetch("/api/promotion-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          source: form.source,
          target: form.target,
          items,
        }),
      });
      if (res.ok) {
        const created: PromotionTask = await res.json();
        setTasks((prev) => [...prev, created]);
        setSelectedId(created.id);
        setPanelMode("view");
      }
    } else if (panelMode === "edit" && selectedId) {
      const res = await fetch(`/api/promotion-tasks/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          source: form.source,
          target: form.target,
          items,
        }),
      });
      if (res.ok) {
        const updated: PromotionTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setPanelMode("view");
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    if (!confirm(`Delete task "${selectedTask.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/promotion-tasks/${selectedTask.id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = tasks.filter((t) => t.id !== selectedTask.id);
      setTasks(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setPanelMode(remaining.length > 0 ? "view" : "select");
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const res = await fetch(`/api/promotion-tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated: PromotionTask = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-2">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {tasks.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">No promotion tasks yet.</p>
          )}
          {tasks.map((task) => {
            const srcEnv = environments.find((e) => e.name === task.source.environment);
            const tgtEnv = environments.find((e) => e.name === task.target.environment);
            const isSelected = selectedId === task.id && panelMode === "view";
            return (
              <div
                key={task.id}
                onClick={() => { if (!busy) { setSelectedId(task.id); setPanelMode("view"); } }}
                className={cn(
                  "px-4 py-3 transition-colors",
                  busy ? "cursor-default opacity-60" : "cursor-pointer hover:bg-slate-50",
                  isSelected && "bg-sky-50 border-l-4 border-l-sky-500"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800 truncate">{task.name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="truncate max-w-[90px]">{srcEnv?.label ?? task.source.environment}</span>
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="truncate max-w-[90px]">{tgtEnv?.label ?? task.target.environment}</span>
                </div>
                {task.items.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {task.items.length} scope{task.items.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={panelMode === "new" ? cancelForm : openNew}
          disabled={busy}
          className={cn(
            "w-full px-4 py-2 border-2 rounded-lg text-sm transition-colors disabled:opacity-50",
            panelMode === "new"
              ? "border-slate-300 text-slate-500 hover:bg-slate-50"
              : "border-dashed border-slate-300 text-slate-500 hover:border-sky-400 hover:text-sky-600"
          )}
        >
          {panelMode === "new" ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2">
        {(panelMode === "new" || panelMode === "edit") && (
          <TaskForm
            form={form}
            environments={environments}
            saving={saving}
            isEdit={panelMode === "edit"}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        )}

        {panelMode === "view" && selectedTask && (
          <TaskDetail
            key={selectedTask.id}
            task={selectedTask}
            environments={environments}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={(status) => handleStatusChange(selectedTask.id, status)}
          />
        )}

        {(panelMode === "select" || (panelMode === "view" && !selectedTask)) && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Select a task or create a new one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
