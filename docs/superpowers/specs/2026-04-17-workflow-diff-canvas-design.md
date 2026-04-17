# Workflow diff canvas parity with journey

## Problem

The compare-result view for IGA workflows opens a canvas (`WorkflowDiffGraphModal`, 539 lines) that renders a single **merged** ReactFlow diff — all steps overlayed with diff-status colors. The journey compare view (`JourneyDiffGraphModal`, 2884 lines) is much richer: it has a merged / side-by-side toggle, synced viewports, hide-unchanged, compact layout, search, and multiple display modes (graph / outline / table / swimlane / json).

Users want parity on the most valuable of those features for workflows. Scope is Phase 1 + Phase 2 combined (see decomposition below); Phase 3 features are deferred.

## Goals

Add the following to the workflow compare canvas, matching the journey patterns:

1. **Merged / side-by-side view toggle** — two synced ReactFlow canvases when side-by-side.
2. **Sync viewports** toggle (side-by-side only).
3. **Hide unchanged** toggle.
4. **Compact** toggle (smaller node components; positions unchanged).
5. **Search** input (filters by step name; canvas zooms to matches).
6. **Outline view** — a new `WorkflowOutlineView` grouping steps by diff status, with click-to-focus.

## Non-goals (explicit scope boundary)

- No table, swimlane, or JSON views for workflow (deferred to a future phase).
- No sub-workflow navigation (workflows don't have nested workflows).
- No new step-detail panel features; existing `StepDetailPanel` used as-is.
- No changes to `src/app/configs/WorkflowGraph.tsx` (browse tab).
- No changes to `src/app/compare/DiffMinimap.tsx` or the previous feature's `SplitDiffView`.
- No refactor of `applyLayout` / dagre usage — those stay in `JourneyDiffGraph.tsx`.
- No journey-style path highlighting changes in `DiffGraphCanvas` beyond extraction (behavior preserved byte-for-byte).

## Architecture

### Extraction — shared `DiffGraphCanvas`

Today `DiffGraphCanvas` lives inside `src/app/compare/JourneyDiffGraph.tsx` (line 1600-1610). It wraps a ReactFlow canvas with: viewport sync, hide-unchanged filtering, search-match set + zoom-on-match, selection-based path tracing, node styling, keyboard panning, node activation callbacks.

Move it to `src/components/diff-graph/DiffGraphCanvas.tsx` and parameterize the journey-specific bits:

```ts
interface DiffGraphCanvasProps {
  baseNodes: Node[];                // caller has already applied layout
  baseEdges: Edge[];
  nodeTypes: NodeTypes;             // caller supplies the node component map
  hideUnchanged: boolean;
  isCompact: boolean;
  fitKey: number;
  externalViewport: Viewport | null;
  onViewportChange: (vp: Viewport) => void;
  searchQuery: string;
  flashNodeId: string | null;
  zoomToNodeId?: string | null;
  onNodeActivate?: (nodeId: string | null, data: Record<string, unknown>) => void;
  onNodeDoubleClick?: (nodeId: string, data: Record<string, unknown>) => void;
  onPaneClearFocus?: () => void;
  scriptNames?: Map<string, string>; // optional; only journey passes this
}
```

Layout (`applyLayout`, `applyCompactLayout`, `getNodeDims`) stays in the caller, so the canvas stays agnostic to domain.

`JourneyDiffGraph.tsx` imports the extracted canvas and continues to pass its own `nodeTypes` + pre-layouted nodes. Behavior is unchanged.

### `WorkflowDiffGraphModal` additions

New state:

```ts
const [viewMode, setViewMode]           = useState<"merged" | "side-by-side">("merged");
const [displayView, setDisplayView]     = useState<"graph" | "outline">("graph");
const [hideUnchanged, setHideUnchanged] = useState(false);
const [isCompact, setIsCompact]         = useState(false);
const [syncViewports, setSyncViewports] = useState(true);
const [searchQuery, setSearchQuery]     = useState("");
const [fitKey, setFitKey]               = useState(0);
const [leftViewport,  setLeftViewport]  = useState<Viewport | null>(null);
const [rightViewport, setRightViewport] = useState<Viewport | null>(null);
```

Toolbar (mirrors the journey header):
- Graph / Outline toggle (displayView)
- Merged / Side by side toggle (graph only)
- Hide unchanged
- Compact
- Sync viewports (side-by-side only)
- Fit view (fitKey++)
- Search input

### Side-by-side rendering

Partition `diffData.steps` by side, build two separate `{ nodes, edges }` sets via the existing `buildGraph`:

- **Left (source):** status in `{unchanged, removed, modified}` — rendered with source content.
- **Right (target):** status in `{unchanged, added, modified}` — rendered with target content.

Render two `<DiffGraphCanvas>` instances in a flex-row container.

Viewport sync when `syncViewports` is on:
- Left's `onViewportChange(vp)` → `setRightViewport(vp)`.
- Right's `onViewportChange(vp)` → `setLeftViewport(vp)`.
- Use a `syncingRef` guard to prevent infinite loops (same pattern as journey).

When sync is off, both `externalViewport` props are `null` and each canvas manages its own viewport.

### Compact layout for workflows

Unlike journeys (dagre auto-layout), workflow step positions come from the workflow JSON's `startX/startY/next` — they're explicit. For `isCompact`, we render *smaller node components* (no position recompute). The `isCompact` prop propagates to nodes via `n.data.isCompact`; node components check it and render a smaller variant. No layout-function changes needed.

### Search

Pass `searchQuery` straight to `DiffGraphCanvas`. The canvas's existing search checks `n.data.label.includes(q)` — works out of the box for workflow nodes. The `scriptNames` / `ScriptedDecisionNode` path is guarded, so it's inert for workflows. Don't pass `scriptNames`.

### `WorkflowOutlineView` (new)

`src/app/configs/WorkflowOutlineView.tsx`. Props:

```ts
interface WorkflowOutlineViewProps {
  diffData: WorkflowDiffData;
  onNavigate: (stepId: string) => void;
}
```

Renders a flat list of steps **grouped by diff status**:

- **Added** (count)
  - Step rows: kind icon + name + `added` badge.
- **Modified** (count)
- **Removed** (count)
- **Unchanged** (collapsible, default collapsed)

Each row is clickable. Clicking calls `onNavigate(step.id)`, which in the parent sets `zoomToNodeId` and flips `displayView` back to `"graph"`.

Based on the structure of `src/app/configs/JourneyOutlineView.tsx` but workflow-specific — no shared abstraction (the inputs are too different).

## Data flow

```
WorkflowDiffGraphModal state
  ├─ parsed workflows (local, remote)
  ├─ diffData (merged)
  │
  ├─ merged mode:
  │    └─ buildGraph(diffData) → baseNodes, baseEdges
  │        └─ <DiffGraphCanvas ... searchQuery ... />
  │
  └─ side-by-side mode:
       ├─ diffData filtered to source side → buildGraph → left
       ├─ diffData filtered to target side → buildGraph → right
       └─ two <DiffGraphCanvas /> with viewport sync
```

## Commit strategy (implementation plan hint)

1. **Refactor only:** extract `DiffGraphCanvas` to `src/components/diff-graph/`, update `JourneyDiffGraph.tsx` to import it. Verify journey diff unchanged.
2. **viewMode state + toolbar shell + side-by-side rendering** (no viewport sync yet — each side independent).
3. **Hide unchanged + compact + sync viewports** (wire state, pass to canvas, add sync guard).
4. **Search input + wiring.**
5. **WorkflowOutlineView component + displayView toggle.**

Each commit leaves the app in a working state; each is independently testable.

## Verification

Manual browser checks after implementation:

1. **Journey regression:** Open a journey diff; verify merged, side-by-side, search, hide-unchanged, compact, sync viewports, sub-journey drill-down, and script preview all still work identically.
2. **Workflow merged view:** Canvas renders all steps with status colors; step click opens detail panel (unchanged from today).
3. **Workflow side-by-side view:** Two canvases; source side has unchanged + removed + modified; target side has unchanged + added + modified.
4. **Sync viewports:** With sync on, panning/zooming one mirrors to the other. With sync off, independent.
5. **Hide unchanged:** Unchanged steps and their adjacent edges disappear in both modes.
6. **Compact:** Nodes render smaller; positions unchanged; labels legible.
7. **Search:** Typing filters + zooms to matches. Clear returns to full view.
8. **Outline view:** Steps grouped by diff status with correct counts. Click row → jumps to canvas with zoom-to-node.
9. **Combined:** Search + side-by-side + hide unchanged + compact all compose without glitches.
