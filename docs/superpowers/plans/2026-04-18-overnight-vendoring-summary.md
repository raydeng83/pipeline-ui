# Overnight vendoring summary — 2026-04-18

Continuing from phase 6a (endpoints + internal-roles, committed yesterday). This doc summarizes everything vendored overnight and what's deliberately left on spawn.

## Phases completed

| Phase | Scopes | Commits |
|---|---|---|
| 6b | email-templates, custom-nodes, themes | ~10 |
| 6c | email-provider, schedules, iga-workflows, terms-and-conditions, service-objects, raw | ~10 |
| 7 | authz-policies, oauth2-agents, services | ~6 |
| 8 | telemetry, connector-definitions, connector-mappings, remote-servers, secrets, secret-mappings | ~10 |

Plus extensions to `common/restClient.js` (restUpsert, restPost with query-params, restDelete) and a new `common/config-process.js` (env-var substitution helpers used by secrets, service-objects, raw, oauth2-agents, telemetry).

## Cumulative vendored scopes (29 total)

Pull + push for every project-level scope except:

- **saml** — 170-line pull + 325-line push with XML + signing-key handling. Intentionally deferred.
- **am-agents, oidc-providers, variables** (frodo scopes) — require adopting `@rockcarver/frodo-lib`. Intentionally deferred.
- **Direct-control / DCC staging** — production path. Vendor branch keeps `directControl=true` falling through to the existing `spawnFrConfig` code, so nothing there changed.

## What NOT to assume

**None of this was manually verified end-to-end.** TypeScript compiles clean and each file smoke-loads, but no vendored scope has been exercised through a real promote. Before deleting `spawnFrConfig`, run at least one promote per scope you care about and compare output against the pre-vendor behavior. If anything misbehaves, the spawn path still exists — just revert the `Route <scope> through vendored helpers` commit for that scope.

## Upstream bugs fixed while vendoring

Summary of local patches documented in `src/vendor/fr-config-manager/UPSTREAM.md`:

1. `pull/managed.js` — `return` → `continue` (filter loop)
2. `push/update-scripts.js` — added `await` on inner call
3. `pull/journeys.js` — three unawaited async calls + module-level cache scoped per call
4. `pull/password-policy.js` — path mismatch with push side
5. `push/update-password-policy.js` — `return` → `continue` on missing realm
6. `pull/locales.js` — unawaited per-locale GET
7. `pull/csp.js` — dropped unused overrides feature
8. `push/update-services.js` — unawaited inner map inside Promise.all
9. `push/update-idm-schedules.js` — unawaited restPut
10. `push/update-secret-mappings.js` — concurrent Promise.all replaced with sequential await

## Security posture

`push/update-secrets.js` has careful log hygiene: log statements emit only
IDs, version numbers, HTTP verbs, URLs. **Not** the secret value,
**not** the request body. Placeholder substitution reads from envVars
(defaults to process.env). Please audit before committing.

Other scopes that may touch sensitive data:
- `push/update-service-objects.js`, `push/update-raw.js`,
  `push/update-agents.js`, `push/update-telemetry.js` all use
  `replaceEnvSpecificValues` but do not log substituted values.
- `push/update-secret-mappings.js` handles mapping metadata only — no
  secret values.

## Verify checklist (for tomorrow)

- `git grep -nE 'fr-config-(pull|push)\s' src/app` → should only be the spawn fallbacks for directControl paths and the raw-scope "(s as string) === 'raw'" comparison.
- `npx tsc --noEmit` clean (modulo vitest noise).
- Pick one recently-used scope (managed-objects? scripts?) and re-run a promote; confirm log lines say `(vendored)` instead of spawning.
- For a scope you haven't used recently, try a trivial promote end-to-end. If it breaks, `git log --oneline -- src/vendor/fr-config-manager/<scope>.js` will point you at the commit to revert.

## Final cleanup (deferred, needs your hand)

- Delete `spawnFrConfig` helper (`src/lib/fr-config.ts`).
- Drop homebrew frodo-cli requirement from setup docs.
- Drop `@forgerock/fr-config-manager` global install requirement.
- Remove `axios` from `package.json` if no longer needed (it IS needed — vendored code uses it directly).

Do these only after you've verified every vendored scope works end-to-end.
