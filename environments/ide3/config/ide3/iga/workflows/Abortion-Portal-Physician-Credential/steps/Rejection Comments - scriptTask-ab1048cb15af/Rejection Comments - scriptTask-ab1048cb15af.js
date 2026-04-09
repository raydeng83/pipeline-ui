// Script: Add "rejected by" comment after Level 1 Approval (Reject path)

var content = execution.getVariables();
var requestId = content.get('id');

logger.info("Add Level 1 Rejection comment for request: " + requestId);

var requestObj;

try {
    requestObj = openidm.action(
        "iga/governance/requests/" + requestId,
        "GET",
        {},
        {}
    );
} catch (e) {
    logger.error("Failed to read request " + requestId + " for rejection comment: " + e);
}

// If we couldn't load or don't have phases, stop quietly
if (!requestObj || !requestObj.decision || !requestObj.decision.phases) {
    logger.error("No decision phases found for request " + requestId + ". No rejection comment added.");
} else {
    var phases = requestObj.decision.phases;
    var phase = null;
    var cb = null;

    // Find the Level 1 Approval phase that is completed with a reject decision
    for (var i = 0; i < phases.length; i++) {
        var p = phases[i];

        var isLevel1 = (p.displayName === "Level 1 Approval");

        if (isLevel1 &&
            p.status === "complete" &&
            (p.decision === "reject" || p.decision === "rejected" || p.decision === "deny") &&
            p.completedBy) {

            phase = p;
            cb = p.completedBy;
            break;
        }
    }

    if (cb) {
        // Build "Name (email)" same as approve node
        var name;
        if (cb.givenName && cb.sn) {
            name = cb.givenName + " " + cb.sn;
        } else {
            name = cb.userName || cb.id || "unknown";
        }

        var email = cb.mail;
        var approverText = email ? (name + " (" + email + ")") : name;

        var commentText = "Request rejected by " + approverText + ".";

        try {
            openidm.action(
                "iga/governance/requests/" + requestId,
                "POST",
                { comment: commentText },
                { _action: "update" }
            );
            logger.info("Rejection comment added for request " + requestId + ": " + commentText);
        } catch (e) {
            logger.error("Failed to add rejection comment for request " + requestId + ": " + e);
        }
    } else {
        logger.error("No completed Level 1 rejection phase / completedBy found for request "
            + requestId + ". No rejection comment added.");
    }
}

// end of script
