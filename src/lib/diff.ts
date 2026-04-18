import fs from "fs";
import path from "path";
import type { DiffLine, FileDiff, CompareReport, CompareEndpoint, DiffOptions, JourneyTreeNode, JourneyScript, JourneyNodeInfo } from "./diff-types";
import { formatHtml, shouldFormatAsHtml } from "./format-html";
import { getRealmRoots } from "./realm-paths";
import { loadSemanticJourneys } from "./semantic-compare-adapter";

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
      const subdir = REALM_SCOPE_SUBDIR[scope];
      // Both upstream (configDir/realms/<r>/subdir) and vendored
      // (configDir/<r>/subdir) layouts are supported.
      for (const root of getRealmRoots(configDir, subdir)) {
        dirs.push(path.join(root, subdir));
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

/**
 * Canonicalize JSON by alphabetically sorting object keys at every level so
 * diffs aren't sensitive to key insertion order — IDM reorders keys when it
 * round-trips managed-object configs, and fr-config-pull's script extraction
 * moves `file` around, which caused spurious "modified" results even when
 * the semantic content was identical.
 */
function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortJsonKeys);
  if (obj && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[k] = sortJsonKeys((obj as Record<string, unknown>)[k]);
    }
    return sorted;
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
      parsed = sortJsonKeys(parsed);
      result = JSON.stringify(parsed, null, 2);
    } catch { /* fall through */ }
  }

  // Pretty-print HTML-bearing email-template files (.md/.html) so a single
  // upstream long line shows as structured indentation in both compare and
  // browse views — the diff is computed on the formatted text so changes
  // are line-precise.
  if (shouldFormatAsHtml(filePath)) {
    try { result = formatHtml(result); } catch { /* keep raw */ }
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
      // Normalize to POSIX separators so downstream consumers (regexes, UI
      // path splits, scope derivation) work identically on Windows and Unix.
      const rel = path.relative(base, full).split(path.sep).join("/");
      out.set(rel, fs.readFileSync(full, "utf-8"));
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
      // ESV definitions (variables/secrets) are environment-specific by
      // design — value drift is expected and uninteresting for promotions.
      // Only added/removed presence matters, so treat present-on-both as
      // unchanged regardless of content.
      if (/^esvs\/(variables|secrets)\//.test(rel)) {
        diffs.push({ relativePath: rel, status: "unchanged" });
        continue;
      }
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

// ── Journey tree builder ─────────────────────────────────────────────────────

interface JourneyNodeMeta {
  uuid: string;
  name: string;
  nodeType: string;
}

interface JourneyMeta {
  name: string;
  innerTreeOnly: boolean;
  subJourneys: string[];
  scriptUUIDs: string[];
  allNodes: JourneyNodeMeta[];
  /** nodeUUID → script UUID (for ScriptedDecisionNode and similar) */
  nodeScripts: Map<string, string>;
  /** nodeUUID → sub-journey name (for InnerTreeEvaluatorNode) */
  nodeSubJourneys: Map<string, string>;
}

function scanJourneys(configDir: string): Map<string, JourneyMeta> {
  const map = new Map<string, JourneyMeta>();

  for (const realmRoot of getRealmRoots(configDir, "journeys")) {
    const journeysDir = path.join(realmRoot, "journeys");
    for (const jDir of fs.readdirSync(journeysDir, { withFileTypes: true })) {
      if (!jDir.isDirectory()) continue;
      const mainFile = path.join(journeysDir, jDir.name, `${jDir.name}.json`);
      if (!fs.existsSync(mainFile)) continue;

      try {
        const data = JSON.parse(fs.readFileSync(mainFile, "utf-8"));
        const nodes = (data.nodes ?? {}) as Record<string, { nodeType?: string }>;
        const innerTreeUUIDs = new Set<string>();
        for (const [uuid, node] of Object.entries(nodes)) {
          if (node.nodeType === "InnerTreeEvaluatorNode") innerTreeUUIDs.add(uuid);
        }

        const subJourneys: string[] = [];
        const scriptUUIDs: string[] = [];
        const allNodes: JourneyNodeMeta[] = [];
        const nodeScripts = new Map<string, string>();
        const nodeSubJourneys = new Map<string, string>();
        const nodesDir = path.join(journeysDir, jDir.name, "nodes");
        if (fs.existsSync(nodesDir)) {
          for (const nf of fs.readdirSync(nodesDir)) {
            const fp = path.join(nodesDir, nf);
            if (fs.statSync(fp).isDirectory()) continue;
            try {
              const nd = JSON.parse(fs.readFileSync(fp, "utf-8")) as { tree?: string; script?: string; _type?: { _id?: string; name?: string }; _id?: string };
              const m = nf.match(/- ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i);
              const uuid = m?.[1] ?? nd._id ?? "";
              const nodeType = nd._type?._id ?? "unknown";
              const nodeName = nd._type?.name ?? nf.replace(/\s*-\s*[0-9a-f-]+\.json$/i, "");
              if (m && innerTreeUUIDs.has(m[1]) && nd.tree) {
                subJourneys.push(nd.tree);
                nodeSubJourneys.set(uuid, nd.tree);
              }
              if (nd.script) {
                scriptUUIDs.push(nd.script);
                nodeScripts.set(uuid, nd.script);
              }
              allNodes.push({ uuid, name: nodeName, nodeType });
            } catch { /* skip */ }
          }
        }

        map.set(jDir.name, {
          name: jDir.name,
          innerTreeOnly: data.innerTreeOnly ?? false,
          subJourneys,
          scriptUUIDs,
          allNodes,
          nodeScripts,
          nodeSubJourneys,
        });
      } catch { /* skip */ }
    }
  }
  return map;
}

/** Build UUID → script name mapping from scripts-config dir. */
function buildScriptNameMap(configDir: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const realmRoot of getRealmRoots(configDir, "scripts/scripts-config")) {
    const configPath = path.join(realmRoot, "scripts", "scripts-config");
    for (const f of fs.readdirSync(configPath)) {
      if (!f.endsWith(".json")) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(configPath, f), "utf-8"));
        if (data._id && data.name) map.set(data._id, data.name);
      } catch { /* skip */ }
    }
  }
  return map;
}

