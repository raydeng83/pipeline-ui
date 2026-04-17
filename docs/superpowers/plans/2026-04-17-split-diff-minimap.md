# Side-by-Side Script Diff Minimap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-edge minimap to the side-by-side script diff view (preview modal Files tab and any in-panel side-by-side caller) by making `SplitDiffView` self-contained — it owns its scroll container and renders the minimap internally, the way `SideBySideViewer` in `DiffReport.tsx` already does.

**Architecture:** Refactor `SplitDiffView` in `src/app/compare/JourneyDiffGraph.tsx` to wrap its `<table>` in a scrollable `<div ref>` and render a sibling `<DiffMinimap>`. Add a `fullscreen?: boolean` prop so the component fills its flex parent when fullscreen and caps at `max-h-[500px]` when inline. Update the single fullscreen call site to drop its now-redundant outer wrapper.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS. Existing shared `DiffMinimap` component (`src/app/compare/DiffMinimap.tsx`). Vitest + Testing Library are available but this refactor is structural/visual and has no new pure logic to unit-test — verification is manual in the running dev server (existing convention: neither `SplitDiffView`, `InlineDiffView`, `ScriptDiffView`, nor `SideBySideViewer` have tests today).

**Spec:** `docs/superpowers/specs/2026-04-17-split-diff-minimap-design.md`

---

## File Structure

**Modified:**
- `src/app/compare/JourneyDiffGraph.tsx`
  - `SplitDiffView` (currently ~line 794-856): gains a `fullscreen?: boolean` prop, an internal `scrollRef`, an outer flex wrapper with conditional height, and a sibling `<DiffMinimap>`.
  - Fullscreen Files tab call site (currently line 672-679 inside `ScriptFileEntry`): simplified to `<SplitDiffView lines={diffLines} fullscreen />`.
  - Preview-modal Files tab call site (line 2823): unchanged — now gets a minimap automatically.

**Not modified:** `src/app/compare/DiffMinimap.tsx`, `src/app/compare/DiffReport.tsx`, any other file.

---

## Task 1: Refactor `SplitDiffView` to be self-contained

**Files:**
- Modify: `src/app/compare/JourneyDiffGraph.tsx:794-856`

**Why this step:** Today `SplitDiffView` is a plain `<table>` with no scroll container. Callers must wrap it to get a scroll + minimap. Making it self-contained means every caller gets the minimap for free.

- [ ] **Step 1: Open the file and locate `SplitDiffView`**

Run: `grep -n "^function SplitDiffView" src/app/compare/JourneyDiffGraph.tsx`
Expected: one line showing the function declaration (currently around line 794).

- [ ] **Step 2: Replace the `SplitDiffView` function**

Replace the entire existing function (the function header through its closing `}`, currently lines 794-856 but verify with grep) with:

```tsx
function SplitDiffView({ lines, fullscreen }: { lines: DiffLineLocal[]; fullscreen?: boolean }) {
  type SplitRow = { left: string | null; leftRem: boolean; right: string | null; rightAdd: boolean };
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo((): SplitRow[] => {
    const result: SplitRow[] = [];
    let i = 0;
    while (i < lines.length) {
      if (lines[i].type === "context") {
        result.push({ left: lines[i].content, leftRem: false, right: lines[i].content, rightAdd: false });
        i++;
      } else {
        const removed: string[] = [];
        const added: string[] = [];
        while (i < lines.length && lines[i].type !== "context") {
          if (lines[i].type === "removed") removed.push(lines[i].content);
          else added.push(lines[i].content);
          i++;
        }
        const len = Math.max(removed.length, added.length);
        for (let j = 0; j < len; j++) {
          result.push({
            left: removed[j] ?? null,
            leftRem: removed[j] !== undefined,
            right: added[j] ?? null,
            rightAdd: added[j] !== undefined,
          });
        }
      }
    }
    return result;
  }, [lines]);

  return (
    <div className={cn(
      "flex bg-slate-950 overflow-hidden",
      fullscreen ? "flex-1 min-h-0" : "max-h-[500px]",
    )}>
      <div ref={scrollRef} className="flex-1 overflow-auto text-[10px] font-mono leading-5">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900 text-[9px] text-slate-500 sticky top-0 z-10">
              <th className="px-3 py-1 text-left font-normal border-r border-slate-700 w-1/2">Source</th>
              <th className="px-3 py-1 text-left font-normal w-1/2">Modified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className={cn(
                  "px-3 py-0 whitespace-pre-wrap break-all align-top border-r border-slate-800 w-1/2",
                  row.leftRem ? "bg-red-950 text-red-300" : "text-slate-400",
                )}>
                  {row.left ?? ""}
                </td>
                <td className={cn(
                  "px-3 py-0 whitespace-pre-wrap break-all align-top w-1/2",
                  row.rightAdd ? "bg-emerald-950 text-emerald-300" : "text-slate-400",
                )}>
                  {row.right ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DiffMinimap lines={lines} scrollRef={scrollRef} />
    </div>
  );
}
```

