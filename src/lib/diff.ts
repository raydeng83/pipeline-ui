import fs from "fs";
import path from "path";
import type { DiffLine, FileDiff, CompareReport, CompareEndpoint, DiffOptions } from "./diff-types";

const MAX_LINES = 2000;
const MAX_CONTENT_BYTES = 200_000; // 200 KB per side

// ── Metadata fields to strip from JSON when not including metadata ───────────

const METADATA_KEYS = new Set([
  "createdBy", "creationDate", "lastModifiedBy", "lastModifiedDate",
  "lastChangeDate", "lastChangedBy",
]);

// ── Scope → directory mapping ────────────────────────────────────────────────

const SCOPE_DIR: Record<string, string> = {
  "access-config":         "access-config",
  "audit":                 "audit",
  "connector-definitions": "sync/connectors",
  "connector-mappings":    "sync/mappings",
  "cookie-domains":        "cookie-domains",
  "cors":                  "cors",
  "csp":                   "csp",
  "custom-nodes":          "custom-nodes",
  "email-provider":        "email-provider",
  "email-templates":       "email-templates",
  "endpoints":             "endpoints",
  "idm-authentication":    "idm-authentication-config",
  "iga-workflows":         "iga/workflows",
  "internal-roles":        "internal-roles",
  "kba":                   "kba",
  "locales":               "locales",
  "managed-objects":       "managed-objects",
  "org-privileges":        "org-privileges",
  "raw":                   "raw",
  "remote-servers":        "sync/rcs",
  "schedules":             "schedules",
  "secrets":               "esvs/secrets",
  "service-objects":       "service-objects",
  "telemetry":             "telemetry",
  "terms-and-conditions":  "terms-conditions",
  "ui-config":             "ui",
  "variables":             "esvs/variables",
};

const REALM_SCOPE_SUBDIR: Record<string, string> = {
  "authz-policies":  "authorization",
  "journeys":        "journeys",
  "oauth2-agents":   "realm-config/agents",
  "password-policy": "password-policy",
  "saml":            "realm-config/saml",
  "scripts":         "scripts",
  "secret-mappings": "secret-mappings",
  "services":        "services",
  "themes":          "themes",
};

/** Resolve scope names to actual filesystem directories within a config dir. */
function resolveScopeDirs(configDir: string, scopes: string[]): string[] {
  const dirs: string[] = [];
  for (const scope of scopes) {
    if (scope in REALM_SCOPE_SUBDIR) {
      // Realm-based scope: scan all realms
      const realmsDir = path.join(configDir, "realms");
      if (fs.existsSync(realmsDir)) {
        for (const realm of fs.readdirSync(realmsDir, { withFileTypes: true })) {
          if (!realm.isDirectory()) continue;
          const scopePath = path.join(realmsDir, realm.name, REALM_SCOPE_SUBDIR[scope]);
          if (fs.existsSync(scopePath)) dirs.push(scopePath);
        }
      }
    } else {
      const dirName = SCOPE_DIR[scope] ?? scope;
      const scopePath = path.join(configDir, dirName);
      if (fs.existsSync(scopePath)) dirs.push(scopePath);
    }
  }
  return dirs;
}

function stripMetadata(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripMetadata);
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (!METADATA_KEYS.has(k)) out[k] = stripMetadata(v);
    }
    return out;
  }
  return obj;
}

/** Strip single-line (//) and multi-line (/* *​/) comments from JS/Groovy code. */
function stripComments(code: string): string {
  let result = "";
  let i = 0;
  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      // Skip to end of line
      while (i < code.length && code[i] !== "\n") i++;
    }
    // Multi-line comment
    else if (code[i] === "/" && code[i + 1] === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2; // skip */
    }
    // String literal (don't strip // or /* inside strings)
    else if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const q = code[i];
      result += code[i++];
      while (i < code.length && code[i] !== q) {
        if (code[i] === "\\") { result += code[i++]; }
        if (i < code.length) { result += code[i++]; }
      }
      if (i < code.length) result += code[i++]; // closing quote
    }
    else {
      result += code[i++];
    }
  }
  return result;
}

function isScriptFile(filePath: string): boolean {
  return /\.(js|groovy)$/i.test(filePath);
}

function normalizeContent(content: string, filePath: string, opts: DiffOptions = {}): string {
  let result = content;

  // Normalize line endings
  result = result.replace(/\r\n?/g, "\n");

  if (filePath.endsWith(".json")) {
    try {
      let parsed = JSON.parse(result);
      if (!opts.includeMetadata) parsed = stripMetadata(parsed);
      result = JSON.stringify(parsed, null, 2);
    } catch { /* fall through */ }
  }

  // Strip comments from script files
  if (isScriptFile(filePath) && !opts.includeMetadata) {
    result = stripComments(result);
  }

  // Ignore whitespace: trim each line, remove blank lines
  if (opts.ignoreWhitespace) {
    result = result
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
  }

  return result;
}

