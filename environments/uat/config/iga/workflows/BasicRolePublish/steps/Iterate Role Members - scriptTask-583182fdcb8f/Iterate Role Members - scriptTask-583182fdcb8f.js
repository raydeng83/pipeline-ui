logger.info('Creating IDM assignments for role members');

var content = execution.getVariables();
var requestId = content.get('id');
var managedRoleId = content.get('managedRoleId');
var failureReason = null;
var request = null;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  logger.info('requestObj: ' + requestObj);
  request = requestObj.request;
}
catch (e) {
  failureReason = 'Member assignment failed: Error reading request with id ' + requestId;
}

if(!failureReason) {
  try {
    // TODO: Get list of manually added role members
    var roleResponse = openidm.action('iga/governance/role/' + roleId + '/pending', 'GET', {}, {});

    // Add each member
    var memberPayload = [];
    var memberList = roleResponse.role.members;  // TODO: Fix this
    for (let i = 0; i < memberList.length; i++) {
        memberPayload.push({
            'operation': 'add',
            'field': '/members/-',
            'value':
            {
              '_ref': 'managed/alpha_user/' + memberList[i],
              '_refProperties': {}
            }
        });
    }
    openidm.patch('managed/alpha_role/' + managedRoleId, null, memberPayload); 
  }
  catch (e) {
    failureReason = 'IDM role member assignment failed: Error with role ' + request.role.roleId + ', status: ' + request.role.status + '. Error message: ' + e.message;
  }
}

if (failureReason) {
  logger.info('IDM role member assignment failed: ' + failureReason);
}
execution.setVariable('failureReason', failureReason);
execution.setVariable('managedRoleId', managedRoleId);