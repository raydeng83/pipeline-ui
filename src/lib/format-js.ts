// Lazy Prettier loader + formatter. Kept in its own module so the standalone
// bundle (~300 KB gzipped) only downloads the first time the user toggles the
// Format button in the script viewer.

type Plugin = object;
type FormatFn = (code: string, opts: { parser: string; plugins: Plugin[]; printWidth?: number; tabWidth?: number; singleQuote?: boolean }) => Promise<string>;

let cached: Promise<{ format: FormatFn; plugins: Plugin[] }> | null = null;

function loadPrettier() {
  if (cached) return cached;
  cached = (async () => {
    const [std, babel, estree] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);
    return {
      format: std.format as unknown as FormatFn,
      plugins: [babel as unknown as Plugin, estree as unknown as Plugin],
    };
  })();
  return cached;
}

/** Format a JavaScript string with Prettier. Returns the original code on failure. */
export async function formatJavaScript(code: string): Promise<{ text: string; error?: string }> {
  try {
    const { format, plugins } = await loadPrettier();
    const text = await format(code, {
      parser: "babel",
      plugins,
      printWidth: 100,
      tabWidth: 2,
      singleQuote: true,
    });
    return { text };
  } catch (err) {
    return { text: code, error: err instanceof Error ? err.message : String(err) };
  }
}
