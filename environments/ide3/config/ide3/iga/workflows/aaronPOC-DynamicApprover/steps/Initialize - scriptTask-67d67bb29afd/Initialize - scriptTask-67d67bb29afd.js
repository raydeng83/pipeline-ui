var content = execution.getVariables();
var requestId = content.get('id');

try {
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    logger.error('aaronPOC: request loaded: ' + requestId);
    logger.error('aaronPOC: custom payload: ' + JSON.stringify(requestObj.request.custom));

    var approverEmail = requestObj.request.custom.approverEmail;
    logger.error('aaronPOC: approver email from payload: ' + approverEmail);

    execution.setVariable('approverEmail', approverEmail);
    execution.setVariable('failureReason', null);
} catch (e) {
    logger.error('aaronPOC: init failed: ' + e);
    execution.setVariable('failureReason', 'Init failed: ' + e);
}
