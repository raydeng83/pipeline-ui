# AIC Pipeline UI Redesign — Design

**Date:** 2026-04-13
**Status:** Draft (awaiting review)
**Scope:** Visual + IA refresh of the pipeline-ui Next.js app. No backend changes.

## Goal

Make the UI feel modern, stylish, and easy to use. Keep all existing capabilities. No new features beyond a merged Sync page and a diff preview in the dangerous-confirm dialog.

## Summary of decisions

| Area | Decision |
|---|---|
| Visual direction | "Calm SaaS" — light, rounded, airy (Stripe/Linear light) |
| Navigation | Polished top nav (keep shape) + informational working-env pill |
| Page consolidation | Merge `/pull` and `/push` into `/sync`; `/promote`, `/environments`, `/history` stay |
| Prod safety | Type-to-confirm dialog with diff preview for push-to-prod and promote execute |

## 1. Visual language

- **Palette:** white / `slate-50` background, white cards with `border-slate-200/60` + soft shadow `shadow-[0_1px_2px_rgba(15,23,42,.04)]`. Single accent: **indigo-600** for primary; emerald success, amber warning, rose destructive. Drop ad-hoc sky/violet/fuchsia.
- **Radius:** `rounded-xl` (12px) for cards, `rounded-lg` for inputs/buttons.
- **Type:** Geist Sans. Scale: `text-[13px]` body, `text-sm` labels, `text-base` section headings, `text-2xl` page titles. No ALL-CAPS section headers — sentence case in `text-slate-500`.
- **Density:** `py-4` cards, `gap-6` between sections.
- **Motion:** 150ms for hover, 200ms for dialog open. No bounces.
- **Icons:** Lucide only, `h-4 w-4`, `stroke-[1.75]`. Replace hand-rolled SVGs currently in `src/app/page.tsx`.

## 2. Information architecture & navigation

- **Top nav** (polished): wordmark "AIC Pipeline" · `Dashboard · Sync · Promote · Environments · History` · right: informational "working env · <name>" pill tinted by env color.
- **Routes:**
  - `/` — Dashboard
  - `/sync` — merged Pull + Push
  - `/promote` — restyled, unchanged structure
  - `/environments` — restyled
  - `/history` — restyled
- **Redirects:** `/pull` → `/sync?direction=pull`; `/push` → `/sync?direction=push`. One release shim, then drop.
- **Active state:** `bg-indigo-50 text-indigo-700` pill.

## 3. Dashboard (`/`)

- **Environments section:** 3-up card grid on desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). Each card: color dot + name, health pill, masked tenant URL in monospace, last-pull / last-push with relative time. Click → opens the `EnvEditor` dialog on `/environments`.
- **Health states:** `healthy` (last op < 24h, success), `stale` (> 7d), `error` (last op failed), `locked` (lock file present). Derived from existing history + lock file — no new API.
- **Recent activity:** same data as today, restyled into a card with soft row dividers. Each row: 2-letter type chip (PL, PS, PR, CMP, DR) · type · env · scope preview · relative time · status dot. Failed runs get rose status dot (not red row background).
- **Remove:** existing ALL-CAPS section headers, inline hand-rolled activity SVGs, current row layout.
- **Do not add** action buttons on the dashboard — nav is the entry point.

## 4. Sync page (`/sync`)

Replaces `/pull` and `/push`. Two-column layout on desktop, stacked on mobile.

**Left column — form card:**
1. **Tenant** — Radix Select, reuses `EnvironmentBadge`.
2. **Direction** — segmented control: `⬇ Pull` / `⬆ Push`. Selecting Push against a prod-colored env tints the control rose.
3. **Scopes** — `ScopeSelector` restyled; group headers collapsible, "select all in group" chip.
4. **Run button** — indigo for Pull; rose-outline for Push to non-prod; rose-solid + type-to-confirm dialog for Push to prod.

**Right column — live log card:** always visible. Reuses `LogViewer` with restyled sticky header: run status (`idle` / `running <duration>` / `success` / `failed`), abort button, filter toggle (all/stdout/stderr). Empty state text: "No run yet. Select a tenant and scopes, then Pull or Push."

**State:** local to page. Submits to existing `/api/pull` or `/api/push`. Last-used (tenant, direction, scopes) persisted in `localStorage` as `aic:sync:last`.

**Files:**
- New: `src/app/sync/page.tsx`, `src/app/sync/SyncForm.tsx`.
- Delete: `src/app/pull/PullForm.tsx`, `src/app/push/PushForm.tsx`, `src/app/pull/page.tsx`, `src/app/push/page.tsx`.
- Add redirect pages at `/pull` and `/push` for one release that forward to `/sync` preserving query.

## 5. Dangerous confirm dialog

Triggered by: Push to prod on `/sync`, Promote execute step on `/promote`.

