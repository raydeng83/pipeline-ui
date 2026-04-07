"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  type Node,
  type Edge,
  type NodeProps,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";
import {
  parseMergedDiffGraph,
  parseSingleSideGraph,
  parseNodesOnlyGraph,
  type DiffStatus,
  DIFF_SUCCESS_ID,
  DIFF_FAILURE_ID,
  DIFF_NODE_W,
  DIFF_TERM_SIZE,
  DIFF_START_SIZE,
  diffNodeHeight,
} from "@/lib/journey-diff-graph";
import type { JourneyNodeInfo } from "@/lib/diff-types";

// ── Custom node components ────────────────────────────────────────────────────

function statusBorderBg(status: DiffStatus): string {
  switch (status) {
    case "modified":  return "border-amber-400 bg-amber-50";
    case "added":     return "border-emerald-400 bg-emerald-50";
    case "removed":   return "border-red-400 bg-red-50 border-dashed opacity-70";
    case "unchanged": return "border-slate-300 bg-white";
  }
}

function statusBadgeClass(status: DiffStatus): string {
  switch (status) {
    case "modified":  return "bg-amber-100 text-amber-700";
    case "added":     return "bg-emerald-100 text-emerald-700";
    case "removed":   return "bg-red-100 text-red-700";
    case "unchanged": return "bg-slate-100 text-slate-500";
  }
}

function statusBadgeLabel(status: DiffStatus): string {
  switch (status) {
    case "modified":  return "M";
    case "added":     return "A";
    case "removed":   return "D";
    case "unchanged": return "";
  }
}

function JourneyDiffNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    nodeType?: string;
    outcomes: string[];
    diffStatus: DiffStatus;
  };
  const outcomes  = d.outcomes ?? [];
  const h         = diffNodeHeight(outcomes.length);
  const status    = d.diffStatus ?? "unchanged";
  const badgeLabel = statusBadgeLabel(status);

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm overflow-visible relative",
        statusBorderBg(status),
      )}
      style={{ width: DIFF_NODE_W, height: h }}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%", background: "#94a3b8" }} />

      {/* Status badge */}
      {badgeLabel && (
        <span
          className={cn(
            "absolute top-0.5 right-0.5 text-[9px] font-bold px-1 rounded",
            statusBadgeClass(status),
          )}
        >
          {badgeLabel}
        </span>
      )}

      <div className="px-3 pt-2" style={{ paddingRight: outcomes.length > 0 ? 56 : 20 }}>
        <p className="text-[11px] font-medium text-slate-700 leading-snug break-words">{d.label}</p>
        {d.nodeType && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{d.nodeType}</p>}
      </div>

      {outcomes.length > 0
        ? outcomes.map((outcome, i) => {
            const topPct = `${((i + 0.5) / outcomes.length) * 100}%`;
            return (
              <Fragment key={outcome}>
                <span style={{
                  position: "absolute", right: 14, top: topPct,
                  transform: "translateY(-50%)", fontSize: 8, color: "#94a3b8",
                  fontFamily: "monospace", whiteSpace: "nowrap",
                  maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis",
                  pointerEvents: "none",
                }}>
                  {outcome}
                </span>
                <Handle id={outcome} type="source" position={Position.Right}
                  style={{ top: topPct, background: "#94a3b8" }} />
              </Fragment>
            );
          })
        : <Handle type="source" position={Position.Right} style={{ top: "50%", background: "#94a3b8" }} />
      }
    </div>
  );
}

function DiffStartNodeComponent(_: NodeProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center shadow font-bold text-white text-[9px] bg-emerald-500"
      style={{ width: DIFF_START_SIZE, height: DIFF_START_SIZE }}
    >
      <Handle type="source" position={Position.Right} style={{ background: "#059669" }} />
      START
    </div>
  );
}

function DiffSuccessNodeComponent(_: NodeProps) {
  return (
    <div
      className="rounded-full border-2 border-emerald-400 bg-emerald-50 flex items-center justify-center shadow-sm font-bold text-emerald-700 text-[10px] text-center leading-tight"
      style={{ width: DIFF_TERM_SIZE, height: DIFF_TERM_SIZE }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#34d399" }} />
      ✓<br />OK
    </div>
  );
}

function DiffFailureNodeComponent(_: NodeProps) {
  return (
    <div
      className="rounded-full border-2 border-red-400 bg-red-50 flex items-center justify-center shadow-sm font-bold text-red-700 text-[10px] text-center leading-tight"
      style={{ width: DIFF_TERM_SIZE, height: DIFF_TERM_SIZE }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#f87171" }} />
      ✗<br />Fail
    </div>
  );
}

const nodeTypes = {
  journeyDiffNode: JourneyDiffNodeComponent,
  startNode:       DiffStartNodeComponent,
  successNode:     DiffSuccessNodeComponent,
  failureNode:     DiffFailureNodeComponent,
};

// ── Dagre layout ──────────────────────────────────────────────────────────────

function getNodeDims(node: Node): [number, number] {
  if (node.type === "startNode")   return [DIFF_START_SIZE, DIFF_START_SIZE];
  if (node.type === "successNode") return [DIFF_TERM_SIZE,  DIFF_TERM_SIZE];
  if (node.type === "failureNode") return [DIFF_TERM_SIZE,  DIFF_TERM_SIZE];
  const outcomes = (node.data.outcomes as string[] | undefined) ?? [];
  return [DIFF_NODE_W, diffNodeHeight(outcomes.length)];
}

function applyLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 160, marginx: 40, marginy: 40 });

  nodes.forEach((n) => {
    const [w, h] = getNodeDims(n);
    g.setNode(n.id, { width: w, height: h });
  });
  edges.forEach((e) => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  });
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    if (!pos) return n;
    const [w, h] = getNodeDims(n);
    return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
  });
}