What changed relative to the old version:
- Added `fullscreen?: boolean` prop.
- Added `const scrollRef = useRef<HTMLDivElement>(null);`.
- Wrapped the table in an outer `<div>` with conditional classes (`flex-1 min-h-0` fullscreen / `max-h-[500px]` inline) and the shared background/overflow.
- Wrapped the `<table>` in a scrollable inner `<div ref={scrollRef}>` that carries the font/size classes that were previously on the table's parent.
- Added `<DiffMinimap lines={lines} scrollRef={scrollRef} />` as the last sibling.
- Alignment-row logic (`rows = useMemo(...)`) is unchanged.

`useRef`, `useMemo`, `cn`, and `DiffMinimap` are all already imported at the top of the file (line 3 and line 27) — no new imports needed.

- [ ] **Step 3: Typecheck the file via the Next build's lint step**

Run: `npm run lint -- src/app/compare/JourneyDiffGraph.tsx`
Expected: no new errors. (Pre-existing lint warnings in the file are fine as long as they match what was there before the change.)

If eslint reports new errors, fix them before continuing. Common ones to watch for:
- Unused variable warnings from a miscopy.
- JSX attribute typos.

- [ ] **Step 4: Commit**

```bash
git add src/app/compare/JourneyDiffGraph.tsx
git commit -m "Refactor: self-contained SplitDiffView with internal scroll + minimap"
```

---

## Task 2: Simplify the fullscreen Files-tab call site

**Files:**
- Modify: `src/app/compare/JourneyDiffGraph.tsx` — the `ScriptFileEntry` fullscreen branch (currently around line 672-679).

**Why this step:** The fullscreen Files tab used to provide its own scroll wrapper + minimap around `SplitDiffView`. Now that `SplitDiffView` owns those, the outer wrapper is redundant. Removing it also avoids a nested scroll container.

- [ ] **Step 1: Locate the call site**

Run: `grep -n "<SplitDiffView" src/app/compare/JourneyDiffGraph.tsx`
Expected: two hits — one in the fullscreen Files tab (around line 676) and one in the preview modal (around line 2823).

- [ ] **Step 2: Replace the fullscreen Files-tab branch**

In the fullscreen branch of `ScriptFileEntry`, replace this block:

```tsx
hasBothSides && fsTab === "files" ? (
  <>
    <div ref={fsScrollRef} className="flex-1 overflow-auto">
      <SplitDiffView lines={diffLines} />
    </div>
    <DiffMinimap lines={diffLines} scrollRef={fsScrollRef} />
  </>
) : (
```

With:

```tsx
hasBothSides && fsTab === "files" ? (
  <SplitDiffView lines={diffLines} fullscreen />
) : (
```

Do **not** remove the `const fsScrollRef = useRef<HTMLDivElement>(null);` declaration at the top of `ScriptFileEntry` (line 568) — the unified fullscreen branch (the `else` branch around line 681-700) still uses it.

Do **not** remove the `import { DiffMinimap } from "./DiffMinimap"` — `ScriptDiffView` (line 1733) and the fullscreen unified branch (line 699) still use it.

Do **not** touch the preview modal call site (line 2823) — it stays as `<SplitDiffView lines={diffLines} />` and picks up the minimap automatically.

- [ ] **Step 3: Lint the file again**

Run: `npm run lint -- src/app/compare/JourneyDiffGraph.tsx`
Expected: no new errors. Pay attention to `fsScrollRef` / `DiffMinimap` — if lint now flags either as unused, double-check that the other branches still reference them (they should).

- [ ] **Step 4: Commit**

```bash
git add src/app/compare/JourneyDiffGraph.tsx
git commit -m "Refactor: drop redundant wrapper around fullscreen SplitDiffView"
```

---

## Task 3: Run the existing test suite and a full lint pass

**Why this step:** Sanity-check that nothing else in the codebase depends on the old structure of `SplitDiffView`.

- [ ] **Step 1: Run vitest**

Run: `npm test`
Expected: all existing tests pass. No tests target `SplitDiffView` directly, so this is a regression check for shared modules.

