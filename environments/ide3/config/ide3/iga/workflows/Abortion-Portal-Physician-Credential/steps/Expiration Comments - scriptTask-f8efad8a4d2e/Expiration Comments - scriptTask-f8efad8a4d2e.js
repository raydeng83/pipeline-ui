/*
Script nodes are used to invoke APIs or execute business logic.
You can invoke governance APIs or IDM APIs.
See https://backstage.forgerock.com/docs/idcloud/latest/identity-governance/administration/workflow-configure.html for more details.

Script nodes should return a single value and should have the
logic enclosed in a try-catch block.

Example:
try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  applicationId = requestObj.application.id;
}
catch (e) {
  failureReason = 'Validation failed: Error reading request with id ' + requestId;
}
*/
logger.error("Q adding msg for expiration");

// Script: Expiration Comments

var content = execution.getVariables();
var requestId = content.get('id');

logger.info("Add Expiration comment for request: " + requestId);

if (!requestId) {
    logger.error("No requestId found in execution variables. No expiration comment added.");
} else {
    var commentText = "This request is expired.";

    try {
        openidm.action(
            "iga/governance/requests/" + requestId,
            "POST",
            { comment: commentText },
            { _action: "update" }
        );
        logger.info("Expiration comment added for request " + requestId + ": " + commentText);
    } catch (e) {
        logger.error("Failed to add expiration comment for request " + requestId + ": " + e);
    }
}

// end
