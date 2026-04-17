# Workflow Diff Canvas Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add merged / side-by-side canvas modes, sync viewports, hide-unchanged, compact, search, and an outline view to the workflow compare modal, matching the journey compare patterns by extracting a shared `DiffGraphCanvas` component.

**Architecture:** Extract `DiffGraphCanvas` from `src/app/compare/JourneyDiffGraph.tsx` into `src/components/diff-graph/DiffGraphCanvas.tsx`, parameterizing the journey-specific bits (`nodeTypes`, layout functions, minimap color, legend) so both domains can consume it. Then add state + toolbar + two-canvas side-by-side rendering to `WorkflowDiffGraphModal`, reusing the existing `buildDiffData` + `buildGraph` helpers with a side filter. Add a new `WorkflowOutlineView` for the outline display mode.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, `@xyflow/react` (ReactFlow). Vitest + jsdom for any unit tests; this change is primarily structural/visual so verification is manual in the dev server.

**Spec:** `docs/superpowers/specs/2026-04-17-workflow-diff-canvas-design.md`

---

## File Structure

**New files:**
- `src/components/diff-graph/DiffGraphCanvas.tsx` — shared ReactFlow canvas with viewport sync, hide-unchanged, search, path tracing, keyboard panning. Accepts `nodeTypes`, optional layout functions, optional minimap color function, optional legend.
- `src/app/configs/WorkflowOutlineView.tsx` — list of workflow steps grouped by diff status. Click → `onNavigate(stepId)`.

**Modified files:**
- `src/app/compare/JourneyDiffGraph.tsx` — remove in-file `DiffGraphCanvasInner`/`DiffGraphCanvas`; import from the new shared module; pass its existing `nodeTypes`, `applyLayout`, `applyCompactLayout`, `miniMapNodeColor`, and `<DiffLegend />`.
- `src/app/compare/WorkflowDiffGraph.tsx` — add toolbar state, view-mode toggle, side-by-side rendering, hide-unchanged / compact / sync-viewports / search wiring, outline display mode.
- `src/app/compare/WorkflowDiffGraph.tsx` — `DiffStepNode` reads `data.isCompact` to render a smaller variant.

---

## Task 1: Extract `DiffGraphCanvas` to a shared module

**Files:**
- Create: `src/components/diff-graph/DiffGraphCanvas.tsx`
- Modify: `src/app/compare/JourneyDiffGraph.tsx` (remove the extracted region; add an import)

**Why:** Today `DiffGraphCanvas` lives inside `JourneyDiffGraph.tsx` and references journey-only constants (`nodeTypes`, layout funcs, `miniMapNodeColor`, `<DiffLegend />`). Make it a general-purpose component so workflow can consume it.

- [ ] **Step 1: Locate the region to extract**

Run: `grep -n "// ── DiffGraphCanvasInner\|// ── DiffGraphCanvas " src/app/compare/JourneyDiffGraph.tsx`
Expected: two section markers — `DiffGraphCanvasInner` around line 1313, `DiffGraphCanvas` around line 1600.

- [ ] **Step 2: Create the shared module**

Create `src/components/diff-graph/DiffGraphCanvas.tsx` with this content:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type Viewport,
  type EdgeMouseHandler,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export interface DiffGraphCanvasProps {
  baseNodes: Node[];
  baseEdges: Edge[];
  nodeTypes: NodeTypes;
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
  /** Optional: transform raw nodes into laid-out nodes. If omitted, baseNodes are used as-is. */
  applyLayout?: (nodes: Node[], edges: Edge[]) => Node[];
  /** Optional: alternative layout used when isCompact is true. Falls back to applyLayout. */
  applyCompactLayout?: (nodes: Node[], edges: Edge[]) => Node[];
  /** Optional: color function for the minimap. Default maps by data.diffStatus. */
  miniMapNodeColor?: (node: Node) => string;
  /** Optional: content rendered in a top-left Panel inside the canvas (e.g., a legend). */
  legend?: React.ReactNode;
  /** Optional: extra search targets keyed by node id (journey uses this for script names). */
  scriptNames?: Map<string, string>;
  className?: string;
}

function defaultMiniMapNodeColor(n: Node): string {
  const d = n.data as { diffStatus?: DiffStatus };
  switch (d.diffStatus) {
    case "added":    return "#10b981";
    case "removed":  return "#ef4444";
    case "modified": return "#f59e0b";
    default:         return "#94a3b8";
  }
}

function getConnected(nodeId: string, edges: Edge[]): { ancestors: Set<string>; descendants: Set<string> } {
  const ancestors = new Set<string>();
  const descendants = new Set<string>();
  const upQueue = [nodeId];
  while (upQueue.length) {
    const cur = upQueue.shift()!;
    for (const e of edges) {
      if (e.target === cur && !ancestors.has(e.source)) {
        ancestors.add(e.source);
        upQueue.push(e.source);
      }
    }
  }
  const downQueue = [nodeId];
  while (downQueue.length) {
    const cur = downQueue.shift()!;
    for (const e of edges) {
      if (e.source === cur && !descendants.has(e.target)) {
        descendants.add(e.target);
        downQueue.push(e.target);
      }
    }
  }
  return { ancestors, descendants };
}

