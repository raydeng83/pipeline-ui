# Vendor fr-config-manager — Phase 5a (IDM flat-config scopes)

**Goal:** Replace the `fr-config-push` / `fr-config-pull` spawns for the five scopes that are literally "read one JSON file, PUT/GET one endpoint": `access-config`, `audit`, `idm-authentication`, `kba`, `ui-config`. A single pair of generic helpers handles all of them, driven by a scope→params table.

**Architecture:** Vendor two tiny generic functions (`pullIdmFlatConfig`, `pushIdmFlatConfig`) plus a scope-config table in the facade. The route gets two small branches (one in pull-target, one in push-routing) that look up the scope in the table and call the helper. Other scopes stay on spawn.

**Scope note:** `terms-and-conditions` is technically also an IDM flat config but has HTML-translation inlining logic — deferred to phase 6.

---

## File structure

```
src/vendor/fr-config-manager/
  pull/idm-flat-config.js          # generic GET /openidm/config/<name> → file
  push/idm-flat-config.js          # generic read file → PUT /openidm/config/<name>
  index.ts                         # add IDM_FLAT_SCOPES table + helpers

src/app/api/promote-items/route.ts  # branch idm-flat scopes out of spawn paths
```

---

## Task 1: Vendor `pull/idm-flat-config.js`

**Files:** Create `src/vendor/fr-config-manager/pull/idm-flat-config.js`.

Based on upstream `idmFlatConfig.js:exportConfig`.

- [ ] **Step 1: Write**

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/idmFlatConfig.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Takes exportDir / subdir / filename / endpointName / tenantUrl / token / log
 *     as an options bag. Throws on network error instead of swallowing with
 *     console.error + silent return.
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

async function pullIdmFlatConfig({ exportDir, subdir, filename, endpointName, tenantUrl, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!subdir) throw new Error("subdir is required");
  if (!filename) throw new Error("filename is required");
  if (!endpointName) throw new Error("endpointName is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const idmEndpoint = `${tenantUrl}/openidm/config/${endpointName}`;
  emit(`GET ${idmEndpoint}\n`);
  const response = await restGet(idmEndpoint, null, token);

  const targetDir = path.join(exportDir, subdir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, filename), JSON.stringify(response.data, null, 2));
}

module.exports = { pullIdmFlatConfig };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/idm-flat-config.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pullIdmFlatConfig' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/idm-flat-config.js
git commit -m "vendor: generic pull for IDM flat-config scopes"
```

---

## Task 2: Vendor `push/idm-flat-config.js`

**Files:** Create `src/vendor/fr-config-manager/push/idm-flat-config.js`.

Generalization of the five `update-*.js` push scripts; they're all "read file, PUT to endpoint."

- [ ] **Step 1: Write**

```javascript
/*
 * Generalizes @forgerock/fr-config-manager's five IDM flat-config push scripts
 * (update-audit, update-idm-access-config, update-idm-authentication-config,
 * update-kba-config, update-ui-config). Each is a one-file, one-endpoint PUT.
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter differences:
 *   - Parameterized by subdir/filename/endpointName instead of hard-coded per
 *     scope, so one function replaces five upstream files.
 *   - Throws on error instead of process.exit(1).
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushIdmFlatConfig({ configDir, subdir, filename, endpointName, tenantUrl, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!subdir) throw new Error("subdir is required");
  if (!filename) throw new Error("filename is required");
  if (!endpointName) throw new Error("endpointName is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, subdir);
  if (!fs.existsSync(dir)) {
    emit(`Warning: no ${subdir} config defined at ${dir}\n`);
    return;
  }
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    emit(`Warning: ${filePath} missing; skipping push\n`);
    return;
  }
  const body = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const requestUrl = `${tenantUrl}/openidm/config/${endpointName}`;
  emit(`PUT ${requestUrl}\n`);
  await restPut(requestUrl, body, token);
}

module.exports = { pushIdmFlatConfig };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/idm-flat-config.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pushIdmFlatConfig' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/idm-flat-config.js
git commit -m "vendor: generic push for IDM flat-config scopes"
```

---

## Task 3: Scope table + typed facade

**Files:** Modify `src/vendor/fr-config-manager/index.ts`.

Add a table mapping project-level scope names to the three params, plus `pullIdmFlatScope` / `pushIdmFlatScope` helpers + an `isIdmFlatScope` predicate.

- [ ] **Step 1: Append to the bottom of the file**

```typescript
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatPull = require("./pull/idm-flat-config.js") as {
  pullIdmFlatConfig: (opts: {
    exportDir: string;
    subdir: string;
    filename: string;
    endpointName: string;
    tenantUrl: string;
    token: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatPush = require("./push/idm-flat-config.js") as {
  pushIdmFlatConfig: (opts: {
    configDir: string;
    subdir: string;
    filename: string;
    endpointName: string;
    tenantUrl: string;
    token: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

/**
 * Project scope → IDM flat-config endpoint mapping. Matches upstream fr-config-
 * manager's per-scope push/pull scripts byte-for-byte (dir names, filenames,
 * and endpoint paths).
 */
