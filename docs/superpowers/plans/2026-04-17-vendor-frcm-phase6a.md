# Vendor fr-config-manager — Phase 6a (endpoints, internal-roles)

**Goal:** Vendor two scopes that live under `/openidm/` but each have their own wrinkle:
- **endpoints** — each config has inline JS `source`; pull extracts to a `.js` file, push re-inlines.
- **internal-roles** — queries `/openidm/internal/role` (not `/openidm/config`), filters to roles with non-empty privileges on pull.

**Architecture:** Same vendor-and-wire pattern. Endpoints is the first "complex" scope (inline code extraction) — it proves the pattern for later scopes (email-templates, custom-nodes, themes). Internal-roles is a straightforward addition that rides along in the same phase.

---

## File structure

```
src/vendor/fr-config-manager/
  pull/endpoints.js              push/update-idm-endpoints.js
  pull/internal-roles.js         push/update-internal-roles.js
  index.ts                       # 4 new facade entries

src/app/api/promote-items/route.ts  # 2 pull-target branches + 2 push blocks
```

---

## Task 1: Vendor `pull/endpoints.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/endpoints.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

const ENDPOINT_SUBDIR = "endpoints";

async function pullEndpoints({ exportDir, tenantUrl, token, name, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const idmEndpoint = `${tenantUrl}/openidm/config`;
  const queryFilter = '!(file pr) and _id sw "endpoint" and !(context sw "util") and !(_id eq "endpoint/linkedView")';
  emit(`GET ${idmEndpoint} (endpoints)\n`);
  const response = await restGet(idmEndpoint, { _queryFilter: queryFilter }, token);

  const fileDir = path.join(exportDir, ENDPOINT_SUBDIR);
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

  for (const endpoint of response.data.result) {
    const endpointName = endpoint._id.split("/")[1];
    if (name && name !== endpointName) continue;

    const endpointDir = path.join(fileDir, endpointName);
    if (!fs.existsSync(endpointDir)) fs.mkdirSync(endpointDir, { recursive: true });

    const scriptFilename = `${endpointName}.js`;
    fs.writeFileSync(path.join(endpointDir, scriptFilename), endpoint.source ?? "");
    delete endpoint.source;
    endpoint.file = scriptFilename;

    fs.writeFileSync(
      path.join(endpointDir, `${endpointName}.json`),
      JSON.stringify(endpoint, null, 2),
    );
  }
}

module.exports = { pullEndpoints };
```

Commit: `vendor: pull endpoints with inline JS extraction`

## Task 2: Vendor `push/update-idm-endpoints.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-idm-endpoints.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter changes:
 *   - Replaced glob dep with fs.readdir walk (same pattern as
 *     push/update-auth-trees).
 *   - Dropped fileFilter helper (unused by the app).
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

function nestedEndpointJsonFiles(dir) {
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

async function pushEndpoints({ configDir, tenantUrl, token, name, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, "endpoints");
  if (!fs.existsSync(dir)) {
    emit(`Warning: no endpoints config at ${dir}\n`);
    return;
  }

  const jsonFiles = nestedEndpointJsonFiles(dir);
  let endpointFound = !name;

  for (const jsonFile of jsonFiles) {
    const endpoint = JSON.parse(fs.readFileSync(path.join(dir, jsonFile), "utf-8"));
    const endpointName = endpoint._id.split("/")[1];
    if (name && name !== endpointName) continue;
    endpointFound = true;

    const endpointDir = path.dirname(jsonFile);
    if (endpoint.file) {
      const scriptPath = path.join(dir, endpointDir, endpoint.file);
      if (fs.existsSync(scriptPath)) {
        endpoint.source = fs.readFileSync(scriptPath, "utf-8");
        delete endpoint.file;
      } else {
        emit(`Warning: endpoint script missing at ${scriptPath}\n`);
      }
    }

    const requestUrl = `${tenantUrl}/openidm/config/${endpoint._id}`;
    emit(`PUT ${requestUrl}\n`);
    await restPut(requestUrl, endpoint, token);
  }

  if (name && !endpointFound) {
    throw new Error(`endpoint "${name}" not found under ${dir}`);
  }
}

module.exports = { pushEndpoints };
```

Commit: `vendor: push endpoints with inline JS and no glob dep`

## Task 3: Vendor `pull/internal-roles.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/internalRoles.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter notes: upstream filters roles to those with non-empty privileges
 * (to skip built-in system roles); preserve that behavior.
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

async function pullInternalRoles({ exportDir, tenantUrl, token, name, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const idmEndpoint = `${tenantUrl}/openidm/internal/role`;
  emit(`GET ${idmEndpoint}\n`);
  const response = await restGet(idmEndpoint, { _queryFilter: "true" }, token);

  const targetDir = path.join(exportDir, "internal-roles");
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  for (const role of response.data.result) {
    if (name && name !== role.name) continue;
    if (!role.privileges || role.privileges.length === 0) continue;
    fs.writeFileSync(path.join(targetDir, `${role.name}.json`), JSON.stringify(role, null, 2));
  }
}

module.exports = { pullInternalRoles };
```

Commit: `vendor: pull internal-roles`

## Task 4: Vendor `push/update-internal-roles.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-internal-roles.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushInternalRoles({ configDir, tenantUrl, token, name, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, "internal-roles");
  if (!fs.existsSync(dir)) {
    emit(`Warning: no internal-roles config at ${dir}\n`);
    return;
  }

  const files = fs.readdirSync(dir).filter((n) => path.extname(n) === ".json");
  for (const file of files) {
    const role = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    if (name && name !== role.name) continue;

    delete role._rev;
    if (role.temporalConstraints && role.temporalConstraints.length === 0) {
      delete role.temporalConstraints;
    }

    const requestUrl = `${tenantUrl}/openidm/internal/role/${role._id}`;
    emit(`PUT ${requestUrl}\n`);
    await restPut(requestUrl, role, token);
  }
}

module.exports = { pushInternalRoles };
```

Commit: `vendor: push internal-roles`

## Task 5: Facade entries

Add 4 wrappers. Commit: `vendor: typed endpoints + internal-roles facades`.

## Task 6: Route wire-up

Pull branches: add `sel.scope === "endpoints"` and `sel.scope === "internal-roles"` to the pull-target if/else chain, calling `pullEndpoints` / `pullInternalRoles` with `name: sel.items?.[0]` when exactly one item is selected.

Push blocks: two new `*Sel` finds, two new push blocks (each supporting per-item iteration via `name`), extend `spawnPushScopes` filter + `pushFailed` aggregation.

Commit: `route: vendored endpoints + internal-roles`.

---

## Acceptance

- `git grep -nE 'fr-config-(pull|push).*(endpoints|internal-roles)' src/` → vendor file headers only.
- `npx tsc --noEmit` clean.
- A promote of a specific endpoint (e.g. one of the custom ones in sandbox1) produces `Pushing endpoints "<name>" (vendored)...` and `PUT .../openidm/config/endpoint/<name>`; the .js extraction/inline round-trips correctly (verify clean or only IDM-normalization diffs).

---

## Deferred to 6b+

- **email-templates** — inline HTML per version/language.
- **themes** — inline HTML/CSS assets, per-realm.
- **custom-nodes** — inline JS per node.
- **schedules, service-objects** — simpler IDM configs.
- **email-provider, iga-workflows, raw** — various idiosyncrasies.
- **saml, remote-servers, connector-*, secret-mappings, secrets, terms-and-conditions** — bigger / riskier.