function DiffGraphCanvasInner({
  baseNodes,
  baseEdges,
  nodeTypes,
  hideUnchanged,
  isCompact,
  fitKey,
  externalViewport,
  onViewportChange,
  onNodeActivate,
  onNodeDoubleClick: onNodeDoubleClickProp,
  searchQuery,
  flashNodeId,
  onPaneClearFocus,
  zoomToNodeId,
  applyLayout,
  applyCompactLayout,
  miniMapNodeColor,
  legend,
  scriptNames,
}: Omit<DiffGraphCanvasProps, "className">) {
  const { fitView, setViewport, getViewport } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId]   = useState<string | null>(null);
  const [pinnedEdgeId, setPinnedEdgeId]     = useState<string | null>(null);

  const layoutedNodes = useMemo(() => {
    const fn = isCompact
      ? (applyCompactLayout ?? applyLayout)
      : applyLayout;
    return fn ? fn(baseNodes, baseEdges) : baseNodes;
  }, [baseNodes, baseEdges, isCompact, applyLayout, applyCompactLayout]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);

  useEffect(() => {
    setNodes(layoutedNodes);
    if (zoomToNodeId) return;
    const t = setTimeout(() => { void fitView({ duration: 200 }); }, 80);
    return () => clearTimeout(t);
  }, [layoutedNodes, setNodes, fitView, zoomToNodeId]);

  useEffect(() => {
    void fitView({ duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  useEffect(() => {
    if (externalViewport) setViewport(externalViewport, { duration: 0 });
  }, [externalViewport, setViewport]);

  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((_e, edge) => setHoveredEdgeId(edge.id), []);
  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => setHoveredEdgeId(null), []);
  const handleEdgeClick:      EdgeMouseHandler = useCallback((_e, edge) => setPinnedEdgeId((p) => p === edge.id ? null : edge.id), []);

  useEffect(() => {
    const PAN = 120;
    const handler = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      const vp = getViewport();
      const dx = e.key === "ArrowLeft" ? PAN : e.key === "ArrowRight" ? -PAN : 0;
      const dy = e.key === "ArrowUp"   ? PAN : e.key === "ArrowDown"  ? -PAN : 0;
      setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom }, { duration: 100 });
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [getViewport, setViewport]);

  useEffect(() => {
    if (!zoomToNodeId) return;
    const t = setTimeout(() => {
      void fitView({ nodes: [{ id: zoomToNodeId }], duration: 600, padding: 0.35 });
    }, 350);
    return () => clearTimeout(t);
  }, [zoomToNodeId, fitView]);

  const visibleNodeIds = useMemo(() => {
    if (!hideUnchanged) return new Set(nodes.map((n) => n.id));
    return new Set(
      nodes
        .filter((n) => (n.data.diffStatus as DiffStatus) !== "unchanged")
        .map((n) => n.id),
    );
  }, [nodes, hideUnchanged]);

  const filteredNodes = useMemo(
    () => nodes.filter((n) => visibleNodeIds.has(n.id)),
    [nodes, visibleNodeIds],
  );

  const filteredEdges = useMemo(
    () => baseEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
    ),
    [baseEdges, visibleNodeIds],
  );

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!filteredNodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
      onNodeActivate?.(null, {});
    }
  }, [filteredNodes, selectedNodeId, onNodeActivate]);

  const highlighted = useMemo(() => {
    if (!selectedNodeId) return null;
    const { ancestors, descendants } = getConnected(selectedNodeId, filteredEdges);
    return new Set([selectedNodeId, ...ancestors, ...descendants]);
  }, [selectedNodeId, filteredEdges]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const n of nodes) {
      const labelMatch  = String(n.data.label ?? n.data.displayName ?? "").toLowerCase().includes(q);
      const scriptMatch = n.data.nodeType === "ScriptedDecisionNode" &&
        (scriptNames?.get(n.id) ?? "").toLowerCase().includes(q);
      if (labelMatch || scriptMatch) {
        ids.add(n.id);
        if (n.parentId) ids.add(n.parentId);
      }
    }
    return ids;
  }, [searchQuery, nodes, scriptNames]);

  useEffect(() => {
    if (searchMatches.size === 0) return;
    const topIds = [...searchMatches].filter((id) => !id.includes("__child__"));
    if (topIds.length === 0) return;
    const t = setTimeout(() => {
      void fitView({ nodes: topIds.map((id) => ({ id })), duration: 500, padding: 0.4 });
    }, 50);
    return () => clearTimeout(t);
  }, [searchMatches, fitView]);

  const styledNodes = useMemo(() => {
    return filteredNodes.map((n) => {
      const onPath = highlighted ? highlighted.has(n.id) : true;
      return {
        ...n,
        data: {
          ...n.data,
          isFocused:     n.id === flashNodeId,
          isSearchMatch: searchMatches.has(n.id),
          isCompact,
        },
        style: {
          ...n.style,
          opacity: highlighted ? (onPath ? 1 : 0.15) : 1,
          transition: "opacity 0.2s",
        },
      };
    });
  }, [filteredNodes, highlighted, flashNodeId, searchMatches, isCompact]);

  const styledEdges = useMemo(() => {
    const activeEdgeId = hoveredEdgeId ?? pinnedEdgeId;
    return filteredEdges.map((e) => {
      const isHovered = e.id === hoveredEdgeId;
      const isPinned  = e.id === pinnedEdgeId;
      const isActive  = e.id === activeEdgeId;
      const onPath    = highlighted ? (highlighted.has(e.source) && highlighted.has(e.target)) : true;

      let opacity = 1;
      if (activeEdgeId)     opacity = isActive ? 1 : 0.06;
      else if (highlighted) opacity = onPath ? 1 : 0.06;

      const baseStroke = (e.style?.stroke as string | undefined) ?? "#64748b";
      const stroke = isHovered ? "#3b82f6" : isPinned ? "#7c3aed" : baseStroke;

      return {
        ...e,
        style: { ...e.style, opacity, strokeWidth: isActive ? 3 : 1.5, stroke, transition: "opacity 0.15s, stroke-width 0.15s" },
        animated: !activeEdgeId && onPath && !!highlighted,
        label: opacity < 0.5 ? undefined : e.label,
      };
    });
  }, [filteredEdges, highlighted, hoveredEdgeId, pinnedEdgeId]);

  const miniColor = miniMapNodeColor ?? defaultMiniMapNodeColor;

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const nodeData = node.data as Record<string, unknown>;
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
      onNodeActivate?.(null, {});
    } else {
      setSelectedNodeId(node.id);
      onNodeActivate?.(node.id, nodeData);
    }
  }, [selectedNodeId, onNodeActivate]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeDoubleClickProp?.(node.id, node.data as Record<string, unknown>);
  }, [onNodeDoubleClickProp]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    onNodeActivate?.(null, {});
    onPaneClearFocus?.();
  }, [onNodeActivate, onPaneClearFocus]);

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      onMove={(_, vp) => onViewportChange(vp)}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onPaneClick={handlePaneClick}
      onEdgeMouseEnter={handleEdgeMouseEnter}
      onEdgeMouseLeave={handleEdgeMouseLeave}
      onEdgeClick={handleEdgeClick}
      onNodesChange={onNodesChange}
      nodesDraggable
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls showInteractive={false} showFitView={false} />
      <MiniMap nodeColor={miniColor} zoomable pannable />
      {legend && <Panel position="top-left">{legend}</Panel>}
    </ReactFlow>
  );
}

