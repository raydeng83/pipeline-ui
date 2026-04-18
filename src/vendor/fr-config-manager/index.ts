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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pushMod = require("./push/update-managed-objects.js") as {
  updateManagedObjects: (opts: {
    configDir: string;
    tenantUrl: string;
    token: string;
    name?: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

/**
 * Push managed-objects from `configDir/managed-objects/**` to `tenantUrl`.
 *
 * When `name` is passed, only that object is sent; the function GETs the
 * target's current full config, splices in the one object, and PUTs back —
 * so sibling objects aren't accidentally reset. When `name` is omitted,
 * every subdir under `configDir/managed-objects/` is pushed as a full
 * replace (matches fr-config-push's default behavior).
 */
export async function pushManagedObjects(opts: {
  configDir: string;
  tenantUrl: string;
  token: string;
  name?: string;
  log?: (line: string) => void;
}): Promise<void> {
  await pushMod.updateManagedObjects(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const scriptsPull = require("./pull/scripts.js") as {
  exportScripts: (opts: {
    exportDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    prefixes?: string[];
    name?: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

/**
 * Pull AM scripts from all realms (filtered by prefixes / name) into
 * `exportDir/<realm>/scripts/{scripts-config,scripts-content}/`.
 */
export async function pullScripts(opts: {
  exportDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  prefixes?: string[];
  name?: string;
  log?: (line: string) => void;
}): Promise<void> {
  await scriptsPull.exportScripts(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const scriptsPush = require("./push/update-scripts.js") as {
  updateScripts: (opts: {
    configDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    name?: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

/**
 * Push AM scripts from `configDir/realms/<realm>/scripts/scripts-config/*.json`.
 * When `name` is passed, only that script is pushed; `realms` must have exactly
 * one entry in that case.
 */
export async function pushScripts(opts: {
  configDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  name?: string;
  log?: (line: string) => void;
}): Promise<void> {
  await scriptsPush.updateScripts(opts);
}
