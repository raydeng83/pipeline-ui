import type { DisplayFields } from "./types";

const TITLE_CANDIDATES = ["userName", "name", "_title", "displayName"];
const SUBTITLE_CANDIDATES = ["mail", "description", "sn", "givenName"];
const SCALAR_TYPES = new Set(["string", "number", "boolean"]);

type Schema = {
  schema?: {
    properties?: Record<string, { type?: string; searchable?: boolean }>;
  };
};

export function deriveDisplayFields(schema: Schema): DisplayFields {
  const props = schema.schema?.properties ?? {};
  const keys = Object.keys(props);

  const title = TITLE_CANDIDATES.find((c) => c in props) ?? "_id";
  const subtitle = SUBTITLE_CANDIDATES.find((c) => c in props && c !== title);

  const searchable = keys.filter(
    (k) => props[k].searchable === true && SCALAR_TYPES.has(props[k].type ?? ""),
  );
  const searchFields = searchable.length > 0
    ? searchable
    : [title, ...(subtitle ? [subtitle] : [])];

  return { title, subtitle, searchFields };
}

export function fallbackDisplayFields(record: Record<string, unknown>): DisplayFields {
  const firstString = Object.entries(record).find(
    ([k, v]) => k !== "_id" && typeof v === "string",
  )?.[0];
  return {
    title: "_id",
    subtitle: firstString,
    searchFields: firstString ? ["_id", firstString] : ["_id"],
  };
}
