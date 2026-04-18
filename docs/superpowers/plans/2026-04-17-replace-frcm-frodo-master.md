# Replace fr-config-manager + frodo dependencies — master plan

> **For agentic workers:** Each numbered phase below is a separate implementation session. Do not execute more than one phase per session. Before starting a phase, write its per-phase plan doc following the phase-1/phase-2 template.

**Goal:** Eliminate external `@forgerock/fr-config-manager` CLI and `frodo` CLI dependencies entirely. After this work lands, the app runs without a global npm install, without a homebrew frodo, and without spawning child processes for ForgeRock config operations. All push/pull/compare work happens in-process, against tenant REST APIs, through vendored (Apache-2.0) and custom code under `src/vendor/`.

**Non-goals:**
- Rewriting the fr-config-manager architecture. We keep upstream's per-script shape so diffs against upstream remain legible for syncing.
- Supporting config scopes the app doesn't expose (fr-config-manager ships ~40 push scripts; we only need the ones referenced in `src/lib/fr-config-types.ts`).
- Replacing the compare engine — that's already custom (`src/lib/diff.ts`) and has no CLI dependency.

**Current state (as of this plan):**
- Phase 1 vendored managed-objects pull (commits `b6f55eba..c606d63b`).
- Phase 2 vendored managed-objects push (commits `f633aae5..b29e1d75`).
- Everything else still spawns `fr-config-pull` / `fr-config-push` / `frodo`.
- 10 route files call `spawnFrConfig` or spawn frodo directly (`grep` in `src/**`).

**Overall approach:** follow the established pattern — vendor upstream JS verbatim, adapter-wrap to take options instead of env+argv, wire into routes one scope at a time, delete the spawn code last. Each phase is scoped to produce a working app at every commit.

---

## Phase accounting

Scopes declared in `src/lib/fr-config-types.ts` (~35 config scopes). Split by command family:

- **fr-config-manager (default):** most scopes. Further split by complexity below.
- **frodo:** `am-agents`, `oidc-providers`, `variables`.
- **iga-api:** IGA workflows — already in-process via `src/lib/iga-api.ts`; no CLI dependency.

Phases below order scopes roughly by "bug-pressure and blast radius" — small wins first, riskiest last.

---

## Phase 3 — Scripts (pull + push)

**Why first:** `fr-config-pull/scripts/scripts.js:70-71` has the same `return`-instead-of-`continue` bug as managed.js had. The route calls `fr-config-pull scripts --name <n>` after each promote, so this bug is latent right now. Scripts also host the custom UUID-remap logic already in `promote-items/route.ts` — vendoring lets that logic live next to push.

**Files to vendor:**
- `src/vendor/fr-config-manager/pull/scripts.js`
- `src/vendor/fr-config-manager/push/update-scripts.js`

**Route changes:**
- `src/app/api/promote-items/route.ts` — replace scripts spawn in pull-target + push branches.

**Cross-cutting code to move inside vendored push:**
- Script UUID remap (`remapIds`, `remap-script-refs` scope emitter). After this phase, the route's "Step 2b: Remap script UUID references inside journey node configs" block can call into vendored helpers instead of open-coding.

**Exit criteria:**
- `git grep -n 'fr-config-pull.*scripts\|fr-config-push.*scripts'` returns only the vendored files.
- A journey promote that references a new script succeeds: the script lands on target tenant; verify shows zero diffs for the script.
- `--name` filter for scripts behaves correctly regardless of tenant response order.

**Estimated effort:** 1 day.

---

## Phase 4 — Journeys (pull + push)

**Why next:** journeys are the headline feature of the app (journey viz, dep resolution, compare). Several quality-of-life things the route currently does inline (sub-journey dep resolution, script UUID remap, innerTreeEvaluator resolution) would be more cohesive inside a vendored journey push function. Also the journey pull likely has the same filter-loop pattern — needs check.

**Files to vendor:**
- `src/vendor/fr-config-manager/pull/journeys.js` (upstream `scripts/journeys.js`)
- `src/vendor/fr-config-manager/push/update-auth-trees.js` (journey push in upstream is called "auth-trees")

