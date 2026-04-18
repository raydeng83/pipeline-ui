export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export function stripFields(value: unknown, fields: string[]): unknown {
  const drop = new Set(fields);
  if (Array.isArray(value)) return value.map((v) => stripFields(v, fields));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (drop.has(k)) continue;
      out[k] = stripFields(v, fields);
    }
    return out;
  }
  return value;
}

/** Collapse \${foo} (escape artifact from vendored pull) to ${foo} for comparison. */
export function normalizeEsvEscapes(s: string): string {
  return s.replace(/\\\$\{/g, "${");
}
