"use client";

import { useState, useMemo } from "react";
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
  const lineNums: Array<{ left: number | null; right: number | null }> = lines.map((l) => {
    if (l.type === "removed") { leftNo++; return { left: leftNo, right: null }; }
    if (l.type === "added")   { rightNo++; return { left: null, right: rightNo }; }
    leftNo++; rightNo++;
    return { left: leftNo, right: rightNo };
  });

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

// ── Side-by-side file viewer ────────────────────────────────────────────────

function SideBySideViewer({
  localContent,
  remoteContent,
  sourceLabel,
  targetLabel,
}: {
  localContent?: string;
  remoteContent?: string;
  sourceLabel: string;
  targetLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-slate-700 bg-slate-950 max-h-[600px] overflow-hidden">
      <FilePane label={sourceLabel} content={localContent} absence={`Not in ${sourceLabel}`} />
      <FilePane label={targetLabel} content={remoteContent} absence={`Not in ${targetLabel}`} />
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

// ── Display name resolution ──────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveDisplayName(file: FileDiff): { name: string; detail: string } {
  const parts = file.relativePath.split("/");
  const fileName = parts[parts.length - 1];
  const stem = fileName.replace(/\.[^.]+$/, "");

  // Journeys: realms/<realm>/journeys/<JourneyName>/...
  const journeyIdx = parts.indexOf("journeys");
  if (journeyIdx >= 0 && parts.length > journeyIdx + 1) {
    const journeyName = parts[journeyIdx + 1];
    // Sub-path within journey (e.g., nodes/nodeId.json)
    const subPath = parts.slice(journeyIdx + 2).join("/");
    if (subPath && subPath !== `${journeyName}.json`) {
      return { name: `${journeyName} / ${subPath}`, detail: file.relativePath };
    }
    return { name: journeyName, detail: file.relativePath };
  }

  // Script config: scripts/scripts-config/{uuid}.json → parse name from content
  if (parts.includes("scripts-config") && UUID_RE.test(stem)) {
    const content = file.localContent ?? file.remoteContent;
    if (content) {
      try {
        const json = JSON.parse(content);
        if (typeof json.name === "string" && json.name) {
          return { name: json.name, detail: `${stem}` };
        }
      } catch { /* fall through */ }
    }
    return { name: stem, detail: file.relativePath };
  }

  // Script content: scripts/scripts-content/{type}/{ScriptName}.ext
  if (parts.includes("scripts-content")) {
    return { name: stem, detail: file.relativePath };
  }

  // Other JSON with name field
  if (fileName.endsWith(".json") && UUID_RE.test(stem)) {
    const content = file.localContent ?? file.remoteContent;
    if (content) {
      try {
        const json = JSON.parse(content);
        const name = json.name ?? json._id ?? json.displayName;
        if (typeof name === "string" && name) {
          return { name, detail: stem };
        }
      } catch { /* fall through */ }
    }
  }

  // Default: filename without extension
  return { name: stem, detail: parts.length > 1 ? file.relativePath : "" };
}

// ── File row ────────────────────────────────────────────────────────────────

type ViewMode = "diff" | "files";

const STATUS_STYLES: Record<FileDiff["status"], { badge: string; icon: string }> = {
  added:     { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: "A" },
  removed:   { badge: "bg-red-100 text-red-700 border border-red-200",             icon: "D" },
  modified:  { badge: "bg-amber-100 text-amber-700 border border-amber-200",        icon: "M" },
  unchanged: { badge: "bg-slate-100 text-slate-500 border border-slate-200",        icon: "=" },
};

function FileRow({ file, sourceLabel, targetLabel }: { file: FileDiff; sourceLabel: string; targetLabel: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("diff");
  const s = STATUS_STYLES[file.status];
  const hasDiff = !!file.diffLines?.length;
  const hasContent = file.localContent !== undefined || file.remoteContent !== undefined;

  const added   = file.linesAdded   ?? 0;
  const removed = file.linesRemoved ?? 0;

  const { name: displayName, detail: displayDetail } = resolveDisplayName(file);

  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
          hasDiff ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
          open ? "bg-slate-50 border-b border-slate-200" : "bg-white"
        )}
        onClick={() => hasDiff && setOpen((o) => !o)}
      >
        <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0", s.badge)}>
          {s.icon}
        </span>
        <span className="truncate flex-1 min-w-0" title={file.relativePath}>
          <span className="text-slate-700">{displayName}</span>
          {displayDetail && <span className="text-slate-400 font-mono text-[10px] ml-1.5">{displayDetail}</span>}
        </span>

        {(added > 0 || removed > 0) && (
          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono">
            {added   > 0 && <span className="text-emerald-600">+{added}</span>}
            {removed > 0 && <span className="text-red-500">−{removed}</span>}
          </span>
        )}

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

      {open && (
        view === "diff" && file.diffLines
          ? <DiffViewer lines={file.diffLines} />
          : <SideBySideViewer localContent={file.localContent} remoteContent={file.remoteContent} sourceLabel={sourceLabel} targetLabel={targetLabel} />
      )}
    </div>
  );
}