export function DiffGraphCanvas({ className, ...innerProps }: DiffGraphCanvasProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ReactFlowProvider>
        <DiffGraphCanvasInner {...innerProps} />
      </ReactFlowProvider>
    </div>
  );
}
```

Notes on what changed relative to the current in-file version:
- Added `nodeTypes`, `applyLayout`, `applyCompactLayout`, `miniMapNodeColor`, `legend` props.
- `layoutedNodes` uses optional layout funcs, defaulting to identity (no layout).
- Added `isCompact` to node `data` in `styledNodes`.
- Added `n.data.displayName` fallback in search (workflow nodes have `displayName`, journey has `label`).
- `miniMapNodeColor` defaults to a generic diffStatus-based coloring function.
- `legend` prop controls whether a top-left `<Panel>` is rendered.
- Private helper `getConnected` inlined (previously defined elsewhere in JourneyDiffGraph).

- [ ] **Step 3: Update `JourneyDiffGraph.tsx` to import the shared module**

In `src/app/compare/JourneyDiffGraph.tsx`:

1. **Remove** the blocks at lines ~1313-1614 (both `DiffGraphCanvasInner` and `DiffGraphCanvas`). They now live in the shared module.
2. **Add import** near the top (after line 27 imports):
   ```tsx
   import { DiffGraphCanvas } from "@/components/diff-graph/DiffGraphCanvas";
   ```
3. **Keep** the module-level `nodeTypes` at line 411, `applyLayout`, `applyCompactLayout`, and any helper functions like `getConnected` (if used elsewhere — verify with grep; if only used inside the extracted block, delete).
4. **Update every `<DiffGraphCanvas>` usage** in this file (there are four, at approximately lines 1625, 2574, 2598, 2621) to pass the journey's own `nodeTypes`, layout functions, minimap color function, and legend. Example:
   ```tsx
   <DiffGraphCanvas
     baseNodes={mergedNodes}
     baseEdges={mergedEdges}
     nodeTypes={nodeTypes}
     applyLayout={applyLayout}
     applyCompactLayout={applyCompactLayout}
     miniMapNodeColor={miniMapNodeColor}
     legend={<DiffLegend />}
     hideUnchanged={hideUnchanged}
     isCompact={isCompact}
     fitKey={fitKey}
     externalViewport={null}
     onViewportChange={() => {}}
     onNodeActivate={handleNodeActivate}
     onNodeDoubleClick={handleNodeDoubleActivate}
     searchQuery={searchQuery}
     flashNodeId={flashNodeId}
     onPaneClearFocus={clearFocusNode}
     zoomToNodeId={zoomToNodeId}
     scriptNames={scriptNames}
   />
   ```
   The existing `miniMapNodeColor` function at line 1535 (currently inside `DiffGraphCanvasInner`) needs to be hoisted out of the removed region and kept as a module-level function so each call site can pass it. Extract it verbatim, giving it this signature:
   ```tsx
   const journeyMiniMapNodeColor = (n: Node): string => {
     if (n.data.diffStatus === "modified") {
       if (n.data.modifiedReason === "script")     return "#f97316";
       if (n.data.modifiedReason === "subjourney") return "#8b5cf6";
       return "#f59e0b";
     }
     switch (n.data.diffStatus as "added" | "removed" | "unchanged") {
       case "added":   return "#10b981";
       case "removed": return "#ef4444";
       default:        return "#94a3b8";
     }
   };
   ```
   Pass `miniMapNodeColor={journeyMiniMapNodeColor}` at every call site. The `PreviewDiffJourneyGraph` instance at line 1625 must ALSO pass `applyLayout`, `applyCompactLayout`, `miniMapNodeColor={journeyMiniMapNodeColor}`, and `legend={<DiffLegend />}` — its nodes come from `parseMergedDiffGraph` with `position: { x: 0, y: 0 }` and would stack at origin without a layout pass. The previous in-file canvas hardcoded those; now that they're props, every journey call site (including the preview) must pass them.

5. Imports to remove (if no longer used after deleting the extracted region): `ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `MiniMap`, `Panel`, `useNodesState`, `useReactFlow`, `NodeProps`, `Viewport`, `EdgeMouseHandler` from `@xyflow/react`. Verify each by grepping: `grep -n "ReactFlow\|useNodesState\|useReactFlow" src/app/compare/JourneyDiffGraph.tsx`. If the only remaining references were inside the extracted region, drop them; otherwise keep.

