logger.error("Q adding approval msg for Level 2");

var content = execution.getVariables();
var requestId = content.get('id');

logger.info("Add Level 2 approval comment for request: " + requestId);

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
    logger.error("Failed to read request " + requestId + " for Level 2 approval comment: " + e);
}

// Basic safety checks
if (!requestObj || !requestObj.decision || !requestObj.decision.phases || !Array.isArray(requestObj.decision.phases)) {
    logger.error("No decision phases found for request " + requestId + ", no Level 2 approval comment added.");
}

var phases = requestObj.decision.phases;

// Find the most recent completed APPROVE phase that has an approver and completionDate
var chosenPhase = null;

for (var i = 0; i < phases.length; i++) {
    var p = phases[i];
    if (!p) {
        continue;
    }

    // Only consider completed “approve” phases with an approver and completionDate
    if (p.status === "complete" &&
        p.decision === "approve" &&
        p.completedBy &&
        p.completionDate) {

        if (!chosenPhase) {
            chosenPhase = p;
        } else {
            // Pick the one with the latest completionDate
            try {
                var currentTime = new Date(p.completionDate).getTime();
                var chosenTime = new Date(chosenPhase.completionDate).getTime();
                if (currentTime > chosenTime) {
                    chosenPhase = p;
                }
            } catch (e) {
                // If parsing dates fails, just keep existing chosenPhase
            }
        }
    }
}

if (!chosenPhase) {
    logger.error("No completed approve phase with approver found for request " + requestId + ", no Level 2 approval comment added.");
}

var phase = chosenPhase;
var cb = phase.completedBy;

// Build a simple display string for the approver
var name;
if (cb.givenName && cb.sn) {
    name = cb.givenName + " " + cb.sn;
} else {
    name = cb.userName || cb.id || "unknown";
}

var email = cb.mail;
var approverText = email ? (name + " (" + email + ")") : name;

// Use displayName / name to show which node/level approved
var stageName = phase.displayName || phase.name || "";
var commentText;

if (stageName) {
    commentText = "Request approved by " + approverText + " at " + stageName + ".";
} else {
    commentText = "Request approved by " + approverText + ".";
}

try {
    openidm.action(
        'iga/governance/requests/' + requestId,
        'POST',
        { comment: commentText },
        { _action: 'update' }
    );
    logger.info("Level 2 approval comment added for request " + requestId + ": " + commentText);
} catch (e) {
    logger.error("Failed to add Level 2 approval comment for request " + requestId + ": " + e);
}