// ── Scope grouping ──────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<string, string> = {
  "access-config": "Access Config", "audit": "Audit", "authorization": "Authorization Policies",
  "cookie-domains": "Cookie Domains", "cors": "CORS", "csp": "CSP", "custom-nodes": "Custom Nodes",
  "email-provider": "Email Provider", "email-templates": "Email Templates", "endpoints": "Custom Endpoints",
  "esvs": "Secrets & Variables", "idm-authentication-config": "IDM Authentication",
  "iga": "IGA Workflows", "internal-roles": "Internal Roles", "journeys": "Journeys",
  "kba": "KBA", "locales": "Locales", "managed-objects": "Managed Objects",
  "org-privileges": "Org Privileges", "password-policy": "Password Policy", "raw": "Raw Config",
  "realm-config": "Realm Config", "schedules": "Schedules", "scripts": "Scripts",
  "secret-mappings": "Secret Mappings", "service-objects": "Service Objects", "services": "Services",
  "sync": "Sync & Connectors", "telemetry": "Telemetry", "terms-conditions": "Terms & Conditions",
  "themes": "Themes", "ui": "UI Config",
};

interface ScopeGroup {
  scope: string;
  label: string;
  files: FileDiff[];
  added: number;
  modified: number;
  removed: number;
}

function extractScope(relativePath: string): string {
  const parts = relativePath.split("/");
  // Realm-based: realms/<realm>/<scope>/...
  if (parts[0] === "realms" && parts.length >= 3) return parts[2];
  // Global: <scope>/...
  return parts[0];
}

function groupByScope(files: FileDiff[]): ScopeGroup[] {
  const map = new Map<string, FileDiff[]>();
  for (const f of files) {
    if (f.status === "unchanged") continue;
    const scope = extractScope(f.relativePath);
    if (!map.has(scope)) map.set(scope, []);
    map.get(scope)!.push(f);
  }

  return Array.from(map.entries())
    .map(([scope, scopeFiles]) => ({
      scope,
      label: SCOPE_LABELS[scope] ?? scope.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      files: scopeFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
      added: scopeFiles.filter((f) => f.status === "added").length,
      modified: scopeFiles.filter((f) => f.status === "modified").length,
      removed: scopeFiles.filter((f) => f.status === "removed").length,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ── Scope section ───────────────────────────────────────────────────────────

function ScopeSection({
  group, sourceLabel, targetLabel, defaultOpen,
}: {
  group: ScopeGroup;
  sourceLabel: string;
  targetLabel: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalLines = group.files.reduce((s, f) => s + (f.linesAdded ?? 0) + (f.linesRemoved ?? 0), 0);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-semibold text-slate-700 flex-1">{group.label}</span>

        {/* Per-scope status counts */}
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          {group.modified > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{group.modified} modified</span>
          )}
          {group.added > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{group.added} added</span>
          )}
          {group.removed > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">{group.removed} removed</span>
          )}
          {totalLines > 0 && (
            <span className="text-slate-400">({totalLines} lines)</span>
          )}
        </div>

        <span className="text-slate-400 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="p-3 space-y-1.5 bg-white">
          {group.files.map((f) => (
            <FileRow key={f.relativePath} file={f} sourceLabel={sourceLabel} targetLabel={targetLabel} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main report ─────────────────────────────────────────────────────────────

export function DiffReport({ report }: { report: CompareReport }) {
  const { summary, files } = report;
  const total = summary.added + summary.removed + summary.modified + summary.unchanged;
  const [hideUnchanged, setHideUnchanged] = useState(true);

  const sameEnv = report.source.environment === report.target.environment;
  const sourceLabel = sameEnv
    ? `${report.source.environment} (${report.source.mode})`
    : report.source.environment;
  const targetLabel = sameEnv
    ? `${report.target.environment} (${report.target.mode})`
    : report.target.environment;

  const scopeGroups = useMemo(() => groupByScope(files), [files]);
  const changedCount = summary.added + summary.removed + summary.modified;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            <span className="font-mono">{sourceLabel}</span>
            <span className="mx-1.5 text-slate-400">→</span>
            <span className="font-mono">{targetLabel}</span>
          </h2>
          <span className="text-xs text-slate-400">{new Date(report.generatedAt).toLocaleString()}</span>
        </div>

        {/* Stats cards */}
        <div className="flex flex-wrap gap-3">
          <Stat count={summary.modified}  label="Modified"  color="text-amber-600"   bg="bg-amber-50" />
          <Stat count={summary.added}     label="Added"     color="text-emerald-600" bg="bg-emerald-50" />
          <Stat count={summary.removed}   label="Removed"   color="text-red-600"     bg="bg-red-50" />
          <Stat count={summary.unchanged} label="Unchanged" color="text-slate-500"   bg="bg-slate-50" />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-slate-400">{total} files · {scopeGroups.length} scopes</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideUnchanged}
                onChange={(e) => setHideUnchanged(e.target.checked)}
                className="accent-sky-600"
              />
              Hide unchanged
            </label>
          </div>
        </div>
      </div>

      {/* Scope sections */}
      <div className="p-5 space-y-3">
        {changedCount === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No differences found — source and target configs are identical.
          </p>
        ) : (
          scopeGroups.map((group) => (
            <ScopeSection
              key={group.scope}
              group={group}
              sourceLabel={sourceLabel}
              targetLabel={targetLabel}
              defaultOpen={scopeGroups.length <= 5}
            />
          ))
        )}
        {!hideUnchanged && summary.unchanged > 0 && (
          <p className="text-xs text-slate-400 text-center pt-2">
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
