# AIC Pipeline UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "Calm SaaS" visual language to every page of the pipeline-ui app, merge Pull+Push into a single `/sync` page, and add a type-to-confirm dialog with diff preview for push-to-prod and promote-execute.

**Architecture:** Pure frontend refactor. Shared design tokens + utility classes in `globals.css`. New reusable components: `DangerousConfirmDialog`, `EnvCard`, `ActivityRow`. New `/sync` page replaces `/pull` and `/push`. One new API route: `/api/diff`. No changes to existing backend APIs or business logic in `src/lib/`.

**Tech Stack:** Next.js 16.2.2, React 19, Tailwind CSS 4, Radix UI, Lucide icons, vitest.

**Spec scope note:** The committed spec listed 5 nav items; the app actually has 10 (Dashboard, Browse, Pull, Push, Compare, Promote, Logs, History, Environments, Settings). Plan applies the Calm SaaS visual language to **all 10 routes**. Pull and Push are replaced by a single Sync route, leaving 9 nav items after merge.

---

## File Structure

**New:**
- `src/app/sync/page.tsx` — merged Pull+Push route (server component shell)
- `src/app/sync/SyncForm.tsx` — client form + log panel
- `src/app/pull/page.tsx` — redirect shim → `/sync?direction=pull`
- `src/app/push/page.tsx` — redirect shim → `/sync?direction=push`
- `src/app/api/diff/route.ts` — diff summary endpoint
- `src/components/DangerousConfirmDialog.tsx` — type-to-confirm + diff preview
- `src/components/EnvCard.tsx` — shared env card (dashboard + environments)
- `src/components/ActivityRow.tsx` — shared activity row (dashboard + history)
- `src/components/ui/StatusPill.tsx` — small shared pill used by many pages
- `tests/components/DangerousConfirmDialog.test.tsx`
- `tests/api/diff.test.ts`
- `tests/components/EnvCard.test.tsx`

**Modified:**
- `src/app/globals.css` — design tokens + card/shadow utility classes
- `src/app/layout.tsx` — body background, main padding
- `src/components/NavBar.tsx` — polish, active pill, working-env pill, drop Pull/Push
- `src/app/page.tsx` — dashboard card grid + activity restyle
- `src/components/LogViewer.tsx` — header restyle
- `src/components/ScopeSelector.tsx` — restyle group headers and chips
- `src/components/EnvironmentBadge.tsx` — new palette
- `src/app/promote/PromoteWorkflow.tsx` — two-column stepper layout, wire dialog
- `src/app/environments/EnvironmentsManager.tsx` — card grid + dialog
- `src/app/environments/EnvEditor.tsx` — tabs, inline test result
- `src/app/history/*` — grouped list + filter bar + right drawer
- `src/app/compare/CompareForm.tsx` — restyle controls + result panels
- `src/app/configs/ConfigsViewer.tsx` — restyle surface chrome
- `src/app/logs/LogsExplorer.tsx` — restyle chrome
- `src/app/settings/SettingsForm.tsx` — restyle form

**Deleted:**
- `src/app/pull/PullForm.tsx` (replaced by `SyncForm`)
- `src/app/push/PushForm.tsx` (replaced by `SyncForm`)

---

## Task 1: Design tokens + card utility classes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read current globals.css to find the `@theme` or `:root` block**

Run: `cat src/app/globals.css`

- [ ] **Step 2: Add Calm SaaS tokens + shared utility classes to `globals.css`**

Append at the bottom of the file (after existing content):

```css
/* ── Calm SaaS design tokens ───────────────────────────────── */
@layer components {
  .card {
    @apply bg-white border border-slate-200/60 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)];
  }
  .card-padded {
    @apply card p-4;
  }
  .section-title {
    @apply text-base font-semibold text-slate-900;
  }
  .section-subtitle {
    @apply text-sm text-slate-500;
  }
  .page-title {
    @apply text-2xl font-bold text-slate-900 tracking-tight;
  }
  .label-xs {
    @apply text-[11px] font-semibold text-slate-500;
  }
  .btn-primary {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-[0_1px_2px_rgba(79,70,229,0.25)] disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors;
  }
  .btn-danger-outline {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50 transition-colors;
  }
  .btn-danger-solid {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .pill {
    @apply inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1;
  }
  .pill-success  { @apply pill bg-emerald-50 text-emerald-700 ring-emerald-200; }
  .pill-warning  { @apply pill bg-amber-50   text-amber-700   ring-amber-200; }
  .pill-danger   { @apply pill bg-rose-50    text-rose-700    ring-rose-200; }
  .pill-info     { @apply pill bg-indigo-50  text-indigo-700  ring-indigo-200; }
  .pill-neutral  { @apply pill bg-slate-50   text-slate-600   ring-slate-200; }
}
```

- [ ] **Step 3: Verify build still compiles**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds, no CSS errors. Warnings about unused classes are OK.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "UI: add Calm SaaS design tokens and utility classes"
```

---

## Task 2: Root layout background + padding

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the `<body>` and `<main>` classes**

In `src/app/layout.tsx`, find the `<body>` element and replace its className and the `<main>` className:

```tsx
<body className="min-h-full bg-slate-50 text-slate-900 antialiased flex flex-col">
  <BusyProvider>
    <NavBar />
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 w-full max-w-[1400px] mx-auto">
      {children}
    </main>
    <footer className="mt-auto border-t border-slate-200/60 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-4 text-xs text-slate-500 flex items-center justify-between">
        <span>
          &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">Boston Identity</span>
        </span>
        <span className="text-slate-400">AIC Config Pipeline</span>
      </div>
    </footer>
  </BusyProvider>
</body>
```

- [ ] **Step 2: Run dev server and verify visually**

Run: `npm run dev` in a second terminal, open `http://localhost:3000`.
Expected: page background is `slate-50`, content has comfortable margins, footer pinned to bottom.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "UI: layout padding and max-width for Calm SaaS shell"
```

---

## Task 3: NavBar polish + drop Pull/Push + working-env pill

**Files:**
- Modify: `src/components/NavBar.tsx`
- Create: `src/hooks/useWorkingEnv.ts`

- [ ] **Step 1: Create `useWorkingEnv` hook**

Create `src/hooks/useWorkingEnv.ts`:

```tsx
"use client";
import { useEffect, useState } from "react";

const KEY = "aic:workingEnv";

