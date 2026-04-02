/**
 * Parse a .env file string into a key→value map, preserving comments as special keys.
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    const unquoted =
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
    result[key] = unquoted.replace(/\\n/g, "\n");
  }
  return result;
}

/**
 * Serialize known fields back to .env format. Unknown keys from the original
 * file are appended at the end so nothing is lost.
 */
export function serializeEnvFile(
  fields: Record<string, string>,
  originalContent: string
): string {
  // Collect keys we're about to write
  const writtenKeys = new Set(Object.keys(fields));

  // Keep comment lines and unknown keys from original
  const extraLines: string[] = [];
  const seenKeys = new Set<string>();
  for (const line of originalContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      extraLines.push(line);
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!writtenKeys.has(key) && !seenKeys.has(key)) {
      seenKeys.add(key);
      extraLines.push(line);
    }
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    // Escape actual newlines so multi-line values (e.g. PEM keys) stay on one line
    const escaped = value.replace(/\n/g, "\\n");
    // Only quote values that contain spaces or # (not quotes — JSON arrays/objects
    // like ["alpha"] must be written unquoted so the CLI receives valid JSON)
    const needsQuotes = /[ \t#]/.test(escaped) && !escaped.startsWith("[") && !escaped.startsWith("{");
    lines.push(`${key}=${needsQuotes ? `"${escaped}"` : escaped}`);
  }

  if (extraLines.length > 0) {
    lines.push("", ...extraLines);
  }

  return lines.join("\n") + "\n";
}
