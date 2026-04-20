"use client";

import { Fragment, ReactNode, memo, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  /** Called when a line is clicked. Omitted by default — the script viewer doesn't want rows to look clickable, but the JSON raw view uses this to track path-at-cursor. */
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
  /** The "current" line (last clicked/selected). Rendered as a subtle row background with a left accent — distinct from highlightLine which is the strong find-match focus. */
  activeLine?: number;
  /** When true, draw faint vertical guides in the leading-whitespace region of each line (assumes 2-space indent). */
  indentGuides?: boolean;
  /** Receives scroll events on the viewer's inner scroll container — used for sticky-scope tracking. */
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  /** Imperative scroll request. Nonce forces a re-scroll even when the same line is asked for twice in a row. */
  scrollRequest?: { line: number; nonce: number };
}

function detectLanguage(fileName: string | undefined): "js" | "groovy" | "json" | "text" {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "json") return "json";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "js";
  if (ext === "groovy") return "groovy";
  return "text";
}

type Token = { text: string; color?: string; bold?: boolean };

/** Drop up to `count` leading space characters from the start of a token list. */
function stripLeadingSpaces(tokens: Token[], count: number): Token[] {
  const out: Token[] = [];
  let remaining = count;
  let consumed = false;
  for (const t of tokens) {
    if (consumed) { out.push(t); continue; }
    if (remaining <= 0) { out.push(t); consumed = true; continue; }
    let k = 0;
    while (k < t.text.length && t.text[k] === " " && remaining > 0) { k++; remaining--; }
    if (k === t.text.length) {
      if (remaining > 0) continue;
      continue;
    }
    out.push({ ...t, text: t.text.slice(k) });
    consumed = true;
  }
  return out;
}

// ── Single row ───────────────────────────────────────────────────────────────
//
// Pulled out + memoized so scrolling the parent doesn't re-render every row.

interface RowProps {
  ln: number;
  tokens: Token[];
  leadingSpaces: number;
  wrap?: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  isMatch: boolean;
  foldEnd?: number;
  isFolded: boolean;
  /** Text shown after the "N lines folded" hint. Defaults to `}`. Pass `})()` etc. to match IIFE openers. */
  foldCloseText?: string;
  overlay?: ReactNode;
  indentGuides?: boolean;
  onToggleFold?: (startLine: number) => void;
  onLineClick?: (line: number) => void;
}

const Row = memo(function Row({
  ln,
  tokens,
  leadingSpaces,
  wrap,
  isHighlighted,
  isActive,
  isMatch,
  foldEnd,
  isFolded,
  foldCloseText,
  overlay,
  indentGuides,
  onToggleFold,
  onLineClick,
}: RowProps) {
  const isFoldable = foldEnd != null;
  const guideLevels = indentGuides ? Math.floor(leadingSpaces / 2) : 0;
  const displayTokens = guideLevels > 0 ? stripLeadingSpaces(tokens, guideLevels * 2) : tokens;

  return (
    <div
      data-ln={ln}
      onClick={onLineClick ? () => onLineClick(ln) : undefined}
      className={cn(
        "group flex min-w-full",
        isHighlighted && "bg-amber-900/30",
        isActive && "bg-slate-800/60",
        isMatch && "bg-sky-900/25",
      )}
    >
      {/* Arrow and number live in separate columns so the digits always
          right-align at the same x regardless of whether the row has a fold
          arrow. Everything else (colors, sticky, borders) carried over. */}
      <div
        aria-hidden
        className={cn(
          "sticky left-0 z-10 bg-slate-900 select-none flex items-center pl-2 pr-3 border-r border-slate-800 shrink-0",
          isHighlighted && "bg-amber-900/40 font-semibold",
          isActive && "bg-slate-800/80 border-l-2 border-l-sky-400 pl-[6px]",
        )}
        style={{ minWidth: "5ch" }}
      >
        <span className="w-3 text-[10px] leading-none shrink-0 inline-flex items-center justify-center">
          {isFoldable && onToggleFold ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleFold(ln); }}
              className="text-slate-500 hover:text-slate-200"
              title={isFolded ? "Unfold" : "Fold"}
            >
              {isFolded ? "▶" : "▼"}
            </button>
          ) : null}
        </span>
        <span
          className={cn(
            "flex-1 text-right tabular-nums whitespace-nowrap pl-1 text-slate-600",
            isHighlighted && "text-amber-300",
            isActive && "text-slate-300",
          )}
        >
          {ln}
        </span>
      </div>
      <div className={cn("pl-4 pr-4", wrap ? "whitespace-pre-wrap break-words flex-1 min-w-0" : "whitespace-pre")}>
        {guideLevels > 0 && (
          <span aria-hidden className="select-none">
            {Array.from({ length: guideLevels }, (_, k) => (
              // Force 2ch width per guide so the U+2502 char (often rendered
              // narrower than an ASCII space) doesn't shift the rest of the
              // line left. Without this, every level of indent loses a
              // fraction of a cell and the code column looks misaligned.
              <span
                key={k}
                className="text-slate-700 inline-block text-center"
                style={{ width: "2ch" }}
              >
                │
              </span>
            ))}
          </span>
        )}
        {displayTokens.length === 0 ? (
          <span> </span>
        ) : (
          displayTokens.map((t, j) => (
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
          <>
            <span className="ml-2 text-slate-500 italic text-[10px]">
              … {foldEnd - ln} line{foldEnd - ln === 1 ? "" : "s"} folded
            </span>
            <span className="ml-2 text-slate-400">{foldCloseText ?? "}"}</span>
          </>
        )}
        {overlay != null && (
          <span className="ml-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            {overlay}
          </span>
        )}
      </div>
    </div>
  );
});

