import type { CompareReport, FileDiff } from "@/lib/diff-types";

export interface DiffSummary {
  scope: string;
  added: number;
  modified: number;
  removed: number;
}

function scopeOf(file: FileDiff): string | null {
  if (file.scope) return file.scope;
  const first = file.relativePath?.split("/")[0];
  return first || null;
}

/**
 * Collapses a CompareReport's file-level diffs into a per-scope summary.
 * Scopes with only unchanged files are dropped. Scope is derived from
 * `FileDiff.scope` when present, otherwise from the leading path segment
 * of `relativePath`, which matches the on-disk config layout.
 */
export function summarizeReport(report: CompareReport): DiffSummary[] {
  const byScope = new Map<string, { added: number; modified: number; removed: number }>();
  for (const file of report.files) {
    const scope = scopeOf(file);
    if (!scope) continue;
    const entry = byScope.get(scope) ?? { added: 0, modified: 0, removed: 0 };
    if (file.status === "added") entry.added++;
    else if (file.status === "modified") entry.modified++;
    else if (file.status === "removed") entry.removed++;
    else continue;
    byScope.set(scope, entry);
  }
  return Array.from(byScope.entries()).map(([scope, c]) => ({ scope, ...c }));
}