export const IDM_FLAT_SCOPES = {
  "access-config":       { subdir: "access-config",            filename: "access.json",              endpointName: "access" },
  "audit":               { subdir: "audit",                    filename: "audit.json",               endpointName: "audit" },
  "idm-authentication":  { subdir: "idm-authentication-config", filename: "authentication.json",     endpointName: "authentication" },
  "kba":                 { subdir: "kba",                      filename: "selfservice.kba.json",     endpointName: "selfservice.kba" },
  "ui-config":           { subdir: "ui",                       filename: "ui-configuration.json",    endpointName: "ui/configuration" },
} as const;

export type IdmFlatScope = keyof typeof IDM_FLAT_SCOPES;

export function isIdmFlatScope(s: string): s is IdmFlatScope {
  return Object.prototype.hasOwnProperty.call(IDM_FLAT_SCOPES, s);
}

export async function pullIdmFlatScope(opts: {
  scope: IdmFlatScope;
  exportDir: string;
  tenantUrl: string;
  token: string;
  log?: (line: string) => void;
}): Promise<void> {
  const cfg = IDM_FLAT_SCOPES[opts.scope];
  await flatPull.pullIdmFlatConfig({ ...cfg, exportDir: opts.exportDir, tenantUrl: opts.tenantUrl, token: opts.token, log: opts.log });
}

export async function pushIdmFlatScope(opts: {
  scope: IdmFlatScope;
  configDir: string;
  tenantUrl: string;
  token: string;
  log?: (line: string) => void;
}): Promise<void> {
  const cfg = IDM_FLAT_SCOPES[opts.scope];
  await flatPush.pushIdmFlatConfig({ ...cfg, configDir: opts.configDir, tenantUrl: opts.tenantUrl, token: opts.token, log: opts.log });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "vendor: IDM_FLAT_SCOPES table + typed helpers"
```

---

## Task 4: Wire into `promote-items/route.ts`

**Files:** Modify `src/app/api/promote-items/route.ts`.

- [ ] **Step 1: Extend the vendor import**

```typescript
import { pullManagedObjects, pushManagedObjects, pullScripts, pushScripts, pullJourneys, pushJourneys, isIdmFlatScope, pullIdmFlatScope, pushIdmFlatScope } from "@/vendor/fr-config-manager";
```

- [ ] **Step 2: Handle idm-flat pulls in pull-target**

The existing "Entire scope: pull all" branch (the final `else` in the pull-target if/else-if chain) currently spawns `fr-config-pull <scope>`. Insert a pre-check for idm-flat scopes.

Find:
```typescript
            } else {
              // Entire scope: pull all
              emit({ type: "stdout", data: `  Pulling ${sel.scope} (all)...\n`, ts: Date.now() });
              const code = await new Promise<number | null>((resolve) => {
                const proc = spawnProc("fr-config-pull", [sel.scope], { env: pullEnv, shell: true, cwd: pullCwd });
                ...
              });
              if (code !== 0) emit({ type: "stderr", data: `  Pull failed for ${sel.scope} (exit ${code})\n`, ts: Date.now() });
            }
