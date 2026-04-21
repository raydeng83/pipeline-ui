# Data tab — deferred follow-ups

Items raised during the `data-tab` feature review that we intentionally
parked. None are blockers for merge; each can be its own small spec/PR
when revisited.

## Correctness & polish

1. **429 backoff off-by-one in pull-runner** (M1)
   `src/lib/data/pull-runner.ts` retries 429 twice (5s, 10s) then fails, but
   the spec called for 5s/10s/20s/fail. The `attempt > MAX_RETRIES` check
   runs after the increment, so the 20s attempt is skipped. Bump the retry
   budget or reorder the check so all three backoff windows actually run.

2. **Progress persistence cadence** (M3)
   Pull runner persists progress once per 1000-record page; spec called for
   every 100. Low-impact UX — finer-grained poll updates during long types.

3. **Stale-fetch race — export memory pressure** (I3)
   `src/app/api/data/export/[env]/[type]/route.ts` loads every matching
   record into an in-memory array before streaming. The `ReadableStream`
   gets chunked delivery to the browser but server-side memory is still
   `O(N * avg record size)`. For very large types this is a real ceiling.
   Refactor to iterate files and enqueue per-row.

## UX

4. **Global banner → useBusyState wiring** (M2)
   `GlobalJobBanner` polls job state but doesn't mark the app busy. The
   NavBar's "leave page? progress will be lost" confirm fires off
   `useBusyState`; an active server-side pull doesn't trigger it. Low
   friction since the job runs server-side regardless, but the UX is
   inconsistent with how other long-running ops in the app behave.

5. **Greyed type tabs + preselect deep-link** (M5)
   Browse shows only types that have a snapshot. Spec envisioned greyed
   tabs for schema-defined types with no snapshot, each linking to
   `/data/pull?preselect=<type>` to kick off a focused pull. `PullPanel`
   would read `?preselect=` and pre-check that one type.

## Security / correctness

6. **env param path-traversal hardening** (repo-wide pattern)
   The data-tab API routes concatenate `env` URL/body params directly into
   `path.join(cwd(), "environments", env, ...)`. This matches an existing
   pattern in `/api/dcc`, `/api/environments/restart`, etc. Tight the
   validation project-wide: allow only known env names (from
   `getEnvironments()`) or an alphanumeric whitelist.
