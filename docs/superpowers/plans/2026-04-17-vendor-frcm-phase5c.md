# Vendor fr-config-manager — Phase 5c (cookie-domains, cors, csp, locales)

**Goal:** Replace the `fr-config-push` / `fr-config-pull` spawns for four scopes that each have their own dedicated endpoint shape, none of which fit the idm-flat-config generic. After this phase only `telemetry` remains among the "one-off JSON" group (deferred to its own phase — it needs env-var / placeholder handling).

**Architecture:** Eight small vendored files (pull+push per scope), four facade helpers each, four route branches (or one generic predicate + table — see below). Same spawn-exclusion pattern as 5a/5b.

---

## File structure

```
src/vendor/fr-config-manager/
  pull/cookie-domains.js      push/update-cookie-domains.js
  pull/cors.js                push/update-cors.js
  pull/csp.js                 push/update-csp.js
  pull/locales.js             push/update-locales.js
  index.ts                     # 8 new facade entries

src/app/api/promote-items/route.ts  # 4 pull-target branches + 4 push-route blocks
```

---

## Endpoint summary

| Scope | Pull | Push |
|---|---|---|
| cookie-domains | `GET /environment/cookie-domains` → `cookie-domains/cookie-domains.json` | `PUT /environment/cookie-domains` |
| cors | 3-way: `/am/json/global-config/services/CorsService` + `nextdescendents` + `/openidm/config/servletfilter/cors` → combined into `cors/cors-config.json` | 3 separate PUTs (global, IDM, per-service) |
| csp | `GET /environment/content-security-policy/<policy>` for each of `["enforced", "report-only"]` → `csp/csp.json` | `PUT /environment/content-security-policy/<policy>` per entry |
| locales | List `/openidm/config?_queryFilter=_id sw "uilocale/"` → per-locale `GET /openidm/config/uilocale/<name>` → `locales/<name>.json` | `PUT /openidm/config/uilocale/<name>` per `.json` in dir |

**Upstream bugs fixed:**
- `pull/locales.js` — uses `restGet(...).then(...)` inside a `forEach`, not awaiting; the function returns before writes complete. Vendored version awaits.
- `pull/csp.js` — `cspOverridesFile` feature dropped (not used by the app). Upstream `process.exit(1)` replaced with throw.

---

## Task 1: Vendor the 8 files

For each of the 8 files below, write the file, smoke-load, and commit as its own commit. Keep file headers/patterns consistent with phases 5a/5b.

### 1.1 `pull/cookie-domains.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/cookieDomains.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 * Local patches: see src/vendor/fr-config-manager/UPSTREAM.md
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

async function pullCookieDomains({ exportDir, tenantUrl, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const endpoint = `${tenantUrl}/environment/cookie-domains`;
  emit(`GET ${endpoint}\n`);
  const response = await restGet(endpoint, null, token);

  const dir = path.join(exportDir, "cookie-domains");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "cookie-domains.json"), JSON.stringify(response.data, null, 2));
}

module.exports = { pullCookieDomains };
```

### 1.2 `push/update-cookie-domains.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-cookie-domains.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushCookieDomains({ configDir, tenantUrl, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, "cookie-domains");
  const filePath = path.join(dir, "cookie-domains.json");
  if (!fs.existsSync(filePath)) {
    emit(`Warning: no cookie-domains config at ${filePath}\n`);
    return;
  }
  const body = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const serviceUrl = `${tenantUrl}/environment/cookie-domains`;
  emit(`PUT ${serviceUrl}\n`);
  await restPut(serviceUrl, body, token, "protocol=2.0,resource=1.0");
}

module.exports = { pushCookieDomains };
```

### 1.3 `pull/cors.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/cors.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter changes: uses restPost via axios directly (restClient helper only
 * exports restGet/restPut; rather than extend it with restPost for a single
 * caller, inline the axios call here).
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { restGet } = require("../common/restClient.js");

