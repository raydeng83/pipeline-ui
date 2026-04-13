# Real Diff Preview for Push Confirmation — Design

**Date:** 2026-04-13
**Status:** Draft (awaiting review)
**Scope:** Replace the placeholder `/api/diff` with a real diff source backed by the existing compare pipeline, so the push-confirmation dialog shows actual per-scope change counts before the user commits.

## Goal

Before a push executes — on `/sync` and `/promote` — show the user a per-scope summary of what will change on the target tenant. Prod pushes block on the diff and require type-to-confirm. Non-prod pushes show the diff but don't block and don't require typing.

## Why

Today `DangerousConfirmDialog` tries to load a diff via `/api/diff`, but the underlying helper `runDiffSummary` shells out to `fr-config-promote --dry-run --json` — a flag combination that doesn't exist. Every invocation errors, the dialog falls through to "Diff unavailable — proceed with caution", and the type-to-confirm gate becomes "I promise I mean prod" instead of "I see exactly what will change, and I still want to proceed."

## Decisions

| Area | Decision |
|---|---|
| Diff source | Call `/api/compare` internally, `mode: "dry-run"`, `source = repo (local)`, `target = tenant (remote)` |
| Integration shape | Internal fetch from `/api/diff` to `/api/compare` (not a code-extracted shared helper — see rationale) |
| Prod safety | Block Confirm until diff loads + require type-to-confirm |
| Non-prod safety | Show diff in background, never block Confirm, no type-to-confirm |
| Pull flow | Unchanged — no dialog, no diff, runs immediately |

## Architecture

`/api/diff` becomes a thin POST handler that:

1. Validates the target env.
2. Internally calls `/api/compare` with `{ source: { environment: "repo", mode: "local" }, target: { environment: <tenantName>, mode: "remote" }, scopes, mode: "dry-run" }`.
3. Parses the NDJSON stream, extracts the final `{ type: "report", data: "..." }` line, parses the embedded `CompareReport`.
4. Calls `summarizeReport(report)` to collapse `report.files: FileDiff[]` into `DiffSummary[]` — one row per scope with `added`, `modified`, `removed` counts, dropping scopes with zero changes.
5. Returns the array as JSON.

### Why internal fetch instead of code extraction

The alternative is to extract the compare-report-producing logic out of `/api/compare/route.ts` (436 lines of tangled SSE streaming, temp-dir management, and abort handling) into a reusable `runCompareReport` helper. That's a meaningful refactor with real risk of breaking the existing `/api/compare` consumer (the `/compare` page).

For a local-only dev tool, an extra localhost fetch adds ~5ms on top of a compare that already takes 10-30 seconds. Performance is not a constraint. The parsing is ~20 lines. When a third consumer of compare logic appears, that's the right moment to extract. YAGNI until then.

## Component changes

### `DangerousConfirmDialog` — new props

