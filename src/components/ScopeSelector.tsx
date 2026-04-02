"use client";

import { CONFIG_SCOPES, ConfigScope } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

interface ScopeSelectorProps {
  selected: ConfigScope[];
  onChange: (scopes: ConfigScope[]) => void;
  disabled?: boolean;
}

const GROUPS = CONFIG_SCOPES.reduce<Record<string, typeof CONFIG_SCOPES>>((acc, scope) => {
  (acc[scope.group] ??= []).push(scope);
  return acc;
}, {});

export function ScopeSelector({ selected, onChange, disabled }: ScopeSelectorProps) {
  const selectedSet = new Set(selected);
  const allSelected = selected.length === CONFIG_SCOPES.length;

  const toggle = (value: ConfigScope) => {
    onChange(
      selectedSet.has(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
    );
  };

  const toggleGroup = (groupScopes: typeof CONFIG_SCOPES) => {
    const groupValues = groupScopes.map((s) => s.value);
    const allGroupSelected = groupValues.every((v) => selectedSet.has(v));
    onChange(
      allGroupSelected
        ? selected.filter((s) => !groupValues.includes(s))
        : [...selected, ...groupValues.filter((v) => !selectedSet.has(v))]
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : CONFIG_SCOPES.map((s) => s.value));
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Config Scopes</span>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className="text-xs text-sky-600 hover:text-sky-800 disabled:opacity-40"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-slate-400">
          No scopes selected — <code className="bg-slate-100 px-1 rounded">all</code> will be used.
        </p>
      )}

      {/* Grouped scope list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
        {Object.entries(GROUPS).map(([groupName, scopes]) => {
          const groupValues = scopes.map((s) => s.value);
          const allGroupSelected = groupValues.every((v) => selectedSet.has(v));
          const someGroupSelected = groupValues.some((v) => selectedSet.has(v));
          const selectedCount = groupValues.filter((v) => selectedSet.has(v)).length;

          return (
            <div key={groupName}>
              {/* Group header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => toggleGroup(scopes)}
                  disabled={disabled}
                  className="flex items-center gap-2 disabled:opacity-40"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      allGroupSelected
                        ? "bg-sky-600 border-sky-600"
                        : someGroupSelected
                        ? "bg-sky-200 border-sky-400"
                        : "bg-white border-slate-300"
                    )}
                  >
                    {allGroupSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {someGroupSelected && !allGroupSelected && (
                      <span className="w-2 h-0.5 bg-sky-600 rounded" />
                    )}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    allGroupSelected ? "text-sky-700" : someGroupSelected ? "text-sky-600" : "text-slate-600"
                  )}>
                    {groupName}
                  </span>
                </button>
                {someGroupSelected && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedCount}/{scopes.length}
                  </span>
                )}
              </div>

              {/* Scope rows */}
              <div className="divide-y divide-slate-50">
                {scopes.map(({ value, label, description }) => {
                  const checked = selectedSet.has(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors select-none",
                        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50",
                        checked && "bg-sky-50/50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          checked ? "bg-sky-600 border-sky-600" : "bg-white border-slate-300"
                        )}
                        onClick={() => !disabled && toggle(value)}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0" onClick={() => !disabled && toggle(value)}>
                        <div className={cn("text-xs font-medium", checked ? "text-sky-800" : "text-slate-700")}>
                          {label}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          {description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
