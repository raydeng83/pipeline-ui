"use client";

import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { parseWorkflowData, type WorkflowData, type WorkflowStepKind } from "@/lib/workflow-graph";
import type { ViewableFile } from "@/app/api/push/item/route";

// ── Sizing ────────────────────────────────────────────────────────────────────

const NODE_W     = 180;
const NODE_H     = 64;
const CIRCLE_SZ  = 44;

// ── Node components ───────────────────────────────────────────────────────────

function StartNode() {
  return (
    <div
      className="rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center shadow"
      style={{ width: CIRCLE_SZ, height: CIRCLE_SZ }}
    >
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      <Handle type="source" position={Position.Right} style={{ background: "#10b981" }} />
    </div>
  );
}

function EndNode() {
  return (
    <div
      className="rounded-full bg-slate-600 border-2 border-slate-700 flex items-center justify-center shadow"
      style={{ width: CIRCLE_SZ, height: CIRCLE_SZ }}
    >
      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
      <Handle type="target" position={Position.Left} style={{ background: "#475569" }} />
    </div>
  );
}

const KIND_STYLE: Record<WorkflowStepKind, { border: string; bg: string; badge: string; label: string; icon: React.ReactNode }> = {
  approvalTask: {
    border: "border-blue-300",
    bg:     "bg-blue-50",
    badge:  "bg-blue-100 text-blue-700",
    label:  "Approval",
    icon: (
      <svg className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  scriptTask: {
    border: "border-violet-300",
    bg:     "bg-violet-50",
    badge:  "bg-violet-100 text-violet-700",
    label:  "Script",
    icon: (
      <svg className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
  exclusiveGateway: {
    border: "border-amber-300",
    bg:     "bg-amber-50",
    badge:  "bg-amber-100 text-amber-700",
    label:  "Gateway",
    icon: (
      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
};

function StepNode({ data }: NodeProps) {
  const d      = data as { displayName: string; kind: WorkflowStepKind };
  const styles = KIND_STYLE[d.kind] ?? KIND_STYLE.scriptTask;
  return (
    <div
      className={cn("border rounded-lg shadow-sm relative", styles.border, styles.bg)}
      style={{ width: NODE_W, height: NODE_H }}
    >
      <Handle type="target" position={Position.Left}  style={{ background: "#94a3b8" }} />
      <div className="px-2.5 py-2 h-full flex flex-col justify-between">
        <div className="flex items-start gap-1.5">
          {styles.icon}
          <span className="text-[11px] font-medium leading-tight text-slate-700 line-clamp-2">{d.displayName}</span>
        </div>
        <span className={cn("self-start text-[9px] font-bold px-1 rounded", styles.badge)}>{styles.label}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#94a3b8" }} />
    </div>
  );
}

const NODE_TYPES = {
  wfStart: StartNode,
  wfEnd:   EndNode,
  wfStep:  StepNode,
} as const;

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(workflow: WorkflowData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: "startNode", type: "wfStart", position: { x: workflow.startX, y: workflow.startY }, data: {} },
    { id: "endNode",   type: "wfEnd",   position: { x: workflow.endX,   y: workflow.endY   }, data: {} },
  ];
  const edges: Edge[] = [];

  for (const step of workflow.steps) {
    nodes.push({
      id:       step.id,
      type:     "wfStep",
      position: { x: step.x, y: step.y },
      data:     { displayName: step.displayName, kind: step.kind },
    });
  }

  if (workflow.startConnection) {
    edges.push({
      id:        `start->${workflow.startConnection}`,
      source:    "startNode",
      target:    workflow.startConnection,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style:     { stroke: "#94a3b8" },
    });
  }

  for (const step of workflow.steps) {
    for (const ns of step.nextStep) {
      const target = ns.step || "endNode";
      const label  = ns.condition ? `${ns.outcome} [${ns.condition}]` : ns.outcome;
      edges.push({
        id:             `${step.id}->${target}::${ns.outcome}`,
        source:         step.id,
        target,
        label,
        labelStyle:     { fontSize: 9, fill: "#64748b" },
        labelBgStyle:   { fill: "rgba(255,255,255,0.85)", fillOpacity: 1 },
        labelBgPadding: [3, 2] as [number, number],
        markerEnd:      { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        style:          { stroke: "#94a3b8" },
      });
    }
  }

  return { nodes, edges };
}

// ── Inner (needs ReactFlow context) ──────────────────────────────────────────

function WorkflowGraphInner({ workflow }: { workflow: WorkflowData }) {
  const { nodes: init, edges: initEdges } = useMemo(() => buildGraph(workflow), [workflow]);
  const [nodes, , onNodesChange] = useNodesState(init);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = setTimeout(() => { void fitView({ padding: 0.15, duration: 200 }); }, 80);
    return () => clearTimeout(t);
  }, [fitView, workflow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodesDraggable={false}
      nodesConnectable={false}
    >
      <Background />
      <Controls />
      <MiniMap
        nodeColor={(n) => {
          if (n.type === "wfStart") return "#10b981";
          if (n.type === "wfEnd")   return "#475569";
          const k = (n.data as { kind?: string }).kind;
          if (k === "approvalTask")     return "#93c5fd";
          if (k === "exclusiveGateway") return "#fcd34d";
          return "#c4b5fd";
        }}
        maskColor="rgba(241,245,249,0.7)"
      />
    </ReactFlow>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export function WorkflowGraph({ files }: { files: ViewableFile[] }) {
  const workflow = useMemo(() => {
    const topFile = files.find((f) => {
      try { return "staticNodes" in (JSON.parse(f.content) as Record<string, unknown>); }
      catch { return false; }
    });
    if (!topFile) return null;
    const stepJsons = files
      .filter((f) => f !== topFile && f.language === "json")
      .map((f) => f.content);
    return parseWorkflowData(topFile.content, stepJsons);
  }, [files]);

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Could not parse workflow data.
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      <ReactFlowProvider>
        <WorkflowGraphInner workflow={workflow} />
      </ReactFlowProvider>
    </div>
  );
}
