"use client";

import { useCallback, useState } from "react";
import type { PromotionTask } from "@/lib/promotion-tasks";
import type { Environment } from "@/lib/fr-config-types";
import type { CompareReport } from "@/lib/diff-types";
import { DiffReport } from "@/app/compare/DiffReport";
import { formatScopeLabel } from "@/lib/compare";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ArchiveView({
  tasks: initialTasks,
  environments,
}: {
  tasks: PromotionTask[];
  environments: Environment[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedId, setSelectedId] = useState<string | null>(initialTasks[0]?.id ?? null);
  const [report, setReport] = useState<CompareReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportExpanded, setReportExpanded] = useState(false);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const envMap = new Map(environments.map((e) => [e.name, e]));

  const selectTask = (id: string) => {
    setSelectedId(id);
    setReport(null);
    setReportError(null);
    setReportExpanded(false);
  };

  const loadReport = useCallback(() => {
    if (!selected?.reportId || report || reportLoading) return;
    setReportLoading(true);
    setReportError(null);
    fetch(`/api/history/${selected.reportId}/report`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<CompareReport>;
      })
      .then((data) => { setReport(data); setReportExpanded(true); })
      .catch((e) => setReportError(e.message))
      .finally(() => setReportLoading(false));
  }, [selected?.reportId, report, reportLoading]);

  const handleRestore = async (task: PromotionTask) => {
    const res = await fetch(`/api/promotion-tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archivedAt: null }),
    });
    if (res.ok) {
      const remaining = tasks.filter((t) => t.id !== task.id);
      setTasks(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setReport(null);
    }
  };

  const handleDelete = async (task: PromotionTask) => {
    if (!window.confirm(`Permanently delete "${task.name}"?`)) return;
    const res = await fetch(`/api/promotion-tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = tasks.filter((t) => t.id !== task.id);
      setTasks(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setReport(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
      {/* Left: task list */}
      <div className="card overflow-hidden lg:sticky lg:top-20">
        <div className="px-3 py-2.5 border-b border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Archived ({tasks.length})
          </span>
        </div>
        {tasks.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-400 text-center">No archived tasks.</p>
        ) : (
          <ol className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {tasks.map((task) => {
              const isSelected = selectedId === task.id;
              const srcEnv = envMap.get(task.source.environment);
              const tgtEnv = envMap.get(task.target.environment);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => selectTask(task.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer hover:bg-slate-50",
                      isSelected && "bg-indigo-50"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                      task.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {task.status === "completed" ? "✓" : "!"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={cn("block text-[13px] truncate", isSelected ? "font-semibold text-indigo-700" : "text-slate-700")}>
                        {task.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate max-w-[70px]">{srcEnv?.label ?? task.source.environment}</span>
                        <span>→</span>
                        <span className="truncate max-w-[70px]">{tgtEnv?.label ?? task.target.environment}</span>
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {task.archivedAt ? timeAgo(task.archivedAt) : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Right: detail */}
      {selected ? (
        <div className="card-padded space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{selected.name}</h2>
              {selected.description && <p className="text-xs text-slate-500 mt-0.5">{selected.description}</p>}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                  selected.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {selected.status === "completed" ? "Completed" : "Failed"}
                </span>
                <span className="text-slate-400">·</span>
                <span>{envMap.get(selected.source.environment)?.label ?? selected.source.environment}</span>
                <span>→</span>
                <span>{envMap.get(selected.target.environment)?.label ?? selected.target.environment}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleRestore(selected)}
                className="px-2.5 py-1 text-xs border border-sky-200 text-sky-700 rounded hover:bg-sky-50 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-slate-400">Created</dt>
            <dd className="text-slate-700">{new Date(selected.createdAt).toLocaleString()}</dd>
            <dt className="text-slate-400">Last updated</dt>
            <dd className="text-slate-700">{new Date(selected.updatedAt).toLocaleString()}</dd>
            {selected.archivedAt && (
              <>
                <dt className="text-slate-400">Archived</dt>
                <dd className="text-slate-700">{new Date(selected.archivedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>

          {/* Items */}
          <div>
            <div className="label-xs mb-2">SCOPE ITEMS</div>
            <div className="space-y-2">
              {selected.items.map((sel) => (
                <div key={sel.scope}>
                  <div className="text-[11px] font-semibold text-slate-600">{formatScopeLabel(sel.scope)}</div>
                  {sel.items && sel.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sel.items.map((item) => (
                        <span key={item} className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-200 bg-slate-50 text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic mt-0.5">All items in scope</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Diff report */}
          <div>
            <div className="label-xs mb-2">DRY-RUN DIFF REPORT</div>
            {!selected.reportId ? (
              <p className="text-xs text-slate-400 italic">No diff report saved for this task.</p>
            ) : !report && !reportLoading && !reportError ? (
              <button
                type="button"
                onClick={loadReport}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Load diff report
              </button>
            ) : reportLoading ? (
              <p className="text-xs text-slate-400">Loading report...</p>
            ) : reportError ? (
              <p className="text-xs text-rose-500">Failed to load report ({reportError})</p>
            ) : report ? (
              <div>
                <button
                  type="button"
                  onClick={() => setReportExpanded((v) => !v)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2"
                >
                  {reportExpanded ? "Hide diff report" : "Show diff report"}
                </button>
                {reportExpanded && <DiffReport report={report} mode="dry-run" />}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card-padded text-center text-sm text-slate-400 py-10">
          {tasks.length > 0 ? "Select a task to view its details." : "No archived tasks yet. Complete or fail a promotion task and archive it."}
        </div>
      )}
    </div>
  );
}
