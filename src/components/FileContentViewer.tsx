"use client";

import { Fragment, ReactNode, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { highlightTokens } from "@/lib/highlight";
import { formatHtml, shouldFormatAsHtml } from "@/lib/format-html";

interface Props {
  content: string;
  /** Determines syntax highlighting. Pass the filename or extension. */
  fileName?: string;
  /** Explicit language override; takes precedence over fileName. */
  language?: "js" | "groovy" | "json" | "text";
  className?: string;
  /** Optional line to highlight (1-indexed) */
  highlightLine?: number;
  /** When true, long lines wrap instead of overflowing horizontally. */
  wrap?: boolean;
  /** Lines (1-indexed) to mark with a subtle background — used for search matches. */
  matchLines?: Set<number>;
  /** Called when a line is clicked. Used for path-at-cursor in JSON raw view. */
  onLineClick?: (line: number) => void;
  /** Map of startLine → endLine for foldable regions. A chevron is shown at startLine. */
  foldRegions?: Map<number, number>;
  /** Set of startLines whose region is currently folded. */
  foldedStartLines?: Set<number>;
  /** Toggle handler invoked when the chevron at startLine is clicked. */
  onToggleFold?: (startLine: number) => void;
  /** Per-line content appended after the tokens (reference link badges, etc.). */
  lineOverlays?: Map<number, ReactNode>;
  /** Lines (1-indexed) to hide from rendering entirely. Independent of folding. */
  hiddenLines?: Set<number>;
}

function detectLanguage(fileName: string | undefined): "js" | "groovy" | "json" | "text" {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "json") return "json";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "js";
  if (ext === "groovy") return "groovy";
  return "text";
}

export function FileContentViewer({
  content,
  fileName,
  language,
  className,
  highlightLine,
  wrap,
  matchLines,
  onLineClick,
  foldRegions,
  foldedStartLines,
  onToggleFold,
  lineOverlays,
  hiddenLines,
}: Props) {
  const lang = language ?? detectLanguage(fileName);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-format HTML-bearing email-template files (.md/.html) so the viewer
  // shows structured indentation regardless of how messy the source file is.
  const displayContent = useMemo(() => {
    if (fileName && shouldFormatAsHtml(fileName)) {
      try { return formatHtml(content); } catch { return content; }
    }
    return content;
  }, [content, fileName]);

  useEffect(() => {
    if (!highlightLine) return;
    const el = containerRef.current?.querySelector(`[data-ln="${highlightLine}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightLine, displayContent]);

  // Tokenize, then split tokens on newlines so each source line is its own array.
  const lines = useMemo(() => {
    const tokens = highlightTokens(displayContent, lang === "js" || lang === "groovy" ? "javascript" : lang);
    const result: { text: string; color?: string; bold?: boolean }[][] = [[]];
    for (const tok of tokens) {
      const parts = tok.text.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
          result[result.length - 1].push({ text: parts[i], color: tok.color, bold: tok.bold });
        }
        if (i < parts.length - 1) result.push([]);
      }
    }
    return result;
  }, [displayContent, lang]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full overflow-auto bg-slate-900 text-slate-300 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <table className={cn("border-collapse", wrap && "w-full")}>
        <tbody>
          {lines.map((tokens, i) => {
            const ln = i + 1;
            if (hiddenLines?.has(ln)) return null;
            // Skip lines hidden by a folded ancestor.
            if (foldRegions && foldedStartLines) {
              for (const startLine of foldedStartLines) {
                const endLine = foldRegions.get(startLine);
                if (endLine != null && ln > startLine && ln <= endLine) return null;
              }
            }
            const isHighlighted = highlightLine === ln;
            const isMatch = !isHighlighted && matchLines?.has(ln);
            const foldEnd = foldRegions?.get(ln);
            const isFoldable = foldEnd != null;
            const isFolded = isFoldable && foldedStartLines?.has(ln);
            const overlay = lineOverlays?.get(ln);
            return (
              <tr
                key={i}
                data-ln={ln}
                onClick={onLineClick ? () => onLineClick(ln) : undefined}
                className={cn(
                  isHighlighted && "bg-amber-900/30",
                  isMatch && "bg-sky-900/25",
                  onLineClick && "cursor-pointer",
                )}
              >
                <td
                  aria-hidden
                  className={cn(
                    "sticky left-0 bg-slate-900 select-none text-right pl-4 pr-3 text-slate-600 border-r border-slate-800 tabular-nums whitespace-nowrap align-top",
                    isHighlighted && "bg-amber-900/40 text-amber-300 font-semibold",
                  )}
                >
                  {isFoldable && onToggleFold ? (
                    <span className="inline-flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleFold(ln); }}
                        className="text-slate-500 hover:text-slate-200 w-3 text-[10px] leading-none"
                        title={isFolded ? "Unfold" : "Fold"}
                      >
                        {isFolded ? "▶" : "▼"}
                      </button>
                      <span>{ln}</span>
                    </span>
                  ) : (
                    ln
                  )}
                </td>
                <td className={cn("pl-4 pr-4", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                  {tokens.length === 0 ? (
                    <span> </span>
                  ) : (
                    tokens.map((t, j) => (
                      <Fragment key={j}>
                        {t.color ? (
                          <span style={{ color: t.color, fontWeight: t.bold ? 500 : undefined }}>
                            {t.text}
                          </span>
                        ) : (
                          t.text
                        )}
                      </Fragment>
                    ))
                  )}
                  {isFolded && foldEnd != null && (
                    <span className="ml-2 text-slate-500 italic text-[10px]">
                      … {foldEnd - ln} line{foldEnd - ln === 1 ? "" : "s"} folded
                    </span>
                  )}
                  {overlay != null && <span className="ml-3">{overlay}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
