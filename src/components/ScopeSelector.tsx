"use client";

import { CONFIG_SCOPES, ConfigScope } from "@/lib/fr-config-types";
import { cn } from "@/lib/utils";

interface ScopeSelectorProps {
  selected: ConfigScope[];
  onChange: (scopes: ConfigScope[]) => void;
  disabled?: boolean;
}

export function ScopeSelector({ selected, onChange, disabled }: ScopeSelectorProps) {
  const allSelected = selected.length === CONFIG_SCOPES.length;

  const toggle = (value: ConfigScope) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
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
    <div className="space-y-2">
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
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {CONFIG_SCOPES.map(({ value, label }) => {
          const checked = selected.includes(value);
          return (
            <label
              key={value}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded border text-sm cursor-pointer select-none transition-colors",
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
                className="accent-sky-600"
              />
              {label}
            </label>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-slate-400">No scopes selected — all config types will be included.</p>
      )}
    </div>
  );
}
