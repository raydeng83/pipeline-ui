// Typed re-exports for the vendored fr-config-manager code.
// Import from this file only — never from the underlying .js files — so we
// can port the internals to TS incrementally without breaking callers.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const managed = require("./pull/managed.js") as {
  exportManagedObjects: (
    exportDir: string,
    tenantUrl: string,
    name: string | undefined,
    pullCustomRelationships: boolean,
    token: string,
  ) => Promise<void>;
};

/**
 * Pull managed-objects from `tenantUrl` into `exportDir/managed-objects/...`.
 * Honors the `name` filter (fixed version — upstream drops anything after the
 * first non-match).
 */
export async function pullManagedObjects(opts: {
  exportDir: string;
  tenantUrl: string;
  token: string;
  name?: string;
  pullCustomRelationships?: boolean;
}): Promise<void> {
  await managed.exportManagedObjects(
    opts.exportDir,
    opts.tenantUrl,
    opts.name,
    opts.pullCustomRelationships ?? false,
    opts.token,
  );
}
