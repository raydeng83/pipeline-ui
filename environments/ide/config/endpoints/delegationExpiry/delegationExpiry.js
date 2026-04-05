/**
 * @name delegationExpiry
 * @description Scheduled endpoint to automatically deprovision expired delegation access records.
 *              Queries alpha_kyid_access for records where expiryDateEpoch has passed and recordState is still active,
 *              then invokes endpoint/access_v2B (action=3) for each to trigger soft delete + cascade deletion + KOG cleanup.
 *
 * @param {boolean} [dryRun=false]        - Preview only, no actual deletion. Automatically enables includeDetails.
 * @param {boolean} [includeDetails=false] - Return per-record details in response.
 * @param {number}  [limit=0]             - Max records to process (0 = unlimited).
 *
 * @example
 *   // Preview all expired records
 *   POST /openidm/endpoint/delegationExpiry  { "dryRun": true }
 *
 *   // Delete up to 5 records with details
 *   POST /openidm/endpoint/delegationExpiry  { "limit": 5, "includeDetails": true }
 *
 *   // Full run (used by DelegationExpiryScheduler)
 *   POST /openidm/endpoint/delegationExpiry  {}
 */

(function () {

    var idmLog = createLogger();
    var dryRun = request.content && request.content.dryRun === true;
    var includeDetails = dryRun || (request.content && request.content.includeDetails === true);
    var limit = request.content && typeof request.content.limit === "number" && request.content.limit > 0
        ? request.content.limit : 0;
    var currentEpoch = Date.now();
    var currentISO = new Date(currentEpoch).toISOString();

    var summary = {
        startTime: currentISO,
        transactionId: idmLog.txnId,
        dryRun: dryRun,
        totalFound: 0,
        successCount: 0,
        failCount: 0
    };
    if (includeDetails) {
        summary.details = [];
    }

    try {
        idmLog.info("main", (dryRun ? "[DRY-RUN] " : "") + "START - Processing delegation expiry at " + currentISO + " (epoch: " + currentEpoch + ")");

        var returnFields = ["_id", "userIdentifier", "roleIdentifier", "appIdentifier", "expiryDate", "recordState", "currentDelegatorIdentifier", "originalDelegatorIdentifier"];
        var activeFilter = '(recordState eq "0" or recordState eq "ACTIVE")';
        var allRecords = [];

        // Step 1a: Query by expiryDateEpoch (number comparison, efficient for new records)
        var epochFilter = 'expiryDateEpoch lt ' + currentEpoch + ' and ' + activeFilter;
        idmLog.debug("query", "Query (epoch): " + epochFilter);

        var epochResponse = openidm.query("managed/alpha_kyid_access", {
            "_queryFilter": epochFilter
        }, returnFields);

        if (epochResponse && epochResponse.result) {
            allRecords = epochResponse.result;
        }

        // --- Step 1b START: Legacy fallback (remove when all records have expiryDateEpoch) ---
        var legacyFilter = 'expiryDate pr and !(expiryDateEpoch pr) and ' + activeFilter;
        idmLog.debug("query", "Query (legacy): " + legacyFilter);

        var legacyResponse = openidm.query("managed/alpha_kyid_access", {
            "_queryFilter": legacyFilter
        }, returnFields);

        if (legacyResponse && legacyResponse.result && legacyResponse.result.length > 0) {
            idmLog.info("query", "Found " + legacyResponse.result.length + " legacy records without expiryDateEpoch, filtering in JS");
            for (var j = 0; j < legacyResponse.result.length; j++) {
                var r = legacyResponse.result[j];
                var parsedEpoch = new Date(r.expiryDate).getTime();
                if (!isNaN(parsedEpoch) && parsedEpoch < currentEpoch) {
                    allRecords.push(r);
                }
            }
        }
        // --- Step 1b END ---

        summary.totalFound = allRecords.length;

        if (allRecords.length === 0) {
            idmLog.info("main", "No expired delegation access records found. Nothing to process.");
            summary.endTime = new Date().toISOString();
            return summary;
        }

        var expiredRecords = (limit > 0 && allRecords.length > limit) ? allRecords.slice(0, limit) : allRecords;
        summary.processing = expiredRecords.length;

        idmLog.info("main", "Found " + allRecords.length + " expired records" +
            (limit > 0 ? ", processing limit: " + limit : "") +
            ", processing: " + expiredRecords.length);

        // Step 2: Process each expired record
        for (var i = 0; i < expiredRecords.length; i++) {
            var record = expiredRecords[i];

            idmLog.debug("processRecord", "Processing record " + (i + 1) + "/" + expiredRecords.length +
                " - id: " + record._id +
                ", user: " + record.userIdentifier +
                ", role: " + record.roleIdentifier +
                ", expiryDate: " + record.expiryDate);

            if (dryRun) {
                idmLog.info("processRecord", "[DRY-RUN] Would delete record " + record._id);
                summary.successCount++;
                summary.details.push({
                    id: record._id,
                    user: record.userIdentifier,
                    role: record.roleIdentifier,
                    app: record.appIdentifier,
                    expiryDate: record.expiryDate,
                    currentDelegator: record.currentDelegatorIdentifier,
                    originalDelegator: record.originalDelegatorIdentifier,
                    status: "would_delete"
                });
            } else {
                try {
                    // Step 3: Invoke access_v2B deleteAccess (action=3)
                    // This triggers: soft delete → cascade deletion → KOG API cleanup → dependent role cleanup
                    // Note: "id" field is required so access_v2B router can set requester.displayId
                    //       (internal calls have no OAuth context, so requesterAccountId is undefined;
                    //        the router falls back to input.payload.id for requester.displayId)
                    //       This value is written to alpha_kyid_access.updatedByID (string) and audit log as the operator identity.
                    var deletePayload = {
                        "payload": {
                            "queryFilter": '_id eq "' + record._id + '"',
                            "id": "DELEGATION-EXPIRY-SCHEDULER",
                            "confirmation": {
                                "reason": "DELEGATION_EXPIRED",
                                "comment": "Auto-deprovisioned by DelegationExpiryScheduler - delegation expiryDate " + record.expiryDate + " has passed"
                            }
                        },
                        "action": "3"
                    };

                    idmLog.debug("processRecord", "Invoking access_v2B deleteAccess for record " + record._id + " - payload: " + JSON.stringify(deletePayload));

                    var deleteResponse = openidm.create("endpoint/access_v2B", null, deletePayload);

                    // Check response for errors
                    var recordFailed = false;
                    var failReason = "";

                    // Check 1: response-level error (e.g. access_v2B returned status 500 without payload)
                    if (!deleteResponse) {
                        recordFailed = true;
                        failReason = "No response from access_v2B";
                    } else if (deleteResponse.status && deleteResponse.status >= 400) {
                        recordFailed = true;
                        failReason = "access_v2B returned status " + deleteResponse.status + ": " + JSON.stringify(deleteResponse.message || deleteResponse);
                    } else if (!deleteResponse.payload || !deleteResponse.payload.result) {
                        recordFailed = true;
                        failReason = "access_v2B returned unexpected response: " + JSON.stringify(deleteResponse);
                    }

                    // Check 2: per-record status inside payload (access_v2B responseCode:"0" but individual record failed)
                    if (!recordFailed && deleteResponse.payload && deleteResponse.payload.result) {
                        for (var k = 0; k < deleteResponse.payload.result.length; k++) {
                            if (deleteResponse.payload.result[k].status === "1") {
                                recordFailed = true;
                                failReason = JSON.stringify(deleteResponse.payload.result);
                                idmLog.error("processRecord", "Record " + record._id + " - access_v2B returned per-record error: " + JSON.stringify(deleteResponse.payload.result[k].message));
                            }
                        }
                    }

                    if (recordFailed) {
                        idmLog.error("processRecord", "FAIL - Record " + record._id + " - " + failReason);
                        summary.failCount++;
                        if (includeDetails) {
                            summary.details.push({
                                id: record._id,
                                user: record.userIdentifier,
                                role: record.roleIdentifier,
                                expiryDate: record.expiryDate,
                                status: "failed_internal",
                                error: failReason
                            });
                        }
                    } else {
                        idmLog.info("processRecord", "SUCCESS - Record " + record._id + " deprovisioned. Response: " + JSON.stringify(deleteResponse));
                        summary.successCount++;
                        if (includeDetails) {
                            summary.details.push({
                                id: record._id,
                                user: record.userIdentifier,
                                role: record.roleIdentifier,
                                expiryDate: record.expiryDate,
                                status: "success"
                            });
                        }
                    }

                } catch (deleteError) {
                    idmLog.exception("processRecord", deleteError);
                    summary.failCount++;
                    if (includeDetails) {
                        summary.details.push({
                            id: record._id,
                            user: record.userIdentifier,
                            role: record.roleIdentifier,
                            expiryDate: record.expiryDate,
                            status: "failed",
                            error: deleteError.message || JSON.stringify(deleteError)
                        });
                    }
                    // Continue processing other records - don't let one failure stop the batch
                }
            }
        }

    } catch (error) {
        idmLog.error("main", "CRITICAL ERROR - " + JSON.stringify(error));
        summary.criticalError = error.message || JSON.stringify(error);
    }

    summary.endTime = new Date().toISOString();
    idmLog.info("main", "END - Summary: total=" + summary.totalFound +
        ", success=" + summary.successCount +
        ", failed=" + summary.failCount);

    return summary;

})();

