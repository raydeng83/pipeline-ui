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

---

## Addendum — sandbox1 precursor tests (non-controlled env)

Date: 2026-04-15 (same session as above, later)
Tenant: `sandbox1` (`openam-commkentsb1-useast1-sandbox.id.forgerock.io`)
Goal: work out the exact mechanics of creating a brand-new RCS entry and a brand-new connector definition on a non-controlled environment first, to know the steps that work before retrying them through `--direct-control` on temp-dcc.

All pushes below were run **without** `-C` / `--direct-control`.

### 1. Creating a new RCS entry (`rcs-le-test`) — SUCCESS

Read-modify-write on the monolithic `provisioner.openicf.connectorinfoprovider` file:

```bash
cd environments/sandbox1
fr-config-pull remote-servers
jq '.remoteConnectorClients += [{"clientId":"RCSClient","enabled":true,"name":"rcs-le-test","useSSL":true}]' \
  config/sync/rcs/provisioner.openicf.connectorinfoprovider.json > /tmp/updated.json
mv /tmp/updated.json config/sync/rcs/provisioner.openicf.connectorinfoprovider.json
fr-config-push remote-servers
# → "Updating Remote Connector Servers"
```

Verified visible in admin console under **Identities → Connect → Connector Servers**. No RCS process was started under that name — the entry is pure tenant metadata declaring an expected RCS.

**Takeaway**: creating / updating / removing entries in `remote-servers` is a regular monolithic file write. Deletes happen by removing the entry from `remoteConnectorClients` locally and re-pushing (because the whole file is one tenant resource).

### 2. Creating a new connector definition (`le-test`) — initial 500, fixed by switching `connectorHostRef`

First attempt with the new connector pointing at the new RCS we'd just created:

```json
// config/sync/connectors/le-test.json
{
  "_id": "provisioner.openicf/le-test",
  "connectorRef": {
    "bundleName": "org.forgerock.openicf.connectors.ldap-connector",
    "bundleVersion": "[1.5.20.12,1.6.0.0)",
    "connectorHostRef": "rcs-le-test",
    "connectorName": "org.identityconnectors.ldap.LdapConnector",
    "displayName": "LDAP Connector",
    "systemType": "provisioner.openicf"
  },
  "enabled": false,
  "configurationProperties": {
    "host": "ldap.example.invalid",
    "port": 636,
    "ssl": true,
    "baseContexts": ["DC=example,DC=invalid"],
    "principal": "cn=test,dc=example,dc=invalid",
    "credentials": "dummy-password-123",
    ...
  }
}
```

```bash
fr-config-push connector-definitions -n le-test
```

**Result:** HTTP 500 with this very specific error message from the tenant:

```
No meta-data provider available yet to create and encrypt configuration
for provisioner.openicf/le-test, retry later.
```

**Root cause:** when the tenant creates a new connector definition, it needs to fetch connector schema metadata from the referenced RCS to validate the config and encrypt the credentials field. If no live RCS process is currently connected under the name in `connectorHostRef`, the tenant has nothing to query → "no meta-data provider available yet" → 500.

`rcs-le-test` was a metadata-only entry we'd just created in step 1; nobody was actually running an RCS process under that name. So the tenant had no meta-data provider for it.

**Fix:** point the new connector at an `connectorHostRef` whose RCS is *actually* connected to the tenant. Sandbox1 has a live RCS under `rcs-cluster-external` (used by the existing `kyexternalgov` connector). Switching to that reference:

```json
"connectorHostRef": "rcs-cluster-external"
```

Then retry:

```bash
fr-config-push connector-definitions -n le-test
# → "Updating connector le-test"
```

Success. Pull-back verification:

```bash
fr-config-pull connector-definitions -n le-test
jq '.' config/sync/connectors/le-test.json
```

Confirmed on the tenant. Notably the pulled-back file shows the credentials field converted from our plaintext string to a tenant-encrypted `$crypto` blob:

```json
"credentials": {
  "$crypto": {
    "type": "x-simple-encryption",
    "value": {
      "stableId": "openidm-sym-default",
      "data": "<ciphertext>",
      ...
    }
  }
}
```

