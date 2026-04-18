# Vendor fr-config-manager — Phase 3 (scripts pull + push)

**Goal:** Vendor the scripts pull and push scripts, fixing latent upstream bugs (`return`-instead-of-`continue` in the pull filter, missing `await` in the push loop). After this phase, no spawn of `fr-config-pull scripts` or `fr-config-push scripts` remains for the item-filtered promote flow.

**Architecture:** Same vendor-and-wire pattern as phases 1-2. Extend `common/restClient.js` with any missing verbs, vendor `pull/scripts.js` and `push/update-scripts.js` with in-process adapters, add `pullScripts`/`pushScripts` to the typed facade, and branch the scripts scope to the vendored functions in `promote-items/route.ts`.

**Scope note:** Phase 3 touches **only the scripts scope**. The custom "remap script UUIDs inside journey node configs" code (`remap-script-refs` phase in the route) stays untouched — it's a journey concern and belongs to phase 4.

---

## File Structure

```
src/vendor/fr-config-manager/
  pull/scripts.js                   # new — adapted from upstream v1.5.12
  push/update-scripts.js            # new — adapted from upstream v1.5.12
  index.ts                          # add pullScripts + pushScripts exports

src/app/api/promote-items/route.ts  # swap spawn calls for vendored functions
```

`common/restClient.js` already has `restGet` + `restPut` — scripts only need those two, so no restClient changes.

---

## Task 1: Vendor `pull/scripts.js`

**Files:**
- Create: `src/vendor/fr-config-manager/pull/scripts.js`

**Upstream bugs being fixed:**
1. `if (name && name !== script.name) return;` (upstream line 70-71) — should be `continue;` (or in forEach, use `return;` inside the callback, which IS correct there; but the bug is that `forEach` with `return` skips the current iteration correctly, so actually this might not be buggy after all — let me re-examine). Looking again: upstream uses `forEach`, where `return` exits the callback (which is equivalent to `continue`). So scripts.js is **not** affected by the same bug as managed.js. Good.

   But there's still a latent issue: line 70-71 uses name-equality filter inside the `scripts.forEach`. That's fine. The pull does work. Vendoring still buys us in-tree control and removes the spawn.

2. `process.exit(1)` on invalid JSON for prefixes (line 112) and on per-realm errors (line 141) — hostile to in-process use. Throw instead.

- [ ] **Step 1: Write the file**

Content:

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/scripts.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Accepts exportDir / tenantUrl / realms / prefixes / name / token as args
 *     instead of reading process.env. prefixes is an array, not a JSON string.
 *   - Throws on error instead of calling process.exit(1).
 *   - Drops the AuthzTypes constants import (unused in this function).
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

const SCRIPT_SUB_DIR = "scripts";
const SCRIPTS_CONTENT_DIR = "scripts-content";
const SCRIPTS_CONFIG_DIR = "scripts-config";

function saveJsonToFile(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

/** Replace characters unsafe for filenames — matches upstream utils.safeFileName. */
function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
}

function saveScriptToFile(script, exportDir) {
  const scriptContentRelativePath = `${SCRIPTS_CONTENT_DIR}/${script.context}`;
  const scriptContentPath = path.join(exportDir, scriptContentRelativePath);
  if (!fs.existsSync(scriptContentPath)) {
    fs.mkdirSync(scriptContentPath, { recursive: true });
  }

  const scriptConfigPath = path.join(exportDir, SCRIPTS_CONFIG_DIR);
  if (!fs.existsSync(scriptConfigPath)) {
    fs.mkdirSync(scriptConfigPath, { recursive: true });
  }

  const scriptFilename = `${safeFileName(script.name)}.js`;
  const buff = Buffer.from(script.script, "base64");
  const source = buff.toString("utf-8");
  fs.writeFileSync(path.join(scriptContentPath, scriptFilename), source);
  script.script = { file: `${scriptContentRelativePath}/${scriptFilename}` };

  const scriptFileName = path.join(scriptConfigPath, `${script._id}.json`);
  saveJsonToFile(script, scriptFileName);
}

function processScripts(scripts, exportDir, name, log) {
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  let scriptNotFound = true;
  for (const script of scripts) {
    if (script.language !== "JAVASCRIPT") continue;
    if (name && name !== script.name) continue;
    scriptNotFound = false;
    saveScriptToFile(script, exportDir);
  }

  if (name && scriptNotFound && typeof log === "function") {
    log(`Script not found: ${name}\n`);
  }
}