- [ ] **Step 4: Lint the two files**

Run:
```
npm run lint -- src/app/compare/JourneyDiffGraph.tsx src/components/diff-graph/DiffGraphCanvas.tsx
```
Expected: 0 errors. Pre-existing warnings in JourneyDiffGraph.tsx are fine; there should be no new lint warnings in the new shared module.

If new errors appear:
- Type mismatches → verify `NodeTypes`, `Viewport`, `EdgeMouseHandler` imports match the `@xyflow/react` exports used before.
- Unused imports → remove per grep check in Step 3.5.

- [ ] **Step 5: Commit**

```bash
git add src/components/diff-graph/DiffGraphCanvas.tsx src/app/compare/JourneyDiffGraph.tsx
git commit -m "Refactor: extract DiffGraphCanvas into shared module"
```

- [ ] **Step 6: Manual journey regression check (brief)**

Run: `npm run dev`
In the browser: open any journey diff. Verify:
- Canvas renders identically to before.
- Merged ↔ side-by-side toggle works.
- Hide unchanged, compact, search, sync viewports all still work.
- Clicking a ScriptedDecisionNode still opens the script preview.
- Sub-journey drill-down (click inner journey) still works.

Do not proceed to Task 2 until the journey view is confirmed visually unchanged.

---

## Task 2: Workflow view-mode toggle + side-by-side rendering

**Files:**
- Modify: `src/app/compare/WorkflowDiffGraph.tsx`

**Why:** Replace the bespoke `CanvasInner` with shared `DiffGraphCanvas`, add the `merged` / `side-by-side` view-mode state and toolbar, and build two-canvas side-by-side rendering filtered by diff status.

- [ ] **Step 1: Add imports and new state**

At the top of `src/app/compare/WorkflowDiffGraph.tsx`:
1. Replace the current `@xyflow/react` imports with the minimum still needed (Handle, Position, NodeProps, MarkerType, Node, Edge, Viewport). Remove `ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `MiniMap`, `useNodesState`, `useEdgesState`, `useReactFlow` — they're encapsulated in the shared canvas now.
2. Add:
   ```tsx
   import { DiffGraphCanvas } from "@/components/diff-graph/DiffGraphCanvas";
   ```

In `WorkflowDiffGraphModal`, add these state hooks immediately after the existing `activeStep` state (around line 412):

```tsx
const [viewMode,      setViewMode]      = useState<"merged" | "side-by-side">("merged");
const [hideUnchanged, setHideUnchanged] = useState(false);
const [isCompact,     setIsCompact]     = useState(false);
const [syncViewports, setSyncViewports] = useState(true);
const [searchQuery,   setSearchQuery]   = useState("");
const [fitKey,        setFitKey]        = useState(0);
const [leftViewport,  setLeftViewport]  = useState<Viewport | null>(null);
const [rightViewport, setRightViewport] = useState<Viewport | null>(null);
const syncingRef = useRef(false);
```

Add `Viewport` to the imports and `useRef` to the `react` imports at the top of the file if not present.

- [ ] **Step 2: Build side-filtered diff data**

Inside `WorkflowDiffGraphModal`, after `const diffData = useMemo(...)`, add:

```tsx
// Filter diffData by side. Modified is currently not produced by buildDiffData;
// if it becomes produced later, it should appear on both sides.
const leftDiffData = useMemo(() => ({
  ...diffData,
  steps: diffData.steps.filter((s) => s.diffStatus !== "added"),
}), [diffData]);
const rightDiffData = useMemo(() => ({
  ...diffData,
  steps: diffData.steps.filter((s) => s.diffStatus !== "removed"),
}), [diffData]);

