"use client";

import { useState, useEffect } from "react";
import { Environment, ScopeSelection, CONFIG_SCOPES } from "@/lib/fr-config-types";
import type { PromotionTask, TaskStatus, TaskEndpoint } from "@/lib/promotion-tasks";
import { PromotionItemPicker } from "./PromotionItemPicker";
import { PromoteExecution } from "./PromoteExecution";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
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

// ── Task form state ───────────────────────────────────────────────────────────

interface TaskFormState {
  name: string;
  description: string;
  source: TaskEndpoint;
  target: TaskEndpoint;
  items: ScopeSelection[];
  includeDeps: boolean;
}

function emptyForm(environments: Environment[]): TaskFormState {
  const first = environments[0]?.name ?? "";
  return {
    name: "",
    description: "",
    source: { environment: first, mode: "remote" },
    target: { environment: first, mode: "remote" },
    items: [],
    includeDeps: false,
  };
}

function taskToForm(task: PromotionTask): TaskFormState {
  return {
    name: task.name,
    description: task.description,
    source: task.source,
    target: task.target,
    items: task.items,
    includeDeps: task.includeDeps ?? false,
  };
}

// ── Task form ─────────────────────────────────────────────────────────────────

// ── Fullscreen toggle icon ─────────────────────────────────────────────────────

function FullscreenToggle({ fullscreen, onToggle }: { fullscreen: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={fullscreen ? "Exit full screen (Esc)" : "Full screen"}
      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
    >
      {fullscreen ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      )}
    </button>
  );
}

// ── Task form ─────────────────────────────────────────────────────────────────

