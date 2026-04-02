"use client";

import { CONFIG_SCOPES, ConfigScope } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

interface ScopeSelectorProps {
  selected: ConfigScope[];
  onChange: (scopes: ConfigScope[]) => void;
  disabled?: boolean;
}

// Group scopes by their group field
const GROUPS = CONFIG_SCOPES.reduce<Record<string, typeof CONFIG_SCOPES>>((acc, scope) => {
  (acc[scope.group] ??= []).push(scope);
  return acc;
}, {});

export function ScopeSelector({ selected, onChange, disabled }: ScopeSelectorProps) {
  const allSelected = selected.length === CONFIG_SCOPES.length;

  const toggle = (value: ConfigScope) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const toggleGroup = (groupScopes: typeof CONFIG_SCOPES) => {
    const groupValues = groupScopes.map((s) => s.value);
    const allGroupSelected = groupValues.every((v) => selected.includes(v));
    if (allGroupSelected) {
      onChange(selected.filter((s) => !groupValues.includes(s)));
    } else {
      const toAdd = groupValues.filter((v) => !selected.includes(v));
      onChange([...selected, ...toAdd]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(CONFIG_SCOPES.map((s) => s.value));
    }
  };

  return (
    <div className="space-y-3">
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

      <div className="space-y-3">
        {Object.entries(GROUPS).map(([groupName, scopes]) => {
          const groupValues = scopes.map((s) => s.value);
          const allGroupSelected = groupValues.every((v) => selected.includes(v));
          const someGroupSelected = groupValues.some((v) => selected.includes(v));

          return (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(scopes)}
                  disabled={disabled}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-40",
                    allGroupSelected
                      ? "text-sky-700"
                      : someGroupSelected
                      ? "text-sky-500"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {groupName}
                </button>
                {someGroupSelected && !allGroupSelected && (
                  <span className="text-xs text-slate-400">
                    ({groupValues.filter((v) => selected.includes(v)).length}/{scopes.length})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
                {scopes.map(({ value, label }) => {
                  const checked = selected.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded border text-xs cursor-pointer select-none transition-colors",
                        checked
                          ? "bg-sky-50 border-sky-300 text-sky-800"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                        disabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(value)}
                        disabled={disabled}
                        className="accent-sky-600 shrink-0"
                      />
                      {label}
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
