var content = execution.getVariables();
var requestId = content.get('id');
logger.error("kyid-workflow rejection for request with id: " + requestId);

var failureReason = null;
var requestObj = null;
var rejectionResult;


if (requestId && requestId != null) {
    var requestBody = {
        "payload": {
            "requestId": requestId
        },
        "action": 2
    }

    try {
        rejectionResult = openidm.create("endpoint/LIB-WorkflowAPI", null, requestBody)
        logger.error("kyid workflow rejection result: " + rejectionResult)
    } catch (e) {
        failureReason = "kyid-workflow error: " + e;
    }
}

execution.setVariable("failureReason", failureReason);