### Revised theory for the temp-dcc `kyexternalgov` 500 (Test 2 above)

The earlier 500 on temp-dcc when pushing `kyexternalgov` with `--direct-control` was originally attributed to possible encrypted-credential key mismatch. **That theory is almost certainly wrong.** The far more likely cause is the same "no meta-data provider" issue: the referenced `connectorHostRef: rcs-cluster-external` has no live RCS process connected to temp-dcc, so the tenant can't build a schema to validate or encrypt against.

In other words, the 500 was a tenant-side validation failure that would happen whether or not `--direct-control` was used. It's not a DCC limitation. The fix is operational: an actual RCS Java process has to be running and connected to temp-dcc's `rcs-cluster-external` WebSocket before a connector definition that references that host will push successfully.

### Lessons that apply to both controlled and non-controlled promotes

1. **Plaintext credentials on write are fine and idiomatic.** The IDM config format accepts `"credentials": "<string>"` and re-encrypts on write using the target tenant's own symmetric key. **Do not ship encrypted `$crypto` blobs between environments** — they won't decrypt in the destination.

2. **`remote-servers` is safe to create ahead of time.** Adding an entry to `remoteConnectorClients` is a pure metadata registration. No RCS process is required to exist when you do it. It just tells the tenant "I'm expecting an RCS by this name".

3. **`connector-definitions` requires a live RCS for the referenced `connectorHostRef`.** You cannot bootstrap a brand-new connector definition for an RCS that has never been running. Order of operations matters:

   a. Stand up the actual RCS Java process on your host. Configure `ConnectorServer.properties` with the tenant URL, OAuth2 client creds, and the connector name you intend to use.
   b. Push the `remote-servers` registration if you also want the tenant to explicitly expect this RCS name (for cluster grouping etc.). Not strictly required for basic connectivity; the tenant can accept any RCS whose OAuth2 client maps to the `openicf` scope.
   c. Let the RCS connect and register its connector bundles with the tenant.
   d. Only then push the `connector-definitions` resource referencing that live RCS.

4. **In a promote scenario**, this implies the target tenant must already have the RCS infrastructure running (or share a cluster with the source) **before** you run `fr-config-push connector-definitions`. Pipeline-ui cannot automate step (a) — that's an infra prereq on the customer side.

### Added follow-ups for pipeline-ui

- In the promote precheck, detect if any scope in the task contains `connector-definitions` with a `connectorHostRef`, and surface a warning: "Target tenant must have a live RCS connected under name `<connectorHostRef>` before this promote will succeed."
- Consider a runtime probe: call the tenant's `/openidm/system?_action=test` or the RCS status endpoint to check which RCS names are currently connected. Cross-reference against the `connectorHostRef` values in the config being promoted. Flag any unreachable ones in the dry-run.
- Update the compare view to show a human-readable "credentials (encrypted)" chip instead of the raw `$crypto` blob when diffing connector definitions — currently the blob drowns out the actual structural differences.

---

## CRITICAL: `fr-config-push connector-definitions` cannot create net-new connectors

After several hours of iteration on sandbox1, we proved that `fr-config-push connector-definitions` **silently fails to create brand-new connectors** even though every push appears to succeed. This is not a DCC issue — it happens on non-controlled environments too.

### Symptoms

1. `fr-config-push connector-definitions -n <new-name>` returns `Updating connector <new-name>` and exits 0.
2. Pull-back via `fr-config-pull connector-definitions -n <new-name>` returns the exact content we pushed — round-trip is clean.
3. The new connector **never appears** in the tenant admin console at `/admin/?realm=alpha#connectors/`, not even with `"ok": false / "error": "connector not available"` like other broken connectors show.
4. Restarting the tenant (`fr-config-push restart`) does not make it appear.
5. Existing connectors that were originally created through the admin console UI can be updated by `fr-config-push` without any issue — the gap is create-only.

### Root cause

The AIC admin console creates connectors using a **three-step sequence** that `fr-config-push` does not replicate:

