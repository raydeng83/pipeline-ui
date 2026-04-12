import Link from "next/link";
import { getEnvironments } from "@/lib/fr-config";
import { readHistoryMerged } from "@/lib/op-history";
import type { HistoryRecord } from "@/lib/op-history";
import type { Environment } from "@/lib/fr-config";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActivityTypeIcon({ type }: { type: HistoryRecord["type"] }) {
  const cls = "w-3.5 h-3.5";
  if (type === "pull") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
  if (type === "push") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
  if (type === "compare") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
  if (type === "promote") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ActivityTypeBg(type: HistoryRecord["type"]): string {
  if (type === "pull")       return "bg-sky-100 text-sky-600";
  if (type === "push")       return "bg-emerald-100 text-emerald-600";
  if (type === "compare")    return "bg-violet-100 text-violet-600";
  if (type === "promote")    return "bg-amber-100 text-amber-600";
  return "bg-slate-100 text-slate-500";
}

function envColorClasses(color: string): { dot: string; badge: string } {
  const map: Record<string, { dot: string; badge: string }> = {
    blue:   { dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 ring-blue-200" },
    green:  { dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    yellow: { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 ring-amber-200" },
    red:    { dot: "bg-red-400",     badge: "bg-red-50 text-red-700 ring-red-200" },
    slate:  { dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-700 ring-slate-200" },
  };
  return map[color] ?? map.slate;
}

function activityLabel(r: HistoryRecord): string {
  if (r.type === "compare") {
    const src = r.source ? `${r.source.environment} (${r.source.mode})` : r.environment;
    const tgt = r.target ? `${r.target.environment} (${r.target.mode})` : "—";
    return `${src} → ${tgt}`;
  }
  return r.environment;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const environments = getEnvironments();
  const history      = readHistoryMerged({ limit: 500 }).filter((r) => r.type !== "log-search");

  // Environment health: last pull / push per env
  const envHealth = environments.map((env) => ({
    env,
    lastPull: history.find((r) => r.type === "pull" && r.environment === env.name) ?? null,
    lastPush: history.find((r) => r.type === "push" && r.environment === env.name) ?? null,
  }));

  // Recent activity (latest 7)
  const recentActivity = history.slice(0, 7);

  // Compare reports (latest 6)
  const compareReports = history.filter((r) => r.type === "compare").slice(0, 6);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your Ping Advanced Identity Cloud configuration pipeline.</p>
        </div>
      </div>

      {/* ── Environments + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Environment Health */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Environments</h2>
            <Link href="/environments" className="text-xs text-sky-600 hover:underline">Manage</Link>
          </div>
          {environments.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-sm text-slate-400">No environments configured.</p>
              <Link href="/environments" className="text-xs text-sky-600 hover:underline mt-1 inline-block">Add one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {envHealth.map(({ env, lastPull, lastPush }) => {
                const { dot, badge } = envColorClasses(env.color);
                return (
                  <div key={env.name} className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-4">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${badge}`}>{env.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{env.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Last pull</p>
                        <p className="text-[11px] font-medium text-slate-700">
                          {lastPull ? (
                            <span className={lastPull.status === "failed" ? "text-red-500" : ""}>{timeAgo(lastPull.completedAt)}</span>
                          ) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Last push</p>
                        <p className="text-[11px] font-medium text-slate-700">
                          {lastPush ? (
                            <span className={lastPush.status === "failed" ? "text-red-500" : ""}>{timeAgo(lastPush.completedAt)}</span>
                          ) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Activity</h2>
            <Link href="/history" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
            {recentActivity.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No activity yet.</p>
            ) : (
              recentActivity.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${ActivityTypeBg(r.type)}`}>
                    <ActivityTypeIcon type={r.type} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-800 capitalize">{r.type}</span>
                      <span className="text-[10px] text-slate-400 truncate">{activityLabel(r)}</span>
                    </div>
                    {r.scopes.length > 0 && (
                      <p className="text-[10px] text-slate-400 truncate">{r.scopes.slice(0, 4).join(", ")}{r.scopes.length > 4 ? ` +${r.scopes.length - 4}` : ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-[10px] text-slate-400">{timeAgo(r.completedAt)}</span>
                    <span className="text-[10px] text-slate-300">{formatDuration(r.duration)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Recent Compare Reports ── */}
      {compareReports.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Compare Reports</h2>
            <Link href="/history" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
            {compareReports.map((r) => {
              const src = r.source ? `${r.source.environment} (${r.source.mode})` : r.environment;
              const tgt = r.target ? `${r.target.environment} (${r.target.mode})` : "—";
              // Parse summary from r.summary string, e.g. "+12 -3 ~8 =100"
              const addMatch = r.summary.match(/\+(\d+)/);
              const remMatch = r.summary.match(/-(\d+)/);
              const modMatch = r.summary.match(/~(\d+)/);
              const added   = addMatch ? parseInt(addMatch[1]) : null;
              const removed = remMatch ? parseInt(remMatch[1]) : null;
              const modified = modMatch ? parseInt(modMatch[1]) : null;
              return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-800 font-mono">{src}</span>
                      <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="text-xs font-medium text-slate-800 font-mono">{tgt}</span>
                    </div>
                    {r.scopes.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.scopes.slice(0, 5).join(", ")}{r.scopes.length > 5 ? ` +${r.scopes.length - 5}` : ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {added   != null && <span className="text-xs font-mono text-emerald-600">+{added}</span>}
                    {removed != null && <span className="text-xs font-mono text-red-500">-{removed}</span>}
                    {modified != null && <span className="text-xs font-mono text-amber-600">~{modified}</span>}
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-[10px] text-slate-400 min-w-[48px] text-right">{timeAgo(r.completedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
