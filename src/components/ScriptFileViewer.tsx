"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FileContentViewer } from "./FileContentViewer";

export type NavigateTarget =
  | { scope: "scripts"; scriptName: string }
  | { scope: "scripts-by-id"; scriptId: string }
  | { scope: "endpoints"; endpointName: string }
  | { scope: "variables"; esvName: string }
  | { scope: "secrets"; esvName: string };

interface Props {
  content: string;
  fileName: string;
  environment: string;
  /** Path relative to environment config dir — used for last-modified lookup. */
  relPath?: string;
  highlightLine?: number;
  /** Called when the user clicks a reference (ESV / library / endpoint). */
  onNavigate?: (target: NavigateTarget) => void;
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

interface Symbol {
  line: number;
  name: string;
  kind: "function" | "const" | "let" | "var" | "method";
}

// Strip line comments, block comments, and string/regex literals so brace
// counting and regex-based symbol detection don't false-match content inside
// them. Not a full parser — good enough for FR auth/endpoint scripts.
function stripNonCode(src: string): string {
  const out: string[] = [];
  let i = 0;
  let state: "code" | "line" | "block" | "str1" | "str2" | "tmpl" = "code";
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (state === "code") {
      if (c === "/" && n === "/") { state = "line"; out.push("  "); i += 2; continue; }
      if (c === "/" && n === "*") { state = "block"; out.push("  "); i += 2; continue; }
      if (c === '"') { state = "str1"; out.push('"'); i++; continue; }
      if (c === "'") { state = "str2"; out.push("'"); i++; continue; }
      if (c === "`") { state = "tmpl"; out.push("`"); i++; continue; }
      out.push(c); i++; continue;
    }
    if (state === "line") {
      if (c === "\n") { state = "code"; out.push("\n"); i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "block") {
      if (c === "*" && n === "/") { state = "code"; out.push("  "); i += 2; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "str1") {
      if (c === "\\" && n != null) { out.push("  "); i += 2; continue; }
      if (c === '"') { state = "code"; out.push('"'); i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "str2") {
      if (c === "\\" && n != null) { out.push("  "); i += 2; continue; }
      if (c === "'") { state = "code"; out.push("'"); i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "tmpl") {
      if (c === "\\" && n != null) { out.push("  "); i += 2; continue; }
      if (c === "`") { state = "code"; out.push("`"); i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
  }
  return out.join("");
}

function detectSymbols(content: string, language: "js" | "groovy"): Symbol[] {
  const scan = stripNonCode(content);
  const lines = scan.split("\n");
  const out: Symbol[] = [];
  const FN = /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/;
  const VAR = /^\s*(?:export\s+)?(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/;
  const GROOVY_DEF = /^\s*(?:private|public|protected|static|final|def)\s+(?:\w[\w<>?,\s]*\s+)?([A-Za-z_$][\w$]*)\s*\(/;
  const METHOD = /^\s*([A-Za-z_$][\w$]*)\s*(?::|=)\s*function\b/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (language === "js") {
      let m: RegExpMatchArray | null;
      if ((m = line.match(FN))) { out.push({ line: i + 1, name: m[1], kind: "function" }); continue; }
      if ((m = line.match(VAR))) {
        // Skip if the variable initializer is a primitive and the file has many top-level vars.
        const kind = m[1] as "const" | "let" | "var";
        out.push({ line: i + 1, name: m[2], kind });
        continue;
      }
      if ((m = line.match(METHOD))) { out.push({ line: i + 1, name: m[1], kind: "method" }); continue; }
    } else {
      const m = line.match(GROOVY_DEF);
      if (m) out.push({ line: i + 1, name: m[1], kind: "function" });
    }
  }
  return out;
}

// ── Reference detection ──────────────────────────────────────────────────────

interface Reference {
  line: number;
  kind: "esv" | "library" | "endpoint";
  label: string;       // display text
  target: NavigateTarget;
}

// ESV: normalize `esv-foo-bar` / `esv.foo.bar` / `foo.bar` → `foo-bar`
function normalizeEsvName(raw: string): string {
  let n = raw.toLowerCase();
  if (n.startsWith("esv-")) n = n.slice(4);
  else if (n.startsWith("esv.")) n = n.slice(4);
  return n.replace(/\./g, "-");
}

const RE_SYSTEMENV = /systemEnv(?:\.getProperty\(\s*['"]([^'"]+)['"]|\[\s*['"]([^'"]+)['"]\s*\])/g;
const RE_PLACEHOLDER = /&\{esv\.([A-Za-z0-9._-]+)\}/g;
const RE_CALL_GLOBAL = /callGlobalFunction\(\s*['"]([^'"]+)['"]/g;
const RE_REQUEST_LIB = /requestLibraryScript\(\s*['"]([^'"]+)['"]/g;
const RE_OPENIDM_ACTION = /openidm\.(?:action|read|create|update|patch|delete|query)\(\s*['"]endpoint\/([^'"]+)['"]/g;

function detectReferences(content: string): Reference[] {
  const scan = stripNonCode(content);
  const lines = scan.split("\n");
  const origLines = content.split("\n");
  const refs: Reference[] = [];

  const push = (lineIdx: number, kind: Reference["kind"], label: string, target: NavigateTarget) => {
    // Deduplicate same kind+label on the same line.
    if (refs.some((r) => r.line === lineIdx + 1 && r.kind === kind && r.label === label)) return;
    refs.push({ line: lineIdx + 1, kind, label, target });
  };

  for (let i = 0; i < lines.length; i++) {
    const scanLine = lines[i];
    const origLine = origLines[i] ?? "";

    for (const m of scanLine.matchAll(RE_SYSTEMENV)) {
      const name = normalizeEsvName(m[1] ?? m[2] ?? "");
      if (name) push(i, "esv", name, { scope: "variables", esvName: name });
    }
    // Placeholder form in strings is harder post-strip (we blanked strings).
    // Run it on the original line.
    for (const m of origLine.matchAll(RE_PLACEHOLDER)) {
      const name = normalizeEsvName(m[1]);
      if (name) push(i, "esv", name, { scope: "variables", esvName: name });
    }
    for (const m of scanLine.matchAll(RE_CALL_GLOBAL)) {
      const name = m[1];
      if (name) push(i, "library", name, { scope: "scripts", scriptName: name });
    }
    for (const m of scanLine.matchAll(RE_REQUEST_LIB)) {
      const name = m[1];
      if (name) push(i, "library", name, { scope: "scripts", scriptName: name });
    }
    for (const m of scanLine.matchAll(RE_OPENIDM_ACTION)) {
      const name = m[1];
      if (name) push(i, "endpoint", name, { scope: "endpoints", endpointName: name });
    }
  }
  return refs;
}

// ── Comment analysis ─────────────────────────────────────────────────────────

interface CommentSpan {
  startLine: number;
  endLine: number;
  body: string;
  isBlock: boolean;
  /** Code exists on startLine before the comment marker. */
  startHasCode: boolean;
  /** Code exists on endLine after the closing block marker (block only). */
  endHasCode: boolean;
}

// Walk content char-by-char, extracting every comment span and tracking
// whether the start/end line has code outside the comment. Handles string
// literals and escapes so `//` or `/*` inside a string aren't treated as
// comment openers.
function extractCommentSpans(content: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  let state: "code" | "line" | "block" | "str1" | "str2" | "tmpl" = "code";
  let i = 0;
  let line = 1;
  let beforeCommentCode = ""; // non-comment text seen on the current line so far
  let body = "";
  let startLine = -1;
  let startHasCode = false;

  while (i < content.length) {
    const c = content[i];
    const n = content[i + 1];

    if (state === "code") {
      if (c === "\n") { beforeCommentCode = ""; line++; i++; continue; }
      if (c === "/" && n === "/") {
        startLine = line;
        startHasCode = beforeCommentCode.trim() !== "";
        body = "";
        state = "line";
        i += 2; continue;
      }
      if (c === "/" && n === "*") {
        startLine = line;
        startHasCode = beforeCommentCode.trim() !== "";
        body = "";
        state = "block";
        i += 2; continue;
      }
      if (c === '"') { state = "str1"; beforeCommentCode += c; i++; continue; }
      if (c === "'") { state = "str2"; beforeCommentCode += c; i++; continue; }
      if (c === "`") { state = "tmpl"; beforeCommentCode += c; i++; continue; }
      beforeCommentCode += c;
      i++; continue;
    }

    if (state === "line") {
      if (c === "\n") {
        spans.push({ startLine, endLine: startLine, body, isBlock: false, startHasCode, endHasCode: false });
        beforeCommentCode = "";
        line++;
        state = "code";
        i++; continue;
      }
      body += c;
      i++; continue;
    }

    if (state === "block") {
      if (c === "*" && n === "/") {
        // Peek the rest of the end line to determine if code follows `*/`.
        let p = i + 2;
        let after = "";
        while (p < content.length && content[p] !== "\n") { after += content[p]; p++; }
        const endHasCode = after.trim() !== "";
        spans.push({ startLine, endLine: line, body, isBlock: true, startHasCode, endHasCode });
        // Reset line-level accumulation so anything after `*/` on this line is treated as fresh code.
        beforeCommentCode = "";
        state = "code";
        i += 2;
        continue;
      }
      if (c === "\n") { body += "\n"; line++; }
      else body += c;
      i++; continue;
    }

    if (state === "str1") {
      if (c === "\\" && n != null) { beforeCommentCode += c + n; i += 2; continue; }
      if (c === '"') { state = "code"; beforeCommentCode += c; i++; continue; }
      if (c === "\n") { line++; }
      beforeCommentCode += c; i++; continue;
    }
    if (state === "str2") {
      if (c === "\\" && n != null) { beforeCommentCode += c + n; i += 2; continue; }
      if (c === "'") { state = "code"; beforeCommentCode += c; i++; continue; }
      if (c === "\n") { line++; }
      beforeCommentCode += c; i++; continue;
    }
    if (state === "tmpl") {
      if (c === "\\" && n != null) { beforeCommentCode += c + n; i += 2; continue; }
      if (c === "`") { state = "code"; beforeCommentCode += c; i++; continue; }
      if (c === "\n") { line++; }
      beforeCommentCode += c; i++; continue;
    }
  }

  // EOF while still inside a comment — close it off.
  if (state === "line" && startLine > 0) {
    spans.push({ startLine, endLine: startLine, body, isBlock: false, startHasCode, endHasCode: false });
  } else if (state === "block" && startLine > 0) {
    spans.push({ startLine, endLine: line, body, isBlock: true, startHasCode, endHasCode: false });
  }

  return spans;
}

function fullyCommentLines(span: CommentSpan): number[] {
  const out: number[] = [];
  for (let ln = span.startLine; ln <= span.endLine; ln++) {
    if (ln === span.startLine && span.startHasCode) continue;
    if (ln === span.endLine && span.endHasCode && ln !== span.startLine) continue;
    if (span.startLine === span.endLine && (span.startHasCode || span.endHasCode)) continue;
    out.push(ln);
  }
  return out;
}

const PROSE_PREFIX = /^\s*(TODO|FIXME|XXX|HACK|NOTE|WARN|WARNING|BUG|OPTIMI[SZ]E|REVIEW|IMPORTANT|DESC|DESCRIPTION|DEPRECATED)\b/;
const JSDOC_TAG = /@(param|returns?|throws|example|see|since|type|author|link|description|deprecated|todo)\b/i;
const CODE_KEYWORDS = /^\s*(var|let|const|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|import|export|class|new|yield|await|do)\b/;

/**
 * Classify a comment as "code" (commented-out code) vs "prose" (human-readable
 * comment). Heuristic — designed to err toward "prose" when uncertain so we
 * never hide a comment the author actually wants read.
 */
function classifyComment(span: CommentSpan): "code" | "prose" {
  // JSDoc block: opened with /** or has * -prefixed lines
  if (span.isBlock) {
    const firstNonEmpty = span.body.split("\n").find((l) => l.trim() !== "") ?? "";
    if (firstNonEmpty.trim().startsWith("*")) return "prose";
  }

  const rawLines = span.body.split("\n").map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return "prose";

  // Strong prose markers at any line → prose
  for (const l of rawLines) {
    if (PROSE_PREFIX.test(l)) return "prose";
    if (JSDOC_TAG.test(l)) return "prose";
    if (l.startsWith("*")) return "prose";
  }

  let codeVotes = 0;
  let proseVotes = 0;
  for (const l of rawLines) {
    if (CODE_KEYWORDS.test(l)) { codeVotes++; continue; }
    if (/[;{}](\s*)$/.test(l)) { codeVotes++; continue; }
    if (/=>/.test(l) || /===|!==|!=|\|\||&&/.test(l)) { codeVotes++; continue; }
    if (/^[\w$.]+\s*=\s*[^=]/.test(l) && !/^[A-Z][a-z]+\s/.test(l)) { codeVotes++; continue; }
    if (/^[\w$]+\s*\([^)]*\)\s*[;,{]?/.test(l)) { codeVotes++; continue; }
    // Prose signals
    const words = l.split(/\s+/).filter((w) => /^[A-Za-z][A-Za-z']*$/.test(w));
    if (/[.!?]$/.test(l) && words.length >= 2) { proseVotes++; continue; }
    if (/^[A-Z][a-z]+\s+[a-z]+/.test(l) && words.length >= 3) { proseVotes++; continue; }
    const letters = (l.match(/[A-Za-z]/g) || []).length;
    const symbols = l.length - letters - (l.match(/\s/g) || []).length;
    if (words.length >= 3 && letters > symbols * 2) { proseVotes++; continue; }
  }

  return codeVotes > proseVotes ? "code" : "prose";
}

type CommentMode = "all" | "hideCode" | "hideAll";

function computeHiddenByCommentMode(spans: CommentSpan[], mode: CommentMode): Set<number> {
  if (mode === "all") return new Set();
  const out = new Set<number>();
  for (const span of spans) {
    if (mode === "hideCode" && classifyComment(span) !== "code") continue;
    for (const ln of fullyCommentLines(span)) out.add(ln);
  }
  return out;
}

// ── Fold region detection ────────────────────────────────────────────────────

function computeFoldRegions(content: string): Map<number, number> {
  const scan = stripNonCode(content);
  const out = new Map<number, number>();
  const stack: number[] = [];
  let line = 1;
  for (let i = 0; i < scan.length; i++) {
    const c = scan[i];
    if (c === "\n") { line++; continue; }
    if (c === "{") stack.push(line);
    else if (c === "}") {
      const start = stack.pop();
      if (start != null && line > start) out.set(start, line);
    }
  }
  return out;
}

// ── Component ────────────────────────────────────────────────────────────────

interface LastCommit {
  shortHash: string;
  authorName: string;
  timestamp: number;
  subject: string;
}

export function ScriptFileViewer({ content, fileName, environment, relPath, highlightLine, onNavigate }: Props) {
  const language: "js" | "groovy" = fileName.toLowerCase().endsWith(".groovy") ? "groovy" : "js";

  const symbols = useMemo(() => detectSymbols(content, language), [content, language]);
  const references = useMemo(() => detectReferences(content), [content]);
  const foldRegions = useMemo(() => computeFoldRegions(content), [content]);
  const commentSpans = useMemo(() => extractCommentSpans(content), [content]);
  const hasAnyComment = commentSpans.length > 0;
  const hasHideableCodeComments = useMemo(() => commentSpans.some((s) => classifyComment(s) === "code"), [commentSpans]);

  const [wrap, setWrap] = useState(true);
  const [findQuery, setFindQuery] = useState("");
  const [findIdx, setFindIdx] = useState(0);
  const [gotoLine, setGotoLine] = useState("");
  const [foldedStartLines, setFoldedStartLines] = useState<Set<number>>(new Set());
  const [currentLine, setCurrentLine] = useState<number | undefined>(highlightLine);
  const [commentMode, setCommentMode] = useState<CommentMode>("all");

  const hiddenLines = useMemo(
    () => computeHiddenByCommentMode(commentSpans, commentMode),
    [commentSpans, commentMode],
  );

  // Resetting last-commit to "loading" happens via render-time prop compare so
  // it doesn't trip `react-hooks/set-state-in-effect`; the actual fetch lives
  // in useEffect below.
  const fetchKey = `${environment}|${relPath ?? ""}`;
  const [lastCommit, setLastCommit] = useState<LastCommit | null | "loading">(
    relPath && environment ? "loading" : null,
  );
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);
  if (prevFetchKey !== fetchKey) {
    setPrevFetchKey(fetchKey);
    setLastCommit(relPath && environment ? "loading" : null);
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!relPath || !environment) return;
    let cancelled = false;
    fetch(`/api/configs/${encodeURIComponent(environment)}/file-info?path=${encodeURIComponent(relPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLastCommit(data?.lastCommit ?? null);
      })
      .catch(() => { if (!cancelled) setLastCommit(null); });
    return () => { cancelled = true; };
  }, [environment, relPath]);

  // Match lines for find
  const matches = useMemo<number[]>(() => {
    if (!findQuery) return [];
    const q = findQuery.toLowerCase();
    const out: number[] = [];
    content.split("\n").forEach((line, i) => {
      if (line.toLowerCase().includes(q)) out.push(i + 1);
    });
    return out;
  }, [findQuery, content]);

  // Reset findIdx on query change (render-time adjustment to avoid effect)
  const [prevQuery, setPrevQuery] = useState(findQuery);
  if (prevQuery !== findQuery) {
    setPrevQuery(findQuery);
    setFindIdx(0);
  }
  const clampedIdx = matches.length === 0 ? 0 : Math.min(findIdx, matches.length - 1);
  const currentMatchLine = matches.length > 0 ? matches[clampedIdx] : currentLine;
  const matchLineSet = useMemo(() => new Set(matches), [matches]);

  // Scroll to a line (used by outline / goto / find).
  const scrollToLine = useCallback((ln: number) => {
    setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-ln="${ln}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
    }, 30);
  }, []);

  // Scroll current match into view when idx changes.
  useEffect(() => {
    if (matches.length > 0) scrollToLine(matches[clampedIdx]);
  }, [matches, clampedIdx, scrollToLine]);

  // Unfold any ancestor region that would hide a target line.
  const unfoldAncestors = useCallback((ln: number) => {
    setFoldedStartLines((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const start of prev) {
        const end = foldRegions.get(start);
        if (end != null && ln > start && ln <= end) { next.delete(start); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [foldRegions]);

  const handleGoToLine = useCallback(() => {
    const n = Number(gotoLine);
    if (!Number.isFinite(n) || n <= 0) return;
    unfoldAncestors(n);
    setCurrentLine(n);
    scrollToLine(n);
  }, [gotoLine, unfoldAncestors, scrollToLine]);

  const goTo = useCallback((ln: number) => {
    unfoldAncestors(ln);
    setCurrentLine(ln);
    scrollToLine(ln);
  }, [unfoldAncestors, scrollToLine]);

  const toggleFold = useCallback((startLine: number) => {
    setFoldedStartLines((prev) => {
      const next = new Set(prev);
      if (next.has(startLine)) next.delete(startLine);
      else next.add(startLine);
      return next;
    });
  }, []);

  const foldAll = useCallback(() => setFoldedStartLines(new Set(foldRegions.keys())), [foldRegions]);
  const unfoldAll = useCallback(() => setFoldedStartLines(new Set()), []);

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setFindIdx((i) => (i + 1) % matches.length);
  }, [matches.length]);

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setFindIdx((i) => (i - 1 + matches.length) % matches.length);
  }, [matches.length]);

  // Group references by line for overlay rendering.
  const lineOverlays = useMemo<Map<number, ReactNode>>(() => {
    const out = new Map<number, ReactNode>();
    const byLine = new Map<number, Reference[]>();
    for (const r of references) {
      const arr = byLine.get(r.line) ?? [];
      arr.push(r);
      byLine.set(r.line, arr);
    }
    for (const [ln, refs] of byLine) {
      out.set(
        ln,
        <span className="inline-flex gap-1">
          {refs.map((r, i) => (
            <button
              key={`${r.kind}-${r.label}-${i}`}
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate?.(r.target); }}
              className={cn(
                "text-[10px] rounded px-1.5 py-0 font-sans cursor-pointer transition-colors",
                r.kind === "esv"
                  ? "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60"
                  : r.kind === "library"
                    ? "bg-violet-900/40 text-violet-300 hover:bg-violet-900/60"
                    : "bg-sky-900/40 text-sky-300 hover:bg-sky-900/60",
              )}
              title={`Open ${r.kind}: ${r.label}`}
            >
              {r.kind === "esv" ? "ESV" : r.kind === "library" ? "Script" : "Endpoint"} · {r.label} →
            </button>
          ))}
        </span>,
      );
    }
    return out;
  }, [references, onNavigate]);

  const dateStr = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const opts: Intl.DateTimeFormatOptions = sameYear
      ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString(undefined, opts);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 shrink-0 text-[11px]">
        {/* Find */}
        <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-0.5">
          <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Find…"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) prevMatch();
                else nextMatch();
              } else if (e.key === "Escape") setFindQuery("");
            }}
            className="bg-transparent outline-none w-32 text-slate-200 placeholder-slate-500"
          />
          {findQuery && (
            <>
              <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                {matches.length > 0 ? `${clampedIdx + 1}/${matches.length}` : "0"}
              </span>
              <button type="button" onClick={prevMatch} className="text-slate-500 hover:text-slate-200 px-0.5" title="Previous match (Shift+Enter)">↑</button>
              <button type="button" onClick={nextMatch} className="text-slate-500 hover:text-slate-200 px-0.5" title="Next match (Enter)">↓</button>
            </>
          )}
        </div>

        {/* Go to line */}
        <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-0.5">
          <span className="text-[10px] text-slate-500 shrink-0">Line:</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="#"
            value={gotoLine}
            onChange={(e) => setGotoLine(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleGoToLine(); } }}
            className="bg-transparent outline-none w-14 text-slate-200 placeholder-slate-500"
          />
        </div>

        {/* Fold controls */}
        {foldRegions.size > 0 && (
          <div className="flex items-center gap-0.5 bg-slate-800 rounded px-1.5 py-0.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 pr-1">Fold</span>
            <button type="button" onClick={foldAll} className="px-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700" title="Fold all blocks">All</button>
            <button type="button" onClick={unfoldAll} className="px-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700" title="Unfold all blocks">None</button>
          </div>
        )}

        {/* Comment visibility — three-state segmented control */}
        {hasAnyComment && (
          <div className="flex items-center gap-0.5 bg-slate-800 rounded px-1.5 py-0.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 pr-1">Comments</span>
            <button
              type="button"
              onClick={() => setCommentMode("all")}
              aria-pressed={commentMode === "all"}
              title="Show every comment"
              className={cn(
                "px-1.5 rounded",
                commentMode === "all"
                  ? "bg-sky-900/60 text-sky-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setCommentMode("hideCode")}
              aria-pressed={commentMode === "hideCode"}
              disabled={!hasHideableCodeComments}
              title={hasHideableCodeComments ? "Hide only lines that look like commented-out code" : "No code-out comments detected"}
              className={cn(
                "px-1.5 rounded",
                !hasHideableCodeComments
                  ? "text-slate-600 cursor-not-allowed"
                  : commentMode === "hideCode"
                    ? "bg-sky-900/60 text-sky-200"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
              )}
            >
              Hide code-outs
            </button>
            <button
              type="button"
              onClick={() => setCommentMode("hideAll")}
              aria-pressed={commentMode === "hideAll"}
              title="Hide every comment-only line"
              className={cn(
                "px-1.5 rounded",
                commentMode === "hideAll"
                  ? "bg-sky-900/60 text-sky-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
              )}
            >
              Hide all
            </button>
          </div>
        )}

        {/* Wrap */}
        <button
          type="button"
          onClick={() => setWrap((w) => !w)}
          aria-pressed={wrap}
          title={wrap ? "Disable line wrap" : "Enable line wrap"}
          className={cn(
            "px-2 py-0.5 rounded transition-colors",
            wrap ? "bg-sky-900/40 text-sky-300 hover:bg-sky-900/60" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
          )}
        >
          Wrap
        </button>

        {/* Last commit header — right aligned */}
        <div className="ml-auto text-[10px] text-slate-500 truncate max-w-[50%]">
          {lastCommit === "loading" ? (
            <span>Loading history…</span>
          ) : lastCommit ? (
            <span title={`${lastCommit.shortHash} ${lastCommit.subject}`}>
              Last modified <span className="text-slate-300">{dateStr(lastCommit.timestamp)}</span>
              {" · "}
              <span className="text-slate-400">{lastCommit.authorName}</span>
              {" · "}
              <span className="text-slate-400">{lastCommit.shortHash}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Content + Outline/References sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <FileContentViewer
            content={content}
            fileName={fileName}
            highlightLine={currentMatchLine}
            matchLines={matchLineSet}
            wrap={wrap}
            foldRegions={foldRegions}
            foldedStartLines={foldedStartLines}
            onToggleFold={toggleFold}
            lineOverlays={lineOverlays}
            hiddenLines={hiddenLines}
          />
        </div>

        {(symbols.length > 0 || references.length > 0) && (
          <aside className="w-56 shrink-0 border-l border-slate-800 bg-slate-900/70 overflow-auto">
            {symbols.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur">
                  Outline ({symbols.length})
                </div>
                <div className="py-1">
                  {symbols.map((s, i) => (
                    <button
                      key={`${s.name}-${s.line}-${i}`}
                      type="button"
                      onClick={() => goTo(s.line)}
                      className={cn(
                        "flex items-baseline gap-2 w-full text-left px-3 py-0.5 text-xs font-mono truncate transition-colors",
                        currentLine === s.line
                          ? "bg-sky-900/40 text-sky-200"
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-800",
                      )}
                      title={`Line ${s.line}`}
                    >
                      <span className="text-[9px] uppercase text-slate-500 shrink-0 w-5">{kindLabel(s.kind)}</span>
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto text-[10px] text-slate-500 tabular-nums shrink-0">{s.line}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {references.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] uppercase text-slate-500 font-semibold tracking-wider border-b border-t border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur">
                  References ({references.length})
                </div>
                <div className="py-1">
                  {references.map((r, i) => (
                    <button
                      key={`${r.kind}-${r.label}-${r.line}-${i}`}
                      type="button"
                      onClick={() => { goTo(r.line); onNavigate?.(r.target); }}
                      className="flex items-baseline gap-2 w-full text-left px-3 py-0.5 text-xs font-mono truncate text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                      title={`Line ${r.line} · Open ${r.kind}`}
                    >
                      <span
                        className={cn(
                          "text-[9px] uppercase shrink-0 w-5 text-right",
                          r.kind === "esv" ? "text-emerald-400" : r.kind === "library" ? "text-violet-400" : "text-sky-400",
                        )}
                      >
                        {r.kind === "esv" ? "esv" : r.kind === "library" ? "scr" : "ep"}
                      </span>
                      <span className="truncate">{r.label}</span>
                      <span className="ml-auto text-[10px] text-slate-500 tabular-nums shrink-0">{r.line}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function kindLabel(k: Symbol["kind"]): string {
  switch (k) {
    case "function": return "fn";
    case "method":   return "fn";
    case "const":    return "c";
    case "let":      return "l";
    case "var":      return "v";
  }
}
