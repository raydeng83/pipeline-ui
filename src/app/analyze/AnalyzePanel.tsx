"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { JourneyInfo, AnalyzeResult, AnalyzeSummary, ScriptUsage } from "@/app/api/analyze/route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyJourney(j: JourneyInfo): "root" | "shared" | "orphaned" | "leaf" | "internal" {
  if (j.calledBy.length === 0 && !j.innerTreeOnly) return "root";
  if (j.calledBy.length === 0 && j.innerTreeOnly)  return "orphaned";
  if (j.calledBy.length >= 2)                       return "shared";
  if (j.subJourneys.length === 0)                   return "leaf";
  return "internal";
}

const CLASS_STYLES: Record<ReturnType<typeof classifyJourney>, { dot: string; badge: string; label: string }> = {
  root:     { dot: "bg-sky-500",    badge: "bg-sky-100 text-sky-700 border-sky-200",       label: "Entry" },
  shared:   { dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-700 border-amber-200", label: "Shared" },
  orphaned: { dot: "bg-red-400",    badge: "bg-red-100 text-red-700 border-red-200",       label: "Orphaned" },
  leaf:     { dot: "bg-slate-300",  badge: "bg-slate-100 text-slate-500 border-slate-200", label: "Leaf" },
  internal: { dot: "bg-violet-400", badge: "bg-violet-100 text-violet-700 border-violet-200", label: "Sub" },
};

// ── Summary Dashboard ─────────────────────────────────────────────────────────

function StatCard({ value, label, sub, color }: { value: number | string; label: string; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-0.5">
      <span className={cn("text-2xl font-bold", color)}>{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
    </div>
  );
}

function SummaryDashboard({ summary, journeys }: { summary: AnalyzeSummary; journeys: JourneyInfo[] }) {
  const entryJourneys = useMemo(
    () => journeys.filter((j) => j.calledBy.length === 0 && !j.innerTreeOnly).sort((a, b) => a.name.localeCompare(b.name)),
    [journeys]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard value={summary.total}           label="Total Journeys"     color="text-slate-800" />
        <StatCard value={summary.roots}           label="Entry Points"       sub="not called by others" color="text-sky-600" />
        <StatCard value={summary.sharedSubJourneys} label="Shared Sub-Journeys" sub="called by 2+ parents" color="text-amber-600" />
        <StatCard value={summary.orphaned}        label="Orphaned"           sub="innerTreeOnly, no callers" color="text-red-500" />
        <StatCard value={summary.maxDepth}        label="Max Depth"          sub="longest chain" color="text-violet-600" />
      </div>

      {/* Entry Journeys */}
      {entryJourneys.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Entry Journeys ({entryJourneys.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {entryJourneys.map((j) => (
              <div key={j.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <span className="text-slate-700 truncate" title={j.name}>{j.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{j.nodeCount}n</span>
                {j.subJourneys.length > 0 && (
                  <span className="text-[10px] text-violet-500 shrink-0">{j.subJourneys.length} sub</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.mostCalled.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Most-Called Sub-Journeys</h3>
          <div className="space-y-1.5">
            {summary.mostCalled.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-700 truncate block" title={item.name}>{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-1.5 rounded-full bg-amber-300" style={{ width: `${Math.round((item.count / summary.mostCalled[0].count) * 80) + 16}px` }} />
                  <span className="text-[11px] font-mono text-amber-700 w-6 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        {(Object.entries(CLASS_STYLES) as [ReturnType<typeof classifyJourney>, typeof CLASS_STYLES[keyof typeof CLASS_STYLES]][]).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5 text-slate-500">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Journey tree node ─────────────────────────────────────────────────────────

function JourneyTreeNode({
  name,
  journeyMap,
  depth,
  ancestors,
  searchQ,
  forceOpen,
}: {
  name: string;
  journeyMap: Map<string, JourneyInfo>;
  depth: number;
  ancestors: Set<string>;
  searchQ: string;
  forceOpen?: boolean;
}) {
  const info = journeyMap.get(name);
  const [open, setOpen] = useState(depth === 0);

  // React to parent expand/collapse all
  const prevForce = useState({ v: forceOpen })[0];
  if (forceOpen !== undefined && forceOpen !== prevForce.v) {
    prevForce.v = forceOpen;
    if (open !== forceOpen) setOpen(forceOpen);
  }

  if (!info) {
    // Referenced but not in config (pulled from different env, etc.)
    return (
      <div className="flex items-center gap-1.5 py-0.5 text-xs text-slate-400 italic">
        <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
        {name} <span className="text-[10px]">(not in config)</span>
      </div>
    );
  }

  const kind = classifyJourney(info);
  const s = CLASS_STYLES[kind];
  const isCycle = ancestors.has(name);
  const hasChildren = info.subJourneys.length > 0 && !isCycle;

  const nameMatches = searchQ ? name.toLowerCase().includes(searchQ) : true;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-0.5 rounded group",
          hasChildren && "cursor-pointer hover:bg-slate-50",
          !nameMatches && searchQ && "opacity-40",
        )}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {/* Expand arrow placeholder */}
        <span className="w-3 shrink-0 text-slate-400 text-[10px]">
          {hasChildren ? (open ? "▾" : "▸") : ""}
        </span>

        <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />

        <span className={cn("text-xs flex-1 min-w-0 truncate", depth === 0 ? "font-semibold text-slate-800" : "text-slate-700")} title={name}>
          {name}
        </span>

        {isCycle && <span className="text-[10px] text-orange-500 shrink-0">↺ cycle</span>}

        {info.calledBy.length >= 2 && (
          <span className="text-[10px] text-amber-600 shrink-0">{info.calledBy.length} parents</span>
        )}

        {!info.enabled && (
          <span className="text-[10px] text-slate-400 shrink-0">disabled</span>
        )}

        <span className={cn("text-[10px] px-1 py-0 rounded border shrink-0", s.badge)}>{s.label}</span>

        <span className="text-[10px] text-slate-400 shrink-0">{info.nodeCount}n</span>
      </div>

      {open && hasChildren && (
        <div className="ml-4 border-l border-slate-200 pl-3 mt-0.5 space-y-0.5">
          {info.subJourneys.map((sub) => (
            <JourneyTreeNode
              key={sub}
              name={sub}
              journeyMap={journeyMap}
              depth={depth + 1}
              ancestors={new Set([...ancestors, name])}
              searchQ={searchQ}
              forceOpen={forceOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Journey dependency tree ───────────────────────────────────────────────────

function JourneyDependencyTree({ journeys, searchQ }: { journeys: JourneyInfo[]; searchQ: string }) {
  const journeyMap = useMemo(() => new Map(journeys.map((j) => [j.name, j])), [journeys]);
  const [forceOpen, setForceOpen] = useState<boolean | undefined>(undefined);

  const expandAll = useCallback(() => setForceOpen(true), []);
  const collapseAll = useCallback(() => setForceOpen(false), []);

  const roots = useMemo(
    () => journeys.filter((j) => j.calledBy.length === 0 && !j.innerTreeOnly),
    [journeys],
  );

  const orphaned = useMemo(
    () => journeys.filter((j) => j.calledBy.length === 0 && j.innerTreeOnly),
    [journeys],
  );

  const filtered = useMemo(() => {
    if (!searchQ) return { roots, orphaned };
    const q = searchQ.toLowerCase();
    return {
      roots: roots.filter((j) => j.name.toLowerCase().includes(q) || j.subJourneys.some((s) => s.toLowerCase().includes(q))),
      orphaned: orphaned.filter((j) => j.name.toLowerCase().includes(q)),
    };
  }, [roots, orphaned, searchQ]);

  return (
    <div className="space-y-4">
      {/* Expand/Collapse All */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={expandAll} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
          Expand All
        </button>
        <button type="button" onClick={collapseAll} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
          Collapse All
        </button>
      </div>

      {/* Entry-point journeys */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-700">Entry-Point Journeys</h3>
          <span className="text-xs text-slate-400">({filtered.roots.length})</span>
        </div>
        <div className="p-4 space-y-0.5">
          {filtered.roots.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No entry-point journeys found.</p>
          ) : (
            filtered.roots.map((j) => (
              <JourneyTreeNode
                key={j.name}
                name={j.name}
                journeyMap={journeyMap}
                depth={0}
                ancestors={new Set()}
                searchQ={searchQ}
                forceOpen={forceOpen}
              />
            ))
          )}
        </div>
      </div>

      {/* Orphaned journeys */}
      {orphaned.length > 0 && (
        <div className="bg-white border border-red-100 rounded-lg">
          <div className="px-4 py-2.5 border-b border-red-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
            <h3 className="text-sm font-semibold text-red-700">Orphaned Sub-Journeys</h3>
            <span className="text-xs text-red-400">({filtered.orphaned.length}) — innerTreeOnly but never called</span>
          </div>
          <div className="p-4 space-y-0.5">
            {filtered.orphaned.length === 0 ? (
              <p className="text-xs text-slate-400 italic">None match.</p>
            ) : (
              filtered.orphaned.map((j) => (
                <JourneyTreeNode
                  key={j.name}
                  name={j.name}
                  journeyMap={journeyMap}
                  depth={0}
                  ancestors={new Set()}
                  searchQ={searchQ}
                  forceOpen={forceOpen}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Script Usage ─────────────────────────────────────────────────────────────

function ScriptUsagePanel({ scripts }: { scripts: ScriptUsage[] }) {
  const [search, setSearch] = useState("");
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "used" | "unused">("all");

  const filtered = useMemo(() => {
    let list = scripts;
    if (filterMode === "used") list = list.filter((s) => s.usedBy.length > 0);
    else if (filterMode === "unused") list = list.filter((s) => s.usedBy.length === 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.uuid.toLowerCase().includes(q));
    }
    return list;
  }, [scripts, search, filterMode]);

  const usedCount = scripts.filter((s) => s.usedBy.length > 0).length;
  const unusedCount = scripts.length - usedCount;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-lg font-bold text-slate-800">{scripts.length}</span>
          <span className="text-xs text-slate-500 ml-1.5">Total Scripts</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-lg font-bold text-emerald-600">{usedCount}</span>
          <span className="text-xs text-slate-500 ml-1.5">Used in Journeys</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
          <span className="text-lg font-bold text-amber-600">{unusedCount}</span>
          <span className="text-xs text-slate-500 ml-1.5">Not Used</span>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <div className="flex rounded border border-slate-300 overflow-hidden text-xs shrink-0">
          {([
            { value: "all" as const, label: "All" },
            { value: "used" as const, label: `Used (${usedCount})` },
            { value: "unused" as const, label: `Unused (${unusedCount})` },
          ]).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterMode(f.value)}
              className={cn(
                "px-2.5 py-1 transition-colors",
                filterMode === f.value ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scripts…"
          className="flex-1 text-xs rounded border border-slate-300 px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
        )}
        <span className="text-xs text-slate-400 shrink-0">{filtered.length} / {scripts.length}</span>
      </div>

      {/* Script list */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No scripts match the filter.</div>
        ) : (
          filtered.map((script) => {
            const isExpanded = expandedUuid === script.uuid;
            return (
              <div key={script.uuid}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors",
                    isExpanded && "bg-slate-50"
                  )}
                  onClick={() => setExpandedUuid(isExpanded ? null : script.uuid)}
                >
                  <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  <span className="text-slate-700 flex-1 truncate font-medium" title={script.name}>{script.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{script.context}</span>
                  {script.usedBy.length > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                      {script.usedBy.length} {script.usedBy.length === 1 ? "journey" : "journeys"}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">unused</span>
                  )}
                  <span className={cn("text-slate-400 text-[10px] transition-transform", isExpanded && "rotate-90")}>▶</span>
                </div>
                {isExpanded && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] text-slate-400 font-mono">{script.uuid}</div>
                    {script.usedBy.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Not referenced by any journey node.</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Used in:</p>
                        {script.usedBy.map((ref, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                            <span className="text-slate-700 font-medium">{ref.journey}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-500">{ref.nodeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{ref.nodeType}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AnalyzePanel({ environments }: { environments: { name: string }[] }) {
  const [env, setEnv] = useState(environments[0]?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [tab, setTab] = useState<"summary" | "tree" | "scripts">("summary");
  const [searchQ, setSearchQ] = useState("");

  async function runAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data as AnalyzeResult);
      setTab("summary");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">Environment</label>
          <select
            value={env}
            onChange={(e) => { setEnv(e.target.value); setResult(null); }}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {environments.map((e) => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={runAnalyze}
          disabled={loading || !env}
          className="px-4 py-1.5 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {([
              { key: "summary" as const, label: "Summary" },
              { key: "tree" as const, label: "Dependency Tree" },
              { key: "scripts" as const, label: "Script Usage" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.key
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {t.label}
              </button>
            ))}

            {tab === "tree" && (
              <div className="ml-auto relative pb-1">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search journeys…"
                  className="pl-7 pr-6 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <svg className="absolute left-2 top-1/2 -translate-y-1/2 mb-0.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                {searchQ && (
                  <button type="button" onClick={() => setSearchQ("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 mb-0.5 text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
                )}
              </div>
            )}
          </div>

          {tab === "summary" && <SummaryDashboard summary={result.summary} journeys={result.journeys} />}
          {tab === "tree" && <JourneyDependencyTree journeys={result.journeys} searchQ={searchQ.toLowerCase()} />}
          {tab === "scripts" && <ScriptUsagePanel scripts={result.scriptUsage} />}
        </div>
      )}
    </div>
  );
}
