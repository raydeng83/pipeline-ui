# Vendor fr-config-manager — Phase 2 (managed-objects push)

**Goal:** Vendor `update-managed-objects.js` so the managed-objects **push** no longer spawns `fr-config-push`. Drop the "seed temp dir with target's full managed-objects dir" hack from `promote-items/route.ts` — the upstream function already has a `--name`-driven merge path that GETs target, splices in the new object, and PUTs back. Using that inside our process is strictly better: no stale local-seed assumption, no per-selection copy, no nested spawn.

**Architecture:** Same vendor-and-wire pattern as phase 1. Add `restPut` to the vendored restClient, vendor the push script with light adapter changes (remove argv / `process.env` reads, throw instead of `process.exit`, accept a log callback), and call it from `promote-items/route.ts` for the managed-objects scope. Every other scope still spawns `fr-config-push` as today.

**Tech Stack:** Node.js, vendored axios, Next.js 16 route handler.

**Scope note:** Phase 2 covers **only the managed-objects push step**. Other scopes' push paths stay on spawn.

---

## File Structure

```
src/vendor/fr-config-manager/
  common/restClient.js               # add restPut (currently has restGet only)
  push/update-managed-objects.js     # new file — adapted from upstream
  index.ts                           # add pushManagedObjects export

src/app/api/promote-items/route.ts   # replace the managed-objects push spawn;
                                      # remove the seed-from-target seed hack
```

---

## Task 1: Extend `common/restClient.js` with `restPut`

**Files:**
- Modify: `src/vendor/fr-config-manager/common/restClient.js`

- [ ] **Step 1: Add `restPut`**

Append to the end of the file, before `module.exports`:

```javascript
async function restPut(url, data, token, apiVersion, ifMatch, ifNoneMatch) {
  const headers = { "Content-Type": "application/json" };
  if (apiVersion) headers["Accept-Api-Version"] = apiVersion;
  if (ifMatch) headers["If-Match"] = ifMatch;
  if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
  return httpRequest({ method: "PUT", url, data, headers }, token);
}
```

Update the export:

```javascript
module.exports = { restGet, restPut };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const c = require('./src/vendor/fr-config-manager/common/restClient.js'); console.log(Object.keys(c))"
```

Expected: `[ 'restGet', 'restPut' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/common/restClient.js
git commit -m "vendor: add restPut to minimal restClient"
```

---

## Task 2: Vendor `push/update-managed-objects.js`

**Files:**
- Create: `src/vendor/fr-config-manager/push/update-managed-objects.js`

The upstream function reads `CONFIG_DIR` / `TENANT_BASE_URL` from `process.env`, takes an `argv` object, and calls `process.exit(1)` on error. All three are hostile to calling it in-process from a Next.js route. Rewrite the signature to take an options object; keep the inner logic (script file merging, `mergeExistingObjects`, custom-relationship schema loop) byte-for-byte so diffs against upstream stay legible.

- [ ] **Step 1: Write the file**

Content:

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-managed-objects.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Accepts configDir / tenantUrl / token / name as arguments instead of
 *     process.env + argv, so this can run in-process.
 *   - Throws on error instead of calling process.exit(1).
 *   - Optional `log` callback receives stdout-style progress strings.
 */

const fs = require("fs");
const path = require("path");
const { restPut, restGet } = require("../common/restClient.js");

const SCRIPT_HOOKS = ["onStore", "onRetrieve", "onValidate"];

async function mergeExistingObjects(newManagedObject, resourceUrl, token) {
  const result = await restGet(resourceUrl, null, token);
  const existingObjects = result.data.objects;

  const existingObjectIndex = existingObjects.findIndex(
    (el) => el.name === newManagedObject.name,
  );
  if (existingObjectIndex >= 0) existingObjects.splice(existingObjectIndex, 1);
  existingObjects.push(newManagedObject);
  return existingObjects;
}

function mergeScriptFile(value, managedObjectPath) {
  if (value.type && value.type === "text/javascript" && value.file) {
    const scriptFilePath = path.join(managedObjectPath, value.file);
    if (fs.existsSync(scriptFilePath)) {
      value.source = fs.readFileSync(scriptFilePath, { encoding: "utf-8" });
      delete value.file;
    }
  }
}

