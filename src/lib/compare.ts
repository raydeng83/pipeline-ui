import type { CompareReport } from "@/lib/diff-types";

export interface DiffSummary {
  scope: string;
  added: number;
  modified: number;
  removed: number;
}

/**
 * Collapses a CompareReport's file-level diffs into a per-scope summary.
 * Scopes with only unchanged files are dropped.
 */
export function summarizeReport(report: CompareReport): DiffSummary[] {
  const byScope = new Map<string, { added: number; modified: number; removed: number }>();
  for (const file of report.files) {
    if (!file.scope) continue;
    const entry = byScope.get(file.scope) ?? { added: 0, modified: 0, removed: 0 };
    if (file.status === "added") entry.added++;
    else if (file.status === "modified") entry.modified++;
    else if (file.status === "removed") entry.removed++;
    else continue; // unchanged — don't touch the map
    byScope.set(file.scope, entry);
  }
  return Array.from(byScope.entries()).map(([scope, c]) => ({ scope, ...c }));
}
