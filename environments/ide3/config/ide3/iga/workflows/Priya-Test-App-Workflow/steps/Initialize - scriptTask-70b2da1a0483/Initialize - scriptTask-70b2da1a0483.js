var content = execution.getVariables();
var requestId = content.get('id');

var failureReason = null;
var request = null;

var requestObj = null;
var userPrerequisite = null
var requestType = null;

logger.error("Q is testing Priya workflow - requestId=" + requestId);

logger.info("kyid-workflow starting workflow with request id: " + requestId);

try {
    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    logger.info("kyid-workflow requestObj: " + requestObj);

    requestType = requestObj.requestType;

    userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);
    logger.info("kyid-workflow userPrerequisite: " + userPrerequisite);

} catch (e) {
    failureReason = "kyid-workflow error: " + e;
}



if (userPrerequisite && requestType) {
    try {
        openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [
            {"operation":"replace","field":"/status","value":"PENDING_APPROVAL"}
        ]);
    } catch (e) {
        logger.info("kyid-workflow init script failed with reason: " + e);
    }
} else {
    failureReason = "kyid-workflow error: User Prerequisite or Request Type not found";
}

execution.setVariable("failureReason", failureReason);
