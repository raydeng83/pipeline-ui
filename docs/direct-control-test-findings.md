# `--direct-control` end-to-end test findings

Date: 2026-04-15
Tenant under test: `temp-dcc` (`openam-commkent-temp-dcc-test.forgeblocks.com`)
Source environment: `ide3`
CLI: `fr-config-push` (Ping / ForgeRock `@forgerock/fr-config-manager`)

## Goal

Verify that `fr-config-push --direct-control` (`-C`) works end-to-end against a controlled Advanced Identity Cloud tenant for three scopes that were previously untested:

1. `connector-mappings` (IDM sync mappings)
2. `connector-definitions` (connector provisioner config, e.g. `provisioner.openicf-<name>`)
3. `remote-servers` (RCS registration on the tenant side, `provisioner.openicf.connectorinfoprovider`)

Each test runs the full DCC cycle:
`direct-control-state` → `direct-control-init` → poll until `SESSION_INITIALISED` → `fr-config-push <scope> -C` → `direct-control-apply` → poll until `SESSION_APPLIED`.

## Background: how RCS actually works (from Ping docs)

- An **RCS (Remote Connector Server)** is a Java process that runs *outside* the tenant, configured via its own `ConnectorServer.properties` file. It registers with the tenant via a WebSocket to `wss://<tenant-fqdn>/openicf/0`.
- The **`remote-servers` fr-config-push scope is tenant-side metadata only**. The file it pushes (`provisioner.openicf.connectorinfoprovider.json`) lives at `/openidm/config/provisioner.openicf.connectorinfoprovider` and just declares the RCS *names* the tenant expects to see (`remoteConnectorClients`, `remoteConnectorClientsGroups`). Writing it does not start, stop, or reconfigure any RCS process.
- **Connector definitions** (`provisioner.openicf-<name>.json`) reference an RCS by `connectorHostRef`. The definition itself is tenant config; the referenced RCS may or may not actually be connected.
- **Connector mappings** (sync mappings) are pure IDM config and reference connectors by system name. Dormant if the referenced connector doesn't exist.
- **Direct Configuration Control (mutable config)** is a generic wrapper around `/openidm/config/*` PUTs. The CLI flag `-C / --direct-control` adds the header `X-Configuration-Type: mutable`. The docs do not carve out any resource type as unsupported.

## Results

### 1. `connector-mappings` — BLOCKED (not by `--direct-control`)

Command: `fr-config-push connector-mappings -C -n UserIdentityDataLoad`

Wire-level observation: the CLI's **first** request is a `GET /openidm/config/sync` (to read the existing mappings list before merging). temp-dcc returned **404 Not Found** on that GET because temp-dcc had no `sync` config resource at all.

```
code: ERR_BAD_REQUEST
status: 404
url: https://openam-commkent-temp-dcc-test.forgeblocks.com/openidm/config/sync
headers.X-Configuration-Type: mutable   ← flag IS propagated
```

**Verdict:** the `-C` flag was delivered correctly. The failure is a CLI prerequisite: `connector-mappings` assumes `/openidm/config/sync` already exists on the target tenant. Inconclusive as a DCC test — blocked by a missing tenant resource.

### 2. `connector-definitions` — CLI flag delivered, tenant rejected

Command: `fr-config-push connector-definitions -C -n kyexternalgov`

Source file: `environments/ide3/config/ide3/sync/connectors/kyexternalgov.json` (LDAP connector targeting `eide.extdev.ky.gov`, `connectorHostRef: rcs-cluster-external`).

Wire-level observation:

```
method: PUT
url: https://openam-commkent-temp-dcc-test.forgeblocks.com/openidm/config/provisioner.openicf/kyexternalgov
headers.X-Configuration-Type: mutable   ← flag IS propagated
code: ERR_BAD_RESPONSE
status: 500
```

The request body included an encrypted `credentials` block with
`purpose: "idm.config.encryption"`, `stableId: "openidm-sym-default"`.

**Verdict:** `-C` flag works. The 500 is tenant-side. Most likely causes:

