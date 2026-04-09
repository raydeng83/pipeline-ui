var content = execution.getVariables();
var requestId = content.get('id');

try {
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});

    execution.setVariable('currentLevel', 1);

    logger.error('aaronPOC-v7: initialized. custom=' + JSON.stringify(requestObj.request.custom));
} catch (e) {
    logger.error('aaronPOC-v7: init failed: ' + e);
}