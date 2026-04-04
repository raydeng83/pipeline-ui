"use client";

import { useEffect, useMemo, useState } from "react";

// ── JS syntax highlighter ─────────────────────────────────────────────────────

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

  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function span(color: string, text: string, bold = false) {
    return `<span style="color:${color}${bold ? ";font-weight:500" : ""}">${esc(text)}</span>`;
  }

  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const text = end === -1 ? code.slice(i) : code.slice(i, end);
      out.push(span("#6b7280", text));
      i += text.length;
    }
    // Multi-line comment
    else if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const text = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out.push(span("#6b7280", text));
      i += text.length;
    }
    // String (double / single / template)
    else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push(span("#86efac", code.slice(i, j + 1)));
      i = j + 1;
    }
    // Identifier / keyword / builtin
    else if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word))      out.push(span("#c084fc", word, true));
      else if (JS_BUILTINS.has(word)) out.push(span("#f87171", word));
      else                            out.push(esc(word));
      i = j;
    }
    // Number
    else if (/[0-9]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[0-9._xXeEbBoO]/.test(code[j])) j++;
      out.push(span("#fbbf24", code.slice(i, j)));
      i = j;
    }
    else {
      out.push(esc(code[i]));
      i++;
    }
  }
  return out.join("");
}

// ── Script fullscreen overlay ─────────────────────────────────────────────────

export function ScriptOverlay({ name, content, onClose }: { name: string; content: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const highlighted = useMemo(() => highlightJs(content), [content]);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
        <span className="text-sm font-mono font-medium text-slate-200 flex-1 truncate">{name}</span>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy script"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close (Esc)"
          className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Code */}
      <div className="flex-1 overflow-auto">
        <pre
          className="text-xs font-mono leading-relaxed p-5 text-slate-300 min-h-full"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}
