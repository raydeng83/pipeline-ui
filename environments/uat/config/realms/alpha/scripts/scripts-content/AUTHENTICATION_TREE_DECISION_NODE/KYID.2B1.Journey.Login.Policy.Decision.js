/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Login Policy Decision",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Policy.Decision",
    timestamp: dateTime
}

/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};


function isExceptionAllowedForRoles(array1, array2) {
    try {
        // Return false if either array is not provided or is empty
        if (!array1 || !array2 || array1.length === 0 || array2.length === 0) {
            return false;
        }
        for (var i = 0; i < array1.length; i++) {
            // Use indexOf for compatibility with Rhino
            if (array2.indexOf(array1[i]) !== -1) {
                return true;
            }
        }
        // No values found, return false
        return false;
    } catch (e) {
        nodeLogger.error(transactionid + "::" +nodeConfig.timestamp + "::" +nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Error Occurred in isExceptionAllowedForRoles:: " + e );
        return false;
    }
}


function isExceptionAllowed(value, array) {
    
    try {
        var found = false;
        array.forEach(function(item) {
            if (item === value) {
                found = true;
            }
        });
        return found;
    } catch (e) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Error Occurred in isExceptionAllowed:: " + error);
        return false;
    }
}


// === Get User Roles ===
function getUserRole(userId) {
  try {
    var response = openidm.query( "managed/alpha_user/",{  _queryFilter: '/_id/ eq "' + userId + '"',},["effectiveRoles"]);
    var result = response.result[0].effectiveRoles;
      
    const userRoleIds = [];

    // Loop through the effectiveRoles array and collect role IDs
    if(result.length>0){
      for (var i = 0; i < result.length; i++) {
          userRoleIds.push(result[i]._refResourceId);
     }
    }
    
    // Return the list of role IDs assigned to the user\
    nodeState.putShared("userRoleIds", userRoleIds);
    return userRoleIds;
  } catch (error) {
    nodeLogger.error("getUserRole() error: " + error);
    return "error";
  }
}

// === Get Application Roles for the application user is accessing===
function getAppRole(appName) {
    logger.debug("appName in getAppRole is :: => "+ appName)
  try {
    //var response = openidm.query("managed/alpha_kyid_businessapplication/" , {  _queryFilter: '/name/ eq "' + appName + '"' }, []);
    var response = openidm.query("managed/alpha_kyid_businessapplication/" , {  _queryFilter: '/name/ eq "' + appName + '"' }, ["roleAppId/*"]);
    logger.debug("response in getAppRole is :: => "+ JSON.stringify(response))
    const appRoleIds = [];
    var appRoleName = []
    for (var i = 0; i < response.result.length; i++) {
        response.result[i].roleAppId.forEach(value => {
             appRoleIds.push(value._refResourceId);
             appRoleName.push(value.name);
        })
     logger.debug("appRoleName in getAppRole is :: => "+ JSON.stringify(appRoleName))
    }

    nodeState.putShared("AppRoleIds", appRoleIds);
    nodeState.putShared("appRoleName", appRoleName);
    logger.debug("appRoleIds in getAppRole is :: => "+ appRoleIds)  
    return appRoleIds;
  } catch (error) {
    nodeLogger.error("getAppRole() error: " + error);
    return "error";
  }
}


