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
import type { FileDiff, JourneyNodeInfo } from "@/lib/diff-types";

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

function DiffStatusBadge({ status }: { status?: DiffStatus }) {
  if (!status) return null;
  const label = statusBadgeLabel(status);
  if (!label) return <span className="text-[10px] text-slate-400">unchanged</span>;
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", statusBadgeClass(status))}>
      {label === "M" ? "modified" : label === "A" ? "added" : "deleted"}
    </span>
  );
}

function JourneyDiffNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    nodeType?: string;
    outcomes: string[];
    diffStatus: DiffStatus;
  };
  const outcomes   = d.outcomes ?? [];
  const h          = diffNodeHeight(outcomes.length);
  const status     = d.diffStatus ?? "unchanged";
  const badgeLabel = statusBadgeLabel(status);
  const isInner    = d.nodeType === "InnerTreeEvaluatorNode";

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm overflow-visible relative",
        isInner
          ? "border-amber-300 border-dashed bg-amber-50 cursor-pointer"
          : statusBorderBg(status),
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
        {isInner && (
          <p className="text-[9px] text-amber-500 mt-0.5 font-medium">⤵ (inner)</p>
        )}
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

// ── Path tracing helper ───────────────────────────────────────────────────────

function getConnected(nodeId: string, edges: Edge[]) {
  const ancestors   = new Set<string>();
  const descendants = new Set<string>();
  let queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of edges) {
      if (e.target === cur && !ancestors.has(e.source)) {
        ancestors.add(e.source);
        queue.push(e.source);
      }
    }
  }
  queue = [nodeId];
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

// ── Legend ────────────────────────────────────────────────────────────────────

