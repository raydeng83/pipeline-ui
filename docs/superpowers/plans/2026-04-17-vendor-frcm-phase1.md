# Vendor fr-config-manager — Phase 1 (managed-objects pull)

**Goal:** Vendor the minimum slice of `@forgerock/fr-config-manager` needed to pull a single managed object from target, bypassing the upstream CLI so we can fix the `--name` filter bug in tree and establish the vendoring pattern for later scopes.

**Architecture:** Copy `fr-config-pull/src/scripts/managed.js` and the axios-based `fr-config-common/src/restClient.js` into `src/vendor/fr-config-manager/` as JavaScript (match upstream, no TS port yet), strip CLI concerns, fix the known bug, and call the exported function directly from `src/app/api/promote-items/route.ts` instead of spawning `fr-config-pull`. All other scopes keep spawning as today. Shared axios / lodash come from the project's own `package.json`, not from the copied node_modules.

**Tech Stack:** Node.js, Next.js 16 route handler (server-only), axios, lodash.

**Scope note:** Phase 1 touches **only the managed-objects pull-target step**. It reverts the "pull all" workaround from commit `1b27970a` and replaces it with a targeted direct call. Phases 2+ (other scopes, push, frodo-lib) are out of scope for this plan.

---

## File Structure

```
src/vendor/fr-config-manager/
  LICENSE                         # Apache-2.0 verbatim from upstream
  UPSTREAM.md                     # source commit hash, local patch list, sync instructions
  common/
    restClient.js                 # minimal subset used by managed.js: restGet
  pull/
    managed.js                    # the script, with return→continue fix applied
  index.ts                        # thin TS wrapper that re-exports typed functions

src/app/api/promote-items/route.ts  # swap spawn("fr-config-pull", ["managed-objects"]) for the vendored function

package.json                      # add axios + lodash as top-level deps if not already present
```

Responsibility split:
- `common/restClient.js` → transport only, no FR semantics.
- `pull/managed.js` → FR semantics for managed-objects pull, writes files to disk using the same layout fr-config-pull produces.
- `index.ts` → typed surface. Every consumer imports from here, never from the `.js` files directly. This lets us port files to TS later without breaking callers.

---

## Prerequisites

- Dev server currently running must be stopped and restarted after this work so Turbopack picks up the new `src/vendor/` tree.
- Upstream version to vendor: `@forgerock/fr-config-manager@1.5.12`. Confirm the installed copy matches before copying:
  ```bash
  cat /Users/ledeng/.nvm/versions/node/v24.14.0/lib/node_modules/@forgerock/fr-config-manager/package.json | grep '"version"'
  ```
  Expected: `"version": "1.5.12"`.

---

## Task 1: Scaffold vendor directory + license + upstream tracker

**Files:**
- Create: `src/vendor/fr-config-manager/LICENSE`
- Create: `src/vendor/fr-config-manager/UPSTREAM.md`

- [ ] **Step 1: Copy the Apache-2.0 license file from upstream**

```bash
cp /Users/ledeng/.nvm/versions/node/v24.14.0/lib/node_modules/@forgerock/fr-config-manager/LICENSE \
   src/vendor/fr-config-manager/LICENSE
```

If the file doesn't exist at that path, fetch from the npm tarball instead:
```bash
npm pack @forgerock/fr-config-manager@1.5.12 --pack-destination /tmp
tar -xzf /tmp/forgerock-fr-config-manager-1.5.12.tgz -C /tmp
cp /tmp/package/LICENSE src/vendor/fr-config-manager/LICENSE
```

- [ ] **Step 2: Create `UPSTREAM.md` with vendored version and patch log**

Write this exact content:

```markdown
# Vendored: @forgerock/fr-config-manager

**Upstream:** https://github.com/ForgeRock/fr-config-manager
**Vendored version:** 1.5.12
**Vendored on:** 2026-04-17
**Vendored files:**
- `common/restClient.js` — subset of `packages/fr-config-common/src/restClient.js`
- `pull/managed.js` — adapted from `packages/fr-config-pull/src/scripts/managed.js`

## Local patches

1. **`pull/managed.js`** — filter loop uses `continue` instead of `return` so the
   `--name` filter works regardless of object order in the IDM response. Upstream
   bug at `scripts/managed.js:66` causes the pull to abort on the first
   non-matching object.

## Sync process

1. Check upstream: `npm view @forgerock/fr-config-manager version`
2. If newer, fetch the tarball: `npm pack @forgerock/fr-config-manager@<version>`
3. Diff the two vendored files against upstream, port changes manually, re-apply
   the local patches above. Bump the version in this file when done.

## License

Upstream is Apache-2.0 (see `LICENSE`). Modifications are flagged at the top of
each modified file with a `// LOCAL PATCH:` comment.
```

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/LICENSE src/vendor/fr-config-manager/UPSTREAM.md
git commit -m "$(cat <<'EOF'
Scaffold vendored fr-config-manager directory

Adds LICENSE (Apache-2.0, verbatim from upstream 1.5.12) and
UPSTREAM.md describing sync process and local patches.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Ensure axios + lodash are project-level dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check what's already declared**

Run: `grep -E '"(axios|lodash)"' package.json`

Expected outcomes:
- If both appear under `dependencies` → skip to Task 3.
- If one or both missing → continue.

- [ ] **Step 2: Install the missing ones**

Add whichever is missing (check the versions upstream fr-config-manager was built against for safety):

```bash
# Versions from fr-config-manager@1.5.12 package.json:
npm install axios@^1.11.0 lodash@^4.17.21
```

- [ ] **Step 3: Verify they resolve**

```bash
node -e "require('axios'); require('lodash'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
Add axios and lodash for vendored fr-config-manager code

Preparing to vendor fr-config-manager scripts which depend on these
two libraries. Declaring them at project level avoids having a
nested node_modules in src/vendor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Vendor `common/restClient.js` (minimal subset)

**Files:**
- Create: `src/vendor/fr-config-manager/common/restClient.js`

The upstream file is 418 lines but `managed.js` only uses `restGet`. Vendor only what's used.

- [ ] **Step 1: Inspect what restGet does upstream**

```bash
awk '/^const restGet|^async function restGet|^function restGet|^const httpRequest|^async function httpRequest/,/^}/' \
  /Users/ledeng/.nvm/versions/node/v24.14.0/lib/node_modules/@forgerock/fr-config-manager/packages/fr-config-common/src/restClient.js
```

Note: `restGet` is a thin wrapper around `httpRequest`, which wraps `axios` with retry on 5xx, proxy support via `https-proxy-agent`, and bearer-token injection.

- [ ] **Step 2: Write the minimal vendor file**

Write this exact content to `src/vendor/fr-config-manager/common/restClient.js`:

```javascript
/*
 * Subset of @forgerock/fr-config-manager/packages/fr-config-common/src/restClient.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Scope: exports only restGet — the one function pull/managed.js uses.
 * Retry count matches upstream default (2). No proxy support; add back if needed.
 */

const axios = require("axios");

const MAX_RETRIES = 2;

async function httpRequest(config, token) {
  const headers = { ...(config.headers ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const merged = {
    ...config,
    headers,
    // Match upstream: axios throws on 4xx/5xx so the retry loop sees them.
    validateStatus: (s) => s >= 200 && s < 300,
  };

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios(merged);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      // Retry on transient 5xx only, mirror upstream behavior.
      if (status == null || status < 500 || status > 599) break;
      if (attempt < MAX_RETRIES) {
        // eslint-disable-next-line no-console
        console.error(`Retry ${attempt + 1}/${MAX_RETRIES} for ${config.url}...`);
      }
    }
  }
  throw lastErr;
}

async function restGet(url, params, token) {
  return httpRequest({ method: "GET", url, params }, token);
}

module.exports = { restGet };
```

