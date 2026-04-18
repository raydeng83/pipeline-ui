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