function buildJourneyTree(
  sourceDir: string,
  targetDir: string,
  changedJourneys: Map<string, FileDiff["status"]>,
  changedScripts: Map<string, FileDiff["status"]>,
  changedNodeFiles: Map<string, FileDiff["status"]>,  // "journeyName/nodeUUID" → status
  forceIncludeJourneys?: Set<string>,  // Always include these in the tree, even if unchanged
): JourneyTreeNode[] {
  const sourceJourneys = scanJourneys(sourceDir);
  const targetJourneys = scanJourneys(targetDir);

  // Build script UUID → name from both sides
  const scriptNames = new Map<string, string>();
  for (const [k, v] of buildScriptNameMap(sourceDir)) scriptNames.set(k, v);
  for (const [k, v] of buildScriptNameMap(targetDir)) scriptNames.set(k, v);

  const allNames = new Set([...sourceJourneys.keys(), ...targetJourneys.keys()]);
  const calledBy = new Map<string, string[]>();

  for (const name of allNames) {
    const meta = targetJourneys.get(name) ?? sourceJourneys.get(name)!;
    for (const sub of meta.subJourneys) {
      if (!calledBy.has(sub)) calledBy.set(sub, []);
      calledBy.get(sub)!.push(name);
    }
  }

  function hasChangedDescendant(name: string, visited: Set<string>): boolean {
    if (visited.has(name)) return false;
    visited.add(name);
    if (changedJourneys.has(name)) return true;
    const meta = targetJourneys.get(name) ?? sourceJourneys.get(name);
    if (!meta) return false;
    // Also consider changed scripts
    if (meta.scriptUUIDs.some((uuid) => changedScripts.has(uuid))) return true;
    return meta.subJourneys.some((s) => hasChangedDescendant(s, visited));
  }

  function buildNode(name: string, visited: Set<string>): JourneyTreeNode | null {
    if (visited.has(name)) return null;
    visited.add(name);

    const meta = targetJourneys.get(name) ?? sourceJourneys.get(name);
    const status = changedJourneys.get(name) ?? "unchanged";
    const isEntry = !meta?.innerTreeOnly && !(calledBy.get(name)?.length);

    // Resolve scripts for this journey
    const scripts: JourneyScript[] = [];
    const nodes: JourneyNodeInfo[] = [];
    if (meta) {
      for (const uuid of meta.scriptUUIDs) {
        const scriptName = scriptNames.get(uuid) ?? uuid;
        const scriptStatus = changedScripts.get(uuid) ?? "unchanged";
        scripts.push({ uuid, name: scriptName, status: scriptStatus });
      }
      scripts.sort((a, b) => a.name.localeCompare(b.name));

      // Resolve all node statuses
      for (const nm of meta.allNodes) {
        let nodeStatus = changedNodeFiles.get(`${name}/${nm.uuid}`) ?? "unchanged";
        let modifiedReason: "script" | "subjourney" | undefined;
        // ScriptedDecisionNode: mark modified if its referenced script changed
        if (nodeStatus === "unchanged") {
          const scriptUuid = meta.nodeScripts.get(nm.uuid);
          if (scriptUuid && changedScripts.has(scriptUuid)) {
            nodeStatus = "modified";
            modifiedReason = "script";
          }
        }
        // InnerTreeEvaluatorNode: mark modified if its sub-journey has changes
        if (nodeStatus === "unchanged") {
          const subJourneyName = meta.nodeSubJourneys.get(nm.uuid);
          if (subJourneyName && hasChangedDescendant(subJourneyName, new Set())) {
            nodeStatus = "modified";
            modifiedReason = "subjourney";
          }
        }
        nodes.push({ uuid: nm.uuid, name: nm.name, nodeType: nm.nodeType, status: nodeStatus, modifiedReason });
      }
      nodes.sort((a, b) => a.name.localeCompare(b.name));
    }

    const childNodes: JourneyTreeNode[] = [];
    if (meta) {
      for (const sub of meta.subJourneys) {
        const child = buildNode(sub, new Set(visited));
        if (child) childNodes.push(child);
      }
    }

    return { name, status, isEntry, subJourneys: childNodes, scripts, nodes };
  }

  const roots: JourneyTreeNode[] = [];
  for (const name of allNames) {
    const meta = targetJourneys.get(name) ?? sourceJourneys.get(name)!;
    const parents = calledBy.get(name) ?? [];
    const isEntry = parents.length === 0 && !meta.innerTreeOnly;
    if (!isEntry) continue;
    // Always build the full tree (including unchanged journeys). Client-side
    // filtering controls visibility via the "Hide unchanged files" checkbox.
    const node = buildNode(name, new Set());
    if (node) roots.push(node);
  }
  // forceIncludeJourneys is kept for backward compat but no longer needed
  // since we always include all entry journeys.
  void forceIncludeJourneys;

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildReport(
  source: CompareEndpoint,
  sourceDir: string,
  target: CompareEndpoint,
  targetDir: string,
  scopes?: string[],
  opts: DiffOptions = {},
  forceIncludeJourneys?: Set<string>,
): CompareReport {
  // Default: ignore whitespace, exclude metadata
  const effectiveOpts: DiffOptions = {
    includeMetadata: opts.includeMetadata ?? false,
    ignoreWhitespace: opts.ignoreWhitespace ?? true,
  };
  const files = compareDirs(targetDir, sourceDir, scopes, effectiveOpts);
  const summary = { added: 0, removed: 0, modified: 0, unchanged: 0 };
  for (const f of files) summary[f.status]++;

  // Build journey tree from changed journey and script files
  const changedJourneys = new Map<string, FileDiff["status"]>();
  const changedScripts = new Map<string, FileDiff["status"]>(); // UUID → status
  for (const f of files) {
    if (f.status === "unchanged") continue;
    const jm = f.relativePath.match(/(?:^|\/)?journeys\/([^/]+)\//);
    if (jm) {
      const existing = changedJourneys.get(jm[1]);
      if (!existing || f.status === "modified") changedJourneys.set(jm[1], f.status);
    }
    // Track changed script content files by extracting script name
    const sm = f.relativePath.match(/scripts-content\/[^/]+\/(.+)\.\w+$/);
    if (sm) {
      // We need UUID for matching — look up from script config
      // For now, track by content file name; we'll resolve in the tree builder
    }
  }

  // Build script name → status map from changed script content files
  const changedScriptNames = new Map<string, FileDiff["status"]>();
  for (const f of files) {
    if (f.status === "unchanged") continue;
    const sm = f.relativePath.match(/scripts-content\/[^/]+\/(.+)\.\w+$/);
    if (sm) changedScriptNames.set(sm[1], f.status);
  }

  // Resolve script name → UUID using config files from both dirs
  const scriptNameToUUID = new Map<string, string>();
  for (const dir of [sourceDir, targetDir]) {
    for (const realmRoot of getRealmRoots(dir, "scripts/scripts-config")) {
      const cfgDir = path.join(realmRoot, "scripts", "scripts-config");
      for (const f of fs.readdirSync(cfgDir)) {
        if (!f.endsWith(".json")) continue;
        try {
          const d = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
          if (d._id && d.name) scriptNameToUUID.set(d.name, d._id);
        } catch { /* skip */ }
      }
    }
  }

  for (const [name, status] of changedScriptNames) {
    const uuid = scriptNameToUUID.get(name);
    if (uuid) changedScripts.set(uuid, status);
  }

  // Track changed node files: "journeyName/nodeUUID" → status
  const changedNodeFiles = new Map<string, FileDiff["status"]>();
  for (const f of files) {
    if (f.status === "unchanged") continue;
    const nm = f.relativePath.match(/journeys\/([^/]+)\/nodes\/.*?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i);
    if (nm) changedNodeFiles.set(`${nm[1]}/${nm[2]}`, f.status);
  }

  let journeyTree: JourneyTreeNode[] | undefined;
  try {
    journeyTree = buildJourneyTree(sourceDir, targetDir, changedJourneys, changedScripts, changedNodeFiles, forceIncludeJourneys);
  } catch { /* ignore */ }

  const semanticJourneys = loadSemanticJourneys(sourceDir, targetDir, scopes ?? []);

  return {
    source,
    target,
    generatedAt: new Date().toISOString(),
    options: effectiveOpts,
    summary,
    files,
    journeyTree,
    ...(semanticJourneys ? { semanticJourneys } : {}),
  };
}