function computeLineDiff(aText: string, bText: string): DiffLine[] {
  const a = aText === "" ? [] : aText.split("\n");
  const b = bText === "" ? [] : bText.split("\n");

  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    return [{ type: "context", content: `(file too large to diff — ${a.length} vs ${b.length} lines)` }];
  }

  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      lines.unshift({ type: "context", content: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.unshift({ type: "added", content: b[j - 1] });
      j--;
    } else {
      lines.unshift({ type: "removed", content: a[i - 1] });
      i--;
    }
  }
  return lines;
}

function countChanges(lines: DiffLine[]): { linesAdded: number; linesRemoved: number } {
  let linesAdded = 0, linesRemoved = 0;
  for (const l of lines) {
    if (l.type === "added") linesAdded++;
    else if (l.type === "removed") linesRemoved++;
  }
  return { linesAdded, linesRemoved };
}

function walkDir(dir: string, base: string, out: Map<string, string>): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, base, out);
    } else {
      out.set(path.relative(base, full), fs.readFileSync(full, "utf-8"));
    }
  }
}

export function compareDirs(
  remoteDir: string,
  localDir: string,
  scopes?: string[],
  opts: DiffOptions = {},
): FileDiff[] {
  const remote = new Map<string, string>();
  const local = new Map<string, string>();

  if (scopes && scopes.length > 0) {
    for (const dir of resolveScopeDirs(remoteDir, scopes)) {
      walkDir(dir, remoteDir, remote);
    }
    for (const dir of resolveScopeDirs(localDir, scopes)) {
      walkDir(dir, localDir, local);
    }
  } else {
    walkDir(remoteDir, remoteDir, remote);
    walkDir(localDir, localDir, local);
  }

  const allPaths = new Set([...remote.keys(), ...local.keys()]);
  const diffs: FileDiff[] = [];

  // Metadata file patterns to skip when includeMetadata is false
  const METADATA_PATH_PATTERNS = [
    /scripts-config\//,         // Script registration/metadata files
  ];

  for (const rel of [...allPaths].sort()) {
    // Skip metadata files when not including metadata
    if (!opts.includeMetadata && METADATA_PATH_PATTERNS.some((p) => p.test(rel))) continue;
    const r = remote.get(rel);
    const l = local.get(rel);

    if (r !== undefined && l === undefined) {
      // Only in remote — added
      const rNorm = normalizeContent(r, rel, opts);
      const diffLines = rNorm.split("\n").slice(0, MAX_LINES).map((c) => ({ type: "added" as const, content: c }));
      diffs.push({
        relativePath: rel,
        status: "added",
        diffLines,
        remoteContent: Buffer.byteLength(rNorm) <= MAX_CONTENT_BYTES ? rNorm : undefined,
        linesAdded: diffLines.length,
        linesRemoved: 0,
      });
    } else if (r === undefined && l !== undefined) {
      // Only in local — removed
      const lNorm = normalizeContent(l, rel, opts);
      const diffLines = lNorm.split("\n").slice(0, MAX_LINES).map((c) => ({ type: "removed" as const, content: c }));
      diffs.push({
        relativePath: rel,
        status: "removed",
        diffLines,
        localContent: Buffer.byteLength(lNorm) <= MAX_CONTENT_BYTES ? lNorm : undefined,
        linesAdded: 0,
        linesRemoved: diffLines.length,
      });
    } else if (r !== undefined && l !== undefined) {
      const rNorm = normalizeContent(r, rel, opts);
      const lNorm = normalizeContent(l, rel, opts);
      if (rNorm === lNorm) {
        diffs.push({ relativePath: rel, status: "unchanged" });
      } else {
        const diffLines = computeLineDiff(lNorm, rNorm);
        const { linesAdded, linesRemoved } = countChanges(diffLines);
        diffs.push({
          relativePath: rel,
          status: "modified",
          diffLines,
          localContent: Buffer.byteLength(lNorm) <= MAX_CONTENT_BYTES ? lNorm : undefined,
          remoteContent: Buffer.byteLength(rNorm) <= MAX_CONTENT_BYTES ? rNorm : undefined,
          linesAdded,
          linesRemoved,
        });
      }
    }
  }
  return diffs;
}

export function buildReport(
  source: CompareEndpoint,
  sourceDir: string,
  target: CompareEndpoint,
  targetDir: string,
  scopes?: string[],
  opts: DiffOptions = {},
): CompareReport {
  // Default: ignore whitespace, exclude metadata
  const effectiveOpts: DiffOptions = {
    includeMetadata: opts.includeMetadata ?? false,
    ignoreWhitespace: opts.ignoreWhitespace ?? true,
  };
  const files = compareDirs(targetDir, sourceDir, scopes, effectiveOpts);
  const summary = { added: 0, removed: 0, modified: 0, unchanged: 0 };
  for (const f of files) summary[f.status]++;
  return {
    source,
    target,
    generatedAt: new Date().toISOString(),
    options: effectiveOpts,
    summary,
    files,
  };
}