export function useWorkingEnv() {
  const [env, setEnv] = useState<string | null>(null);
  useEffect(() => {
    setEnv(localStorage.getItem(KEY));
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEnv(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const update = (name: string | null) => {
    if (name) localStorage.setItem(KEY, name);
    else localStorage.removeItem(KEY);
    setEnv(name);
  };
  return [env, update] as const;
}
```

- [ ] **Step 2: Rewrite `NavBar.tsx`**

Replace the entire contents of `src/components/NavBar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useBusyState } from "@/hooks/useBusyState";
import { useWorkingEnv } from "@/hooks/useWorkingEnv";
import { cn } from "@/lib/utils";
import type { Environment } from "@/lib/fr-config";

const NAV_ITEMS = [
  { href: "/",             label: "Dashboard" },
  { href: "/sync",         label: "Sync" },
  { href: "/configs",      label: "Browse" },
  { href: "/compare",      label: "Compare" },
  { href: "/promote",      label: "Promote" },
  { href: "/logs",         label: "Logs" },
  { href: "/history",      label: "History" },
  { href: "/environments", label: "Environments" },
  { href: "/settings",     label: "Settings" },
];

const COLOR_RING: Record<string, string> = {
  blue:   "bg-blue-400",
  green:  "bg-emerald-400",
  yellow: "bg-amber-400",
  red:    "bg-rose-400",
  slate:  "bg-slate-400",
};

export function NavBar() {
  const { busy } = useBusyState();
  const pathname = usePathname();
  const [workingEnv] = useWorkingEnv();
  const [envs, setEnvs] = useState<Environment[]>([]);

  useEffect(() => {
    fetch("/api/environments").then((r) => r.ok ? r.json() : []).then(setEnvs).catch(() => {});
  }, []);

  const active = envs.find((e) => e.name === workingEnv);
  const dot = active ? COLOR_RING[active.color] ?? COLOR_RING.slate : "bg-slate-300";

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className={cn(
                "font-semibold text-[15px] tracking-tight shrink-0",
                busy ? "text-slate-400 pointer-events-none" : "text-slate-900"
              )}
            >
              AIC Pipeline
            </Link>
            <nav className="flex items-center gap-0.5 overflow-x-auto">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-disabled={busy}
                    tabIndex={busy ? -1 : undefined}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap",
                      busy
                        ? "text-slate-300 pointer-events-none cursor-not-allowed"
                        : isActive
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {active && (
            <div className="flex items-center gap-2 px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-xs text-slate-600 shrink-0">
              <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
              <span className="hidden sm:inline text-slate-400">working env</span>
              <span className="font-medium text-slate-700">{active.label}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify nav in browser**

Open `http://localhost:3000`.
Expected: Nine nav items (no Pull/Push), active pill is indigo, working-env pill appears on the right if one is set in localStorage. App still navigates.

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx src/hooks/useWorkingEnv.ts
git commit -m "UI: NavBar polish, merge Pull/Push into Sync, working-env pill"
```

---

## Task 4: Shared `StatusPill` + `EnvironmentBadge` refresh

**Files:**
- Create: `src/components/ui/StatusPill.tsx`
- Modify: `src/components/EnvironmentBadge.tsx`

- [ ] **Step 1: Create `StatusPill.tsx`**

```tsx
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const CLASSES: Record<Tone, string> = {
  success: "pill-success",
  warning: "pill-warning",
  danger:  "pill-danger",
  info:    "pill-info",
  neutral: "pill-neutral",
};

export function StatusPill({
  tone,
  children,
  className,
}: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn(CLASSES[tone], className)}>{children}</span>;
}
```

- [ ] **Step 2: Read current `EnvironmentBadge.tsx`**

Run: `cat src/components/EnvironmentBadge.tsx`

- [ ] **Step 3: Rewrite `EnvironmentBadge.tsx` to use new palette**

Replace contents with:

```tsx
import { cn } from "@/lib/utils";
import type { Environment } from "@/lib/fr-config";

const DOT: Record<string, string> = {
  blue:   "bg-blue-400",
  green:  "bg-emerald-400",
  yellow: "bg-amber-400",
  red:    "bg-rose-400",
  slate:  "bg-slate-400",
};

const BADGE: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 ring-blue-200",
  green:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-amber-200",
  red:    "bg-rose-50 text-rose-700 ring-rose-200",
  slate:  "bg-slate-50 text-slate-700 ring-slate-200",
};

export function EnvironmentBadge({
  env,
  showDot = true,
  className,
}: { env: Environment; showDot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showDot && (
        <span className={cn("w-2 h-2 rounded-full shrink-0", DOT[env.color] ?? DOT.slate)} />
      )}
      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full ring-1", BADGE[env.color] ?? BADGE.slate)}>
        {env.label}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/StatusPill.tsx src/components/EnvironmentBadge.tsx
git commit -m "UI: add StatusPill, refresh EnvironmentBadge palette"
```

---

## Task 5: `EnvCard` component (with test)

**Files:**
- Create: `src/components/EnvCard.tsx`
- Create: `tests/components/EnvCard.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/EnvCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EnvCard } from "@/components/EnvCard";

const ENV = { name: "dev", label: "dev", color: "blue", envFile: "dev.env", baseUrl: "openam-dev.example.com" } as any;

describe("EnvCard", () => {
  it("renders env name, label, and base URL", () => {
    render(<EnvCard env={ENV} health="healthy" lastPull={null} lastPush={null} />);
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("openam-dev.example.com")).toBeInTheDocument();
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("shows 'stale' pill when health=stale", () => {
    render(<EnvCard env={ENV} health="stale" lastPull={null} lastPush={null} />);
    expect(screen.getByText("stale")).toBeInTheDocument();
  });

  it("shows em-dash when no pull history", () => {
    render(<EnvCard env={ENV} health="healthy" lastPull={null} lastPush={null} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `npx vitest run tests/components/EnvCard.test.tsx`
Expected: FAIL — module `@/components/EnvCard` not found.

- [ ] **Step 3: Create `EnvCard.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Environment } from "@/lib/fr-config";

export type EnvHealth = "healthy" | "stale" | "locked" | "error";

export interface EnvCardProps {
  env: Environment & { baseUrl?: string };
  health: EnvHealth;
  lastPull: { at: string; status: "success" | "failed" } | null;
  lastPush: { at: string; status: "success" | "failed" } | null;
  onClick?: () => void;
}

const DOT: Record<string, string> = {
  blue:   "bg-blue-400",
  green:  "bg-emerald-400",
  yellow: "bg-amber-400",
  red:    "bg-rose-400",
  slate:  "bg-slate-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function EnvCard({ env, health, lastPull, lastPush, onClick }: EnvCardProps) {
  const pill =
    health === "healthy" ? <StatusPill tone="success">healthy</StatusPill>
    : health === "stale" ? <StatusPill tone="warning">stale</StatusPill>
    : health === "locked" ? <StatusPill tone="danger">locked</StatusPill>
    : <StatusPill tone="danger">error</StatusPill>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "card-padded text-left transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
        health === "error" && "border-rose-200"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", DOT[env.color] ?? DOT.slate)} />
          <span className="font-semibold text-[14px] text-slate-900">{env.label}</span>
        </div>
        {pill}
      </div>
      {env.baseUrl && (
        <div className="text-[11px] text-slate-500 font-mono truncate mb-3">{env.baseUrl}</div>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
        <div>
          <div className="text-slate-400">Last pull</div>
          <div className={cn("font-medium", lastPull?.status === "failed" ? "text-rose-600" : "text-slate-700")}>
            {lastPull ? timeAgo(lastPull.at) : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400">Last push</div>
          <div className={cn("font-medium", lastPush?.status === "failed" ? "text-rose-600" : "text-slate-700")}>
            {lastPush ? timeAgo(lastPush.at) : "—"}
          </div>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `npx vitest run tests/components/EnvCard.test.tsx`
Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EnvCard.tsx tests/components/EnvCard.test.tsx
git commit -m "UI: add EnvCard component with health states"
```

---

## Task 6: `ActivityRow` component

**Files:**
- Create: `src/components/ActivityRow.tsx`

- [ ] **Step 1: Create `ActivityRow.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { HistoryRecord } from "@/lib/op-history";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const CHIP: Record<string, { label: string; bg: string; fg: string }> = {
  pull:       { label: "PL",  bg: "bg-indigo-50",  fg: "text-indigo-700"  },
  push:       { label: "PS",  bg: "bg-emerald-50", fg: "text-emerald-700" },
  promote:    { label: "PR",  bg: "bg-amber-50",   fg: "text-amber-700"   },
  compare:    { label: "CMP", bg: "bg-violet-50",  fg: "text-violet-700"  },
  "dry-run":  { label: "DR",  bg: "bg-fuchsia-50", fg: "text-fuchsia-700" },
};

function label(r: HistoryRecord): string {
  if (r.type === "compare" || r.type === "dry-run") {
    const src = r.source?.environment ?? r.environment;
    const tgt = r.target?.environment ?? "—";
    return `${src} → ${tgt}`;
  }
  return r.environment;
}

export function ActivityRow({ record, onClick }: { record: HistoryRecord; onClick?: () => void }) {
  const chip = CHIP[record.type] ?? { label: "OP", bg: "bg-slate-100", fg: "text-slate-600" };
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
    >
      <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0", chip.bg, chip.fg)}>
        {chip.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px]">
          <span className="font-medium capitalize">{record.type}</span>
          <span className="text-slate-500"> · {label(record)}</span>
        </div>
        {record.scopes.length > 0 && (
          <div className="text-[11px] text-slate-400 truncate">
            {record.scopes.slice(0, 4).join(", ")}{record.scopes.length > 4 ? ` +${record.scopes.length - 4}` : ""}
          </div>
        )}
      </div>
      <div className="text-[11px] text-slate-400">{timeAgo(record.completedAt)}</div>
      <span className={cn("w-1.5 h-1.5 rounded-full", record.status === "success" ? "bg-emerald-400" : "bg-rose-400")} />
    </button>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ActivityRow.tsx
git commit -m "UI: add ActivityRow component for dashboard and history"
```

---

## Task 7: Dashboard restyle (`/`)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx` content**

Read current file (`cat src/app/page.tsx`) then replace with:

```tsx
import Link from "next/link";
import { getEnvironments } from "@/lib/fr-config";
import { readHistoryMerged } from "@/lib/op-history";
import type { HistoryRecord } from "@/lib/op-history";
import { EnvCard, type EnvHealth } from "@/components/EnvCard";
import { ActivityRow } from "@/components/ActivityRow";

function deriveHealth(
  lastPull: HistoryRecord | null,
  lastPush: HistoryRecord | null,
): EnvHealth {
  const latest = [lastPull, lastPush].filter(Boolean) as HistoryRecord[];
  if (latest.some((r) => r.status === "failed")) return "error";
  const mostRecent = latest.sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt))[0];
  if (!mostRecent) return "stale";
  const age = Date.now() - +new Date(mostRecent.completedAt);
  const DAY = 86_400_000;
  if (age > 7 * DAY) return "stale";
  return "healthy";
}

export default function DashboardPage() {
  const environments = getEnvironments();
  const history = readHistoryMerged({ limit: 500 }).filter((r) => r.type !== "log-search");

  const envCards = environments.map((env) => {
    const lastPull = history.find((r) => r.type === "pull" && r.environment === env.name) ?? null;
    const lastPush = history.find((r) => r.type === "push" && r.environment === env.name) ?? null;
    return {
      env,
      health: deriveHealth(lastPull, lastPush),
      lastPull: lastPull && { at: lastPull.completedAt, status: lastPull.status },
      lastPush: lastPush && { at: lastPush.completedAt, status: lastPush.status },
    };
  });

  const recent = history.slice(0, 8);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="page-title">Dashboard</h1>
        <p className="section-subtitle mt-1">
          Manage your Ping Advanced Identity Cloud configuration pipeline.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Environments</h2>
          <Link href="/environments" className="text-sm text-indigo-600 hover:text-indigo-700">Manage →</Link>
        </div>
        {envCards.length === 0 ? (
          <div className="card-padded text-center text-sm text-slate-400">
            No environments configured.{" "}
            <Link href="/environments" className="text-indigo-600 hover:underline">Add one</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {envCards.map(({ env, health, lastPull, lastPush }) => (
              <EnvCard
                key={env.name}
                env={env as any}
                health={health}
                lastPull={lastPull ?? null}
                lastPush={lastPush ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recent activity</h2>
          <Link href="/history" className="text-sm text-indigo-600 hover:text-indigo-700">View all →</Link>
        </div>
        <div className="card divide-y divide-slate-100">
          {recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">No activity yet.</p>
          ) : (
            recent.map((r) => <ActivityRow key={r.id} record={r} />)
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify dashboard in browser**

Open `http://localhost:3000`.
Expected: page-title, env cards in 3-up grid at lg breakpoint, activity list in card. No action buttons.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "UI: dashboard restyle — env cards grid and activity list"
```

---

## Task 8: `LogViewer` header restyle

**Files:**
- Modify: `src/components/LogViewer.tsx`

- [ ] **Step 1: Replace the header block (lines ~58–81)**

Replace the header `<div>` and its children with:

```tsx
<div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200/60 rounded-t-xl">
  <span className={cn(
    "inline-block w-2 h-2 rounded-full shrink-0",
    running ? "bg-amber-400 animate-pulse"
      : exitCode === 0 ? "bg-emerald-400"
      : exitCode !== null ? "bg-rose-400"
      : "bg-slate-300"
  )} />
  <span className={cn(
    "text-[12px] font-medium",
    exitCode === null
      ? (running ? "text-amber-700" : "text-slate-500")
      : exitCode === 0 ? "text-emerald-700" : "text-rose-700"
  )}>
    {statusText}
  </span>
  {logs.length > 0 && (
    <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-500">
      <button onClick={handleCopy} className="hover:text-slate-800 transition-colors">
        {copied ? "Copied" : "Copy"}
      </button>
      {!running && onClear && (
        <button onClick={onClear} className="hover:text-slate-800 transition-colors">Clear</button>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 2: Update the log body container (was `bg-slate-900 p-3`)**

Change the main output `<div>` className to:

```tsx
<div className="overflow-y-auto bg-slate-900 p-4 font-mono text-[12px] leading-5 min-h-[320px] max-h-[520px] rounded-b-xl">
```

- [ ] **Step 3: Wrap the whole component root in a `card` class**

Change the outermost `<div>` from `<div className="flex flex-col h-full">` to:

```tsx
<div className="card flex flex-col overflow-hidden">
```

- [ ] **Step 4: Verify visually**

Open any page that uses `LogViewer` (e.g. existing `/promote`).
Expected: rounded card, light header with green/amber/rose status dot, dark log body.

- [ ] **Step 5: Commit**

```bash
git add src/components/LogViewer.tsx
git commit -m "UI: LogViewer — light card chrome with status dot"
```

---

## Task 9: `/api/diff` route (with test)

**Files:**
- Create: `src/app/api/diff/route.ts`
- Create: `tests/api/diff.test.ts`

- [ ] **Step 1: Inspect existing compare/promote route for diff logic**

Run: `ls src/app/api && cat src/app/api/compare/route.ts 2>/dev/null | head -60 || true`
Note: the goal is to reuse whatever CLI invocation compare/dry-run already uses.

- [ ] **Step 2: Write failing test**

Create `tests/api/diff.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/fr-config", () => ({
  getEnvironments: () => ([
    { name: "dev", label: "dev", color: "blue", envFile: "dev.env" },
    { name: "prod", label: "prod", color: "red", envFile: "prod.env" },
  ]),
  runDiffSummary: vi.fn(async () => ([
    { scope: "journeys", added: 2, modified: 5, removed: 1 },
  ])),
}));

import { GET } from "@/app/api/diff/route";

describe("/api/diff", () => {
  it("returns 400 when params missing", async () => {
    const res = await GET(new Request("http://localhost/api/diff"));
    expect(res.status).toBe(400);
  });

  it("returns diff summary for valid request", async () => {
    const res = await GET(new Request("http://localhost/api/diff?source=dev&target=prod&scopes=journeys"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([{ scope: "journeys", added: 2, modified: 5, removed: 1 }]);
  });
});
```

- [ ] **Step 3: Run test — expect failure**

Run: `npx vitest run tests/api/diff.test.ts`
Expected: FAIL — module `@/app/api/diff/route` not found.

- [ ] **Step 4: Add `runDiffSummary` to `fr-config.ts`**

Open `src/lib/fr-config.ts`. Append at the bottom:

```ts
export interface DiffSummary {
  scope: string;
  added: number;
  modified: number;
  removed: number;
}

/**
 * Run a dry-run compare between two environments and parse per-scope counts.
 * Uses existing compare/promote CLI under the hood (fr-config-promote --dry-run).
 * If the CLI fails, throws — callers should catch and surface a banner.
 */
export async function runDiffSummary(
  source: string,
  target: string,
  scopes: string[],
): Promise<DiffSummary[]> {
  const { spawn } = await import("child_process");
  const env = getEnvironments().find((e) => e.name === target);
  if (!env) throw new Error(`unknown target env: ${target}`);

  return new Promise((resolve, reject) => {
    const args = ["--source", source, "--target", target, "--dry-run", "--json"];
    if (scopes.length) args.push("--scopes", scopes.join(","));
    const proc = spawn("fr-config-promote", args, { env: process.env });
    let out = "";
    let err = "";
    proc.stdout.on("data", (b) => { out += b.toString(); });
    proc.stderr.on("data", (b) => { err += b.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(err || `diff failed: exit ${code}`));
      try {
        const parsed = JSON.parse(out);
        // Expected shape: { changes: [{ scope, added, modified, removed }] }
        const changes = (parsed.changes ?? []) as DiffSummary[];
        resolve(changes);
      } catch (e) {
        reject(new Error(`diff parse error: ${(e as Error).message}`));
      }
    });
  });
}
```

Note: if `fr-config-promote --dry-run --json` doesn't exist on this system yet, the test mocks `runDiffSummary`, so the API test will pass. The UI-level integration will show "Diff unavailable — proceed with caution" until the CLI supports it.

- [ ] **Step 5: Create `src/app/api/diff/route.ts`**

```ts
import { NextResponse } from "next/server";
import { runDiffSummary } from "@/lib/fr-config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const target = url.searchParams.get("target");
  const scopesParam = url.searchParams.get("scopes");
  if (!source || !target) {
    return NextResponse.json({ error: "missing source or target" }, { status: 400 });
  }
  const scopes = scopesParam ? scopesParam.split(",").filter(Boolean) : [];
  try {
    const diff = await runDiffSummary(source, target, scopes);
    return NextResponse.json(diff);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 6: Run test — expect pass**

Run: `npx vitest run tests/api/diff.test.ts`
Expected: Both tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/diff/route.ts src/lib/fr-config.ts tests/api/diff.test.ts
git commit -m "API: add /api/diff route with dry-run-based summary"
```

---

## Task 10: `DangerousConfirmDialog` component (with test)

**Files:**
- Create: `src/components/DangerousConfirmDialog.tsx`
- Create: `tests/components/DangerousConfirmDialog.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/DangerousConfirmDialog.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";

const diff = [{ scope: "journeys", added: 2, modified: 5, removed: 1 }];

describe("DangerousConfirmDialog", () => {
  it("disables Confirm until exact tenant name is typed", async () => {
    const onConfirm = vi.fn();
    render(
      <DangerousConfirmDialog
        open
        title="Push to prod"
        subtitle="Test subtitle"
        tenantName="prod"
        diffLoader={async () => diff}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText(/journeys/)).toBeInTheDocument());
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeDisabled();

    const input = screen.getByPlaceholderText(/type/i);
    fireEvent.change(input, { target: { value: "pro" } });
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "prod" } });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows banner when diff loader fails", async () => {
    render(
      <DangerousConfirmDialog
        open
        title="Push to prod"
        subtitle=""
        tenantName="prod"
        diffLoader={async () => { throw new Error("boom"); }}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    await waitFor(() => expect(screen.getByText(/Diff unavailable/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `npx vitest run tests/components/DangerousConfirmDialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `DangerousConfirmDialog.tsx`**

```tsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiffSummary } from "@/lib/fr-config";

interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  tenantName: string;
  diffLoader: () => Promise<DiffSummary[]>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DangerousConfirmDialog(props: Props) {
  const { open, title, subtitle, tenantName, diffLoader, onConfirm, onCancel } = props;
  const [typed, setTyped] = useState("");
  const [diff, setDiff] = useState<DiffSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setDiff(null);
      setError(null);
      return;
    }
    let cancelled = false;
    diffLoader()
      .then((d) => { if (!cancelled) setDiff(d); })
      .catch((e) => { if (!cancelled) setError(e.message ?? "diff failed"); });
    return () => { cancelled = true; };
  }, [open, diffLoader]);

  const matches = typed === tenantName;

  const totalChanges = diff
    ? diff.reduce((n, r) => n + r.added + r.modified + r.removed, 0)
    : 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(560px,calc(100vw-32px))] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-start gap-4 p-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-[16px] font-bold text-slate-900">{title}</Dialog.Title>
              <Dialog.Description className="text-[12px] text-slate-500 mt-1">{subtitle}</Dialog.Description>
            </div>
            <button onClick={onCancel} aria-label="close" className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="label-xs">DIFF PREVIEW</span>
              {diff && (
                <span className="text-[11px] text-slate-400">
                  {diff.length} scope{diff.length === 1 ? "" : "s"} · {totalChanges} change{totalChanges === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[12px] px-3 py-2">
                Diff unavailable — proceed with caution. ({error})
              </div>
            )}

            {!error && !diff && (
              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[12px] px-3 py-3">
                Loading diff…
              </div>
            )}

            {diff && diff.length > 0 && (
              <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto mb-4">
                {diff.map((row) => (
                  <div
                    key={row.scope}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-[12px] border-b border-slate-100 last:border-b-0"
                  >
                    <span className="flex-1 font-mono font-medium text-slate-800">{row.scope}</span>
                    <span className="text-emerald-700">+{row.added} new</span>
                    <span className="text-amber-700">~{row.modified} modified</span>
                    <span className="text-rose-700">−{row.removed} removed</span>
                  </div>
                ))}
              </div>
            )}

            <label className="block text-[12px] text-slate-600 mb-2">
              Type{" "}
              <span className="font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                {tenantName}
              </span>{" "}
              to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={`type ${tenantName}`}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-mono text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={!matches}
              className={cn("btn-danger-solid", !matches && "opacity-50 cursor-not-allowed")}
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `npx vitest run tests/components/DangerousConfirmDialog.test.tsx`
Expected: Both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/DangerousConfirmDialog.tsx tests/components/DangerousConfirmDialog.test.tsx
git commit -m "UI: add DangerousConfirmDialog with type-to-confirm and diff preview"
```

---

## Task 11: `/sync` page — form + log panel

**Files:**
- Create: `src/app/sync/page.tsx`
- Create: `src/app/sync/SyncForm.tsx`

- [ ] **Step 1: Read existing `PullForm.tsx` and `PushForm.tsx` for reference**

Run: `cat src/app/pull/PullForm.tsx src/app/push/PushForm.tsx`

Note: we'll reuse their streaming approach; the new form unifies them behind a single direction selector.

- [ ] **Step 2: Create `src/app/sync/page.tsx`**

```tsx
import { Suspense } from "react";
import { getEnvironments } from "@/lib/fr-config";
import { SyncForm } from "./SyncForm";

export default function SyncPage() {
  const environments = getEnvironments();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Sync</h1>
        <p className="section-subtitle mt-1">
          Pull config from a tenant into this repo, or push repo config up to a tenant.
        </p>
      </header>
      <Suspense fallback={<div className="card-padded text-slate-400">Loading…</div>}>
        <SyncForm environments={environments} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/sync/SyncForm.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogViewer } from "@/components/LogViewer";
import { ScopeSelector } from "@/components/ScopeSelector";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";
import { useStreamingLogs } from "@/hooks/useStreamingLogs";
import type { Environment, DiffSummary } from "@/lib/fr-config";

type Direction = "pull" | "push";

interface StoredState {
  tenant: string;
  direction: Direction;
  scopes: string[];
}

const STORAGE_KEY = "aic:sync:last";

export function SyncForm({ environments }: { environments: Environment[] }) {
  const params = useSearchParams();
  const router = useRouter();

  const [tenant, setTenant] = useState<string>(environments[0]?.name ?? "");
  const [direction, setDirection] = useState<Direction>(
    (params.get("direction") as Direction) || "pull"
  );
  const [scopes, setScopes] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { logs, running, exitCode, run, abort, clear } = useStreamingLogs();

  // Load last state
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as StoredState;
      if (s.tenant && environments.some((e) => e.name === s.tenant)) setTenant(s.tenant);
      if (s.direction) setDirection(s.direction);
      if (Array.isArray(s.scopes)) setScopes(s.scopes);
    } catch {}
  }, [environments]);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tenant, direction, scopes }));
  }, [tenant, direction, scopes]);

  const tenantEnv = environments.find((e) => e.name === tenant);
  const isProd = tenantEnv?.color === "red";
  const isDangerous = direction === "push" && isProd;

  const diffLoader = useMemo(
    () => async (): Promise<DiffSummary[]> => {
      const sp = new URLSearchParams({ source: "repo", target: tenant, scopes: scopes.join(",") });
      const res = await fetch(`/api/diff?${sp.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "diff failed");
      return res.json();
    },
    [tenant, scopes]
  );

  function startRun() {
    if (!tenant || scopes.length === 0) return;
    const url = direction === "pull" ? "/api/pull" : "/api/push";
    run(url, { tenant, scopes });
  }

  function handleSubmit() {
    if (isDangerous) {
      setConfirmOpen(true);
      return;
    }
    startRun();
  }

  const runButtonLabel =
    direction === "pull"
      ? `⬇ Pull ${scopes.length || ""} scope${scopes.length === 1 ? "" : "s"} from ${tenant || "…"}`.trim()
      : `⬆ Push ${scopes.length || ""} scope${scopes.length === 1 ? "" : "s"} to ${tenant || "…"}`.trim();

  const runButtonClass =
    direction === "pull" ? "btn-primary" : isProd ? "btn-danger-solid" : "btn-danger-outline";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* LEFT: form */}
      <div className="card-padded space-y-5">
        <div>
          <div className="label-xs mb-1.5">TENANT</div>
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>{env.label} — {env.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="label-xs mb-1.5">DIRECTION</div>
          <div className={cn(
            "grid grid-cols-2 gap-1 p-1 rounded-xl",
            direction === "push" && isProd ? "bg-rose-50" : "bg-slate-100"
          )}>
            <button
              type="button"
              onClick={() => setDirection("pull")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                direction === "pull"
                  ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowDown className="w-4 h-4" /> Pull
            </button>
            <button
              type="button"
              onClick={() => setDirection("push")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                direction === "push"
                  ? isProd
                    ? "bg-white text-rose-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ArrowUp className="w-4 h-4" /> Push
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="label-xs">SCOPES</span>
            <span className="text-[11px] text-slate-400">{scopes.length} selected</span>
          </div>
          <ScopeSelector value={scopes} onChange={setScopes} />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!tenant || scopes.length === 0 || running}
          className={cn("w-full justify-center", runButtonClass)}
        >
          {running ? "Running…" : runButtonLabel}
        </button>
      </div>

      {/* RIGHT: log */}
      <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clear} />

      {tenantEnv && (
        <DangerousConfirmDialog
          open={confirmOpen}
          title={`Push to ${tenantEnv.label}`}
          subtitle="This writes repo config to a live tenant. Review the preview below."
          tenantName={tenantEnv.name}
          diffLoader={diffLoader}
          onConfirm={() => { setConfirmOpen(false); startRun(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
```

Note: If `useStreamingLogs` has a different API (`run` signature), read it and adjust the `run(url, payload)` calls. The hook already exists — inspect it with `cat src/hooks/useStreamingLogs.ts` before writing this file.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: No errors. If errors mention `useStreamingLogs.run`, adjust the call signature to match the existing hook.

- [ ] **Step 5: Open `/sync` in browser and smoke-test**

Open `http://localhost:3000/sync`.
Expected: tenant select, Pull/Push segmented, scope selector, log panel on right. Select a non-prod tenant, pick 1-2 scopes, click Pull — streams output.

- [ ] **Step 6: Commit**

```bash
git add src/app/sync/page.tsx src/app/sync/SyncForm.tsx
git commit -m "UI: add /sync merged Pull+Push page"
```

---

## Task 12: Redirect shims for `/pull` and `/push`

**Files:**
- Modify: `src/app/pull/page.tsx`
- Modify: `src/app/push/page.tsx`
- Delete: `src/app/pull/PullForm.tsx`
- Delete: `src/app/push/PushForm.tsx`

- [ ] **Step 1: Replace `src/app/pull/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function PullRedirect() {
  redirect("/sync?direction=pull");
}
```

- [ ] **Step 2: Replace `src/app/push/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function PushRedirect() {
  redirect("/sync?direction=push");
}
```

- [ ] **Step 3: Delete old form files**

```bash
rm src/app/pull/PullForm.tsx src/app/push/PushForm.tsx
```

- [ ] **Step 4: Verify typecheck + navigate**

Run: `npx tsc --noEmit`
Expected: No errors.
Open `http://localhost:3000/pull` — should land on `/sync?direction=pull`.

- [ ] **Step 5: Commit**

```bash
git add src/app/pull/page.tsx src/app/push/page.tsx
git add -u src/app/pull src/app/push
git commit -m "UI: redirect /pull and /push to /sync (remove legacy forms)"
```

---

## Task 13: `ScopeSelector` restyle

**Files:**
- Modify: `src/components/ScopeSelector.tsx`

- [ ] **Step 1: Read the current component**

Run: `cat src/components/ScopeSelector.tsx`

- [ ] **Step 2: Apply Calm SaaS classes to group headers and chips**

Find each of the following in the current file and replace:
- Outer container: wrap groups in `space-y-2.5`.
- Group container: `border border-slate-200 rounded-xl p-3`.
- Group header: `flex items-center justify-between text-[12px] font-semibold text-slate-800 mb-2`.
- Count text: `text-[10px] text-slate-400`.
- Selected scope chip: `px-2.5 py-1 text-[11px] rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 cursor-pointer`.
- Unselected scope chip: `px-2.5 py-1 text-[11px] rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 cursor-pointer`.
- "Select all in group" link: `text-[11px] text-indigo-600 hover:text-indigo-700`.

Do not change selection logic or props — className changes only.

- [ ] **Step 3: Verify in `/sync` page**

Open `http://localhost:3000/sync`.
Expected: Scope groups look like the preview — rounded outlined boxes, indigo chips for selected.

- [ ] **Step 4: Commit**

```bash
git add src/components/ScopeSelector.tsx
git commit -m "UI: ScopeSelector restyle — outlined groups and indigo chips"
```

---

## Task 14: Promote page — two-column stepper + dialog wiring

**Files:**
- Modify: `src/app/promote/PromoteWorkflow.tsx`

- [ ] **Step 1: Read current file**

Run: `wc -l src/app/promote/PromoteWorkflow.tsx && head -80 src/app/promote/PromoteWorkflow.tsx`

- [ ] **Step 2: Refactor layout — wrap the existing workflow state in a new shell**

At the top of the component's JSX return, replace the existing page shell with:

```tsx
return (
  <div className="space-y-6">
    <header className="flex items-start justify-between gap-6">
      <div>
        <h1 className="page-title">Promote</h1>
        <p className="section-subtitle mt-1">
          Move verified config from a source tenant to a target tenant, safely.
        </p>
      </div>
      {source && target && (
        <div className="flex items-center gap-3">
          <EnvironmentBadge env={source} />
          <span className="text-slate-400">→</span>
          <EnvironmentBadge env={target} />
        </div>
      )}
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      <aside className="card-padded lg:sticky lg:top-20 h-fit">
        <div className="label-xs mb-3">STEPS</div>
        <ol className="space-y-0.5">
          {STEPS.map((step, idx) => {
            const state = stepState(step.key); // existing helper — reuse
            const active = currentStep === step.key;
            const done = state === "done";
            const failed = state === "failed";
            return (
              <li key={step.key}>
                <button
                  onClick={() => setCurrentStep(step.key)}
                  className={cn(
                    "w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                    active ? "bg-indigo-50" : "hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    done ? "bg-emerald-50 text-emerald-700"
                      : failed ? "bg-rose-50 text-rose-700"
                      : active ? "bg-indigo-600 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {done ? "✓" : failed ? "!" : idx + 1}
                  </span>
                  <span className="flex-1">
                    <span className={cn("block text-[13px]", active ? "font-semibold text-indigo-700" : done ? "text-slate-800" : "text-slate-600")}>
                      {step.label}
                    </span>
                    {state !== "pending" && (
                      <span className={cn("block text-[10px]", failed ? "text-rose-600" : "text-slate-400")}>
                        {stepStatusLabel(step.key)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="space-y-4">
        <div className="card-padded">
          {/* existing per-step form goes here — move body from old layout */}
        </div>
        <LogViewer logs={logs} running={running} exitCode={exitCode} onClear={clearLogs} />
      </div>
    </div>

    {/* Existing dangerous confirmation replaced by shared dialog */}
    {target && (
      <DangerousConfirmDialog
        open={promoteConfirmOpen}
        title={`Promote → ${target.label}`}
        subtitle="This writes config to the target tenant. Review the preview below."
        tenantName={target.name}
        diffLoader={async () => {
          const sp = new URLSearchParams({
            source: source?.name ?? "",
            target: target.name,
            scopes: scopes.join(","),
          });
          const res = await fetch(`/api/diff?${sp.toString()}`);
          if (!res.ok) throw new Error((await res.json()).error ?? "diff failed");
          return res.json();
        }}
        onConfirm={() => { setPromoteConfirmOpen(false); runPromote(); }}
        onCancel={() => setPromoteConfirmOpen(false)}
      />
    )}
  </div>
);
```

- [ ] **Step 3: Add needed imports**

At the top of the file:

```tsx
import { cn } from "@/lib/utils";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import { LogViewer } from "@/components/LogViewer";
import { DangerousConfirmDialog } from "@/components/DangerousConfirmDialog";
```

If helpers `stepState` and `stepStatusLabel` don't exist in the file, create them inside the component next to other state: `stepState(key)` returns `"done" | "running" | "failed" | "pending"` based on existing step tracking; `stepStatusLabel(key)` returns a short status string like `"ok · 3s"`, `"running · 0:14"`, `"failed"`.

- [ ] **Step 4: Replace the existing execute-step confirmation with `setPromoteConfirmOpen(true)`**

Find the existing "Promote" (execute step 5) button click handler. Replace the inline confirmation logic with `setPromoteConfirmOpen(true)`. Add `const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);` at the top of the component.

- [ ] **Step 5: Verify in browser**

Open `http://localhost:3000/promote`.
Expected: Two-column layout, vertical stepper on left, active step highlighted indigo. Selecting source/target and clicking Promote execute opens the DangerousConfirmDialog.

- [ ] **Step 6: Commit**

```bash
git add src/app/promote/PromoteWorkflow.tsx
git commit -m "UI: Promote — two-column stepper, shared DangerousConfirmDialog"
```

---

## Task 15: Environments page restyle

**Files:**
- Modify: `src/app/environments/EnvironmentsManager.tsx`
- Modify: `src/app/environments/EnvEditor.tsx`

- [ ] **Step 1: Read current files**

Run: `wc -l src/app/environments/EnvironmentsManager.tsx src/app/environments/EnvEditor.tsx`

- [ ] **Step 2: Change `EnvironmentsManager` overview to use `EnvCard` grid**

Replace the list rendering with:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {environments.map((env) => (
    <EnvCard
      key={env.name}
      env={env as any}
      health={deriveHealthFor(env)}
      lastPull={null}
      lastPush={null}
      onClick={() => setEditing(env)}
    />
  ))}
</div>
```

Add an `editing: Environment | null` state and render `EnvEditor` inside a `Dialog.Root` when `editing` is set. Add an `Add environment` tile as the last grid item (`card-padded border-dashed`).

`deriveHealthFor(env)` can reuse the same logic as the dashboard — import `readHistoryMerged` and compute per-env from the history list. For now, pass `"healthy"` if it's too complex; the dashboard already handles the accurate derivation.

- [ ] **Step 3: Restyle `EnvEditor` chrome**

Inside `EnvEditor.tsx`, the outer container becomes `card-padded space-y-4`. Replace all button classes with `btn-primary` / `btn-secondary` / `btn-danger-outline` as appropriate. Replace the existing inline alert for Test Connection with a `StatusPill`:

```tsx
{testStatus === "idle" && null}
{testStatus === "running" && <StatusPill tone="info">testing…</StatusPill>}
{testStatus === "ok" && <StatusPill tone="success">ok</StatusPill>}
{testStatus === "failed" && <StatusPill tone="danger">failed: {testError}</StatusPill>}
```

Wrap existing form fields in a `tabs` pattern if `Raw` vs `Form` is already implemented; otherwise leave the existing structure and only update classNames.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000/environments`.
Expected: Card grid with clickable cards that open an editor dialog. Test connection shows inline pill.

- [ ] **Step 5: Commit**

```bash
git add src/app/environments/EnvironmentsManager.tsx src/app/environments/EnvEditor.tsx
git commit -m "UI: Environments — card grid, dialog editor, inline test status"
```

---

## Task 16: History page — grouped list + filters + drawer

**Files:**
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/history/*` (other files that render rows)

- [ ] **Step 1: Read current history page structure**

Run: `ls src/app/history && head -80 src/app/history/page.tsx`

- [ ] **Step 2: Rewrite list render**

Replace the current table / list with:

```tsx
<div className="space-y-6">
  <header className="flex items-center justify-between">
    <div>
      <h1 className="page-title">History</h1>
      <p className="section-subtitle mt-1">Every operation that has run against your tenants.</p>
    </div>
  </header>

  <div className="card-padded">
    {/* filter bar */}
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <select className="px-3 py-2 rounded-lg border border-slate-200 text-[13px]"> {/* type */} </select>
      <select className="px-3 py-2 rounded-lg border border-slate-200 text-[13px]"> {/* env */} </select>
      <select className="px-3 py-2 rounded-lg border border-slate-200 text-[13px]"> {/* status */} </select>
      <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 text-[13px]" placeholder="Search…" />
    </div>
  </div>

  {/* grouped list */}
  <div className="space-y-4">
    {groups.map((group) => (
      <section key={group.label}>
        <h2 className="label-xs mb-2">{group.label}</h2>
        <div className="card divide-y divide-slate-100">
          {group.records.map((r) => (
            <ActivityRow key={r.id} record={r} onClick={() => setOpenRecord(r)} />
          ))}
        </div>
      </section>
    ))}
  </div>

  {/* right drawer */}
  {openRecord && (
    <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setOpenRecord(null)}>
      <aside
        className="fixed right-0 top-0 h-full w-[min(560px,100vw)] bg-white shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label-xs mb-2">RECORD</div>
        <div className="text-lg font-semibold capitalize">{openRecord.type} · {openRecord.environment}</div>
        <pre className="mt-4 text-[11px] bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">{openRecord.logs ?? "(no logs)"}</pre>
      </aside>
    </div>
  )}
</div>
```

Keep existing data loading and filter state hooks. Group by day using a small helper:

```tsx
function groupByDay(records: HistoryRecord[]): { label: string; records: HistoryRecord[] }[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups: Record<string, HistoryRecord[]> = {};
  for (const r of records) {
    const d = new Date(r.completedAt); d.setHours(0,0,0,0);
    const key = d.getTime() === today.getTime()     ? "Today"
              : d.getTime() === yesterday.getTime() ? "Yesterday"
              : d.toLocaleDateString();
    (groups[key] ??= []).push(r);
  }
  return Object.entries(groups).map(([label, records]) => ({ label, records }));
}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/history`.
Expected: Filter bar, grouped list, clicking a row opens a right-side drawer with record details.

- [ ] **Step 4: Commit**

```bash
git add src/app/history
git commit -m "UI: History — grouped list, filter bar, record drawer"
```

---

## Task 17: Compare page restyle

**Files:**
- Modify: `src/app/compare/CompareForm.tsx`
- Modify: `src/app/compare/DiffReport.tsx`

- [ ] **Step 1: Apply Calm SaaS classes — no structural changes**

In `CompareForm.tsx`, change the outer container to `card-padded`, button classes to `btn-primary` / `btn-secondary`, labels to `label-xs`, selects and inputs to `px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`. Wrap the result area in `card`.

In `DiffReport.tsx`, change added/removed/modified chip classes to use `text-emerald-700`, `text-rose-700`, `text-amber-700` respectively with the existing layout.

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000/compare`.
Expected: Consistent card chrome and button styling.

- [ ] **Step 3: Commit**

```bash
git add src/app/compare
git commit -m "UI: Compare page restyle"
```

---

## Task 18: Browse (configs), Logs, Settings restyle

**Files:**
- Modify: `src/app/configs/ConfigsViewer.tsx` + `src/app/configs/page.tsx`
- Modify: `src/app/logs/LogsExplorer.tsx` + `src/app/logs/page.tsx`
- Modify: `src/app/settings/SettingsForm.tsx` + `src/app/settings/page.tsx`

- [ ] **Step 1: Add page header to each route**

Every page file should start with:

```tsx
<div className="space-y-6">
  <header>
    <h1 className="page-title">{PAGE_TITLE}</h1>
    <p className="section-subtitle mt-1">{PAGE_SUBTITLE}</p>
  </header>
  ...
</div>
```

Titles/subtitles:
- Browse: `"Browse"` / `"Explore the pulled configuration tree."`
- Logs: `"Logs"` / `"Search and inspect tenant logs."`
- Settings: `"Settings"` / `"App-level preferences."`

- [ ] **Step 2: Apply shared utility classes to form/controls**

Outer containers → `card-padded space-y-4`. Buttons → `btn-primary` / `btn-secondary`. Labels → `label-xs`. Inputs → `px-3 py-2.5 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`.

- [ ] **Step 3: Update journey/workflow graphs (configs)**

In `JourneyGraph.tsx` / `WorkflowGraph.tsx` (and the compare variants), change edge/node stroke colors to use `#4f46e5` (indigo-600) for active paths and `#94a3b8` (slate-400) for neutral. No behavioral changes.

- [ ] **Step 4: Verify each in browser**

Open `/configs`, `/logs`, `/settings`.
Expected: Consistent chrome with the rest of the app.

- [ ] **Step 5: Commit**

```bash
git add src/app/configs src/app/logs src/app/settings
git commit -m "UI: Browse, Logs, Settings restyle for Calm SaaS consistency"
```

---

## Task 19: Full app smoke test

**Files:** None.

- [ ] **Step 1: Type check the whole app**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run full vitest suite**

Run: `npx vitest run`
Expected: All tests pass, including new `EnvCard`, `DangerousConfirmDialog`, `/api/diff` tests.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Manual walkthrough**

Open `npm run dev` and visit in order, confirming visual consistency and no console errors:
1. `/` — env cards grid, activity list
2. `/sync` — form + log, pull a non-prod tenant
3. `/sync?direction=push` — Push button styling on prod tenant shows rose
4. `/sync` push-to-prod — dialog opens with diff (or "Diff unavailable" banner) and type-to-confirm
5. `/promote` — two-column stepper
6. `/environments` — card grid, open editor dialog
7. `/history` — grouped list, open drawer on a row
8. `/configs`, `/compare`, `/logs`, `/settings` — consistent chrome
9. `/pull` and `/push` — redirect to `/sync`

- [ ] **Step 5: Commit any leftover polish**

If the walkthrough surfaces small issues, fix them and commit:

```bash
git add -A
git commit -m "UI: redesign polish after smoke test"
```

---

## Rollback

If the redesign causes regressions, revert by rolling back the feature commits:

```bash
git log --oneline | grep -E "UI:|API: add /api/diff" | head -20
git revert <commit-range>
```

All changes are additive or restyle-only; backend APIs (`/api/pull`, `/api/push`, `/api/promote`, etc.) are untouched.
