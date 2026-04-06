logger.info('Running role delete request validation');

var content = execution.getVariables();
var requestId = content.get('id');
var failureReason = null;
var skipApproval = false;
var role = null;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  if (requestObj) {
      role = requestObj.request.role;
  } else {
      failureReason = 'Validation failed: Error reading request with id ' + requestId + ' requestObj: ' + requestObj;
  }
}
catch (e) {
  failureReason = 'Validation failed: Error reading request with id ' + requestId + ' Error: ' + e.message;
}

// Validation - Check original role and role owner exists
if (!failureReason) {
  try {
    var result = openidm.action('iga/governance/role/' + role.roleId + '/' + role.status, 'GET', {}, {});
    if (!result) {
      failureReason = 'Validation failed: Cannot find role with id ' + role.roleId + ', status: ' + role.status;
    } else {
        if (role.status != 'active') {
          skipApproval = true;
        } else {
            if (!result.glossary.roleOwner) {
              failureReason = 'Validation failed: No role owner set for role with id ' + role.roleId + ', status: ' + role.status;
            } else {
              execution.setVariable('roleOwner', result.glossary.roleOwner);
            }
        }
    }
  }
  catch (e) {
    failureReason = 'Validation failed: Error reading role with id ' + role.roleId + ', status: ' + role.status + '. Error message: ' + e.message;
  }
}

if (failureReason) {
  logger.info('Validation failed: ' + failureReason);
}
execution.setVariable('failureReason', failureReason);
execution.setVariable('skipApproval', skipApproval);