// --- START: createLogger ---
/**
 * Creates a logger with auto-extracted transactionId from ForgeRock context.
 *
 * @param {string} [name] - Optional script name for log prefix.
 *   - Endpoint scripts: omit — auto-detects from context.parent.matchedUri (e.g. "endpoint/delegationExpiry").
 *   - Scheduler/job scripts: pass explicitly (e.g. "DelegationExpiryScheduler") since matchedUri is unavailable.
 *
 * Usage:
 *   var idmLog = createLogger();                        // endpoint: [endpoint/delegationExpiry] txn=xxx | ...
 *   var idmLog = createLogger("DelegationExpiryScheduler"); // scheduler: [DelegationExpiryScheduler] txn=xxx | ...
 *   idmLog.info("main", "Starting...");
 *   idmLog.exception("processRecord", error);
 */
function createLogger(name) {
    var endpointName = name || "unknown";
    if (!name) { try { endpointName = context.parent.matchedUri || endpointName; } catch (e) { /* context not available */ } }
    var txnId = "";
    try {
        if (context.transactionId && context.transactionId.transactionId
            && context.transactionId.transactionId.value) {
            txnId = context.transactionId.transactionId.value;
        }
    } catch (e) { /* context not available */ }
    if (!txnId) {
        txnId = java.util.UUID.randomUUID().toString();
    }
    var prefix = "[" + endpointName + "] txn=" + txnId + " | ";
    // All arguments joined with space. Recommend first argument be function name.
    // ("main", "Found", 5, "records") → prefix + "main Found 5 records"
    function buildMsg(args) {
        var parts = [];
        for (var i = 0; i < args.length; i++) parts.push(args[i]);
        return prefix + parts.join(" ");
    }
    return {
        txnId: txnId,
        debug: function () { logger.debug(buildMsg(arguments)); },
        info:  function () { logger.info(buildMsg(arguments)); },
        warn:  function () { logger.warn(buildMsg(arguments)); },
        error: function () { logger.error(buildMsg(arguments)); },
        // Last argument is error object (.message extracted), preceding arguments are context strings.
        // ("processRecord", err) → prefix + "processRecord EXCEPTION: err.message"
        // (err)                  → prefix + "EXCEPTION: err.message"
        exception: function () {
            var last = arguments[arguments.length - 1];
            var detail = (last && last.message) ? last.message : JSON.stringify(last);
            var parts = [];
            for (var i = 0; i < arguments.length - 1; i++) parts.push(arguments[i]);
            parts.push("EXCEPTION:", detail);
            logger.error(prefix + parts.join(" "));
        }
    };
}
// --- END: createLogger ---
