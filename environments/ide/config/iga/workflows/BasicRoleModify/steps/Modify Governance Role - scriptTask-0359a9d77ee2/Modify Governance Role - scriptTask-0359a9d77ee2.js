logger.info('Modifying Governance Role');

var content = execution.getVariables();
var requestId = content.get('id');
var failureReason = content.get('failureReason');
var comment = content.get('comment');
var decision = {};
var request = null;

if(!failureReason) {
    try {
      var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
      logger.info('requestObj: ' + requestObj);
      request = requestObj.request;
    }
    catch (e) {
      failureReason = 'Governance role modification failed: Error reading request with id ' + requestId;
    }
    
    // IDM Update
    if(!failureReason) {
      try {
        var origGovRole = openidm.action('iga/governance/role/' + request.role.roleId + '/' + request.role.status, 'GET', {}, {});
        if (origGovRole) {
            if(origGovRole.role.managedRoleId) {
                // Do IDM Update stuff here:
                // Setup IDM role object
                var idmRolePayload = {
                  'name': request.role.object.name
                };
        
                if (request.role.glossary) {
                    Object.keys(request.role.glossary).forEach(key => {
                        idmRolePayload[key] = request.role.glossary[key];
                    });
                }
                openidm.update(origGovRole.role.managedRoleId, null, idmRolePayload);
        
                // TODO: revisit getting all ents (iterate over pages)
                var idmEntParams = {
                    _queryFilter: '(/type eq "__ENTITLEMENT__")',
                    _pageSize: 1000
                };
                var currentIdmEnts =  openidm.query(origGovRole.role.managedRoleId + '/assignments', idmEntParams, null);
                currentIdmEnts = currentIdmEnts.result;
        
                var idmPatchPayload = [];
                
                var modifiedEnts = request.role.object.entitlements;
                var entsRemoved = origGovRole.role.entitlements.filter((e) => !modifiedEnts.includes(e));
                var entsAdded = modifiedEnts.filter((e) => !origGovRole.role.entitlements.includes(e));
        
                for (let i = 0; i < entsAdded.length; i++) {
                    idmPatchPayload.push({
                        'operation': 'add',
                        'field': '/assignments/-',
                        'value':
                        {
                          '_ref': 'managed/alpha_assignment/' + entsAdded[i]
                        }
                    });
                }
        
                for (let i = 0; i < entsRemoved.length; i++) {
                    var currentEnt = currentIdmEnts.find(ent => ent._refResourceId === entsRemoved[i]);
                    idmPatchPayload.push({
                        'operation': 'remove',
                        'field': '/assignments',
                        'value':
                        {
                          '_ref': 'managed/alpha_assignment/' + entsRemoved[i],
                          '_refResourceCollection': 'managed/alpha_assignment',
                          '_refResourceId': entsRemoved[i],
                          '_refProperties': currentEnt._refProperties
                        }
                    });
                }
        
                // TODO: revisit getting all apps (iterate over pages)
                var idmAppParams = {
                    _queryFilter: 'true',
                    _pageSize: 1000
                };
                
                var currentIdmApps =  openidm.query(origGovRole.role.managedRoleId + '/applications', idmAppParams, null);
                currentIdmApps = currentIdmApps.result;
        
                var origApps = [];
                var modifiedApps = [];
                if (origGovRole.role.applications) {
                    origApps = origGovRole.role.applications.map((app) => {
                        return app.id;
                    });
                }
                
                if (request.role.object.applications) {
                    modifiedApps = request.role.object.applications.map((app) => {
                        return app.id;
                    });
                }
                var appsRemoved = origApps.filter((e) => !modifiedApps.includes(e));
                var appsAdded = modifiedApps.filter((e) => !origApps.includes(e));
            
                for (let i = 0; i < appsAdded.length; i++) {
                    idmPatchPayload.push(  {
                        'operation': 'add',
                        'field': '/applications/-',
                        'value':
                        {
                          '_ref': 'managed/alpha_application/' + appsAdded[i],
                          '_refProperties': {}
                        }
                    });
                }
        
                for (let i = 0; i < appsRemoved.length; i++) {
                    var currentApp = currentIdmApps.find(app => app._refResourceId === appsRemoved[i]);
                    idmPatchPayload.push({
                        'operation': 'remove',
                        'field': '/applications',
                        'value':
                        {
                          '_ref': 'managed/alpha_application/' + appsRemoved[i],
                          '_refResourceCollection': 'managed/alpha_application',
                          '_refResourceId': appsRemoved[i],
                          '_refProperties': currentApp._refProperties
                        }
                    });
                }
        
                // TODO: revisit getting all members (iterate over pages)
                var idmAppParams = {
                    _queryFilter: 'true',
                    _pageSize: 1000
                };
                
                var currentIdmMembers =  openidm.query(origGovRole.role.managedRoleId + '/members', idmAppParams, null);
                currentIdmMembers = currentIdmMembers.result;
        
                var origMembers = [];
                var modifiedMembers = [];
                if (origGovRole.role.addedRoleMembers) {
                    origMembers = origGovRole.role.addedRoleMembers;
                }
                
                if (request.role.object.addedRoleMembers) {
                    modifiedMembers = request.role.object.addedRoleMembers;
                }
                var membersRemoved = origMembers.filter((e) => !modifiedMembers.includes(e));
                var membersAdded = modifiedMembers.filter((e) => !origMembers.includes(e));
            
                for (let i = 0; i < membersAdded.length; i++) {
                    idmPatchPayload.push(  {
                        'operation': 'add',
                        'field': '/members/-',
                        'value':
                        {
                          '_ref': 'managed/alpha_user/' + membersAdded[i],
                          '_refProperties': {}
                        }
                    });
                }
        
                for (let i = 0; i < membersRemoved.length; i++) {
                    var currentMember = currentIdmMembers.find(member => member._refResourceId === membersRemoved[i]);
                    idmPatchPayload.push({
                        'operation': 'remove',
                        'field': '/members',
                        'value':
                        {
                          '_ref': 'managed/alpha_user/' + membersRemoved[i],
                          '_refResourceCollection': 'managed/alpha_user',
                          '_refResourceId': membersRemoved[i],
                          '_refProperties': currentMember._refProperties
                        }
                    });
                }
                
                openidm.patch(origGovRole.role.managedRoleId, null, idmPatchPayload);
            }
        } else {
            failureReason = 'Modify failed: Cannot find role with id ' + request.role.roleId + ', status: ' + request.role.status;
        }
      }
      catch (e) {
        failureReason = 'IDM Update failed: Error updating role ' + request.role.roleId + ', status: ' + request.role.status + '. Error message: ' + e.message;
      }
    }
    
    if(!failureReason) {
      try {
        var modifiedRoleProps = request.role.object;
        var modifiedGlossary = request.role.glossary;
        var payload = {};
        var role = {};
        Object.assign(role, modifiedRoleProps);
        payload.role = role;
        payload.role.roleId = request.role.roleId;
        payload.role.status = request.role.status;
        if(modifiedGlossary){
            payload.glossary = modifiedGlossary;
        }
        var result = openidm.action('iga/governance/role/' + request.role.roleId + '/' + request.role.status, 'PUT', payload);
      }
      catch (e) {
        failureReason = 'Governance role modification failed: Error modifying role ' + request.role.roleId + ', status: ' + request.role.status + '. Error message: ' + e.message;
      }

      decision = {
          'status': 'complete',
          'decision': 'approved',
          'outcome':  'fulfilled',
          'comment': comment
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
    logger.info('Modifying failed: ' + failureReason);
}

var queryParams = { '_action': 'update'};
openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
logger.info('Request ' + requestId + ' completed.');