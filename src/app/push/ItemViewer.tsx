"use client";

import { useEffect, useState, useCallback } from "react";
import type { ViewableFile } from "@/app/api/push/item/route";

interface AuditItem {
  id: string;
  label: string;
}

interface ItemViewerProps {
  environment: string;
  scope: string;
  item: AuditItem;
  onClose: () => void;
}

function highlight(content: string, language: ViewableFile["language"]): string {
  // Simple escaping — no external dep required
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function ItemViewer({ environment, scope, item, onClose }: ItemViewerProps) {
  const [files, setFiles] = useState<ViewableFile[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFiles(null);
    setActiveTab(0);
    const params = new URLSearchParams({ environment, scope, item: item.id });
    fetch(`/api/push/item?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: { files: ViewableFile[] }) => setFiles(data.files))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [environment, scope, item.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const activeFile = files?.[activeTab];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="relative flex flex-col bg-white rounded-lg shadow-xl w-[720px] max-w-[95vw] max-h-[80vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wide">{scope}</p>
            <p className="text-sm font-medium text-slate-700 truncate">{item.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs (only when multiple files) */}
        {files && files.length > 1 && (
          <div className="flex gap-0 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
            {files.map((f, i) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setActiveTab(i)}
                className={
                  i === activeTab
                    ? "px-4 py-2 text-xs font-medium text-sky-700 border-b-2 border-sky-500 bg-white shrink-0"
                    : "px-4 py-2 text-xs text-slate-500 hover:text-slate-700 border-b-2 border-transparent shrink-0"
                }
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              Loading…
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-40 text-sm text-red-500">
              {error}
            </div>
          )}
          {activeFile && (
            <pre
              className="text-[11px] leading-relaxed font-mono text-slate-700 p-4 whitespace-pre-wrap break-all"
              dangerouslySetInnerHTML={{ __html: highlight(activeFile.content, activeFile.language) }}
            />
          )}
        </div>

        {/* Footer */}
        {activeFile && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">{activeFile.name}</span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">{activeFile.language}</span>
            <span className="text-[10px] text-slate-300 ml-auto">ESC to close</span>
          </div>
        )}
      </div>
    </div>
  );
}
