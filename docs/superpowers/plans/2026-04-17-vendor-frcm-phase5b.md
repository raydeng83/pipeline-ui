# Vendor fr-config-manager — Phase 5b (password-policy, org-privileges)

**Goal:** Replace the `fr-config-push` / `fr-config-pull` spawns for `password-policy` and `org-privileges`. Both scopes use IDM `/openidm/config/*` endpoints but with different on-disk layouts and filename conventions. Vendor each scope's pull + push with in-process adapters.

**Architecture:** Four small vendored files (two pull, two push) plus facade entries. Route gets two new branches in the pull-target path (password-policy needs realm iteration) and two new `*Sel` finds in the push-routing block. Same spawn-exclusion pattern as phase 5a.

**Upstream bug fixed:** `fieldPolicy.js` writes pulled password-policy to `{exportDir}/<realm>/password-policy/...` but `update-password-policy.js` expects `{configDir}/realms/<realm>/password-policy/...`. The two paths don't match, so a full pull-then-push round trip breaks without manual reorganization. Vendored pull writes to the push path — document as LOCAL PATCH.

---

## File structure

```
src/vendor/fr-config-manager/
  pull/password-policy.js           # new
  pull/org-privileges.js            # new
  push/update-password-policy.js    # new
  push/update-org-privileges.js     # new
  index.ts                          # add 4 facade helpers

src/app/api/promote-items/route.ts  # branch the 2 scopes out of spawn paths
```

---

## Task 1: Vendor `pull/password-policy.js`

**Files:** Create `src/vendor/fr-config-manager/pull/password-policy.js`.

**Upstream bug fixed:** path mismatch. Pull now writes to the path the push expects.

- [ ] **Step 1: Write**

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/fieldPolicy.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - LOCAL PATCH: writes to `{exportDir}/realms/<realm>/password-policy/` to
 *     match the push path. Upstream writes to `{exportDir}/<realm>/password-policy/`
 *     which doesn't round-trip with its own push script.
 *   - Takes options bag; throws on error.
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

async function pullPasswordPolicy({ exportDir, tenantUrl, realms, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const emit = typeof log === "function" ? log : () => {};

  for (const realm of realmList) {
    const objectName = `${realm}_user`;
    const idmEndpoint = `${tenantUrl}/openidm/config/fieldPolicy/${objectName}`;
    emit(`GET ${idmEndpoint}\n`);
    const response = await restGet(idmEndpoint, null, token);

    // LOCAL PATCH: write under realms/<realm>/ so the push side finds it.
    const targetDir = path.join(exportDir, "realms", realm, "password-policy");
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, `${objectName}-password-policy.json`),
      JSON.stringify(response.data, null, 2),
    );
  }
}

module.exports = { pullPasswordPolicy };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/password-policy.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pullPasswordPolicy' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/password-policy.js
git commit -m "vendor: pull password-policy with path fix for push round-trip"
```

---

## Task 2: Vendor `pull/org-privileges.js`

**Files:** Create `src/vendor/fr-config-manager/pull/org-privileges.js`.

- [ ] **Step 1: Write**

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/orgPrivileges.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - ORG_PRIVILEGES_CONFIG allowlist inlined (single constants file not worth
 *     vendoring for three strings).
 *   - Takes options bag; throws on error (not process.exit(1)).
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

const ORG_PRIVILEGES_CONFIG = [
  "alphaOrgPrivileges",
  "bravoOrgPrivileges",
  "privilegeAssignments",
];

async function pullOrgPrivileges({ exportDir, tenantUrl, token, name, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const filePath = path.join(exportDir, "org-privileges");
  if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });

  for (const configEntry of ORG_PRIVILEGES_CONFIG) {
    if (name && name !== configEntry) continue;
    const idmEndpoint = `${tenantUrl}/openidm/config/${configEntry}`;
    emit(`GET ${idmEndpoint}\n`);
    const response = await restGet(idmEndpoint, null, token);
    fs.writeFileSync(
      path.join(filePath, `${configEntry}.json`),
      JSON.stringify(response.data, null, 2),
    );
  }
}

module.exports = { pullOrgPrivileges, ORG_PRIVILEGES_CONFIG };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/org-privileges.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pullOrgPrivileges', 'ORG_PRIVILEGES_CONFIG' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/pull/org-privileges.js
git commit -m "vendor: pull org-privileges"
```

---

## Task 3: Vendor `push/update-password-policy.js`

**Files:** Create `src/vendor/fr-config-manager/push/update-password-policy.js`.

