logger.error("Q adding approval msg before level 1 approval");

var content = execution.getVariables();
var requestId = content.get('id');

logger.info("Add Level 1 approval comment for request: " + requestId);

var requestObj;

try {
    // Get the latest request object
    requestObj = openidm.action(
        'iga/governance/requests/' + requestId,
        'GET',
        {},
        {}
    );
} catch (e) {
    logger.error("Failed to read request " + requestId + " for approval comment: " + e);
    "error";
}

// Basic safety checks
if (!requestObj || !requestObj.decision || !requestObj.decision.phases || !requestObj.decision.phases[0]) {
    logger.error("No decision phase found for request " + requestId + ", no approval comment added.");
    "no-phase";
}

// Assume Level 1 Approval is phases[0]
var phase = requestObj.decision.phases[0];

// Only proceed if this phase is completed and has completedBy
if (phase.status !== "complete" || !phase.completedBy) {
    logger.error("Level 1 Approval not completed or no completedBy for request " + requestId + ", no comment added.");
    "no-approver";
}

var cb = phase.completedBy;

// Build a simple display string
var name;
if (cb.givenName && cb.sn) {
    name = cb.givenName + " " + cb.sn;
} else {
    name = cb.userName || cb.id || "unknown";
}

var email = cb.mail;
var approverText = email ? (name + " (" + email + ")") : name;

var commentText = "Request approved by " + approverText + ".";

try {
    openidm.action(
        'iga/governance/requests/' + requestId,
        'POST',
        { comment: commentText },
        { _action: 'update' }
    );
    logger.info("Approval comment added for request " + requestId + ": " + commentText);
    "success";
} catch (e) {
    logger.error("Failed to add approval comment for request " + requestId + ": " + e);
    "error";
}