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

## Sync process

1. Check upstream: `npm view @forgerock/fr-config-manager version`
2. If newer, fetch the tarball: `npm pack @forgerock/fr-config-manager@<version>`
3. Diff the two vendored files against upstream, port changes manually, re-apply
   the local patches above. Bump the version in this file when done.

## License

Upstream is Apache-2.0 (see `LICENSE`). Modifications are flagged at the top of
each modified file with a `// LOCAL PATCH:` comment.
