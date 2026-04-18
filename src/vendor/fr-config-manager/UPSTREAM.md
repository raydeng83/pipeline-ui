# Vendored: @forgerock/fr-config-manager

**Upstream:** https://github.com/ForgeRock/fr-config-manager
**Vendored version:** 1.5.12
**Vendored on:** 2026-04-17
**Vendored files:**
- `common/restClient.js` — subset of `packages/fr-config-common/src/restClient.js`
- `pull/managed.js` — adapted from `packages/fr-config-pull/src/scripts/managed.js`
- `pull/scripts.js` — adapted from `packages/fr-config-pull/src/scripts/scripts.js`
- `pull/journeys.js` — adapted from `packages/fr-config-pull/src/scripts/journeys.js`
- `push/update-managed-objects.js` — adapted from `packages/fr-config-push/src/scripts/update-managed-objects.js`
- `push/update-scripts.js` — adapted from `packages/fr-config-push/src/scripts/update-scripts.js`
- `push/update-auth-trees.js` — adapted from `packages/fr-config-push/src/scripts/update-auth-trees.js`
- `pull/idm-flat-config.js` — adapted from `packages/fr-config-pull/src/scripts/idmFlatConfig.js`
- `push/idm-flat-config.js` — generalizes five upstream scripts (`update-audit`, `update-idm-access-config`, `update-idm-authentication-config`, `update-kba-config`, `update-ui-config`) into one parameterized PUT
- `pull/password-policy.js` — adapted from `packages/fr-config-pull/src/scripts/fieldPolicy.js`
- `pull/org-privileges.js` — adapted from `packages/fr-config-pull/src/scripts/orgPrivileges.js`
- `push/update-password-policy.js` — adapted from `packages/fr-config-push/src/scripts/update-password-policy.js`
- `push/update-org-privileges.js` — adapted from `packages/fr-config-push/src/scripts/update-org-privileges.js`
- `pull/cookie-domains.js` — adapted from `packages/fr-config-pull/src/scripts/cookieDomains.js`
- `pull/cors.js` — adapted from `packages/fr-config-pull/src/scripts/cors.js`
- `pull/csp.js` — adapted from `packages/fr-config-pull/src/scripts/csp.js`
- `pull/locales.js` — adapted from `packages/fr-config-pull/src/scripts/locales.js`
- `push/update-cookie-domains.js` — adapted from `packages/fr-config-push/src/scripts/update-cookie-domains.js`
- `push/update-cors.js` — adapted from `packages/fr-config-push/src/scripts/update-cors.js`
- `push/update-csp.js` — adapted from `packages/fr-config-push/src/scripts/update-csp.js`
- `push/update-locales.js` — adapted from `packages/fr-config-push/src/scripts/update-locales.js`
- `pull/endpoints.js` — adapted from `packages/fr-config-pull/src/scripts/endpoints.js`
- `push/update-idm-endpoints.js` — adapted from `packages/fr-config-push/src/scripts/update-idm-endpoints.js`
- `pull/internal-roles.js` — adapted from `packages/fr-config-pull/src/scripts/internalRoles.js`
- `push/update-internal-roles.js` — adapted from `packages/fr-config-push/src/scripts/update-internal-roles.js`

## Local patches

1. **`pull/managed.js`** — filter loop uses `continue` instead of `return` so the
   `--name` filter works regardless of object order in the IDM response. Upstream
   bug at `scripts/managed.js:66` causes the pull to abort on the first
   non-matching object.
2. **`push/update-scripts.js`** — inner `pushScript` call is `await`ed. Upstream
   (`update-scripts.js:208`) fires the calls concurrently without awaiting, so
   failures are swallowed and ordering is non-deterministic.
3. **`pull/journeys.js`** — `exportScriptById` and the recursive
   `processJourneys` call are `await`ed. Upstream (journeys.js:120, 130, 136)
   fires them without awaiting, racing script-dep writes and inner-journey
   pulls against the outer journey's node writes. Also scoped the
   `journeyCache` to per-call state (was module-level, leaked across calls).
4. **`pull/password-policy.js`** — writes to `{exportDir}/realms/<realm>/password-policy/...`
   instead of upstream's `{exportDir}/<realm>/password-policy/...`. Upstream
   `fieldPolicy.js` uses one layout on pull but `update-password-policy.js`
   reads from a different layout (`realms/<realm>/...`), so a pull+push
   round trip breaks without manual reorganization.
5. **`push/update-password-policy.js`** — `continue`s to the next realm when
   one has no config, instead of upstream's unconditional `return` which
   silently skips later realms after the first missing one.
6. **`pull/locales.js`** — awaits each per-locale `restGet`. Upstream uses
   `restGet(...).then(...)` inside a `forEach` with no outer await, so the
   function returns before the writes complete. In-process this was racy.
7. **`pull/csp.js`** — dropped the `cspOverridesFile` merge feature (unused
   by the app) to avoid vendoring `lodash.merge` and upstream's
   `escapePlaceholders` helper.

## Sync process

1. Check upstream: `npm view @forgerock/fr-config-manager version`
2. If newer, fetch the tarball: `npm pack @forgerock/fr-config-manager@<version>`
3. Diff the two vendored files against upstream, port changes manually, re-apply
   the local patches above. Bump the version in this file when done.

## License

Upstream is Apache-2.0 (see `LICENSE`). Modifications are flagged at the top of
each modified file with a `// LOCAL PATCH:` comment.
