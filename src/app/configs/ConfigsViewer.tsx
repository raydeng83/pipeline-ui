"use client";

import { useState, useEffect, useCallback } from "react";
import { Environment } from "@/lib/fr-config-types";
import { FileNode } from "@/app/api/configs/[env]/route";
import { cn } from "@/lib/utils";

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
        let color = "#60a5fa"; // number → blue
        if (/^"/.test(match)) {
          color = /:$/.test(match) ? "#94a3b8" : "#86efac"; // key → slate, string → green
        } else if (/true|false/.test(match)) {
          color = "#fbbf24"; // boolean → amber
        } else if (/null/.test(match)) {
          color = "#f87171"; // null → red
        }
        return `<span style="color:${color}">${match}</span>`;
      }
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

// ── File tree ─────────────────────────────────────────────────────────────────

function FileTreeNode({
  node,
  selectedFile,
  onSelect,
  depth,
}: {
  node: FileNode;
  selectedFile: string | null;
  onSelect: (path: string, name: string) => void;
  depth: number;
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
          <svg
            className={cn("w-3 h-3 shrink-0 transition-transform text-slate-400", open && "rotate-90")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-3.5 h-3.5 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode
            key={child.relativePath}
            node={child}
            selectedFile={selectedFile}
            onSelect={onSelect}
            depth={depth + 1}
          />
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
        isSelected
          ? "bg-sky-100 text-sky-800 font-medium"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

// ── Main component ────────────────────────────────────────────────────────────

export function ConfigsViewer({ environments }: { environments: Environment[] }) {
  const [selectedEnv, setSelectedEnv] = useState(environments[0]?.name ?? "");
  const [tree, setTree] = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [configDir, setConfigDir] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const fetchTree = useCallback(async (env: string) => {
    setTreeLoading(true);
    setTree([]);
    setSelectedFile(null);
    setFileContent(null);
    try {
      const res = await fetch(`/api/configs/${env}`);
      const data = await res.json();
      setTree(data.tree ?? []);
      setConfigDir(data.configDir ?? "");
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEnv) fetchTree(selectedEnv);
  }, [selectedEnv, fetchTree]);

  const handleFileSelect = async (relativePath: string, name: string) => {
    setSelectedFile(relativePath);
    setSelectedFileName(name);
    setFileContent(null);
    setFileLoading(true);
    try {
      const res = await fetch(`/api/configs/${selectedEnv}/file?path=${encodeURIComponent(relativePath)}`);
      const data = await res.json();
      setFileContent(data.content ?? "");
    } finally {
      setFileLoading(false);
    }
  };

  const fileCount = countFiles(tree);

  return (
    <div className="flex gap-6 h-[calc(100vh-14rem)]">
      {/* Left panel — file tree */}
      <div className="w-72 shrink-0 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Environment selector */}
        <div className="p-3 border-b border-slate-100">
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {environments.map((env) => (
              <option key={env.name} value={env.name}>{env.label}</option>
            ))}
          </select>
          {configDir && (
            <p className="mt-1.5 text-[10px] text-slate-400 font-mono truncate" title={configDir}>
              {configDir}
            </p>
          )}
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-1">
          {treeLoading && (
            <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
          )}
          {!treeLoading && tree.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6 px-3">
              No config files found. Pull from this environment first.
            </p>
          )}
          {!treeLoading && tree.map((node) => (
            <FileTreeNode
              key={node.relativePath}
              node={node}
              selectedFile={selectedFile}
              onSelect={handleFileSelect}
              depth={0}
            />
          ))}
        </div>

        {fileCount > 0 && (
          <div className="px-3 py-2 border-t border-slate-100 text-[10px] text-slate-400">
            {fileCount} file{fileCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Right panel — file viewer */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-lg border border-slate-200 overflow-hidden">
        {selectedFile ? (
          <>
            {/* File header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700 bg-slate-800 shrink-0">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-mono text-slate-300 truncate">{selectedFile}</span>
            </div>

            <div className="flex-1 overflow-auto">
              {fileLoading && (
                <div className="flex items-center justify-center h-full text-sm text-slate-500">
                  Loading…
                </div>
              )}
              {!fileLoading && fileContent !== null && (
                <FileContent content={fileContent} fileName={selectedFileName ?? ""} />
              )}
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

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((sum, n) => {
    if (n.type === "file") return sum + 1;
    return sum + countFiles(n.children ?? []);
  }, 0);
}
