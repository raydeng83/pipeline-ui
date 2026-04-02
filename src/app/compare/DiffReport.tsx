"use client";

import { useState } from "react";
import type { CompareReport, FileDiff, DiffLine } from "@/lib/diff-types";
import { cn } from "@/lib/utils";

// ── Syntax highlight ──────────────────────────────────────────────────────────

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
    }
  );
}

// ── Context collapsing ────────────────────────────────────────────────────────

const CONTEXT_LINES = 3;

type HunkItem = DiffLine | { type: "ellipsis"; count: number; startIdx: number };

function buildHunks(lines: DiffLine[]): HunkItem[] {
  const changed = new Set<number>();
  lines.forEach((l, i) => { if (l.type !== "context") changed.add(i); });

  const visible = new Set<number>();
  for (const idx of changed) {
    for (let j = Math.max(0, idx - CONTEXT_LINES); j <= Math.min(lines.length - 1, idx + CONTEXT_LINES); j++) {
      visible.add(j);
    }
  }

  const result: HunkItem[] = [];
  let i = 0;
  while (i < lines.length) {
    if (visible.has(i)) {
      result.push(lines[i]);
      i++;
    } else {
      const start = i;
      while (i < lines.length && !visible.has(i)) i++;
      result.push({ type: "ellipsis", count: i - start, startIdx: start });
    }
  }
  return result;
}

// ── Unified diff viewer ───────────────────────────────────────────────────────