**Step 1 — schema discovery via RCS:**
```
POST /openidm/system?_action=createFullConfig
Content-Type: application/json
Authorization: Bearer <sa-token>

{draft connector config without _id}
```
This asks the referenced RCS to inspect the real data source (read the CSV file header, query the LDAP schema, etc.) and returns a config enriched with populated `objectTypes` and an `operationOptions` block.

**Step 2 — persist to config store with create-only semantics:**
```
PUT /openidm/config/provisioner.openicf/<name>
Content-Type: application/json
If-None-Match: "*"              ← critical
Authorization: Bearer <sa-token>

{enriched config from step 1, with operationOptions removed}
```
The `If-None-Match: "*"` header tells IDM "only create, do not update". Without it, IDM returns **200 OK** and treats the request as an update, which bypasses the create-only runtime-registration hook. With it, IDM returns **201 Created** and fires the hook that inserts the connector into the runtime `/openidm/system` registry.

**Step 3 — (implicit) runtime registration.** Fired server-side as a side effect of the 201 response on step 2. No explicit client call required.

`fr-config-push connector-definitions` only does step 2, and does it **without** the `If-None-Match: "*"` header. So its PUT always returns 200 and IDM always treats it as an update. For connectors that were originally created through the UI, this update path works because they're already in the runtime registry. For net-new names that don't yet exist, the PUT stores the config and nothing else — the runtime never sees it.

### Empirical verification

We replayed the admin console's exact sequence against sandbox1 using a hand-assembled curl chain:

```bash
TENANT=https://openam-commkentsb1-useast1-sandbox.id.forgerock.io
TOKEN=$(fr-config-push direct-control-state -D 2>&1 | grep -oE 'Bearer [A-Za-z0-9_\.\-]+' | head -1 | cut -d' ' -f2)

# Step 1: schema discovery
curl -X POST "$TENANT/openidm/system?_action=createFullConfig" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @draft-connector.json \
  -o enriched.json
# → 200 OK, response has objectTypes populated from live RCS schema discovery

# Step 2: create-only persist (without operationOptions; IDM rejects it on PUT)
jq 'del(.operationOptions)' enriched.json > final.json
curl -X PUT "$TENANT/openidm/config/provisioner.openicf/le-test" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'If-None-Match: "*"' \
  -H "Content-Type: application/json" \
  -d @final.json
# → 201 Created
```

Immediately after the 201, `le-test` appeared in the runtime connectors view. This is the exact same sequence the HAR file showed for the admin console's connector-creation flow.

### Implications for the pipeline-ui promote flow

**Brand-new connector promotes via `--direct-control` cannot succeed today**, because:

- `fr-config-push connector-definitions -C` uses plain PUT without `If-None-Match: "*"`.
- The controlled session stages the PUT, apply commits it to the config store, but the runtime registration hook is never fired.
- Result: the connector is silently absent from the runtime on the target tenant after the promote completes.
- Worse: the promote task would report "success" because every stream exit was 0 and verify (comparing source vs pulled-back target config) would also pass — the config store on both sides matches.

**Updates of existing connectors via `--direct-control` work**, because the connector is already in the runtime registry and plain PUT correctly refreshes its config.

### Recommended fixes (ordered by cost)

1. **Short-term guardrail in pipeline-ui**: precheck the target tenant before a controlled promote that includes `connector-definitions`. For every connector scope selection, query `/openidm/system?_queryFilter=true` and check whether each connector name already exists in the runtime. If it does not, **block the promote** with a clear error:

   > "Connector `<name>` does not yet exist on target `<env>`. `fr-config-push connector-definitions` cannot create brand-new connectors — this must be done once through the target tenant's admin console UI. After that, subsequent updates can be promoted normally."

2. **Medium-term**: wrap fr-config-push with our own 3-step sequence when creating a brand-new connector. In `src/lib/fr-config.ts` (or a new helper), detect the scope `connector-definitions`, look for connectors that exist locally but not on the target, and for those call our own `createFullConfig` + `PUT If-None-Match: "*"` chain using the tenant's service account token. Leave updates on the existing fr-config-push path.

