/**
 * @name DelegationExpiryScheduler
 * @description Daily scheduler that expires delegation access records and emails admins the results.
 *
 * @requires ESV: esv.kyid.delegation.expiry.admin.emails (optional) - Comma-separated admin email addresses. If not set, email notifications are disabled.
 * @requires ESV: esv.environment.name (optional) - Human-friendly environment name (e.g. "IDE3", "IDE", "PROD"). Falls back to esv.kyid.tenant.fqdn if not set.
 * @requires ESV: esv.kyid.tenant.fqdn - Tenant FQDN, used as fallback environment identifier in emails
 */

processDelegationExpiry();

function processDelegationExpiry() {
    var idmLog = createLogger("DelegationExpiryScheduler");
    var adminEmails = getAdminEmails(idmLog);

    try {
        idmLog.info("main", "Starting delegation expiry processing");
        var response = openidm.create("endpoint/delegationExpiry", null, { "includeDetails": true });

        if (response) {
            var msg = "Completed - total=" + response.totalFound + ", success=" + response.successCount + ", failed=" + response.failCount;
            response.failCount > 0 ? idmLog.error("main", msg) : idmLog.info("main", msg);

            // Send admin notification (skip if nothing to process)
            if (response.totalFound === 0) {
                idmLog.info("main", "No expired records found, skipping email notification");
            } else if (response.failCount > 0) {
                notifyAdmins(idmLog, adminEmails, buildFailureEmail(response, idmLog.txnId));
            } else {
                notifyAdmins(idmLog, adminEmails, buildSuccessEmail(response, idmLog.txnId));
            }
        } else {
            idmLog.warn("main", "No response from endpoint");
            notifyAdmins(idmLog, adminEmails, buildErrorEmail("No response from endpoint/delegationExpiry", idmLog.txnId));
        }
    } catch (error) {
        idmLog.exception("main", error);
        var errorMsg = (error && error.message) ? error.message : JSON.stringify(error);
        notifyAdmins(idmLog, adminEmails, buildErrorEmail(errorMsg, idmLog.txnId));
    }
}

// ---------------------------------------------------------------------------
// Admin Email Notification
// ---------------------------------------------------------------------------

/**
 * Reads admin email list from ESV. Returns empty array if not configured.
 */
function getAdminEmails(idmLog) {
    try {
        var raw = identityServer.getProperty("esv.kyid.delegation.expiry.admin.emails", "", true);
        if (!raw || raw.trim() === "") {
            idmLog.info("getAdminEmails", "ESV esv.kyid.delegation.expiry.admin.emails not set, email notification disabled");
            return [];
        }
        var emails = [];
        var parts = raw.split(",");
        for (var i = 0; i < parts.length; i++) {
            var email = parts[i].trim();
            if (email) emails.push(email);
        }
        idmLog.info("getAdminEmails", "Loaded " + emails.length + " admin email(s)");
        return emails;
    } catch (e) {
        idmLog.error("getAdminEmails", "Failed to read admin emails ESV: " + e.message);
        return [];
    }
}

/**
 * Sends email to each admin individually. Failures are logged but do not interrupt the scheduler.
 */
function notifyAdmins(idmLog, adminEmails, emailContent) {
    if (!adminEmails || adminEmails.length === 0) {
        idmLog.debug("notifyAdmins", "No admin emails configured, skipping notification");
        return;
    }
    for (var i = 0; i < adminEmails.length; i++) {
        try {
            openidm.action("external/email", "send", {
                "from": "",
                "to": adminEmails[i],
                "subject": emailContent.subject,
                "type": "text/plain",
                "body": emailContent.body
            });
            idmLog.info("notifyAdmins", "Email sent to " + adminEmails[i]);
        } catch (e) {
            idmLog.error("notifyAdmins", "Failed to send email to " + adminEmails[i] + ": " + e.message);
        }
    }
}

// ---------------------------------------------------------------------------
// Email Content Builders
// ---------------------------------------------------------------------------

