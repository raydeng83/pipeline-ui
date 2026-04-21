# Data Tab — Design

A new top-level **Data** tab for pulling managed object records from an AIC
tenant to local disk and browsing them. Read-only, per-environment, with
long-running pulls running as background jobs the user can navigate away from.

## Goals

- Let a user look up a specific record (by name / ID / email) in a tenant's
  managed object store, and see the full record.
- Let a user browse and export (JSON / CSV) subsets of records for offline
  analysis.
- Support pulls that take minutes without blocking the rest of the app — the
  user can kick off a pull and keep using other tabs.

## Non-goals (MVP)

- Cross-environment side-by-side comparison of records.
- Writing or promoting records to a tenant.
- A CREST `_queryFilter` builder on pull.
- Manually deleting snapshots from the UI.
- Resuming an interrupted pull after a server restart.

These are deliberately parked. Each could become a follow-up spec.

## High-level decisions

| Decision | Choice | Why |
|---|---|---|
| Use cases | Lookup + bulk browse/export | Driven by user request. |
| Env model | One env at a time | Matches existing Pull/Analyze UX; sidesteps cross-tenant ID reconciliation. |
| Fetch model | Explicit snapshot to disk | User wanted "pull" semantics, not live queries. |
| Pull shape | User picks subset of types (with select-all) | Avoids pulling 100k+ records by accident; mirrors existing ScopeSelector. |
| Concurrency | One job per env, N envs in parallel | Rate-limit protection per tenant; still lets a user snapshot multiple envs at once. |
| Browse UI | List + detail split | Lookup-first experience matching `ESVOrphanReportView`. |
| Async jobs | Server-side registry, browser polls | User navigates freely; jobs survive page navigation within one Node process. |
| Tab layout | `/data/browse` and `/data/pull` sub-tabs | Full-screen views; browsing doesn't fight with pull controls for space. |

## Architecture at a glance

```
  ┌─────────────────────────────────────────────────────────────┐
  │  UI (/data)                                                 │
  │  ┌─────────────────┐  ┌─────────────────────────────────┐  │
  │  │  /data/pull     │  │  /data/browse                   │  │
  │  │  • type picker  │  │  • type tabs with record counts │  │
  │  │  • Start / Abort│  │  • filter + paginated list      │  │
  │  │  • Job list     │  │  • full-JSON detail pane        │  │
  │  └─────────────────┘  │  • Export (JSON / CSV)          │  │
  │         ▲ ▲           └─────────────────────────────────┘  │
  │         │ └────── GlobalJobBanner (on every page)          │
  └─────────┼───────────────────────────────────────────────────┘
            │ fetch/poll
  ┌─────────┼───────────────────────────────────────────────────┐
  │  API routes under src/app/api/data/                         │
  │    pull, jobs, snapshots, records, export                   │
  └─────────────────────────────────────────────────────────────┘
            │
  ┌─────────┼───────────────────────────────────────────────────┐
  │  Server-side lib (src/lib/data/)                            │
  │    pull-runner.ts   — paginated /openidm/managed query       │
  │    job-registry.ts  — in-memory Map + disk-mirrored state    │
  │    snapshot-fs.ts   — read/list/search local snapshots       │
  │    display-fields.ts — derive title/subtitle/search fields   │
  │  Reuses: getAccessToken(), getEnvironments(), getConfigDir() │
  └─────────────────────────────────────────────────────────────┘
            │
  ┌─────────┼───────────────────────────────────────────────────┐
  │  Disk layout (per environment)                              │
  │  environments/<env>/managed-data/                           │
  │    .jobs/<jobId>.json          ← progress mirror            │
  │    alpha_user/                                              │
  │      _manifest.json            ← pull timestamp + count     │
  │      <id>.json                 ← one file per record        │
  │    alpha_role/...                                           │
  │                                                             │
  │  managed-data/ is added to .gitignore (PII).                │
  └─────────────────────────────────────────────────────────────┘
```

Key properties:

