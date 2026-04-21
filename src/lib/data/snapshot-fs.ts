import fs from "fs";
import path from "path";
import type { DisplayFields, SnapshotType, SnapshotRecordPage } from "./types";

function managedDataDir(envsRoot: string, env: string): string {
  return path.join(envsRoot, env, "managed-data");
}

export function listSnapshotTypes(envsRoot: string, env: string): SnapshotType[] {
  const root = managedDataDir(envsRoot, env);
  if (!fs.existsSync(root)) return [];
  const out: SnapshotType[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const manifestPath = path.join(root, entry.name, "_manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      out.push({
        name: entry.name,
        count: typeof m.count === "number" ? m.count : 0,
        pulledAt: typeof m.pulledAt === "number" ? m.pulledAt : 0,
      });
    } catch { /* skip unreadable manifest */ }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export function readRecord(
  envsRoot: string, env: string, type: string, id: string,
): Record<string, unknown> | null {
  const filePath = path.join(managedDataDir(envsRoot, env), type, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function stringOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

interface ListOpts {
  q: string;
  page: number;
  limit: number;
  display: DisplayFields;
}

export function listRecords(
  envsRoot: string, env: string, type: string, opts: ListOpts,
): SnapshotRecordPage {
  const dir = path.join(managedDataDir(envsRoot, env), type);
  if (!fs.existsSync(dir)) {
    return { total: 0, page: opts.page, limit: opts.limit, records: [] };
  }

  const q = opts.q.trim().toLowerCase();
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "_manifest.json")
    .sort();

  const matching: { id: string; record: Record<string, unknown> }[] = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const record = JSON.parse(raw) as Record<string, unknown>;
      if (!q) {
        matching.push({ id: f.replace(/\.json$/, ""), record });
        continue;
      }
      const hit = opts.display.searchFields.some((field) =>
        stringOrEmpty(record[field]).toLowerCase().includes(q),
      );
      if (hit) matching.push({ id: f.replace(/\.json$/, ""), record });
    } catch { /* skip unreadable file */ }
  }

  const total = matching.length;
  const start = (opts.page - 1) * opts.limit;
  const slice = matching.slice(start, start + opts.limit);

  return {
    total,
    page: opts.page,
    limit: opts.limit,
    records: slice.map(({ id, record }) => {
      const titleField = opts.display.title;
      const title = stringOrEmpty(record[titleField]) || id;
      const subtitle = opts.display.subtitle
        ? stringOrEmpty(record[opts.display.subtitle]) || undefined
        : undefined;
      return { id, title, subtitle };
    }),
  };
}