**Route changes:**
- `src/app/api/promote-items/route.ts` — journeys scope in pull-target and push branches.
- Keep `src/lib/resolve-journey-deps.ts` as-is; call it from the vendored push rather than the route.

**Open questions to resolve during phase 4 plan:**
- Does journey push send tree JSON + node JSONs as separate calls (one per node) or a bundle? Check upstream before planning.
- How are sub-journeys ordered during push? We currently rely on fr-config-push to figure this out; if vendoring we own it.
- Frodo-style journey export format vs fr-config-manager tree format — confirm we're still fr-config-manager-shaped.

**Exit criteria:**
- Journey promote with fresh sub-journeys + fresh scripts succeeds.
- `git grep -n 'fr-config-.*journeys\|fr-config-.*auth-trees'` returns only vendored files.
- No regression in Journey Diff view (uses compare, unaffected, but worth smoke-testing).

**Estimated effort:** 2 days.

---

## Phase 5 — Simple JSON scopes (batch)

**Why batch:** many scopes are structurally identical — "one JSON file in, PUT to one endpoint, maybe GET for merge." These share a common adapter shape and can be vendored together with less per-file diligence.

**Scopes in this batch:**
- `cookie-domains`, `cors`, `csp`, `locales`, `kba`, `org-privileges`, `terms-and-conditions`, `ui-config`, `audit`, `access-config`, `idm-authentication`, `telemetry`, `password-policy`.

**Files to vendor (pull + push for each):**
- `src/vendor/fr-config-manager/pull/{scope}.js` × 13
- `src/vendor/fr-config-manager/push/update-{scope}.js` × 13

**Shared helper to extract:**
- `src/vendor/fr-config-manager/common/json-scope.js` — generic "read one JSON from `configDir/<subdir>/<file>.json`, PUT to `tenantUrl/<endpoint>`" helper. Per-scope wrappers stay minimal.

**Route changes:**
- Replace the spawn path in `promote-items/route.ts`, `compare/route.ts`, `pull/route.ts`, `push/route.ts`, `push/dry-run/route.ts` for each listed scope.

**Exit criteria:**
- All 13 scopes pull+push via vendored code.
- `git grep -n` for each scope name no longer shows it in spawn arguments.
- A full-scope compare + promote for each covered scope works.

**Estimated effort:** 3 days (batch).

**Pragmatic guidance:** if any scope in this batch is exotic enough to need a one-off adapter (e.g. a non-standard endpoint), move it to Phase 6 rather than forcing it into the batch pattern.

---

## Phase 6 — Complex scopes (embedded code / templates)

**Why separate:** these scopes ship inline JS/Groovy source or HTML/Markdown templates and need the same "extract file on pull, inline on push" dance that managed-objects needed. Each deserves individual attention.

**Scopes in this batch:**
- `endpoints` (inline JS)
- `email-templates` (inline HTML)
- `custom-nodes` (inline JS)
- `themes` (inline CSS/HTML)
- `saml` (complex XML + signing keys)
- `remote-servers` (RCS agent config with secrets handling)
- `schedules`
- `service-objects`
- `internal-roles`
- `email-provider`
- `iga-workflows`
- `raw`
- `connector-definitions`, `connector-mappings`
- `secret-mappings`
- `secrets` (sensitive — see risks below)

**Exit criteria:**
- Each scope vendored one at a time, with its own commit series (not batched).
- Every scope has a working pull + push path without spawn.
- Secrets scope gets explicit handling for whether values are emitted to logs (they must not be).

**Estimated effort:** ~1 day per scope, so 14–15 days. Can be interleaved with other work.

---

## Phase 7 — Realm-scoped scopes

**Why separate:** these live under `{configDir}/realms/<realm>/<subdir>` instead of the top-level pattern. Existing `resolveScopeDirs` in `promote-items/route.ts:48-60` already handles this; vendored push/pull functions need the same realm-awareness.

