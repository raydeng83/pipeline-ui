var content = execution.getVariables();
var requestId = content.get('id');
var requestExpired = content.get('requestExpired');
var failureReason = null;


if (requestId && requestId != null) {
    if (requestExpired) {
        var requestBody = {
            "payload": {
                "requestId": requestId,
                "displayName": "Level 1 Backup Approval"
            },
            "action": 5
        }
    } else {
        var requestBody = {
            "payload": {
                "requestId": requestId,
                "displayName": "Level 1 Approval"
            },
            "action": 5
        }
    }


    try {
        logger.error("Calling LIB-WorkflowAPI for adding level 1 approval comments ")
        workflowAPICallResponse = openidm.create("endpoint/LIB-WorkflowAPI", null, requestBody)

        if (workflowAPICallResponse.failureReason && workflowAPICallResponse.failureReason != null) {
            failureReason = workflowAPICallResponse.failureReason
        }

    } catch (e) {
        logger.error("kyid workflow error: " + e)

        failureReason = "kyid-workflow error: " + e;
    }
}

execution.setVariable("failureReason", failureReason);
execution.setVariable("requestExpired", false);