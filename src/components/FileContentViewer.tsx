"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import { highlightTokens } from "@/lib/highlight";

interface Props {
  content: string;
  /** Determines syntax highlighting. Pass the filename or extension. */
  fileName?: string;
  /** Explicit language override; takes precedence over fileName. */
  language?: "js" | "groovy" | "json" | "text";
  className?: string;
  /** Optional line to highlight (1-indexed) */
  highlightLine?: number;
}

function detectLanguage(fileName: string | undefined): "js" | "groovy" | "json" | "text" {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "json") return "json";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "js";
  if (ext === "groovy") return "groovy";
  return "text";
}

export function FileContentViewer({ content, fileName, language, className, highlightLine }: Props) {
  const lang = language ?? detectLanguage(fileName);

  // Tokenize, then split tokens on newlines so each source line is its own array.
  const lines = useMemo(() => {
    const tokens = highlightTokens(content, lang === "js" || lang === "groovy" ? "javascript" : lang);
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
  }, [content, lang]);

  return (
    <div
      className={cn(
        "h-full overflow-auto bg-slate-900 text-slate-300 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <table className="border-collapse">
        <tbody>
          {lines.map((tokens, i) => {
            const ln = i + 1;
            const isHighlighted = highlightLine === ln;
            return (
              <tr key={i} className={cn(isHighlighted && "bg-amber-900/30")}>
                <td
                  aria-hidden
                  className={cn(
                    "sticky left-0 bg-slate-900 select-none text-right pl-4 pr-3 text-slate-600 border-r border-slate-800 tabular-nums whitespace-nowrap align-top",
                    isHighlighted && "bg-amber-900/40 text-amber-300 font-semibold",
                  )}
                >
                  {ln}
                </td>
                <td className="pl-4 pr-4 whitespace-pre">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
