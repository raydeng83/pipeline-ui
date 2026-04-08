"use client";

import { useEffect, useState } from "react";
import type { Environment } from "@/lib/fr-config";

const TRACKED_SCOPES = [
  { value: "journeys",        label: "Journeys" },
  { value: "scripts",         label: "Scripts" },
  { value: "email-templates", label: "Email Templates" },
  { value: "managed-objects", label: "Managed Objects" },
  { value: "themes",          label: "Themes" },
];

interface ScopeRow {
  scope: string;
  label: string;
  counts: Record<string, number | null>; // env.name → count
}

export function ScopeCoverage({ environments }: { environments: Environment[] }) {
  const [rows, setRows]       = useState<ScopeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!environments.length) { setLoading(false); return; }

    const scopeNames = TRACKED_SCOPES.map((s) => s.value).join(",");

    Promise.all(
      environments.map(async (env) => {
        try {
          const res = await fetch(`/api/push/audit?environment=${encodeURIComponent(env.name)}&scopes=${scopeNames}`);
          if (!res.ok) return { env: env.name, data: [] as Array<{ scope: string; fileCount: number }> };
          const data = await res.json() as Array<{ scope: string; fileCount: number; items?: unknown[] }>;
          return { env: env.name, data };
        } catch {
          return { env: env.name, data: [] as Array<{ scope: string; fileCount: number }> };
        }
      }),
    ).then((results) => {
      const built: ScopeRow[] = TRACKED_SCOPES.map(({ value, label }) => {
        const counts: Record<string, number | null> = {};
        for (const { env, data } of results) {
          const entry = data.find((d) => d.scope === value);
          counts[env] = entry != null
            ? (entry.items?.length ?? entry.fileCount ?? null)
            : null;
        }
        return { scope: value, label, counts };
      });
      setRows(built);
      setLoading(false);
    });
  }, [environments]);

  if (!environments.length) return null;

  const envColorDot: Record<string, string> = {
    blue:   "bg-blue-400",
    green:  "bg-emerald-400",
    yellow: "bg-amber-400",
    red:    "bg-red-400",
    slate:  "bg-slate-400",
  };

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Scope Coverage
      </h2>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">Loading audit data…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Scope</th>
                {environments.map((env) => (
                  <th key={env.name} className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${envColorDot[env.color] ?? "bg-slate-400"}`} />
                      {env.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => {
                const counts = environments.map((e) => row.counts[e.name]);
                const allSame = counts.every((c) => c === counts[0]);
                const hasMismatch = !allSame && counts.some((c) => c !== null);
                return (
                  <tr key={row.scope} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{row.label}</td>
                    {environments.map((env) => {
                      const count = row.counts[env.name];
                      const otherCounts = environments.filter((e) => e.name !== env.name).map((e) => row.counts[e.name]).filter((c) => c !== null);
                      const isDifferent = hasMismatch && otherCounts.length > 0 && otherCounts.some((c) => c !== count);
                      return (
                        <td key={env.name} className="px-4 py-2.5 text-center">
                          {count == null ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <span className={`text-xs font-mono font-medium ${isDifferent ? "text-amber-600" : "text-slate-700"}`}>
                              {count}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5">
        Amber values indicate counts differ across environments.
      </p>
    </section>
  );
}