- **Job lifecycle is server-side.** Browser polls; navigating away is safe
  because the job runs in the Node process, not in the page.
- **One-per-env lock** enforced by `job-registry.ts`. Starting a second pull
  against the same env returns `409 Conflict` with the existing job ID.
- **Disk format mirrors how config is stored** (one JSON per item), so the
  existing Browse tab could later surface managed data without restructuring.
- **No git publication of PII:** `managed-data/` gets gitignored.

## The job runner (`src/lib/data/`)

### Job shape

```ts
type JobStatus = "queued" | "running" | "aborting"
               | "completed" | "failed" | "aborted";

type PerTypeProgress = {
  type: string;
  status: "pending" | "running" | "done" | "failed";
  fetched: number;       // records pulled so far
  total: number | null;  // null until first page returns totalPagedResults
  error?: string;
};

type DataPullJob = {
  id: string;            // uuid v4
  env: string;
  types: string[];
  startedAt: number;     // ms epoch
  finishedAt?: number;
  status: JobStatus;
  progress: PerTypeProgress[];
  fatalError?: string;   // only set when status === "failed"
};
```

### One-per-env lock

`job-registry.ts` holds a `Map<envName, DataPullJob>`.
`startJob(env, types)` throws a typed `JobConflictError` when an active job
(`queued | running | aborting`) already exists for that env. The API layer
translates this to `409 Conflict` with the conflicting job ID so the UI can
link to it.

### Paginated fetch + token

Pattern borrowed from `src/lib/fr-config.ts` (the `spawnFrConfig` retry loop):

- One `getAccessToken(envVars)` call at job start.
- Per-page:
  `GET {TENANT_BASE_URL}/openidm/managed/{type}?_queryFilter=true&_pageSize=1000&_pagedResultsCookie=...`
  with `Authorization: Bearer <token>`.
- **401 / 403:** re-mint token once and retry that page (matches the
  `needsAuthRefresh` branch in `fr-config.ts`).
- **429:** exponential backoff `5s, 10s, 20s` then fail the type.
- **5xx / network:** up to `MAX_RETRIES=2` with `RETRY_DELAY_MS=3000`, same
  constants as the CLI runner.
- Loop until the response has no `pagedResultsCookie`.

### Atomic per-type writes

Records stream into
`managed-data/<env>/.pulling-<jobId>/<type>/<id>.json` during a run.
When the type finishes successfully:

1. If a previous snapshot exists at `managed-data/<env>/<type>/`, rename it to
   `.prev-<jobId>-<type>/` (atomic on POSIX, same filesystem).
2. Rename `.pulling-<jobId>/<type>/` to `managed-data/<env>/<type>/`.
3. Write `_manifest.json` (`{ type, pulledAt, count, jobId }`).
4. Delete `.prev-<jobId>-<type>/`.

On type failure or job abort, the `.pulling-<jobId>/<type>/` dir is deleted
and the previous snapshot (if any) is untouched. Browse never sees a
half-written type.

### Progress persistence

Every 100 records and on every type transition, the current `DataPullJob`
JSON is written to `environments/<env>/managed-data/.jobs/<jobId>.json`. On
server start, `job-registry.ts` scans this directory: any job still in a
non-terminal state is marked `failed` with `fatalError: "server restart"`,
and any corresponding `.pulling-…` directories are cleaned up.

### Abort

`DELETE /api/data/jobs/:id` flips `status` to `aborting` and calls
`AbortController.abort()` on the fetch loop's controller. The loop checks the
signal between pages; terminal state is `aborted`; `.pulling-…` cleanup runs.

## API routes

Under `src/app/api/data/`. Shapes match the app's existing `{ error }`
envelope style. No auth (local dev server).

### Pull and jobs

```
POST   /api/data/pull
  body: { env: string, types: string[] }
  → 202 { jobId }
    or 409 { jobId, status }  (env already has an active job)

GET    /api/data/jobs?env=<opt>&includeFinished=true
  → { jobs: DataPullJob[] }  (sorted startedAt desc, capped at 20)

GET    /api/data/jobs/:id
  → DataPullJob              (the browser's polling endpoint, 2s cadence)

DELETE /api/data/jobs/:id
  → 204                       (flips to aborting)
```

