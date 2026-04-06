var content = execution.getVariables(); 
var requestId = content.get('id'); 
var failureReason = null; 


if(requestId && requestId != null) { 
    var requestBody = { 
        "payload": {
            "requestId": requestId
        },
        "action": 0
    }

    try {
        logger.error("Calling LIB-WorkflowAPI for initialization ")
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