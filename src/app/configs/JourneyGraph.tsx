"use client";

import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
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
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUCCESS_ID  = "e301438c-0bd0-429c-ab0c-66126501069a";
const FAILURE_ID  = "70e691a5-1e33-4ac3-a356-e7b6d60d92e0";
const NODE_W      = 175;
const NODE_H      = 64;
const TERM_SIZE   = 60;
const START_SIZE  = 48;

function journeyNodeHeight(outcomeCount: number): number {
  return Math.max(NODE_H, outcomeCount * 22 + 28);
}

function getNodeDims(node: Node): [number, number] {
  if (node.type === "journeyNode") {
    const outcomes = (node.data.outcomes as string[] | undefined) ?? [];
    return [NODE_W, journeyNodeHeight(outcomes.length)];
  }
  if (node.type === "startNode")   return [START_SIZE, START_SIZE];
  if (node.type === "successNode") return [TERM_SIZE,  TERM_SIZE];
  if (node.type === "failureNode") return [TERM_SIZE,  TERM_SIZE];
  return [NODE_W, NODE_H];
}

// ── Journey JSON shape ────────────────────────────────────────────────────────

interface JourneyJson {
  _id?: string;
  entryNodeId?: string;
  nodes?: Record<string, {
    displayName?: string;
    nodeType?: string;
    connections?: Record<string, string>;
    x: number;
    y: number;
  }>;
  staticNodes?: Record<string, { x: number; y: number }>;
}

// ── Grip icon ─────────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="3" r="1" /><circle cx="8" cy="3" r="1" />
      <circle cx="4" cy="6" r="1" /><circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9" r="1" /><circle cx="8" cy="9" r="1" />
    </svg>
  );
}

// ── Custom node components ────────────────────────────────────────────────────

function JourneyNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    nodeType?: string;
    outcomes: string[];
    isSelected?: boolean;
    isSearchMatch?: boolean;
    dragFree?: boolean;
  };
  const outcomes  = d.outcomes ?? [];
  const h         = journeyNodeHeight(outcomes.length);

  return (
    <div
      className={cn(
        "bg-white border rounded-lg shadow-sm transition-all overflow-visible",
        d.isSelected    ? "border-sky-500 ring-2 ring-sky-300 shadow-sky-100" :
        d.isSearchMatch ? "border-amber-400 ring-2 ring-amber-200" :
                          "border-slate-300"
      )}
      style={{ width: NODE_W, height: h, position: "relative" }}
    >
      {/* Drag handle strip — only visible in free-drag mode */}
      {d.dragFree && (
        <div
          className="drag-handle absolute top-0 left-0 right-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-t-lg transition-colors"
          style={{ height: 16 }}
        >
          <GripIcon />
        </div>
      )}

      <Handle type="target" position={Position.Left} style={{ top: "50%", background: "#94a3b8" }} />

      {/* Label */}
      <div
        className="px-3 pt-2"
        style={{
          paddingTop: d.dragFree ? 20 : 8,
          paddingRight: outcomes.length > 0 ? 56 : 12,
        }}
      >
        <p className="text-[11px] font-medium text-slate-700 leading-snug break-words">{d.label}</p>
        {d.nodeType && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{d.nodeType}</p>}
      </div>

      {/* Per-outcome source handles */}
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

function StartNodeComponent(_: NodeProps) {
  return (
    <div className="rounded-full flex items-center justify-center shadow font-bold text-white text-[9px] bg-emerald-500"
      style={{ width: START_SIZE, height: START_SIZE }}>
      <Handle type="source" position={Position.Right} style={{ background: "#059669" }} />
      START
    </div>
  );
}

function SuccessNodeComponent({ data }: NodeProps) {
  const d = data as { isSelected?: boolean };
  return (
    <div className={cn(
      "rounded-full border-2 flex items-center justify-center shadow-sm font-bold text-emerald-700 text-[10px] text-center leading-tight",
      d.isSelected ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200" : "bg-emerald-50 border-emerald-400"
    )} style={{ width: TERM_SIZE, height: TERM_SIZE }}>
      <Handle type="target" position={Position.Left} style={{ background: "#34d399" }} />
      ✓<br />OK
    </div>
  );
}

function FailureNodeComponent({ data }: NodeProps) {
  const d = data as { isSelected?: boolean };
  return (
    <div className={cn(
      "rounded-full border-2 flex items-center justify-center shadow-sm font-bold text-red-700 text-[10px] text-center leading-tight",
      d.isSelected ? "bg-red-100 border-red-500 ring-2 ring-red-200" : "bg-red-50 border-red-400"
    )} style={{ width: TERM_SIZE, height: TERM_SIZE }}>
      <Handle type="target" position={Position.Left} style={{ background: "#f87171" }} />
      ✗<br />Fail
    </div>
  );
}

const nodeTypes = {
  journeyNode: JourneyNodeComponent,
  startNode:   StartNodeComponent,
  successNode: SuccessNodeComponent,
  failureNode: FailureNodeComponent,
};

// ── Journey parser ────────────────────────────────────────────────────────────

function parseJourney(json: string): { nodes: Node[]; edges: Edge[] } {
  let data: JourneyJson;
  try { data = JSON.parse(json); } catch { return { nodes: [], edges: [] }; }

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  for (const [id, pos] of Object.entries(data.staticNodes ?? {})) {
    const type =
      id === "startNode" ? "startNode"   :
      id === SUCCESS_ID  ? "successNode" :
      id === FAILURE_ID  ? "failureNode" : "successNode";
    rfNodes.push({ id, type, position: { x: pos.x, y: pos.y },
      data: { label: id === "startNode" ? "Start" : id === SUCCESS_ID ? "Success" : id === FAILURE_ID ? "Failure" : "End", outcomes: [] } });
  }

  if (data.entryNodeId && data.staticNodes?.["startNode"]) {
    rfEdges.push({ id: "__start__", source: "startNode", target: data.entryNodeId,
      type: "smoothstep", style: { stroke: "#10b981", strokeWidth: 2 } });
  }

  for (const [id, node] of Object.entries(data.nodes ?? {})) {
    const outcomes = Object.keys(node.connections ?? {});
    rfNodes.push({ id, type: "journeyNode", position: { x: 0, y: 0 },
      data: { label: node.displayName ?? node.nodeType ?? id.slice(0, 8), nodeType: node.nodeType, outcomes } });

    for (const [outcomeId, targetId] of Object.entries(node.connections ?? {})) {
      const toSuccess = targetId === SUCCESS_ID;
      const toFailure = targetId === FAILURE_ID;
      rfEdges.push({
        id: `${id}--${outcomeId}`,
        source: id, sourceHandle: outcomeId,
        target: targetId,
        label: outcomeId === "outcome" ? undefined : outcomeId,
        type: "smoothstep",
        style: { stroke: toFailure ? "#f87171" : toSuccess ? "#34d399" : "#64748b", strokeWidth: 1.5 },
        labelStyle: { fontSize: 9, fill: "#64748b" },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
        labelBgPadding: [3, 5] as [number, number],
        labelBgBorderRadius: 3,
      });
    }
  }

  return { nodes: rfNodes, edges: rfEdges };
}

// ── Dagre layout ──────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 160, marginx: 40, marginy: 40 });
  nodes.forEach((n) => { const [w, h] = getNodeDims(n); g.setNode(n.id, { width: w, height: h }); });
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    const [w, h] = getNodeDims(n);
    return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
  });
}

