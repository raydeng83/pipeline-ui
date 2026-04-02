"use client";

import { useState } from "react";
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

const GROUP_NAMES = Object.keys(GROUPS);

type Mode = "basic" | "advanced";

export function ScopeSelector({ selected, onChange, disabled }: ScopeSelectorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<Mode>("basic");

  const allSelected = selected.length === CONFIG_SCOPES.length;

  const toggle = (value: ConfigScope) => {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
    );
  };

  const toggleGroup = (groupScopes: typeof CONFIG_SCOPES) => {
    const groupValues = groupScopes.map((s) => s.value);
    const allGroupSelected = groupValues.every((v) => selected.includes(v));
    onChange(
      allGroupSelected
        ? selected.filter((s) => !groupValues.includes(s))
        : [...selected, ...groupValues.filter((v) => !selected.includes(v))]
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : CONFIG_SCOPES.map((s) => s.value));
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
                mode === m ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-100"
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

          {/* Basic mode: one pill per group */}
          {mode === "basic" && (
            <div className="flex flex-wrap gap-2">
              {GROUP_NAMES.map((groupName) => {
                const scopes = GROUPS[groupName];
                const groupValues = scopes.map((s) => s.value);
                const allGroupSelected = groupValues.every((v) => selected.includes(v));
                const someGroupSelected = groupValues.some((v) => selected.includes(v));

                return (
                  <button
                    key={groupName}
                    type="button"
                    onClick={() => toggleGroup(scopes)}
                    disabled={disabled}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none disabled:opacity-40",
                      allGroupSelected
                        ? "bg-sky-600 border-sky-600 text-white"
                        : someGroupSelected
                        ? "bg-sky-100 border-sky-400 text-sky-800"
                        : "bg-white border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-700"
                    )}
                  >
                    {groupName}
                    {someGroupSelected && (
                      <span className={cn(
                        "text-[10px] font-normal",
                        allGroupSelected ? "text-sky-200" : "text-sky-600"
                      )}>
                        {groupValues.filter((v) => selected.includes(v)).length}/{scopes.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced mode: pills per scope, grouped */}
          {mode === "advanced" && (
            <div className="space-y-3">
              {Object.entries(GROUPS).map(([groupName, scopes]) => {
                const groupValues = scopes.map((s) => s.value);
                const allGroupSelected = groupValues.every((v) => selected.includes(v));
                const someGroupSelected = groupValues.some((v) => selected.includes(v));

                return (
                  <div key={groupName}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(scopes)}
                      disabled={disabled}
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide mb-1.5 transition-colors disabled:opacity-40",
                        allGroupSelected
                          ? "text-sky-700"
                          : someGroupSelected
                          ? "text-sky-500"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {groupName}
                      {someGroupSelected && !allGroupSelected && (
                        <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-400">
                          ({groupValues.filter((v) => selected.includes(v)).length}/{scopes.length})
                        </span>
                      )}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {scopes.map(({ value, label }) => {
                        const checked = selected.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggle(value)}
                            disabled={disabled}
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs border transition-colors select-none disabled:opacity-40",
                              checked
                                ? "bg-sky-600 border-sky-600 text-white"
                                : "bg-white border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-700"
                            )}
                          >
                            {label}
                          </button>
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
