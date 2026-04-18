# Vendor fr-config-manager — Phase 4 (journeys pull + push)

**Goal:** Vendor journey pull (`pull/journeys.js`) and push (`push/update-auth-trees.js`) so the journeys scope no longer spawns `fr-config-pull` / `fr-config-push`. Fix upstream bugs uncovered during vendoring (unawaited async calls, module-level cache state, `process.exit` on missing journeys).

**Architecture:** Same pattern as phases 1–3. Vendor the two scripts, inline `journeyNodeNeedsScript` (single small helper), add `exportScriptById` to vendored `pull/scripts.js` and `pushScriptById` to vendored `push/update-scripts.js` (the journey code references them for script deps). Add `pullJourneys`/`pushJourneys` to the facade. Branch journeys out of the spawn set in `promote-items/route.ts`.

**Scope note:** The project's own `resolveJourneyDeps` helper (in `src/lib/resolve-journey-deps.ts`) and the `remap-script-refs` step in `promote-items/route.ts` stay as-is — they operate on local temp-dir state before push and have no CLI dependency.

---

## File Structure

```
src/vendor/fr-config-manager/
  pull/journeys.js                 # new
  pull/scripts.js                  # add exportScriptById helper
  push/update-auth-trees.js        # new
  push/update-scripts.js           # add pushScriptById helper
  index.ts                         # add pullJourneys + pushJourneys

src/app/api/promote-items/route.ts  # branch journeys from spawn paths
```

---

## Task 1: Add `exportScriptById` to vendored `pull/scripts.js`

**Files:**
- Modify: `src/vendor/fr-config-manager/pull/scripts.js`

The journey pull script references it for ScriptedDecisionNode deps. Trivial: fetch one script by AM endpoint + save.

- [ ] **Step 1: Append after the `exportScripts` function**

```javascript
async function exportScriptById({ exportDir, tenantUrl, realm, id, token }) {
  const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts/${id}`;
  const response = await restGet(amEndpoint, null, token);
  const fileDir = path.join(exportDir, realm, SCRIPT_SUB_DIR);
  saveScriptToFile(response.data, fileDir);
}

module.exports = { exportScripts, exportScriptById };
```

Remove the old `module.exports = { exportScripts };` line.

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/scripts.js'); console.log(Object.keys(m))"
```

Expected: `[ 'exportScripts', 'exportScriptById' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/scripts.js
git commit -m "vendor: add exportScriptById to pull/scripts for journey deps"
```

---

## Task 2: Add `pushScriptById` to vendored `push/update-scripts.js`

**Files:**
- Modify: `src/vendor/fr-config-manager/push/update-scripts.js`

Same shape as upstream `pushScriptById`: reads `{configDir}/realms/{realm}/scripts/scripts-config/{id}.json` and delegates to `pushScript`.

- [ ] **Step 1: Append after the `updateScripts` function**

```javascript
async function pushScriptById({ configDir, scriptId, tenantUrl, realm, token, log }) {
  const emit = typeof log === "function" ? log : () => {};
  const baseDir = path.join(configDir, "realms", realm, "scripts");
  const configFile = path.join(baseDir, "scripts-config", `${scriptId}.json`);
  if (!fs.existsSync(configFile)) {
    throw new Error(`script ${scriptId} not found at ${configFile}`);
  }
  const script = JSON.parse(fs.readFileSync(configFile, "utf-8"));
  await pushScript(script, baseDir, tenantUrl, realm, token, emit);
}

module.exports = { updateScripts, pushScriptById };
```