async function pullCors({ exportDir, tenantUrl, token, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const corsConfig = {};

  const amEndpoint = `${tenantUrl}/am/json/global-config/services/CorsService`;

  emit(`GET ${amEndpoint}\n`);
  const corsGlobal = await restGet(amEndpoint, null, token);
  corsConfig.corsServiceGlobal = corsGlobal.data;

  emit(`POST ${amEndpoint} (nextdescendents)\n`);
  const corsDescendantsResp = await axios({
    method: "POST",
    url: amEndpoint,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Api-Version": "protocol=2.0,resource=1.0",
      "X-Requested-With": "ForgeRock Identity Cloud Postman Collection",
    },
    params: { _action: "nextdescendents" },
    data: {},
    validateStatus: (s) => s >= 200 && s < 300,
  });
  corsConfig.corsServices = corsDescendantsResp.data.result;

  const idmEndpoint = `${tenantUrl}/openidm/config/servletfilter/cors`;
  emit(`GET ${idmEndpoint}\n`);
  const idmResponse = await restGet(idmEndpoint, null, token);
  corsConfig.idmCorsConfig = idmResponse.data;

  const dir = path.join(exportDir, "cors");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "cors-config.json"), JSON.stringify(corsConfig, null, 2));
}

module.exports = { pullCors };
```

### 1.4 `push/update-cors.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-cors.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushCors({ configDir, tenantUrl, token, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, "cors");
  const filePath = path.join(dir, "cors-config.json");
  if (!fs.existsSync(filePath)) {
    emit(`Warning: no cors config at ${filePath}\n`);
    return;
  }
  const body = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const serviceUrl = `${tenantUrl}/am/json/global-config/services/CorsService`;
  const idmUrl = `${tenantUrl}/openidm/config/servletfilter/cors`;

  if (body.corsServiceGlobal) delete body.corsServiceGlobal._rev;

  emit(`PUT ${serviceUrl} (global)\n`);
  await restPut(serviceUrl, body.corsServiceGlobal, token, "protocol=2.0,resource=1.0");

  emit(`PUT ${idmUrl}\n`);
  await restPut(idmUrl, body.idmCorsConfig, token);

  for (const svc of body.corsServices ?? []) {
    const url = `${serviceUrl}/configuration/${svc._id}`;
    emit(`PUT ${url}\n`);
    await restPut(url, svc, token, "protocol=2.0,resource=1.0");
  }
}

module.exports = { pushCors };
```

### 1.5 `pull/csp.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/csp.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter changes: CSP_POLICIES constant inlined. Dropped the cspOverridesFile
 * feature (unused by the app and would require vendoring lodash.merge and
 * escapePlaceholders).
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

const CSP_POLICIES = ["enforced", "report-only"];