3. **Long-term**: file an upstream issue with `@forgerock/fr-config-manager` asking for:
   - An `--create` / `--mode=create` flag on `connector-definitions` that adds `If-None-Match: "*"` and optionally chains through `createFullConfig` first for schema discovery.
   - Better error reporting — today the PUT 200 is indistinguishable from a successful update at the CLI level.

### Cleanup artifacts from this test on sandbox1

Created and then removed during testing:

- `rcs-le-test` entry in `provisioner.openicf.connectorinfoprovider` — removed by read-modify-write, push.
- `le-test` connector definition at `/openidm/config/provisioner.openicf/le-test` — removed via direct `DELETE` with service account token.

Neither referenced live infrastructure.

---

## LDAP connector creation via 3-step flow — schema discovery requires live backend

Date: 2026-04-15 (continued)

After proving the 3-step flow works for CSV connectors, we attempted the same for an LDAP connector (`le-test`, cloned from `kyexternalgov`, pointing at `rcs-cluster-external`) with dummy credentials and a fake host (`ldap.example.invalid`).

### Result

Step 1 (`POST /openidm/system?_action=createFullConfig`) returned **HTTP 503**:

```json
{
  "code": 503,
  "message": "The required service is not available"
}
```

The `createFullConfig` action for LDAP triggers a real connection attempt through the RCS to the target LDAP server. The RCS needs to query the LDAP server's schema to discover object classes and attributes, which it returns as populated `objectTypes` in the response. Without a reachable LDAP backend, the RCS cannot perform schema discovery and the entire flow fails at step 1.

This is consistent with the admin console UI behavior: creating an LDAP connector requires a successful test connection before save is allowed.

### Contrast with CSV

CSV `createFullConfig` succeeded because the RCS reads the CSV file header locally on the RCS host — no remote network call is needed beyond the WebSocket to the tenant. The header columns become the `objectTypes` properties. As long as the file path exists on the RCS host, schema discovery succeeds regardless of credential validity.

### Implications for LDAP/AD connector promotion

To create a brand-new LDAP/AD connector on a target tenant via the 3-step flow, **all** of the following must be true at promote time:

1. **The target tenant must have a live RCS** connected under the `connectorHostRef` name (e.g., `rcs-cluster-external`). Without this, IDM has no meta-data provider and returns `"No meta-data provider available yet"` (500).

2. **The LDAP/AD host must be network-reachable from the RCS.** The `createFullConfig` action routes through the RCS to the LDAP server to read its schema. If DNS doesn't resolve or TCP port 636 is unreachable, the call returns 503.

3. **The LDAP bind credentials must be valid enough for schema read.** Some LDAP servers allow anonymous schema reads (`cn=schema` / `cn=subschemaSubentry`), so an invalid bind password may still let schema discovery succeed. Others require authenticated bind first. This is server-dependent and cannot be assumed.

4. **For updates to existing connectors, none of this is required.** A plain `PUT /openidm/config/provisioner.openicf/<name>` (without `createFullConfig` and without `If-None-Match`) succeeds because the connector is already in the runtime registry. `fr-config-push connector-definitions` works fine for this case.

### What's needed to complete the LDAP test

One of:

- **(a)** A real LDAP/AD host reachable from sandbox1's `rcs-cluster-external` — credentials can be dummy if the server allows anonymous schema reads. The existing `kyexternalgov` target (`eide.extdev.ky.gov:636`) is the most obvious candidate: use the same host with a bogus bind DN / password. The TLS handshake and schema query may succeed even if the bind fails.
- **(b)** Skip the LDAP create test entirely and rely on the finding that the 3-step mechanism itself is proven (via CSV). The LDAP-specific failure is an RCS networking prerequisite, not a gap in the flow. For the real `kyexternalgov` promote to temp-dcc, we would use the actual credentials against the actual LDAP host, at which point schema discovery should succeed.

### Summary of all connector creation findings

