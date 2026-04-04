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
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUCCESS_ID = "e301438c-0bd0-429c-ab0c-66126501069a";
const FAILURE_ID = "70e691a5-1e33-4ac3-a356-e7b6d60d92e0";
const NODE_W     = 175;
const NODE_H     = 64;
const TERM_SIZE  = 60;
const START_SIZE = 48;

// Page group
const PAGE_GROUP_W   = 199;
const PAGE_CHILD_W   = 175; // PAGE_GROUP_W - 24
const PAGE_CHILD_H   = 30;
const PAGE_GROUP_TOP = 42;  // header height
const PAGE_GROUP_PAD = 12;
const PAGE_CHILD_GAP = 6;

function journeyNodeHeight(outcomeCount: number): number {
  return Math.max(NODE_H, outcomeCount * 22 + 28);
}

function pageGroupHeight(childCount: number): number {
  return PAGE_GROUP_TOP
    + childCount * PAGE_CHILD_H
    + Math.max(0, childCount - 1) * PAGE_CHILD_GAP
    + PAGE_GROUP_PAD;
}

function getNodeDims(node: Node): [number, number] {
  if (node.type === "journeyNode") {
    const outcomes = (node.data.outcomes as string[] | undefined) ?? [];
    return [NODE_W, journeyNodeHeight(outcomes.length)];
  }
  if (node.type === "pageGroup") {
    const children = (node.data.children as PageChildConfig[] | undefined) ?? [];
    return [PAGE_GROUP_W, pageGroupHeight(children.length)];
  }
  if (node.type === "startNode")   return [START_SIZE, START_SIZE];
  if (node.type === "successNode") return [TERM_SIZE,  TERM_SIZE];
  if (node.type === "failureNode") return [TERM_SIZE,  TERM_SIZE];
  return [NODE_W, NODE_H];
}

// ── Journey JSON ──────────────────────────────────────────────────────────────

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

interface PageChildConfig {
  _id: string;
  displayName: string;
  nodeType: string;
}

interface PageNodeConfig {
  nodes?: PageChildConfig[];
}

// ── Custom nodes ──────────────────────────────────────────────────────────────

const SPECIAL_NODE_BG: Partial<Record<string, string>> = {
  ScriptedDecisionNode:   "bg-violet-50",
  InnerTreeEvaluatorNode: "bg-amber-50",
};

function JourneyNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    nodeType?: string;
    outcomes: string[];
    isSelected?: boolean;
    isSearchMatch?: boolean;
    isFlashing?: boolean;
  };
  const outcomes = d.outcomes ?? [];
  const h        = journeyNodeHeight(outcomes.length);
  const specialBg = d.nodeType ? (SPECIAL_NODE_BG[d.nodeType] ?? "bg-white") : "bg-white";

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm transition-all overflow-visible cursor-pointer active:cursor-grabbing",
        specialBg,
        d.isFlashing    ? "border-sky-400 ring-4 ring-sky-300 ring-opacity-100 animate-pulse" :
        d.isSelected    ? "border-sky-500 ring-2 ring-sky-300 shadow-sky-100" :
        d.isSearchMatch ? "border-amber-400 ring-2 ring-amber-200" :
                          "border-slate-300"
      )}
      style={{ width: NODE_W, height: h, position: "relative" }}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%", background: "#94a3b8" }} />

      <div className="px-3 pt-2" style={{ paddingRight: outcomes.length > 0 ? 56 : 12 }}>
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

function PageGroupNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    children: PageChildConfig[];
    outcomes?: string[];
    isSelected?: boolean;
    isSearchMatch?: boolean;
  };
  const outcomes = d.outcomes ?? [];
  const h = pageGroupHeight(d.children.length);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl transition-all cursor-pointer active:cursor-grabbing",
        d.isSelected    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-300" :
        d.isSearchMatch ? "border-amber-400  bg-amber-50  ring-2 ring-amber-200" :
                          "border-violet-300 bg-violet-50/60"
      )}
      style={{ width: PAGE_GROUP_W, height: h, position: "relative" }}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%", background: "#94a3b8" }} />

      {/* Header */}
      <div className="px-3 pt-2 pb-1 border-b border-violet-200/80">
        <p className="text-[9px] font-semibold text-violet-500 uppercase tracking-wider">Page Node</p>
        <p className="text-[11px] font-medium text-slate-700 leading-tight truncate">{d.label}</p>
      </div>

      {outcomes.length > 0
        ? outcomes.map((outcome, i) => {
            const topPct = `${((i + 0.5) / outcomes.length) * 100}%`;
            return (
              <Handle key={outcome} id={outcome} type="source" position={Position.Right}
                style={{ top: topPct, background: "#94a3b8" }} />
            );
          })
        : <Handle type="source" position={Position.Right} style={{ top: "50%", background: "#94a3b8" }} />
      }
    </div>
  );
}

