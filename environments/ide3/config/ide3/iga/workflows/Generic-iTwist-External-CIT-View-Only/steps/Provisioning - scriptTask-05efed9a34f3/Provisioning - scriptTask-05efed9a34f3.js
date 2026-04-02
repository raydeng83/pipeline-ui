var content = execution.getVariables();
var requestId = content.get('id');
//logger.info("kyid-workflow provisioning for request with id: " + requestId);
logger.error("kyid-workflow provisioning for request with id: " + requestId);
var koCredsAPI = identityServer.getProperty("esv.addremoveusercredential.api")
logger.error("Value of creds url is - " + koCredsAPI)
var kogCredsAPIScope = identityServer.getProperty("esv.addremoveusercredential.api.scope")
logger.error("Value of creds scope is - " + kogCredsAPIScope)
var koOrgAPI = identityServer.getProperty("esv.addremoveuseronboarding.api")
logger.error("Value of org url is - " + koOrgAPI)
var kogOrgAPIScope = identityServer.getProperty("esv.addremoveuseronboarding.api.scope")
logger.error("Value of org scope is - " + kogOrgAPIScope)

var failureReason = null;
var workflowAPICallResponse = null;

if (requestId && requestId != null) {
    var requestBody = {
        "payload": {
            "requestId": requestId
        },
        "action": 1,
        "workflowType": "generic"
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


execution.setVariable("failureReason", failureReason);