async function updateManagedObjects({ configDir, tenantUrl, token, name, log }) {
  const emit = typeof log === "function" ? log : () => {};
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");

  if (name) emit(`Updating managed object ${name}\n`);
  else emit("Updating managed objects\n");

  const customRelationshipSchema = [];
  const dir = path.join(configDir, "managed-objects");
  if (!fs.existsSync(dir)) {
    emit("Warning: no managed objects defined\n");
    return;
  }

  const managedObjectPaths = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name));

  let managedObjects = [];
  for (const managedObjectPath of managedObjectPaths) {
    const managedObjectName = path.parse(managedObjectPath).base;
    if (name && name !== managedObjectName) continue;

    const jsonPath = path.join(managedObjectPath, `${managedObjectName}.json`);
    if (!fs.existsSync(jsonPath)) {
      emit(`Skipping ${managedObjectName}: missing ${managedObjectName}.json\n`);
      continue;
    }
    const managedObject = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    Object.entries(managedObject).forEach(([, value]) => {
      mergeScriptFile(value, managedObjectPath);
    });

    if (managedObject.actions) {
      Object.entries(managedObject.actions).forEach(([, value]) => {
        mergeScriptFile(value, managedObjectPath);
      });
    }

    Object.entries(managedObject.schema.properties).forEach(([, value]) => {
      SCRIPT_HOOKS.forEach((hook) => {
        if (Object.prototype.hasOwnProperty.call(value, hook) && value[hook].file) {
          const scriptFilePath = path.join(managedObjectPath, value[hook].file);
          if (fs.existsSync(scriptFilePath)) {
            value[hook].source = fs.readFileSync(scriptFilePath, { encoding: "utf-8" });
            delete value[hook].file;
          }
        }
      });
    });

    const schemaDir = path.join(managedObjectPath, "schema");
    if (fs.existsSync(schemaDir)) {
      const schemaFiles = fs
        .readdirSync(schemaDir)
        .filter((n) => path.extname(n) === ".json");
      for (const schemaFile of schemaFiles) {
        const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, schemaFile), "utf-8"));
        customRelationshipSchema.push({ object: managedObject.name, schema });
      }
    }

    managedObjects.push(managedObject);
  }

  const requestUrl = `${tenantUrl}/openidm/config/managed`;

  if (name) {
    if (managedObjects.length === 0) {
      throw new Error(`managed object "${name}" not found under ${dir}`);
    }
    managedObjects = await mergeExistingObjects(managedObjects[0], requestUrl, token);
  }

  emit(`PUT ${requestUrl} (${managedObjects.length} object${managedObjects.length === 1 ? "" : "s"})\n`);
  await restPut(requestUrl, { objects: managedObjects }, token);

  // Upstream does this "to avoid 404" — keep it.
  await restGet(requestUrl, null, token);

  for (const r of customRelationshipSchema) {
    const schemaUrl = `${tenantUrl}/openidm/schema/managed/${r.object}/properties/${r.schema._id}`;
    emit(`PUT ${schemaUrl}\n`);
    await restPut(schemaUrl, r.schema, token, "resource=2.0", false, "*");
  }
}