Remove the old `module.exports = { updateScripts };` line.

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-scripts.js'); console.log(Object.keys(m))"
```

Expected: `[ 'updateScripts', 'pushScriptById' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-scripts.js
git commit -m "vendor: add pushScriptById to push/update-scripts for journey deps"
```

---

## Task 3: Vendor `pull/journeys.js`

**Files:**
- Create: `src/vendor/fr-config-manager/pull/journeys.js`

**Upstream bugs being fixed:**
1. `exportScriptById(...)` called without `await` (upstream line 120, 130) — script pull races with node JSON write.
2. Recursive `processJourneys(...)` called without `await` (upstream line 136) — inner-journey pull races with outer.
3. Module-level `journeyCache` array (upstream line 13) — global state across calls. Replace with local per-call state.
4. `console.error(err)` swallowing — surface via log callback / throw.

- [ ] **Step 1: Write the file**

Content:

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/journeys.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Accepts exportDir / tenantUrl / realms / name / pullDependencies / clean /
 *     token / log as arguments instead of reading process.env.
 *   - Awaits previously-unawaited async calls so inner-journey pull and script
 *     dep pull complete deterministically.
 *   - journeyCache is scoped per-call instead of module-level.
 *   - saveJsonToFile inlined (no third-arg "pretty" flag — always pretty).
 *   - safeFileName + journeyNodeNeedsScript inlined from upstream utils.js.
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");
const { exportScriptById } = require("./scripts.js");

const JOURNEY_SUB_DIR = "journeys";
const NODES_SUB_DIR = "nodes";

function saveJsonToFile(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
}

function journeyNodeNeedsScript(node) {
  return (
    Object.prototype.hasOwnProperty.call(node, "script") &&
    (!Object.prototype.hasOwnProperty.call(node, "useScript") || node.useScript)
  );
}

function fileNameFromNode(displayName, id) {
  return safeFileName(`${displayName} - ${id}`);
}

async function cacheNodesByType(nodeCache, nodeType, tenantUrl, realm, token) {
  if (nodeCache[nodeType]) return nodeCache;
  const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/nodes/${nodeType}`;
  const response = await restGet(amEndpoint, { _queryFilter: "true" }, token);
  nodeCache[nodeType] = response.data.result;
  return nodeCache;
}

async function processJourneys(ctx) {
  const { journeys, realm, name, pullDependencies, tenantUrl, token, exportDir, clean, journeyCache, emit } = ctx;
  const fileDir = path.join(exportDir, realm, JOURNEY_SUB_DIR);
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

  let nodeCache = {};
  for (const journey of journeys) {
    if (name && journey._id !== name) continue;
    if (journeyCache.has(journey._id)) continue;
    journeyCache.add(journey._id);

    const journeyDir = path.join(fileDir, safeFileName(journey._id));
    const nodeDir = path.join(journeyDir, NODES_SUB_DIR);
    if (clean) fs.rmSync(nodeDir, { recursive: true, force: true });
    if (!fs.existsSync(nodeDir)) fs.mkdirSync(nodeDir, { recursive: true });

    for (const [nodeId, nodeInfo] of Object.entries(journey.nodes)) {
      const nodeType = nodeInfo.nodeType;
      nodeCache = await cacheNodesByType(nodeCache, nodeType, tenantUrl, realm, token);
      const node = nodeCache[nodeType].find(({ _id }) => _id === nodeId);
      if (!node) {
        emit(`warning: node ${nodeId} (${nodeType}) not found in realm ${realm}\n`);
        continue;
      }

      const nodeFileNameRoot = path.join(nodeDir, fileNameFromNode(nodeInfo.displayName, nodeId));

      if (node._type._id === "PageNode") {
        if (!fs.existsSync(nodeFileNameRoot)) fs.mkdirSync(nodeFileNameRoot, { recursive: true });
        for (const subNode of node.nodes) {
          nodeCache = await cacheNodesByType(nodeCache, subNode.nodeType, tenantUrl, realm, token);
          const subNodeSpec = nodeCache[subNode.nodeType].find(({ _id }) => _id === subNode._id);
          if (!subNodeSpec) {
            emit(`warning: subnode ${subNode._id} not found for PageNode ${nodeId}\n`);
            continue;
          }
          const subNodeFilename = path.join(nodeFileNameRoot, `${fileNameFromNode(subNode.displayName, subNodeSpec._id)}.json`);
          saveJsonToFile(subNodeSpec, subNodeFilename);
          if (pullDependencies && journeyNodeNeedsScript(subNodeSpec)) {
            await exportScriptById({ exportDir, tenantUrl, realm, id: subNodeSpec.script, token });
          }
        }
      } else if (pullDependencies && journeyNodeNeedsScript(node)) {
        await exportScriptById({ exportDir, tenantUrl, realm, id: node.script, token });
      } else if (!!name && pullDependencies && node._type._id === "InnerTreeEvaluatorNode") {
        await processJourneys({ ...ctx, name: node.tree });
      }

      saveJsonToFile(node, `${nodeFileNameRoot}.json`);
    }

    saveJsonToFile(journey, path.join(journeyDir, `${journey._id}.json`));
  }
}