const mergedGraph = useMemo(() => buildGraph(diffData,      activeStep?.step.id ?? null), [diffData,      activeStep]);
const leftGraph   = useMemo(() => buildGraph(leftDiffData,  activeStep?.step.id ?? null), [leftDiffData,  activeStep]);
const rightGraph  = useMemo(() => buildGraph(rightDiffData, activeStep?.step.id ?? null), [rightDiffData, activeStep]);
```

- [ ] **Step 3: Add viewport-sync handlers**

Immediately after the state hooks:

```tsx
const handleLeftMove = useCallback((vp: Viewport) => {
  if (syncingRef.current) return;
  if (!syncViewports) return;
  syncingRef.current = true;
  setRightViewport(vp);
  queueMicrotask(() => { syncingRef.current = false; });
}, [syncViewports]);

const handleRightMove = useCallback((vp: Viewport) => {
  if (syncingRef.current) return;
  if (!syncViewports) return;
  syncingRef.current = true;
  setLeftViewport(vp);
  queueMicrotask(() => { syncingRef.current = false; });
}, [syncViewports]);

// When sync is toggled off, clear any stale external viewport so each side manages itself
useEffect(() => {
  if (!syncViewports) {
    setLeftViewport(null);
    setRightViewport(null);
  }
}, [syncViewports]);
```

- [ ] **Step 4: Replace the canvas body**

Find the existing body block:
```tsx
{/* Graph */}
<div className="flex-1 overflow-hidden min-w-0 bg-slate-50">
  <ReactFlowProvider>
    <CanvasInner ... />
  </ReactFlowProvider>
</div>
```

Replace with:

```tsx
{/* Graph area */}
<div className="flex-1 min-h-0 flex overflow-hidden bg-slate-50">
  {viewMode === "merged" ? (
    <DiffGraphCanvas
      baseNodes={mergedGraph.nodes}
      baseEdges={mergedGraph.edges}
      nodeTypes={NODE_TYPES}
      hideUnchanged={hideUnchanged}
      isCompact={isCompact}
      fitKey={fitKey}
      externalViewport={null}
      onViewportChange={() => {}}
      onNodeActivate={(nodeId) => {
        if (!nodeId) { setActiveStep(null); return; }
        const step = diffData.steps.find((s) => s.id === nodeId);
        const fd   = stepFileDiffMap.get(nodeId);
        if (step) setActiveStep({ step, local: fd?.localContent, remote: fd?.remoteContent });
      }}
      searchQuery={searchQuery}
      flashNodeId={activeStep?.step.id ?? null}
      onPaneClearFocus={() => setActiveStep(null)}
    />
  ) : (
    <>
      <div className="flex-1 min-w-0 relative border-r border-slate-200">
        <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 text-slate-600 text-[10px] px-2 py-1 rounded border border-slate-200 shadow-sm pointer-events-none">
          {sourceLabel}
        </span>
        <DiffGraphCanvas
          baseNodes={leftGraph.nodes}
          baseEdges={leftGraph.edges}
          nodeTypes={NODE_TYPES}
          hideUnchanged={hideUnchanged}
          isCompact={isCompact}
          fitKey={fitKey}
          externalViewport={leftViewport}
          onViewportChange={handleLeftMove}
          onNodeActivate={(nodeId) => {
            if (!nodeId) { setActiveStep(null); return; }
            const step = diffData.steps.find((s) => s.id === nodeId);
            const fd   = stepFileDiffMap.get(nodeId);
            if (step) setActiveStep({ step, local: fd?.localContent, remote: fd?.remoteContent });
          }}
          searchQuery={searchQuery}
          flashNodeId={activeStep?.step.id ?? null}
          onPaneClearFocus={() => setActiveStep(null)}
        />
      </div>
      <div className="flex-1 min-w-0 relative">
        <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 text-slate-600 text-[10px] px-2 py-1 rounded border border-slate-200 shadow-sm pointer-events-none">
          {targetLabel}
        </span>
        <DiffGraphCanvas
          baseNodes={rightGraph.nodes}
          baseEdges={rightGraph.edges}
          nodeTypes={NODE_TYPES}
          hideUnchanged={hideUnchanged}
          isCompact={isCompact}
          fitKey={fitKey}
          externalViewport={rightViewport}
          onViewportChange={handleRightMove}
          onNodeActivate={(nodeId) => {
            if (!nodeId) { setActiveStep(null); return; }
            const step = diffData.steps.find((s) => s.id === nodeId);
            const fd   = stepFileDiffMap.get(nodeId);
            if (step) setActiveStep({ step, local: fd?.localContent, remote: fd?.remoteContent });
          }}
          searchQuery={searchQuery}
          flashNodeId={activeStep?.step.id ?? null}
          onPaneClearFocus={() => setActiveStep(null)}
        />
      </div>
    </>
  )}