- temp-dcc's symmetric encryption key (`openidm-sym-default`) differs from ide3's, so the tenant cannot decrypt the credentials block. In a real promote flow an ESV / credential re-encryption step would be required beforehand.
- `connectorHostRef: rcs-cluster-external` is declared in temp-dcc's `remoteConnectorClientsGroups` but no actual RCS process is currently connected under that name, so the tenant may reject the provisioner validation.

Either cause is orthogonal to DCC. Test inconclusive for DCC purposes but **no evidence that `/mutable` rejects the scope itself**.

### 3. `remote-servers` — ✅ FULL END-TO-END SUCCESS

Command: `fr-config-push remote-servers -C`

To avoid behavioral drift on the tenant, the local file was first refreshed with the tenant's current state via `fr-config-pull remote-servers`, then pushed back **unchanged** — a deliberate no-op from a content perspective, purely to exercise the DCC plumbing.

Wire-level observation:

```
method: PUT
url: https://openam-commkent-temp-dcc-test.forgeblocks.com/openidm/config/provisioner.openicf.connectorinfoprovider
headers.X-Configuration-Type: mutable
status: 200 OK
CLI output: "Updating Remote Connector Servers"
```

Apply phase: `fr-config-push direct-control-apply`, followed by manual state polling.

**New state transitions observed that are NOT documented in our earlier notes:**

```
SESSION_INITIALISED
   ↓  (push -C)
   ↓  (direct-control-apply)
MUTABLE_RESTART_REQUESTED        ← ~10-50 s
MUTABLE_RESTART_PROGRESSING      ← ~60-170 s
SESSION_APPLY_REQUESTED          ← ~180-230 s
SESSION_APPLYING                 ← ~240-615 s
SESSION_APPLIED                  ← ~625 s
```

Total apply wall-clock: **~10 minutes, 25 seconds** for a no-op `remote-servers` push. A content change would likely take at least as long.

**Verdict: `--direct-control` works end-to-end for `remote-servers`.**

## Key finding — `remote-servers` apply triggers a tenant restart

The `MUTABLE_RESTART_REQUESTED` / `MUTABLE_RESTART_PROGRESSING` states are unique to this scope in our testing. They indicate the tenant performs an internal service restart as part of applying an RCS config change. This matches the operational reality that `provisioner.openicf.connectorinfoprovider` is loaded into IDM's openicf subsystem at startup.

Implications for the pipeline-ui app:

1. **The 360 s apply poll budget in `PromoteExecution.tsx` is too short.** It will time out on any promote that includes `remote-servers` scope. A ~10-minute completion was observed empirically; allow at least **900 s** for this scope, or poll indefinitely with a user-visible elapsed-time indicator.
2. **The UI gives no warning that a `remote-servers` promote will restart the tenant.** For controlled environments, this is an operational event that users should see before they click confirm. Recommendation: when a promote task's scope list contains `remote-servers`, show a dedicated warning banner in the dry-run → promote confirm dialog explaining the restart and its expected duration.
3. **Other scopes may have similar restart behavior.** We have not exhaustively tested scopes like `policies`, `conditions`, `auth-trees`, or `services`. Worth empirically re-running the DCC cycle for any scope where users have reported "apply takes forever". The new state constants to watch for are `MUTABLE_RESTART_REQUESTED` and `MUTABLE_RESTART_PROGRESSING`.

## Known failure modes (not DCC bugs)

| Failure | Cause | Fix |
|---|---|---|
| `connector-mappings` GET returns 404 on `/openidm/config/sync` | Target tenant has no sync config resource at all | Tenant must have at least an empty `/openidm/config/sync` before connector-mappings can be pushed. Solved in practice by having done at least one prior push of any mapping through normal channels. |
| `connector-definitions` PUT returns 500 | Likely encrypted credentials block references a symmetric key that differs across environments; or the referenced `connectorHostRef` has no live RCS | Re-encrypt credentials against target tenant's key before promoting, or use ESV references. Also ensure any referenced RCS name exists in `remoteConnectorClientsGroups` on the target. |