| Connector type | `createFullConfig` works with dummy/fake backend? | Live backend needed? | 3-step flow proven? |
|---|---|---|---|
| CSV | Yes (file read is local to RCS) | File must exist on RCS host | ✅ Yes |
| LDAP/AD | No (503 if host unreachable) | Yes — host must be TCP-reachable, schema-queryable | ❌ Blocked by test infrastructure |
| Scripted REST | Untested | Likely yes — script execution may probe the endpoint | Unknown |

### Pipeline-ui recommendation for connector scope promotes

For any promote task that includes `connector-definitions`:

1. **Pre-flight check**: query the target tenant's `/openidm/system?_queryFilter=true` to list currently-registered connectors. For each connector in the promote scope:
   - If it **already exists** on the target → standard `fr-config-push` update path works (no special handling needed).
   - If it **does not exist** on the target → block the promote with a clear message explaining the admin-console-first requirement, OR implement the 3-step flow (`createFullConfig` → `PUT If-None-Match: "*"`) as a custom wrapper around `fr-config-push`.

2. **For LDAP/AD creates specifically**: warn the user that the target tenant's RCS must have network access to the LDAP host and valid-enough credentials for schema discovery. This is an infrastructure prerequisite that the pipeline-ui cannot verify programmatically without actually attempting the connection (which is what `createFullConfig` does).

3. **Credential handling**: always use plaintext credentials in the pushed config, never encrypted `$crypto` blobs from a different environment. IDM encrypts on write using the target tenant's own symmetric key. ESV references (`&{esv.name}`) are the preferred pattern for cross-environment promotes.

---

## Connector creation via API — runbook (2026-04-16)

Date: 2026-04-16
Tenant: `sandbox1` (`openam-commkentsb1-useast1-sandbox.id.forgerock.io`)

### Summary

The 3-step connector creation flow works with a **service account token** on AIC cloud. The steps are:

1. `POST /openidm/system?_action=createFullConfig` — schema discovery via RCS
2. Strip `operationOptions` from the response
3. `PUT /openidm/config/provisioner.openicf/<name>` with `If-None-Match: "*"` — returns 201, triggers runtime registration

### Constraints discovered

- **Connector names must be alphanumeric only.** The admin console enforces this (no hyphens, underscores, or special characters). Names like `le-csv-test` are rejected; `lecsvtest` works.
- **`bundleVersion` should be the exact resolved version** (e.g. `"1.5.20.34"`), not a range (e.g. `"[1.5.20.11, 1.6.0.0)"`). The `createFullConfig` response returns the resolved version when the input uses it. To get the resolved version, call `POST /openidm/system?_action=availableConnectors` first, or read it from an existing connector on the tenant.
- **The source connector config must come from the tenant** (via GET on an existing connector or from `createFullConfig`). Do not hand-assemble configs — the tenant enriches them with defaults (`operationTimeout`, `resultsHandlerConfig`, `poolConfigOption`, etc.) that may be required.
- **Do NOT trigger `fr-config-push restart` before creating connectors.** A tenant restart disrupts the provisioner's config-change listener. In our testing, all 3-step creation attempts failed (201 returned, config stored, but no runtime registration) after a restart. The provisioner recovered after a connector was created through the admin console UI, after which the 3-step flow worked again. Avoid restarts in any automated connector creation workflow.

### Verified test: duplicate an existing connector

Created `lecsvtest` through the admin console (CSV File Connector, `rcs-connector-internal-1`, same CSV file as `CSVFileRoleTest`). Then duplicated it as `lecsvtest2` via the 3-step flow with a service account token. `lecsvtest2` appeared immediately in the runtime with `ok: true`.

### Runbook — replay commands

All commands assume CWD is `environments/sandbox1`.

#### 0. Obtain a bearer token

```bash
export TENANT=https://openam-commkentsb1-useast1-sandbox.id.forgerock.io
export TOKEN=$(fr-config-push direct-control-state -D 2>&1 \
  | grep -oE 'Bearer [A-Za-z0-9_.\-]+' | head -1 | cut -d' ' -f2)
echo "Token length: ${#TOKEN}"
# Expected: non-zero (typically ~1600 chars)
```

