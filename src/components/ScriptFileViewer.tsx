"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FileContentViewer } from "./FileContentViewer";
import { formatJavaScript } from "@/lib/format-js";

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
  // After these tokens a leading `/` is a regex literal; after an identifier,
  // number, `)`, or `]` it's division. Whitespace is transparent — we look at
  // the last non-whitespace code char emitted so far.
  const REGEX_CTX_RE = /[=({[,;:!&|+*%<>?^~]/;
  const isRegexContext = (last: string): boolean => !last || last === "\n" || REGEX_CTX_RE.test(last);

  const out: string[] = [];
  let i = 0;
  let state: "code" | "line" | "block" | "str1" | "str2" | "tmpl" = "code";
  let lastCodeChar = "";
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (state === "code") {
      if (c === "/" && n === "/") { state = "line"; out.push("  "); i += 2; continue; }
      if (c === "/" && n === "*") { state = "block"; out.push("  "); i += 2; continue; }
      if (c === "/" && isRegexContext(lastCodeChar)) {
        // Scan ahead for the regex-closing `/`, respecting escapes and char
        // classes. If no close on this line, fall through to division — a
        // real regex literal is single-line in practice, and this guard
        // keeps us from swallowing the whole file when `/` is just operator.
        let j = i + 1;
        let inClass = false;
        let end = -1;
        while (j < src.length) {
          const cc = src[j];
          if (cc === "\n") break;
          if (cc === "\\" && j + 1 < src.length) { j += 2; continue; }
          if (cc === "[" && !inClass) { inClass = true; j++; continue; }
          if (cc === "]" && inClass) { inClass = false; j++; continue; }
          if (cc === "/" && !inClass) { end = j; break; }
          j++;
        }
        if (end >= 0) {
          out.push("/");
          for (let k = i + 1; k < end; k++) out.push(src[k] === "\n" ? "\n" : " ");
          out.push("/");
          i = end + 1;
          while (i < src.length && /[a-z]/i.test(src[i])) { out.push(src[i]); i++; }
          lastCodeChar = "/";
          continue;
        }
        // no close found — treat `/` as division, fall through.
      }
      if (c === '"') { state = "str1"; out.push('"'); i++; continue; }
      if (c === "'") { state = "str2"; out.push("'"); i++; continue; }
      if (c === "`") { state = "tmpl"; out.push("`"); i++; continue; }
      out.push(c);
      if (c !== " " && c !== "\t") lastCodeChar = c;
      i++;
      continue;
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
      if (c === '"') { state = "code"; out.push('"'); lastCodeChar = '"'; i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "str2") {
      if (c === "\\" && n != null) { out.push("  "); i += 2; continue; }
      if (c === "'") { state = "code"; out.push("'"); lastCodeChar = "'"; i++; continue; }
      out.push(c === "\n" ? "\n" : " "); i++; continue;
    }
    if (state === "tmpl") {
      if (c === "\\" && n != null) { out.push("  "); i += 2; continue; }
      if (c === "`") { state = "code"; out.push("`"); lastCodeChar = "`"; i++; continue; }
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
  const VAR = /^\s*(?:export\s+)?(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.*)$/;
  const GROOVY_DEF = /^\s*(?:private|public|protected|static|final|def)\s+(?:\w[\w<>?,\s]*\s+)?([A-Za-z_$][\w$]*)\s*\(/;
  const METHOD = /^\s*([A-Za-z_$][\w$]*)\s*(?::|=)\s*function\b/;
  // RHS patterns that mean "this binding is a function value" — normal
  // function expressions, arrow functions (with or without params).
  const FN_VALUE = /^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (language === "js") {
      let m: RegExpMatchArray | null;
      if ((m = line.match(FN))) { out.push({ line: i + 1, name: m[1], kind: "function" }); continue; }
      if ((m = line.match(VAR))) {
        const declKind = m[1] as "const" | "let" | "var";
        const rhs = m[3]?.trim() ?? "";
        const isFn = FN_VALUE.test(rhs);
        out.push({ line: i + 1, name: m[2], kind: isFn ? "function" : declKind });
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
  const canFormat = language === "js";

  // Format state. Downstream analyses (symbols, refs, fold, comments, find,
  // overlays) all run on the effective content so line numbers stay consistent.
  // Default formatting on for JS so poorly-indented source (common with
  // pulled ForgeRock scripts) renders with Prettier's normalized layout.
  // Users can still toggle off to see the raw file exactly as on disk.
  const [formatEnabled, setFormatEnabled] = useState(canFormat);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [formatLoading, setFormatLoading] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  const formatKey = `${formatEnabled ? "on" : "off"}|${content}`;
  const [prevFormatKey, setPrevFormatKey] = useState(formatKey);
  if (prevFormatKey !== formatKey) {
    setPrevFormatKey(formatKey);
    setFormatted(null);
    setFormatError(null);
    setFormatLoading(formatEnabled);
  }

  useEffect(() => {
    if (!formatEnabled) return;
    let cancelled = false;
    formatJavaScript(content).then(({ text, error }) => {
      if (cancelled) return;
      setFormatted(text);
      setFormatError(error ?? null);
      setFormatLoading(false);
    });
    return () => { cancelled = true; };
  }, [formatEnabled, content]);

  const effectiveContent = formatEnabled && formatted != null ? formatted : content;

  const symbols = useMemo(() => detectSymbols(effectiveContent, language), [effectiveContent, language]);
  const references = useMemo(() => detectReferences(effectiveContent), [effectiveContent]);
  const foldRegions = useMemo(() => computeFoldRegions(effectiveContent), [effectiveContent]);
  const commentSpans = useMemo(() => extractCommentSpans(effectiveContent), [effectiveContent]);
  const hasAnyComment = commentSpans.length > 0;
  const hasHideableCodeComments = useMemo(() => commentSpans.some((s) => classifyComment(s) === "code"), [commentSpans]);

  const [wrap, setWrap] = useState(true);
  const [findQuery, setFindQuery] = useState("");
  const [findIdx, setFindIdx] = useState(0);
  const [gotoLine, setGotoLine] = useState("");
  const [foldedStartLines, setFoldedStartLines] = useState<Set<number>>(new Set());
  const [currentLine, setCurrentLine] = useState<number | undefined>(highlightLine);
  const [commentMode, setCommentMode] = useState<CommentMode>("all");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [topVisibleLine, setTopVisibleLine] = useState<number | null>(null);

  const startSidebarDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(160, Math.min(640, startW + (startX - ev.clientX)));
      setSidebarWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  const hiddenLines = useMemo(
    () => computeHiddenByCommentMode(commentSpans, commentMode),
    [commentSpans, commentMode],
  );

  const symbolGroups = useMemo<SymbolGroup[]>(() => {
    const defs: { id: string; label: string; match: (s: Symbol) => boolean }[] = [
      { id: "sym:function", label: "Functions", match: (s) => s.kind === "function" || s.kind === "method" },
      { id: "sym:const",    label: "Constants", match: (s) => s.kind === "const" },
      { id: "sym:let",      label: "Let",       match: (s) => s.kind === "let" },
      { id: "sym:var",      label: "Var",       match: (s) => s.kind === "var" },
    ];
    return defs
      .map((d) => ({ id: d.id, label: d.label, items: symbols.filter(d.match) }))
      .filter((g) => g.items.length > 0);
  }, [symbols]);

  const referenceGroups = useMemo<ReferenceGroup[]>(() => {
    const defs: { id: string; label: string; kind: Reference["kind"] }[] = [
      { id: "ref:esv",      label: "ESVs",      kind: "esv" },
      { id: "ref:library",  label: "Scripts",   kind: "library" },
      { id: "ref:endpoint", label: "Endpoints", kind: "endpoint" },
    ];
    return defs
      .map((d) => ({ id: d.id, label: d.label, items: references.filter((r) => r.kind === d.kind) }))
      .filter((g) => g.items.length > 0);
  }, [references]);

  const allGroupIds = useMemo(
    () => [...symbolGroups.map((g) => g.id), ...referenceGroups.map((g) => g.id)],
    [symbolGroups, referenceGroups],
  );

  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const expandAllGroups = useCallback(() => setCollapsedGroups(new Set()), []);
  const collapseAllGroups = useCallback(() => setCollapsedGroups(new Set(allGroupIds)), [allGroupIds]);

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
    effectiveContent.split("\n").forEach((line, i) => {
      if (line.toLowerCase().includes(q)) out.push(i + 1);
    });
    return out;
  }, [findQuery, effectiveContent]);

  // Reset findIdx on query change (render-time adjustment to avoid effect)
  const [prevQuery, setPrevQuery] = useState(findQuery);
  if (prevQuery !== findQuery) {
    setPrevQuery(findQuery);
    setFindIdx(0);
  }
  const clampedIdx = matches.length === 0 ? 0 : Math.min(findIdx, matches.length - 1);
  // Strictly the find-match focus — never fall back to currentLine. Falling
  // back would cause FileContentViewer's highlight-line scroll effect to
  // re-center on every click / unfold / goto, which feels like the page is
  // jumping around. currentLine still drives the subtle activeLine style.
  const currentMatchLine = matches.length > 0 ? matches[clampedIdx] : undefined;
  const matchLineSet = useMemo(() => new Set(matches), [matches]);

  // Imperative scroll plumbing — bumped any time goto/outline/find wants the
  // viewer to reveal a line. FileContentViewer watches this prop and drives
  // the virtualizer, which is necessary because the target line may not be
  // currently mounted in the DOM.
  const [scrollRequest, setScrollRequest] = useState<{ line: number; nonce: number } | null>(null);
  const requestScrollTo = useCallback((ln: number) => {
    setScrollRequest({ line: ln, nonce: Date.now() });
  }, []);

  // Sync the highlightLine prop (deep-link from URL) into a one-shot scroll
  // request. Done via prop-compare at render time — no effect, so the rule
  // against setState-in-effect doesn't trip. First render: prevHlProp is the
  // sentinel "unset" and differs from the prop, so we schedule the scroll.
  // If the prop later changes (another deep-link click in the same session)
  // we re-scroll to the new target.
  const [prevHlProp, setPrevHlProp] = useState<number | undefined | "unset">("unset");
  if (prevHlProp !== highlightLine) {
    setPrevHlProp(highlightLine);
    if (highlightLine != null) {
      // Use the line number itself as the nonce — deterministic so it's
      // safe at render time, and in practice deep-links don't repeat the
      // same line twice within one mount (ConfigsViewer remounts the
      // component on file switch via its key prop).
      setScrollRequest({ line: highlightLine, nonce: highlightLine });
    }
  }

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
    requestScrollTo(n);
  }, [gotoLine, unfoldAncestors, requestScrollTo]);

  const goTo = useCallback((ln: number) => {
    unfoldAncestors(ln);
    setCurrentLine(ln);
    requestScrollTo(ln);
  }, [unfoldAncestors, requestScrollTo]);

  const toggleFold = useCallback((startLine: number) => {
    const wasFolded = foldedStartLines.has(startLine);
    setFoldedStartLines((prev) => {
      const next = new Set(prev);
      if (next.has(startLine)) next.delete(startLine);
      else next.add(startLine);
      return next;
    });
    // Unfolding: highlight the header line so the user sees where the open-up
    // happened — but don't scroll. The newly-revealed body pushes content
    // down in place, which is less jarring than a sudden recenter.
    if (wasFolded) setCurrentLine(startLine);
  }, [foldedStartLines]);

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

  // Derive line ranges for each symbol so we can show a sticky header with
  // the enclosing function when the user scrolls past its declaration. Fold
  // regions are keyed by the line that opens a `{`; functions sometimes open
  // the brace on the next line, so we check both.
  const symbolRanges = useMemo(() => {
    return symbols.map((s) => {
      const end = foldRegions.get(s.line) ?? foldRegions.get(s.line + 1) ?? s.line;
      return { ...s, endLine: end };
    });
  }, [symbols, foldRegions]);

  // Sticky-scope focus line — prefer the explicit active line (last clicked
  // row, goto, outline/find jump) so clicking a line updates the scope header
  // immediately. Fall back to the topmost visible line when nothing is active.
  const scopeFocusLine = currentLine ?? topVisibleLine;

  // Candidate scopes = named functions + unnamed function-like brace regions.
  // Object literals, if-blocks, and anything else that isn't function-shaped
  // don't appear here so the scope header never shows `var config = {...}`.
  const scopes = useMemo(() => {
    type Scope = { line: number; endLine: number; name: string; anonymous: boolean };
    const result: Scope[] = [];
    for (const r of symbolRanges) {
      if ((r.kind === "function" || r.kind === "method") && r.endLine > r.line) {
        result.push({ line: r.line, endLine: r.endLine, name: r.name, anonymous: false });
      }
    }
    const contentLines = effectiveContent.split("\n");
    const claimedStartLines = new Set<number>();
    for (const r of result) {
      claimedStartLines.add(r.line);
      claimedStartLines.add(r.line + 1);
    }
    for (const [start, end] of foldRegions) {
      if (end <= start) continue;
      if (claimedStartLines.has(start)) continue;
      const text = contentLines[start - 1] ?? "";
      if (/\bfunction\s*\*?\s*\(/.test(text)) {
        result.push({ line: start, endLine: end, name: "anonymous function", anonymous: true });
      } else if (/\([^)]*\)\s*=>\s*\{?\s*$/.test(text) || /\bkeys?\s*:\s*async\s*\([^)]*\)\s*=>/.test(text)) {
        result.push({ line: start, endLine: end, name: "arrow function", anonymous: true });
      }
    }
    return result;
  }, [symbolRanges, foldRegions, effectiveContent]);

  const currentScope = useMemo(() => {
    if (scopeFocusLine == null) return null;
    let best: (typeof scopes)[number] | null = null;
    for (const s of scopes) {
      if (scopeFocusLine >= s.line && scopeFocusLine <= s.endLine) {
        if (!best || s.line > best.line) best = s;
      }
    }
    return best;
  }, [scopes, scopeFocusLine]);

  // Throttle scroll handling via rAF; find the first visible, non-folded row
  // and remember its line number.
  const scrollRafRef = useRef<number | null>(null);
  const handleViewerScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const rect = container.getBoundingClientRect();
      const rows = container.querySelectorAll<HTMLElement>("[data-ln]");
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        if (r.bottom > rect.top + 4) {
          const n = Number(row.dataset.ln);
          if (Number.isFinite(n)) setTopVisibleLine(n);
          return;
        }
      }
      setTopVisibleLine(null);
    });
  }, []);

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

        {/* Format (Prettier) — JS only */}
        {canFormat && (
          <button
            type="button"
            onClick={() => setFormatEnabled((f) => !f)}
            aria-pressed={formatEnabled}
            title={
              formatError
                ? `Prettier failed: ${formatError}`
                : formatEnabled
                  ? "Show original formatting"
                  : "Pretty-print with Prettier (remove/add blank lines, normalize indentation)"
            }
            className={cn(
              "px-2 py-0.5 rounded transition-colors flex items-center gap-1",
              formatError
                ? "bg-amber-900/40 text-amber-300"
                : formatEnabled
                  ? "bg-sky-900/40 text-sky-300 hover:bg-sky-900/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
            )}
          >
            {formatLoading && (
              <span className="inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
            )}
            Format
          </button>
        )}

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
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-0.5 border-b border-slate-800 bg-slate-900/95 backdrop-blur text-[11px] text-slate-400 shrink-0">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">in</span>
            {currentScope ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(currentScope.line)}
                  className={cn(
                    "code-mono truncate",
                    currentScope.anonymous ? "text-slate-400 italic hover:text-slate-200" : "text-sky-300 hover:text-sky-200",
                  )}
                  title={`Jump to line ${currentScope.line}`}
                >
                  {currentScope.anonymous ? `(${currentScope.name})` : `${currentScope.name}()`}
                </button>
                <span className="text-slate-600 tabular-nums">:{currentScope.line}</span>
              </>
            ) : (
              <span className="text-slate-500 italic">(top level)</span>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <FileContentViewer
              content={effectiveContent}
              fileName={fileName}
              highlightLine={currentMatchLine}
              activeLine={currentLine}
              matchLines={matchLineSet}
              wrap={wrap}
              foldRegions={foldRegions}
              foldedStartLines={foldedStartLines}
              onToggleFold={toggleFold}
              lineOverlays={lineOverlays}
              hiddenLines={hiddenLines}
              indentGuides
              onScroll={handleViewerScroll}
              scrollRequest={scrollRequest ?? undefined}
              onLineClick={(ln) => setCurrentLine(ln)}
            />
          </div>
        </div>

        {(symbols.length > 0 || references.length > 0) && (
          <>
            <div
              onMouseDown={startSidebarDrag}
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize outline"
              className="w-1 shrink-0 cursor-col-resize bg-slate-800 hover:bg-sky-500/60 transition-colors"
            />
            <Sidebar
              width={sidebarWidth}
              symbolGroups={symbolGroups}
              referenceGroups={referenceGroups}
              collapsedGroups={collapsedGroups}
              onToggleGroup={toggleGroup}
              onExpandAllGroups={expandAllGroups}
              onCollapseAllGroups={collapseAllGroups}
              currentLine={currentLine}
              onGoTo={goTo}
              onOpenRef={(r) => { goTo(r.line); onNavigate?.(r.target); }}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Outline grouping ─────────────────────────────────────────────────────────

interface SymbolGroup { id: string; label: string; items: Symbol[] }
interface ReferenceGroup { id: string; label: string; items: Reference[] }

function Sidebar({
  width,
  symbolGroups,
  referenceGroups,
  collapsedGroups,
  onToggleGroup,
  onExpandAllGroups,
  onCollapseAllGroups,
  currentLine,
  onGoTo,
  onOpenRef,
}: {
  width: number;
  symbolGroups: SymbolGroup[];
  referenceGroups: ReferenceGroup[];
  collapsedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  onExpandAllGroups: () => void;
  onCollapseAllGroups: () => void;
  currentLine: number | undefined;
  onGoTo: (line: number) => void;
  onOpenRef: (r: Reference) => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  // Filter groups by symbol / reference name (case-insensitive). Empty groups
  // are dropped so the sidebar shrinks to only matching sections.
  const filteredSymbolGroups = useMemo(() => {
    if (!q) return symbolGroups;
    return symbolGroups
      .map((g) => ({ ...g, items: g.items.filter((s) => s.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [symbolGroups, q]);

  const filteredReferenceGroups = useMemo(() => {
    if (!q) return referenceGroups;
    return referenceGroups
      .map((g) => ({ ...g, items: g.items.filter((r) => r.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [referenceGroups, q]);

  // While a query is active, force-open every group so matches aren't hidden
  // behind collapsed sections — the user has obviously asked for them.
  const effectiveCollapsed = q ? new Set<string>() : collapsedGroups;

  const totalMatches = filteredSymbolGroups.reduce((n, g) => n + g.items.length, 0)
    + filteredReferenceGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <aside
      style={{ width }}
      className="shrink-0 border-l border-slate-800 bg-slate-900/70 overflow-auto scrollbar-thin"
    >
      <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-[10px]">
        <button
          type="button"
          onClick={onExpandAllGroups}
          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Expand every group"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={onCollapseAllGroups}
          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          title="Collapse every group"
        >
          Collapse all
        </button>
      </div>

      <div className="sticky top-[25px] bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 px-2 py-1 flex items-center gap-1">
        <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter outline…"
          className="bg-transparent outline-none flex-1 min-w-0 text-[11px] text-slate-200 placeholder-slate-500"
        />
        {search && (
          <>
            <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{totalMatches}</span>
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear filter"
              className="text-slate-500 hover:text-slate-200 text-[11px] leading-none"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {search && totalMatches === 0 && (
        <div className="px-3 py-2 text-[11px] text-slate-500 italic">No outline items match.</div>
      )}

      {filteredSymbolGroups.map((g) => {
        const accent = symbolAccent(g.id);
        const isCallable = g.id === "sym:function";
        return (
        <GroupSection
          key={g.id}
          id={g.id}
          label={g.label}
          count={g.items.length}
          collapsed={effectiveCollapsed.has(g.id)}
          onToggle={onToggleGroup}
          accent={accent}
        >
          {g.items.map((s, i) => (
            <button
              key={`${s.name}-${s.line}-${i}`}
              type="button"
              onClick={() => onGoTo(s.line)}
              className={cn(
                "flex items-baseline gap-2 w-full text-left px-3 py-0.5 text-xs font-mono truncate transition-colors",
                currentLine === s.line
                  ? "bg-sky-900/40 text-sky-200"
                  : "hover:text-slate-100 hover:bg-slate-800",
                currentLine !== s.line && (accent ?? "text-slate-300"),
              )}
              title={`Line ${s.line}`}
            >
              <span className="truncate">{isCallable ? `${s.name}()` : s.name}</span>
              <span className="ml-auto text-[10px] text-slate-500 tabular-nums shrink-0">{s.line}</span>
            </button>
          ))}
        </GroupSection>
        );
      })}

      {filteredReferenceGroups.map((g) => {
        const accent = refAccent(g.id);
        return (
        <GroupSection
          key={g.id}
          id={g.id}
          label={g.label}
          count={g.items.length}
          collapsed={effectiveCollapsed.has(g.id)}
          onToggle={onToggleGroup}
          accent={accent}
        >
          {g.items.map((r, i) => (
            <button
              key={`${r.kind}-${r.label}-${r.line}-${i}`}
              type="button"
              onClick={() => onOpenRef(r)}
              className={cn(
                "flex items-baseline gap-2 w-full text-left px-3 py-0.5 text-xs font-mono truncate hover:text-slate-100 hover:bg-slate-800 transition-colors",
                accent ?? "text-slate-300",
              )}
              title={`Line ${r.line} · Open ${r.kind}`}
            >
              <span className="truncate">{r.label}</span>
              <span className="ml-auto text-[10px] text-slate-500 tabular-nums shrink-0">{r.line}</span>
            </button>
          ))}
        </GroupSection>
        );
      })}
    </aside>
  );
}

function GroupSection({
  id, label, count, collapsed, onToggle, accent, children,
}: {
  id: string;
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: (id: string) => void;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex items-center w-full gap-2 px-2 py-1 text-[10px] uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-800 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="w-3 text-slate-500 text-[10px] leading-none shrink-0">
          {collapsed ? "▶" : "▼"}
        </span>
        <span className={cn("truncate", accent)}>{label}</span>
        <span className="ml-auto text-slate-500 tabular-nums shrink-0">{count}</span>
      </button>
      {!collapsed && <div className="py-1">{children}</div>}
    </div>
  );
}

function refAccent(id: string): string | undefined {
  if (id === "ref:esv") return "text-emerald-400";
  if (id === "ref:library") return "text-violet-400";
  if (id === "ref:endpoint") return "text-sky-400";
  return undefined;
}

// Palette matches the in-file syntax highlighting so the outline visually
// echoes the tokens on the page. Functions/method share the function-call
// sky; constants share the number amber; let and var pick non-colliding
// hues (emerald / rose) so all four groups are distinguishable at a glance.
function symbolAccent(id: string): string | undefined {
  if (id === "sym:function") return "text-sky-400";
  if (id === "sym:const")    return "text-amber-300";
  if (id === "sym:let")      return "text-emerald-400";
  if (id === "sym:var")      return "text-rose-400";
  return undefined;
}
