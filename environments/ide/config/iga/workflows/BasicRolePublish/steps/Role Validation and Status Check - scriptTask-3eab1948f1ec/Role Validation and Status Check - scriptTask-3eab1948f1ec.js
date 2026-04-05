logger.info('Running governance role publish request validation');

var content = execution.getVariables();
var requestId = content.get('id');
var failureReason = null;
var roleId = null;
var updateIdm = true;
var iterateRoleMembers = false;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  if (requestObj) {
      roleId = requestObj.request.role.roleId;
      if('iterateRoleMembers' in requestObj.request.role) {
          iterateRoleMembers = requestObj.request.role.iterateRoleMembers;
      }
      if('updateIdm' in requestObj.request.role) {
          updateIdm = requestObj.request.role.updateIdm;
      }
  } else {
      failureReason = 'Validation failed: Error reading request with id ' + requestId + ' requestObj: ' + requestObj;
  }
}
catch (e) {
  failureReason = 'Validation failed: Error reading request with id ' + requestId + ' Error: ' + e.message;
}

// Validation - Check role and role owner exists
if (!failureReason) {
  try {
    role = openidm.action('iga/governance/role/' + roleId + '/draft', 'GET', {}, {});
    if (!role) {
      failureReason = 'Validation failed: Cannot find role with id ' + roleId + ', status: draft';
    } else {
        if (!role.glossary.roleOwner) {
          failureReason = 'Validation failed: No role owner set for role with id ' + roleId + ', status: draft';
        } else {
          execution.setVariable('roleOwner', role.glossary.roleOwner);
        }
    }
  }
  catch (e) {
    failureReason = 'Validation failed: Error reading role with id ' + roleId + ', status: draft' + '. Error message: ' + e.message + 'role: ' + role;
  }
}

if (failureReason) {
  logger.info('Validation failed: ' + failureReason);
}
execution.setVariable('failureReason', failureReason);
execution.setVariable('roleId', roleId);
execution.setVariable('updateIdm', updateIdm);
execution.setVariable('iterateRoleMembers', iterateRoleMembers);