function DiffViewer({ lines }: { lines: DiffLine[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const hunks = buildHunks(lines);

  let leftNo = 0, rightNo = 0;
  // Pre-compute line numbers at each index
  const lineNums: Array<{ left: number | null; right: number | null }> = lines.map((l) => {
    if (l.type === "removed") { leftNo++; return { left: leftNo, right: null }; }
    if (l.type === "added")   { rightNo++; return { left: null, right: rightNo }; }
    leftNo++; rightNo++;
    return { left: leftNo, right: rightNo };
  });

  // Track index into lines as we render hunks
  let lineIdx = 0;

  return (
    <div className="overflow-x-auto bg-slate-950 text-[11px] font-mono leading-5 max-h-[600px] overflow-y-auto">
      <table className="w-full border-collapse">
        <tbody>
          {hunks.map((item, hi) => {
            if (item.type === "ellipsis") {
              const si = item.startIdx;
              lineIdx += item.count;
              return (
                <tr key={`e-${hi}`} className="bg-slate-900">
                  <td colSpan={4} className="py-0.5 px-3 text-center">
                    <button
                      onClick={() => setExpanded((prev) => { const s = new Set(prev); s.has(si) ? s.delete(si) : s.add(si); return s; })}
                      className="text-sky-500 hover:text-sky-300 text-[10px]"
                    >
                      {expanded.has(si)
                        ? "▲ collapse"
                        : `▼ ${item.count} unchanged line${item.count !== 1 ? "s" : ""}`}
                    </button>
                    {expanded.has(si) && lines.slice(si, si + item.count).map((l, j) => {
                      const { left, right } = lineNums[si + j];
                      return (
                        <div key={j} className="text-left flex">
                          <span className="select-none text-slate-600 text-right w-10 border-r border-slate-800 px-2">{left}</span>
                          <span className="select-none text-slate-600 text-right w-10 border-r border-slate-800 px-2">{right}</span>
                          <span className="select-none w-4 px-1 text-slate-600"> </span>
                          <span
                            className="px-2 whitespace-pre text-slate-500"
                            dangerouslySetInnerHTML={{ __html: highlightLine(l.content) }}
                          />
                        </div>
                      );
                    })}
                  </td>
                </tr>
              );
            }

            const l = item as DiffLine;
            const { left, right } = lineNums[lineIdx++];
            const bg = l.type === "added" ? "bg-emerald-950" : l.type === "removed" ? "bg-red-950" : "";
            const pfxColor = l.type === "added" ? "text-emerald-400" : l.type === "removed" ? "text-red-400" : "text-slate-600";
            const textColor = l.type === "added" ? "text-emerald-300" : l.type === "removed" ? "text-red-300" : "text-slate-400";
            const prefix = l.type === "added" ? "+" : l.type === "removed" ? "-" : " ";

            return (
              <tr key={`l-${hi}`} className={bg}>
                <td className="select-none text-slate-600 text-right px-2 py-0 w-10 border-r border-slate-800">{left ?? ""}</td>
                <td className="select-none text-slate-600 text-right px-2 py-0 w-10 border-r border-slate-800">{right ?? ""}</td>
                <td className={cn("px-1 py-0 select-none w-4", pfxColor)}>{prefix}</td>
                <td
                  className={cn("px-2 py-0 whitespace-pre", textColor)}
                  dangerouslySetInnerHTML={{ __html: highlightLine(l.content) }}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Side-by-side file viewer ──────────────────────────────────────────────────

function SideBySideViewer({ localContent, remoteContent }: { localContent?: string; remoteContent?: string }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-slate-700 bg-slate-950 max-h-[600px] overflow-hidden">
      <FilePane label="Local" content={localContent} absence="Not present locally" />
      <FilePane label="Remote" content={remoteContent} absence="Not present remotely" />
    </div>
  );
}

function FilePane({ label, content, absence }: { label: string; content?: string; absence: string }) {
  return (
    <div className="flex flex-col min-h-0 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      {content !== undefined ? (
        <pre
          className="flex-1 overflow-auto text-[11px] font-mono leading-5 text-slate-300 p-3 whitespace-pre"
          dangerouslySetInnerHTML={{
            __html: content.split("\n").map(highlightLine).join("\n"),
          }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-600 italic">{absence}</div>
      )}
    </div>
  );
}

// ── File row ──────────────────────────────────────────────────────────────────

type ViewMode = "diff" | "files";

const STATUS_STYLES: Record<FileDiff["status"], { badge: string; icon: string }> = {
  added:     { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: "A" },
  removed:   { badge: "bg-red-100 text-red-700 border border-red-200",             icon: "D" },
  modified:  { badge: "bg-amber-100 text-amber-700 border border-amber-200",        icon: "M" },
  unchanged: { badge: "bg-slate-100 text-slate-500 border border-slate-200",        icon: "=" },
};

function FileRow({ file }: { file: FileDiff }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("diff");
  const s = STATUS_STYLES[file.status];
  const hasDiff = !!file.diffLines?.length;
  const hasContent = file.localContent !== undefined || file.remoteContent !== undefined;

  const added   = file.linesAdded   ?? 0;
  const removed = file.linesRemoved ?? 0;

  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      {/* Row header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs transition-colors",
          hasDiff ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
          open ? "bg-slate-50 border-b border-slate-200" : "bg-white"
        )}
        onClick={() => hasDiff && setOpen((o) => !o)}
      >
        <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0", s.badge)}>
          {s.icon}
        </span>
        <span className="font-mono text-slate-700 truncate flex-1 min-w-0">{file.relativePath}</span>

        {/* +/- summary */}
        {(added > 0 || removed > 0) && (
          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono">
            {added   > 0 && <span className="text-emerald-600">+{added}</span>}
            {removed > 0 && <span className="text-red-500">−{removed}</span>}
          </span>
        )}

        {/* View toggle — only when open */}
        {open && (
          <div
            className="flex items-center rounded border border-slate-300 overflow-hidden text-[10px] shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {(["diff", "files"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                disabled={m === "files" && !hasContent}
                className={cn(
                  "px-2 py-0.5 capitalize transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                  view === m ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {hasDiff && (
          <span className="text-slate-400 shrink-0">{open ? "▲" : "▼"}</span>
        )}
      </div>

      {/* Body */}
      {open && (
        view === "diff" && file.diffLines
          ? <DiffViewer lines={file.diffLines} />
          : <SideBySideViewer localContent={file.localContent} remoteContent={file.remoteContent} />
      )}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function FileSection({
  title, files, defaultOpen, badgeClass,
}: {
  title: string;
  files: FileDiff[];
  defaultOpen?: boolean;
  badgeClass: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  if (files.length === 0) return null;

  const totalAdded   = files.reduce((s, f) => s + (f.linesAdded   ?? 0), 0);
  const totalRemoved = files.reduce((s, f) => s + (f.linesRemoved ?? 0), 0);

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left mb-2">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badgeClass)}>{files.length}</span>
        {(totalAdded > 0 || totalRemoved > 0) && (
          <span className="text-[10px] font-mono flex gap-1.5">
            {totalAdded   > 0 && <span className="text-emerald-600">+{totalAdded}</span>}
            {totalRemoved > 0 && <span className="text-red-500">−{totalRemoved}</span>}
          </span>
        )}
        <span className="ml-auto text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-1.5">
          {files.map((f) => <FileRow key={f.relativePath} file={f} />)}
        </div>
      )}
    </div>
  );
}

// ── Main report ───────────────────────────────────────────────────────────────

export function DiffReport({ report }: { report: CompareReport }) {
  const { summary, files } = report;
  const total    = summary.added + summary.removed + summary.modified + summary.unchanged;
  const modified = files.filter((f) => f.status === "modified");
  const added    = files.filter((f) => f.status === "added");
  const removed  = files.filter((f) => f.status === "removed");

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Comparison Report — <span className="font-mono">{report.environment}</span>
          </h2>
          <span className="text-xs text-slate-400">{new Date(report.generatedAt).toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Stat count={summary.modified}  label="Modified"  color="text-amber-600"   bg="bg-amber-50" />
          <Stat count={summary.added}     label="Added"     color="text-emerald-600" bg="bg-emerald-50" />
          <Stat count={summary.removed}   label="Removed"   color="text-red-600"     bg="bg-red-50" />
          <Stat count={summary.unchanged} label="Unchanged" color="text-slate-500"   bg="bg-slate-50" />
          <span className="ml-auto text-xs text-slate-400 self-center">{total} files total</span>
        </div>
        {report.scopes.length > 0 && (
          <p className="text-xs text-slate-400">Scopes: {report.scopes.join(", ")}</p>
        )}
        <p className="text-xs text-slate-400 font-mono truncate" title={report.localConfigDir}>
          Local: {report.localConfigDir}
        </p>
      </div>

      {/* Sections */}
      <div className="p-5 space-y-6">
        {summary.modified === 0 && summary.added === 0 && summary.removed === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Local config is in sync with remote — no differences found.
          </p>
        ) : (
          <>
            <FileSection title="Modified" files={modified} defaultOpen badgeClass="bg-amber-100 text-amber-700" />
            <FileSection title="Added in remote" files={added} defaultOpen={added.length <= 10} badgeClass="bg-emerald-100 text-emerald-700" />
            <FileSection title="Removed from remote" files={removed} defaultOpen={removed.length <= 10} badgeClass="bg-red-100 text-red-700" />
          </>
        )}
        {summary.unchanged > 0 && (
          <p className="text-xs text-slate-400 text-center">
            {summary.unchanged} file{summary.unchanged !== 1 ? "s" : ""} unchanged
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg", bg)}>
      <span className={cn("text-lg font-bold leading-none", color)}>{count}</span>
      <span className={cn("text-xs", color)}>{label}</span>
    </div>
  );
}
