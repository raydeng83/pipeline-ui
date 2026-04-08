import Link from "next/link";
import { getEnvironments } from "@/lib/fr-config";
import { readHistory } from "@/lib/history";
import type { HistoryRecord } from "@/lib/history";
import type { Environment } from "@/lib/fr-config";
import { ScopeCoverage } from "./_dashboard/ScopeCoverage";

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
  const history      = readHistory().filter((r) => r.type !== "log-search");

  // Environment health: last pull / push per env
  const envHealth = environments.map((env) => ({
    env,
    lastPull: history.find((r) => r.type === "pull" && r.environment === env.name) ?? null,
    lastPush: history.find((r) => r.type === "push" && r.environment === env.name) ?? null,
  }));

  // Stats
  const totalOps   = history.length;
  const successPct = totalOps > 0 ? Math.round(history.filter((r) => r.status === "success").length / totalOps * 100) : null;
  const lastRecord = history[0] ?? null;

  // Recent activity (latest 12)
  const recentActivity = history.slice(0, 7);

  // Compare reports (latest 6)
  const compareReports = history.filter((r) => r.type === "compare").slice(0, 6);

  const actions = [
    { href: "/pull",    title: "Pull",    desc: "Export config from a tenant.",           icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3", color: "sky" },
    { href: "/push",    title: "Push",    desc: "Deploy local config to a tenant.",        icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5", color: "emerald" },
    { href: "/compare", title: "Compare", desc: "Diff two environments side by side.",     icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5", color: "violet" },
    { href: "/promote", title: "Promote", desc: "Migrate config between tenants.",         icon: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3", color: "amber" },
    { href: "/configs", title: "Browse",  desc: "Inspect config files and journeys.",      icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z", color: "slate" },
    { href: "/analyze", title: "Analyze", desc: "Analyze journeys and dependencies.",      icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75", color: "indigo" },
  ];

  const actionColors: Record<string, { bg: string; border: string; icon: string; title: string }> = {
    sky:     { bg: "bg-sky-50 hover:bg-sky-100",        border: "border-sky-200",     icon: "text-sky-500",     title: "text-sky-800" },
    emerald: { bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-200", icon: "text-emerald-500", title: "text-emerald-800" },
    violet:  { bg: "bg-violet-50 hover:bg-violet-100",  border: "border-violet-200",  icon: "text-violet-500",  title: "text-violet-800" },
    amber:   { bg: "bg-amber-50 hover:bg-amber-100",    border: "border-amber-200",   icon: "text-amber-500",   title: "text-amber-800" },
    slate:   { bg: "bg-slate-50 hover:bg-slate-100",    border: "border-slate-200",   icon: "text-slate-500",   title: "text-slate-800" },
    indigo:  { bg: "bg-indigo-50 hover:bg-indigo-100",  border: "border-indigo-200",  icon: "text-indigo-500",  title: "text-indigo-800" },
  };

  const shortcuts = [
    { keys: ["Double-click node"], desc: "Open script / inner journey preview" },
    { keys: ["Single-click node"],  desc: "Open side panel with node details" },
    { keys: ["Esc"],                desc: "Close modal or side panel" },
    { keys: ["Diff", "Files"],      desc: "Switch between unified diff and split view" },
    { keys: ["Ctrl+click"],         desc: "Copy node label (where applicable)" },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your Ping Advanced Identity Cloud configuration pipeline.</p>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      {totalOps > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Environments", value: environments.length.toString(), sub: environments.map((e) => e.label).join(", ") || "none" },
            { label: "Total Operations", value: totalOps.toString(), sub: "pull · push · compare · promote" },
            { label: "Success Rate", value: successPct != null ? `${successPct}%` : "—", sub: `${history.filter((r) => r.status === "success").length} succeeded` },
            { label: "Last Activity", value: lastRecord ? timeAgo(lastRecord.completedAt) : "—", sub: lastRecord ? `${lastRecord.type} · ${lastRecord.environment}` : "no history yet" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>
            </div>
          ))}
        </div>
      )}

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

      {/* ── Scope Coverage ── */}
      <ScopeCoverage environments={environments} />

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

      {/* ── Quick Actions + Keyboard Shortcuts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {actions.map((action) => {
              const c = actionColors[action.color];
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${c.bg} ${c.border}`}
                >
                  <svg className={`w-5 h-5 shrink-0 mt-0.5 ${c.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                  <div>
                    <p className={`text-sm font-semibold ${c.title}`}>{action.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Keyboard Shortcuts</h2>
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-50">
            {shortcuts.map(({ keys, desc }) => (
              <div key={desc} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  {keys.map((k) => (
                    <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded border border-slate-200">{k}</kbd>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