- [ ] **Step 3: Smoke-load the file**

```bash
node -e "const {restGet} = require('./src/vendor/fr-config-manager/common/restClient.js'); console.log(typeof restGet)"
```

Expected: `function`

- [ ] **Step 4: Commit**

```bash
git add src/vendor/fr-config-manager/common/restClient.js
git commit -m "$(cat <<'EOF'
Vendor minimal restClient (restGet only)

Only restGet is needed by the managed-objects pull script. Proxy and
auth-platform helpers are not vendored; add them back if future scopes
need them.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Vendor `pull/managed.js` with the filter fix

**Files:**
- Create: `src/vendor/fr-config-manager/pull/managed.js`

- [ ] **Step 1: Copy the upstream file into the vendor location**

```bash
cp /Users/ledeng/.nvm/versions/node/v24.14.0/lib/node_modules/@forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/managed.js \
   src/vendor/fr-config-manager/pull/managed.js
```

- [ ] **Step 2: Rewrite the top-of-file requires to point at our vendor tree**

Open `src/vendor/fr-config-manager/pull/managed.js`. Replace the first `require` block:

```diff
-const utils = require("../../../fr-config-common/src/utils.js");
 const fs = require("fs");
 const path = require("path");
-const { restGet } = require("../../../fr-config-common/src/restClient.js");
-const { property, pull } = require("lodash");
-const { saveJsonToFile } = utils;
+const { restGet } = require("../common/restClient.js");
+
+// utils.saveJsonToFile inlined — the only helper managed.js used
+function saveJsonToFile(data, filename) {
+  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
+}
```

(`property` and `pull` from lodash were imported but unused in the copied file — drop them.)

- [ ] **Step 3: Apply the filter fix (return → continue)**

Find this block (around line 62–66 in upstream, renumbered slightly after the require changes):

```javascript
    for (const managedObject of managedObjects) {
      if (name && name !== managedObject.name) {
        return;
      }
```

Replace `return;` with `continue;` and add a `LOCAL PATCH` marker:

```javascript
    for (const managedObject of managedObjects) {
      if (name && name !== managedObject.name) {
        // LOCAL PATCH: upstream uses `return` here, which aborts the loop on
        // the first non-matching object. IDM's response order isn't stable, so
        // --name silently wrote nothing whenever the target wasn't first.
        continue;
      }
```

- [ ] **Step 4: Add a header comment flagging the file as vendored+patched**

Add at the very top (above the requires):

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/managed.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 */
```

- [ ] **Step 5: Smoke-load the module**

```bash
node -e "const m = require('./src/vendor/fr-config-manager/pull/managed.js'); console.log(Object.keys(m))"
```

Expected: `[ 'exportManagedObjects' ]`

- [ ] **Step 6: Commit**

```bash
git add src/vendor/fr-config-manager/pull/managed.js
git commit -m "$(cat <<'EOF'
Vendor pull/managed.js with --name filter fix

Copy of fr-config-manager v1.5.12 scripts/managed.js, rewired to use
the vendored restClient and with the filter loop bug fixed
(return → continue). saveJsonToFile inlined so the utils.js subset
doesn't have to be vendored too.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Typed TS facade

**Files:**
- Create: `src/vendor/fr-config-manager/index.ts`

- [ ] **Step 1: Write the facade**

Content:

```typescript
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
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 3: Commit**

```bash
git add src/vendor/fr-config-manager/index.ts
git commit -m "$(cat <<'EOF'
Add typed facade for vendored fr-config-manager

Single entrypoint (src/vendor/fr-config-manager) with typed
argument shapes. Internals can move to TS later without breaking
callers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Tell Next.js the vendor tree is server-only

**Files:**
- Modify: `next.config.ts`

The vendored code uses `fs`, `path`, and axios's `http` adapter. It must not be bundled for the browser.

- [ ] **Step 1: Inspect current config**

```bash
cat next.config.ts
```

Current content (for reference — it's small):
```typescript
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
```

- [ ] **Step 2: Add `serverExternalPackages`**

Because the vendor code is only imported from route handlers (`src/app/api/**`), which are server-only in App Router, it would already not be bundled for the client. But we add an explicit hint so axios's Node `http` adapter isn't tree-shaken into a client chunk if someone accidentally imports from a client component.

Edit `next.config.ts`:

```typescript
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ["axios"],
};

export default nextConfig;
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "$(cat <<'EOF'
Keep axios on server only

Vendored fr-config-manager code uses axios from route handlers.
serverExternalPackages keeps its Node http adapter out of any
accidental client bundle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Use the vendored pull from `promote-items/route.ts`

**Files:**
- Modify: `src/app/api/promote-items/route.ts`

- [ ] **Step 1: Add imports at the top**

Open `src/app/api/promote-items/route.ts`. Near the other imports (after line 9), add:

```typescript
import { pullManagedObjects } from "@/vendor/fr-config-manager";
import { getAccessToken } from "@/lib/iga-api";
```

`getAccessToken` is already exported — we flipped it from unexported to exported earlier in this session.

- [ ] **Step 2: Locate the managed-objects pull branch**

Search the file for the "Work around fr-config-pull managed-objects --name bug" block (added in commit `1b27970a`). It currently spawns `fr-config-pull managed-objects` with no `--name`. Replace that whole branch.

- [ ] **Step 3: Replace the spawn with the vendored call**

Find:

```typescript
              if (sel.scope === "managed-objects") {
                emit({ type: "stdout", data: `  Pulling ${sel.scope} (all, workaround for --name upstream bug)...\n`, ts: Date.now() });
                const code = await new Promise<number | null>((resolve) => {
                  const proc = spawnProc("fr-config-pull", [sel.scope], { env: pullEnv, shell: true, cwd: pullCwd });
                  proc.stdout.on("data", (chunk: Buffer) => emit({ type: "stdout", data: chunk.toString(), ts: Date.now() }));
                  proc.stderr.on("data", (chunk: Buffer) => emit({ type: "stderr", data: chunk.toString(), ts: Date.now() }));
                  proc.on("close", (c) => resolve(c));
                  proc.on("error", (err) => { emit({ type: "stderr", data: err.message + "\n", ts: Date.now() }); resolve(1); });
                });
                if (code !== 0) emit({ type: "stderr", data: `  Pull failed for ${sel.scope} (exit ${code})\n`, ts: Date.now() });
                continue;
              }
```

Replace with:

```typescript
              if (sel.scope === "managed-objects") {
                const tenantUrl = pullEnvVars.TENANT_BASE_URL ?? "";
                if (!tenantUrl) {
                  emit({ type: "stderr", data: `  TENANT_BASE_URL missing for ${targetEnvironment} — skipping managed-objects pull.\n`, ts: Date.now() });
                  continue;
                }
                let token: string;
                try {
                  token = await getAccessToken(pullEnvVars);
                } catch (err) {
                  emit({ type: "stderr", data: `  Token acquisition failed: ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                  continue;
                }
                const configDirRel = pullEnvVars.CONFIG_DIR ?? "./config";
                const exportDir = path.resolve(pullCwd, configDirRel);
                for (const itemId of sel.items) {
                  emit({ type: "stdout", data: `  Pulling ${sel.scope} "${itemId}" (vendored)...\n`, ts: Date.now() });
                  try {
                    await pullManagedObjects({ exportDir, tenantUrl, token, name: itemId });
                  } catch (err) {
                    emit({ type: "stderr", data: `  Pull failed for "${itemId}": ${err instanceof Error ? err.message : String(err)}\n`, ts: Date.now() });
                  }
                }
                continue;
              }
```

Why per-item loop: the fetch is now a single cheap HTTP call per object (vs the CLI's full-tenant fetch + CLI process startup), so looping is acceptable and matches the request pattern of other scopes.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module 'vitest\|Cannot find module '@testing-library" | head
```

Expected: empty output.

- [ ] **Step 5: Restart the dev server and run the promote flow**

Kill the running dev server (use `lsof -i :3000` to find PID, then `kill <pid>`) and start fresh:

```bash
npm run dev
```

In the UI:
1. Open the existing restored failed task (`ide3 to sandbox1`, selected item `alpha_kyid_audit_logger`).
2. Click **Restart Task**.
3. Let the promote finish.

Expected signals in the log:
- A line `Pulling managed-objects "alpha_kyid_audit_logger" (vendored)...` appears (confirms the new path is being used).
- After the promote, `environments/sandbox1/config/managed-objects/alpha_kyid_audit_logger/alpha_kyid_audit_logger.json` exists on disk.
- Verify step in the summary shows zero or near-zero differences for the selected object (any remaining diff is IDM normalization, a separate problem).

If the managed-objects folder for that name is still missing after the run, go back to Task 4 and check the LOCAL PATCH (continue) actually got applied.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "$(cat <<'EOF'
Use vendored pull for managed-objects during promote verify

Replaces the \"pull all, workaround for upstream bug\" branch
(1b27970a) with a targeted vendored call per selected object.
Eliminates the cost of pulling every managed object to fix a single
one and puts the patched code in our tree.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Verify the old workaround is fully gone

**Files:**
- Modify: `src/app/api/promote-items/route.ts` (if anything lingers)

- [ ] **Step 1: Search for any leftover workaround text**

```bash
git grep -n "workaround for --name upstream bug\|Pulling .* (all, workaround"
```

Expected: no matches.

- [ ] **Step 2: If anything found, remove it**

Delete any surviving comment/log that references the bug workaround. The LOCAL PATCH comment inside `src/vendor/fr-config-manager/pull/managed.js` should stay — that's documentation for the vendored file.

- [ ] **Step 3: If changes made, commit**

```bash
git add src/app/api/promote-items/route.ts
git commit -m "$(cat <<'EOF'
Drop stale workaround references

Tidy-up after switching to the vendored pull path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If nothing was found in step 1, skip this task's commit.

---

## Acceptance checklist

Run all of these before considering Phase 1 done:

- [ ] `git log --oneline` shows one commit per task (expect 7–8 commits since the scaffold).
- [ ] `npm run dev` boots with no new warnings about bundling, server/client boundary, or missing modules.
- [ ] `npx tsc --noEmit` clean (modulo the pre-existing vitest errors).
- [ ] `git grep spawn.*fr-config-pull.*managed-objects` → no matches.
- [ ] The UI promote flow for `alpha_kyid_audit_logger` populates `environments/sandbox1/config/managed-objects/alpha_kyid_audit_logger/` on disk after Restart.
- [ ] `src/vendor/fr-config-manager/UPSTREAM.md` lists exactly one patch and pins version `1.5.12`.
- [ ] `LICENSE` in the vendor dir matches upstream byte-for-byte.

---

## Deferred (explicitly out of scope — Phase 2+)

- Vendor fr-config-manager push scripts (managed-objects push still spawns `fr-config-push`).
- Vendor other pull scripts (journeys, scripts, endpoints, etc.).
- Vendor frodo / frodo-lib (currently installed via homebrew, not npm).
- Convert `pull/managed.js` to TypeScript. Worth doing when the first copycat scope is ported — the type signatures you write for that scope should be derived from doing this one first.
- Replace the local-write helper `saveJsonToFile` with a project-wide JSON writer if patterns converge.
- Re-enable proxy / custom TLS support in `restClient.js` if your deployments start needing it.
