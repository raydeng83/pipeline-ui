var content = execution.getVariables();
var requestId = content.get('id');
logger.error("kyid-workflow provisioning for request with id: " + requestId);
let requestBody = {
    action: "1",
    requestId: requestId
}
logger.error("kyid-workflow provisioning with request " + requestBody);
openidm.create("endpoint/workflowProvisioning", null, requestBody)
logger.error("kyid-workflow provisioning completed");

