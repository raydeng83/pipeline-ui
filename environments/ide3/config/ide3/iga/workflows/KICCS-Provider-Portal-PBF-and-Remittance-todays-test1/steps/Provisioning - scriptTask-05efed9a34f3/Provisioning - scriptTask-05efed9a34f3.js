var content = execution.getVariables();
var requestId = content.get('id');
logger.error("kyid-workflow provisioning for request with id: " + requestId);
let requestBody = {
    action: "1",
    requestId: requestId
}
logger.error("kyid-workflow provisioning with request " + requestBody);
var response = openidm.create("endpoint/workflowProvisioning", null, requestBody)
execution.setVariable("failureReason", response);
logger.error("kyid-workflow provisioning completed");

