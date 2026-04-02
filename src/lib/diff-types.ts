export interface DiffLine {
  type: "context" | "added" | "removed";
  content: string;
}

export interface FileDiff {
  relativePath: string;
  status: "added" | "removed" | "modified" | "unchanged";
  diffLines?: DiffLine[];
  /** Source file content (modified / removed files). Absent if file too large. */
  localContent?: string;
  /** Target file content (modified / added files). Absent if file too large. */
  remoteContent?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

export interface CompareEndpoint {
  environment: string;
  mode: "local" | "remote";
}

export interface CompareReport {
  source: CompareEndpoint;
  target: CompareEndpoint;
  generatedAt: string;
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  files: FileDiff[];
}