async function exportScripts({ exportDir, tenantUrl, realms, prefixes, name, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const prefixList = Array.isArray(prefixes) ? prefixes : [""];
  const emit = typeof log === "function" ? log : () => {};

  // Build AM _queryFilter from prefixes
  let queryFilter;
  if (prefixList.length === 0 || (prefixList.length === 1 && prefixList[0] === "")) {
    queryFilter = "true";
  } else {
    queryFilter = prefixList
      .map((p) => `name+sw+"${p}"`)
      .join("+or+");
  }

  for (const realm of realmList) {
    const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts?_queryFilter=${queryFilter}`;
    const response = await restGet(amEndpoint, null, token);
    const scripts = response.data.result;
    const fileDir = path.join(exportDir, realm, SCRIPT_SUB_DIR);
    emit(`Pulling ${scripts.length} script(s) from ${realm}${name ? ` (filter: ${name})` : ""}\n`);
    processScripts(scripts, fileDir, name, emit);
  }
}

module.exports = { exportScripts };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/scripts.js'); console.log(Object.keys(m))"
```

Expected: `[ 'exportScripts' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/scripts.js
git commit -m "vendor: pull/scripts with in-process adapter"
```

---

## Task 2: Vendor `push/update-scripts.js`

**Files:**
- Create: `src/vendor/fr-config-manager/push/update-scripts.js`

**Upstream bugs / hostile code being fixed:**
1. `pushScript` called without `await` in the per-script for loop (upstream line 208) — means script pushes race and errors get swallowed. Fix: `await` each call.
2. Unused `uglify-js` import (line 8 upstream) — drop it.
3. `lodash.isEqual` + `UPDATE_CHANGED_ONLY` env-var short-circuit — drop entirely. We always push when asked.
4. `fileFilter` helper — drop, not needed.
5. `process.exit(1)` calls — throw instead.
6. Linting warnings about `let` — keep as an optional emit.
7. Reads REALMS, TENANT_BASE_URL, CONFIG_DIR from env — take as args instead.

- [ ] **Step 1: Write the file**

Content:

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-scripts.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Takes configDir / tenantUrl / realms / name / token / log as args instead
 *     of env + argv.
 *   - await'd the previously-unawaited pushScript call in the for loop so
 *     failures surface and ordering is deterministic.
 *   - Dropped uglify-js import (unused in upstream), lodash.isEqual, and the
 *     UPDATE_CHANGED_ONLY short-circuit.
 *   - Replaced process.exit(1) with throw.
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushScript(script, dir, tenantBaseUrl, realm, token, emit) {
  const sourcePath = path.join(dir, script.script.file);
  const originalScript = fs.readFileSync(sourcePath, { encoding: "utf-8" });

  // Inline-base64 the script body
  script.script = Buffer.from(originalScript).toString("base64");
  delete script.createdBy;
  delete script.creationDate;
  delete script.lastModifiedBy;
  delete script.lastModifiedDate;

  // Fix issue where null description becomes "null"
  if (script.description === null) script.description = "";

  const requestUrl = `${tenantBaseUrl}/am/json/realms/root/realms/${realm}/scripts/${script._id}`;
  emit(`PUT ${requestUrl}\n`);
  await restPut(requestUrl, script, token, "protocol=2.0,resource=1.0");
}

async function updateScripts({ configDir, tenantUrl, realms, name, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const emit = typeof log === "function" ? log : () => {};

  if (name && realmList.length !== 1) {
    throw new Error("for a named script, specify a single realm");
  }

  let scriptNotFound = !!name;

  for (const realm of realmList) {
    const baseDir = path.join(configDir, "realms", realm, "scripts");
    const scriptConfigDir = path.join(baseDir, "scripts-config");
    if (!fs.existsSync(scriptConfigDir)) {
      emit(`Warning: no script config for realm ${realm} at ${scriptConfigDir}\n`);
      continue;
    }

    const configFiles = fs
      .readdirSync(scriptConfigDir)
      .filter((n) => path.extname(n) === ".json");

    for (const filename of configFiles) {
      const script = JSON.parse(
        fs.readFileSync(path.join(scriptConfigDir, filename), "utf-8"),
      );
      if (!script.name || script.name.trim() === "") {
        throw new Error(`script id ${script._id} must have a non-blank name`);
      }
      if (name && script.name !== name) continue;
      scriptNotFound = false;
      await pushScript(script, baseDir, tenantUrl, realm, token, emit);
    }
  }

  if (name && scriptNotFound) {
    throw new Error(`script "${name}" not found under ${configDir}`);
  }
}

module.exports = { updateScripts };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-scripts.js'); console.log(Object.keys(m))"
```

Expected: `[ 'updateScripts' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-scripts.js
git commit -m "vendor: push/update-scripts with awaited loop, no env deps"
```

---

## Task 3: Extend the typed facade

**Files:**
- Modify: `src/vendor/fr-config-manager/index.ts`

- [ ] **Step 1: Append pullScripts + pushScripts exports**

After the existing `pushManagedObjects` export:

```typescript
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
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "vendor: typed pullScripts + pushScripts facades"
```

---

## Task 4: Wire into `promote-items/route.ts`

**Files:**
- Modify: `src/app/api/promote-items/route.ts`

Scripts need changes in two places:
- The **pull-target** branch (post-promote verify pull): currently spawns `fr-config-pull scripts --name <scriptName>` per item.
- The **push** branch: currently part of the generic `fr-config-push` spawn set.

- [ ] **Step 1: Add scripts to the import line**

Find:
```typescript
import { pullManagedObjects, pushManagedObjects } from "@/vendor/fr-config-manager";
```

Replace with:
```typescript
import { pullManagedObjects, pushManagedObjects, pullScripts, pushScripts } from "@/vendor/fr-config-manager";
```

- [ ] **Step 2: Replace the scripts pull-target branch**

In the pull-target block (search for `// Pull each script by name`), find:

```typescript
            if (sel.scope === "scripts" && sel.items && sel.items.length > 0) {
              // Pull each script by name
              for (const itemId of sel.items) {
                const scriptName = uuidToName.get(itemId) ?? uuidToName.get(itemId.replace(/\.json$/, "")) ?? itemId;
                emit({ type: "stdout", data: `  Pulling script "${scriptName}"...\n`, ts: Date.now() });
                const code = await new Promise<number | null>((resolve) => {
                  const proc = spawnProc("fr-config-pull", ["scripts", "--name", scriptName], { env: pullEnv, shell: true, cwd: pullCwd });
                  proc.stdout.on("data", (chunk: Buffer) => emit({ type: "stdout", data: chunk.toString(), ts: Date.now() }));
                  proc.stderr.on("data", (chunk: Buffer) => emit({ type: "stderr", data: chunk.toString(), ts: Date.now() }));
                  proc.on("close", (c) => resolve(c));
                  proc.on("error", (err) => { emit({ type: "stderr", data: err.message + "\n", ts: Date.now() }); resolve(1); });
                });
                if (code !== 0) emit({ type: "stderr", data: `  Pull failed for "${scriptName}" (exit ${code})\n`, ts: Date.now() });
              }
            } else if (sel.items && sel.items.length > 0) {
```

Replace with (keeping the `else if` below intact):

```typescript
            if (sel.scope === "scripts" && sel.items && sel.items.length > 0) {
              const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
              const realms = pullEnvVars.REALMS ? (JSON.parse(pullEnvVars.REALMS) as string[]) : ["alpha"];
              const prefixes = pullEnvVars.SCRIPT_PREFIXES ? (JSON.parse(pullEnvVars.SCRIPT_PREFIXES) as string[]) : [""];
              if (!tenantUrl) {
                emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping scripts pull.\n`, ts: Date.now() });
              } else {
                let token: string | null = null;
                try { token = await getAccessToken(pullEnvVars); }
                catch (err) {
                  emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                }
                if (token) {
                  const configDirRel = pullEnvVars.CONFIG_DIR ?? "./config";
                  const exportDir = path.resolve(pullCwd, configDirRel);
                  for (const itemId of sel.items) {
                    const scriptName = uuidToName.get(itemId) ?? uuidToName.get(itemId.replace(/\.json$/, "")) ?? itemId;
                    emit({ type: "stdout", data: `  Pulling script "${scriptName}" (vendored)...\n`, ts: Date.now() });
                    try {
                      await pullScripts({ exportDir, tenantUrl, token, realms, prefixes, name: scriptName, log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }) });
                    } catch (err) {
                      emit({ type: "stderr", data: `  Pull failed for "${scriptName}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                    }
                  }
                }
              }
            } else if (sel.items && sel.items.length > 0) {
```

- [ ] **Step 3: Extend the push routing to branch out scripts**

Phase 2 already carved out managed-objects from the spawn set. Extend the same pattern to scripts.

Find the existing managed-objects branch:

```typescript
        const managedSel = scopeSelections.find(
          (s) => s.scope === "managed-objects" && s.items && s.items.length > 0,
        );
        let managedPushFailed = false;
        if (managedSel && !directControl) {
          ...
        }

        // Remove managed-objects from the spawn set when we handled it above.
        const spawnPushScopes = managedSel && !directControl
          ? pushScopes.filter((s) => s !== "managed-objects")
          : pushScopes;
```

Replace with:

```typescript
        const managedSel = scopeSelections.find(
          (s) => s.scope === "managed-objects" && s.items && s.items.length > 0,
        );
        const scriptsSel = scopeSelections.find(
          (s) => s.scope === "scripts" && s.items && s.items.length > 0,
        );

        const targetEnvVarsForPush = parseEnvFile(getEnvFileContent(targetEnvironment));
        const tenantUrlForPush = targetEnvVarsForPush.TENANT_BASE_URL ?? "";
        let pushToken: string | null = null;

        async function ensurePushToken(): Promise<string | null> {
          if (pushToken) return pushToken;
          if (!tenantUrlForPush) {
            emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment}.\n`, ts: Date.now() });
            return null;
          }
          try {
            pushToken = await getAccessToken(targetEnvVarsForPush);
            return pushToken;
          } catch (err) {
            emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
            return null;
          }
        }

        let managedPushFailed = false;
        if (managedSel && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            managedPushFailed = true;
          } else {
            for (const itemId of managedSel.items!) {
              emit({ type: "stdout", data: `  Pushing managed-objects "${itemId}" (vendored)...\n`, ts: Date.now() });
              try {
                await pushManagedObjects({
                  configDir: tempConfigDir,
                  tenantUrl: tenantUrlForPush,
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

        let scriptsPushFailed = false;
        if (scriptsSel && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            scriptsPushFailed = true;
          } else {
            const realms = targetEnvVarsForPush.REALMS ? (JSON.parse(targetEnvVarsForPush.REALMS) as string[]) : ["alpha"];
            // Build a quick name lookup to translate uuid filenames -> script names for per-name push.
            const uuidToScriptName = new Map<string, string>();
            for (const dir of resolveScopeDirs(tempConfigDir, "scripts")) {
              const cfgDir = path.join(dir, "scripts-config");
              if (!fs.existsSync(cfgDir)) continue;
              for (const f of fs.readdirSync(cfgDir)) {
                if (!f.endsWith(".json")) continue;
                try {
                  const json = JSON.parse(fs.readFileSync(path.join(cfgDir, f), "utf-8"));
                  if (json.name) uuidToScriptName.set(path.basename(f, ".json"), json.name);
                } catch { /* skip */ }
              }
            }
            for (const itemId of scriptsSel.items!) {
              const baseId = itemId.replace(/\.json$/, "");
              const scriptName = uuidToScriptName.get(baseId) ?? baseId;
              emit({ type: "stdout", data: `  Pushing script "${scriptName}" (vendored)...\n`, ts: Date.now() });
              try {
                await pushScripts({
                  configDir: tempConfigDir,
                  tenantUrl: tenantUrlForPush,
                  token,
                  realms,
                  name: scriptName,
                  log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
                });
              } catch (err) {
                scriptsPushFailed = true;
                emit({ type: "stderr", data: `  Push failed for "${scriptName}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
              }
            }
          }
        }

        // Remove vendor-handled scopes from the spawn set.
        const spawnPushScopes = pushScopes.filter((s) => {
          if (directControl) return true;
          if (managedSel && s === "managed-objects") return false;
          if (scriptsSel && s === "scripts") return false;
          return true;
        });
```

- [ ] **Step 4: Update pushFailed aggregation**

Find:
```typescript
        let pushFailed = managedPushFailed;
```

Replace with:
```typescript
        let pushFailed = managedPushFailed || scriptsPushFailed;
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "route: vendored scripts pull + push; branch scripts from spawn set"
```

---

## Task 5: Manual verification

Prerequisite: restart the dev server so the route changes load.

- [ ] **Step 1: Promote a journey that references a fresh script**

Pick a journey from ide3 that has a ScriptedDecisionNode referencing a script that doesn't exist on sandbox1.

- [ ] **Step 2: Confirm vendored paths in the log**

Expected stdout fragments:
- `Pushing script "<name>" (vendored)...`
- `PUT <tenantUrl>/am/json/realms/root/realms/alpha/scripts/<uuid>`
- `Pulling script "<name>" (vendored)...`

No `fr-config-pull scripts` or `fr-config-push scripts` lines.

- [ ] **Step 3: Confirm target state**

```bash
ls environments/sandbox1/config/alpha/scripts/scripts-config/
```

Expected: the UUID for the promoted script is present as `<uuid>.json`.

- [ ] **Step 4: Verify shows no diff for the script**

Open the verify report in the summary. The script file should be unchanged.

---

## Acceptance checklist

- [ ] `git grep -n 'fr-config-push.*scripts\|fr-config-pull.*scripts' src/` → returns only vendored files (everywhere inside `src/vendor/`) and no route source.
- [ ] `npx tsc --noEmit` clean (modulo vitest noise).
- [ ] A journey-with-new-script promote runs end-to-end via vendored code.
- [ ] 4 implementation commits on top of phase 2 + a plan doc commit.

---

## Deferred (out of scope for phase 3)

- Custom-relationship script push (upstream has a `pushScriptById` path we didn't vendor; our route doesn't use it).
- `UPDATE_CHANGED_ONLY` short-circuit — intentionally dropped.
- Linting warnings (`let` detection) — intentionally dropped.
- The `remap-script-refs` phase in the route (rewriting journey node JSONs) — belongs to phase 4 (journeys).
