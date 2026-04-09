var content = execution.getVariables();
logger.error("Naren violation Workflow Logs - content is :: "+ content)
var violationId = content.get('id');
var violationObj;
violationObj = openidm.action('iga/governance/violation/lookup/' + violationId, 'GET', {}, {});
logger.error("Naren violation Workflow Logs - violationObj Response is  :: "+ violationObj)