"use client";

import { useEffect, useRef, useState } from "react";
import { ConfigScope, CONFIG_SCOPES } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";
import { ItemViewer } from "./ItemViewer";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditItem {
  id: string;
  label: string;
}

interface AuditEntry {
  scope: string;
  fileCount: number;
  exists: boolean;
  items: AuditItem[];
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
  onViewItem,
}: {
  entry: AuditEntry;
  included: boolean;
  selectedItems: string[] | null;
  onToggleScope: (v: boolean) => void;
  onToggleItem: (item: string, v: boolean) => void;
  onViewItem: (item: AuditItem) => void;
}) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  const hasItems = entry.items.length > 0;

  const allSelected = selectedItems === null;
  const selectedSet = new Set(selectedItems ?? []);
  const checkedCount = allSelected ? entry.items.length : selectedSet.size;

  const query = filter.trim().toLowerCase();
  const visibleItems = query
    ? entry.items.filter((item) => item.label.toLowerCase().includes(query))
    : entry.items;

  const handleAllItems = () => {
    if (allSelected) onToggleItem("__none__", false);
    else onToggleItem("__all__", true);
  };

  return (
    <div className={cn("border-b border-slate-100 last:border-b-0", !included && "opacity-50")}>
      {/* Scope header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
        <input
          type="checkbox"
          checked={included}
          onChange={() => onToggleScope(!included)}
          className="w-3.5 h-3.5 accent-emerald-600 shrink-0 cursor-pointer"
        />
        <span className="flex-1 text-xs font-medium text-slate-700">{scopeLabel(entry.scope)}</span>

        {included && entry.selectable && hasItems && (
          <span className="text-[10px] text-slate-400 tabular-nums font-mono">
            {checkedCount}/{entry.items.length}
          </span>
        )}
        {included && entry.selectable && hasItems && (
          <button type="button" onClick={handleAllItems} className="text-[10px] text-sky-600 hover:text-sky-800 shrink-0">
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}
        {!entry.selectable && hasItems && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">all files</span>
        )}
        {hasItems && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-slate-600">
            <svg className={cn("w-3 h-3 transition-transform", open ? "" : "-rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        {!hasItems && <span className="text-[10px] text-amber-500">no files</span>}
      </div>

      {/* Filter bar — shown when open and has items */}
      {open && hasItems && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-slate-100">
          <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${entry.items.length} item${entry.items.length !== 1 ? "s" : ""}…`}
            className="flex-1 text-[11px] bg-transparent text-slate-700 placeholder-slate-400 outline-none min-w-0"
          />
          {filter && (
            <button
              type="button"
              onClick={() => { setFilter(""); filterRef.current?.focus(); }}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {query && (
            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
              {visibleItems.length}/{entry.items.length}
            </span>
          )}
        </div>
      )}

      {/* Item list */}
      {open && hasItems && (
        <div className="px-3 pb-2 space-y-0.5 bg-slate-50/60">
          {visibleItems.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-2 text-center">No matches</p>
          ) : (
            visibleItems.map((item) => {
              const checked = allSelected || selectedSet.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-0.5 group"
                >
                  <label className={cn("flex items-center gap-2 flex-1 min-w-0 select-none", entry.selectable ? "cursor-pointer" : "cursor-default")}>
                    {entry.selectable ? (
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!included}
                        onChange={(e) => onToggleItem(item.id, e.target.checked)}
                        className="w-3 h-3 accent-sky-600 shrink-0"
                      />
                    ) : (
                      <span className="w-3 h-3 shrink-0" />
                    )}
                    <span className={cn("text-[11px] truncate", included && checked ? "text-slate-600" : "text-slate-400")}>
                      {item.label}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onViewItem(item)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-600 shrink-0 transition-opacity"
                    title="View file"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
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
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<{ scope: string; item: AuditItem } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scopeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scopeKey = scopes.join(",");

  // Fetch audit data
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

  // Track active scope via IntersectionObserver on the scroll container
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !auditData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting scope
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveScope(visible[0].target.getAttribute("data-scope"));
        }
      },
      { root: container, threshold: 0.1 }
    );

    for (const el of Object.values(scopeRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [auditData]);

  const scrollToScope = (scope: string) => {
    scopeRefs.current[scope]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    const allIds = entry.items.map((i) => i.id);
    const currentSet = new Set(current === null ? allIds : (current ?? []));
    if (checked) currentSet.add(item);
    else currentSet.delete(item);

    const allSelected = allIds.every((id) => currentSet.has(id));
    onItemsChange(scope, allSelected ? null : [...currentSet]);
  };

  const displayScopes = loading ? scopes : (auditData?.map((e) => e.scope) ?? scopes);

  return (
    <>
    {viewerItem && (
      <ItemViewer
        environment={environment}
        scope={viewerItem.scope}
        item={viewerItem.item}
        onClose={() => setViewerItem(null)}
      />
    )}
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

      {/* Body: nav sidebar + scrollable content */}
      <div className="flex max-h-[480px] overflow-hidden">

        {/* Left nav */}
        <div className="w-32 shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50">
          {displayScopes.map((scope) => {
            const isActive = activeScope === scope;
            const included = Object.prototype.hasOwnProperty.call(selections, scope);
            return (
              <button
                key={scope}
                type="button"
                onClick={() => scrollToScope(scope)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-[11px] leading-tight transition-colors border-l-2",
                  isActive
                    ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                    : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  !included && "opacity-40"
                )}
              >
                {scopeLabel(scope)}
              </button>
            );
          })}
        </div>

        {/* Right: scope rows */}
        <div ref={contentRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 min-w-0">
          {loading
            ? scopes.map((scope) => (
                <div key={scope} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                  <div className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                  <div className="h-3 flex-1 bg-slate-100 rounded" />
                </div>
              ))
            : auditData?.map((entry) => (
                <div
                  key={entry.scope}
                  data-scope={entry.scope}
                  ref={(el) => { scopeRefs.current[entry.scope] = el; }}
                >
                  <ScopeRow
                    entry={entry}
                    included={Object.prototype.hasOwnProperty.call(selections, entry.scope)}
                    selectedItems={selections[entry.scope] ?? null}
                    onToggleScope={(v) => onScopeToggle(entry.scope as ConfigScope, v)}
                    onToggleItem={(item, checked) =>
                      handleToggleItem(entry.scope as ConfigScope, item, checked)
                    }
                    onViewItem={(item) => setViewerItem({ scope: entry.scope, item })}
                  />
                </div>
              ))}
        </div>
      </div>
    </div>
    </>
  );
}