function DiffLegend() {
  return (
    <div className="bg-white/95 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] text-slate-600 shadow-sm backdrop-blur-sm">
      {([
        { label: "Added",     border: "border-emerald-400", bg: "bg-emerald-50" },
        { label: "Removed",   border: "border-red-400",     bg: "bg-red-50 border-dashed" },
        { label: "Modified",  border: "border-amber-400",   bg: "bg-amber-50" },
        { label: "Unchanged", border: "border-slate-300",   bg: "bg-white" },
        { label: "Inner",     border: "border-amber-300 border-dashed", bg: "bg-amber-50" },
      ] as const).map(({ label, border, bg }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={cn("inline-block w-3.5 h-3.5 rounded border", border, bg)} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ── Script panel content ──────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightLine(raw: string): string {
  return escapeHtml(raw).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = "#60a5fa";
      if (/^"/.test(match)) color = /:$/.test(match) ? "#94a3b8" : "#86efac";
      else if (/true|false/.test(match)) color = "#fbbf24";
      else if (/null/.test(match)) color = "#f87171";
      return `<span style="color:${color}">${match}</span>`;
    },
  );
}

type DiffLineLocal = { type: "added" | "removed" | "context"; content: string };

function clientDiff(aText: string, bText: string): DiffLineLocal[] {
  const a = aText === "" ? [] : aText.split("\n");
  const b = bText === "" ? [] : bText.split("\n");
  const m = a.length, n = b.length;
  if (m > 2000 || n > 2000) return [{ type: "context", content: "(file too large to diff in browser)" }];
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const lines: DiffLineLocal[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { lines.unshift({ type: "context", content: a[i - 1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { lines.unshift({ type: "added", content: b[j - 1] }); j--; }
    else { lines.unshift({ type: "removed", content: a[i - 1] }); i--; }
  }
  return lines;
}

function InlineDiffView({ lines }: { lines: DiffLineLocal[] }) {
  const MAX = 300;
  const visible = lines.slice(0, MAX);
  return (
    <div className="overflow-x-auto overflow-y-auto bg-slate-950 text-[10px] font-mono leading-5 max-h-64">
      <table className="min-w-full border-collapse">
        <tbody>
          {visible.map((l, i) => {
            const bg   = l.type === "added" ? "bg-emerald-950" : l.type === "removed" ? "bg-red-950" : "";
            const text = l.type === "added" ? "text-emerald-300" : l.type === "removed" ? "text-red-300" : "text-slate-400";
            const pfx  = l.type === "added" ? "+" : l.type === "removed" ? "-" : " ";
            const pfxColor = l.type === "added" ? "text-emerald-400" : l.type === "removed" ? "text-red-400" : "text-slate-600";
            return (
              <tr key={i} className={bg}>
                <td className={cn("px-1 py-0 select-none w-4", pfxColor)}>{pfx}</td>
                <td
                  className={cn("px-2 py-0 whitespace-pre", text)}
                  dangerouslySetInnerHTML={{ __html: highlightLine(l.content) }}
                />
              </tr>
            );
          })}
          {lines.length > MAX && (
            <tr>
              <td colSpan={2} className="text-center text-slate-500 py-1 text-[9px]">
                …{lines.length - MAX} more lines
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ScriptPanelContent({
  nodeId,
  files,
}: {
  nodeId?: string | null;
  nodeType?: string;
  journeyName?: string;
  files: FileDiff[];
}) {
  if (!nodeId) return <p className="px-3 py-2 text-xs text-slate-400">No node selected.</p>;

  // Find node config file
  const nodeConfigFile = files.find(
    (f) => f.relativePath.includes(`/${nodeId}.json`) && f.relativePath.includes("/nodes/"),
  );

  if (!nodeConfigFile) {
    return <p className="px-3 py-2 text-xs text-slate-400">No config file found for this node.</p>;
  }

  const nodeContent = nodeConfigFile.localContent ?? nodeConfigFile.remoteContent;
  let nodeJson: Record<string, unknown> | null = null;
  try { nodeJson = nodeContent ? JSON.parse(nodeContent) : null; } catch { /* ignore */ }

  // Find UUID-valued fields → potential script UUIDs
  const scriptUuids: string[] = [];
  if (nodeJson) {
    for (const val of Object.values(nodeJson)) {
      if (typeof val === "string" && UUID_RE.test(val)) {
        scriptUuids.push(val);
      }
    }
  }

  // For each script UUID, find script config and content files
  interface ScriptEntry {
    uuid: string;
    name: string;
    configFile?: FileDiff;
    contentFile?: FileDiff;
  }

  const scriptEntries: ScriptEntry[] = [];
  for (const uuid of scriptUuids) {
    const configFile = files.find((f) => f.relativePath.includes(`/scripts-config/${uuid}.json`));
    if (!configFile) continue;

    // Parse name from config
    let name = uuid;
    const cfgContent = configFile.localContent ?? configFile.remoteContent;
    if (cfgContent) {
      try {
        const cfgJson = JSON.parse(cfgContent) as Record<string, unknown>;
        if (typeof cfgJson.name === "string" && cfgJson.name) name = cfgJson.name;
      } catch { /* ignore */ }
    }

    const contentFile = files.find(
      (f) =>
        f.relativePath.includes("/scripts-content/") &&
        f.relativePath.split("/").pop()?.replace(/\.[^.]+$/, "") === name,
    );

    scriptEntries.push({ uuid, name, configFile, contentFile });
  }

  if (scriptEntries.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-slate-400">
        {scriptUuids.length > 0 ? "No script diff files found." : "No scripts linked to this node."}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {scriptEntries.map((entry) => {
        // Compute diff lines for each relevant file
        const filesToShow: FileDiff[] = [
          ...(entry.configFile ? [entry.configFile] : []),
          ...(entry.contentFile ? [entry.contentFile] : []),
        ];

        return (
          <div key={entry.uuid} className="py-2">
            <div className="flex items-center gap-1.5 px-3 pb-1">
              <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <span className="text-[11px] font-medium text-slate-700 truncate">{entry.name}</span>
            </div>
            {filesToShow.map((f) => {
              const isConfig  = f.relativePath.includes("/scripts-config/");
              const fileLabel = isConfig ? "config" : f.relativePath.split("/").pop() ?? "content";
              const statusColor = f.status === "added" ? "text-emerald-600" : f.status === "removed" ? "text-red-500" : f.status === "modified" ? "text-amber-600" : "text-slate-400";

              let diffLines: DiffLineLocal[] = [];
              if (f.diffLines && f.diffLines.length > 0) {
                diffLines = f.diffLines as DiffLineLocal[];
              } else if (f.localContent != null && f.remoteContent != null) {
                diffLines = clientDiff(f.localContent, f.remoteContent);
              } else if (f.remoteContent != null) {
                diffLines = f.remoteContent.split("\n").map((c) => ({ type: "added" as const, content: c }));
              } else if (f.localContent != null) {
                diffLines = f.localContent.split("\n").map((c) => ({ type: "removed" as const, content: c }));
              }

              const changedLines = diffLines.filter((l) => l.type !== "context");

              return (
                <div key={f.relativePath} className="px-3 pb-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-slate-400 truncate flex-1">{fileLabel}</span>
                    <span className={cn("text-[9px] font-semibold uppercase", statusColor)}>{f.status}</span>
                    {changedLines.length > 0 && (
                      <span className="text-[9px] text-slate-400">
                        +{changedLines.filter((l) => l.type === "added").length}
                        {" "}-{changedLines.filter((l) => l.type === "removed").length}
                      </span>
                    )}
                  </div>
                  {diffLines.length > 0 ? (
                    <InlineDiffView lines={diffLines} />
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No changes</p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
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
  onNodeActivate?: (nodeId: string | null, nodeData: Record<string, unknown>) => void;
}

function DiffGraphCanvasInner({
  baseNodes,
  baseEdges,
  hideUnchanged,
  fitKey,
  externalViewport,
  onViewportChange,
  onNodeActivate,
}: DiffGraphCanvasInnerProps) {
  const { fitView, setViewport } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

  // Path tracing
  const highlighted = useMemo(() => {
    if (!selectedNodeId) return null;
    const { ancestors, descendants } = getConnected(selectedNodeId, filteredEdges);
    const set = new Set([selectedNodeId, ...ancestors, ...descendants]);
    return set;
  }, [selectedNodeId, filteredEdges]);

  // Apply opacity/animation to nodes and edges based on selection
  const styledNodes = useMemo(() => {
    if (!highlighted) return filteredNodes;
    return filteredNodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: highlighted.has(n.id) ? 1 : 0.15,
        transition: "opacity 0.2s",
      },
    }));
  }, [filteredNodes, highlighted]);

  const styledEdges = useMemo(() => {
    if (!highlighted) return filteredEdges;
    return filteredEdges.map((e) => {
      const onPath = highlighted.has(e.source) && highlighted.has(e.target);
      return {
        ...e,
        animated: onPath,
        style: {
          ...e.style,
          opacity: onPath ? 1 : 0.06,
          transition: "opacity 0.2s",
        },
      };
    });
  }, [filteredEdges, highlighted]);

  const miniMapNodeColor = useCallback((n: Node): string => {
    switch (n.data.diffStatus as DiffStatus) {
      case "added":     return "#10b981";
      case "removed":   return "#ef4444";
      case "modified":  return "#f59e0b";
      default:          return "#94a3b8";
    }
  }, []);

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

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    onNodeActivate?.(null, {});
  }, [onNodeActivate]);

  return (
    <ReactFlow
      nodes={styledNodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      onMove={(_, vp) => onViewportChange(vp)}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      nodesDraggable
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap nodeColor={miniMapNodeColor} zoomable pannable />
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
  sourceEnv: string;
  targetEnv: string;
  files: FileDiff[];
  onClose: () => void;
}

interface NavEntry {
  name: string;
  localContent?: string;
  remoteContent?: string;
  nodeInfos: JourneyNodeInfo[];
}

export function JourneyDiffGraphModal({
  journeyName,
  localContent,
  remoteContent,
  nodeInfos,
  sourceLabel,
  targetLabel,
  sourceEnv,
  targetEnv,
  files,
  onClose,
}: JourneyDiffGraphModalProps) {
  const [viewMode, setViewMode]             = useState<"merged" | "side-by-side">("merged");
  const [hideUnchanged, setHideUnchanged]   = useState(false);
  const [syncViewports, setSyncViewports]   = useState(true);
  const [fitKey, setFitKey]                 = useState(0);
  const [navStack, setNavStack]             = useState<NavEntry[]>([]);
  const [activeNode, setActiveNode]         = useState<{
    id: string;
    label: string;
    nodeType?: string;
    diffStatus: DiffStatus;
  } | null>(null);

  const [leftExternalVP,  setLeftExternalVP]  = useState<Viewport | null>(null);
  const [rightExternalVP, setRightExternalVP] = useState<Viewport | null>(null);
  const syncSource = useRef<"left" | "right" | null>(null);

  // Derive "active" journey from top of nav stack (or fall back to props)
  const active = navStack.length > 0 ? navStack[navStack.length - 1] : {
    name: journeyName,
    localContent,
    remoteContent,
    nodeInfos,
  };

  const hasContent = !!(active.localContent || active.remoteContent);
  const nodesOnly  = !hasContent && active.nodeInfos.length > 0;

  // ESC closes modal (or pops nav stack)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (navStack.length > 0) {
          setNavStack((s) => s.slice(0, -1));
          setActiveNode(null);
          setFitKey((k) => k + 1);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, navStack.length]);

  // Build nodeStatusMap
  const nodeStatusMap = useMemo(() => {
    const m = new Map<string, DiffStatus>();
    for (const n of active.nodeInfos) m.set(n.uuid, n.status as DiffStatus);
    return m;
  }, [active.nodeInfos]);

  // Build all graphs
  const { mergedNodes, mergedEdges, localNodes, localEdges, remoteNodes, remoteEdges } =
    useMemo(() => {
      if (!hasContent) {
        const { nodes, edges } = parseNodesOnlyGraph(
          active.nodeInfos.map((n) => ({ ...n, status: n.status as DiffStatus })),
        );
        return {
          mergedNodes: nodes, mergedEdges: edges,
          localNodes:  nodes, localEdges:  edges,
          remoteNodes: nodes, remoteEdges: edges,
        };
      }

      const merged = parseMergedDiffGraph(active.localContent, active.remoteContent, nodeStatusMap);
      const local  = active.localContent
        ? parseSingleSideGraph(active.localContent,  nodeStatusMap, "local")
        : { nodes: [] as Node[], edges: [] as Edge[] };
      const remote = active.remoteContent
        ? parseSingleSideGraph(active.remoteContent, nodeStatusMap, "remote")
        : { nodes: [] as Node[], edges: [] as Edge[] };

      return {
        mergedNodes: merged.nodes, mergedEdges: merged.edges,
        localNodes:  local.nodes,  localEdges:  local.edges,
        remoteNodes: remote.nodes, remoteEdges: remote.edges,
      };
    }, [hasContent, active.localContent, active.remoteContent, active.nodeInfos, nodeStatusMap]);

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

  // Navigate into an inner journey
  const navigateInto = useCallback(async (nodeId: string, nodeData: Record<string, unknown>) => {
    // Step 1: attempt to read treeName from node config file (may be absent if file is unchanged)
    const nodeConfigFile = files.find(
      (f) => f.relativePath.includes(`/${nodeId}.json`) && f.relativePath.includes("/nodes/"),
    );
    let treeName: string | null = null;
    if (nodeConfigFile) {
      const content = nodeConfigFile.localContent ?? nodeConfigFile.remoteContent;
      if (content) {
        try {
          const json = JSON.parse(content) as Record<string, unknown>;
          if (typeof json.tree === "string" && json.tree) treeName = json.tree;
        } catch { /* ignore */ }
      }
    }

    // Fall back to the node's display label as the journey name
    const displayLabel = typeof nodeData.label === "string" ? nodeData.label : nodeId;
    const name = treeName ?? displayLabel;

    // Step 2: find sub-journey file in the already-loaded files (works for changed journeys)
    const subFile = files.find((f) => f.relativePath.endsWith(`/journeys/${name}/${name}.json`));
    let subLocalContent  = subFile?.localContent;
    let subRemoteContent = subFile?.remoteContent;

    // Step 3: if content is still missing (unchanged sub-journey), fetch from both environments
    if (!subLocalContent || !subRemoteContent) {
      const fetchSide = async (env: string): Promise<string | undefined> => {
        try {
          const params = new URLSearchParams({ environment: env, scope: "journeys", item: name });
          const res = await fetch(`/api/push/item?${params}`);
          if (!res.ok) return undefined;
          const data = await res.json() as { files?: Array<{ content?: string }> };
          return data.files?.[0]?.content ?? undefined;
        } catch { return undefined; }
      };

      const [fetched1, fetched2] = await Promise.all([
        !subLocalContent  ? fetchSide(sourceEnv) : Promise.resolve(subLocalContent),
        !subRemoteContent ? fetchSide(targetEnv) : Promise.resolve(subRemoteContent),
      ]);
      subLocalContent  = fetched1;
      subRemoteContent = fetched2;
    }

    setNavStack((prev) => [...prev, { name, localContent: subLocalContent, remoteContent: subRemoteContent, nodeInfos: [] }]);
    setActiveNode(null);
    setFitKey((k) => k + 1);
  }, [files, sourceEnv, targetEnv]);

  // Handle node activate from canvas
  const handleNodeActivate = useCallback((nodeId: string | null, nodeData: Record<string, unknown>) => {
    if (!nodeId) {
      setActiveNode(null);
      return;
    }
    const diffStatus = (nodeData.diffStatus as DiffStatus) ?? "unchanged";
    const label      = typeof nodeData.label    === "string" ? nodeData.label    : nodeId;
    const nodeType   = typeof nodeData.nodeType === "string" ? nodeData.nodeType : undefined;

    setActiveNode({ id: nodeId, label, nodeType, diffStatus });
  }, []);

  const showSidePanel = !!activeNode;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 shrink-0">
        {/* Breadcrumb */}
        <div className="flex-1 min-w-0">
          {navStack.length === 0 ? (
            <span className="text-sm font-semibold text-slate-800 truncate" title={journeyName}>
              {journeyName}
            </span>
          ) : (
            <nav className="flex items-center gap-1 text-sm min-w-0">
              <button
                type="button"
                onClick={() => { setNavStack([]); setActiveNode(null); setFitKey((k) => k + 1); }}
                className="font-semibold text-sky-600 hover:text-sky-800 truncate max-w-[150px] shrink-0"
              >
                {journeyName}
              </button>
              {navStack.map((entry, i) => (
                <Fragment key={`${entry.name}-${i}`}>
                  <span className="text-slate-400 shrink-0">›</span>
                  {i < navStack.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => { setNavStack((prev) => prev.slice(0, i + 1)); setActiveNode(null); setFitKey((k) => k + 1); }}
                      className="text-sky-600 hover:text-sky-800 truncate max-w-[150px]"
                    >
                      {entry.name}
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{entry.name}</span>
                  )}
                </Fragment>
              ))}
            </nav>
          )}
        </div>

        {nodesOnly && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
            nodes only
          </span>
        )}

        {/* View mode toggle */}
        <div className="flex rounded border border-slate-300 overflow-hidden text-[11px] shrink-0">
          {(["merged", "side-by-side"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={cn(
                "px-3 py-1 transition-colors capitalize",
                viewMode === m
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
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
              : "text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400",
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
                : "text-slate-500 border-slate-300 hover:text-slate-700 hover:border-slate-400",
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
          className="text-slate-400 hover:text-sky-600 transition-colors shrink-0"
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
          className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 flex">
        {/* Graph area */}
        <div className="flex-1 min-w-0 flex">
          {viewMode === "merged" ? (
            <DiffGraphCanvas
              className="flex-1"
              baseNodes={mergedNodes}
              baseEdges={mergedEdges}
              hideUnchanged={hideUnchanged}
              fitKey={fitKey}
              externalViewport={null}
              onViewportChange={() => {}}
              onNodeActivate={handleNodeActivate}
            />
          ) : (
            <>
              {/* Left panel (local / source) */}
              <div className="flex-1 min-w-0 relative border-r border-slate-200">
                <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 text-slate-600 text-[10px] px-2 py-1 rounded border border-slate-200 shadow-sm pointer-events-none">
                  {sourceLabel}
                </span>
                <DiffGraphCanvas
                  baseNodes={localNodes}
                  baseEdges={localEdges}
                  hideUnchanged={hideUnchanged}
                  fitKey={fitKey}
                  externalViewport={leftExternalVP}
                  onViewportChange={handleLeftMove}
                  onNodeActivate={handleNodeActivate}
                />
              </div>

              {/* Right panel (remote / target) */}
              <div className="flex-1 min-w-0 relative">
                <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 text-slate-600 text-[10px] px-2 py-1 rounded border border-slate-200 shadow-sm pointer-events-none">
                  {targetLabel}
                </span>
                <DiffGraphCanvas
                  baseNodes={remoteNodes}
                  baseEdges={remoteEdges}
                  hideUnchanged={hideUnchanged}
                  fitKey={fitKey}
                  externalViewport={rightExternalVP}
                  onViewportChange={handleRightMove}
                  onNodeActivate={handleNodeActivate}
                />
              </div>
            </>
          )}
        </div>

        {/* Side panel */}
        {showSidePanel && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 shrink-0">
              <span className="text-xs font-semibold text-slate-700 flex-1 truncate" title={activeNode?.label}>
                {activeNode?.label}
              </span>
              <button
                type="button"
                onClick={() => setActiveNode(null)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Node metadata */}
            <div className="px-3 py-2 space-y-1 border-b border-slate-100 text-xs shrink-0">
              <div className="flex gap-2 items-start">
                <span className="text-slate-400 w-16 shrink-0">Type</span>
                <span className="text-slate-700 font-mono text-[10px] break-all">{activeNode?.nodeType ?? "—"}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-slate-400 w-16 shrink-0">Status</span>
                <DiffStatusBadge status={activeNode?.diffStatus} />
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-slate-400 w-16 shrink-0">ID</span>
                <span className="text-slate-400 font-mono text-[9px] break-all">{activeNode?.id}</span>
              </div>
            </div>
            {/* Descend into inner journey */}
            {activeNode?.nodeType === "InnerTreeEvaluatorNode" && (
              <div className="px-3 py-2 border-b border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { if (activeNode) void navigateInto(activeNode.id, activeNode); }}
                  className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  Descend into journey
                </button>
              </div>
            )}
            {/* Script files */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 pt-2 pb-1">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Scripts</p>
              </div>
              <ScriptPanelContent
                nodeId={activeNode?.id}
                nodeType={activeNode?.nodeType}
                journeyName={active.name}
                files={files}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