### Browse

```
GET /api/data/snapshots/:env
  → { types: { name: string, count: number, pulledAt: number }[] }
  Scans managed-data/<env>/*/_manifest.json.

GET /api/data/records/:env/:type?q=&page=1&limit=50&sort=<field>
  → { total, page, limit, records: { id, title, subtitle }[] }
  q filters across schema-derived indexed fields. raw JSON omitted; fetched
  on demand via the detail endpoint.

GET /api/data/records/:env/:type/:id
  → { id, record: <full JSON> }
```

### Export

```
GET /api/data/export/:env/:type?q=&format=json|csv
  → streams application/json or text/csv
  - JSON: streamed array, record-per-chunk, to avoid loading 10k rows at once.
  - CSV: header row = union of top-level scalar fields across matching rows;
         nested objects/arrays become JSON-stringified cells.
  - Content-Disposition: attachment; filename="<env>-<type>-<yyyymmdd>.<ext>"
```

### Route-level decisions

- **Server-side search over local files, not client-side.** A 10k-record
  type at ~2 KB each is 20 MB — too big to ship to the browser for each
  keystroke. The endpoint scans the on-disk snapshot's indexed fields.
- **No tenant-side `_queryFilter`** in browse. Every browse call reads the
  local snapshot only. To re-pull with a filter, you go to the Pull tab.
  Keeps the two tabs cleanly separated.
- **No snapshot deletion endpoint.** MVP skips it; users can `rm -rf` the
  directory. Revisit if it becomes a papercut.

## UI components

### File layout

```
src/app/data/
  layout.tsx                 ← sub-tab strip (Browse | Pull)
  page.tsx                   ← redirect("/data/browse")
  browse/
    page.tsx                 ← server: reads snapshots list
    BrowsePanel.tsx          ← client: type tabs + list/detail split
    RecordDetailPane.tsx     ← client: JSON viewer wrapper
  pull/
    page.tsx                 ← server: reads types from schema
    PullPanel.tsx            ← client: type checklist + Start + active job
    JobCard.tsx              ← client: one job's live progress

src/components/
  GlobalJobBanner.tsx        ← mounted in root layout; shown when any job active
  SubTabNav.tsx              ← reusable sub-tab pill strip
  JsonTreeView.tsx           ← collapsible JSON tree for record detail
                               (fallback to FileContentViewer for huge records)

src/hooks/
  useDataPullJobs.ts         ← polls /api/data/jobs; exposes jobs + actions
  useSnapshotRecords.ts      ← paginated list fetch with debounced search
```

### `/data/browse`