- [ ] **Step 2: Run eslint over the full project**

Run: `npm run lint`
Expected: same number of pre-existing warnings/errors as before the change; no new diagnostics.

If anything new surfaces, fix it before moving on.

- [ ] **Step 3: No commit needed** — this task runs checks only.

---

## Task 4: Manual verification in the dev server

**Why this step:** The spec's verification section is the authoritative check — this is a visual/structural change without new pure logic, so seeing the UI in a browser is how we confirm it works. Each check below maps to one bullet in the spec's Verification section.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Next starts and prints a local URL (usually `http://localhost:3000`). Leave it running in a separate terminal.

- [ ] **Step 2: Check 1 — Preview modal Files tab, long script**

Navigate to a compare result that has a journey with a changed script (config **and** content both differing, or either one differing). From the journey graph, click a `ScriptedDecisionNode` to open the script preview modal. Click the **Files** tab.

Expected:
- A minimap appears on the right of each file's side-by-side diff.
- The viewport indicator reflects the current scroll position within that file's table.
- Click-and-drag on the minimap seeks to that position in the file's internal scroll.
- If the file is long enough to overflow `max-h-[500px]`, internal scrolling works and the minimap indicator moves.

- [ ] **Step 3: Check 2 — Preview modal Diff tab (unified)**

With the same preview modal open, switch to the **Diff** tab.

Expected: Unified diff with minimap on the right (unchanged behavior). No regression.

- [ ] **Step 4: Check 3 — Fullscreen script file, Files tab**

From a journey diff, open any `ScriptFileEntry` card and click the fullscreen icon. Once in fullscreen, click the **Files** tab (visible when the file has both source and target content).

Expected:
- Side-by-side diff fills the fullscreen area.
- Minimap is on the right, draggable, viewport indicator tracks scroll.
- Scroll sync: scrolling the diff body moves the viewport indicator; dragging the indicator moves the diff body. No double-scroll bars, no nested scroll confusion.

- [ ] **Step 5: Check 4 — Fullscreen script file, Diff tab (unified)**

In the same fullscreen view, switch to the **Diff** tab.

Expected: Unified diff with minimap on the right (unchanged code path using `fsScrollRef`). No regression.

- [ ] **Step 6: Check 5 — DiffReport compare/dry-run side-by-side**

From the top-level compare or dry-run result (not a journey drill-down), open a changed file and switch to the side-by-side view if it isn't default.

Expected: Minimap still on the right (unchanged — this code path lives in `DiffReport.tsx` and was not touched).

- [ ] **Step 7: Check 6 — Short script in preview modal Files tab**

Find a short script (fewer lines than fit in 500px). Open the preview modal → Files tab.

Expected:
- Diff renders fully within the 500px cap; no internal scroll bar appears.
- Minimap still renders; the viewport indicator covers ~100% of the minimap height (because the visible region equals the full content).
- No layout glitches (no clipped rows, no misaligned panes).

- [ ] **Step 8: Check 7 — Long script in preview modal Files tab**

Find a script with many changes. Open the preview modal → Files tab.

Expected:
- Diff scrolls internally within the 500px cap.
- Minimap viewport indicator updates as you scroll.
- Dragging the minimap seeks correctly.

- [ ] **Step 9: If all 7 checks pass, we're done**

If any check fails, note the specific failure, stop, and debug before marking the plan complete. Do **not** commit a "verification" marker — the code is already committed in Tasks 1-2, and this task is verification only.

---

## Self-Review Notes

- **Spec coverage:**
  - "Make `SplitDiffView` self-contained" → Task 1.
  - "Simplify the fullscreen call site" → Task 2.
  - "No code change at preview modal call site" → explicitly called out in Task 2 Step 2 ("Do not touch the preview modal call site").
  - "Do not touch `SideBySideViewer`, `ScriptDiffView`, `InlineDiffView`, `DiffReport.tsx`" → enforced by scoping Tasks 1-2 to one file and one function; Task 3 lint/test pass catches accidental changes.
  - All 7 verification bullets → one Task 4 step each.
- **No placeholders:** Every step shows the exact code, command, or expected result. No "TODO", "implement later", or "similar to above".
- **Type consistency:** The function signature `{ lines: DiffLineLocal[]; fullscreen?: boolean }` is consistent between Task 1 (definition) and Task 2 (usage at the fullscreen call site). Preview modal call site stays `<SplitDiffView lines={diffLines} />` (omitted `fullscreen` defaults to `undefined`, matching the inline behavior).