```

Replace with (preserve the entire spawn block as the `else` clause; add a new `if` above):
```typescript
            } else if (isIdmFlatScope(sel.scope)) {
              const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
              if (!tenantUrl) {
                emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping ${sel.scope} pull.\n`, ts: Date.now() });
              } else {
                let token: string | null = null;
                try { token = await getAccessToken(pullEnvVars); }
                catch (err) { emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() }); }
                if (token) {
                  const configDirRel = pullEnvVars.CONFIG_DIR ?? "./config";
                  const exportDir = path.resolve(pullCwd, configDirRel);
                  emit({ type: "stdout", data: `  Pulling ${sel.scope} (vendored)...\n`, ts: Date.now() });
                  try {
                    await pullIdmFlatScope({ scope: sel.scope, exportDir, tenantUrl, token, log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }) });
                  } catch (err) {
                    emit({ type: "stderr", data: `  Pull failed for ${sel.scope}: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                  }
                }
              }
            } else {
              // Entire scope: pull all (still spawned for scopes we haven't vendored yet)
              emit({ type: "stdout", data: `  Pulling ${sel.scope} (all)...\n`, ts: Date.now() });
              ...
```

Keep the existing spawn block unchanged in the final `else`.

- [ ] **Step 3: Handle idm-flat pushes**

Add an `idmFlatSels` array near the other `*Sel` finds:

After `const journeysSel = ...`:
```typescript
        const idmFlatSels = scopeSelections.filter((s) => isIdmFlatScope(s.scope));
```

After the `journeysPushFailed` block, add:
```typescript
        let idmFlatPushFailed = false;
        if (idmFlatSels.length > 0 && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            idmFlatPushFailed = true;
          } else {
            for (const sel of idmFlatSels) {
              // IDM flat-config scopes are whole-scope (no items), so a single
              // push per scope regardless of sel.items.
              emit({ type: "stdout", data: `  Pushing ${sel.scope} (vendored)...\n`, ts: Date.now() });
              try {
                await pushIdmFlatScope({
                  scope: sel.scope as Parameters<typeof pushIdmFlatScope>[0]["scope"],
                  configDir: tempConfigDir,
                  tenantUrl: tenantUrlForPush,
                  token,
                  log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
                });
              } catch (err) {
                idmFlatPushFailed = true;
                emit({ type: "stderr", data: `  Push failed for ${sel.scope}: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
              }
            }
          }
        }
```

Update the `spawnPushScopes` filter:
```typescript
        const spawnPushScopes = pushScopes.filter((s) => {
          if (directControl) return true;
          if (managedSel && s === "managed-objects") return false;
          if (scriptsSel && s === "scripts") return false;
          if (journeysSel && s === "journeys") return false;
          if (isIdmFlatScope(s)) return false;
          return true;
        });
```

Update `pushFailed`:
```typescript
        let pushFailed = managedPushFailed || scriptsPushFailed || journeysPushFailed || idmFlatPushFailed;
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "route: vendored IDM flat-config pull + push"
```

---

## Task 5: Manual verification

- [ ] Restart dev server.
- [ ] Create a promotion task with one of the 5 scopes (e.g. `ui-config`), promote it, check:
  - Log shows `Pushing ui-config (vendored)...` and `PUT <tenantUrl>/openidm/config/ui/configuration`.
  - Log shows `Pulling ui-config (vendored)...` and `GET <tenantUrl>/openidm/config/ui/configuration`.
  - No `fr-config-push ui-config` or `fr-config-pull ui-config` lines.
  - Target's `config/ui/ui-configuration.json` is updated on disk.

---

## Acceptance checklist

- [ ] `git grep -nE 'fr-config-(pull|push).*(audit|access|authentication|kba|ui-config)|fr-config-(pull|push).*idm-flat' src/` → vendor file headers only.
- [ ] `npx tsc --noEmit` clean.
- [ ] 4 implementation commits on top of phase 4.

---

## Deferred (later sub-phases)

- **5b:** AM realm-config scopes (`password-policy`, `org-privileges`) — uses a different generic endpoint (`/am/json/realms/root/realms/<realm>/realm-config/<name>`).
- **5c:** One-off scopes (`cors`, `csp`, `locales`, `telemetry`, `cookie-domains`) — each needs a dedicated vendor file.
- **Phase 6:** `terms-and-conditions` (HTML translation inlining), other complex scopes.