New component: `src/components/DangerousConfirmDialog.tsx`. Props: `tenantName: string`, `title: string`, `diffLoader: () => Promise<DiffSummary>`, `onConfirm: () => void`.

Radix Dialog, `max-w-2xl`:
1. **Header:** rose icon tile + title ("Push to prod" / "Promote staging → prod") + one-line subtitle.
2. **Diff preview:** scrollable, `max-h-64`. Row per scope: `scope · +N new · ~N modified · −N removed`. Fetched via new `/api/diff` route that invokes existing compare/dry-run logic (`fr-config-promote --dry-run` or equivalent). If diff unavailable, show banner "Diff unavailable — proceed with caution" but allow confirmation.
3. **Type-to-confirm input:** label "Type `<tenantName>` to confirm". Case-sensitive exact-match. Confirm button disabled until match.
4. **Footer:** Cancel (outline) + Confirm (rose solid, disabled gate). Escape/backdrop → cancel.

Non-prod pushes keep the existing lightweight confirmation dialog — heavy friction is prod-only.

**New API:** `src/app/api/diff/route.ts` — `GET /api/diff?source=<env>&target=<env>&scopes=<csv>`. Returns `DiffSummary = { scope: string; added: number; modified: number; removed: number }[]`. Shells out the same way existing `/api/promote` does.

## 6. Promote page (`/promote`)

Visual-only. Keeps 8-step workflow and all existing logic.

- **Two-column layout:** left (sticky) vertical stepper; right active-step card + live log.
- **Stepper:** `Check lock → Lock → Dry-run → Check report → Promote → Check status → Unlock`. Rollback pinned at the bottom as a separate item. Step circle: emerald check (done), indigo filled with ring (active), slate (pending), rose (failed). One-line status under each label.
- **Active-step card:** step index, title, one-sentence description, primary action button, abort button.
- **Log card:** same `LogViewer` restyle as `/sync`.
- **Env chips** in the header show `source → target` with env colors.
- **Execute (step 5):** opens `DangerousConfirmDialog`.
- **Rollback:** rose-outline button with a lighter single-click confirmation.
- **Remove:** current horizontal step chips.

## 7. Environments and History restyle

**Environments (`/environments`):**
- Overview: env cards grid (same card as dashboard).
- Click card → full-width Radix Dialog with `EnvEditor`, tabs: `Form` / `Raw`.
- Add wizard: keep 3 steps (basics, credentials, repo paths), restyled with the `/promote` vertical stepper pattern.
- Test connection: inline status pill (`testing…` / `ok` / `failed: <reason>`) instead of alert.

**History (`/history`):**
- Card-grouped list by day (`Today`, `Yesterday`, absolute date). Rows use the dashboard activity row style.
- Filter bar: type, env, status, free-text.
- Row click → right-side Radix drawer with full log and metadata.
- Pagination unchanged.

## Files changed (summary)

**New:**
- `src/app/sync/page.tsx`
- `src/app/sync/SyncForm.tsx`
- `src/components/DangerousConfirmDialog.tsx`
- `src/app/api/diff/route.ts`

**Modified:**
- `src/app/layout.tsx` (nav polish, working-env pill)
- `src/components/NavBar.tsx` (active state, pill)
- `src/app/page.tsx` (dashboard card grid, activity restyle, remove inline SVGs)
- `src/app/promote/PromoteWorkflow.tsx` (two-column stepper layout)
- `src/app/environments/EnvironmentsManager.tsx` (card grid + dialog)
- `src/app/environments/EnvEditor.tsx` (tabs, inline test result)
- `src/app/history/*` (grouped list + drawer + filter bar)
- `src/components/LogViewer.tsx` (restyled header, status chip)
- `src/components/ScopeSelector.tsx` (group headers, chips)
- `src/app/globals.css` (palette tokens, card shadow util)

**Deleted:**
- `src/app/pull/PullForm.tsx`, `src/app/pull/page.tsx`
- `src/app/push/PushForm.tsx`, `src/app/push/page.tsx`
  (Replace with thin redirect pages for one release.)

## Out of scope

- Command palette (⌘K)
- Sidebar navigation
- Dark mode
- New backend functionality beyond `/api/diff`
- Adding new env card actions (quick pull/push buttons on the card)
- Real-time multi-user presence / locks visibility beyond the existing lock file check

## Testing

- **Visual:** manual walkthrough of all five routes on desktop + narrow viewport.
- **Functional regression:** existing vitest suites under `src/lib/` must still pass (they cover pipeline logic, not UI).
- **New tests:**
  - `DangerousConfirmDialog` — confirm button enables only on exact match; cancel/backdrop dismiss; diff loader failure shows banner.
  - `/api/diff` route — shape of response, error path when compare fails.
  - `/sync` localStorage round-trip.
- **Manual** prod safety walkthrough: Push to prod from `/sync` and Execute from `/promote` both surface the dialog with a real diff.