function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
      var loginPolicies = null;
      var userKyid = null;
      var applicationName = null;
      var applicationResponse = null
      var applicationID = null
      var enforceRiskBasedAuthn = null;
      var enforceAccessAuthZ = null;
      var enforcePrereq = null;
      var riskBasedAuthnException;
      var accessAuthzException;
      var prereqException;
      var enforceRiskBasedAuthn = false;
      var enforceAccessAuthZ = false;
      var enforcePrereq = false;
        
      loginPolicies = openidm.query("managed/alpha_kyid_login_policy", {"_queryFilter" : "true"});
      logger.debug("loginPolicies JSON is :: "+ JSON.stringify(loginPolicies));
      userKyid = nodeState.get("_id");
      applicationName = nodeState.get("appName");
      enforceRiskBasedAuthn = true;
      enforceAccessAuthZ = true;
      enforcePrereq = true;

     logger.debug(" applicationName is :: "+ applicationName)
      
     // Fetch roles assigned to the user
     var userRoleIds = getUserRole(userKyid);
     nodeLogger.debug("User Roles: " + JSON.stringify(userRoleIds));
     // Fetch roles associated with the application
     var appRoleIds = getAppRole(applicationName);
     nodeLogger.debug("Application Roles: " + JSON.stringify(appRoleIds));

     // var matchedRoles = appRoleIds.filter(function(roleId) {
     //        return userRoleIds.includes(roleId);
     // });
     var matchedRoles = [];
        if (Array.isArray(appRoleIds) && Array.isArray(userRoleIds)) {
            matchedRoles = appRoleIds.filter(function(roleId) {
               return userRoleIds.includes(roleId);
            });
     } 

     logger.debug("matchedRoles is :: "+ matchedRoles)

      applicationResponse = openidm.query("managed/alpha_kyid_businessapplication/", { "_queryFilter": '/name eq "' + applicationName + '"' }, ["_id"]);
      logger.debug("applicationResponse JSON is :: "+ JSON.stringify(applicationResponse));
      if(applicationResponse!=null && applicationResponse.resultCount >0){
          applicationID = applicationResponse.result[0]._id
          logger.debug("applicationID is :: "+ applicationID);
      }
      
      

      if(loginPolicies != null && loginPolicies.resultCount > 0) {

      logger.debug("enforceRiskBasedAuthn prebool is :: "+ loginPolicies.result[0].enforceRiskBasedAuthN);
      logger.debug("enforceAccessAuthZ prebool is :: "+ loginPolicies.result[0].enforceAccessAuthZ);
      logger.debug("enforcePrereq prebool is :: "+  loginPolicies.result[0].enforcePrerequisite)
    
      enforceRiskBasedAuthn = loginPolicies.result[0].enforceRiskBasedAuthN || false;
      enforceAccessAuthZ = loginPolicies.result[0].enforceAccessAuthZ || false;
      enforcePrereq = loginPolicies.result[0].enforcePrerequisite || false;

      logger.debug("enforceRiskBasedAuthn prebool1 is :: "+ loginPolicies.result[0].enforceRiskBasedAuthN);
      logger.debug("enforceAccessAuthZ prebool1 is :: "+ loginPolicies.result[0].enforceAccessAuthZ);
      logger.debug("enforcePrereq prebool1 is :: "+  loginPolicies.result[0].enforcePrerequisite)

      logger.debug("enforceRiskBasedAuthn applicationids is :: "+ loginPolicies.result[0].riskBasedAuthNException.applicationids);
      logger.debug("enforceAccessAuthZ applicationids is :: "+ loginPolicies.result[0].accessAuthZException.applicationids);
      logger.debug("enforcePrereq applicationids is :: "+  loginPolicies.result[0].prerequisiteException.applicationids)

      logger.debug("enforceRiskBasedAuthn userids is :: "+ loginPolicies.result[0].riskBasedAuthNException.userids);
      logger.debug("enforceAccessAuthZ userids is :: "+ loginPolicies.result[0].accessAuthZException.userids);
      logger.debug("enforcePrereq is userids :: "+ loginPolicies.result[0].riskBasedAuthNException.userids)  

      logger.debug("enforceRiskBasedAuthn roleids is :: "+ loginPolicies.result[0].riskBasedAuthNException.roleids);
      logger.debug("enforceAccessAuthZ roleids is :: "+ loginPolicies.result[0].accessAuthZException.roleids);
      logger.debug("enforcePrereq is roleids :: "+ loginPolicies.result[0].prerequisiteException.roleids)     

      logger.debug("enforceRiskBasedAuthn applicationids bool is :: "+ isExceptionAllowed(applicationID, loginPolicies.result[0].riskBasedAuthNException.applicationids));
      logger.debug("enforceAccessAuthZ  applicationids bool is :: "+ isExceptionAllowed(applicationID, loginPolicies.result[0].accessAuthZException.applicationids));
      logger.debug("enforcePrereq applicationids bool is :: "+ isExceptionAllowed(applicationID, loginPolicies.result[0].prerequisiteException.applicationids)) 

      logger.debug("enforceRiskBasedAuthn userids bool is :: "+ isExceptionAllowed(userKyid, loginPolicies.result[0].riskBasedAuthNException.userids));
      logger.debug("enforceAccessAuthZ userids boolis :: "+ isExceptionAllowed(userKyid, loginPolicies.result[0].accessAuthZException.userids));
      logger.debug("enforcePrereq userids bool is :: "+ isExceptionAllowed(userKyid, loginPolicies.result[0].prerequisiteException.userids)) 

      logger.debug("enforceRiskBasedAuthn roleids bool is :: "+  isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].riskBasedAuthNException.roleids));
      logger.debug("enforceAccessAuthZ roleids boolis :: "+ isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].accessAuthZException.roleids));
      logger.debug("enforcePrereq roleids bool is :: "+ isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].prerequisiteException.roleids))

      enforceRiskBasedAuthn = enforceRiskBasedAuthn && !(isExceptionAllowed(applicationID, loginPolicies.result[0].riskBasedAuthNException.applicationids) || isExceptionAllowed(userKyid, loginPolicies.result[0].riskBasedAuthNException.userids) || isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].riskBasedAuthNException.roleids));
      enforceAccessAuthZ = enforceAccessAuthZ && !(isExceptionAllowed(applicationID, loginPolicies.result[0].accessAuthZException.applicationids) || isExceptionAllowed(userKyid, loginPolicies.result[0].accessAuthZException.userids) || isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].accessAuthZException.roleids));
      enforcePrereq = enforcePrereq && !(isExceptionAllowed(applicationID, loginPolicies.result[0].prerequisiteException.applicationids) || isExceptionAllowed(userKyid, loginPolicies.result[0].prerequisiteException.userids) || isExceptionAllowedForRoles(matchedRoles, loginPolicies.result[0].prerequisiteException.roleids));
      }
        
      logger.debug("enforceRiskBasedAuthn is :: " + applicationName + " :: "+ enforceRiskBasedAuthn);
      logger.debug("enforceAccessAuthZ is :: " + applicationName + " :: "+ enforceAccessAuthZ);
      logger.debug("enforcePrereq is :: " + applicationName + " :: "+ enforcePrereq);
      
      //Evaluate user roles with exception roles. But will be implemented later
      nodeState.putShared("enforceRiskBasedAuthn",enforceRiskBasedAuthn);
      nodeState.putShared("enforceAccessAuthZ",enforceAccessAuthZ);
      nodeState.putShared("enforcePrereq",enforcePrereq);

      action.goTo("true")

    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in " + nodeConfig.scriptName +":: " + error);
         action.goTo("true")
    }
}

main();