## DCC state cheat sheet (from empirical observation)

These are the states I have actually seen fr-config-push emit for temp-dcc:

- `NO_SESSION` — no active session; safe to init
- `SESSION_INITIALISE_REQUESTED` — init just accepted; **editable=true** at this point but writes still fail (403)
- `SESSION_INITIALISING` — tenant provisioning the session; **editable=false**; ~130–190 s elapsed for scripts, same for mappings
- `SESSION_INITIALISED` — ready for `-C` pushes
- `SESSION_APPLY_REQUESTED` — apply command accepted
- `SESSION_APPLYING` — commit in progress
- `SESSION_APPLIED` — committed to live tenant
- `SESSION_ABORT_REQUESTED` — abort accepted
- `MUTABLE_RESTART_REQUESTED` *(new)* — tenant scheduled an internal restart (observed on `remote-servers` apply)
- `MUTABLE_RESTART_PROGRESSING` *(new)* — tenant restart in progress

**Abortable states** (a `direct-control-abort` is still meaningful):
`SESSION_INITIALISE_REQUESTED`, `SESSION_INITIALISING`, `SESSION_INITIALISED`.

**Not abortable** (either nothing to undo or too late):
`NO_SESSION`, `SESSION_APPLY_REQUESTED`, `SESSION_APPLYING`, `MUTABLE_RESTART_REQUESTED`, `MUTABLE_RESTART_PROGRESSING`, `SESSION_APPLIED`, `SESSION_ABORT_REQUESTED`.

## Recommended follow-up work for pipeline-ui

1. **Raise apply poll window conditionally.** Default 360 s is fine for IDM config, scripts, journeys etc. Bump to 900 s when scope list includes `remote-servers` (and any other scope we later discover needs a tenant restart).
2. **Show restart warning in promote confirm dialog** when `remote-servers` is in the scope list.
3. **Add `MUTABLE_RESTART_REQUESTED` and `MUTABLE_RESTART_PROGRESSING` to the Abort gating set as "not abortable"** in `PromoteExecution.tsx` (currently implicit because they're outside the abortable set, but making them explicit in the comments helps future maintainers).
4. **Render the DCC state pill prominently** during apply with elapsed time so users aren't tempted to click Abort on a legitimately-slow restart.
5. **For `connector-mappings`**, consider pre-flighting a GET on `/openidm/config/sync` as part of the dry-run; if 404, block the promote with a clear error message explaining the tenant prerequisite rather than letting the CLI fail opaquely during push.
6. **For `connector-definitions` with encrypted credentials**, document the expected symmetric-key precondition and consider adding a precheck that scans the source file for encrypted credentials and warns the user.

## How to reproduce

From a shell with fr-config-push installed and CWD = `environments/temp-dcc` (or any env whose `.env` matches temp-dcc):

```bash
# 1. Stage source file into target working tree
cp ../ide3/config/ide3/sync/rcs/provisioner.openicf.connectorinfoprovider.json \
   ./config/sync/rcs/provisioner.openicf.connectorinfoprovider.json

# 2. Init session (or skip if already SESSION_INITIALISED)
fr-config-push direct-control-init

# 3. Poll state until SESSION_INITIALISED (~130-190 s typical)
while true; do
  s=$(fr-config-push direct-control-state | jq -r .status)
  echo "$(date +%H:%M:%S) $s"
  [ "$s" = "SESSION_INITIALISED" ] && break
  sleep 10
done

# 4. Push with -C
fr-config-push remote-servers -C

# 5. Apply
fr-config-push direct-control-apply

# 6. Poll state until SESSION_APPLIED (~10 minutes for remote-servers)
while true; do
  s=$(fr-config-push direct-control-state | jq -r .status)
  echo "$(date +%H:%M:%S) $s"
  [ "$s" = "SESSION_APPLIED" ] && break
  [ "$s" = "SESSION_ABORTED" ] && break
  sleep 15
done
```

Alternatively call `direct-control-apply --wait` which blocks until the session reaches a terminal state (it prints the intermediate `Status:` lines we saw earlier). Either approach works.