async function exportJourneys({ exportDir, tenantUrl, realms, name, pullDependencies, clean, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const emit = typeof log === "function" ? log : () => {};
  const journeyCache = new Set();

  for (const realm of realmList) {
    const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees/trees?_queryFilter=true`;
    const response = await restGet(amEndpoint, null, token);
    const journeys = response.data.result;
    emit(`Pulling ${journeys.length} journey(s) from ${realm}${name ? ` (filter: ${name})` : ""}\n`);
    await processJourneys({ journeys, realm, name, pullDependencies: !!pullDependencies, tenantUrl, token, exportDir, clean: !!clean, journeyCache, emit });
  }
}

module.exports = { exportJourneys };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/journeys.js'); console.log(Object.keys(m))"
```

Expected: `[ 'exportJourneys' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/journeys.js
git commit -m "vendor: pull/journeys with awaited async, per-call cache"
```

---

## Task 4: Vendor `push/update-auth-trees.js`

**Files:**
- Create: `src/vendor/fr-config-manager/push/update-auth-trees.js`

**Upstream bugs / hostile code:**
1. `process.exit(1)` on "No journeys found" and errors — throw instead.
2. Reads `REALMS`/`TENANT_BASE_URL`/`CONFIG_DIR` from env — take as args.
3. `glob` dependency — replace with `fs.readdirSync` recursion.

**Upstream structure preserved:** PageNode sub-nodes pushed first (`*/*.json`), then top-level nodes (`*.json`), then journey itself. InnerTreeEvaluatorNode triggers recursive journey push via `journeysProcessed` dedupe set.

- [ ] **Step 1: Write the file**

Content:

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-auth-trees.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Takes configDir / tenantUrl / realms / name / pushInnerJourneys /
 *     pushScripts / token / log as args instead of env + argv.
 *   - Throws on "No journeys found" and other errors instead of process.exit(1).
 *   - Replaced the `glob` dependency with fs.readdir walks.
 *   - Inlined journeyNodeNeedsScript from upstream utils.js.
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");
const { pushScriptById } = require("./update-scripts.js");

const INNER_TREE_ID = "InnerTreeEvaluatorNode";

function journeyNodeNeedsScript(node) {
  return (
    Object.prototype.hasOwnProperty.call(node, "script") &&
    (!Object.prototype.hasOwnProperty.call(node, "useScript") || node.useScript)
  );
}

// Replicates glob "*.json" (top-level JSON files only) in a directory.
function topLevelJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name);
}

// Replicates glob "*/*.json" (one dir deep, JSON files in each subdir).
function nestedJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const sub of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!sub.isDirectory()) continue;
    const subPath = path.join(dir, sub.name);
    for (const f of fs.readdirSync(subPath, { withFileTypes: true })) {
      if (f.isFile() && f.name.endsWith(".json")) {
        out.push(path.join(sub.name, f.name));
      }
    }
  }
  return out;
}

async function pushNode(baseUrl, node, token) {
  const nodeRequestUrl = `${baseUrl}/nodes/${node._type._id}/${node._id}`;
  delete node._rev;
  await restPut(nodeRequestUrl, node, token, "protocol=2.1,resource=1.0");
}

async function pushJourney(journey, baseUrl, token) {
  delete journey._rev;
  const requestUrl = `${baseUrl}/trees/${journey._id}`;
  await restPut(requestUrl, journey, token, "protocol=2.1,resource=1.0");
}

async function handleNodes(ctx, nodeDir, fileList) {
  const { baseUrl, configDir, tenantUrl, realm, pushInnerJourneys, pushScripts, journeysProcessed, token, emit } = ctx;
  for (const nodeFile of fileList) {
    const node = JSON.parse(fs.readFileSync(path.join(nodeDir, nodeFile), "utf-8"));
    if (node._type._id === INNER_TREE_ID && pushInnerJourneys) {
      const innerName = node.tree;
      await handleJourney({ ...ctx }, `${innerName}/${innerName}.json`);
    } else if (pushScripts && journeyNodeNeedsScript(node)) {
      await pushScriptById({ configDir, scriptId: node.script, tenantUrl, realm, token, log: emit });
    }
    await pushNode(baseUrl, node, token);
  }
}

