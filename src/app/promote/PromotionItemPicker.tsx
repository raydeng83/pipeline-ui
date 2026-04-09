"use client";

import { useEffect, useRef, useState } from "react";
import { ConfigScope, CONFIG_SCOPES } from "@/lib/fr-config-types";
import type { ScopeSelection } from "@/lib/fr-config-types";
import { ItemViewer } from "@/app/push/ItemViewer";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditItem { id: string; label: string; }
interface AuditEntry { scope: string; fileCount: number; exists: boolean; items: AuditItem[]; selectable: boolean; }

// Internal representation while editing: scope → null (all items) | string[] (specific items)
type Selections = Record<string, string[] | null>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLI_SCOPES = CONFIG_SCOPES
  .filter((s) => s.cliSupported !== false)
  .map((s) => s.value as ConfigScope);

function scopeLabel(s: string) {
  return CONFIG_SCOPES.find((c) => c.value === s)?.label ?? s;
}

function toSelections(items: ScopeSelection[]): Selections {
  const rec: Selections = {};
  for (const { scope, items: si } of items) rec[scope] = si ?? null;
  return rec;
}

function fromSelections(rec: Selections): ScopeSelection[] {
  return Object.entries(rec).map(([scope, si]) => ({
    scope: scope as ConfigScope,
    ...(si !== null ? { items: si } : {}),
  }));
}

