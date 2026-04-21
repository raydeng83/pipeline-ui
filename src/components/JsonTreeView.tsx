// src/components/JsonTreeView.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export function JsonTreeView({ value, initialDepth = 2 }: { value: Json; initialDepth?: number }) {
  return (
    <div className="font-mono text-xs leading-relaxed text-slate-800 overflow-auto">
      <Node k={null} v={value} depth={0} openUntil={initialDepth} />
    </div>
  );
}

function Node({ k, v, depth, openUntil }: { k: string | null; v: Json; depth: number; openUntil: number }) {
  const [open, setOpen] = useState(depth < openUntil);

  if (v === null) return <Line k={k}><span className="text-slate-400">null</span></Line>;
  if (typeof v === "string") return <Line k={k}><span className="text-emerald-700">{`"${v}"`}</span></Line>;
  if (typeof v === "number") return <Line k={k}><span className="text-sky-700">{v}</span></Line>;
  if (typeof v === "boolean") return <Line k={k}><span className="text-amber-700">{String(v)}</span></Line>;

  const isArray = Array.isArray(v);
  const entries = isArray ? v.map((x, i) => [String(i), x] as const) : Object.entries(v);

  const brackets = isArray ? ["[", "]"] : ["{", "}"];
  return (
    <div>
      <div className="flex items-center">
        {k !== null && <span className="text-slate-500 mr-1">{`"${k}":`}</span>}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-slate-400 hover:text-slate-700"
        >
          {open ? "▾" : "▸"} {brackets[0]}
          {!open && <span className="text-slate-400 ml-1">{entries.length} {isArray ? "items" : "keys"}</span>}
          {!open && <span className="text-slate-400">{brackets[1]}</span>}
        </button>
      </div>
      {open && (
        <div className={cn("ml-4 pl-2 border-l border-slate-200")}>
          {entries.map(([ek, ev]) => (
            <Node key={ek} k={isArray ? null : ek} v={ev} depth={depth + 1} openUntil={openUntil} />
          ))}
          <div className="text-slate-400">{brackets[1]}</div>
        </div>
      )}
    </div>
  );
}

function Line({ k, children }: { k: string | null; children: React.ReactNode }) {
  return (
    <div className="flex items-center">
      {k !== null && <span className="text-slate-500 mr-1">{`"${k}":`}</span>}
      {children}
    </div>
  );
}
