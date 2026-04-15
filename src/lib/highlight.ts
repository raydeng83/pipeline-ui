// ── Shared syntax highlighters (no external dependencies) ────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── JavaScript / Groovy ──────────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  "var","let","const","function","return","if","else","for","while","do",
  "switch","case","break","continue","new","delete","typeof","instanceof",
  "in","of","class","extends","import","export","default","try","catch",
  "finally","throw","async","await","yield","this","super","static",
]);
const JS_BUILTINS = new Set(["true","false","null","undefined","NaN","Infinity"]);

export function highlightJs(code: string): string {
  const out: string[] = [];
  let i = 0;

  function span(color: string, text: string, bold = false) {
    return `<span style="color:${color}${bold ? ";font-weight:500" : ""}">${esc(text)}</span>`;
  }

  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const text = end === -1 ? code.slice(i) : code.slice(i, end);
      out.push(span("#6b7280", text));
      i += text.length;
    } else if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const text = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out.push(span("#6b7280", text));
      i += text.length;
    } else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push(span("#86efac", code.slice(i, j + 1)));
      i = j + 1;
    } else if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word))      out.push(span("#c084fc", word, true));
      else if (JS_BUILTINS.has(word)) out.push(span("#f87171", word));
      else                            out.push(esc(word));
      i = j;
    } else if (/[0-9]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[0-9._xXeEbBoO]/.test(code[j])) j++;
      out.push(span("#fbbf24", code.slice(i, j)));
      i = j;
    } else {
      out.push(esc(code[i]));
      i++;
    }
  }
  return out.join("");
}

// ── JSON ─────────────────────────────────────────────────────────────────────

export function highlightJson(raw: string): string {
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

// ── Auto-detect and highlight ────────────────────────────────────────────────

export function highlight(content: string, language: string): string {
  if (language === "json") return highlightJson(content);
  if (language === "javascript" || language === "groovy") return highlightJs(content);
  return esc(content);
}

// ── Line-numbered wrapper ───────────────────────────────────────────────────

/** Wrap highlighted HTML with line numbers using a two-column table layout. */
export function withLineNumbers(highlightedHtml: string): string {
  const lines = highlightedHtml.split("\n");
  // If the last line is empty (trailing newline), drop it
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  const gutterWidth = String(lines.length).length;
  return lines
    .map(
      (line, i) =>
        `<span style="display:inline-block;width:${gutterWidth + 1}ch;text-align:right;padding-right:1.5ch;color:#475569;user-select:none;opacity:0.5">${i + 1}</span>${line}`,
    )
    .join("\n");
}

// ── Token-based variants (React-safe, no innerHTML) ─────────────────────────

export interface HighlightToken {
  text: string;
  color?: string;
  bold?: boolean;
}

export function highlightJsTokens(code: string): HighlightToken[] {
  const out: HighlightToken[] = [];
  let i = 0;
  let plain = "";
  const flushPlain = () => {
    if (plain.length > 0) { out.push({ text: plain }); plain = ""; }
  };
  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      flushPlain();
      const end = code.indexOf("\n", i);
      const text = end === -1 ? code.slice(i) : code.slice(i, end);
      out.push({ text, color: "#6b7280" });
      i += text.length;
    } else if (code[i] === "/" && code[i + 1] === "*") {
      flushPlain();
      const end = code.indexOf("*/", i + 2);
      const text = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out.push({ text, color: "#6b7280" });
      i += text.length;
    } else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      flushPlain();
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push({ text: code.slice(i, j + 1), color: "#86efac" });
      i = j + 1;
    } else if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word))      { flushPlain(); out.push({ text: word, color: "#c084fc", bold: true }); }
      else if (JS_BUILTINS.has(word)) { flushPlain(); out.push({ text: word, color: "#f87171" }); }
      else                            { plain += word; }
      i = j;
    } else if (/[0-9]/.test(code[i])) {
      flushPlain();
      let j = i + 1;
      while (j < code.length && /[0-9._xXeEbBoO]/.test(code[j])) j++;
      out.push({ text: code.slice(i, j), color: "#fbbf24" });
      i = j;
    } else {
      plain += code[i];
      i++;
    }
  }
  flushPlain();
  return out;
}

export function highlightJsonTokens(raw: string): HighlightToken[] {
  let formatted = raw;
  try { formatted = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* use raw */ }
  const out: HighlightToken[] = [];
  // Split into tokens via matchAll to avoid stateful regex APIs.
  const re = /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  let last = 0;
  for (const m of formatted.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: formatted.slice(last, idx) });
    const match = m[0];
    let color = "#60a5fa";
    if (match.startsWith('"')) color = match.trimEnd().endsWith(":") ? "#94a3b8" : "#86efac";
    else if (match === "true" || match === "false") color = "#fbbf24";
    else if (match === "null") color = "#f87171";
    out.push({ text: match, color });
    last = idx + match.length;
  }
  if (last < formatted.length) out.push({ text: formatted.slice(last) });
  return out;
}

export function highlightTokens(content: string, language: string): HighlightToken[] {
  if (language === "json") return highlightJsonTokens(content);
  if (language === "javascript" || language === "groovy" || language === "js") return highlightJsTokens(content);
  return [{ text: content }];
}
