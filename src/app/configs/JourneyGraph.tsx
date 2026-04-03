"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUCCESS_ID = "e301438c-0bd0-429c-ab0c-66126501069a";
const FAILURE_ID = "70e691a5-1e33-4ac3-a356-e7b6d60d92e0";

const NODE_W = 170;
const NODE_H = 64;
const TERM_SIZE = 60;
const START_SIZE = 48;

const NODE_DIMS: Record<string, [number, number]> = {
  journeyNode: [NODE_W, NODE_H],
  startNode:   [START_SIZE, START_SIZE],
  successNode: [TERM_SIZE, TERM_SIZE],
  failureNode: [TERM_SIZE, TERM_SIZE],
};

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

// ── Custom node components ────────────────────────────────────────────────────

function JourneyNodeComponent({ data }: NodeProps) {
  const d = data as { label: string; nodeType?: string; isSelected?: boolean; isSearchMatch?: boolean };
  return (
    <div className={cn(
      "bg-white border rounded-lg px-3 py-2 shadow-sm transition-all",
      d.isSelected       ? "border-sky-500 ring-2 ring-sky-300 shadow-sky-100" :
      d.isSearchMatch    ? "border-amber-400 ring-2 ring-amber-200" :
                           "border-slate-300"
    )} style={{ width: NODE_W, minHeight: NODE_H }}>
      <Handle type="target" position={Position.Left} style={{ background: "#94a3b8" }} />
      <p className="text-[11px] font-medium text-slate-700 leading-snug break-words">{d.label}</p>
      {d.nodeType && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{d.nodeType}</p>}
      <Handle type="source" position={Position.Right} style={{ background: "#94a3b8" }} />
    </div>
  );
}

function StartNodeComponent({ data }: NodeProps) {
  const d = data as { isSearchMatch?: boolean };
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center shadow font-bold text-white text-[9px]",
      d.isSearchMatch ? "bg-emerald-400 ring-2 ring-amber-300" : "bg-emerald-500"
    )} style={{ width: START_SIZE, height: START_SIZE }}>
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

// ── Journey parser (no positions yet) ────────────────────────────────────────

function parseJourney(json: string): { nodes: Node[]; edges: Edge[] } {
  let data: JourneyJson;
  try { data = JSON.parse(json); } catch { return { nodes: [], edges: [] }; }

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  for (const [id, pos] of Object.entries(data.staticNodes ?? {})) {
    const type =
      id === "startNode"  ? "startNode"   :
      id === SUCCESS_ID   ? "successNode" :
      id === FAILURE_ID   ? "failureNode" : "successNode";
    rfNodes.push({ id, type, position: { x: pos.x, y: pos.y }, data: { label: id === "startNode" ? "Start" : id === SUCCESS_ID ? "Success" : id === FAILURE_ID ? "Failure" : "End" } });
  }

  if (data.entryNodeId && data.staticNodes?.["startNode"]) {
    rfEdges.push({
      id: "__start__",
      source: "startNode",
      target: data.entryNodeId,
      type: "smoothstep",
      style: { stroke: "#10b981", strokeWidth: 2 },
    });
  }

  for (const [id, node] of Object.entries(data.nodes ?? {})) {
    rfNodes.push({
      id,
      type: "journeyNode",
      position: { x: node.x, y: node.y },
      data: {
        label: node.displayName ?? node.nodeType ?? id.slice(0, 8),
        nodeType: node.nodeType,
      },
    });

    for (const [outcomeId, targetId] of Object.entries(node.connections ?? {})) {
      const toSuccess = targetId === SUCCESS_ID;
      const toFailure = targetId === FAILURE_ID;
      rfEdges.push({
        id: `${id}--${outcomeId}`,
        source: id,
        target: targetId,
        label: outcomeId === "outcome" ? undefined : outcomeId,
        type: "smoothstep",
        style: {
          stroke: toFailure ? "#f87171" : toSuccess ? "#34d399" : "#94a3b8",
          strokeWidth: 1.5,
        },
        labelStyle: { fontSize: 9, fill: "#64748b" },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.85 },
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
  g.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 90, marginx: 40, marginy: 40 });

  nodes.forEach((n) => {
    const [w, h] = NODE_DIMS[n.type ?? "journeyNode"] ?? [NODE_W, NODE_H];
    g.setNode(n.id, { width: w, height: h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    const [w, h] = NODE_DIMS[n.type ?? "journeyNode"] ?? [NODE_W, NODE_H];
    return { ...n, position: { x: x - w / 2, y: y - h / 2 } };
  });
}

// ── Path tracing helpers ──────────────────────────────────────────────────────

function getConnected(nodeId: string, edges: Edge[]): { ancestors: Set<string>; descendants: Set<string> } {
  const ancestors = new Set<string>();
  const descendants = new Set<string>();

  // BFS backwards (ancestors)
  const queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.target === cur && !ancestors.has(e.source)) {
        ancestors.add(e.source);
        queue.push(e.source);
      }
    }
  }

  // BFS forwards (descendants)
  queue.push(nodeId);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.source === cur && !descendants.has(e.target)) {
        descendants.add(e.target);
        queue.push(e.target);
      }
    }
  }

  return { ancestors, descendants };
}