async function handleJourney(ctx, journeyFile) {
  const { configDir, realm, journeysProcessed, tenantUrl, emit } = ctx;
  const dir = path.join(configDir, "realms", realm, "journeys");
  const journeyFullPath = path.join(dir, journeyFile);
  if (journeysProcessed.has(journeyFullPath)) return;
  journeysProcessed.add(journeyFullPath);

  if (!fs.existsSync(journeyFullPath)) {
    emit(`warning: journey file missing: ${journeyFullPath}\n`);
    return;
  }

  const journey = JSON.parse(fs.readFileSync(journeyFullPath, "utf-8"));
  const baseUrl = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/authentication/authenticationtrees`;
  const journeyDir = path.dirname(journeyFile);
  const nodeDir = path.join(dir, journeyDir, "nodes");

  emit(`Pushing journey ${realm}/${journey._id}\n`);

  const childCtx = { ...ctx, baseUrl };
  // Paged nodes (PageNode subnodes in */*.json) first
  await handleNodes(childCtx, nodeDir, nestedJsonFiles(nodeDir));
  // Then top-level nodes (*.json)
  await handleNodes(childCtx, nodeDir, topLevelJsonFiles(nodeDir));
  // Finally push the journey tree
  await pushJourney(journey, baseUrl, token(ctx));
}

function token(ctx) { return ctx.token; }

async function updateAuthTrees({ configDir, tenantUrl, realms, name, pushInnerJourneys, pushScripts, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const emit = typeof log === "function" ? log : () => {};

  if (name && realmList.length !== 1) {
    throw new Error("for a named journey, specify a single realm");
  }

  const pushInner = name ? !!pushInnerJourneys : true;
  const pushScr = !!pushScripts;

  emit(`${name ? `Updating journey "${name}"` : "Updating journeys"}${pushInner ? " including inner journeys" : ""}${pushScr ? " and scripts" : ""}\n`);

  const journeysProcessed = new Set();

  for (const realm of realmList) {
    const journeyBaseDir = path.join(configDir, "realms", realm, "journeys");
    if (!fs.existsSync(journeyBaseDir)) {
      emit(`Warning: no journey config for realm ${realm} at ${journeyBaseDir}\n`);
      continue;
    }

    const journeyFiles = [];
    if (name) {
      const named = path.join(journeyBaseDir, name);
      if (fs.existsSync(named) && fs.statSync(named).isDirectory()) {
        for (const f of fs.readdirSync(named)) {
          if (f.endsWith(".json")) journeyFiles.push(path.join(name, f));
        }
      }
    } else {
      // all journey/*.json
      for (const sub of fs.readdirSync(journeyBaseDir, { withFileTypes: true })) {
        if (!sub.isDirectory()) continue;
        const subPath = path.join(journeyBaseDir, sub.name);
        for (const f of fs.readdirSync(subPath)) {
          if (f.endsWith(".json")) journeyFiles.push(path.join(sub.name, f));
        }
      }
    }

    if (journeyFiles.length === 0) {
      throw new Error(`No journeys found under ${journeyBaseDir}${name ? ` for name "${name}"` : ""}`);
    }

    const ctx = {
      configDir,
      tenantUrl,
      realm,
      pushInnerJourneys: pushInner,
      pushScripts: pushScr,
      journeysProcessed,
      token,
      emit,
    };
    for (const journeyFile of journeyFiles) {
      await handleJourney(ctx, journeyFile);
    }
  }
}

module.exports = { updateAuthTrees };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-auth-trees.js'); console.log(Object.keys(m))"
```

Expected: `[ 'updateAuthTrees' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-auth-trees.js
git commit -m "vendor: push/update-auth-trees without glob dep"
```

---

## Task 5: Extend typed facade

**Files:**
- Modify: `src/vendor/fr-config-manager/index.ts`

- [ ] **Step 1: Append after the existing exports**

```typescript
// eslint-disable-next-line @typescript-eslint/no-require-imports
const journeysPull = require("./pull/journeys.js") as {
  exportJourneys: (opts: {
    exportDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    name?: string;
    pullDependencies?: boolean;
    clean?: boolean;
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pullJourneys(opts: {
  exportDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  name?: string;
  pullDependencies?: boolean;
  clean?: boolean;
  log?: (line: string) => void;
}): Promise<void> {
  await journeysPull.exportJourneys(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const journeysPush = require("./push/update-auth-trees.js") as {
  updateAuthTrees: (opts: {
    configDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    name?: string;
    pushInnerJourneys?: boolean;
    pushScripts?: boolean;
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pushJourneys(opts: {
  configDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  name?: string;
  pushInnerJourneys?: boolean;
  pushScripts?: boolean;
  log?: (line: string) => void;
}): Promise<void> {
  await journeysPush.updateAuthTrees(opts);
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "vendor: typed pullJourneys + pushJourneys facades"
```

---

## Task 6: Wire into route

**Files:**
- Modify: `src/app/api/promote-items/route.ts`

- [ ] **Step 1: Extend the import line**

```typescript
import { pullManagedObjects, pushManagedObjects, pullScripts, pushScripts, pullJourneys, pushJourneys } from "@/vendor/fr-config-manager";
```

- [ ] **Step 2: Replace the journeys pull-target branch**

The existing generic branch handles journeys via `fr-config-pull journeys --name <itemId>`. Add an explicit journeys branch above the scripts branch in the pull-target block:

Find the spot just after the `if (sel.scope === "scripts" && sel.items && sel.items.length > 0) {` block opens. Before that `if`, add:

```typescript
            if (sel.scope === "journeys" && sel.items && sel.items.length > 0) {
              const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
              const realms = pullEnvVars.REALMS ? (JSON.parse(pullEnvVars.REALMS) as string[]) : ["alpha"];
              if (!tenantUrl) {
                emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping journeys pull.\n`, ts: Date.now() });
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
                    emit({ type: "stdout", data: `  Pulling journey "${itemId}" (vendored)...\n`, ts: Date.now() });
                    try {
                      await pullJourneys({ exportDir, tenantUrl, token, realms, name: itemId, pullDependencies: includeDeps === true, log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }) });
                    } catch (err) {
                      emit({ type: "stderr", data: `  Pull failed for journey "${itemId}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                    }
                  }
                }
              }
            } else if (sel.scope === "scripts" && sel.items && sel.items.length > 0) {
```

Note: the chained `if/else if` means we change the **next** line from `if (sel.scope === "scripts"...` to `} else if (sel.scope === "scripts"...` to continue the chain. Before committing, verify the chain structure is preserved (run typecheck).

- [ ] **Step 3: Branch journeys in the push routing**

Extend the "route to vendored push" block to add a `journeysSel` alongside `managedSel` and `scriptsSel`:

Right after `const scriptsSel = ...`:
```typescript
        const journeysSel = scopeSelections.find(
          (s) => s.scope === "journeys" && s.items && s.items.length > 0,
        );
```

After the `scriptsPushFailed` block, add:
```typescript
        let journeysPushFailed = false;
        if (journeysSel && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            journeysPushFailed = true;
          } else {
            const realms = targetEnvVarsForPush.REALMS ? (JSON.parse(targetEnvVarsForPush.REALMS) as string[]) : ["alpha"];
            for (const itemId of journeysSel.items!) {
              emit({ type: "stdout", data: `  Pushing journey "${itemId}" (vendored)...\n`, ts: Date.now() });
              try {
                await pushJourneys({
                  configDir: tempConfigDir,
                  tenantUrl: tenantUrlForPush,
                  token,
                  realms,
                  name: itemId,
                  pushInnerJourneys: includeDeps === true,
                  pushScripts: false, // scripts are handled by the dedicated scripts branch
                  log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
                });
              } catch (err) {
                journeysPushFailed = true;
                emit({ type: "stderr", data: `  Push failed for journey "${itemId}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
              }
            }
          }
        }