// ── Scope row ─────────────────────────────────────────────────────────────────

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
  onToggleItem: (item: string, checked: boolean) => void;
  onViewItem: (item: AuditItem) => void;
}) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);

  const allSelected = selectedItems === null;
  const selectedSet = new Set(selectedItems ?? []);
  const checkedCount = allSelected ? entry.items.length : selectedSet.size;
  const query = filter.trim().toLowerCase();
  const visible = query ? entry.items.filter((i) => i.label.toLowerCase().includes(query)) : entry.items;

  const handleSelectAll = () => {
    if (allSelected) onToggleItem("__none__", false);
    else onToggleItem("__all__", true);
  };

  return (
    <div className={cn("border-b border-slate-100 last:border-b-0", !included && "opacity-50")}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
        <input
          type="checkbox"
          checked={included}
          onChange={() => onToggleScope(!included)}
          className="w-3.5 h-3.5 accent-sky-600 shrink-0 cursor-pointer"
        />
        <span className="flex-1 text-xs font-medium text-slate-700">{scopeLabel(entry.scope)}</span>

        {included && entry.selectable && entry.items.length > 0 && (
          <span className="text-[10px] text-slate-400 tabular-nums font-mono">
            {checkedCount}/{entry.items.length}
          </span>
        )}
        {included && entry.selectable && entry.items.length > 0 && (
          <button type="button" onClick={handleSelectAll} className="text-[10px] text-sky-600 hover:text-sky-800 shrink-0">
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}
        {!entry.selectable && entry.items.length > 0 && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">all files</span>
        )}
        {entry.items.length > 0 ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-slate-400 hover:text-slate-600">
            <svg className={cn("w-3 h-3 transition-transform", open ? "" : "-rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400">empty</span>
        )}
      </div>

      {/* Filter */}
      {open && entry.items.length > 0 && (
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
            <button type="button" onClick={() => { setFilter(""); filterRef.current?.focus(); }} className="text-slate-400 hover:text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {query && (
            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{visible.length}/{entry.items.length}</span>
          )}
        </div>
      )}

      {/* Items */}
      {open && entry.items.length > 0 && (
        <div className="px-3 pb-2 pt-0.5 space-y-0.5 bg-slate-50/60">
          {visible.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-2 text-center">No matches</p>
          ) : visible.map((item) => {
            const checked = allSelected || selectedSet.has(item.id);
            return (
              <div key={item.id} className="flex items-center gap-2 py-0.5">
                {entry.selectable ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!included}
                    onChange={(e) => onToggleItem(item.id, e.target.checked)}
                    className="w-3 h-3 accent-sky-600 shrink-0 cursor-pointer"
                  />
                ) : (
                  <span className="w-3 h-3 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => onViewItem(item)}
                  className={cn(
                    "text-[11px] truncate text-left hover:underline hover:text-sky-600 transition-colors",
                    included && checked ? "text-slate-600" : "text-slate-400"
                  )}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PromotionItemPicker({
  environment,
  value,
  onChange,
}: {
  environment: string;
  value: ScopeSelection[];
  onChange: (v: ScopeSelection[]) => void;
}) {
  const [auditData, setAuditData] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<{ scope: string; item: AuditItem } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scopeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selections = toSelections(value);

  // Fetch all CLI scopes on mount / environment change
  useEffect(() => {
    if (!environment) return;
    setLoading(true);
    const params = new URLSearchParams({ environment, scopes: CLI_SCOPES.join(",") });
    fetch(`/api/push/audit?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAuditData(data); })
      .finally(() => setLoading(false));
  }, [environment]);

  // IntersectionObserver for sidebar highlight
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !auditData) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveScope(visible[0].target.getAttribute("data-scope"));
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

  const handleScopeToggle = (scope: ConfigScope, included: boolean) => {
    const next = { ...selections };
    if (included) next[scope] = null;   // include all by default
    else delete next[scope];
    onChange(fromSelections(next));
  };

  const handleItemToggle = (scope: ConfigScope, item: string, checked: boolean) => {
    if (item === "__all__") { onChange(fromSelections({ ...selections, [scope]: null })); return; }
    if (item === "__none__") { onChange(fromSelections({ ...selections, [scope]: [] })); return; }

    const entry = auditData?.find((e) => e.scope === scope);
    if (!entry) return;

    const current = selections[scope];
    const allIds = entry.items.map((i) => i.id);
    const currentSet = new Set(current === null ? allIds : (current ?? []));
    if (checked) currentSet.add(item);
    else currentSet.delete(item);

    const allNowSelected = allIds.every((id) => currentSet.has(id));
    onChange(fromSelections({ ...selections, [scope]: allNowSelected ? null : [...currentSet] }));
  };

  const includedCount = Object.keys(selections).length;
  const totalItems = auditData
    ? auditData.reduce((sum, e) => {
        if (!Object.prototype.hasOwnProperty.call(selections, e.scope)) return sum;
        const sel = selections[e.scope];
        return sum + (sel === null ? e.items.length : sel.length);
      }, 0)
    : 0;

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
          <span className="text-xs font-medium text-slate-700">Items to Promote</span>
          {!loading && auditData && includedCount > 0 && (
            <span className="text-xs text-slate-400 tabular-nums">
              {includedCount} scope{includedCount !== 1 ? "s" : ""} · {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          )}
          {!loading && auditData && includedCount === 0 && (
            <span className="text-xs text-slate-400">No scopes selected</span>
          )}
        </div>

        {/* Body */}
        <div className="flex overflow-hidden" style={{ maxHeight: 460 }}>
          {/* Left nav */}
          <div className="w-32 shrink-0 border-r border-slate-200 overflow-y-auto bg-slate-50">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-7 mx-2 my-1 rounded bg-slate-200 animate-pulse" />
                ))
              : (auditData ?? []).map((entry) => {
                  const included = Object.prototype.hasOwnProperty.call(selections, entry.scope);
                  return (
                    <button
                      key={entry.scope}
                      type="button"
                      onClick={() => scrollToScope(entry.scope)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 text-[11px] leading-tight transition-colors border-l-2",
                        activeScope === entry.scope
                          ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                          : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                        !included && "opacity-40"
                      )}
                    >
                      {scopeLabel(entry.scope)}
                    </button>
                  );
                })
            }
          </div>

          {/* Scope rows */}
          <div ref={contentRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 min-w-0">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                    <div className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                    <div className="h-3 flex-1 bg-slate-100 rounded" />
                  </div>
                ))
              : (auditData ?? []).map((entry) => (
                  <div
                    key={entry.scope}
                    data-scope={entry.scope}
                    ref={(el) => { scopeRefs.current[entry.scope] = el; }}
                  >
                    <ScopeRow
                      entry={entry}
                      included={Object.prototype.hasOwnProperty.call(selections, entry.scope)}
                      selectedItems={selections[entry.scope] ?? null}
                      onToggleScope={(v) => handleScopeToggle(entry.scope as ConfigScope, v)}
                      onToggleItem={(item, checked) => handleItemToggle(entry.scope as ConfigScope, item, checked)}
                      onViewItem={(item) => setViewerItem({ scope: entry.scope, item })}
                    />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </>
  );
}
