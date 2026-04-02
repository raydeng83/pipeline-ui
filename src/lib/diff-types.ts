export interface DiffLine {
  type: "context" | "added" | "removed";
  content: string;
}

export interface FileDiff {
  relativePath: string;
  status: "added" | "removed" | "modified" | "unchanged";
  diffLines?: DiffLine[];
  /** Normalized local file content (modified / removed files). Absent if file too large. */
  localContent?: string;
  /** Normalized remote file content (modified / added files). Absent if file too large. */
  remoteContent?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

export interface CompareReport {
  environment: string;
  generatedAt: string;
  scopes: string[];
  localConfigDir: string;
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  files: FileDiff[];
}
