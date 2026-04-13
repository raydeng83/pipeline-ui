export interface DiffLine {
  type: "context" | "added" | "removed";
  content: string;
}

export interface FileDiff {
  relativePath: string;
  /** Top-level config scope this file belongs to (e.g. "journeys", "scripts"). */
  scope?: string;
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

export interface DiffOptions {
  includeMetadata?: boolean;
  ignoreWhitespace?: boolean;
}

export interface JourneyScript {
  uuid: string;
  name: string;
  status: "modified" | "added" | "removed" | "unchanged";
}

export interface JourneyNodeInfo {
  uuid: string;
  name: string;
  nodeType: string;
  status: "modified" | "added" | "removed" | "unchanged";
  /** Why this node is "modified" — distinguishes script vs sub-journey changes */
  modifiedReason?: "script" | "subjourney";
}

export interface JourneyTreeNode {
  name: string;
  status: "modified" | "added" | "removed" | "unchanged";
  isEntry: boolean;
  subJourneys: JourneyTreeNode[];
  scripts: JourneyScript[];
  nodes: JourneyNodeInfo[];
}

export interface MissingDepsWarning {
  missingJourneys: string[];
  missingScripts: string[];
}

export interface CompareReport {
  source: CompareEndpoint;
  target: CompareEndpoint;
  generatedAt: string;
  options?: DiffOptions;
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  files: FileDiff[];
  journeyTree?: JourneyTreeNode[];
  missingDeps?: MissingDepsWarning;
}
