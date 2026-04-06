logger.info("kyid-workflow send request approval email");

var content = execution.getVariables();
var requestId = content.get('id');

var failureReason = null;
var workflowAPICallResponse = null;

if (requestId && requestId != null) {
    var requestBody = {
        "payload": {
            "requestId": requestId
        },
        "action": 3,
    }

    try {
        logger.error("Calling LIB-WorkflowAPI ")
        workflowAPICallResponse = openidm.create("endpoint/LIB-WorkflowAPI", null, requestBody)

        if (workflowAPICallResponse.failureReason && workflowAPICallResponse.failureReason != null ) {
            failureReason = workflowAPICallResponse.failureReason
        }
        
    } catch (e) {
        logger.error("kyid workflow error: " + e)
        
        failureReason = "kyid-workflow error: " + e;
    }
}