function getEnvironmentName() {
    try {
        // Priority 1: esv.environment.name (human-friendly, e.g. "IDE3", "IDE", "PROD")
        var envName = identityServer.getProperty("esv.environment.name", "", true);
        if (envName && envName.trim() !== "") {
            return envName.trim();
        }
        // Priority 2: fallback to tenant FQDN
        var fqdn = identityServer.getProperty("esv.kyid.tenant.fqdn", "", true);
        if (fqdn) {
            // "https://sso.ide3.kyid.ky.gov" → "sso.ide3.kyid.ky.gov"
            return fqdn.replace(/^https?:\/\//, "");
        }
        return "UNKNOWN";
    } catch (e) {
        return "UNKNOWN";
    }
}

function getEstTimestamp() {
    var now = new Date();
    // UTC-5 (EST) approximation; DST not handled — acceptable for admin notifications
    var est = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    return est.toISOString().replace("T", " ").replace(/\.\d+Z$/, "") + " EST";
}

function buildSuccessEmail(response, txnId) {
    var env = getEnvironmentName();
    var time = getEstTimestamp();
    var subject = "[" + env + "] DelegationExpiry - Completed - " + response.totalFound + " records processed";

    var body = "Delegation Expiry - Completed Successfully\n\n"
        + buildSummaryBlock(env, time, response, txnId)
        + "\n--\nThis is an automated notification from DelegationExpiryScheduler.";

    return { subject: subject, body: body };
}

function buildFailureEmail(response, txnId) {
    var env = getEnvironmentName();
    var time = getEstTimestamp();
    var subject = "[" + env + "] DelegationExpiry - " + response.failCount + " failed, " + response.successCount + " succeeded";

    var body = "Delegation Expiry - Failure\n\n"
        + buildSummaryBlock(env, time, response, txnId)
        + buildFailedRecordsBlock(response)
        + buildRecommendedActions(txnId);

    return { subject: subject, body: body };
}

// --- Shared email building blocks ---

function buildSummaryBlock(env, time, response, txnId) {
    return "Environment:    " + env + "\n"
        + "Execution Time: " + time + "\n"
        + "Total Found:    " + response.totalFound + "\n"
        + "Success:        " + response.successCount + "\n"
        + "Failed:         " + response.failCount + "\n"
        + "Transaction ID: " + txnId + "\n";
}

function buildFailedRecordsBlock(response) {
    var text = "";
    if (!response.details || response.details.length === 0) return text;

    var failedRecords = [];
    for (var i = 0; i < response.details.length; i++) {
        if (response.details[i].status !== "success") {
            failedRecords.push(response.details[i]);
        }
    }
    if (failedRecords.length === 0) return text;

    var maxDisplay = 10;
    var displayRecords = failedRecords.length > maxDisplay ? failedRecords.slice(0, maxDisplay) : failedRecords;
    text += "\nFailed Records (" + failedRecords.length + " total"
        + (failedRecords.length > maxDisplay ? ", showing first " + maxDisplay : "") + ")\n";
    for (var j = 0; j < displayRecords.length; j++) {
        var r = displayRecords[j];
        text += "\n  Record ID: " + (r.id || "")
            + "\n  User:      " + (r.user || "")
            + "\n  Role:      " + (r.role || "")
            + "\n  Status:    " + (r.status || "")
            + "\n  Error:     " + (r.error || "")
            + "\n";
    }
    if (failedRecords.length > maxDisplay) {
        text += "\n  ... and " + (failedRecords.length - maxDisplay) + " more. Check IDM logs for full details.\n";
    }
    return text;
}

function buildRecommendedActions(txnId) {
    return "\nRecommended Actions:\n"
        + "  1. Check IDM logs with transaction ID: " + txnId + "\n"
        + "  2. Review failed records in managed/alpha_kyid_access\n"
        + "  3. Re-run with dryRun to verify: POST endpoint/delegationExpiry {\"dryRun\":true}\n"
        + "\n--\nThis is an automated notification from DelegationExpiryScheduler.";
}

function buildErrorEmail(errorMsg, txnId) {
    var env = getEnvironmentName();
    var time = getEstTimestamp();
    var subject = "[" + env + "] DelegationExpiry - Execution failed - critical error";

    var body = "Delegation Expiry - Critical Error\n\n"
        + "Environment:    " + env + "\n"
        + "Execution Time: " + time + "\n"
        + "Transaction ID: " + txnId + "\n"
        + "Error:          " + errorMsg + "\n"
        + "\nRecommended Actions:\n"
        + "  1. Check IDM logs with transaction ID: " + txnId + "\n"
        + "  2. Verify endpoint/delegationExpiry is deployed and accessible\n"
        + "  3. Check ForgeRock IDM service health\n"
        + "\n--\nThis is an automated notification from DelegationExpiryScheduler.";

    return { subject: subject, body: body };
}

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
