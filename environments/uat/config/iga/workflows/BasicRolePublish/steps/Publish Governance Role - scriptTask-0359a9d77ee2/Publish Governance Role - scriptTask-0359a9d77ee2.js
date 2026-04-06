logger.info('Publishing Governance Role');

var content = execution.getVariables();
var requestId = content.get('id');
var roleId = content.get('roleId');
var failureReason = content.get('failureReason');
var managedRoleId = content.get('managedRoleId');
var decision = {};
var request = null;

if(!failureReason) {
    try {
      var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
      logger.info('requestObj: ' + requestObj);
      request = requestObj.request;
    }
    catch (e) {
      failureReason = 'Governance role publishing failed: Error reading request with id ' + requestId;
    }
    
    if(!failureReason) {
      try {
        if (managedRoleId) {
            managedRoleId = 'managed/alpha_role/' + managedRoleId;
        }
        var govPayload = {
            managedRoleId
        };
        var result = openidm.action('iga/governance/role/' + roleId + '/pending', 'PATCH', govPayload);
      }
      catch (e) {
        failureReason = 'Governance role publishing failed: Error publishing role ' + request.role.roleId + ', status: ' + request.role.status + '. Error message: ' + e.message;
      }

      decision = {
          'status': 'complete',
          'decision': 'approved',
          'outcome':  'fulfilled'
      };
    }
}

if(failureReason) {
    decision = {
        'status': 'complete',
        'decision': 'approved',
        'outcome': 'cancelled',
        'failure': true,
        'comment': failureReason
    };
    logger.info('Publish failed: ' + failureReason);
}

var queryParams = { '_action': 'update'};
openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
logger.info('Request ' + requestId + ' completed.');

execution.setVariable('failureReason', failureReason);