var content = execution.getVariables();
var requestId = content.get('id');
logger.info("kyid-workflow error handling for request with id: " + requestId);

var failureReason = "Error encountered during workflow processing";

var decision = {'outcome': 'cancelled', 'status': 'cancelled', 'comment': failureReason, 'failure': true, 'decision': 'rejected'};

var queryParams = {
    '_action': 'update'
};
var result = openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
logger.info("kyid-workflow request error status update result: " + result);