</div>
```

- [ ] **Step 5: Add the view-mode toggle to the header**

Find the existing header block (around line 486-506). Directly before the close button (inside the same flex row), add:

```tsx
<div className="flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
  {(["merged", "side-by-side"] as const).map((m) => (
    <button
      key={m}
      type="button"
      onClick={() => setViewMode(m)}
      className={cn(
        "px-3 py-1 transition-colors capitalize",
        viewMode === m ? "bg-slate-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
      )}
    >
      {m === "side-by-side" ? "Side by side" : "Merged"}
    </button>
  ))}
</div>
```

Import `cn` at the top if missing (check with `grep -n "import { cn }" src/app/compare/WorkflowDiffGraph.tsx`).

- [ ] **Step 6: Delete the now-unused `CanvasInner` function**

Remove the entire `CanvasInner` function (around lines 241-288 post-edit — verify by grep). It's replaced by `DiffGraphCanvas`.

Run: `grep -n "CanvasInner\b" src/app/compare/WorkflowDiffGraph.tsx`
Expected: no matches after deletion.

- [ ] **Step 7: Lint**

Run: `npm run lint -- src/app/compare/WorkflowDiffGraph.tsx`
Expected: 0 errors. Any `no-unused-vars` warning for previously-used hooks means you missed removing an import — fix.

- [ ] **Step 8: Commit**

```bash
git add src/app/compare/WorkflowDiffGraph.tsx
git commit -m "Feat: workflow diff canvas — merged/side-by-side view mode"
```

- [ ] **Step 9: Manual verification**

In the dev server, open a workflow diff. Verify:
- Default merged view looks identical to before (step click → detail panel still works).
- Toggle "Side by side" — two canvases appear. Left has removed + unchanged, right has added + unchanged.
- Panning/zooming one side does **not** sync to the other yet (that's Task 3).

---

## Task 3: Hide unchanged + compact + sync viewports toolbar controls

**Files:**
- Modify: `src/app/compare/WorkflowDiffGraph.tsx`

**Why:** Wire the three remaining boolean toolbar toggles into the UI and make them visibly do something.

- [ ] **Step 1: Add toolbar buttons to the header**

In the header row (after the Merged/Side-by-side toggle from Task 2), add the three toggles before the close button:

```tsx
<button
  type="button"
  onClick={() => setHideUnchanged((v) => !v)}
  title="Hide unchanged steps"
  className={cn(
    "px-2.5 py-1 text-[11px] rounded border transition-colors shrink-0",
    hideUnchanged ? "bg-sky-600 text-white border-sky-600" : "text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400",
  )}
>
  Hide unchanged
</button>
<button
  type="button"
  onClick={() => setIsCompact((v) => !v)}
  title={isCompact ? "Switch to normal layout" : "Switch to compact layout"}
  className={cn(
    "px-2.5 py-1 text-[11px] rounded border transition-colors shrink-0",
    isCompact ? "bg-sky-600 text-white border-sky-600" : "text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400",
  )}
>
  Compact
</button>
{viewMode === "side-by-side" && (
  <button
    type="button"
    onClick={() => setSyncViewports((v) => !v)}
    title="Sync viewports between panels"
    className={cn(
      "px-2.5 py-1 text-[11px] rounded border transition-colors shrink-0",
      syncViewports ? "bg-sky-600 text-white border-sky-600" : "text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400",
    )}
  >
    Sync viewports
  </button>
)}
<button
  type="button"
  onClick={() => setFitKey((k) => k + 1)}
  title="Fit all steps to view"
  className="px-2.5 py-1 text-[11px] rounded border text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400 shrink-0"
>
  Fit