```
┌──────────────────────────────────────────────────────────────────────┐
│ Type tabs: [alpha_user (8,214)] [alpha_role (412)] [alpha_group…]    │
├──────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌────────────────────────────────────┐ │
│ │ [ search: alice@… ]  ⌫  │  │ alpha_user / 7f3e-…                │ │
│ │ ─────────────────────── │  │ ──────────────────────────────── ⭳ │ │
│ │ ◉ alice@example.com     │  │ { "_id": "7f3e-…", … }             │ │
│ │   Alice Smith · active  │  │                                    │ │
│ │ ○ alex@example.com      │  │                                    │ │
│ │   Alex Johnson · active │  │                                    │ │
│ │ ─────────────────────── │  │                                    │ │
│ │ Page 1 / 165  [Export]  │  │                                    │ │
│ └─────────────────────────┘  └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

- **Type tabs** derived from `/api/data/snapshots/:env`. Types with no
  snapshot appear greyed with a "Pull to populate" link that deep-links to
  `/data/pull?preselect=<type>`.
- **Search box** debounces 200 ms and calls
  `/api/data/records/...?q=`. No client-side filter over 10k records.
- **List item** shows two schema-derived display fields (title + subtitle)
  from `display-fields.ts`.
- **Detail pane** uses a new `JsonTreeView` with a fallback to the existing
  `FileContentViewer` for records >1 KB.
- **Export button** triggers
  `GET /api/data/export/...?q=<current>&format=…` as a streaming download. A
  small modal picks JSON vs CSV.

### `/data/pull`

```
┌──────────────────────────────────────────────────────────────────────┐
│ Environment: [uat ▾]                                                 │
│                                                                      │
│ Types to pull   [✓ Select all] [◻ Deselect all]                      │
│  ☑ alpha_user          ☑ alpha_role          ☐ alpha_assignment      │
│  ☑ alpha_group         ☐ alpha_organization  ☐ alpha_application     │
│                                                                      │
│  [ Start pull ]   ← disabled when env already has an active job      │
├──────────────────────────────────────────────────────────────────────┤
│ Active & recent jobs                                                 │
│  ▸ uat  · running   · started 2m ago · [Abort]                       │
│      alpha_user   ▓▓▓▓▓▓▓▓▓▓░░░░░░ 6,412 / ~10,000                  │
│      alpha_role   ░░░░░░░░░░░░░░░░ pending                           │
│  ▸ ide3 · completed · 14:22 · 412 + 22 records                       │
│  ▸ sit  · aborted   · 14:05                                          │
└──────────────────────────────────────────────────────────────────────┘
```

- Checklist is seeded from the managed-object schema on disk for the env
  (same source the `/analyze` Managed Objects task reads).
- Select-all / Deselect-all toggle the whole list; individual checkboxes
  still work.
- Active job renders a `JobCard` per in-flight job. Poll every 2 s via
  `useDataPullJobs`.

### Global job banner

```
[ 2 data pulls in progress — uat · ide3 · click to view ]
```

- Rendered in `src/app/layout.tsx` between `<NavBar />` and `<main>`.
- Polls `/api/data/jobs?includeFinished=false` every 3 s.
- Clicking routes to `/data/pull`.
- Hidden when no active jobs.
- Uses `useBusyState` so the existing nav's unsaved-work confirm fires
  consistently.

### Why these separate components

- `JsonTreeView` and `GlobalJobBanner` are independently useful: record
  detail could later be reused in a compare-across-envs feature, and the
  banner pattern can front any future long-running job (e.g., a slow
  `/analyze` run).
- `useSnapshotRecords` and `useDataPullJobs` are separate hooks because
  their polling cadences and error modes differ (snapshot reads are
  on-demand; job polling is periodic).

## Display-field derivation

`src/lib/data/display-fields.ts` reads the type's managed-object schema from
`<configDir>/managed-objects/<type>/<type>.json` and produces:

```ts
type DisplayFields = {
  title: string;        // e.g. "userName" or falls back to "_id"
  subtitle?: string;    // e.g. "mail" or "description"
  searchFields: string[]; // fields the server-side search considers
};
```

Rules:

- **Title:** first of `userName`, `name`, `_title`, `displayName`; else `_id`.
- **Subtitle:** first of `mail`, `description`, `sn`, `givenName` (skipping
  any already used for title). Optional.
- **Search fields:** any schema property with `searchable: true` and a
  scalar type (`string`, `number`, `boolean`). Falls back to `[title, subtitle]`
  if the schema doesn't mark any as searchable.

When schema is missing (pulled type no longer in config), display falls back
to `_id` for title and the first string field in the record for subtitle.

## Error handling

| Where | What can fail | How we handle it |
|---|---|---|
| Job start | No envs, no schema on disk, env already has an active job | Block with clear message; `409` for the duplicate case |
| Token mint | Bad/expired JWK, clock skew, network to `/am/oauth2/…` down | Catch, mark job `failed` with `fatalError`, no partial writes |
| Per-page fetch | 401/403, 429, 5xx, network blip | 401/403 → re-mint once; 429 → 5/10/20s backoff then fail type; 5xx/network → `MAX_RETRIES=2` with 3s delay |
| Disk write | Full disk, permission denied | Abort job, mark type `failed`, previous snapshot untouched |
| Schema drift | Pulled type no longer in schema | Keep snapshot; tab shows "⚠ no schema"; fall back to `_id` + first string field |
| Browse while pulling | Race between rename and a detail read | Directory rename is atomic on same FS; any one response is self-consistent |
| Empty snapshot | Browse before any pull | Empty state CTA linking to `/data/pull` |
| Very large record | Record > 2 MB | `JsonTreeView` collapses objects >1 KB; "Raw JSON" toggle swaps to `FileContentViewer` |
| Server restart mid-job | Node died with jobs `running` | On init, scan `.jobs/*.json`; non-terminal entries → `failed (server restart)`; `.pulling-…` dirs cleaned up |

## Verification plan

**Unit tests** (vitest, added alongside the code):

- `src/lib/data/display-fields.test.ts` — schema → title/subtitle/search-field
  derivation, covering user / role / custom / unknown types.
- `src/lib/data/snapshot-fs.test.ts` — list + paginated read + substring
  search; empty, single-record, and synthetic 10k-record fixtures.
- `src/lib/data/pull-runner.test.ts` — `fetch` mocked via `vi.fn()`: happy
  path, 401-then-200, 429 backoff, 5xx exhaust retries, abort mid-page,
  atomic rename on success, cleanup on failure.
- `src/lib/data/job-registry.test.ts` — one-per-env lock, disk persistence,
  stale-job cleanup on init.

**Integration tests** (`tests/api/data/*.test.ts`):

- POST → GET → DELETE lifecycle, asserting on-disk state after each step.
- Browse endpoints over a fixture `managed-data/` tree.

**Manual UI verification** (React components aren't unit-tested per
`vitest.config.ts`):

- Kick off a pull in `ide3`, navigate to `/analyze`, come back — job still
  shows live progress.
- Start a second pull in the same env — rejected with 409; UI shows
  "already running" with a link to the active job.
- Start pulls in `ide3` and `uat` concurrently — both run; banner shows
  "2 in progress".
- Abort mid-job — `.pulling-<id>/` cleanup verified in the terminal.
- Browse a pulled type, search, open a record, export visible rows as CSV
  and as JSON.
- Kill `next dev` mid-job, restart — job marked `failed (server restart)`
  on next load.

## File summary

**New**

- `src/app/data/layout.tsx`
- `src/app/data/page.tsx`
- `src/app/data/browse/page.tsx`
- `src/app/data/browse/BrowsePanel.tsx`
- `src/app/data/browse/RecordDetailPane.tsx`
- `src/app/data/pull/page.tsx`
- `src/app/data/pull/PullPanel.tsx`
- `src/app/data/pull/JobCard.tsx`
- `src/components/GlobalJobBanner.tsx`
- `src/components/SubTabNav.tsx`
- `src/components/JsonTreeView.tsx`
- `src/hooks/useDataPullJobs.ts`
- `src/hooks/useSnapshotRecords.ts`
- `src/lib/data/pull-runner.ts` + test
- `src/lib/data/job-registry.ts` + test
- `src/lib/data/snapshot-fs.ts` + test
- `src/lib/data/display-fields.ts` + test
- `src/app/api/data/pull/route.ts`
- `src/app/api/data/jobs/route.ts`
- `src/app/api/data/jobs/[id]/route.ts`
- `src/app/api/data/snapshots/[env]/route.ts`
- `src/app/api/data/records/[env]/[type]/route.ts`
- `src/app/api/data/records/[env]/[type]/[id]/route.ts`
- `src/app/api/data/export/[env]/[type]/route.ts`
- `tests/api/data/*.test.ts`

**Modified**

- `src/components/NavBar.tsx` — add `{ href: "/data", label: "Data" }`.
- `src/app/layout.tsx` — mount `<GlobalJobBanner />` between `<NavBar />`
  and `<main>`.
- `.gitignore` — add `environments/*/managed-data/` (PII).
