"use client";

import { useEffect, useRef, useState } from "react";
import { ConfigScope, CONFIG_SCOPES } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditEntry {
  scope: string;
  fileCount: number;
  exists: boolean;
  items: string[];
  selectable: boolean;
}

export interface PlanSelections {
  /** scope -> null means all items; string[] means specific items */
  [scope: string]: string[] | null;
}

interface PushPlanPanelProps {
  environment: string;
  scopes: ConfigScope[];
  selections: PlanSelections;
  onScopeToggle: (scope: ConfigScope, included: boolean) => void;
  onItemsChange: (scope: ConfigScope, items: string[] | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function scopeLabel(scope: string): string {
  return CONFIG_SCOPES.find((s) => s.value === scope)?.label ?? scope;
}

// ── Scope row ──────────────────────────────────────────────────────────────────

function ScopeRow({
  entry,
  included,
  selectedItems,
  onToggleScope,
  onToggleItem,
}: {
  entry: AuditEntry;
  included: boolean;
  selectedItems: string[] | null; // null = all
  onToggleScope: (v: boolean) => void;
  onToggleItem: (item: string, v: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasItems = entry.items.length > 0;

  const allSelected = selectedItems === null;
  const selectedSet = new Set(selectedItems ?? []);
  const checkedCount = allSelected ? entry.items.length : selectedSet.size;

  const handleScopeCheck = () => onToggleScope(!included);

  const handleAllItems = () => {
    // If currently all selected, deselect all (empty array)
    // If partially/none selected, select all (null = all)
    if (allSelected) {
      onToggleItem("__none__", false); // signal to set []
    } else {
      onToggleItem("__all__", true); // signal to set null
    }
  };

  return (
    <div className={cn("border-b border-slate-100 last:border-b-0", !included && "opacity-50")}>
      {/* Scope header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
        {/* Scope-level checkbox */}
        <input
          type="checkbox"
          checked={included}
          onChange={handleScopeCheck}
          className="w-3.5 h-3.5 accent-emerald-600 shrink-0 cursor-pointer"
        />

        <span className="flex-1 text-xs font-medium text-slate-700">{scopeLabel(entry.scope)}</span>

        {/* Item count badge */}
        {included && entry.selectable && hasItems && (
          <span className="text-[10px] text-slate-400 tabular-nums font-mono">
            {checkedCount}/{entry.items.length}
          </span>
        )}

        {/* Selectable: all-items toggle */}
        {included && entry.selectable && hasItems && (
          <button
            type="button"
            onClick={handleAllItems}
            className="text-[10px] text-sky-600 hover:text-sky-800 shrink-0"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}

        {/* Non-selectable: badge */}
        {entry.selectable === false && hasItems && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            all files
          </span>
        )}

        {/* Expand toggle */}
        {hasItems && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-slate-400 hover:text-slate-600"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <svg
              className={cn("w-3 h-3 transition-transform", open ? "" : "-rotate-90")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {!hasItems && (
          <span className="text-[10px] text-amber-500">no files</span>
        )}
      </div>

      {/* Item list */}
      {open && hasItems && (
        <div className="px-3 pb-2 space-y-0.5 bg-slate-50/60">
          {entry.items.map((item) => {
            const checked = allSelected || selectedSet.has(item);
            return (
              <label
                key={item}
                className={cn(
                  "flex items-center gap-2 py-0.5 select-none",
                  entry.selectable ? "cursor-pointer" : "cursor-default"
                )}
              >
                {entry.selectable ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!included}
                    onChange={(e) => onToggleItem(item, e.target.checked)}
                    className="w-3 h-3 accent-sky-600 shrink-0"
                  />
                ) : (
                  <span className="w-3 h-3 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-[11px] font-mono truncate",
                    included && checked ? "text-slate-600" : "text-slate-400"
                  )}
                >
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PushPlanPanel({
  environment,
  scopes,
  selections,
  onScopeToggle,
  onItemsChange,
}: PushPlanPanelProps) {
  const [auditData, setAuditData] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scopeKey = scopes.join(",");

  useEffect(() => {
    if (!scopes.length) { setAuditData(null); return; }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ environment, scopes: scopeKey });
        const res = await fetch(`/api/push/audit?${params}`);
        if (res.ok) setAuditData(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, scopeKey]);

  const totalSelected = auditData
    ? auditData.reduce((sum, e) => {
        if (!Object.prototype.hasOwnProperty.call(selections, e.scope)) return sum;
        const sel = selections[e.scope];
        return sum + (sel === null ? e.items.length : sel.length);
      }, 0)
    : 0;

  const handleToggleItem = (scope: ConfigScope, item: string, checked: boolean) => {
    if (item === "__all__") { onItemsChange(scope, null); return; }
    if (item === "__none__") { onItemsChange(scope, []); return; }

    const entry = auditData?.find((e) => e.scope === scope);
    if (!entry) return;

    const current = selections[scope];
    const currentSet = new Set(current === null ? entry.items : (current ?? []));
    if (checked) currentSet.add(item);
    else currentSet.delete(item);

    // If all items are selected, collapse to null (all)
    const allSelected = entry.items.every((i) => currentSet.has(i));
    onItemsChange(scope, allSelected ? null : [...currentSet]);
  };

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-700">Push Plan</span>
        {!loading && auditData && (
          <span className="text-xs text-slate-400 tabular-nums">
            {Object.keys(selections).length} scope{Object.keys(selections).length !== 1 ? "s" : ""} · {totalSelected} item{totalSelected !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Scope list */}
      <div className="divide-y divide-slate-100">
        {loading
          ? scopes.map((scope) => (
              <div key={scope} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                <div className="h-3 flex-1 bg-slate-100 rounded" />
              </div>
            ))
          : auditData?.map((entry) => (
              <ScopeRow
                key={entry.scope}
                entry={entry}
                included={Object.prototype.hasOwnProperty.call(selections, entry.scope)}
                selectedItems={selections[entry.scope] ?? null}
                onToggleScope={(v) => onScopeToggle(entry.scope as ConfigScope, v)}
                onToggleItem={(item, checked) =>
                  handleToggleItem(entry.scope as ConfigScope, item, checked)
                }
              />
            ))}
      </div>
    </div>
  );
}