function PageChildNodeComponent({ data }: NodeProps) {
  const d = data as { label: string; nodeType: string };
  return (
    <div
      className="bg-white border border-violet-200 rounded-md shadow-sm px-2 flex flex-col justify-center"
      style={{ width: PAGE_CHILD_W, height: PAGE_CHILD_H }}
    >
      <p className="text-[10px] font-medium text-slate-700 leading-tight truncate">{d.label}</p>
      <p className="text-[9px] text-violet-400 truncate">{d.nodeType}</p>
    </div>
  );
}

function StartNodeComponent(_: NodeProps) {
  return (
    <div className="rounded-full flex items-center justify-center shadow font-bold text-white text-[9px] bg-emerald-500 cursor-pointer active:cursor-grabbing"
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
      "rounded-full border-2 flex items-center justify-center shadow-sm font-bold text-emerald-700 text-[10px] text-center leading-tight cursor-pointer active:cursor-grabbing",
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
      "rounded-full border-2 flex items-center justify-center shadow-sm font-bold text-red-700 text-[10px] text-center leading-tight cursor-pointer active:cursor-grabbing",
      d.isSelected ? "bg-red-100 border-red-500 ring-2 ring-red-200" : "bg-red-50 border-red-400"
    )} style={{ width: TERM_SIZE, height: TERM_SIZE }}>
      <Handle type="target" position={Position.Left} style={{ background: "#f87171" }} />
      ✗<br />Fail
    </div>
  );
}

const nodeTypes = {
  journeyNode: JourneyNodeComponent,
  pageGroup:   PageGroupNodeComponent,
  pageChild:   PageChildNodeComponent,
  startNode:   StartNodeComponent,
  successNode: SuccessNodeComponent,
  failureNode: FailureNodeComponent,
};

// ── Parser ────────────────────────────────────────────────────────────────────

function parseJourney(json: string, pageConfigs?: Map<string, PageNodeConfig>): { nodes: Node[]; edges: Edge[] } {
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
      type: "bezier", style: { stroke: "#10b981", strokeWidth: 2 } });
  }

  for (const [id, node] of Object.entries(data.nodes ?? {})) {
    const isPageNode  = node.nodeType === "PageNode";
    const pageConfig  = isPageNode ? pageConfigs?.get(id) : undefined;

    if (isPageNode && pageConfig) {
      const children = pageConfig.nodes ?? [];
      const groupH   = pageGroupHeight(children.length);

      // Group container node
      rfNodes.push({
        id,
        type: "pageGroup",
        position: { x: 0, y: 0 },
        style: { width: PAGE_GROUP_W, height: groupH },
        data: {
          label: node.displayName ?? "Page Node",
          nodeType: "PageNode",
          children,
          outcomes: Object.keys(node.connections ?? {}),
        },
      });

      // Child nodes (positioned relative to parent group)
      children.forEach((child, i) => {
        rfNodes.push({
          id: `${id}__child__${child._id}`,
          type: "pageChild",
          position: { x: PAGE_GROUP_PAD, y: PAGE_GROUP_TOP + i * (PAGE_CHILD_H + PAGE_CHILD_GAP) },
          parentId: id,
          extent: "parent" as const,
          draggable: false,
          selectable: false,
          focusable: false,
          style: { width: PAGE_CHILD_W, height: PAGE_CHILD_H },
          data: { label: child.displayName, nodeType: child.nodeType },
        });
      });
    } else {
      const outcomes = Object.keys(node.connections ?? {});
      rfNodes.push({ id, type: "journeyNode", position: { x: 0, y: 0 },
        data: { label: node.displayName ?? node.nodeType ?? id.slice(0, 8), nodeType: node.nodeType, outcomes } });
    }

    // Edges (same for both regular and page group nodes)
    Object.entries(node.connections ?? {}).forEach(([outcomeId, targetId]) => {
      const toSuccess = targetId === SUCCESS_ID;
      const toFailure = targetId === FAILURE_ID;
      rfEdges.push({
        id: `${id}--${outcomeId}`,
        source: id, sourceHandle: outcomeId,
        target: targetId,
        label: outcomeId === "outcome" ? undefined : outcomeId,
        type: "bezier",
        style: { stroke: toFailure ? "#f87171" : toSuccess ? "#34d399" : "#64748b", strokeWidth: 1.5 },
        labelStyle: { fontSize: 9, fill: "#64748b" },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
        labelBgPadding: [3, 5] as [number, number],
        labelBgBorderRadius: 3,
      });
    });
  }

  return { nodes: rfNodes, edges: rfEdges };
}

