"use client";

import { useState, useEffect, useCallback } from "react";
import { Environment, CONFIG_SCOPES, ConfigScope } from "@/lib/fr-config-types";
import { FileNode } from "@/app/api/configs/[env]/route";
import type { ViewableFile } from "@/app/api/push/item/route";
import type { AuditItem } from "@/app/api/push/audit/route";
import { cn } from "@/lib/utils";
import { JourneyGraph } from "./JourneyGraph";
import { JourneyOutlineView } from "./JourneyOutlineView";

// ── JSON syntax highlighter ───────────────────────────────────────────────────

function highlightJson(raw: string): string {
  let formatted = raw;
  try { formatted = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* use raw */ }

  return formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let color = "#60a5fa";
        if (/^"/.test(match)) {
          color = /:$/.test(match) ? "#94a3b8" : "#86efac";
        } else if (/true|false/.test(match)) {
          color = "#fbbf24";
        } else if (/null/.test(match)) {
          color = "#f87171";
        }
        return `<span style="color:${color}">${match}</span>`;
      }
    );
}

function FullscreenButton({ fullscreen, onToggle, dark }: { fullscreen: boolean; onToggle: () => void; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
      className={cn(
        "shrink-0 p-1 rounded transition-colors",
        dark
          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
      )}
    >
      {fullscreen ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      )}
    </button>
  );
}

