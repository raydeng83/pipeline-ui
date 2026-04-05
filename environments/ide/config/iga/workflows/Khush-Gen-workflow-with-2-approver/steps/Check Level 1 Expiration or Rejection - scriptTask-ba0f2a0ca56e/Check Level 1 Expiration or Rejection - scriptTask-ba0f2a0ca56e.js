var content = execution.getVariables();
var requestId = content.get('id');

var requestObj = null;

logger.info("kyid-workflow check level 1 expiration or rejection:  " + requestId);

try {
    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    logger.info("kyid-workflow requestObj: " + requestObj);


} catch (e) {
    logger.info("kyid-workflow check level 1 expiration or rejection script failed with reason: " + e);
    execution.setVariable("requestExpired", false);
}

if (requestObj) {
    try {
        var id = requestObj.decision.phases[0].completedBy.id;
        logger.error("kyid-workflow completedBy id for level 1 approval is: " + id);

        if (id == "SYSTEM") {
            execution.setVariable("requestExpired", true);
        } else {
            execution.setVariable("requestExpired", false);
        }
    } catch (e) {
        logger.info("kyid-workflow init script failed with reason: " + e);
        execution.setVariable("requestExpired", false);
    }
} else {
    logger.info("kyid-workflow check level 1 expiration or rejection script failed with reason: " + e);
    execution.setVariable("requestExpired", false);
}
