"use client";

import { useState } from "react";
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

const GROUP_NAMES = Object.keys(GROUPS);

type Mode = "basic" | "advanced";

export function ScopeSelector({ selected, onChange, disabled }: ScopeSelectorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<Mode>("basic");

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
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Config Scopes</span>

        {/* Basic / Advanced toggle */}
        <div className="flex items-center rounded border border-slate-200 overflow-hidden text-xs">
          {(["basic", "advanced"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={disabled}
              className={cn(
                "px-2 py-0.5 transition-colors capitalize disabled:opacity-40",
                mode === m
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className="ml-auto text-xs text-sky-600 hover:text-sky-800 disabled:opacity-40"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>

        {/* Collapse / expand */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            className={cn("w-4 h-4 transition-transform", collapsed ? "-rotate-90" : "")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {selected.length === 0 && (
            <p className="text-xs text-slate-400">
              No scopes selected — <code className="bg-slate-100 px-1 rounded">all</code> will be used.
            </p>
          )}

          {/* Basic mode: one checkbox per group */}
          {mode === "basic" && (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {GROUP_NAMES.map((groupName) => {
                const scopes = GROUPS[groupName];
                const groupValues = scopes.map((s) => s.value);
                const allGroupSelected = groupValues.every((v) => selected.includes(v));
                const someGroupSelected = groupValues.some((v) => selected.includes(v));

                return (
                  <label
                    key={groupName}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer select-none transition-colors",
                      allGroupSelected
                        ? "bg-sky-50 border-sky-300 text-sky-800"
                        : someGroupSelected
                        ? "bg-sky-50/50 border-sky-200 text-sky-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={(el) => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                      onChange={() => toggleGroup(scopes)}
                      disabled={disabled}
                      className="accent-sky-600 shrink-0"
                    />
                    <span className="font-medium">{groupName}</span>
                    {someGroupSelected && (
                      <span className="ml-auto text-slate-400 font-normal">
                        {groupValues.filter((v) => selected.includes(v)).length}/{scopes.length}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* Advanced mode: individual scopes per group */}
          {mode === "advanced" && (
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
          )}
        </>
      )}
    </div>
  );
}