// ── Search panel (inside ReactFlow, uses useReactFlow) ────────────────────────

function SearchPanel({
  query, setQuery, matchCount,
}: { query: string; setQuery: (q: string) => void; matchCount: number }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2">
      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes…"
        className="text-xs w-36 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
      />
      {query && (
        <>
          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
            {matchCount} match{matchCount !== 1 ? "es" : ""}
          </span>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-[10px] text-slate-500 space-y-1.5">
      <p className="font-semibold text-slate-600 text-[11px]">Legend</p>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-slate-400 inline-block" />
        <span>Transition</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
        <span>→ Success</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-red-400 inline-block" />
        <span>→ Failure</span>
      </div>
      <p className="pt-0.5 text-slate-400 border-t border-slate-100">Click node to trace path</p>
    </div>
  );
}

// ── Inner graph component (has access to useReactFlow) ────────────────────────

function JourneyGraphInner({ json }: { json: string }) {
  const { fitView } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Parse + layout (recomputed only when json changes)
  const { layoutNodes, baseEdges } = useMemo(() => {
    const { nodes, edges } = parseJourney(json);
    return { layoutNodes: applyDagreLayout(nodes, edges), baseEdges: edges };
  }, [json]);

  // Reset selection when journey changes
  useEffect(() => {
    setSelectedNodeId(null);
    setSearchQuery("");
  }, [json]);

  // Focus search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(layoutNodes.filter((n) => String(n.data.label ?? "").toLowerCase().includes(q)).map((n) => n.id));
  }, [searchQuery, layoutNodes]);

  useEffect(() => {
    if (searchMatches.size === 0) return;
    const ids = [...searchMatches].map((id) => ({ id }));
    // small delay so fitView runs after render
    const t = setTimeout(() => fitView({ nodes: ids, duration: 500, padding: 0.4 }), 50);
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

  // Apply visual states to nodes
  const nodes = useMemo<Node[]>(() => layoutNodes.map((n) => {
    const isSelected    = n.id === selectedNodeId;
    const isHighlighted = highlighted ? highlighted.has(n.id) : true;
    const isSearchMatch = searchMatches.has(n.id);
    return {
      ...n,
      data: { ...n.data, isSelected, isSearchMatch },
      style: { opacity: isHighlighted ? 1 : 0.15, transition: "opacity 0.2s" },
    };
  }), [layoutNodes, selectedNodeId, highlighted, searchMatches]);

  // Apply visual states to edges
  const edges = useMemo<Edge[]>(() => baseEdges.map((e) => {
    const isOnPath = highlighted
      ? highlighted.has(e.source) && highlighted.has(e.target)
      : true;
    return {
      ...e,
      style: { ...e.style, opacity: isOnPath ? 1 : 0.08, transition: "opacity 0.2s" },
      animated: isOnPath && !!highlighted,
    };
  }), [baseEdges, highlighted]);

  const handleNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => setSelectedNodeId(null), []);

  if (layoutNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Unable to parse journey data
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Panel position="top-left">
        <SearchPanel query={searchQuery} setQuery={setSearchQuery} matchCount={searchMatches.size} />
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
        zoomable
        pannable
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