// ── Viewer ───────────────────────────────────────────────────────────────────

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
  activeLine,
  indentGuides,
  onScroll,
  scrollRequest,
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

  // Tokenize, then split tokens on newlines so each source line is its own array.
  const lines = useMemo(() => {
    const tokens = highlightTokens(displayContent, lang === "js" || lang === "groovy" ? "javascript" : lang);
    const result: Token[][] = [[]];
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

  // Raw display lines — kept for leading-space counts (indent guides) and
  // closing-line lookups (fold preview text).
  const rawLines = useMemo(() => displayContent.split("\n"), [displayContent]);

  const leadingSpaces = useMemo(() => {
    return rawLines.map((l) => {
      let n = 0;
      while (n < l.length && l[n] === " ") n++;
      return n;
    });
  }, [rawLines]);

  // Flatten to the rows that will actually render — drop hidden lines and any
  // line sitting inside a currently-folded region. Doing this once here keeps
  // the virtualizer's index space contiguous.
  const visibleLines = useMemo(() => {
    const out: { ln: number; tokens: Token[] }[] = [];
    const foldRanges = foldRegions && foldedStartLines
      ? [...foldedStartLines].map((s) => [s, foldRegions.get(s) ?? s] as const).sort((a, b) => a[0] - b[0])
      : [];
    const isInFold = (ln: number) => {
      for (const [s, e] of foldRanges) {
        if (ln > s && ln <= e) return true;
      }
      return false;
    };
    for (let i = 0; i < lines.length; i++) {
      const ln = i + 1;
      if (hiddenLines?.has(ln)) continue;
      if (isInFold(ln)) continue;
      out.push({ ln, tokens: lines[i] });
    }
    return out;
  }, [lines, hiddenLines, foldedStartLines, foldRegions]);

  // Virtualizer — only mount rows near the viewport. Size estimate tuned to
  // code-mono at 13px / 1.55 line-height ≈ 20px.
  const virtualizer = useVirtualizer({
    count: visibleLines.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 20,
    overscan: 24,
  });

  // Scroll a highlighted line into view (find-match focus).
  useEffect(() => {
    if (!highlightLine) return;
    const idx = visibleLines.findIndex((v) => v.ln === highlightLine);
    if (idx < 0) return;
    virtualizer.scrollToIndex(idx, { align: "center" });
  }, [highlightLine, visibleLines, virtualizer]);

  // Imperative scroll requests (goto-line, outline click, etc). Nonce
  // guarantees the effect fires even when the same line is requested twice.
  useEffect(() => {
    if (!scrollRequest) return;
    const idx = visibleLines.findIndex((v) => v.ln === scrollRequest.line);
    if (idx < 0) return;
    virtualizer.scrollToIndex(idx, { align: "center" });
  }, [scrollRequest, visibleLines, virtualizer]);

  const totalSize = virtualizer.getTotalSize();
  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={cn(
        "h-full overflow-auto bg-slate-900 text-slate-300 code-mono text-[13px] leading-[1.55] scrollbar-thin",
        className,
      )}
    >
      <div style={{ height: totalSize, position: "relative" }}>
        {items.map((virtualItem) => {
          const v = visibleLines[virtualItem.index];
          if (!v) return null;
          const ln = v.ln;
          const isHighlighted = highlightLine === ln;
          const isActive = !isHighlighted && activeLine === ln;
          const isMatch = !isHighlighted && !isActive && (matchLines?.has(ln) ?? false);
          const foldEnd = foldRegions?.get(ln);
          const isFolded = foldEnd != null && (foldedStartLines?.has(ln) ?? false);
          // Text to show at the end of a folded line — the trimmed content of
          // the closing line so IIFE-style `})()` appears intact rather than
          // being shorthanded to a single `}`.
          const foldCloseText = isFolded && foldEnd != null ? rawLines[foldEnd - 1]?.trim() : undefined;
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                minWidth: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Row
                ln={ln}
                tokens={v.tokens}
                leadingSpaces={leadingSpaces[ln - 1] ?? 0}
                wrap={wrap}
                isHighlighted={isHighlighted}
                isActive={isActive}
                isMatch={isMatch}
                foldEnd={foldEnd}
                isFolded={isFolded}
                foldCloseText={foldCloseText}
                overlay={lineOverlays?.get(ln)}
                indentGuides={indentGuides}
                onToggleFold={onToggleFold}
                onLineClick={onLineClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