#### 1. Read source connector from tenant

Pick any existing connector that is runtime-registered. Strip `_id` and `_rev` so the body is reusable for a new name.

```bash
SOURCE_CONNECTOR=lecsvtest
curl -sS "$TENANT/openidm/config/provisioner.openicf/$SOURCE_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  | jq 'del(._id, ._rev)' > /tmp/source-connector.json

# Verify
jq '{enabled, connectorRef: .connectorRef, objectTypes: (.objectTypes | keys)}' \
  /tmp/source-connector.json
```

#### 2. Schema discovery via createFullConfig

```bash
curl -sS -X POST "$TENANT/openidm/system?_action=createFullConfig" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/source-connector.json \
  -o /tmp/enriched-connector.json \
  -w "createFullConfig status: %{http_code}\n"

# Verify: should be 200, objectTypes populated
jq '{bundleVersion: .connectorRef.bundleVersion, objectTypes: (.objectTypes | keys), hasOperationOptions: has("operationOptions")}' \
  /tmp/enriched-connector.json
```

Expected output:
```json
{
  "bundleVersion": "1.5.20.34",
  "objectTypes": ["__ACCOUNT__"],
  "hasOperationOptions": true
}
```

If this returns **503**, the RCS referenced by `connectorHostRef` is not connected. Check with:
```bash
curl -sS -X POST "$TENANT/openidm/system?_action=testConnectorServers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '[.openicf[] | {name, ok}]'
```

#### 3. Strip operationOptions and create

IDM rejects `operationOptions` on PUT. Remove it, then PUT with `If-None-Match: "*"` for create-only semantics.

```bash
NEW_CONNECTOR=lecsvtest2
jq 'del(.operationOptions)' /tmp/enriched-connector.json > /tmp/final-connector.json

curl -sS -X PUT "$TENANT/openidm/config/provisioner.openicf/$NEW_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H 'If-None-Match: "*"' \
  -d @/tmp/final-connector.json \
  -w "\nPUT status: %{http_code}\n"
```

Expected: **201 Created**. If you get **200**, the connector already existed and was treated as an update (no runtime registration for new connectors via this path).

#### 4. Verify runtime registration

```bash
# Single connector test
curl -sS -X POST "$TENANT/openidm/system/$NEW_CONNECTOR?_action=test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '{name, ok, error}'

# Expected: {"name":"lecsvtest2","ok":true,"error":null}
# "ok":false with "connector not available" also means registered but RCS is down — still success.
# 404 means runtime registration failed.
```

```bash
# Full runtime list (confirm it appears alongside existing connectors)
curl -sS -X POST "$TENANT/openidm/system?_action=test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '[.[] | {name, ok}]'
```

#### 5. Pull back locally

```bash
fr-config-pull connector-definitions -n $NEW_CONNECTOR
jq '{_id, enabled, connectorRef}' config/sync/connectors/$NEW_CONNECTOR.json
```

#### 6. Cleanup (when done testing)

```bash
curl -sS -X DELETE "$TENANT/openidm/config/provisioner.openicf/$NEW_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nDELETE status: %{http_code}\n"

rm -f config/sync/connectors/$NEW_CONNECTOR.json
```

### Failure mode: 201 but no runtime registration

If the PUT returns 201 but the connector does not appear in `_action=test` (404 on single-connector test), the provisioner's config-change listener is not firing. Known causes:

1. **Recent tenant restart** (`fr-config-push restart`) — the provisioner subsystem's listener may not recover automatically. Workaround: create any connector through the admin console UI first; this re-warms the provisioner. Subsequent API-based creations will work.
2. **`enabled: false` in the config body** — the provisioner may skip runtime registration for disabled connectors. Always set `"enabled": true` in the body.

### HAR analysis — admin console vs API

Captured a HAR of the admin console creating `test234` on sandbox1. The admin console sequence is:

1. `POST /openidm/system?_action=createFullConfig` → 200
2. `PUT /openidm/config/provisioner.openicf/test234` with `If-None-Match: "*"` → 201
3. (UI navigates to connector edit page — JS file loads only, no additional API calls)
4. `POST /openidm/system/test234?_action=test` → 200 (already in runtime)

The admin console uses an `idmAdminClient` token (authorization_code grant, scope `fr:idm:*`). Our service account uses `service-account` client (JWT-bearer grant, same scope). **Both work** for the 3-step flow when the provisioner listener is healthy. The admin console does NOT use any hidden API endpoint — the sequence is identical to what we execute programmatically.

The admin console also enforces alphanumeric-only connector names client-side (JavaScript validation before the PUT).

---

## AD/LDAP connector creation via 3-step flow — verified (2026-04-16)

Date: 2026-04-16
Tenant: `sandbox1` (`openam-commkentsb1-useast1-sandbox.id.forgerock.io`)
Source connector: `kyexternalgov` (LDAP connector, `rcs-cluster-external`, host `EDEVVM-DC1.edev.extdev.ky.gov:636`)

### Summary

The 3-step connector creation flow (`createFullConfig` → strip `operationOptions` → `PUT If-None-Match: "*"`) works for **AD/LDAP connectors** with a service account token. This supersedes the earlier finding that LDAP creates were "blocked by test infrastructure" — the key was using encrypted credentials from the same tenant (which the server decrypts server-side) instead of dummy/plaintext credentials against an unreachable host.

### Key findings

1. **`createFullConfig` accepts encrypted `$crypto` credentials from the same tenant.** The server decrypts them server-side before passing to the RCS for schema discovery. No need to know the plaintext password — just read the existing connector's config from the tenant and reuse it.

2. **LDAP schema discovery returned richer object types than the source connector uses.** The source `kyexternalgov` was configured with only `User` and `Group` object types. `createFullConfig` queried the LDAP schema and returned `__ACCOUNT__`, `__GROUP__`, `__SERVER_INFO__`, and `organizationalUnit` — the full set available from the AD server.

3. **The LDAP host must be reachable from the RCS at creation time.** `createFullConfig` routes through the RCS to the LDAP server to read its schema. If the host is unreachable or credentials are invalid, it returns 503. This is a hard prerequisite — there is no way to create an LDAP connector without a live backend.

4. **Runtime registration worked immediately** (201 → `_action=test` returned `ok: true`). This is consistent with the CSV connector test after the provisioner was re-warmed.

### Updated connector creation findings table

| Connector type | `createFullConfig` works? | Live backend needed? | 3-step flow proven? |
|---|---|---|---|
| CSV | Yes (file read is local to RCS) | File must exist on RCS host | ✅ Yes |
| LDAP/AD | Yes (with encrypted creds from same tenant) | Yes — host must be TCP-reachable from RCS | ✅ Yes |
| Scripted REST | Untested | Likely yes — script execution may probe the endpoint | Unknown |

### Runbook — create an AD connector by duplicating an existing one

All commands assume CWD is `environments/sandbox1`.

#### 0. Obtain a bearer token

```bash
export TENANT=https://openam-commkentsb1-useast1-sandbox.id.forgerock.io
export TOKEN=$(fr-config-push direct-control-state -D 2>&1 \
  | grep -oE 'Bearer [A-Za-z0-9_.\-]+' | head -1 | cut -d' ' -f2)
echo "Token length: ${#TOKEN}"
```

#### 1. Read source AD connector from tenant

```bash
SOURCE_CONNECTOR=kyexternalgov
curl -sS "$TENANT/openidm/config/provisioner.openicf/$SOURCE_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  | jq 'del(._id, ._rev)' > /tmp/ad-source.json

# Verify: should show host, principal, encrypted credentials, connectorHostRef
jq '{host: .configurationProperties.host, principal: .configurationProperties.principal, credentials_type: (.configurationProperties.credentials | type), connectorHostRef: .connectorRef.connectorHostRef, enabled}' \
  /tmp/ad-source.json
```

