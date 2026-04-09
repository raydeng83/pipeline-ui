var content = execution.getVariables();
var requestId = content.get('id');

try {
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    var emails = requestObj.request.custom.approverEmails;
    var emailList = emails.split(',');

    execution.setVariable('currentLevel', 0);
    execution.setVariable('totalLevels', emailList.length);
    execution.setVariable('approverEmails', emails);

    logger.error('aaronPOC-Loop: initialized. totalLevels=' + emailList.length + ', emails=' + emails);
    execution.setVariable('failureReason', null);
} catch (e) {
    logger.error('aaronPOC-Loop: init failed: ' + e);
    execution.setVariable('failureReason', 'Init failed: ' + e);
}