**Scopes in this batch:**
- `authz-policies`
- `oauth2-agents`
- `services`
- `scripts` (already phase 3 — note it's realm-scoped)

**Files to vendor:**
- `src/vendor/fr-config-manager/pull/{scope}.js` × 4 (minus scripts if already done)
- `src/vendor/fr-config-manager/push/update-{scope}.js` × 4

**Route changes:** same routes as earlier phases, now handling the realm-dir layout inside the vendored code rather than at the route.

**Exit criteria:** realm-scoped scopes work per-realm in both push and pull; the route no longer needs to pass realm-aware config dirs.

**Estimated effort:** 3 days.

---

## Phase 8 — Frodo replacement via frodo-lib

**Why separate:** frodo is an independent tool with its own architecture; its lib surface (`@rockcarver/frodo-lib`) is designed for library use. We're not vendoring frodo source — we're adopting its supported library. This eliminates the homebrew frodo dependency.

**Scopes using frodo:** `am-agents`, `oidc-providers`, `variables`.

**Tasks:**
1. `npm install @rockcarver/frodo-lib@^3.3.4` (match the homebrew-installed frodo-cli version).
2. Create `src/vendor/frodo/index.ts` as the typed facade (analogous to fr-config-manager facade).
3. Per-scope functions: `pullAmAgents`, `pushAmAgents`, `pullOidcProviders`, `pushOidcProviders`, `pullVariables`, `pushVariables`.
4. Replace the frodo spawn paths in `promote-items/route.ts` and friends.

**Open questions to resolve during phase 8 plan:**
- frodo-lib requires connection state; does it play well with multiple concurrent environment connections in a single Node process? May need per-request initialization.
- Variables: does frodo-lib round-trip encryption correctly? Currently the app relies on frodo to handle ESV encryption.

**Exit criteria:**
- Homebrew `frodo` is uninstallable without breaking the app.
- All three scopes pull + push via frodo-lib.

**Estimated effort:** 3–4 days (more than a typical vendor phase because frodo-lib has its own mental model to learn).

---

## Phase 9 — Direct-control (DCC) session flow

**Why separate:** for controlled-environment targets (production IDPs), promote doesn't push to IDM directly — it stages into a DCC session and waits for `SESSION_APPLIED`. Currently fr-config-push does the staging when given `--direct-control`, and our route polls DCC endpoints for the session state.

**Scope:**
- Stage-push: `update-direct-control.js` in upstream handles this. Vendor it.
- DCC polling already lives in `src/app/api/dcc/route.ts` — keep.
- Route changes: swap the controlled-push spawn for the vendored staging function, keep the DCC poll/apply unchanged.

**Open questions:**
- Does `update-direct-control.js` send individual item diffs or a full-config dump to DCC's staging endpoint? Read it before planning.

**Exit criteria:**
- A promote to a controlled env uses vendored staging + existing DCC poll, still reaches `SESSION_APPLIED`, and verify passes.

**Estimated effort:** 2 days.

---

## Phase 10 — Cleanup & sunset

Once every scope is vendored:

**Code cleanup:**
- Delete `spawnFrConfig` helper from `src/lib/fr-config.ts`.
- Remove all `import { spawnFrConfig } from "@/lib/fr-config"` statements.
- Delete the `pullCwd` / `pullEnv` construction in `promote-items/route.ts` that was needed only for spawning.
- Audit `src/app/api/**` for any residual `child_process` imports and remove.

**Docs cleanup:**
- Update `README.md` / `AGENTS.md` / setup docs to drop "install fr-config-manager globally" and "brew install frodo-cli" steps.
- Add a short "vendored dependencies" section pointing at `src/vendor/*/UPSTREAM.md`.

**CI / env cleanup:**
- If any CI check assumed a global CLI install, remove that assumption.
- Dev-box setup docs: just `npm install` + env files.

**Verification:**
- `which fr-config-pull fr-config-push frodo` → all missing → the app still works end-to-end on a clean box.
- `git grep -n "fr-config-pull\|fr-config-push"` returns only `src/vendor/fr-config-manager/UPSTREAM.md` and `docs/`.
- `git grep -n "spawn.*frodo\|@rockcarver/frodo-cli"` → nothing.

**Estimated effort:** 1 day.

---

## Cross-cutting concerns

### Token / auth
`src/lib/iga-api.ts:77-116` already exports `getAccessToken(envVars)`. Every vendored function accepts a `token` argument explicitly — never reads env vars. If any upstream code reads `process.env.FRODO_SA_ID` / similar, rewrite at adapter time to take args.

### Logging
Each vendored function takes an optional `log: (line: string) => void` callback. Routes feed these into the existing `{ type: "stdout", data, ts }` emit pipeline so the UI log viewers keep working unchanged.

### Error handling
Vendored functions throw on failure. Upstream often calls `process.exit(1)` — every adapter must strip those calls. Route handlers catch and emit `{ type: "stderr" }` + `{ type: "exit", code: 1 }`.

### Retries
Upstream's `httpRequest` retries 5xx twice. Keep that default. Don't retry 4xx.

### Testing
Project has no working test runner (`vitest` referenced but not installed; existing `.test.ts` files are stale). Every phase's acceptance is **manual verification via the promote UI**. Keep commits small so any regression is obvious in `git bisect`.

### Rollback
Each phase is additive until its final "replace the spawn" commit. If a vendored scope misbehaves, revert just that route-edit commit; the vendored code remains but is unused.

### License & sync
Every vendored file has a header citing upstream version and Apache-2.0. `UPSTREAM.md` lists local patches. When the team wants to sync to a newer upstream: bump the version in `UPSTREAM.md`, re-apply each `LOCAL PATCH` block, diff per-file, commit the diff.

### Next.js server-only boundary
All vendored code imports Node built-ins (`fs`, `path`) and uses axios's `http` adapter. It must only be imported from route handlers (`src/app/api/**`). `next.config.ts` already has `serverExternalPackages: ["axios"]` from phase 1. When adding new vendored deps (e.g. frodo-lib), add them to that array too.

---

## Risks

1. **Undocumented upstream behavior.** fr-config-manager sometimes chains calls in ways the source doesn't make obvious (the "Avoid 404" GET in update-managed-objects is one example). Each phase's planning must read the upstream script top-to-bottom, not just the exported surface.
2. **Secret handling.** Phase 6 includes `secrets`. A vendored push or pull that logs the secret value is a security incident. Mandatory during that phase: explicit review of every log call.
3. **Breaking promote for an active user.** Each phase's final "replace the spawn" commit is the risky one. Schedule each phase so the user can hold off on promotes against that scope for a day while the new code bakes, or test on a throwaway env first.
4. **frodo-lib init cost.** frodo-lib can be slow on first call (loads connection state). Measure before and after phase 8; if meaningful, cache the connection keyed by environment.
5. **Vendoring churn vs YAGNI.** If a scope in phase 5 or 6 has never been promoted in the last six months, consider marking it "spawn-only" indefinitely rather than vendoring it. Complete replacement is the stated goal, but scope-level YAGNI still applies.
6. **Upstream updates.** Every commit to a vendored file needs to re-apply when syncing upstream. Minimize the diff size of the adapter changes so syncs are cheap. Pin an upstream version in UPSTREAM.md and sync no more than quarterly.

---

## Execution policy

- One phase per session. Write the per-phase plan doc before touching code.
- Each phase ends with `git log` having a clearly attributable series of commits.
- Phases 3–9 are largely parallelizable — two engineers could each take separate scopes in phase 5 or 6 without stepping on each other. In practice, single-engineer serial is simpler.
- Re-evaluate the whole plan after phase 5 completes. If scope-by-scope churn feels unjustified, consider stopping early and leaving the long tail of unused scopes on spawn.

---

## Summary timeline (rough, single-engineer)

| Phase | Content | Days |
|---|---|---|
| 3 | Scripts | 1 |
| 4 | Journeys | 2 |
| 5 | Simple JSON scopes (batch) | 3 |
| 6 | Complex scopes (one at a time) | 14 |
| 7 | Realm-scoped | 3 |
| 8 | Frodo → frodo-lib | 4 |
| 9 | Direct-control | 2 |
| 10 | Cleanup | 1 |
| **Total** | | **~30 days** |

This is a month of focused work. Committing to the full replacement is a real investment — the per-phase exit criteria give you off-ramps if priorities change.
