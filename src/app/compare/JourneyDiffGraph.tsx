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
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { cn } from "@/lib/utils";
import { highlightJs } from "@/lib/highlight";
import { ScriptOverlay } from "../configs/ScriptOverlay";
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

// ── Property viewer ───────────────────────────────────────────────────────────

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

function JourneyDiffNodeComponent({ data }: NodeProps) {
  const d = data as {
    label: string;
    nodeType?: string;
    outcomes: string[];
    diffStatus: DiffStatus;
    modifiedReason?: "script" | "subjourney";
    isFlashing?: boolean;
    isSearchMatch?: boolean;
  };
  const outcomes       = d.outcomes ?? [];
  const h              = diffNodeHeight(outcomes.length);
  const status         = d.diffStatus ?? "unchanged";
  const modifiedReason = d.modifiedReason;
  const isInner        = d.nodeType === "InnerTreeEvaluatorNode";
  const isFlashing     = !!d.isFlashing;
  const isSearchMatch  = !!d.isSearchMatch;

  // Derive border/bg based on modifiedReason when status is "modified"
  function nodeBorderBg(): string {
    if (status === "modified") {
      if (modifiedReason === "script")    return "border-orange-400 bg-orange-50";
      if (modifiedReason === "subjourney") return "border-violet-400 bg-violet-50";
    }
    if (isInner) return "border-amber-300 border-dashed bg-amber-50 cursor-pointer";
    return statusBorderBg(status);
  }

  function nodeBadgeClass(): string {
    if (status === "modified") {
      if (modifiedReason === "script")    return "bg-orange-100 text-orange-700";
      if (modifiedReason === "subjourney") return "bg-violet-100 text-violet-700";
    }
    return statusBadgeClass(status);
  }

  const badgeLabel = statusBadgeLabel(status);

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm overflow-visible relative",
        nodeBorderBg(),
        isFlashing && "ring-2 ring-sky-400 ring-offset-1 animate-pulse",
        isSearchMatch && "ring-2 ring-amber-400 ring-offset-1",
      )}
      style={{ width: DIFF_NODE_W, height: h }}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%", background: "#94a3b8" }} />

      {/* Status badge */}
      {badgeLabel && (
        <span
          className={cn(
            "absolute top-0.5 right-0.5 text-[9px] font-bold px-1 rounded",
            nodeBadgeClass(),
          )}
        >
          {badgeLabel}
        </span>
      )}

      <div className="px-3 pt-2" style={{ paddingRight: outcomes.length > 0 ? 56 : 20 }}>
        <p className="text-[11px] font-medium text-slate-700 leading-snug break-words">{d.label}</p>
        {d.nodeType && <p className="text-[9px] text-slate-400 mt-0.5 truncate">{d.nodeType}</p>}
        {modifiedReason === "script" && (
          <p className="text-[9px] text-orange-500 mt-0.5 font-medium">script changed</p>
        )}
        {modifiedReason === "subjourney" && (
          <p className="text-[9px] text-violet-500 mt-0.5 font-medium">sub-journey changed</p>
        )}
        {isInner && !modifiedReason && (
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

// ── Unchanged script viewer ───────────────────────────────────────────────────

function UnchangedScriptViewer({ name, content }: { name: string; content: string }) {
  const [copied, setCopied]         = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const highlighted = useMemo(() => highlightJs(content), [content]);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {fullscreen && <ScriptOverlay name={name} content={content} onClose={() => setFullscreen(false)} />}
      <div className="border border-slate-200 rounded overflow-hidden mx-3 mb-2">
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border-b border-slate-200">
          <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="text-[9px] font-mono text-slate-500 truncate flex-1">{name}</span>
          <button type="button" onClick={handleCopy} title="Copy" className="text-slate-400 hover:text-slate-600 shrink-0 transition-colors">
            {copied
              ? <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
            }
          </button>
          <button type="button" onClick={() => setFullscreen(true)} title="Fullscreen" className="text-slate-400 hover:text-slate-600 shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
          </button>
        </div>
        <div className="bg-slate-950 overflow-auto max-h-64">
          <pre className="text-[9px] font-mono leading-relaxed p-2 text-slate-300" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      </div>
    </>
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

interface ScriptEntry {
  uuid: string;
  name: string;
  /** Present when the script is in the diff (changed). */
  configFile?: FileDiff;
  contentFile?: FileDiff;
  /** Present when the script is unchanged and was fetched from the API. */
  fetchedContent?: string | null;
}

function ScriptPanelContent({
  nodeId,
  journeyName,
  files,
  sourceEnv,
  targetEnv,
}: {
  nodeId?: string | null;
  nodeType?: string;
  journeyName?: string;
  files: FileDiff[];
  sourceEnv: string;
  targetEnv: string;
}) {
  const [loading, setLoading]   = useState(false);
  const [entries, setEntries]   = useState<ScriptEntry[]>([]);
  const [message, setMessage]   = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) { setEntries([]); setMessage(null); return; }

    let cancelled = false;
    setLoading(true);
    setEntries([]);
    setMessage(null);

    const run = async () => {
      // ── Step 1: resolve node config content ──────────────────────────────
      const nodeConfigFile = files.find(
        (f) => f.relativePath.includes(`/${nodeId}.json`) && f.relativePath.includes("/nodes/"),
      );
      let nodeContent = nodeConfigFile?.localContent ?? nodeConfigFile?.remoteContent ?? null;

      if (!nodeContent) {
        const env = sourceEnv || targetEnv;
        if (env && journeyName) {
          try {
            const params = new URLSearchParams({ environment: env, journey: journeyName, nodeId });
            const res = await fetch(`/api/push/journey-node?${params}`);
            if (res.ok) {
              const data = await res.json() as { file?: { content?: string } };
              nodeContent = data.file?.content ?? null;
            }
          } catch { /* ignore */ }
        }
      }

      if (cancelled) return;
      if (!nodeContent) { setMessage("No config file found for this node."); setLoading(false); return; }

      // ── Step 2: extract script UUIDs ──────────────────────────────────────
      let nodeJson: Record<string, unknown> | null = null;
      try { nodeJson = JSON.parse(nodeContent); } catch { /* ignore */ }

      const scriptUuids: string[] = [];
      if (nodeJson) {
        for (const val of Object.values(nodeJson)) {
          if (typeof val === "string" && UUID_RE.test(val)) scriptUuids.push(val);
        }
      }

      if (!scriptUuids.length) { setMessage("No scripts linked to this node."); setLoading(false); return; }

      // ── Step 3: build entries — diff files first, API fallback for unchanged ──
      const env = sourceEnv || targetEnv;
      const result: ScriptEntry[] = [];

      for (const uuid of scriptUuids) {
        if (cancelled) break;

        const configFile = files.find((f) => f.relativePath.includes(`/scripts-config/${uuid}.json`));
        if (configFile) {
          let name = uuid;
          const cfgContent = configFile.localContent ?? configFile.remoteContent;
          if (cfgContent) {
            try {
              const j = JSON.parse(cfgContent) as Record<string, unknown>;
              if (typeof j.name === "string" && j.name) name = j.name;
            } catch { /* ignore */ }
          }
          const contentFile = files.find(
            (f) =>
              f.relativePath.includes("/scripts-content/") &&
              f.relativePath.split("/").pop()?.replace(/\.[^.]+$/, "") === name,
          );
          result.push({ uuid, name, configFile, contentFile });
        } else if (env) {
          // Script unchanged — fetch content directly from API
          try {
            const params = new URLSearchParams({ environment: env, scriptId: uuid });
            const res = await fetch(`/api/push/script?${params}`);
            if (res.ok) {
              const data = await res.json() as { name?: string; content?: string | null };
              result.push({ uuid, name: data.name ?? uuid, fetchedContent: data.content ?? null });
            }
          } catch { /* ignore */ }
        }
      }

      if (cancelled) return;
      if (!result.length) setMessage("No scripts found for this node.");
      else setEntries(result);
      setLoading(false);
    };

    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, journeyName, sourceEnv, targetEnv, files]);

  if (!nodeId)  return <p className="px-3 py-2 text-xs text-slate-400">No node selected.</p>;
  if (loading)  return <p className="px-3 py-2 text-xs text-slate-400">Loading scripts…</p>;
  if (message)  return <div className="px-3 py-2 text-xs text-slate-400">{message}</div>;

  return (
    <div className="divide-y divide-slate-100">
      {entries.map((entry) => (
        <div key={entry.uuid} className="py-2">
          <div className="flex items-center gap-1.5 px-3 pb-1">
            <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            <span className="text-[11px] font-medium text-slate-700 truncate">{entry.name}</span>
            {!entry.configFile && (
              <span className="text-[9px] text-slate-400 uppercase font-semibold ml-auto shrink-0">unchanged</span>
            )}
          </div>

          {/* Unchanged script fetched from API — render as plain viewer */}
          {!entry.configFile && entry.fetchedContent !== undefined && (
            <>
              {entry.fetchedContent ? (
                <UnchangedScriptViewer name={entry.name} content={entry.fetchedContent} />
              ) : (
                <p className="px-3 text-[10px] text-slate-400 italic">No content</p>
              )}
            </>
          )}

          {/* Changed script — render diff for each file */}
          {entry.configFile && [
            ...(entry.configFile  ? [entry.configFile]  : []),
            ...(entry.contentFile ? [entry.contentFile] : []),
          ].map((f) => {
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
      ))}
    </div>
  );
}

// ── NodeDetailPanel ────────────────────────────────────────────────────────────

function NodeDetailPanel({
  nodeId, nodeLabel, nodeType, diffStatus, modifiedReason,
  graphEdges, graphNodeLabels,
  journeyName, files, sourceEnv, targetEnv,
  navigating, onNavigateInto, onClose,
}: {
  nodeId: string;
  nodeLabel: string;
  nodeType?: string;
  diffStatus: DiffStatus;
  modifiedReason?: "script" | "subjourney";
  graphEdges: Edge[];
  graphNodeLabels: Map<string, string>;
  journeyName: string;
  files: FileDiff[];
  sourceEnv: string;
  targetEnv: string;
  navigating: boolean;
  onNavigateInto: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab]                     = useState<"config" | "scripts">("config");
  const [config, setConfig]               = useState<Record<string, unknown> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const isStaticNode = nodeId === "startNode" || nodeId === DIFF_SUCCESS_ID || nodeId === DIFF_FAILURE_ID;

  // Reset tab when node changes
  useEffect(() => { setTab("config"); setConfig(null); }, [nodeId]);

  // Fetch node config
  useEffect(() => {
    if (isStaticNode) { setConfig(null); return; }
    let cancelled = false;
    setConfigLoading(true);
    setConfig(null);

    const run = async () => {
      const fileEntry = files.find(
        (f) => f.relativePath.includes(`/${nodeId}.json`) && f.relativePath.includes("/nodes/"),
      );
      const content = fileEntry?.localContent ?? fileEntry?.remoteContent;
      if (content) {
        try { if (!cancelled) setConfig(JSON.parse(content)); } catch { /* ignore */ }
        if (!cancelled) setConfigLoading(false);
        return;
      }
      const env = sourceEnv || targetEnv;
      if (!env || !journeyName) { if (!cancelled) setConfigLoading(false); return; }
      try {
        const params = new URLSearchParams({ environment: env, journey: journeyName, nodeId });
        const res = await fetch(`/api/push/journey-node?${params}`);
        if (res.ok && !cancelled) {
          const d = await res.json() as { file?: { content?: string } };
          try { setConfig(JSON.parse(d.file?.content ?? "")); } catch { setConfig(null); }
        }
      } catch { /* ignore */ }
      if (!cancelled) setConfigLoading(false);
    };
    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, isStaticNode, sourceEnv, targetEnv, journeyName, files]);

  // Resolve outcomes from edges
  const outcomes = useMemo(() =>
    graphEdges
      .filter((e) => e.source === nodeId && e.id !== "__start__")
      .map((e) => ({
        outcomeId: typeof e.label === "string" && e.label ? e.label : "outcome",
        targetId: e.target,
        targetLabel: graphNodeLabels.get(e.target) ?? e.target.slice(0, 8),
      })),
  [nodeId, graphEdges, graphNodeLabels]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-700 truncate" title={nodeLabel}>{nodeLabel}</div>
          {nodeType && (
            <div className="text-[9px] text-slate-400 font-mono truncate">{nodeType}</div>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab bar (hidden for static nodes) */}
      {!isStaticNode && (
        <div className="flex border-b border-slate-200 shrink-0">
          {(["config", "scripts"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-medium transition-colors border-b-2 capitalize",
                tab === t ? "border-sky-500 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Static node info */}
        {isStaticNode && (
          <div className="px-3 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <DiffStatusBadge status={diffStatus} />
            </div>
            <p className="text-[9px] text-slate-400 font-mono break-all">{nodeId}</p>
          </div>
        )}

        {/* Config tab */}
        {!isStaticNode && tab === "config" && (
          <>
            {/* Status */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <DiffStatusBadge status={diffStatus} />
              {modifiedReason === "script" && (
                <span className="text-[9px] font-medium text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">script changed</span>
              )}
              {modifiedReason === "subjourney" && (
                <span className="text-[9px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">sub-journey changed</span>
              )}
            </div>

            {/* Outcomes */}
            {outcomes.length > 0 && (
              <div className="px-3 py-3 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Outcomes</p>
                <div className="space-y-2">
                  {outcomes.map(({ outcomeId, targetLabel }) => (
                    <div key={outcomeId} className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 shrink-0">{outcomeId}</span>
                      <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-[11px] text-slate-700 truncate">{targetLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descend into inner journey */}
            {nodeType === "InnerTreeEvaluatorNode" && (
              <div className="px-3 py-3 border-b border-slate-100">
                <button
                  type="button"
                  disabled={navigating}
                  onClick={() => onNavigateInto(nodeId)}
                  className="w-full flex items-center gap-2 text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {navigating ? (
                    <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  <span className="flex-1 text-left">{navigating ? "Loading…" : "Descend into journey"}</span>
                  {typeof config?.tree === "string" && config.tree && (
                    <span className="font-mono text-[10px] text-sky-400 truncate max-w-[100px]">{config.tree}</span>
                  )}
                </button>
              </div>
            )}

            {/* Configuration properties */}
            <div className="px-3 py-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Configuration</p>
              {configLoading && <p className="text-[11px] text-slate-400">Loading…</p>}
              {!configLoading && config && <PropertyTable config={config} />}
              {!configLoading && !config && <p className="text-[11px] text-slate-400">No configuration file found</p>}
            </div>
          </>
        )}

        {/* Scripts tab */}
        {!isStaticNode && tab === "scripts" && (
          <ScriptPanelContent
            nodeId={nodeId}
            nodeType={nodeType}
            journeyName={journeyName}
            files={files}
            sourceEnv={sourceEnv}
            targetEnv={targetEnv}
          />
        )}
      </div>
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
  searchQuery: string;
  flashNodeId: string | null;
  zoomToNodeId?: string | null;
}

function DiffGraphCanvasInner({
  baseNodes,
  baseEdges,
  hideUnchanged,
  fitKey,
  externalViewport,
  onViewportChange,
  onNodeActivate,
  searchQuery,
  flashNodeId,
  zoomToNodeId,
}: DiffGraphCanvasInnerProps) {
  const { fitView, setViewport, getViewport } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId]   = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId]     = useState<string | null>(null);
  const [pinnedEdgeId, setPinnedEdgeId]       = useState<string | null>(null);

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

  // Edge handlers
  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((_e, edge) => setHoveredEdgeId(edge.id), []);
  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => setHoveredEdgeId(null), []);
  const handleEdgeClick: EdgeMouseHandler      = useCallback((_e, edge) => setPinnedEdgeId((p) => p === edge.id ? null : edge.id), []);

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

  // Zoom to a specific node (used when opening the graph from a script row)
  useEffect(() => {
    if (!zoomToNodeId) return;
    const t = setTimeout(() => {
      void fitView({ nodes: [{ id: zoomToNodeId }], duration: 600, padding: 0.35 });
    }, 150);
    return () => clearTimeout(t);
  }, [zoomToNodeId, fitView]);

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

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(
      nodes.filter((n) => String(n.data.label ?? "").toLowerCase().includes(q)).map((n) => n.id),
    );
  }, [searchQuery, nodes]);

  useEffect(() => {
    if (searchMatches.size === 0) return;
    const t = setTimeout(() => {
      void fitView({ nodes: [...searchMatches].map((id) => ({ id })), duration: 500, padding: 0.4 });
    }, 50);
    return () => clearTimeout(t);
  }, [searchMatches, fitView]);

  // Apply opacity/animation to nodes and edges based on selection
  const styledNodes = useMemo(() => {
    return filteredNodes.map((n) => {
      const onPath = highlighted ? highlighted.has(n.id) : true;
      return {
        ...n,
        data: {
          ...n.data,
          isFlashing:    n.id === flashNodeId,
          isSearchMatch: searchMatches.has(n.id),
        },
        style: {
          ...n.style,
          opacity: highlighted ? (onPath ? 1 : 0.15) : 1,
          transition: "opacity 0.2s",
        },
      };
    });
  }, [filteredNodes, highlighted, flashNodeId, searchMatches]);

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
        style: {
          ...e.style,
          opacity,
          strokeWidth: isActive ? 3 : 1.5,
          stroke,
          transition: "opacity 0.15s, stroke-width 0.15s",
        },
        animated: !activeEdgeId && onPath && !!highlighted,
        label: opacity < 0.5 ? undefined : e.label,
      };
    });
  }, [filteredEdges, highlighted, hoveredEdgeId, pinnedEdgeId]);

  const miniMapNodeColor = useCallback((n: Node): string => {
    if (n.data.diffStatus === "modified") {
      if (n.data.modifiedReason === "script")    return "#f97316"; // orange
      if (n.data.modifiedReason === "subjourney") return "#8b5cf6"; // violet
      return "#f59e0b"; // amber
    }
    switch (n.data.diffStatus as DiffStatus) {
      case "added":     return "#10b981";
      case "removed":   return "#ef4444";
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
      onEdgeMouseEnter={handleEdgeMouseEnter}
      onEdgeMouseLeave={handleEdgeMouseLeave}
      onEdgeClick={handleEdgeClick}
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

export interface NavEntry {
  name: string;
  localContent?: string;
  remoteContent?: string;
  nodeInfos: JourneyNodeInfo[];
  sourceNodeId?: string;  // which node was clicked to navigate here
}

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
  /** Pre-populate the nav stack with ancestor journeys so the user can navigate back up. */
  ancestorPath?: NavEntry[];
  /** When set, the modal will zoom to and activate this node once the graph loads. */
  initialFocusNodeId?: string;
  onClose: () => void;
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
  ancestorPath,
  initialFocusNodeId,
  onClose,
}: JourneyDiffGraphModalProps) {
  const [viewMode, setViewMode]             = useState<"merged" | "side-by-side">("merged");
  const [hideUnchanged, setHideUnchanged]   = useState(false);
  const [syncViewports, setSyncViewports]   = useState(true);
  const [fitKey, setFitKey]                 = useState(0);
  // navStack holds ALL levels: [ancestors..., current]. It always has at least one entry.
  const [navStack, setNavStack]             = useState<NavEntry[]>(() => [
    ...(ancestorPath ?? []),
    { name: journeyName, localContent, remoteContent, nodeInfos },
  ]);
  const [navigating, setNavigating]         = useState(false);
  const [activeNode, setActiveNode]         = useState<{
    id: string;
    label: string;
    nodeType?: string;
    diffStatus: DiffStatus;
    modifiedReason?: "script" | "subjourney";
  } | null>(null);

  const [searchQuery, setSearchQuery]   = useState("");
  const [flashNodeId, setFlashNodeId]   = useState<string | null>(null);
  // Pending focus: activate + zoom to this node once the graph content is ready
  const [pendingFocusNodeId, setPendingFocusNodeId] = useState<string | null>(initialFocusNodeId ?? null);
  const [zoomToNodeId, setZoomToNodeId] = useState<string | null>(null);

  const [leftExternalVP,  setLeftExternalVP]  = useState<Viewport | null>(null);
  const [rightExternalVP, setRightExternalVP] = useState<Viewport | null>(null);
  const syncSource = useRef<"left" | "right" | null>(null);

  // Active journey is always the last entry in the stack.
  const active = navStack[navStack.length - 1] ?? { name: journeyName, localContent, remoteContent, nodeInfos };

  const hasContent = !!(active.localContent || active.remoteContent);
  const nodesOnly  = !hasContent && active.nodeInfos.length > 0;

  // When the active journey has no content (unchanged journey not included in diff),
  // fetch from the API so wiring/edges can be rendered.
  useEffect(() => {
    if (hasContent) return;
    const env = sourceEnv || targetEnv;
    if (!env) return;
    const name = active.name;
    let cancelled = false;
    const fetchContent = async () => {
      try {
        const params = new URLSearchParams({ environment: env, scope: "journeys", item: name });
        const res = await fetch(`/api/push/item?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { files?: Array<{ content?: string }> };
        const content = data.files?.[0]?.content;
        if (!content || cancelled) return;
        // Update the active entry in navStack with the fetched content on both sides
        // (unchanged journey is identical on both sides).
        setNavStack((prev) => prev.map((entry, i) =>
          i === prev.length - 1
            ? { ...entry, localContent: content, remoteContent: content }
            : entry,
        ));
      } catch { /* ignore */ }
    };
    void fetchContent();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.name, hasContent, sourceEnv, targetEnv]);

  // ESC pops nav stack (or closes modal when at root)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (navStack.length > 1) {
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

  // Flash auto-clear
  useEffect(() => {
    if (!flashNodeId) return;
    const t = setTimeout(() => setFlashNodeId(null), 1200);
    return () => clearTimeout(t);
  }, [flashNodeId]);

  // Build nodeStatusMap and nodeModifiedReasonMap
  const nodeStatusMap = useMemo(() => {
    const m = new Map<string, DiffStatus>();
    for (const n of active.nodeInfos) m.set(n.uuid, n.status as DiffStatus);
    return m;
  }, [active.nodeInfos]);

  const nodeModifiedReasonMap = useMemo(() => {
    const m = new Map<string, "script" | "subjourney">();
    for (const n of active.nodeInfos) {
      if (n.modifiedReason) m.set(n.uuid, n.modifiedReason);
    }
    return m;
  }, [active.nodeInfos]);

  // Build all graphs
  const { mergedNodes, mergedEdges, localNodes, localEdges, remoteNodes, remoteEdges } =
    useMemo(() => {
      if (!hasContent) {
        const { nodes, edges } = parseNodesOnlyGraph(
          active.nodeInfos.map((n) => ({ ...n, status: n.status as DiffStatus })),
        );
        // Inject modifiedReason into fallback nodes too
        for (const node of nodes) {
          const reason = nodeModifiedReasonMap.get(node.id);
          if (reason) node.data = { ...node.data, modifiedReason: reason };
        }
        return {
          mergedNodes: nodes, mergedEdges: edges,
          localNodes:  nodes, localEdges:  edges,
          remoteNodes: nodes, remoteEdges: edges,
        };
      }

      const merged = parseMergedDiffGraph(active.localContent, active.remoteContent, nodeStatusMap, nodeModifiedReasonMap);
      const local  = active.localContent
        ? parseSingleSideGraph(active.localContent,  nodeStatusMap, "local",  nodeModifiedReasonMap)
        : { nodes: [] as Node[], edges: [] as Edge[] };
      const remote = active.remoteContent
        ? parseSingleSideGraph(active.remoteContent, nodeStatusMap, "remote", nodeModifiedReasonMap)
        : { nodes: [] as Node[], edges: [] as Edge[] };

      return {
        mergedNodes: merged.nodes, mergedEdges: merged.edges,
        localNodes:  local.nodes,  localEdges:  local.edges,
        remoteNodes: remote.nodes, remoteEdges: remote.edges,
      };
    }, [hasContent, active.localContent, active.remoteContent, active.nodeInfos, nodeStatusMap, nodeModifiedReasonMap]);

  const graphNodeLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of mergedNodes) {
      const label = typeof n.data.label === "string" ? n.data.label : n.id;
      map.set(n.id, label);
    }
    return map;
  }, [mergedNodes]);

  // When the graph has content and a pending focus node, activate + zoom to it
  useEffect(() => {
    if (!pendingFocusNodeId || !hasContent || mergedNodes.length === 0) return;
    const node = mergedNodes.find((n) => n.id === pendingFocusNodeId);
    if (node) {
      setActiveNode({
        id: node.id,
        label: typeof node.data.label === "string" ? node.data.label : node.id,
        nodeType: typeof node.data.nodeType === "string" ? node.data.nodeType : undefined,
        diffStatus: (node.data.diffStatus as DiffStatus) ?? "unchanged",
        modifiedReason: node.data.modifiedReason as "script" | "subjourney" | undefined,
      });
      setFlashNodeId(pendingFocusNodeId);
      setZoomToNodeId(pendingFocusNodeId);
    }
    setPendingFocusNodeId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFocusNodeId, hasContent, mergedNodes]);

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
  const navigateInto = useCallback(async (nodeId: string, _nodeData: Record<string, unknown>) => {
    setNavigating(true);
    try {
      // Step 1: get the real tree name from the node config.
      // Try FileDiff first (works when node config was changed), then fall back to the
      // journey-node API (works for unchanged node configs).
      let treeName: string | null = null;

      const nodeConfigFile = files.find(
        (f) => f.relativePath.includes(`/${nodeId}.json`) && f.relativePath.includes("/nodes/"),
      );
      if (nodeConfigFile) {
        const content = nodeConfigFile.localContent ?? nodeConfigFile.remoteContent;
        if (content) {
          try {
            const json = JSON.parse(content) as Record<string, unknown>;
            if (typeof json.tree === "string" && json.tree) treeName = json.tree;
          } catch { /* ignore */ }
        }
      }

      if (!treeName) {
        // Fetch node config via API to get the `tree` field
        const env = sourceEnv || targetEnv;
        if (env) {
          try {
            const params = new URLSearchParams({ environment: env, journey: active.name, nodeId });
            const res = await fetch(`/api/push/journey-node?${params}`);
            if (res.ok) {
              const data = await res.json() as { file?: { content?: string } };
              if (data.file?.content) {
                const json = JSON.parse(data.file.content) as Record<string, unknown>;
                if (typeof json.tree === "string" && json.tree) treeName = json.tree;
              }
            }
          } catch { /* ignore */ }
        }
      }

      if (!treeName) return; // can't determine sub-journey name

      // Step 2: find sub-journey JSON from already-loaded files (works for changed journeys)
      const subFile = files.find((f) => f.relativePath.endsWith(`/journeys/${treeName}/${treeName}.json`));
      let subLocalContent  = subFile?.localContent;
      let subRemoteContent = subFile?.remoteContent;

      // Step 3: fetch content from both environments when not available in files
      const fetchJourney = async (env: string): Promise<string | undefined> => {
        try {
          const params = new URLSearchParams({ environment: env, scope: "journeys", item: treeName! });
          const res = await fetch(`/api/push/item?${params}`);
          if (!res.ok) return undefined;
          const data = await res.json() as { files?: Array<{ content?: string }> };
          return data.files?.[0]?.content ?? undefined;
        } catch { return undefined; }
      };

      if (!subLocalContent  && sourceEnv) subLocalContent  = await fetchJourney(sourceEnv);
      if (!subRemoteContent && targetEnv) subRemoteContent = await fetchJourney(targetEnv);

      setNavStack((prev) => [...prev, {
        name: treeName!,
        localContent:  subLocalContent,
        remoteContent: subRemoteContent,
        nodeInfos:     [],
        sourceNodeId:  nodeId,
      }]);
      setActiveNode(null);
      setFitKey((k) => k + 1);
    } finally {
      setNavigating(false);
    }
  }, [files, sourceEnv, targetEnv, active.name]);

  // Handle node activate from canvas
  const handleNodeActivate = useCallback((nodeId: string | null, nodeData: Record<string, unknown>) => {
    if (!nodeId) {
      setActiveNode(null);
      return;
    }
    const diffStatus     = (nodeData.diffStatus as DiffStatus) ?? "unchanged";
    const label          = typeof nodeData.label    === "string" ? nodeData.label    : nodeId;
    const nodeType       = typeof nodeData.nodeType === "string" ? nodeData.nodeType : undefined;
    const modifiedReason = (nodeData.modifiedReason as "script" | "subjourney" | undefined);

    setActiveNode({ id: nodeId, label, nodeType, diffStatus, modifiedReason });
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
          {navStack.length <= 1 ? (
            <span className="text-sm font-semibold text-slate-800 truncate" title={navStack[0]?.name ?? journeyName}>
              {navStack[0]?.name ?? journeyName}
            </span>
          ) : (
            <nav className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
              {navStack.map((entry, i) => (
                <Fragment key={`${entry.name}-${i}`}>
                  {i > 0 && <span className="text-slate-400 shrink-0">›</span>}
                  {i < navStack.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const flashTarget = navStack[i + 1]?.sourceNodeId ?? null;
                        setNavStack((prev) => prev.slice(0, i + 1));
                        setActiveNode(null);
                        setFitKey((k) => k + 1);
                        if (flashTarget) setFlashNodeId(flashTarget);
                      }}
                      className={cn("hover:text-sky-800 truncate max-w-[150px] shrink-0 text-sky-600", i === 0 && "font-semibold")}
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

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1 shrink-0">
          <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes…"
            className="text-xs w-28 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

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
              searchQuery={searchQuery}
              flashNodeId={flashNodeId}
              zoomToNodeId={zoomToNodeId}
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
                  searchQuery={searchQuery}
                  flashNodeId={flashNodeId}
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
                  searchQuery={searchQuery}
                  flashNodeId={flashNodeId}
                />
              </div>
            </>
          )}
        </div>

        {/* Side panel */}
        {showSidePanel && activeNode && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            <NodeDetailPanel
              nodeId={activeNode.id}
              nodeLabel={activeNode.label}
              nodeType={activeNode.nodeType}
              diffStatus={activeNode.diffStatus}
              modifiedReason={activeNode.modifiedReason}
              graphEdges={mergedEdges}
              graphNodeLabels={graphNodeLabels}
              journeyName={active.name}
              files={files}
              sourceEnv={sourceEnv}
              targetEnv={targetEnv}
              navigating={navigating}
              onNavigateInto={(id) => void navigateInto(id, {})}
              onClose={() => setActiveNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