module.exports = { updateManagedObjects };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-managed-objects.js'); console.log(Object.keys(m))"
```

Expected: `[ 'updateManagedObjects' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-managed-objects.js
git commit -m "vendor: push/update-managed-objects with in-process adapter"
```

---

## Task 3: Add `pushManagedObjects` to the typed facade

**Files:**
- Modify: `src/vendor/fr-config-manager/index.ts`

- [ ] **Step 1: Append to the facade**

Add below the existing `pullManagedObjects` export:

```typescript
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
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "vendor: typed pushManagedObjects facade"
```

---

## Task 4: Use the vendored push + drop the target-seed hack

**Files:**
- Modify: `src/app/api/promote-items/route.ts`

The existing managed-objects push path is built around a local-disk envelope: seed temp with target's current state, overlay source's selection, spawn `fr-config-push` which re-reads the temp dir. The vendored `updateManagedObjects` does the merge against target at the REST level, so we no longer need to seed — we just copy the selected source dir(s) into temp and push with `name`.

- [ ] **Step 1: Replace the seed-from-target branch**

In the "Copy only selected items" section, find the current block:

```typescript
            } else if (sel.scope === "managed-objects") {
              // IDM's PUT /openidm/config/managed is a full-config replace — sending
              // just the selected object fails with "Cannot read property 'schema' from undefined"
              // because IDM tries to resolve cross-relationships against siblings that are
              // no longer in objects[]. Seed the temp dir with target's full set first,
              // then overlay the selected source items so unselected siblings stay unchanged.
              fs.mkdirSync(destDir, { recursive: true });
              const targetSrcDir = path.join(targetConfigDir, relPath);
              let seeded = 0;
              let skipped = 0;
              if (fs.existsSync(targetSrcDir)) {
                // Only copy subdirs that have the expected <name>/<name>.json —
                // fr-config-push fails with ENOENT on incomplete pull dirs otherwise.
                for (const entry of fs.readdirSync(targetSrcDir, { withFileTypes: true })) {
                  if (!entry.isDirectory()) continue;
                  const objJson = path.join(targetSrcDir, entry.name, `${entry.name}.json`);
                  if (!fs.existsSync(objJson)) {
                    skipped += 1;
                    emit({ type: "stdout", data: `  Skipping incomplete managed-object dir: ${entry.name} (missing ${entry.name}.json)\n`, ts: Date.now() });
                    continue;
                  }
                  copyDirSync(path.join(targetSrcDir, entry.name), path.join(destDir, entry.name));
                  seeded += 1;
                }
                emit({ type: "stdout", data: `  Seeded ${seeded} managed-object(s) from target${skipped ? ` (skipped ${skipped})` : ""}\n`, ts: Date.now() });
              }
              for (const itemId of sel.items) {
                const srcItem = path.join(srcDir, itemId);
                const destItem = path.join(destDir, itemId);
                if (fs.existsSync(srcItem) && fs.statSync(srcItem).isDirectory()) {
                  fs.rmSync(destItem, { recursive: true, force: true });
                  copyDirSync(srcItem, destItem);
                }
              }
              emit({ type: "stdout", data: `  Overlaid ${sel.items.length} managed-object(s) from source\n`, ts: Date.now() });
```

Replace with:

```typescript
            } else if (sel.scope === "managed-objects") {
              // Vendored push does the target-merge at the REST level (GET current
              // envelope → splice selected object → PUT), so we only need source.
              fs.mkdirSync(destDir, { recursive: true });
              for (const itemId of sel.items) {
                const srcItem = path.join(srcDir, itemId);
                const destItem = path.join(destDir, itemId);
                if (fs.existsSync(srcItem) && fs.statSync(srcItem).isDirectory()) {
                  copyDirSync(srcItem, destItem);
                }
              }
              emit({ type: "stdout", data: `  Copied ${sel.items.length} managed-object(s) from source\n`, ts: Date.now() });
```

- [ ] **Step 2: Replace the push spawn**

The push currently goes through `spawnFrConfig({ command: "fr-config-push", scopes: pushScopes, ... })` for all scopes at once. We need managed-objects to go through the vendored function instead, and the other scopes to keep spawning.

Near the existing push block (find `const { stream: pushStream } = spawnFrConfig(`), wrap it so:

Add imports if missing near the top of the file:
```typescript
import { pullManagedObjects, pushManagedObjects } from "@/vendor/fr-config-manager";
```
(`pullManagedObjects` is already imported from phase 1; just add `pushManagedObjects` to the same line.)

Then find the push execution block:

```typescript
        emit({ type: "scope-start", scope: "push", ts: Date.now() });
        emit({ type: "stdout", data: `Pushing ${pushScopes.length} scope(s): ${pushScopes.join(", ")}${directControl ? " (via /mutable endpoints)" : ""}...\n`, ts: Date.now() });

        const { stream: pushStream } = spawnFrConfig({
          command: "fr-config-push",
          environment: targetEnvironment,
          scopes: pushScopes as import("@/lib/fr-config-types").ConfigScope[],
          envOverrides: { CONFIG_DIR: tempConfigDir },
          ...(directControl ? { globalArgs: ["--direct-control"] } : {}),
        });
```

Before the spawn, branch out the managed-objects scope to the vendored path when it's item-filtered:

```typescript
        emit({ type: "scope-start", scope: "push", ts: Date.now() });

        // Run managed-objects push via vendored function when item-filtered —
        // its REST-level merge replaces the target-seed hack entirely.
        const managedSel = scopeSelections.find(
          (s) => s.scope === "managed-objects" && s.items && s.items.length > 0,
        );
        let managedPushFailed = false;
        if (managedSel && !directControl) {
          const targetEnvVars = parseEnvFile(getEnvFileContent(targetEnvironment));
          const tenantUrl = targetEnvVars.TENANT_BASE_URL ?? "";
          if (!tenantUrl) {
            emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment}.\n`, ts: Date.now() });
            managedPushFailed = true;
          } else {
            let token: string | null = null;
            try { token = await getAccessToken(targetEnvVars); }
            catch (err) {
              emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
              managedPushFailed = true;
            }
            if (token) {
              for (const itemId of managedSel.items!) {
                emit({ type: "stdout", data: `  Pushing managed-objects "${itemId}" (vendored)...\n`, ts: Date.now() });
                try {
                  await pushManagedObjects({
                    configDir: tempConfigDir,
                    tenantUrl,
                    token,
                    name: itemId,
                    log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
                  });
                } catch (err) {
                  managedPushFailed = true;
                  emit({ type: "stderr", data: `  Push failed for "${itemId}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                }
              }
            }
          }
        }

        // Remove managed-objects from the spawn set so fr-config-push doesn't
        // double-push what we just handled.
        const spawnPushScopes = managedSel && !directControl
          ? pushScopes.filter((s) => s !== "managed-objects")
          : pushScopes;

        let pushFailed = managedPushFailed;

        if (spawnPushScopes.length > 0) {
          emit({ type: "stdout", data: `Pushing ${spawnPushScopes.length} scope(s) via fr-config-push: ${spawnPushScopes.join(", ")}${directControl ? " (via /mutable endpoints)" : ""}...\n`, ts: Date.now() });
          const { stream: pushStream } = spawnFrConfig({
            command: "fr-config-push",
            environment: targetEnvironment,
            scopes: spawnPushScopes as import("@/lib/fr-config-types").ConfigScope[],
            envOverrides: { CONFIG_DIR: tempConfigDir },
            ...(directControl ? { globalArgs: ["--direct-control"] } : {}),
          });
```

**Important:** do not duplicate the subsequent stream-reading loop. Leave the rest of the push block (`const reader = pushStream.getReader(); ...`) **inside** the `if (spawnPushScopes.length > 0)` block. Close that block before the `emit({ type: "scope-end", scope: "push" ... })` line that already exists.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "route: use vendored push for managed-objects, drop target seed"
```

---

## Task 5: Manual verification

- [ ] Restart dev server.
- [ ] Restart the `alpha_kyid_audit_logger` task.
- [ ] Confirm the log shows `Pushing managed-objects "alpha_kyid_audit_logger" (vendored)...` and a single `PUT ${tenantUrl}/openidm/config/managed (N objects)` line.
- [ ] Confirm no line like `Seeded N managed-object(s) from target` (that hack is gone).
- [ ] Confirm the promote completes and verify shows zero differences (sort-keys + vendored pull together should make this the first clean run for this object).

---

## Acceptance checklist

- [ ] `git grep -n "Seeded .* managed-object"` → no matches.
- [ ] `git grep -n "fr-config-push.*managed-objects\|managed-objects.*fr-config-push"` → no matches outside docs/vendor directories.
- [ ] `git log --oneline` shows 4 new commits on top of phase 1.
- [ ] Typecheck clean.
- [ ] A vendored managed-object push lands on target without relying on the target-seed temp trick.

---

## Deferred (Phase 3+)

- Vendor push/pull for journeys, scripts, endpoints (whichever hits a bug next).
- Vendor frodo-lib.
- Consider replacing the copy-to-temp step entirely for managed-objects — the vendored function only needs the single object dir on disk, not a full `tempConfigDir` tree. A follow-up could let it read direct from `sourceConfigDir/managed-objects/<name>/`.
