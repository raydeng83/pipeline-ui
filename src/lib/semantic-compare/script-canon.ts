import type { CanonicalScript } from "./types";

export interface ScriptConfig {
  name: string;
  context: string;
  language?: string;
  evaluatorVersion?: string;
  default?: boolean;
  description?: string | null;
  [k: string]: unknown;
}

export function scriptIdentity(cfg: ScriptConfig): string {
  return `${cfg.context}/${cfg.name}`;
}

/** Normalize script body for comparison: line endings, BOM, trailing whitespace, final newline. */
export function normalizeScriptBody(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/^\uFEFF/, "");         // strip BOM
  s = s.replace(/\r\n?/g, "\n");              // CRLF -> LF
  s = s.split("\n").map((line) => line.replace(/[ \t]+$/, "")).join("\n");
  if (!s.endsWith("\n")) s += "\n";
  return s;
}

export function canonicalizeScript(cfg: ScriptConfig, body: string): CanonicalScript {
  return {
    identity: scriptIdentity(cfg),
    context: cfg.context,
    name: cfg.name,
    language: (cfg.language ?? "JAVASCRIPT") as string,
    evaluatorVersion: (cfg.evaluatorVersion ?? "1.0") as string,
    defaultFlag: Boolean(cfg.default),
    body: normalizeScriptBody(body),
    description: cfg.description && cfg.description !== "null" ? cfg.description : null,
  };
}