async function pullCsp({ exportDir, tenantUrl, token, name, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(exportDir, "csp");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const policies = name ? [name] : CSP_POLICIES;
  const csp = {};

  for (const policy of policies) {
    const endpoint = `${tenantUrl}/environment/content-security-policy/${policy}`;
    emit(`GET ${endpoint}\n`);
    const response = await restGet(endpoint, null, token);
    csp[policy] = response.data;
  }

  fs.writeFileSync(path.join(dir, "csp.json"), JSON.stringify(csp, null, 2));
}

module.exports = { pullCsp, CSP_POLICIES };
```

### 1.6 `push/update-csp.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-csp.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");
const { CSP_POLICIES } = require("../pull/csp.js");

async function pushCsp({ configDir, tenantUrl, token, name, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const cspFile = path.join(configDir, "csp", "csp.json");
  if (!fs.existsSync(cspFile)) {
    emit(`Warning: no csp config at ${cspFile}\n`);
    return;
  }
  const csp = JSON.parse(fs.readFileSync(cspFile, "utf-8"));

  const policies = name ? [name] : CSP_POLICIES;
  if (name && !csp[name]) {
    emit(`Warning: no config in csp.json for policy ${name}\n`);
    return;
  }

  for (const policy of policies) {
    if (!csp[policy]) continue;
    const url = `${tenantUrl}/environment/content-security-policy/${policy}`;
    emit(`PUT ${url}\n`);
    await restPut(url, csp[policy], token);
  }
}

module.exports = { pushCsp };
```

### 1.7 `pull/locales.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-pull/src/scripts/locales.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 *
 * Adapter changes:
 *   - LOCAL PATCH: awaits each locale restGet. Upstream uses `.then()` inside
 *     forEach without awaiting, so the function returns before writes complete.
 */

const fs = require("fs");
const path = require("path");
const { restGet } = require("../common/restClient.js");

async function pullLocales({ exportDir, tenantUrl, token, name, log }) {
  if (!exportDir) throw new Error("exportDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const listEndpoint = `${tenantUrl}/openidm/config`;
  emit(`GET ${listEndpoint} (_queryFilter=_id sw "uilocale/")\n`);
  const listResponse = await restGet(listEndpoint, { _queryFilter: '_id sw "uilocale/"' }, token);
  const locales = listResponse.data.result;

  const dir = path.join(exportDir, "locales");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const locale of locales) {
    const localeName = locale._id.split("/")[1];
    if (name && name !== localeName) continue;

    const idmEndpoint = `${tenantUrl}/openidm/config/${locale._id}`;
    emit(`GET ${idmEndpoint}\n`);
    const response = await restGet(idmEndpoint, null, token);
    fs.writeFileSync(path.join(dir, `${localeName}.json`), JSON.stringify(response.data, null, 2));
  }
}

module.exports = { pullLocales };
```

### 1.8 `push/update-locales.js`

```javascript
/*
 * Adapted from @forgerock/fr-config-manager/packages/fr-config-push/src/scripts/update-locales.js
 * Upstream: https://github.com/ForgeRock/fr-config-manager (v1.5.12, Apache-2.0)
 */

const fs = require("fs");
const path = require("path");
const { restPut } = require("../common/restClient.js");

async function pushLocales({ configDir, tenantUrl, token, name, log }) {
  if (!configDir) throw new Error("configDir is required");
  if (!tenantUrl) throw new Error("tenantUrl is required");
  if (!token) throw new Error("token is required");
  const emit = typeof log === "function" ? log : () => {};

  const dir = path.join(configDir, "locales");
  if (!fs.existsSync(dir)) {
    emit(`Warning: no locales config at ${dir}\n`);
    return;
  }

  const files = fs.readdirSync(dir).filter((n) => path.extname(n) === ".json");
  for (const file of files) {
    const body = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    const localeName = body._id ? body._id.split("/")[1] : path.basename(file, ".json");
    if (name && name !== localeName) continue;

    const url = `${tenantUrl}/openidm/config/${body._id}`;
    emit(`PUT ${url}\n`);
    await restPut(url, body, token);
  }
}

module.exports = { pushLocales };
```

After each file: smoke-load + individual commit.

---

## Task 2: Typed facade entries

Append 8 wrappers: `pullCookieDomains` / `pushCookieDomains` / `pullCors` / `pushCors` / `pullCsp` / `pushCsp` / `pullLocales` / `pushLocales`. All follow the same `{ exportDir|configDir, tenantUrl, token, log, ... }` pattern. Commit as one.

---

## Task 3: Wire into route

- Add four new pull-target branches (one per scope) between the org-privileges branch and the final spawn-else. All four accept `sel.items` where meaningful (csp and locales support `name`; cookie-domains and cors don't — always whole-scope).
- Add four `*Sel` finds and push blocks alongside the others.
- Extend `spawnPushScopes` filter and `pushFailed` aggregation.

Commit as one.

---

## Acceptance

- `git grep -nE 'fr-config-(pull|push).*(cookie-domains|cors|csp|locales)' src/` → vendor file headers only.
- `npx tsc --noEmit` clean.
- A whole-scope promote of any of the four works end-to-end without spawning fr-config-push / fr-config-pull for that scope.

---

## Deferred

- **`telemetry`** — its own phase after 5c. Needs `replaceEnvSpecificValues` (placeholder substitution) and ENV-VAR header mapping, both worth handling carefully.
