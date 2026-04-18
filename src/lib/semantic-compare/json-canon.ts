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

/**
 * Recursively apply `normalizeEsvEscapes` to every string leaf in a JSON value.
 * Used inside the canonicalization pipeline so vendored-pull escape artifacts
 * (`\${foo}`) and upstream literals (`${foo}`) compare equal in node payloads
 * and journey headers.
 */
export function normalizeJsonEsvEscapes(value: unknown): unknown {
  if (typeof value === "string") return normalizeEsvEscapes(value);
  if (Array.isArray(value)) return value.map(normalizeJsonEsvEscapes);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeJsonEsvEscapes(v);
    }
    return out;
  }
  return value;
}