Expected output:
```json
{
  "host": "EDEVVM-DC1.edev.extdev.ky.gov",
  "principal": "CN=SD-KYID-FR-AIC-EXT,OU=KOG,OU=ServiceAccounts,OU=AA,DC=edev,DC=extdev,DC=ky,DC=gov",
  "credentials_type": "object",
  "connectorHostRef": "rcs-cluster-external",
  "enabled": true
}
```

Note: `credentials_type` is `"object"` because the tenant returns the encrypted `$crypto` blob. This is correct — `createFullConfig` decrypts it server-side.

#### 2. Schema discovery via createFullConfig

```bash
curl -sS -X POST "$TENANT/openidm/system?_action=createFullConfig" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/ad-source.json \
  -o /tmp/ad-enriched.json \
  -w "createFullConfig status: %{http_code}\n"

# Verify: should be 200, objectTypes populated from LDAP schema
jq '{bundleVersion: .connectorRef.bundleVersion, objectTypes: (.objectTypes | keys), hasOperationOptions: has("operationOptions")}' \
  /tmp/ad-enriched.json
```

Expected output:
```json
{
  "bundleVersion": "[1.5.20.12, 1.6.0.0)",
  "objectTypes": ["__ACCOUNT__", "__GROUP__", "__SERVER_INFO__", "organizationalUnit"],
  "hasOperationOptions": true
}
```

If this returns **503 "The required service is not available"**: the RCS cannot reach the LDAP host. Verify:
- RCS is connected: `POST /openidm/system?_action=testConnectorServers`
- LDAP host is network-reachable from the RCS host
- Credentials are valid enough for LDAP schema read

#### 3. Strip operationOptions and create

```bash
NEW_CONNECTOR=leadtest
jq 'del(.operationOptions)' /tmp/ad-enriched.json > /tmp/ad-final.json

curl -sS -X PUT "$TENANT/openidm/config/provisioner.openicf/$NEW_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H 'If-None-Match: "*"' \
  -d @/tmp/ad-final.json \
  -w "\nPUT status: %{http_code}\n"
```

Expected: **201 Created**.

#### 4. Verify runtime registration

```bash
curl -sS -X POST "$TENANT/openidm/system/$NEW_CONNECTOR?_action=test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '{name, ok, error}'
```

Expected: `{"name":"leadtest","ok":true,"error":null}`.

Note: `ok: false` with `"connector not available"` means registered but the RCS/LDAP connection failed at test time — this is still a successful creation. A `404` means runtime registration failed entirely.

#### 5. Cleanup

```bash
curl -sS -X DELETE "$TENANT/openidm/config/provisioner.openicf/$NEW_CONNECTOR" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nDELETE status: %{http_code}\n"
```

### Implications for cross-environment promote of AD connectors

When promoting an AD connector from environment A to environment B:

1. **Read the source connector config from environment A** (not from the local file system — the local file may have stale encrypted credentials from the wrong tenant).
2. **Replace the encrypted `$crypto` credentials** with either:
   - Plaintext password for the target environment's service account (IDM encrypts on write), or
   - An ESV reference (`&{esv.connector.password}`) if the target environment has the ESV configured.
3. **Update `configurationProperties` as needed** for the target environment: `host`, `failover`, `principal`, `baseContexts` may all differ between environments.
4. **Run `createFullConfig` against the target tenant** — this validates that the RCS can reach the LDAP host with the provided credentials and discovers the schema.
5. **`PUT` with `If-None-Match: "*"`** to create on the target tenant.

The source connector's `objectTypes` should NOT be copied verbatim — let `createFullConfig` rediscover them from the target LDAP server, as the schema may differ between environments.

### Test artifacts (all cleaned up)

| Connector | Type | Created via | Cleaned up |
|---|---|---|---|
| `lecsvtest` | CSV File Connector | Admin console UI | ✅ Deleted |
| `lecsvtest2` | CSV File Connector | 3-step API flow (duplicated from lecsvtest) | ✅ Deleted |
| `leadtest` | LDAP Connector (AD) | 3-step API flow (duplicated from kyexternalgov) | ✅ Deleted |