function TaskForm({
  form,
  environments,
  saving,
  isEdit,
  fullscreen,
  onToggleFullscreen,
  onChange,
  onSave,
  onCancel,
}: {
  form: TaskFormState;
  environments: Environment[];
  saving: boolean;
  isEdit: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onChange: (patch: Partial<TaskFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inner = (
    <>
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-slate-800">{isEdit ? "Edit Task" : "New Task"}</h2>
        <FullscreenToggle fullscreen={fullscreen} onToggle={onToggleFullscreen} />
      </div>

      <div className={cn("p-4 space-y-4 overflow-y-auto", fullscreen ? "flex-1" : "max-h-[calc(100vh-260px)]")}>
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

        {/* Selected items summary — mirrors the task view */}
        {form.items.length > 0 && (
          <ScopesSummary
            items={form.items}
            sourceEnvironment={form.source.environment}
            onRemoveScope={(scope) => {
              onChange({ items: form.items.filter((i) => i.scope !== scope) });
            }}
            onRemoveItem={(scope, itemId) => {
              const updated = form.items.map((i) => {
                if (i.scope !== scope) return i;
                // If all items selected (items undefined/null), we can't remove one without knowing the full list
                // So just remove the whole scope for now — the picker will reload
                if (!i.items) return null;
                const remaining = i.items.filter((id) => id !== itemId);
                return remaining.length > 0 ? { ...i, items: remaining } : null;
              }).filter((i): i is ScopeSelection => i !== null);
              onChange({ items: updated });
            }}
            includeDeps={form.includeDeps}
            onIncludeDepsChange={(v) => onChange({ includeDeps: v })}
          />
        )}

        {/* Items to promote */}
        <PromotionItemPicker
          environment={form.source.environment}
          environments={environments}
          value={form.items}
          onChange={(items) => onChange({ items })}
        />
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
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
    </>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 z-50 flex flex-col bg-white">{inner}</div>;
  }
  return <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">{inner}</div>;
}

// ── Scope summary ─────────────────────────────────────────────────────────────

interface AuditItem { id: string; label: string; }
interface ScopeAuditEntry { scope: string; items: AuditItem[]; }

function scopeLabel(scope: string) {
  return CONFIG_SCOPES.find((s) => s.value === scope)?.label ?? scope;
}

const SCOPE_CMD_COLOR: Record<string, string> = {
  "fr-config": "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-400",
  "frodo":     "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400",
  "iga-api":   "bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400",
};
const ITEM_CHIP: Record<string, string> = {
  "fr-config": "bg-white border-slate-200 text-slate-600",
  "frodo":     "bg-white border-purple-200 text-purple-700",
  "iga-api":   "bg-white border-teal-200 text-teal-700",
};

function ScopesSummary({
  items,
  sourceEnvironment,
  onRemoveScope,
  onRemoveItem,
  includeDeps,
  onIncludeDepsChange,
}: {
  items: ScopeSelection[];
  sourceEnvironment: string;
  onRemoveScope?: (scope: string) => void;
  onRemoveItem?: (scope: string, itemId: string) => void;
  includeDeps?: boolean;
  onIncludeDepsChange?: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const [auditMap, setAuditMap] = useState<Record<string, ScopeAuditEntry>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    const scopes = items.map((i) => i.scope).join(",");
    setLoading(true);
    const params = new URLSearchParams({ environment: sourceEnvironment, scopes });
    fetch(`/api/push/audit?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: ScopeAuditEntry[]) => {
        setAuditMap(Object.fromEntries(data.map((e) => [e.scope, e])));
      })
      .finally(() => setLoading(false));
  }, [items, sourceEnvironment]);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {/* Pills row + toggle */}
      <div className="flex items-start gap-2">
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {items.map(({ scope, items: selected }) => {
            const cmdType = CONFIG_SCOPES.find((s) => s.value === scope)?.commandType ?? "fr-config";
            const isAll = selected === undefined || selected === null;
            const count = isAll ? null : selected.length;
            return (
              <span
                key={scope}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium",
                  SCOPE_CMD_COLOR[cmdType]
                )}
              >
                {scopeLabel(scope)}
                <span className="text-[9px] px-1 rounded bg-white/80">
                  {isAll ? "all" : `×${count}`}
                </span>
                {onRemoveScope && (
                  <button
                    type="button"
                    onClick={() => onRemoveScope(scope)}
                    title={`Remove ${scopeLabel(scope)}`}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            );
          })}
          {items.some((i) => i.scope === "journeys") && (
            onIncludeDepsChange ? (
              <label className="inline-flex items-center gap-1 text-[10px] text-sky-700 cursor-pointer select-none ml-1">
                <input
                  type="checkbox"
                  checked={includeDeps ?? false}
                  onChange={(e) => onIncludeDepsChange(e.target.checked)}
                  className="accent-sky-600 w-3 h-3"
                />
                Include Dependencies (InnerTree, Scripts...)
              </label>
            ) : (
              <span className={cn("text-[10px] ml-1 px-1.5 py-0.5 rounded", includeDeps ? "text-sky-700 bg-sky-50" : "text-slate-400 bg-slate-50")}>
                {includeDeps ? "dependencies included" : "dependencies NOT included"}
              </span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={open ? "Collapse items" : "Expand items"}
          className="shrink-0 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg
            className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Unified expanded panel */}
      {open && (
        <div className="rounded-md border border-slate-200 bg-white divide-y divide-slate-100">
          {loading ? (
            <div className="px-3 py-2.5 flex flex-wrap gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-5 w-20 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : items.map(({ scope, items: selected }) => {
            const cmdType = CONFIG_SCOPES.find((s) => s.value === scope)?.commandType ?? "fr-config";
            const audit = auditMap[scope];
            const isAll = selected === undefined || selected === null;
            const specificIds = selected ?? [];
            const resolvedItems: AuditItem[] = isAll
              ? (audit?.items ?? [])
              : specificIds.map((id) => audit?.items.find((i) => i.id === id) ?? { id, label: id.replace(/\.json$/, "") });

            return (
              <div key={scope} className="px-3 py-2.5 space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  {scopeLabel(scope)}
                  <span className="normal-case font-normal tracking-normal text-slate-400">
                    {isAll
                      ? `— all${resolvedItems.length > 0 ? ` (${resolvedItems.length})` : ""}`
                      : `— ${specificIds.length}${audit ? ` of ${audit.items.length}` : ""} selected`
                    }
                  </span>
                </div>
                {resolvedItems.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No items found in source config.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {resolvedItems.map((item) => (
                      <span
                        key={item.id}
                        title={item.id !== item.label ? item.id : undefined}
                        className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border", ITEM_CHIP[cmdType])}
                      >
                        {item.label}
                        {onRemoveItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveItem(scope, item.id)}
                            title={`Remove ${item.label}`}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Task detail + execution panel ─────────────────────────────────────────────

function TaskDetail({
  task,
  environments,
  fullscreen,
  onToggleFullscreen,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: PromotionTask;
  environments: Environment[];
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const envMap = new Map(environments.map((e) => [e.name, e]));
  const sourceEnv = envMap.get(task.source.environment);
  const targetEnv = envMap.get(task.target.environment);
  const { busy } = useBusyState();

  const header = (
    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
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
            disabled={busy}
            className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <button
            onClick={onEdit}
            disabled={busy}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
          <FullscreenToggle fullscreen={fullscreen} onToggle={onToggleFullscreen} />
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
      <ScopesSummary items={task.items} sourceEnvironment={task.source.environment} includeDeps={task.includeDeps} />
    </div>
  );

  const body = (
    <div className={cn(fullscreen && "flex-1 overflow-y-auto")}>
      <PromoteExecution task={task} environments={environments} onTaskStatusChange={onStatusChange} />
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {header}
        {body}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {header}
      {body}
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
  const [fullscreen, setFullscreen] = useState(false);
  const { busy } = useBusyState();

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  const openNew = () => {
    setForm(emptyForm(environments));
    setPanelMode("new");
    setSelectedId(null);
    setFullscreen(false);
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
          includeDeps: form.includeDeps,
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
          includeDeps: form.includeDeps,
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
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((f) => !f)}
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
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((f) => !f)}
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
