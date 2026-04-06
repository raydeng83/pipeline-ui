logger.info('Creating IDM Role');

var content = execution.getVariables();
var requestId = content.get('id');
var managedRoleId = null;
var failureReason = null;
var request = null;

try {
  var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
  logger.info('requestObj: ' + requestObj);
  request = requestObj.request;
}
catch (e) {
  failureReason = 'Create failed: Error reading request with id ' + requestId;
}

if(!failureReason) {
  try {
    var roleResponse = openidm.action('iga/governance/role/' + roleId + '/pending', 'GET', {}, {});
    // Setup IDM role object
    var idmRolePayload = {
      'name': roleResponse.role.name
    };
    if (roleResponse.glossary) {
        if(roleResponse.glossary.description) {
            idmRolePayload.description = roleResponse.glossary.description;
        }
        if(roleResponse.glossary.condition) {
            idmRolePayload.condition = roleResponse.glossary.condition;
        }
    }
    // Call IDM create role endpoint and save the returned IDM result
    var idmResult = openidm.create('managed/alpha_role', null, idmRolePayload);
    if (idmResult && idmResult._id)  {
        managedRoleId = idmResult._id;
    }

    // Add Entitlements, Applications, Manually added role members
    var idmPatchPayload = [];
    var entList = roleResponse.role.entitlements;
    for (let i = 0; i < entList.length; i++) {
        idmPatchPayload.push({
            'operation': 'add',
            'field': '/assignments/-',
            'value':
            {
              '_ref': 'managed/alpha_assignment/' + entList[i]
            }
        });
    }

    var appList = roleResponse.role.applications;
    if(appList && appList.length > 0) {
        for (let i = 0; i < appList.length; i++) {
            idmPatchPayload.push(  {
                'operation': 'add',
                'field': '/applications/-',
                'value':
                {
                  '_ref': 'managed/alpha_application/' + appList[i].id,
                  '_refProperties': {}
                }
            });
        }
    }

    var memberList = roleResponse.role.addedRoleMembers;
    if(memberList && memberList.length > 0) {
        for (let i = 0; i < memberList.length; i++) {
            idmPatchPayload.push(  {
                'operation': 'add',
                'field': '/members/-',
                'value':
                {
                  '_ref': 'managed/alpha_user/' + memberList[i],
                  '_refProperties': {}
                }
            });
        }
    }
    openidm.patch('managed/alpha_role/' + idmResult._id, null, idmPatchPayload); 
  }
  catch (e) {
    failureReason = 'IDM Creation failed: Error creating role ' + request.role.roleId + ', status: ' + request.role.status + '. Error message: ' + e.message;
  }
}

if (failureReason) {
  logger.info('IDM Creation failed: ' + failureReason);
}
execution.setVariable('failureReason', failureReason);
execution.setVariable('managedRoleId', managedRoleId);