- [ ] **Step 1: Write**

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-password-policy.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Takes options bag; throws on error (not process.exit(1)).
 *   - Early-return on missing dir continues looping; upstream returns the whole
 *     function after the first missing realm, skipping later realms silently.
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushPasswordPolicy({ configDir, tenantUrl, realms, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const realmList = Array.isArray(realms) && realms.length > 0 ? realms : ["alpha"];
  const emit = typeof log === "function" ? log : () => {};

  for (const realm of realmList) {
    const dir = path.join(configDir, "realms", realm, "password-policy");
    if (!fs.existsSync(dir)) {
      emit(`Warning: no password-policy config for realm ${realm} at ${dir}\n`);
      continue;
    }
    const filePath = path.join(dir, `${realm}_user-password-policy.json`);
    if (!fs.existsSync(filePath)) {
      emit(`Warning: ${filePath} missing; skipping realm ${realm}\n`);
      continue;
    }
    const body = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const requestUrl = `${tenantUrl}/openidm/config/${body._id}`;
    emit(`PUT ${requestUrl}\n`);
    await restPut(requestUrl, body, token);
  }
}

module.exports = { pushPasswordPolicy };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-password-policy.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pushPasswordPolicy' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-password-policy.js
git commit -m "vendor: push password-policy with continue-on-missing-realm fix"
```

---

## Task 4: Vendor `push/update-org-privileges.js`

**Files:** Create `src/vendor/fr-config-manager/push/update-org-privileges.js`.

- [ ] **Step 1: Write**

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-org-privileges.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 *
 * Adapter changes vs upstream:
 *   - Takes options bag; throws on error (not process.exit(1)).
 *   - ORG_PRIVILEGES_CONFIG imported from vendored pull to share one source of truth.
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");
const { ORG_PRIVILEGES_CONFIG } = require("../pull/org-privileges.js");

async function pushOrgPrivileges({ configDir, tenantUrl, token, name, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  if (name && !ORG_PRIVILEGES_CONFIG.includes(name)) {
    throw new Error(`unrecognised org config: ${name}`);
  }

  const dir = path.join(configDir, "org-privileges");
  if (!fs.existsSync(dir)) {
    emit(`Warning: no org-privileges config defined at ${dir}\n`);
    return;
  }

  const files = fs.readdirSync(dir).filter((n) => path.extname(n) === ".json");
  const orgConfigs = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")));

  let configFound = !name;
  for (const orgConfig of orgConfigs) {
    const configName = orgConfig._id;
    if (name && name !== configName) continue;
    if (!ORG_PRIVILEGES_CONFIG.includes(configName)) {
      emit(`Warning: ignoring unrecognised org config ${configName}\n`);
      continue;
    }
    configFound = true;
    const requestUrl = `${tenantUrl}/openidm/config/${configName}`;
    emit(`PUT ${requestUrl}\n`);
    await restPut(requestUrl, orgConfig, token);
  }

  if (name && !configFound) {
    emit(`Warning: org config ${name} not found on disk\n`);
  }
}

module.exports = { pushOrgPrivileges };
```

- [ ] **Step 2: Smoke-load**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/push/update-org-privileges.js'); console.log(Object.keys(m))"
```

Expected: `[ 'pushOrgPrivileges' ]`

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/push/update-org-privileges.js
git commit -m "vendor: push org-privileges"
```

---

## Task 5: Typed facade entries

**Files:** Modify `src/vendor/fr-config-manager/index.ts`.

- [ ] **Step 1: Append four wrappers after the IDM_FLAT block**

```typescript
// eslint-disable-next-line @typescript-eslint/no-require-imports
const passwordPolicyPull = require("./pull/password-policy.js") as {
  pullPasswordPolicy: (opts: {
    exportDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pullPasswordPolicy(opts: {
  exportDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  log?: (line: string) => void;
}): Promise<void> {
  await passwordPolicyPull.pullPasswordPolicy(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const passwordPolicyPush = require("./push/update-password-policy.js") as {
  pushPasswordPolicy: (opts: {
    configDir: string;
    tenantUrl: string;
    token: string;
    realms?: string[];
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pushPasswordPolicy(opts: {
  configDir: string;
  tenantUrl: string;
  token: string;
  realms?: string[];
  log?: (line: string) => void;
}): Promise<void> {
  await passwordPolicyPush.pushPasswordPolicy(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const orgPrivilegesPull = require("./pull/org-privileges.js") as {
  pullOrgPrivileges: (opts: {
    exportDir: string;
    tenantUrl: string;
    token: string;
    name?: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pullOrgPrivileges(opts: {
  exportDir: string;
  tenantUrl: string;
  token: string;
  name?: string;
  log?: (line: string) => void;
}): Promise<void> {
  await orgPrivilegesPull.pullOrgPrivileges(opts);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const orgPrivilegesPush = require("./push/update-org-privileges.js") as {
  pushOrgPrivileges: (opts: {
    configDir: string;
    tenantUrl: string;
    token: string;
    name?: string;
    log?: (line: string) => void;
  }) => Promise<void>;
};

export async function pushOrgPrivileges(opts: {
  configDir: string;
  tenantUrl: string;
  token: string;
  name?: string;
  log?: (line: string) => void;
}): Promise<void> {
  await orgPrivilegesPush.pushOrgPrivileges(opts);
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "vendor: typed password-policy + org-privileges facades"
```

---

## Task 6: Wire into route

**Files:** Modify `src/app/api/promote-items/route.ts`.

- [ ] **Step 1: Extend the vendor import**

```typescript
import { pullManagedObjects, pushManagedObjects, pullScripts, pushScripts, pullJourneys, pushJourneys, isIdmFlatScope, pullIdmFlatScope, pushIdmFlatScope, pullPasswordPolicy, pushPasswordPolicy, pullOrgPrivileges, pushOrgPrivileges } from "@/vendor/fr-config-manager";
```

- [ ] **Step 2: Add pull-target branches**

Insert between the idm-flat branch and the final else-spawn branch:

```typescript
            } else if (sel.scope === "password-policy") {
              const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
              const realms = pullEnvVars.REALMS ? (JSON.parse(pullEnvVars.REALMS) as string[]) : ["alpha"];
              if (!tenantUrl) {
                emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping password-policy pull.\n`, ts: Date.now() });
              } else {
                let token: string | null = null;
                try { token = await getAccessToken(pullEnvVars); }
                catch (err) { emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() }); }
                if (token) {
                  const configDirRel = pullEnvVars.CONFIG_DIR ?? "./config";
                  const exportDir = path.resolve(pullCwd, configDirRel);
                  emit({ type: "stdout", data: `  Pulling password-policy (vendored)...\n`, ts: Date.now() });
                  try {
                    await pullPasswordPolicy({ exportDir, tenantUrl, token, realms, log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }) });
                  } catch (err) {
                    emit({ type: "stderr", data: `  Pull failed for password-policy: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                  }
                }
              }
            } else if (sel.scope === "org-privileges") {
              const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
              if (!tenantUrl) {
                emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping org-privileges pull.\n`, ts: Date.now() });
              } else {
                let token: string | null = null;
                try { token = await getAccessToken(pullEnvVars); }
                catch (err) { emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() }); }
                if (token) {
                  const configDirRel = pullEnvVars.CONFIG_DIR ?? "./config";
                  const exportDir = path.resolve(pullCwd, configDirRel);
                  emit({ type: "stdout", data: `  Pulling org-privileges (vendored)...\n`, ts: Date.now() });
                  try {
                    await pullOrgPrivileges({ exportDir, tenantUrl, token, log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }) });
                  } catch (err) {
                    emit({ type: "stderr", data: `  Pull failed for org-privileges: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                  }
                }
              }
            } else {
              // Entire scope: pull all (still spawned for scopes we haven't vendored yet)
```

- [ ] **Step 3: Add push-routing blocks**

Near the other `*Sel` finds, add:

```typescript
        const passwordPolicySel = scopeSelections.find((s) => s.scope === "password-policy");
        const orgPrivilegesSel = scopeSelections.find((s) => s.scope === "org-privileges");
```

After the `idmFlatPushFailed` block, add:

```typescript
        let passwordPolicyPushFailed = false;
        if (passwordPolicySel && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            passwordPolicyPushFailed = true;
          } else {
            const realms = targetEnvVarsForPush.REALMS ? (JSON.parse(targetEnvVarsForPush.REALMS) as string[]) : ["alpha"];
            emit({ type: "stdout", data: `  Pushing password-policy (vendored)...\n`, ts: Date.now() });
            try {
              await pushPasswordPolicy({
                configDir: tempConfigDir,
                tenantUrl: tenantUrlForPush,
                token,
                realms,
                log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
              });
            } catch (err) {
              passwordPolicyPushFailed = true;
              emit({ type: "stderr", data: `  Push failed for password-policy: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
            }
          }
        }

        let orgPrivilegesPushFailed = false;
        if (orgPrivilegesSel && !directControl) {
          const token = await ensurePushToken();
          if (!token) {
            orgPrivilegesPushFailed = true;
          } else {
            const items = orgPrivilegesSel.items && orgPrivilegesSel.items.length > 0 ? orgPrivilegesSel.items : [undefined];
            for (const itemId of items) {
              emit({ type: "stdout", data: `  Pushing org-privileges${itemId ? ` "${itemId}"` : ""} (vendored)...\n`, ts: Date.now() });
              try {
                await pushOrgPrivileges({
                  configDir: tempConfigDir,
                  tenantUrl: tenantUrlForPush,
                  token,
                  name: itemId,
                  log: (line) => emit({ type: "stdout", data: `  ${line}`, ts: Date.now() }),
                });
              } catch (err) {
                orgPrivilegesPushFailed = true;
                emit({ type: "stderr", data: `  Push failed for org-privileges${itemId ? ` "${itemId}"` : ""}: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
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
          if (passwordPolicySel && s === "password-policy") return false;
          if (orgPrivilegesSel && s === "org-privileges") return false;
          return true;
        });
```

Update `pushFailed`:

```typescript
        let pushFailed = managedPushFailed || scriptsPushFailed || journeysPushFailed || idmFlatPushFailed || passwordPolicyPushFailed || orgPrivilegesPushFailed;
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "route: vendored password-policy + org-privileges"
```

---

## Acceptance checklist

- [ ] `git grep -nE 'fr-config-(pull|push).*(password-policy|org-privileges)' src/` → vendor file headers only.
- [ ] 6 implementation commits on top of phase 5a.
- [ ] `npx tsc --noEmit` clean.

---

## Deferred

- **Phase 5c:** `cors`, `csp`, `locales`, `telemetry`, `cookie-domains` (each needs dedicated logic).
- **Phase 6:** `terms-and-conditions` and other scopes with embedded templates.