function FileContent({ content, fileName }: { content: string; fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isJson = ext === "json";
  if (isJson) {
    return (
      <pre
        className="text-xs font-mono leading-relaxed p-4 overflow-auto h-full text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightJson(content) }}
      />
    );
  }
  return (
    <pre className="text-xs font-mono leading-relaxed p-4 overflow-auto h-full text-slate-300 whitespace-pre-wrap">
      {content}
    </pre>
  );
}

// ── File tree view ────────────────────────────────────────────────────────────

function FileTreeNode({
  node, selectedFile, onSelect, depth,
}: {
  node: FileNode; selectedFile: string | null;
  onSelect: (path: string, name: string) => void; depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <svg className={cn("w-3 h-3 shrink-0 transition-transform text-slate-400", open && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-3.5 h-3.5 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode key={child.relativePath} node={child} selectedFile={selectedFile} onSelect={onSelect} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const isSelected = selectedFile === node.relativePath;
  return (
    <button
      onClick={() => onSelect(node.relativePath, node.name)}
      className={cn(
        "flex items-center gap-1.5 w-full text-left px-2 py-1 text-xs rounded transition-colors truncate",
        isSelected ? "bg-sky-100 text-sky-800 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function TreeView({ environment }: { environment: string }) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [configDir, setConfigDir] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!environment) return;
    setTreeLoading(true);
    setTree([]);
    setSelectedFile(null);
    setFileContent(null);
    fetch(`/api/configs/${environment}`)
      .then((r) => r.json())
      .then((data) => { setTree(data.tree ?? []); setConfigDir(data.configDir ?? ""); })
      .finally(() => setTreeLoading(false));
  }, [environment]);

  const handleFileSelect = async (relativePath: string, name: string) => {
    setSelectedFile(relativePath);
    setSelectedFileName(name);
    setFileContent(null);
    setFileLoading(true);
    try {
      const res = await fetch(`/api/configs/${environment}/file?path=${encodeURIComponent(relativePath)}`);
      const data = await res.json();
      setFileContent(data.content ?? "");
    } finally {
      setFileLoading(false);
    }
  };

  const fileCount = countFiles(tree);

  return (
    <div className="flex gap-6 flex-1 min-h-0">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
        {configDir && (
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] text-slate-400 font-mono truncate" title={configDir}>{configDir}</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-1">
          {treeLoading && <p className="text-xs text-slate-400 text-center py-6">Loading…</p>}
          {!treeLoading && tree.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 px-3">No config files found. Pull from this environment first.</p>
          )}
          {!treeLoading && tree.map((node) => (
            <FileTreeNode key={node.relativePath} node={node} selectedFile={selectedFile} onSelect={handleFileSelect} depth={0} />
          ))}
        </div>
        {fileCount > 0 && (
          <div className="px-3 py-2 border-t border-slate-100 text-[10px] text-slate-400">
            {fileCount} file{fileCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className={cn(
        "flex flex-col bg-slate-900 overflow-hidden",
        fullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "flex-1 rounded-lg border border-slate-200"
      )}>
        {selectedFile ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700 bg-slate-800 shrink-0">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-mono text-slate-300 truncate flex-1">{selectedFile}</span>
              <FullscreenButton fullscreen={fullscreen} onToggle={() => setFullscreen((f) => !f)} dark />
            </div>
            <div className="flex-1 overflow-auto">
              {fileLoading && <div className="flex items-center justify-center h-full text-sm text-slate-500">Loading…</div>}
              {!fileLoading && fileContent !== null && <FileContent content={fileContent} fileName={selectedFileName ?? ""} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            {tree.length > 0 ? "Select a file to view its contents" : "No files to display"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sections view ─────────────────────────────────────────────────────────────

interface AuditEntry {
  scope: string;
  fileCount: number;
  exists: boolean;
  items: AuditItem[];
  selectable: boolean;
}

const ALL_SCOPES = CONFIG_SCOPES.map((s) => s.value);
const GROUPS = Array.from(new Set(CONFIG_SCOPES.map((s) => s.group)));

function SectionsView({ environment }: { environment: string }) {
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [files, setFiles] = useState<ViewableFile[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [fileLoading, setFileLoading] = useState(false);
  const [itemFilter, setItemFilter] = useState("");
  const [col3View, setCol3View] = useState<"graph" | "outline" | "json">("graph");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Fetch audit for all scopes when env changes
  useEffect(() => {
    if (!environment) return;
    setAuditLoading(true);
    setSelectedScope(null);
    setSelectedItem(null);
    setFiles(null);
    const params = new URLSearchParams({ environment, scopes: ALL_SCOPES.join(",") });
    fetch(`/api/push/audit?${params}`)
      .then((r) => r.json())
      .then((data: AuditEntry[]) => setAuditData(data))
      .finally(() => setAuditLoading(false));
  }, [environment]);

  // Fetch file content when item is selected
  useEffect(() => {
    if (!selectedScope || !selectedItem) { setFiles(null); return; }
    setFileLoading(true);
    setFiles(null);
    setActiveTab(0);
    setCol3View(selectedScope === "journeys" ? "graph" : "json");
    const params = new URLSearchParams({ environment, scope: selectedScope, item: selectedItem.id });
    fetch(`/api/push/item?${params}`)
      .then((r) => r.json())
      .then((data: { files: ViewableFile[] }) => setFiles(data.files ?? []))
      .catch(() => setFiles([]))
      .finally(() => setFileLoading(false));
  }, [environment, selectedScope, selectedItem]);

  const handleSelectScope = (scope: string) => {
    setSelectedScope(scope);
    setSelectedItem(null);
    setFiles(null);
    setItemFilter("");
  };

  const scopeEntry = auditData.find((e) => e.scope === selectedScope);
  const filteredItems = scopeEntry
    ? itemFilter.trim()
      ? scopeEntry.items.filter((i) => i.label.toLowerCase().includes(itemFilter.toLowerCase()))
      : scopeEntry.items
    : [];

  const activeFile = files?.[activeTab];

  return (
    <div className="flex flex-1 min-h-0 rounded-lg border border-slate-200 overflow-hidden">

      {/* Column 1 — Scopes */}
      <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto">
        {auditLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-6 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          GROUPS.map((group) => {
            const groupScopes = CONFIG_SCOPES.filter((s) => s.group === group);
            return (
              <div key={group}>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group}</p>
                {groupScopes.map((s) => {
                  const entry = auditData.find((e) => e.scope === s.value);
                  const count = entry?.items.length ?? 0;
                  const hasFiles = (entry?.fileCount ?? 0) > 0;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleSelectScope(s.value)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors border-l-2",
                        selectedScope === s.value
                          ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                          : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800",
                        !hasFiles && "opacity-40"
                      )}
                    >
                      <span className="truncate">{s.label}</span>
                      {entry && (
                        <span className="text-[10px] tabular-nums text-slate-400 shrink-0">
                          {entry.selectable ? count : entry.fileCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Column 2 — Items */}
      <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
        {selectedScope ? (
          <>
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-100 shrink-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {CONFIG_SCOPES.find((s) => s.value === selectedScope)?.label ?? selectedScope}
              </p>
              {scopeEntry && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {scopeEntry.selectable ? `${scopeEntry.items.length} item${scopeEntry.items.length !== 1 ? "s" : ""}` : `${scopeEntry.fileCount} file${scopeEntry.fileCount !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {/* Filter */}
            {(scopeEntry?.items.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-100 shrink-0">
                <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  placeholder="Filter…"
                  className="flex-1 text-[11px] bg-transparent text-slate-700 placeholder-slate-400 outline-none min-w-0"
                />
                {itemFilter && (
                  <button type="button" onClick={() => setItemFilter("")} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Item list */}
            <div className="flex-1 overflow-y-auto">
              {filteredItems.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-6">
                  {itemFilter ? "No matches" : "No items"}
                </p>
              )}
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors truncate border-l-2",
                    selectedItem?.id === item.id
                      ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-4 text-center">
            Select a scope to browse its items
          </div>
        )}
      </div>

      {/* Column 3 — File content / Journey graph */}
      <div className={cn(
        "flex flex-col overflow-hidden min-w-0",
        fullscreen ? "fixed inset-0 z-50" : "flex-1",
        selectedItem && (col3View === "graph" || col3View === "outline") && selectedScope === "journeys" ? "bg-slate-50" : "bg-slate-900"
      )}>
        {selectedItem ? (
          <>
            {/* Header bar */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 border-b shrink-0",
              (col3View === "graph" || col3View === "outline") && selectedScope === "journeys"
                ? "border-slate-200 bg-white"
                : "border-slate-700 bg-slate-800"
            )}>
              <span className={cn(
                "text-xs font-medium truncate flex-1",
                (col3View === "graph" || col3View === "outline") && selectedScope === "journeys" ? "text-slate-700" : "text-slate-300"
              )}>
                {selectedItem.label}
              </span>

              {/* Graph / Outline / JSON toggle — journeys only */}
              {selectedScope === "journeys" && files && files.length > 0 && (
                <div className="flex rounded border border-slate-200 overflow-hidden text-[10px] font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setCol3View("graph")}
                    className={cn(
                      "px-2.5 py-1 transition-colors",
                      col3View === "graph" ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setCol3View("outline")}
                    className={cn(
                      "px-2.5 py-1 border-l border-slate-200 transition-colors",
                      col3View === "outline" ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Outline
                  </button>
                  <button
                    type="button"
                    onClick={() => setCol3View("json")}
                    className={cn(
                      "px-2.5 py-1 border-l border-slate-200 transition-colors",
                      col3View === "json" ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    JSON
                  </button>
                </div>
              )}

              {/* File tabs — non-journey multi-file items */}
              {selectedScope !== "journeys" && files && files.length > 1 && (
                <div className="flex gap-0 overflow-x-auto">
                  {files.map((f, i) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={cn(
                        "px-3 py-1 text-[10px] shrink-0 border-b-2 transition-colors",
                        i === activeTab
                          ? "border-sky-500 text-sky-400"
                          : "border-transparent text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

              <FullscreenButton
                fullscreen={fullscreen}
                onToggle={() => setFullscreen((f) => !f)}
                dark={!((col3View === "graph" || col3View === "outline") && selectedScope === "journeys")}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {fileLoading && (
                <div className={cn("flex items-center justify-center h-full text-sm", (col3View === "graph" || col3View === "outline") ? "text-slate-400" : "text-slate-500")}>
                  Loading…
                </div>
              )}
              {!fileLoading && files && files.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-slate-500">
                  No files found for this item
                </div>
              )}
              {!fileLoading && activeFile && selectedScope === "journeys" && col3View === "graph" && (
                <JourneyGraph json={activeFile.content} fitViewKey={fullscreen ? 1 : 0} environment={environment} journeyId={selectedItem?.id} />
              )}
              {!fileLoading && activeFile && selectedScope === "journeys" && col3View === "outline" && (
                <JourneyOutlineView json={activeFile.content} />
              )}
              {!fileLoading && activeFile && col3View === "json" && (
                <div className="overflow-auto h-full">
                  <FileContent content={activeFile.content} fileName={activeFile.name} />
                </div>
              )}
              {!fileLoading && activeFile && selectedScope !== "journeys" && (
                <div className="overflow-auto h-full">
                  <FileContent content={activeFile.content} fileName={activeFile.name} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            {selectedScope ? "Select an item to view its contents" : "Select a scope and item"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConfigsViewer({ environments }: { environments: Environment[] }) {
  const [selectedEnv, setSelectedEnv] = useState(environments[0]?.name ?? "");
  const [view, setView] = useState<"tree" | "sections">("sections");

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 shrink-0">
        <select
          value={selectedEnv}
          onChange={(e) => setSelectedEnv(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {environments.map((env) => (
            <option key={env.name} value={env.name}>{env.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setView("sections")}
            className={cn(
              "px-3 py-1.5 transition-colors",
              view === "sections" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            Sections
          </button>
          <button
            type="button"
            onClick={() => setView("tree")}
            className={cn(
              "px-3 py-1.5 border-l border-slate-200 transition-colors",
              view === "tree" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            Tree
          </button>
        </div>
      </div>

      {view === "sections"
        ? <SectionsView environment={selectedEnv} />
        : <TreeView environment={selectedEnv} />
      }
    </div>
  );
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((sum, n) => {
    if (n.type === "file") return sum + 1;
    return sum + countFiles(n.children ?? []);
  }, 0);
}
