# Side-by-side script diff minimap

## Problem

In the compare and dry-run flows, script viewers (preview modal Files tab, and any right-side node-detail panel context that shows a side-by-side script diff) lack the right-edge minimap that the unified diff views already have. Users can pan quickly through long scripts only in unified mode; switching to side-by-side costs that capability.

The root cause is that `SplitDiffView` (in `src/app/compare/JourneyDiffGraph.tsx`) is a plain `<table>` with no scroll container of its own. It gets a minimap only when a caller wraps it in a scrollable `<div>` and renders a sibling `<DiffMinimap>`. Today only one caller does that — the fullscreen Files tab in `ScriptFileEntry`. The preview modal's Files tab renders `SplitDiffView` inline (line 2823) and gets no minimap.

## Approach

Make `SplitDiffView` self-contained, mirroring the pattern `SideBySideViewer` in `src/app/compare/DiffReport.tsx` already uses: the component owns its scroll container and renders a `DiffMinimap` next to it. Add a `fullscreen?: boolean` prop so the component knows whether to fill its parent (fullscreen) or cap itself at a fixed height (inline/preview).

Every current and future caller gets a minimap automatically. The fullscreen caller's outer wrapper becomes redundant and is removed.

## Changes

### `src/app/compare/JourneyDiffGraph.tsx`

**`SplitDiffView`** — refactor to:

```tsx
function SplitDiffView({ lines, fullscreen }: { lines: DiffLineLocal[]; fullscreen?: boolean }) {
  const rows = useMemo(...);                          // unchanged alignment logic
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn(
      "flex bg-slate-950 overflow-hidden",
      fullscreen ? "flex-1 min-h-0" : "max-h-[500px]"
    )}>
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>...</thead>                          {/* Source / Modified — unchanged */}
          <tbody>...</tbody>                          {/* rows — unchanged */}
        </table>
      </div>
      <DiffMinimap lines={lines} scrollRef={scrollRef} />
    </div>
  );
}
```

- `fullscreen={true}` → `flex-1 min-h-0`: fills available space in a flex parent (fullscreen Files tab).
- `fullscreen` omitted → `max-h-[500px]`: short files render fully without internal scroll; long files scroll internally, and the minimap becomes useful.
- The minimap receives the same `DiffLineLocal[]` input it already accepts elsewhere (added / removed / context). No sticky-header offset needed — the minimap sits beside the table, not above it.

**Call site — fullscreen Files tab** (around line 672-679):

Before:
```tsx
hasBothSides && fsTab === "files" ? (
  <>
    <div ref={fsScrollRef} className="flex-1 overflow-auto">
      <SplitDiffView lines={diffLines} />
    </div>
    <DiffMinimap lines={diffLines} scrollRef={fsScrollRef} />
  </>
) : ( ... unified ... )
```

After:
```tsx
hasBothSides && fsTab === "files" ? (
  <SplitDiffView lines={diffLines} fullscreen />
) : ( ... unified ... )
```

Keep the `fsScrollRef` declaration — the unified fullscreen path (line 682-700) still uses it.

**Call site — preview modal Files tab** (line 2823):

No code change. `<SplitDiffView lines={diffLines} />` now gets a minimap for free.

### Other files

None. `SideBySideViewer` in `DiffReport.tsx` is already self-contained and unaffected. `ScriptDiffView` (unified) already has its own minimap. `InlineDiffView` is intentionally unchanged — it's a compact preview where a minimap adds no value.

## Verification

Manual checks in the running UI:

1. **Preview modal → Files tab** on a changed script (config or content file differing): each file's diff shows a draggable minimap on the right; viewport indicator tracks the internal scroll; clicking/dragging seeks.
2. **Preview modal → Diff tab** (unified): minimap still present, no regression.
3. **Fullscreen script file → Files tab**: minimap still present, now rendered by the component itself; the side-by-side layout is unchanged.
4. **Fullscreen script file → Diff tab** (unified): minimap still present (untouched path using `fsScrollRef`).
5. **`DiffReport.tsx` compare/dry-run side-by-side**: untouched — spot-check that the existing minimap there still works.
6. **Short script in preview Files tab**: renders fully inside `max-h-[500px]` with no internal scroll; minimap shows full content with viewport at 100% — no visual glitches.
7. **Long script in preview Files tab**: scrolls internally; minimap is draggable and seeks correctly.

## Scope boundary

Out of scope: changing the unified views, `InlineDiffView`, or `SideBySideViewer` in `DiffReport.tsx`. No new props on callers besides adding `fullscreen` at the one fullscreen call site. No visual restyling of the minimap itself.
