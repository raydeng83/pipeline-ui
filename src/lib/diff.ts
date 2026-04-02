import fs from "fs";
import path from "path";
import type { DiffLine, FileDiff, CompareReport, CompareEndpoint } from "./diff-types";

const MAX_LINES = 2000;
const MAX_CONTENT_BYTES = 200_000; // 200 KB per side

function normalizeContent(content: string, filePath: string): string {
  if (filePath.endsWith(".json")) {
    try { return JSON.stringify(JSON.parse(content), null, 2); } catch { /* fall through */ }
  }
  return content;
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
  scopes?: string[]
): FileDiff[] {
  const remote = new Map<string, string>();
  const local = new Map<string, string>();

  if (scopes && scopes.length > 0) {
    for (const scope of scopes) {
      walkDir(path.join(remoteDir, scope), remoteDir, remote);
      walkDir(path.join(localDir, scope), localDir, local);
    }
  } else {
    walkDir(remoteDir, remoteDir, remote);
    walkDir(localDir, localDir, local);
  }

  const allPaths = new Set([...remote.keys(), ...local.keys()]);
  const diffs: FileDiff[] = [];

  for (const rel of [...allPaths].sort()) {
    const r = remote.get(rel);
    const l = local.get(rel);

    if (r !== undefined && l === undefined) {
      // Only in remote — added
      const rNorm = normalizeContent(r, rel);
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
      const lNorm = normalizeContent(l, rel);
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
      const rNorm = normalizeContent(r, rel);
      const lNorm = normalizeContent(l, rel);
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
): CompareReport {
  // targetDir = "new state" (remote), sourceDir = "old state" (local) in diff semantics
  const files = compareDirs(targetDir, sourceDir);
  const summary = { added: 0, removed: 0, modified: 0, unchanged: 0 };
  for (const f of files) summary[f.status]++;
  return {
    source,
    target,
    generatedAt: new Date().toISOString(),
    summary,
    files,
  };
}