// ── Dagre layout ──────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 160, marginx: 40, marginy: 40 });

  // Only layout top-level nodes — children keep relative position inside group
  nodes.filter((n) => !n.parentId).forEach((n) => {
    const [w, h] = getNodeDims(n);
    g.setNode(n.id, { width: w, height: h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map((n) => {
    if (n.parentId) return n; // child: keep relative position
    const pos = g.node(n.id);
    if (!pos) return n;
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

function SearchPanel({
  query, setQuery, matchCount, onReset,
}: { query: string; setQuery: (q: string) => void; matchCount: number; onReset: () => void }) {
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
      <div className="w-px h-4 bg-slate-200 shrink-0" />
      <button type="button" onClick={onReset} title="Reset to auto layout"
        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 shrink-0">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset
      </button>
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
      <div className="flex items-center gap-1.5">
        <span className="w-4 h-3.5 border-2 border-dashed border-violet-400 rounded inline-block" />
        <span>Page node</span>
      </div>
      <p className="pt-1 border-t border-slate-100 text-slate-400">Click node → trace path</p>
      <p className="text-slate-400">Drag node → rearrange</p>
    </div>
  );
}

// ── Node info drawer ─────────────────────────────────────────────────────────

interface NodePanelData {
  id: string;
  label: string;
  nodeType?: string;
  outcomes: { outcomeId: string; targetLabel: string }[];
}

const CONFIG_BLOCKLIST = new Set(["_id", "_rev", "_type", "_outcomes"]);

function PropertyValue({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null || value === undefined) {
    return <span className="text-slate-400 italic text-[10px]">null</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={cn("text-[10px] font-mono font-medium", value ? "text-emerald-600" : "text-rose-500")}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-[10px] font-mono text-amber-700">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-[10px] font-mono text-slate-700 break-all">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400 italic text-[10px]">[]</span>;
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-[10px] text-sky-600 hover:text-sky-800 font-mono"
        >
          {expanded ? "▾" : "▸"} [{value.length}]
        </button>
        {expanded && (
          <div className="mt-1 pl-2 border-l border-slate-200 space-y-1">
            {value.map((item, i) => (
              <div key={i} className="flex gap-1 items-start">
                <span className="text-[9px] text-slate-300 font-mono shrink-0 mt-0.5">{i}</span>
                <PropertyValue value={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-400 italic text-[10px]">{"{}"}</span>;
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-[10px] text-sky-600 hover:text-sky-800 font-mono"
        >
          {expanded ? "▾" : "▸"} {"{…}"}
        </button>
        {expanded && (
          <div className="mt-1 pl-2 border-l border-slate-200 space-y-1.5">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-1.5 items-start">
                <span className="text-[9px] text-slate-500 font-medium shrink-0 mt-0.5">{k}:</span>
                <PropertyValue value={v} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return <span className="text-[10px] font-mono text-slate-600">{String(value)}</span>;
}

function PropertyTable({ config }: { config: Record<string, unknown> }) {
  const entries = Object.entries(config).filter(([k]) => !CONFIG_BLOCKLIST.has(k));
  if (entries.length === 0) return <p className="text-[11px] text-slate-400">No properties</p>;
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{key}</p>
          <PropertyValue value={value} />
        </div>
      ))}
    </div>
  );
}

// ── JS syntax highlighter ─────────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  "var","let","const","function","return","if","else","for","while","do",
  "switch","case","break","continue","new","delete","typeof","instanceof",
  "in","of","class","extends","import","export","default","try","catch",
  "finally","throw","async","await","yield","this","super","static",
]);
const JS_BUILTINS = new Set(["true","false","null","undefined","NaN","Infinity"]);

function highlightJs(code: string): string {
  const out: string[] = [];
  let i = 0;

  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function span(color: string, text: string, bold = false) {
    return `<span style="color:${color}${bold ? ";font-weight:500" : ""}">${esc(text)}</span>`;
  }

  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const text = end === -1 ? code.slice(i) : code.slice(i, end);
      out.push(span("#6b7280", text));
      i += text.length;
    }
    // Multi-line comment
    else if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const text = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out.push(span("#6b7280", text));
      i += text.length;
    }
    // String (double / single / template)
    else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push(span("#86efac", code.slice(i, j + 1)));
      i = j + 1;
    }
    // Identifier / keyword / builtin
    else if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word))      out.push(span("#c084fc", word, true));
      else if (JS_BUILTINS.has(word)) out.push(span("#f87171", word));
      else                            out.push(esc(word));
      i = j;
    }
    // Number
    else if (/[0-9]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[0-9._xXeEbBoO]/.test(code[j])) j++;
      out.push(span("#fbbf24", code.slice(i, j)));
      i = j;
    }
    else {
      out.push(esc(code[i]));
      i++;
    }
  }
  return out.join("");
}