// ── Path tracing ──────────────────────────────────────────────────────────────

function getConnected(nodeId: string, edges: Edge[]) {
  const ancestors = new Set<string>();
  const descendants = new Set<string>();
  let queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.target === cur && !ancestors.has(e.source)) { ancestors.add(e.source); queue.push(e.source); }
    }
  }
  queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.source === cur && !descendants.has(e.target)) { descendants.add(e.target); queue.push(e.target); }
    }
  }
  return { ancestors, descendants };
}

// ── Panels ────────────────────────────────────────────────────────────────────

function SearchPanel({ query, setQuery, matchCount }: { query: string; setQuery: (q: string) => void; matchCount: number }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2">
      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes…"
        className="text-xs w-36 outline-none text-slate-700 placeholder-slate-400 bg-transparent" />
      {query && (
        <>
          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{matchCount} match{matchCount !== 1 ? "es" : ""}</span>
          <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

function DragControls({ dragFree, onToggle, onReset }: { dragFree: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        title={dragFree ? "Lock layout (disable drag)" : "Unlock layout (enable drag)"}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors",
          dragFree
            ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
            : "text-slate-500 hover:bg-slate-100"
        )}
      >
        {dragFree ? (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 0 1 8 0m-4 8v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />
            </svg>
            Free
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
            </svg>
            Locked
          </>
        )}
      </button>

      {dragFree && (
        <>
          <div className="w-px h-4 bg-slate-200" />
          <button
            type="button"
            onClick={onReset}
            title="Reset to auto layout"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-[10px] text-slate-500 space-y-1.5">
      <p className="font-semibold text-slate-600 text-[11px]">Legend</p>
      <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-500 inline-block" /><span>Transition</span></div>
      <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-400 inline-block" /><span>→ Success</span></div>
      <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-400 inline-block" /><span>→ Failure</span></div>
      <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block" /><span>Hover edge</span></div>
      <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-500 inline-block" /><span>Click edge (pinned)</span></div>
      <p className="pt-1 border-t border-slate-100 text-slate-400">Click node → trace path</p>
    </div>
  );
}

// ── Inner graph ───────────────────────────────────────────────────────────────

function JourneyGraphInner({ json }: { json: string }) {
  const { fitView } = useReactFlow();

  // node positions are managed by RF so drag positions persist
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId,  setHoveredEdgeId]  = useState<string | null>(null);
  const [pinnedEdgeId,   setPinnedEdgeId]   = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]     = useState("");
  const [dragFree,       setDragFree]        = useState(false);
  const [layoutKey,      setLayoutKey]       = useState(0); // increment to re-run dagre

  // Parse + dagre — re-runs when json or layoutKey changes
  const { dagreNodes, baseEdges } = useMemo(() => {
    const { nodes, edges } = parseJourney(json);
    return { dagreNodes: applyDagreLayout(nodes, edges), baseEdges: edges };
  }, [json, layoutKey]);

  // Push dagre positions into RF state; reset interaction state
  useEffect(() => {
    setRfNodes(dagreNodes);
    setSelectedNodeId(null);
    setSearchQuery("");
    setHoveredEdgeId(null);
    setPinnedEdgeId(null);
    setDragFree(false);
  }, [dagreNodes, setRfNodes]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(rfNodes.filter((n) => String(n.data.label ?? "").toLowerCase().includes(q)).map((n) => n.id));
  }, [searchQuery, rfNodes]);

  useEffect(() => {
    if (searchMatches.size === 0) return;
    const t = setTimeout(() => fitView({ nodes: [...searchMatches].map((id) => ({ id })), duration: 500, padding: 0.4 }), 50);
    return () => clearTimeout(t);
  }, [searchMatches, fitView]);

  // Path tracing
  const { ancestors, descendants } = useMemo(() => {
    if (!selectedNodeId) return { ancestors: new Set<string>(), descendants: new Set<string>() };
    return getConnected(selectedNodeId, baseEdges);
  }, [selectedNodeId, baseEdges]);

  const highlighted = useMemo(() => {
    if (!selectedNodeId) return null;
    return new Set([selectedNodeId, ...ancestors, ...descendants]);
  }, [selectedNodeId, ancestors, descendants]);

  // Styled nodes — apply visual state on top of RF-managed positions
  const displayNodes = useMemo<Node[]>(() => rfNodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      isSelected:    n.id === selectedNodeId,
      isSearchMatch: searchMatches.has(n.id),
      dragFree,
    },
    style: {
      opacity: highlighted ? (highlighted.has(n.id) ? 1 : 0.15) : 1,
      transition: "opacity 0.2s",
    },
    draggable: dragFree,
  })), [rfNodes, selectedNodeId, highlighted, searchMatches, dragFree]);

  // Styled edges
  const displayEdges = useMemo<Edge[]>(() => {
    const activeEdgeId = hoveredEdgeId ?? pinnedEdgeId;
    return baseEdges.map((e) => {
      const isHovered = e.id === hoveredEdgeId;
      const isPinned  = e.id === pinnedEdgeId;
      const isActive  = e.id === activeEdgeId;
      const onPath    = highlighted ? (highlighted.has(e.source) && highlighted.has(e.target)) : true;

      let opacity = 1;
      if (activeEdgeId)  opacity = isActive ? 1 : 0.06;
      else if (highlighted) opacity = onPath ? 1 : 0.06;

      const baseStroke = (e.style?.stroke as string | undefined) ?? "#64748b";
      const stroke = isHovered ? "#3b82f6" : isPinned ? "#7c3aed" : baseStroke;

      return {
        ...e,
        style: {
          ...e.style, opacity, strokeWidth: isActive ? 3 : 1.5, stroke,
          transition: "opacity 0.15s, stroke-width 0.15s",
        },
        animated: !activeEdgeId && onPath && !!highlighted,
        label: opacity < 0.5 ? undefined : e.label,
      };
    });
  }, [baseEdges, highlighted, hoveredEdgeId, pinnedEdgeId]);

  const handleNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (!dragFree) setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, [dragFree]);

  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((_e, edge) => setHoveredEdgeId(edge.id), []);
  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => setHoveredEdgeId(null), []);
  const handleEdgeClick: EdgeMouseHandler      = useCallback((_e, edge) => setPinnedEdgeId((prev) => (prev === edge.id ? null : edge.id)), []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setPinnedEdgeId(null);
  }, []);

  if (rfNodes.length === 0 && dagreNodes.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-slate-400">Unable to parse journey data</div>;
  }

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={displayEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={handleNodeClick}
      onEdgeMouseEnter={handleEdgeMouseEnter}
      onEdgeMouseLeave={handleEdgeMouseLeave}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      nodesDraggable={dragFree}
      snapToGrid={dragFree}
      snapGrid={[20, 20]}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Panel position="top-left" className="flex flex-col gap-2">
        <SearchPanel query={searchQuery} setQuery={setSearchQuery} matchCount={searchMatches.size} />
        <DragControls dragFree={dragFree} onToggle={() => setDragFree((f) => !f)} onReset={() => setLayoutKey((k) => k + 1)} />
      </Panel>
      <Panel position="top-right">
        <Legend />
      </Panel>
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls />
      <MiniMap
        nodeColor={(n) =>
          n.type === "successNode" ? "#34d399" :
          n.type === "failureNode" ? "#f87171" :
          n.type === "startNode"   ? "#10b981" : "#cbd5e1"
        }
        zoomable pannable
      />
    </ReactFlow>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function JourneyGraph({ json }: { json: string }) {
  return (
    <ReactFlowProvider>
      <JourneyGraphInner json={json} />
    </ReactFlowProvider>
  );
}