```ts
interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  tenantName: string;
  requireTypeToConfirm: boolean;   // NEW
  blockUntilDiffLoaded: boolean;   // NEW
  diffLoader: () => Promise<DiffSummary[]>;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Confirm button gate logic** (AND of all applicable gates):

- `requireTypeToConfirm=true` → disabled until `typed === tenantName` (case-sensitive exact match)
- `blockUntilDiffLoaded=true` → also disabled while diff is still `null` AND no error has been surfaced

**Type-to-confirm input row:** only rendered when `requireTypeToConfirm=true`. For non-prod, the input is hidden entirely and the dialog is shorter.

**Skip diff link:** when `blockUntilDiffLoaded=false` and diff is still loading after 3 seconds, a small "Skip diff" link appears next to the "Loading diff…" text. Clicking it hides the diff panel entirely so the user can proceed without waiting.

**No visual changes** to header, diff table layout, banner styling, or footer buttons.

### `SyncForm` (`src/app/sync/SyncForm.tsx`)

- Replace `diffLoader` body with a POST to `/api/diff` carrying `{ target, scopes, mode: "dry-run" }`.
- Remove the `isDangerous` check. `handleSubmit` always opens `DangerousConfirmDialog` for push (both prod and non-prod). Pull still runs immediately with no dialog.
- Set `requireTypeToConfirm={isProd}` and `blockUntilDiffLoaded={isProd}` on the dialog.

### `PromoteExecution` (`src/app/promote/PromoteExecution.tsx`)

- Update the existing `DangerousConfirmDialog` usage with the two new props based on `task.target` env color (`red` → prod).
- Update its `diffLoader` to POST `/api/diff` with `{ target: task.target.environment, scopes: task.scopes, mode: "dry-run" }`.

## Files changed

**New:**
- `src/lib/compare.ts` — exports `summarizeReport(report: CompareReport): DiffSummary[]`
- `tests/lib/compare.test.ts` — unit tests for `summarizeReport`

**Modified:**
- `src/app/api/diff/route.ts` — replace GET with POST; internal fetch to `/api/compare`; use `summarizeReport`
- `src/lib/fr-config.ts` — delete `runDiffSummary` (was a placeholder). Keep `DiffSummary` type export (moved to `src/lib/compare.ts` if cleaner).
- `src/components/DangerousConfirmDialog.tsx` — add two props, update gate logic, conditionally render type-to-confirm row, add "Skip diff" link after 3s when non-blocking
- `src/app/sync/SyncForm.tsx` — new diffLoader body, always-open dialog for push, new dialog props
- `src/app/promote/PromoteExecution.tsx` — new diffLoader body, new dialog props
- `tests/api/diff.test.ts` — rewrite against internal-fetch mock + POST contract
- `tests/components/DangerousConfirmDialog.test.tsx` — add tests for new prop combinations

## Testing

**Unit:**
- `summarizeReport` groups `FileDiff[]` by scope, counts added/modified/removed, drops zero-change scopes.
- `/api/diff` POST handler: 400 on missing target, 400 on unknown target, 200 with summary on happy path (mock the internal fetch), 500 on compare failure.
- `DangerousConfirmDialog`: (a) `requireTypeToConfirm=false, blockUntilDiffLoaded=false` → Confirm enables as soon as diff loads; (b) `blockUntilDiffLoaded=true` → Confirm stays disabled while diff is null, enables once diff arrives; (c) existing exact-match test still passes; (d) existing "Diff unavailable" banner test still passes.

**Manual:**
- `/sync` push to non-prod: dialog opens, diff starts loading in background, Confirm is immediately clickable (no type required), diff populates asynchronously.
- `/sync` push to prod: dialog opens, "Loading diff…" shown, Confirm disabled, diff populates after ~10s, type-to-confirm input appears and is the only remaining gate.
- `/sync` push to prod when compare fails: "Diff unavailable" banner shown, Confirm still requires type-to-confirm but is no longer gated on diff (because the diff state transitioned to error, not null).
- `/promote` execute for prod target: same behavior as `/sync` push-to-prod.

## Out of scope

- Expanding the dialog to show file-level diffs inline (still summary-only per scope).
- Caching diffs across cancel/reopen cycles.
- A standalone "Preview changes" button on `/sync` outside the confirm dialog.
- Adding the new dialog friction to the Compare page.
- Extracting `runCompareReport` into a shared helper (deferred until a third consumer exists).
- Adding abort handling to the internal fetch (the compare's own abort path covers catastrophic cases; if the user cancels the dialog mid-diff, the fetch is abandoned but the server compare completes on its own).

## Risks

1. **Compare latency on prod** — a real dry-run against a large tenant can take 20-30 seconds. Prod users will wait. Mitigation: clear "Loading diff…" state; Cancel always works.
2. **Internal fetch is localhost** — if the Next.js dev server is bound to a non-default port or hostname, the internal `fetch("/api/compare", ...)` call needs to resolve correctly. Next.js route handlers can use relative URLs via `new URL(req.url).origin` to build an absolute URL. Spec commits to that pattern.
3. **CompareReport shape drift** — if `/api/compare` changes the NDJSON envelope for the report event, `/api/diff` breaks silently. Mitigation: the test suite pins the envelope shape.
