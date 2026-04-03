"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ── Well-known static node IDs (standard across all AIC journeys) ─────────────
const SUCCESS_ID = "e301438c-0bd0-429c-ab0c-66126501069a";
const FAILURE_ID = "70e691a5-1e33-4ac3-a356-e7b6d60d92e0";

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
  const d = data as { label: string; nodeType?: string };
  return (
    <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm min-w-[130px] max-w-[200px]">
      <Handle type="target" position={Position.Left} style={{ background: "#94a3b8" }} />
      <p className="text-[11px] font-medium text-slate-700 leading-snug truncate">{d.label}</p>
      {d.nodeType && (
        <p className="text-[9px] text-slate-400 truncate mt-0.5">{d.nodeType}</p>
      )}
      <Handle type="source" position={Position.Right} style={{ background: "#94a3b8" }} />
    </div>
  );
}

function StartNodeComponent(_: NodeProps) {
  return (
    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow text-[9px] font-bold text-white">
      <Handle type="source" position={Position.Right} style={{ background: "#059669" }} />
      START
    </div>
  );
}

function SuccessNodeComponent(_: NodeProps) {
  return (
    <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center shadow-sm text-[10px] font-bold text-emerald-700 text-center leading-tight">
      <Handle type="target" position={Position.Left} style={{ background: "#34d399" }} />
      ✓
      <br />
      Success
    </div>
  );
}

function FailureNodeComponent(_: NodeProps) {
  return (
    <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-400 flex items-center justify-center shadow-sm text-[10px] font-bold text-red-700 text-center leading-tight">
      <Handle type="target" position={Position.Left} style={{ background: "#f87171" }} />
      ✗
      <br />
      Failure
    </div>
  );
}

const nodeTypes = {
  journeyNode: JourneyNodeComponent,
  startNode: StartNodeComponent,
  successNode: SuccessNodeComponent,
  failureNode: FailureNodeComponent,
};

// ── Parser ────────────────────────────────────────────────────────────────────

function parseJourney(json: string): { nodes: Node[]; edges: Edge[] } {
  let data: JourneyJson;
  try { data = JSON.parse(json); } catch { return { nodes: [], edges: [] }; }

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Static nodes (Start, Success, Failure, unknown terminals)
  for (const [id, pos] of Object.entries(data.staticNodes ?? {})) {
    if (id === "startNode") {
      rfNodes.push({ id, type: "startNode", position: { x: pos.x, y: pos.y }, data: { label: "Start" } });
    } else if (id === SUCCESS_ID) {
      rfNodes.push({ id, type: "successNode", position: { x: pos.x, y: pos.y }, data: { label: "Success" } });
    } else if (id === FAILURE_ID) {
      rfNodes.push({ id, type: "failureNode", position: { x: pos.x, y: pos.y }, data: { label: "Failure" } });
    } else {
      // Unknown terminal — render as a neutral success-shaped node
      rfNodes.push({ id, type: "successNode", position: { x: pos.x, y: pos.y }, data: { label: "End" } });
    }
  }

  // Synthetic edge: startNode → entryNodeId
  if (data.entryNodeId && data.staticNodes?.["startNode"]) {
    rfEdges.push({
      id: "__start-entry__",
      source: "startNode",
      target: data.entryNodeId,
      type: "smoothstep",
      style: { stroke: "#10b981", strokeWidth: 2 },
    });
  }

  // Regular nodes + their outgoing edges
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
      const isFailure = targetId === FAILURE_ID;
      const isSuccess = targetId === SUCCESS_ID;
      rfEdges.push({
        id: `${id}--${outcomeId}`,
        source: id,
        target: targetId,
        label: outcomeId === "outcome" ? undefined : outcomeId,
        type: "smoothstep",
        style: {
          stroke: isFailure ? "#f87171" : isSuccess ? "#34d399" : "#94a3b8",
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

// ── Main component ────────────────────────────────────────────────────────────

export function JourneyGraph({ json }: { json: string }) {
  const { nodes, edges } = useMemo(() => parseJourney(json), [json]);

  if (nodes.length === 0) {
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
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.15}
      maxZoom={2}
    >
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
