# Real Diff Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/api/diff` with a real diff source backed by `/api/compare`, so the push-confirmation dialog shows actual per-scope change counts before the user commits.

**Architecture:** `/api/diff` becomes a thin POST handler that internally fetches `/api/compare` with `mode: "dry-run"`, parses the streamed `CompareReport`, and collapses it via a new `summarizeReport` helper in `src/lib/compare.ts`. `DangerousConfirmDialog` gains two props (`requireTypeToConfirm`, `blockUntilDiffLoaded`) so the caller controls friction per env. `SyncForm` opens the dialog for every push (prod and non-prod) with the appropriate friction level.

**Tech Stack:** Next.js 16.2.2 app-router route handlers, React 19, TypeScript, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-13-real-diff-preview-design.md`

---

## File Structure

**New:**
- `src/lib/compare.ts` — exports `DiffSummary` type and `summarizeReport(report: CompareReport): DiffSummary[]`
- `tests/lib/compare.test.ts` — unit tests for `summarizeReport`

**Modified:**
- `src/app/api/diff/route.ts` — replace existing GET with POST; internal fetch to `/api/compare`; use `summarizeReport`
- `src/lib/fr-config.ts` — delete `runDiffSummary` and `DiffSummary` (the type moves to `src/lib/compare.ts`); keep one re-export line so existing importers don't break
- `src/components/DangerousConfirmDialog.tsx` — add `requireTypeToConfirm` and `blockUntilDiffLoaded` props; update gate logic; conditionally render type-to-confirm row; add "Skip diff" link after 3s when `blockUntilDiffLoaded=false`
- `src/app/sync/SyncForm.tsx` — always open dialog for push; new diffLoader body (POST); new dialog props
- `src/app/promote/PromoteExecution.tsx` — same dialog prop updates; new diffLoader body
- `tests/api/diff.test.ts` — rewrite against internal-fetch mock + POST contract
- `tests/components/DangerousConfirmDialog.test.tsx` — add tests for new prop combinations

---

## Task 1: Create `src/lib/compare.ts` with `DiffSummary` and `summarizeReport`

**Files:**
- Create: `src/lib/compare.ts`
- Create: `tests/lib/compare.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/compare.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { summarizeReport } from "@/lib/compare";
import type { CompareReport, FileDiff } from "@/lib/diff-types";

function mkReport(files: FileDiff[]): CompareReport {
  return {
    source: { environment: "repo", mode: "local" },
    target: { environment: "dev", mode: "remote" },
    generatedAt: new Date().toISOString(),
    summary: { added: 0, removed: 0, modified: 0, unchanged: 0 },
    files,
  };
}

function mkFile(scope: string, status: FileDiff["status"], name = `${scope}/x`): FileDiff {
  return {
    scope: scope as FileDiff["scope"],
    status,
    path: name,
  } as FileDiff;
}