```

Update `spawnPushScopes` filter:
```typescript
        const spawnPushScopes = pushScopes.filter((s) => {
          if (directControl) return true;
          if (managedSel && s === "managed-objects") return false;
          if (scriptsSel && s === "scripts") return false;
          if (journeysSel && s === "journeys") return false;
          return true;
        });
```

Update `pushFailed` aggregation:
```typescript
        let pushFailed = managedPushFailed || scriptsPushFailed || journeysPushFailed;
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "route: vendored journeys pull + push"
```

---

## Task 7: Manual verification

- [ ] Restart dev server.
- [ ] Promote a journey with fresh sub-journeys + script references.
- [ ] Log shows `Pushing journey "<id>" (vendored)...` and `Pulling journey "<id>" (vendored)...`, no `fr-config-pull journeys` or `fr-config-push journeys` lines.
- [ ] After promote, target's journey dir contains the pulled tree + nodes.
- [ ] Verify shows zero diffs (or only IDM-normalization diffs that sort-keys already handles).

---

## Acceptance checklist

- [ ] `git grep -nE 'fr-config-(pull|push).*journeys|journeys.*fr-config-(pull|push)' src/` → only doc comments and vendor file headers.
- [ ] 6 implementation commits on top of phase 3.
- [ ] `npx tsc --noEmit` clean (modulo vitest noise).

---

## Deferred

- Move the `remap-script-refs` step (rewrites script UUIDs inside journey node JSONs before push) from the route into vendored code — significant refactor, separate phase.
- Vendor `exportScripts` multi-realm concurrency — currently sequential; performance tuning for later.
- `clean` arg for journey pull — wired through the facade but not used yet by the route; expose it to the UI when the "force refresh target" feature comes up.