</button>
```

- [ ] **Step 2: Make `DiffStepNode` respect `data.isCompact`**

Find `DiffStepNode` (lines 94-131). Replace its function body with:

```tsx
function DiffStepNode({ data }: NodeProps) {
  const d = data as {
    displayName: string;
    kind: WorkflowStepKind;
    diffStatus: DiffStatus;
    isFocused?: boolean;
    isCompact?: boolean;
    isSearchMatch?: boolean;
  };
  const diff = DIFF_STATUS_STYLE[d.diffStatus] ?? DIFF_STATUS_STYLE.unchanged;
  const w = d.isCompact ? 120 : NODE_W;
  const h = d.isCompact ? 44 : NODE_H;

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm relative",
        diff.border,
        diff.bg,
        d.isFocused && "ring-4 ring-red-500 ring-offset-2",
        d.isSearchMatch && "ring-2 ring-sky-500",
      )}
      style={{ width: w, height: h }}
    >
      <Handle type="target" position={Position.Left}  style={{ background: "#94a3b8" }} />
      <div className={cn("h-full flex flex-col justify-between", d.isCompact ? "px-1.5 py-1" : "px-2.5 py-2")}>
        <div className="flex items-start gap-1.5">
          {KIND_ICON[d.kind]}
          <span className={cn("font-medium leading-tight text-slate-700 line-clamp-2", d.isCompact ? "text-[9px]" : "text-[11px]")}>
            {d.displayName}
          </span>
        </div>
        {!d.isCompact && (
          <div className="flex items-center gap-1">
            <span className={cn("text-[9px] font-bold px-1 rounded", diff.badge)}>
              {d.diffStatus === "unchanged" ? KIND_LABEL[d.kind] : d.diffStatus}
            </span>
            {d.diffStatus === "unchanged" && (
              <span className="text-[9px] text-slate-400">{KIND_LABEL[d.kind]}</span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#94a3b8" }} />
    </div>
  );
}
```

This:
- Adds `isCompact` + `isSearchMatch` to the destructured data shape.
- Switches width/height, padding, and text size based on compact.
- Hides the bottom badge row in compact mode.
- Adds a sky-500 ring when the node is a search match (used in Task 4).

- [ ] **Step 3: Lint**

Run: `npm run lint -- src/app/compare/WorkflowDiffGraph.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/compare/WorkflowDiffGraph.tsx
git commit -m "Feat: workflow diff canvas — hide unchanged, compact, sync viewports toggles"
```

- [ ] **Step 5: Manual verification**

In the dev server:
- **Hide unchanged:** toggle on — only added/removed/modified steps visible. Toggle off — all back.
- **Compact:** toggle on — nodes render smaller (120×44). Positions don't change. Toggle off — back to normal.
- **Sync viewports** (side-by-side only): default on — pan one side, other follows. Toggle off — independent.
- **Fit** button — triggers a fit-view animation on all canvases.

---

## Task 4: Search input

**Files:**
- Modify: `src/app/compare/WorkflowDiffGraph.tsx`

**Why:** Let the user type a fragment of a step name; the canvas highlights matches (sky-500 ring, added in Task 3) and zooms to them.

- [ ] **Step 1: Add search input to the header**

In the header (place before the close button, after the view-mode and toolbar toggles):

```tsx
<div className="flex items-center gap-1 shrink-0 relative">
  <input
    type="text"
    placeholder="Search steps…"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-40 px-2 py-1 text-[11px] rounded border border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
  />
  {searchQuery && (
    <button
      type="button"
      onClick={() => setSearchQuery("")}
      title="Clear search"
      className="absolute right-1 text-slate-400 hover:text-slate-600"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )}
</div>
```

The canvas already receives `searchQuery` as a prop (wired in Task 2) and does the matching + zoom internally.

- [ ] **Step 2: Lint**

Run: `npm run lint -- src/app/compare/WorkflowDiffGraph.tsx`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/compare/WorkflowDiffGraph.tsx
git commit -m "Feat: workflow diff canvas — step search"
```

- [ ] **Step 4: Manual verification**

In the dev server, type part of a step name. Matching step(s) get a sky-500 ring. Canvas zooms to them. Clear the input — highlights and zoom reset.

---

## Task 5: Outline view

**Files:**
- Create: `src/app/configs/WorkflowOutlineView.tsx`
- Modify: `src/app/compare/WorkflowDiffGraph.tsx`

**Why:** Give users a non-spatial view of the diff — a list of changed steps grouped by status, click-to-focus in the canvas.

- [ ] **Step 1: Create the outline component**

Create `src/app/configs/WorkflowOutlineView.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowStepKind } from "@/lib/workflow-graph";

type DiffStatus = "added" | "removed" | "modified" | "unchanged";

interface DiffStep {
  id: string;
  displayName: string;
  kind: WorkflowStepKind;
  diffStatus: DiffStatus;
}

interface WorkflowOutlineViewProps {
  steps: DiffStep[];
  onNavigate: (stepId: string) => void;
}

const STATUS_ORDER: DiffStatus[] = ["added", "modified", "removed", "unchanged"];

const STATUS_LABEL: Record<DiffStatus, string> = {
  added:     "Added",
  modified:  "Modified",
  removed:   "Removed",
  unchanged: "Unchanged",
};

const STATUS_BADGE: Record<DiffStatus, string> = {
  added:     "bg-emerald-100 text-emerald-700",
  modified:  "bg-amber-100 text-amber-700",
  removed:   "bg-red-100 text-red-700",
  unchanged: "bg-slate-100 text-slate-500",
};

const KIND_LABEL: Record<WorkflowStepKind, string> = {
  approvalTask:     "Approval",
  scriptTask:       "Script",
  exclusiveGateway: "Gateway",
};

export function WorkflowOutlineView({ steps, onNavigate }: WorkflowOutlineViewProps) {
  const grouped = useMemo(() => {
    const g: Record<DiffStatus, DiffStep[]> = { added: [], modified: [], removed: [], unchanged: [] };
    for (const s of steps) g[s.diffStatus].push(s);
    return g;
  }, [steps]);

  return (
    <div className="h-full overflow-auto bg-white text-[12px]">
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <section key={status} className="border-b border-slate-100 last:border-b-0">
            <header className="sticky top-0 bg-slate-50 px-3 py-1.5 flex items-center gap-2 border-b border-slate-100">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", STATUS_BADGE[status])}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-[10px] text-slate-400">{items.length}</span>
            </header>
            <ul>
              {items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(s.id)}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 w-16 shrink-0">{KIND_LABEL[s.kind]}</span>
                    <span className="flex-1 text-slate-700 truncate">{s.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {steps.length === 0 && (
        <p className="px-3 py-4 text-[11px] text-slate-400 italic">No steps</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add displayView state + toggle to `WorkflowDiffGraphModal`**

In `src/app/compare/WorkflowDiffGraph.tsx`:

1. Add import at the top:
   ```tsx
   import { WorkflowOutlineView } from "@/app/configs/WorkflowOutlineView";
   ```

2. Add state hook alongside the others from Task 2:
   ```tsx
   const [displayView, setDisplayView] = useState<"graph" | "outline">("graph");
   const [zoomToNodeId, setZoomToNodeId] = useState<string | null>(null);
   ```

3. Add `zoomToNodeId` to the three `<DiffGraphCanvas>` call sites from Task 2 (one for merged, two for side-by-side):
   ```tsx
   zoomToNodeId={zoomToNodeId}
   ```

4. Add graph/outline toggle to the header, placed BEFORE the merged/side-by-side toggle:
   ```tsx
   <div className="flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
     {(["graph", "outline"] as const).map((v) => (
       <button
         key={v}
         type="button"
         onClick={() => setDisplayView(v)}
         className={cn(
           "px-3 py-1 transition-colors capitalize",
           displayView === v ? "bg-slate-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
         )}
       >
         {v}
       </button>
     ))}
   </div>
   ```

5. Wrap the body of the modal to branch on `displayView`. Find the block `{/* Graph area */}` from Task 2 and wrap it:

   Before (current from Task 2):
   ```tsx
   {/* Graph area */}
   <div className="flex-1 min-h-0 flex overflow-hidden bg-slate-50">
     {viewMode === "merged" ? (
       ...
     ) : (
       ...
     )}
   </div>
   ```

   After:
   ```tsx
   {displayView === "outline" ? (
     <div className="flex-1 min-h-0 overflow-hidden">
       <WorkflowOutlineView
         steps={diffData.steps}
         onNavigate={(id) => {
           setZoomToNodeId(id);
           setDisplayView("graph");
         }}
       />
     </div>
   ) : (
     <div className="flex-1 min-h-0 flex overflow-hidden bg-slate-50">
       {viewMode === "merged" ? (
         ...existing merged canvas...
       ) : (
         ...existing side-by-side canvases...
       )}
     </div>
   )}
   ```

6. Hide the graph-only toolbar controls (view mode, hide unchanged, compact, sync viewports, fit, search) when outline is active. Wrap those header buttons in a `{displayView === "graph" && (<>...</>)}` block.

- [ ] **Step 3: Lint**

Run: `npm run lint -- src/app/compare/WorkflowDiffGraph.tsx src/app/configs/WorkflowOutlineView.tsx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/configs/WorkflowOutlineView.tsx src/app/compare/WorkflowDiffGraph.tsx
git commit -m "Feat: workflow diff canvas — outline view"
```

- [ ] **Step 5: Manual verification (full spec coverage)**

In the dev server, with a workflow diff open:

1. **Journey regression** (from Task 1 check, re-verify): any journey diff still renders correctly.
2. **Graph / Outline toggle:** switch Outline — list of steps grouped by status with counts. Switch back to Graph — canvas returns.
3. **Outline row click:** clicking a row switches to Graph and zooms to that step.
4. **Merged view:** canvas renders as before. Step click → detail panel opens.
5. **Side-by-side:** two canvases; left has removed + unchanged, right has added + unchanged.
6. **Sync viewports:** on — one side follows the other. Off — independent.
7. **Hide unchanged:** only changed steps visible in both modes.
8. **Compact:** smaller nodes, positions unchanged, labels legible.
9. **Search:** sky ring on matches; canvas zooms; clear resets.
10. **Fit** button: triggers re-fit.
11. **Combined:** search + side-by-side + hide-unchanged + compact all compose without glitches.

---

## Self-Review Notes

- **Spec coverage:**
  - Goal 1 (Merged / side-by-side toggle) → Task 2.
  - Goal 2 (Sync viewports) → Task 3 Step 1 + Task 2 Step 3 (handlers).
  - Goal 3 (Hide unchanged) → Task 3 Step 1.
  - Goal 4 (Compact) → Task 3 Step 1 + Step 2 (node compact rendering).
  - Goal 5 (Search) → Task 4.
  - Goal 6 (Outline view) → Task 5.
  - Shared `DiffGraphCanvas` extraction → Task 1.
- **No placeholders:** every step shows the code or command.
- **Type consistency:** `DiffGraphCanvasProps` (Task 1) matches the consumer calls in Task 2-5. `DiffStep` shape used by `WorkflowOutlineView` (Task 5) matches the existing `DiffStep` type in `WorkflowDiffGraph.tsx`. `Viewport` imported from `@xyflow/react` consistently.
- **Scope boundary:** no changes to `SplitDiffView`, `DiffMinimap`, `DiffReport.tsx`, `WorkflowGraph.tsx` (browse), `JourneyOutlineView.tsx`, or any other unrelated file.