describe("summarizeReport", () => {
  it("returns empty array when no files changed", () => {
    const report = mkReport([mkFile("journeys", "unchanged"), mkFile("scripts", "unchanged")]);
    expect(summarizeReport(report)).toEqual([]);
  });

  it("groups files by scope and counts added/modified/removed", () => {
    const report = mkReport([
      mkFile("journeys", "added", "journeys/a"),
      mkFile("journeys", "added", "journeys/b"),
      mkFile("journeys", "modified", "journeys/c"),
      mkFile("scripts", "modified", "scripts/s1"),
      mkFile("scripts", "removed", "scripts/s2"),
    ]);
    const result = summarizeReport(report);
    expect(result).toEqual([
      { scope: "journeys", added: 2, modified: 1, removed: 0 },
      { scope: "scripts",  added: 0, modified: 1, removed: 1 },
    ]);
  });

  it("drops scopes that only have unchanged files", () => {
    const report = mkReport([
      mkFile("journeys", "unchanged"),
      mkFile("scripts", "modified"),
    ]);
    const result = summarizeReport(report);
    expect(result).toEqual([
      { scope: "scripts", added: 0, modified: 1, removed: 0 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npx vitest run tests/lib/compare.test.ts`
Expected: FAIL — module `@/lib/compare` not found.

- [ ] **Step 3: Create `src/lib/compare.ts`**

```ts
import type { CompareReport } from "@/lib/diff-types";

export interface DiffSummary {
  scope: string;
  added: number;
  modified: number;
  removed: number;
}

/**
 * Collapses a CompareReport's file-level diffs into a per-scope summary.
 * Scopes with only unchanged files are dropped.
 */
export function summarizeReport(report: CompareReport): DiffSummary[] {
  const byScope = new Map<string, { added: number; modified: number; removed: number }>();
  for (const file of report.files) {
    const entry = byScope.get(file.scope) ?? { added: 0, modified: 0, removed: 0 };
    if (file.status === "added") entry.added++;
    else if (file.status === "modified") entry.modified++;
    else if (file.status === "removed") entry.removed++;
    else continue; // unchanged — don't touch the map
    byScope.set(file.scope, entry);
  }
  return Array.from(byScope.entries()).map(([scope, c]) => ({ scope, ...c }));
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npx vitest run tests/lib/compare.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/compare.ts tests/lib/compare.test.ts
git commit -m "lib: add summarizeReport helper for diff previews"
```

---

## Task 2: Migrate `DiffSummary` exports and delete `runDiffSummary`

**Files:**
- Modify: `src/lib/fr-config.ts`

Context: `src/lib/fr-config.ts:246-292` contains the placeholder `runDiffSummary` function and the `DiffSummary` interface. The interface is now owned by `src/lib/compare.ts`. `DangerousConfirmDialog` and the old `/api/diff` route import `DiffSummary` from `@/lib/fr-config`; those imports need to keep working without a circular dependency.

- [ ] **Step 1: Read the current definitions**

Run: `sed -n '240,295p' src/lib/fr-config.ts`

Expected: you should see `// ── runDiffSummary ──`, the `DiffSummary` interface, and the `runDiffSummary` function.

- [ ] **Step 2: Replace that section with a re-export**

Open `src/lib/fr-config.ts` and replace lines 246–292 (the entire `// ── runDiffSummary ──` block including the interface and the function) with a single re-export line:

```ts
// ── DiffSummary (moved to src/lib/compare.ts) ─────────────────────────────────
export type { DiffSummary } from "@/lib/compare";
```

Do not touch any other code in `fr-config.ts`.

- [ ] **Step 3: Find any remaining runDiffSummary references**

Run: `git grep -n runDiffSummary`
Expected: only matches inside `docs/` and possibly `src/app/api/diff/route.ts` (which will be rewritten in Task 3). If any production code besides `route.ts` still imports `runDiffSummary`, stop and report — this task's assumption was wrong.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only inside `src/app/api/diff/route.ts` (it still references the deleted function). Those are fixed in Task 3. No other errors should appear.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fr-config.ts
git commit -m "lib: move DiffSummary to src/lib/compare and drop runDiffSummary placeholder"
```

---

## Task 3: Rewrite `/api/diff` to POST and internally call `/api/compare`

**Files:**
- Modify: `src/app/api/diff/route.ts`
- Modify: `tests/api/diff.test.ts`

Context: The current route is a GET handler that calls `runDiffSummary`. It must become a POST handler that accepts `{ target: string; scopes: ConfigScope[]; mode?: "dry-run" | "compare" }`, internally fetches `/api/compare`, parses the NDJSON stream, extracts the final `{ type: "report", data: "..." }` line (confirmed to exist at `src/app/api/compare/route.ts:375`), JSON-parses the embedded `CompareReport`, and returns `summarizeReport(report)` as JSON.

- [ ] **Step 1: Rewrite `tests/api/diff.test.ts`**

Replace the entire file contents:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/fr-config", () => ({
  getEnvironments: () => ([
    { name: "dev", label: "dev", color: "blue", envFile: "dev.env" },
    { name: "prod", label: "prod", color: "red", envFile: "prod.env" },
  ]),
}));

import { POST } from "@/app/api/diff/route";
import type { CompareReport } from "@/lib/diff-types";

const REPORT: CompareReport = {
  source: { environment: "repo", mode: "local" },
  target: { environment: "dev", mode: "remote" },
  generatedAt: "2026-04-13T00:00:00Z",
  summary: { added: 0, removed: 0, modified: 0, unchanged: 0 },
  files: [
    { scope: "journeys", path: "journeys/Login", status: "added" } as any,
    { scope: "journeys", path: "journeys/MFA",   status: "modified" } as any,
    { scope: "scripts",  path: "scripts/foo.js", status: "removed" } as any,
  ],
};

function ndjsonBody(lines: object[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const l of lines) controller.enqueue(encoder.encode(JSON.stringify(l) + "\n"));
      controller.close();
    },
  });
}

beforeEach(() => {
  (globalThis as any).fetch = vi.fn();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function post(body: object): Request {
  return new Request("http://localhost/api/diff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/diff", () => {
  it("returns 400 when target is missing", async () => {
    const res = await POST(post({ scopes: ["journeys"] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when target env is unknown", async () => {
    const res = await POST(post({ target: "does-not-exist", scopes: ["journeys"] }));
    expect(res.status).toBe(400);
  });

  it("returns DiffSummary[] on success", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(
        ndjsonBody([
          { type: "stdout", data: "pulling…", ts: 0 },
          { type: "report", data: JSON.stringify(REPORT), ts: 1 },
          { type: "exit", code: 0, ts: 2 },
        ]),
        { status: 200 }
      )
    );
    const res = await POST(post({ target: "dev", scopes: ["journeys", "scripts"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { scope: "journeys", added: 1, modified: 1, removed: 0 },
      { scope: "scripts",  added: 0, modified: 0, removed: 1 },
    ]);
  });

  it("returns 500 when compare fetch fails", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response("boom", { status: 500 })
    );
    const res = await POST(post({ target: "dev", scopes: ["journeys"] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/compare/i);
  });

  it("returns 500 when stream never emits a report line", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(
      new Response(
        ndjsonBody([
          { type: "stdout", data: "pulling…", ts: 0 },
          { type: "exit", code: 0, ts: 1 },
        ]),
        { status: 200 }
      )
    );
    const res = await POST(post({ target: "dev", scopes: ["journeys"] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/report/i);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npx vitest run tests/api/diff.test.ts`
Expected: FAIL — either "POST is not a function" or import errors because the existing route file only exports GET.

- [ ] **Step 3: Rewrite `src/app/api/diff/route.ts`**

Replace the entire file contents:

```ts
import { NextResponse } from "next/server";
import { getEnvironments } from "@/lib/fr-config";
import { summarizeReport } from "@/lib/compare";
import type { CompareReport } from "@/lib/diff-types";
import type { ConfigScope } from "@/lib/fr-config-types";

interface DiffRequest {
  target: string;
  scopes?: ConfigScope[];
  mode?: "dry-run" | "compare";
}

export async function POST(req: Request) {
  let body: DiffRequest;
  try {
    body = (await req.json()) as DiffRequest;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { target, scopes = [], mode = "dry-run" } = body;

  if (!target) {
    return NextResponse.json({ error: "missing target" }, { status: 400 });
  }

  const envs = getEnvironments();
  if (!envs.some((e) => e.name === target)) {
    return NextResponse.json({ error: `unknown target env: ${target}` }, { status: 400 });
  }

  // Build an absolute URL for the internal compare call. Next.js runtime expects
  // absolute URLs when fetching its own routes from a server handler.
  const origin = new URL(req.url).origin;
  const compareUrl = `${origin}/api/compare`;

  let compareRes: Response;
  try {
    compareRes = await fetch(compareUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { environment: "repo", mode: "local" },
        target: { environment: target, mode: "remote" },
        scopes,
        mode,
      }),
    });
  } catch (e) {
    return NextResponse.json({ error: `compare fetch failed: ${(e as Error).message}` }, { status: 500 });
  }

  if (!compareRes.ok || !compareRes.body) {
    return NextResponse.json({ error: `compare returned ${compareRes.status}` }, { status: 500 });
  }

  // Drain the NDJSON stream and extract the final { type: "report", data: "..." } line.
  let reportJson: string | null = null;
  try {
    const reader = compareRes.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line) as { type: string; data?: string };
          if (entry.type === "report" && typeof entry.data === "string") {
            reportJson = entry.data;
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
    // handle trailing buffer
    if (buffer.trim()) {
      try {
        const entry = JSON.parse(buffer) as { type: string; data?: string };
        if (entry.type === "report" && typeof entry.data === "string") {
          reportJson = entry.data;
        }
      } catch {
        // ignore
      }
    }
  } catch (e) {
    return NextResponse.json({ error: `compare stream error: ${(e as Error).message}` }, { status: 500 });
  }

  if (!reportJson) {
    return NextResponse.json({ error: "compare did not emit a report" }, { status: 500 });
  }

  let report: CompareReport;
  try {
    report = JSON.parse(reportJson) as CompareReport;
  } catch (e) {
    return NextResponse.json({ error: `report parse error: ${(e as Error).message}` }, { status: 500 });
  }

  return NextResponse.json(summarizeReport(report));
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npx vitest run tests/api/diff.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: Exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/diff/route.ts tests/api/diff.test.ts
git commit -m "API: /api/diff now POSTs via internal compare stream"
```

---

## Task 4: Extend `DangerousConfirmDialog` with new props

**Files:**
- Modify: `src/components/DangerousConfirmDialog.tsx`
- Modify: `tests/components/DangerousConfirmDialog.test.tsx`

Context: The dialog currently has the shape `{ open, title, subtitle, tenantName, diffLoader, onConfirm, onCancel }`. It always requires type-to-confirm. We need two new props that let the caller decide per env whether to gate confirm on type-to-confirm and whether to gate on diff-loaded state.

- [ ] **Step 1: Read the existing dialog**

Run: `cat src/components/DangerousConfirmDialog.tsx`

Note the current state management: `typed`, `diff`, `error`, and the `matches` gate. You'll keep all of this and add two new gates.

- [ ] **Step 2: Add new tests first**

Open `tests/components/DangerousConfirmDialog.test.tsx` and add these tests at the end of the `describe` block (keep existing tests untouched):

```ts
  it("enables Confirm immediately when type-to-confirm is disabled and diff loads", async () => {
    const onConfirm = vi.fn();
    render(
      <DangerousConfirmDialog
        open
        title="Push to dev"
        subtitle=""
        tenantName="dev"
        requireTypeToConfirm={false}
        blockUntilDiffLoaded={false}
        diffLoader={async () => diff}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    await waitFor(() => expect(screen.getByText(/journeys/)).toBeInTheDocument());
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeEnabled();
    // Should be no type-to-confirm input visible
    expect(screen.queryByPlaceholderText(/type/i)).not.toBeInTheDocument();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("blocks Confirm while diff is null when blockUntilDiffLoaded is true", async () => {
    let resolveDiff!: (v: typeof diff) => void;
    const slow = new Promise<typeof diff>((resolve) => { resolveDiff = resolve; });

    render(
      <DangerousConfirmDialog
        open
        title="Push to prod"
        subtitle=""
        tenantName="prod"
        requireTypeToConfirm={true}
        blockUntilDiffLoaded={true}
        diffLoader={async () => slow}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    // While loading, confirm must be disabled, and no type input is rendered yet
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeDisabled();

    // Resolve diff and wait for re-render
    resolveDiff(diff);
    await waitFor(() => expect(screen.getByText(/journeys/)).toBeInTheDocument());

    // Type-to-confirm now becomes the only remaining gate
    const input = screen.getByPlaceholderText(/type/i);
    expect(confirm).toBeDisabled();
    fireEvent.change(input, { target: { value: "prod" } });
    expect(confirm).toBeEnabled();
  });
```

Also update the two existing tests to pass the new required props. Change the existing test that's called "disables Confirm until exact tenant name is typed" to pass:

```tsx
requireTypeToConfirm={true}
blockUntilDiffLoaded={false}
```

And the "shows banner when diff loader fails" test to pass:

```tsx
requireTypeToConfirm={true}
blockUntilDiffLoaded={true}
```

(The existing tests' intent is preserved — they just become explicit about the new props.)

- [ ] **Step 3: Run the tests — expect failure**

Run: `npx vitest run tests/components/DangerousConfirmDialog.test.tsx`
Expected: FAIL — the component doesn't accept `requireTypeToConfirm` / `blockUntilDiffLoaded` yet, and the new tests' assertions don't match current behavior.

- [ ] **Step 4: Update the `Props` interface and component signature**

In `src/components/DangerousConfirmDialog.tsx`, find the `interface Props` block and replace with:

```ts
interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  tenantName: string;
  requireTypeToConfirm: boolean;
  blockUntilDiffLoaded: boolean;
  diffLoader: () => Promise<DiffSummary[]>;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Destructure the new props at the top of the component:

```tsx
const {
  open,
  title,
  subtitle,
  tenantName,
  requireTypeToConfirm,
  blockUntilDiffLoaded,
  diffLoader,
  onConfirm,
  onCancel,
} = props;
```

- [ ] **Step 5: Update the gate logic**

Replace the current `matches` calculation with a `canConfirm` expression that combines all applicable gates. Find the line `const matches = typed === tenantName;` and replace with:

```ts
const typeMatches = typed === tenantName;
const diffReady = diff !== null || error !== null;
const typeGateOk = requireTypeToConfirm ? typeMatches : true;
const diffGateOk = blockUntilDiffLoaded ? diffReady : true;
const canConfirm = typeGateOk && diffGateOk;
```

- [ ] **Step 6: Update the Confirm button**

Find the Confirm button at the bottom of the dialog and change its `disabled` and `className`:

```tsx
<button
  onClick={onConfirm}
  disabled={!canConfirm}
  className={cn("btn-danger-solid", !canConfirm && "opacity-50 cursor-not-allowed")}
>
  Confirm
</button>
```

- [ ] **Step 7: Conditionally render the type-to-confirm row**

Find the `<label>` block that reads "Type `<tenantName>` to confirm" and the `<input>` beneath it. Wrap both in a conditional:

```tsx
{requireTypeToConfirm && (
  <>
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
  </>
)}
```

- [ ] **Step 8: Add "Skip diff" link for non-blocking mode after 3s**

Find the `{!error && !diff && (...)` "Loading diff…" block. Replace it with a version that tracks elapsed time and shows a skip link when `blockUntilDiffLoaded=false`:

First add state near the other `useState` calls:

```tsx
const [skipDiff, setSkipDiff] = useState(false);
const [showSkipLink, setShowSkipLink] = useState(false);
```

Then inside the existing `useEffect` that resets state when `open` changes, also reset the skip state:

```tsx
if (!open) {
  setTyped("");
  setDiff(null);
  setError(null);
  setSkipDiff(false);
  setShowSkipLink(false);
  return;
}
```

Add a new `useEffect` to arm the 3s skip timer when appropriate:

```tsx
useEffect(() => {
  if (!open || blockUntilDiffLoaded || diff || error) return;
  const timer = window.setTimeout(() => setShowSkipLink(true), 3000);
  return () => window.clearTimeout(timer);
}, [open, blockUntilDiffLoaded, diff, error]);
```

Replace the "Loading diff…" block with:

```tsx
{!error && !diff && !skipDiff && (
  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[12px] px-3 py-3 flex items-center justify-between">
    <span>Loading diff…</span>
    {showSkipLink && !blockUntilDiffLoaded && (
      <button
        type="button"
        onClick={() => setSkipDiff(true)}
        className="text-indigo-600 hover:text-indigo-700 text-[12px]"
      >
        Skip diff
      </button>
    )}
  </div>
)}
```

- [ ] **Step 9: Run the tests — expect pass**

Run: `npx vitest run tests/components/DangerousConfirmDialog.test.tsx`
Expected: All 4 tests pass (2 existing + 2 new).

- [ ] **Step 10: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `src/app/sync/SyncForm.tsx` and `src/app/promote/PromoteExecution.tsx` — those are the two callers that haven't been updated yet. They'll be fixed in Tasks 5 and 6.

- [ ] **Step 11: Commit**

```bash
git add src/components/DangerousConfirmDialog.tsx tests/components/DangerousConfirmDialog.test.tsx
git commit -m "UI: DangerousConfirmDialog — requireTypeToConfirm and blockUntilDiffLoaded props"
```

---

## Task 5: Wire `SyncForm` to always open the dialog for push, with new props

**Files:**
- Modify: `src/app/sync/SyncForm.tsx`

- [ ] **Step 1: Update the `diffLoader` body**

Find the `diffLoader` `useMemo` block and replace its body with a POST-based call:

```tsx
const diffLoader = useMemo(
  (): (() => Promise<DiffSummary[]>) =>
    async () => {
      const res = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: tenant, scopes, mode: "dry-run" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "diff failed");
      }
      return res.json() as Promise<DiffSummary[]>;
    },
  [tenant, scopes]
);
```

- [ ] **Step 2: Remove the `isDangerous` gate**

Find:

```tsx
const isDangerous = direction === "push" && isProd;
```

Remove that line entirely. Then find the `handleSubmit` function and replace with:

```tsx
function handleSubmit() {
  if (direction === "push") {
    setConfirmOpen(true);
    return;
  }
  startRun();
}
```

- [ ] **Step 3: Update the dialog invocation**

Find the existing `<DangerousConfirmDialog>` render block and replace with:

```tsx
{tenantEnv && (
  <DangerousConfirmDialog
    open={confirmOpen}
    title={`Push to ${tenantEnv.label}`}
    subtitle={
      isProd
        ? "This writes repo config to a live production tenant. Review the preview below."
        : "Review the changes below before pushing."
    }
    tenantName={tenantEnv.name}
    requireTypeToConfirm={isProd}
    blockUntilDiffLoaded={isProd}
    diffLoader={diffLoader}
    onConfirm={() => {
      setConfirmOpen(false);
      startRun();
    }}
    onCancel={() => setConfirmOpen(false)}
  />
)}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `src/app/promote/PromoteExecution.tsx` (not yet updated).

- [ ] **Step 5: Run full vitest**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/sync/SyncForm.tsx
git commit -m "UI: /sync — always open confirm dialog for push, env-based friction"
```

---

## Task 6: Wire `PromoteExecution` to the new dialog props

**Files:**
- Modify: `src/app/promote/PromoteExecution.tsx`

Context: The promote execution section already renders `DangerousConfirmDialog` at one or more places. Each usage needs the two new props based on whether the task's target env is prod (`color === "red"`).

- [ ] **Step 1: Locate all dialog usages**

Run: `grep -n "DangerousConfirmDialog" src/app/promote/PromoteExecution.tsx`

Expected: at least one render site where the dialog is opened with props including `tenantName` and `diffLoader`.

- [ ] **Step 2: For each render site, add the two new props**

At every `<DangerousConfirmDialog ... />` render site in the file, find the target env — it should be reachable from the section's `task` (e.g. `task.target.environment` / `task.target.color` or an equivalent). Derive:

```tsx
const isProdTarget = task.target?.color === "red";
```

Place that line inside the component body above the return, near the existing `useBusyState` hook call.

Then on every dialog render, add these two props:

```tsx
requireTypeToConfirm={isProdTarget}
blockUntilDiffLoaded={isProdTarget}
```

- [ ] **Step 3: Update each `diffLoader` to POST `/api/diff`**

For every `diffLoader` prop passed to the dialog, replace its body with:

```tsx
diffLoader={async () => {
  const res = await fetch("/api/diff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: task.target.environment,
      scopes: task.scopes,
      mode: "dry-run",
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "diff failed");
  }
  return res.json();
}}
```

If the local variable `task.scopes` doesn't match the existing code (e.g. the property is named `task.scopeNames` or `task.scopeList`), use whichever identifier is already in the same function's scope. Do not invent new fields.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: Exit 0, no errors.

- [ ] **Step 5: Run full vitest**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/promote/PromoteExecution.tsx
git commit -m "UI: Promote — env-based friction on confirm dialog, POST /api/diff"
```

---

## Task 7: Full smoke test

**Files:** None.

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: Exit 0.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass. There should be new tests from Tasks 1, 3, and 4 bringing the count above the pre-plan baseline.

- [ ] **Step 3: Production build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors. Routes list still includes `/api/diff` and `/api/compare`.

- [ ] **Step 4: Manual walkthrough**

Open `npm run dev` and verify:

1. `/sync` with a non-prod tenant + push direction → dialog opens, "Loading diff…" shown. Confirm button is immediately clickable. No type input visible. After 3s (if diff still loading), "Skip diff" link appears.
2. `/sync` with a prod tenant (color=red) + push direction → dialog opens, "Loading diff…" shown. Confirm is disabled. After diff loads, type input appears. Confirm remains disabled until the exact tenant name is typed.
3. `/sync` pull direction → no dialog, runs immediately.
4. `/promote` execute step with a prod target → same behavior as `/sync` push to prod.
5. `/promote` execute step with a non-prod target → same behavior as `/sync` push to non-prod.
6. Kill network mid-diff or point to an unreachable tenant → "Diff unavailable — proceed with caution" banner appears. For non-prod: Confirm is immediately enabled. For prod: Confirm requires type-to-confirm (diff gate released by the error state).

- [ ] **Step 5: Commit any smoke-test polish**

If the walkthrough surfaces issues (typos, a missing className, a broken gate), fix and commit:

```bash
git add -A
git commit -m "UI: real diff preview — polish after smoke test"
```

---

## Rollback

All changes are additive or restyle-only. To revert:

```bash
git log --oneline | grep -E "API: /api/diff|UI: DangerousConfirmDialog|UI: /sync|UI: Promote|lib: add summarizeReport|lib: move DiffSummary"
git revert <commit-range>
```

The existing `/api/compare` endpoint is untouched.