// ── Legend ────────────────────────────────────────────────────────────────────

function DiffLegend() {
  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] text-slate-300 backdrop-blur-sm">
      {([
        { label: "Added",     border: "border-emerald-400", bg: "bg-emerald-50" },
        { label: "Removed",   border: "border-red-400",     bg: "bg-red-50 border-dashed" },
        { label: "Modified",  border: "border-amber-400",   bg: "bg-amber-50" },
        { label: "Unchanged", border: "border-slate-300",   bg: "bg-white" },
      ] as const).map(({ label, border, bg }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={cn("inline-block w-3.5 h-3.5 rounded border", border, bg)} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ── DiffGraphCanvasInner ──────────────────────────────────────────────────────

interface DiffGraphCanvasInnerProps {
  baseNodes: Node[];
  baseEdges: Edge[];
  hideUnchanged: boolean;
  fitKey: number;
  externalViewport: Viewport | null;
  onViewportChange: (vp: Viewport) => void;
}

function DiffGraphCanvasInner({
  baseNodes,
  baseEdges,
  hideUnchanged,
  fitKey,
  externalViewport,
  onViewportChange,
}: DiffGraphCanvasInnerProps) {
  const { fitView, setViewport } = useReactFlow();

  const layoutedNodes = useMemo(
    () => applyLayout(baseNodes, baseEdges),
    [baseNodes, baseEdges],
  );

  const [nodes, setNodes] = useNodesState(layoutedNodes);

  // Sync nodes when layoutedNodes changes and fit view
  useEffect(() => {
    setNodes(layoutedNodes);
    const t = setTimeout(() => { void fitView({ duration: 200 }); }, 80);
    return () => clearTimeout(t);
  }, [layoutedNodes, setNodes, fitView]);

  // Fit view when fitKey changes
  useEffect(() => {
    void fitView({ duration: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Sync external viewport
  useEffect(() => {
    if (externalViewport) {
      setViewport(externalViewport, { duration: 0 });
    }
  }, [externalViewport, setViewport]);

  // Apply hideUnchanged filter
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

  const miniMapNodeColor = useCallback((n: Node): string => {
    switch (n.data.diffStatus as DiffStatus) {
      case "added":     return "#10b981";
      case "removed":   return "#ef4444";
      case "modified":  return "#f59e0b";
      default:          return "#94a3b8";
    }
  }, []);

  return (
    <ReactFlow
      nodes={filteredNodes}
      edges={filteredEdges}
      nodeTypes={nodeTypes}
      onMove={(_, vp) => onViewportChange(vp)}
      nodesDraggable
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="#334155" gap={20} />
      <Controls showInteractive={false} />
      <MiniMap nodeColor={miniMapNodeColor} style={{ background: "#1e293b" }} />
      <Panel position="bottom-right">
        <DiffLegend />
      </Panel>
    </ReactFlow>
  );
}

// ── DiffGraphCanvas ───────────────────────────────────────────────────────────

interface DiffGraphCanvasProps extends DiffGraphCanvasInnerProps {
  className?: string;
}

function DiffGraphCanvas({ className, ...innerProps }: DiffGraphCanvasProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ReactFlowProvider>
        <DiffGraphCanvasInner {...innerProps} />
      </ReactFlowProvider>
    </div>
  );
}

// ── JourneyDiffGraphModal ─────────────────────────────────────────────────────

export interface JourneyDiffGraphModalProps {
  journeyName: string;
  localContent?: string;
  remoteContent?: string;
  nodeInfos: JourneyNodeInfo[];
  sourceLabel: string;
  targetLabel: string;
  onClose: () => void;
}

export function JourneyDiffGraphModal({
  journeyName,
  localContent,
  remoteContent,
  nodeInfos,
  sourceLabel,
  targetLabel,
  onClose,
}: JourneyDiffGraphModalProps) {
  const [viewMode, setViewMode]         = useState<"merged" | "side-by-side">("merged");
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [syncViewports, setSyncViewports] = useState(true);
  const [fitKey, setFitKey]             = useState(0);

  const [leftExternalVP,  setLeftExternalVP]  = useState<Viewport | null>(null);
  const [rightExternalVP, setRightExternalVP] = useState<Viewport | null>(null);
  const syncSource = useRef<"left" | "right" | null>(null);

  const hasContent = !!(localContent || remoteContent);
  const nodesOnly  = !hasContent && nodeInfos.length > 0;

  // ESC closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Build nodeStatusMap
  const nodeStatusMap = useMemo(() => {
    const m = new Map<string, DiffStatus>();
    for (const n of nodeInfos) m.set(n.uuid, n.status);
    return m;
  }, [nodeInfos]);

  // Build all graphs
  const { mergedNodes, mergedEdges, localNodes, localEdges, remoteNodes, remoteEdges } =
    useMemo(() => {
      if (!hasContent) {
        const { nodes, edges } = parseNodesOnlyGraph(
          nodeInfos.map((n) => ({ ...n, status: n.status })),
        );
        return {
          mergedNodes: nodes, mergedEdges: edges,
          localNodes:  nodes, localEdges:  edges,
          remoteNodes: nodes, remoteEdges: edges,
        };
      }

      const merged = parseMergedDiffGraph(localContent, remoteContent, nodeStatusMap);
      const local  = localContent
        ? parseSingleSideGraph(localContent,  nodeStatusMap, "local")
        : { nodes: [] as Node[], edges: [] as Edge[] };
      const remote = remoteContent
        ? parseSingleSideGraph(remoteContent, nodeStatusMap, "remote")
        : { nodes: [] as Node[], edges: [] as Edge[] };

      return {
        mergedNodes: merged.nodes, mergedEdges: merged.edges,
        localNodes:  local.nodes,  localEdges:  local.edges,
        remoteNodes: remote.nodes, remoteEdges: remote.edges,
      };
    }, [hasContent, localContent, remoteContent, nodeInfos, nodeStatusMap]);

  const handleLeftMove = useCallback((vp: Viewport) => {
    if (!syncViewports || syncSource.current === "left") return;
    syncSource.current = "right";
    setRightExternalVP(vp);
    setTimeout(() => { syncSource.current = null; }, 150);
  }, [syncViewports]);

  const handleRightMove = useCallback((vp: Viewport) => {
    if (!syncViewports || syncSource.current === "right") return;
    syncSource.current = "left";
    setLeftExternalVP(vp);
    setTimeout(() => { syncSource.current = null; }, 150);
  }, [syncViewports]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="text-sm font-semibold text-slate-100 truncate flex-1 min-w-0" title={journeyName}>
          {journeyName}
        </span>
        {nodesOnly && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 shrink-0">
            nodes only
          </span>
        )}

        {/* View mode toggle */}
        <div className="flex rounded border border-slate-600 overflow-hidden text-[11px] shrink-0">
          {(["merged", "side-by-side"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={cn(
                "px-3 py-1 transition-colors capitalize",
                viewMode === m
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
              )}
            >
              {m === "side-by-side" ? "Side by side" : "Merged"}
            </button>
          ))}
        </div>

        {/* Hide unchanged */}
        <button
          type="button"
          onClick={() => setHideUnchanged((v) => !v)}
          title="Hide unchanged nodes"
          className={cn(
            "px-2.5 py-1 text-[11px] rounded border transition-colors shrink-0",
            hideUnchanged
              ? "bg-sky-600 text-white border-sky-600"
              : "text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-500",
          )}
        >
          Hide unchanged
        </button>

        {/* Sync viewports (side-by-side only) */}
        {viewMode === "side-by-side" && (
          <button
            type="button"
            onClick={() => setSyncViewports((v) => !v)}
            title="Sync viewports between panels"
            className={cn(
              "px-2.5 py-1 text-[11px] rounded border transition-colors shrink-0",
              syncViewports
                ? "bg-sky-600 text-white border-sky-600"
                : "text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-500",
            )}
          >
            Sync viewports
          </button>
        )}

        {/* Fit view */}
        <button
          type="button"
          onClick={() => setFitKey((k) => k + 1)}
          title="Fit view"
          className="text-slate-400 hover:text-sky-400 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          title="Close (Esc)"
          className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex">
        {viewMode === "merged" ? (
          <DiffGraphCanvas
            baseNodes={mergedNodes}
            baseEdges={mergedEdges}
            hideUnchanged={hideUnchanged}
            fitKey={fitKey}
            externalViewport={null}
            onViewportChange={() => {}}
          />
        ) : (
          <>
            {/* Left panel (local / source) */}
            <div className="flex-1 min-w-0 relative border-r border-slate-700">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-slate-800/90 text-slate-300 text-[10px] px-2 py-1 rounded pointer-events-none">
                {sourceLabel}
              </span>
              <DiffGraphCanvas
                baseNodes={localNodes}
                baseEdges={localEdges}
                hideUnchanged={hideUnchanged}
                fitKey={fitKey}
                externalViewport={leftExternalVP}
                onViewportChange={handleLeftMove}
              />
            </div>

            {/* Right panel (remote / target) */}
            <div className="flex-1 min-w-0 relative">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-slate-800/90 text-slate-300 text-[10px] px-2 py-1 rounded pointer-events-none">
                {targetLabel}
              </span>
              <DiffGraphCanvas
                baseNodes={remoteNodes}
                baseEdges={remoteEdges}
                hideUnchanged={hideUnchanged}
                fitKey={fitKey}
                externalViewport={rightExternalVP}
                onViewportChange={handleRightMove}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