// ── Script fullscreen overlay ─────────────────────────────────────────────────

function ScriptOverlay({ name, content, onClose }: { name: string; content: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const highlighted = useMemo(() => highlightJs(content), [content]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
        <span className="text-sm font-mono font-medium text-slate-200 flex-1 truncate">{name}</span>
        <button
          type="button"
          onClick={onClose}
          title="Close (Esc)"
          className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Code */}
      <div className="flex-1 overflow-auto">
        <pre
          className="text-xs font-mono leading-relaxed p-5 text-slate-300 min-h-full"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}

// ── Node info drawer ──────────────────────────────────────────────────────────

function NodeInfoDrawer({
  node, open, environment, journeyId, onNavigate, onClose,
}: {
  node: NodePanelData | null;
  open: boolean;
  environment?: string;
  journeyId?: string;
  onNavigate?: (treeId: string, sourceNodeId: string) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"config" | "script">("config");
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [scriptName, setScriptName] = useState<string>("");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptFullscreen, setScriptFullscreen] = useState(false);
  const isStaticNode = !node || ["startNode", SUCCESS_ID, FAILURE_ID].includes(node.id);
  const isScriptedDecision = node?.nodeType === "ScriptedDecisionNode";

  // Reset tab + script when node changes
  useEffect(() => {
    setDrawerTab("config");
    setScriptContent(null);
    setScriptName("");
  }, [node?.id]);

  // Fetch node config
  useEffect(() => {
    if (!node || !environment || !journeyId || isStaticNode) { setConfig(null); return; }
    setConfigLoading(true);
    setConfig(null);
    const params = new URLSearchParams({ environment, journey: journeyId, nodeId: node.id });
    fetch(`/api/push/journey-node?${params}`)
      .then((r) => r.json())
      .then((d) => {
        try { setConfig(JSON.parse(d.file?.content ?? "")); }
        catch { setConfig(null); }
      })
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false));
  }, [node?.id, environment, journeyId, isStaticNode]);

  // Fetch script content when script tab is active
  useEffect(() => {
    if (drawerTab !== "script") return;
    const scriptId = typeof config?.script === "string" ? config.script : null;
    if (!scriptId || !environment || scriptContent !== null) return;
    setScriptLoading(true);
    const params = new URLSearchParams({ environment, scriptId });
    fetch(`/api/push/script?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setScriptName(d.name ?? scriptId);
        setScriptContent(d.content ?? null);
      })
      .catch(() => setScriptContent(null))
      .finally(() => setScriptLoading(false));
  }, [drawerTab, config, environment, scriptContent]);

  const scriptHighlighted = useMemo(
    () => (scriptContent ? highlightJs(scriptContent) : null),
    [scriptContent],
  );

  return (
    <>
      {scriptFullscreen && scriptContent && (
        <ScriptOverlay
          name={scriptName}
          content={scriptContent}
          onClose={() => setScriptFullscreen(false)}
        />
      )}

      <div className={cn(
        "absolute top-0 right-0 h-full w-72 bg-white border-l border-slate-200 shadow-2xl z-10",
        "flex flex-col transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {node && (
          <>
            {/* Header */}
            <div className="flex items-start gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug break-words">{node.label}</p>
                {node.nodeType && (
                  <span className={cn(
                    "inline-block mt-1.5 text-[10px] font-medium rounded px-1.5 py-0.5 border",
                    node.nodeType === "PageNode"
                      ? "text-violet-700 bg-violet-50 border-violet-200"
                      : "text-sky-700 bg-sky-50 border-sky-200"
                  )}>
                    {node.nodeType}
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab bar — only for ScriptedDecisionNode */}
            {isScriptedDecision && (
              <div className="flex border-b border-slate-200 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerTab("config")}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] font-medium transition-colors border-b-2",
                    drawerTab === "config"
                      ? "border-sky-500 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  Config
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab("script")}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] font-medium transition-colors border-b-2",
                    drawerTab === "script"
                      ? "border-sky-500 text-sky-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  Script
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {/* ── Config tab ── */}
              {drawerTab === "config" && (
                <>
                  {/* Outcomes */}
                  {node.outcomes.length > 0 && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Outcomes</p>
                      <div className="space-y-2">
                        {node.outcomes.map(({ outcomeId, targetLabel }) => (
                          <div key={outcomeId} className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 shrink-0">
                              {outcomeId}
                            </span>
                            <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-[11px] text-slate-700 truncate">{targetLabel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jump to inner tree */}
                  {node?.nodeType === "InnerTreeEvaluatorNode" && !!config?.tree && (
                    <div className="px-4 py-3 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => onNavigate?.(String(config.tree), node!.id)}
                        className="w-full flex items-center gap-2 text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg px-3 py-2 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="flex-1 text-left">Open inner tree</span>
                        <span className="font-mono text-[10px] text-sky-400 truncate max-w-[110px]">{String(config.tree)}</span>
                      </button>
                    </div>
                  )}

                  {/* Config properties */}
                  {!isStaticNode && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Configuration</p>
                      {configLoading && <p className="text-[11px] text-slate-400">Loading…</p>}
                      {!configLoading && config && <PropertyTable config={config} />}
                      {!configLoading && !config && (
                        <p className="text-[11px] text-slate-400">No configuration file found</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Script tab ── */}
              {drawerTab === "script" && (
                <div className="flex flex-col h-full">
                  {scriptLoading && (
                    <p className="px-4 py-3 text-[11px] text-slate-400">Loading script…</p>
                  )}
                  {!scriptLoading && scriptContent === null && !configLoading && (
                    <p className="px-4 py-3 text-[11px] text-slate-400">
                      {typeof config?.script === "string" ? "Script file not found" : "No script linked"}
                    </p>
                  )}
                  {!scriptLoading && scriptContent !== null && (
                    <>
                      {/* Script name + expand button */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
                        <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                        <span className="text-[10px] font-mono text-slate-600 truncate flex-1">{scriptName}</span>
                        <button
                          type="button"
                          title="View fullscreen"
                          onClick={() => setScriptFullscreen(true)}
                          className="text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                        </button>
                      </div>
                      {/* Code preview */}
                      <div className="flex-1 overflow-auto bg-slate-950">
                        <pre
                          className="text-[10px] font-mono leading-relaxed p-3 text-slate-300"
                          dangerouslySetInnerHTML={{ __html: scriptHighlighted! }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Inner graph ───────────────────────────────────────────────────────────────

function JourneyGraphInner({ json, fitViewKey, environment, journeyId }: {
  json: string; fitViewKey?: number; environment?: string; journeyId?: string;
}) {
  const { fitView, getViewport, setViewport } = useReactFlow();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId,  setHoveredEdgeId]  = useState<string | null>(null);
  const [pinnedEdgeId,   setPinnedEdgeId]   = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]     = useState("");
  const [layoutKey,      setLayoutKey]       = useState(0);
  const [nodePanel,      setNodePanel]       = useState<NodePanelData | null>(null);
  const [pageConfigs,    setPageConfigs]     = useState<Map<string, PageNodeConfig>>(new Map());

  // ── Inner-tree navigation stack ───────────────────────────────────────────
  const [navStack,   setNavStack]   = useState<{ journeyId: string; json: string; sourceNodeId: string }[]>([]);
  const [navLoading, setNavLoading] = useState(false);
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);

  // Derive active journey from top of stack (falls back to props)
  const activeJson      = navStack.length > 0 ? navStack[navStack.length - 1].json      : json;
  const activeJourneyId = navStack.length > 0 ? navStack[navStack.length - 1].journeyId : journeyId;

  // Saved viewport per journey key (to restore when going back)
  const savedViewports     = useRef<Map<string, { x: number; y: number; zoom: number }>>(new Map());
  // null = fit view; non-null = restore this viewport
  const pendingViewport    = useRef<{ x: number; y: number; zoom: number } | null>(null);
  // Only adjust viewport when an explicit navigation/layout action occurred,
  // not when dagreNodes changes due to pageConfigs loading
  const shouldAdjustViewport = useRef(true); // true for initial load

  // Reset stack when the parent selects a different journey
  useEffect(() => {
    setNavStack([]);
    savedViewports.current.clear();
    pendingViewport.current = null;
    shouldAdjustViewport.current = true;
  }, [json]);

  const navigateToTree = useCallback(async (treeId: string, sourceNodeId: string) => {
    if (!environment) return;
    // Save current viewport so we can restore it when going back
    savedViewports.current.set(activeJourneyId ?? "root", getViewport());
    pendingViewport.current = null; // signal: fit view on arrival
    shouldAdjustViewport.current = true;
    setNavLoading(true);
    try {
      const params = new URLSearchParams({ environment, scope: "journeys", item: treeId });
      const res = await fetch(`/api/push/item?${params}`);
      if (!res.ok) return;
      const data = await res.json() as { files: Array<{ content: string }> };
      const newJson = data.files?.[0]?.content;
      if (!newJson) return;
      setNavStack((prev) => [...prev, { journeyId: treeId, json: newJson, sourceNodeId }]);
      setNodePanel(null);
      setSelectedNodeId(null);
    } finally {
      setNavLoading(false);
    }
  }, [environment, activeJourneyId, getViewport]);

  const goToIndex = useCallback((index: number) => {
    const targetKey = index < 0 ? (journeyId ?? "root") : navStack[index].journeyId;
    pendingViewport.current = savedViewports.current.get(targetKey) ?? null;
    shouldAdjustViewport.current = true;
    // Flash the node in the parent that linked to the child we're leaving
    const flashTarget = navStack[index + 1]?.sourceNodeId ?? null;
    // Drop saved viewports for trees being removed from the path
    for (let i = index + 1; i < navStack.length; i++) {
      savedViewports.current.delete(navStack[i].journeyId);
    }
    setNavStack((prev) => index < 0 ? [] : prev.slice(0, index + 1));
    setFlashNodeId(flashTarget);
    setNodePanel(null);
    setSelectedNodeId(null);
  }, [navStack, journeyId]);

  // Detect PageNode IDs in the active journey JSON
  const pageNodeIds = useMemo(() => {
    try {
      const data = JSON.parse(activeJson) as JourneyJson;
      return Object.entries(data.nodes ?? {})
        .filter(([, n]) => n.nodeType === "PageNode")
        .map(([id]) => id);
    } catch { return []; }
  }, [activeJson]);

  // Fetch PageNode configs
  useEffect(() => {
    setPageConfigs(new Map());
    if (!environment || !activeJourneyId || pageNodeIds.length === 0) return;

    Promise.all(
      pageNodeIds.map(async (nodeId) => {
        const params = new URLSearchParams({ environment: environment!, journey: activeJourneyId!, nodeId });
        const res = await fetch(`/api/push/journey-node?${params}`);
        if (!res.ok) return null;
        const d = await res.json();
        if (!d.file?.content) return null;
        try { return [nodeId, JSON.parse(d.file.content) as PageNodeConfig] as const; }
        catch { return null; }
      })
    ).then((entries) => {
      const map = new Map<string, PageNodeConfig>(
        entries.filter((e): e is [string, PageNodeConfig] => e !== null)
      );
      setPageConfigs(map);
    });
  }, [environment, activeJourneyId, pageNodeIds]);

  const { dagreNodes, baseEdges } = useMemo(() => {
    const { nodes, edges } = parseJourney(activeJson, pageConfigs.size > 0 ? pageConfigs : undefined);
    return { dagreNodes: applyDagreLayout(nodes, edges), baseEdges: edges };
  }, [activeJson, layoutKey, pageConfigs]);

  // Reset to dagre positions when layout changes, then fit or restore viewport.
  // Only adjusts viewport when an explicit navigation/layout action set shouldAdjustViewport;
  // pageConfigs loading also changes dagreNodes but must not override the viewport.
  useEffect(() => {
    setRfNodes(dagreNodes);
    setSelectedNodeId(null);
    setSearchQuery("");
    setHoveredEdgeId(null);
    setPinnedEdgeId(null);
    setNodePanel(null);
    if (!shouldAdjustViewport.current) return;
    shouldAdjustViewport.current = false;
    const vp = pendingViewport.current;
    pendingViewport.current = null;
    // No cleanup return: pageConfigs loading causes a second dagreNodes change
    // that would cancel the timeout via cleanup before it fires.
    // The action fires once after the first trigger and is harmless if the
    // component re-renders again before the 80ms elapses.
    if (vp) {
      setTimeout(() => setViewport(vp, { duration: 300 }), 80);
    } else {
      setTimeout(() => fitView({ duration: 400, padding: 0.25 }), 80);
    }
  }, [dagreNodes, setRfNodes]);

  // Clear flash after animation completes
  useEffect(() => {
    if (!flashNodeId) return;
    const t = setTimeout(() => setFlashNodeId(null), 1200);
    return () => clearTimeout(t);
  }, [flashNodeId]);

  // Escape closes drawer first (capture phase, before fullscreen handler)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && nodePanel) { setNodePanel(null); e.stopPropagation(); }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [nodePanel]);

  // Map nodeId → display label (for resolving outcome targets)
  const nodeDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    rfNodes.forEach((n) => { if (!n.parentId) map.set(n.id, String(n.data.label ?? n.id)); });
    map.set(SUCCESS_ID, "Success");
    map.set(FAILURE_ID, "Failure");
    map.set("startNode", "Start");
    return map;
  }, [rfNodes]);

  // Fit view when fullscreen toggles
  useEffect(() => {
    if (fitViewKey === undefined) return;
    const t = setTimeout(() => fitView({ duration: 400, padding: 0.25 }), 80);
    return () => clearTimeout(t);
  }, [fitViewKey, fitView]);

  // Arrow key panning
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

  // Search (exclude child nodes)
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(rfNodes
      .filter((n) => !n.parentId && String(n.data.label ?? "").toLowerCase().includes(q))
      .map((n) => n.id));
  }, [searchQuery, rfNodes]);

  useEffect(() => {
    if (searchMatches.size === 0) return;
    const t = setTimeout(() => fitView({ nodes: [...searchMatches].map((id) => ({ id })), duration: 500, padding: 0.4 }), 50);
    return () => clearTimeout(t);
  }, [searchMatches, fitView]);

  // Path tracing (top-level nodes only; edges only reference top-level IDs)
  const { ancestors, descendants } = useMemo(() => {
    if (!selectedNodeId) return { ancestors: new Set<string>(), descendants: new Set<string>() };
    return getConnected(selectedNodeId, baseEdges);
  }, [selectedNodeId, baseEdges]);

  const highlighted = useMemo(() => {
    if (!selectedNodeId) return null;
    return new Set([selectedNodeId, ...ancestors, ...descendants]);
  }, [selectedNodeId, ancestors, descendants]);

  // Styled nodes — children inherit parent opacity
  const displayNodes = useMemo<Node[]>(() => {
    const parentOpacity = new Map<string, number>();
    rfNodes.forEach((n) => {
      if (!n.parentId) {
        parentOpacity.set(n.id, highlighted ? (highlighted.has(n.id) ? 1 : 0.15) : 1);
      }
    });

    return rfNodes.map((n) => {
      if (n.parentId) {
        const opacity = parentOpacity.get(n.parentId) ?? 1;
        return { ...n, style: { ...n.style, opacity, transition: "opacity 0.2s" } };
      }
      return {
        ...n,
        data: { ...n.data, isSelected: n.id === selectedNodeId, isSearchMatch: searchMatches.has(n.id), isFlashing: n.id === flashNodeId },
        style: { ...n.style, opacity: highlighted ? (highlighted.has(n.id) ? 1 : 0.15) : 1, transition: "opacity 0.2s" },
      };
    });
  }, [rfNodes, selectedNodeId, highlighted, searchMatches, flashNodeId]);

  // Styled edges
  const displayEdges = useMemo<Edge[]>(() => {
    const activeEdgeId = hoveredEdgeId ?? pinnedEdgeId;
    return baseEdges.map((e) => {
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
    if (node.parentId) return; // ignore clicks on page child nodes
    const isSame = selectedNodeId === node.id;
    setSelectedNodeId(isSame ? null : node.id);
    if (isSame) {
      setNodePanel(null);
    } else {
      const d = node.data as { label: string; nodeType?: string; outcomes?: string[] };
      const outcomes = (d.outcomes ?? []).map((outcomeId) => {
        const edge = baseEdges.find((e) => e.source === node.id && e.sourceHandle === outcomeId);
        const targetLabel = edge ? (nodeDisplayMap.get(edge.target) ?? edge.target) : "—";
        return { outcomeId, targetLabel };
      });
      setNodePanel({ id: node.id, label: d.label, nodeType: d.nodeType, outcomes });
    }
  }, [selectedNodeId, baseEdges, nodeDisplayMap]);

  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((_e, edge) => setHoveredEdgeId(edge.id), []);
  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => setHoveredEdgeId(null), []);
  const handleEdgeClick: EdgeMouseHandler      = useCallback((_e, edge) => setPinnedEdgeId((p) => p === edge.id ? null : edge.id), []);
  const handlePaneClick = useCallback(() => { setSelectedNodeId(null); setPinnedEdgeId(null); setNodePanel(null); }, []);

  if (rfNodes.length === 0 && dagreNodes.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-slate-400">Unable to parse journey data</div>;
  }

  return (
    <div className="relative w-full h-full">
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
      nodesDraggable
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Panel position="top-left">
        <SearchPanel query={searchQuery} setQuery={setSearchQuery} matchCount={searchMatches.size} onReset={() => { shouldAdjustViewport.current = true; setLayoutKey((k) => k + 1); }} />
      </Panel>
      {navStack.length > 0 && (
        <Panel position="top-center">
          <nav className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm px-2.5 py-1.5 text-[11px] max-w-lg">
            <button
              type="button"
              onClick={() => goToIndex(-1)}
              className="text-sky-600 hover:text-sky-800 font-medium truncate max-w-[160px] shrink-0"
            >
              {journeyId ?? "Journey"}
            </button>
            {navStack.map((entry, i) => (
              <Fragment key={`${entry.journeyId}-${i}`}>
                <span className="text-slate-300 shrink-0">›</span>
                {i < navStack.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToIndex(i)}
                    className="text-sky-600 hover:text-sky-800 font-medium truncate max-w-[160px]"
                  >
                    {entry.journeyId}
                  </button>
                ) : (
                  <span className="text-slate-700 font-semibold truncate max-w-[160px]">{entry.journeyId}</span>
                )}
              </Fragment>
            ))}
            {navLoading && <span className="text-slate-400 ml-1 shrink-0">…</span>}
          </nav>
        </Panel>
      )}
      <Panel position="top-right">
        <Legend />
      </Panel>
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) =>
          n.type === "successNode" ? "#34d399" :
          n.type === "failureNode" ? "#f87171" :
          n.type === "startNode"   ? "#10b981" :
          n.type === "pageGroup"   ? "#ddd6fe" :
          n.type === "pageChild"   ? "#ede9fe" : "#cbd5e1"
        }
        zoomable pannable
      />
    </ReactFlow>

    <NodeInfoDrawer
      node={nodePanel}
      open={!!nodePanel}
      environment={environment}
      journeyId={activeJourneyId}
      onNavigate={navigateToTree}
      onClose={() => { setNodePanel(null); setSelectedNodeId(null); }}
    />
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function JourneyGraph({ json, fitViewKey, environment, journeyId }: { json: string; fitViewKey?: number; environment?: string; journeyId?: string }) {
  return (
    <ReactFlowProvider>
      <JourneyGraphInner json={json} fitViewKey={fitViewKey} environment={environment} journeyId={journeyId} />
    </ReactFlowProvider>
  );
}
