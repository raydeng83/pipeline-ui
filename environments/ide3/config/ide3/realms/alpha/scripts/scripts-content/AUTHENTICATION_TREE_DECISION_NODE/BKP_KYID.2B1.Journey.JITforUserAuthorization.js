/**
 * Script: KYID.Journey.ReadUserKOGProfileInfo
 * Description: This script is used to invoke KOG user authorization API. It will give information about user roles and application.
 * Date: 26th July 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get KOG User Authorization",
    script: "Script",
    scriptName: "KYID.Journey.ReadUserAuthz",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingEmail: "Missing email",
    emailInfoInSession: "emailaddress value in session",
    missingKogUsrProfileAPIInfo: "Missing KOG UserProfile API details", 
    missingKogTokenAPIInfo: "Missing KOG Token API details", 
    errorAPICall: "Cannot invoke profile api as required parameters are missing.",
    apiRequest_KOG_USR_PROFILE: "KOG_USR_PROFILE", 
    apiRespParam_FirstName: "FirstName",
    apiRespParam_LastName: "LastName",
    apiRespParam_EmailAddress: "EmailAddress",
    apiRespParam_UPN: "UPN",     
    apiRespParam_Logon: "Logon",
    apiRespParam_KOGID: "KOGID",
    apiRespParam_LanguagePreference: "LanguagePreference",
    apiRespParam_PhoneNumbers: "PhoneNumbers",
    apiRespParam_SymantecVIPCredentialID: "SymantecVIPCredentialID", 
    apiRespParam_OktaVerify: "OktaVerify",
    apiRespParam_UserStatus: "UserStatus",
    apiResponse_KOG_TOKEN:  "KOG_TOKEN_API_RESPONSE",  
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE", 
    apiResponseStatus: "Status", 
    apiResponsePass: "API_RESULT_SUCCESS",   
    apiResponseFail: "API_RESULT_FAILURE",  
    apiRespFailMsgCode:  "MessageCode",
    apiRespFailMsg_114: "-114",
    apiRespFailMsg_115: "-115",
    idmQueryFail: "IDM Query Operation Failed",
    usrRecord: "User Record",
    registeredMFAMethods: "Registered MFA methods",
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
    SUCCESS: "next",
    FAIL: "failure",
    MISSING_MANDATORY_CONFIG: "missingMandatoryConfig",
    NOROLESTOUSER: "noUserAuthz",
    API_FAILED: "APIFailed",
    KOG_API_FAILED: "kogAPIFailed",
    ROLE_MISSING_IN_PING: "roleMissingInPing",
    ERROR: "error"
};

 // Logging Function
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

 // Declare Global Variables
 var missingInputs = [];
 var mail = null;
//nodeState.putShared("mail","milan.man121815a@keups.net")
if (typeof existingSession !== 'undefined')
{
  mail = existingSession.get("emailaddress");
  nodeState.putShared("mail",mail);
  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.emailInfoInSession+"::"+mail);  
    
} else{
    //nodeState.putShared("mail","MeganEaton@mailinator.com")
    if(nodeState.get("mail")) {
     mail = nodeState.get("mail");
    }  else if (nodeState.get("EmailAddress")){
        mail = nodeState.get("EmailAddress");
    } else {
     missingInputs.push(nodeConfig.missingEmail);
    }
}


var kogTokenApi;
if(systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token")!=null){
    kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}
    
// if(systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile") && systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile")!=null) { 
//  var kogUsrProfileApi = systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile");   
// }  else {
//  missingInputs.push(nodeConfig.missingKogUsrProfileAPIInfo);
// }

//var kogUsrAuthorizationApiURL = "https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/getuserauthorizations";

var kogUsrAuthorizationApiURL;
if(systemEnv.getProperty("esv.kyid.usr.authorization") && systemEnv.getProperty("esv.kyid.usr.authorization")!=null){
    kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
} else {
     missingInputs.push("nodeConfig.missingInputParams");
}

var sihcertforapi;
if(systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client")!=null){
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

//nodeState.putShared("KOGID","30270453-f331-4d8d-b0dc-0c9cc6246dd1")
var userKOGID= nodeState.get("KOGID")

if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);

} else {
   try{
    var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
    var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
    nodeLogger.error("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));
    
        //If the Access token is 200
        if (kogAPITokenResponse.status === 200){
            var bearerToken = kogAPITokenResponse.response;
            
            var payload = {
                    KOGID:userKOGID
            }
             nodeLogger.error("payload in ReadUserAuthz " + JSON.stringify(payload));
            var requestOptions = {
                "clientName": sihcertforapi,
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "token": bearerToken,
                "body": payload
    };

    var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();

    logger.error("KOG API Status: " + res.status);
    action.withHeader(`Response code: ${res.status}`);

    if (res.status === 200) {
        var data = JSON.parse(res.text());
        logger.error("KOG Response: " + JSON.stringify(data));

        if (data.ResponseStatus === 0 && data.UserAuthorizations) {
           // nodeState.putShared("usrcreatedId","c6657e2d-c325-41d9-9822-56ce4088a8e8")
            var id = nodeState.get("usrcreatedId");
            nodeState.putShared("createdUserId",id);
            var userRoleIds = getUserRole(id); // Get existing role _ids of the user

            var rolesToAssign = [];
            var rolesNotFound = [];
            var assignedRoleIds = []; // for duplicate check 
            // Loop over each KOG authorization
            data.UserAuthorizations.forEach(function (auth) {
                if (auth.ApplicationName && auth.RoleName && auth.ApplicationName.localeCompare("EDRS") !== 0) {
                    logger.error("From KOG - App: " + auth.ApplicationName + ", Role: " + auth.RoleName);

                    // Step 1: Find application by name
                    var appQuery = openidm.query("managed/alpha_kyid_businessapplication", {
                        "_queryFilter": 'name eq "' + auth.ApplicationName + '"'
                    });
                    nodeState.putShared("provisioningRole",auth.RoleName);
                    nodeState.putShared("applicationName",auth.ApplicationName);
                    if (appQuery.result.length > 0) {
                        var appId = appQuery.result[0]._id;

                        // Step 2: Find role matching RoleName + AppId
                        var roleQuery = openidm.query("managed/alpha_role", {
                            "_queryFilter": 'name eq "' + auth.RoleName + '" and businessAppId/_refResourceId eq "' + appId + '"'
                        });
                         logger.error("the role length is "+ roleQuery.result.length )
                        if (roleQuery.result.length === 1) {
                            logger.error("the role length found is 1")
                            var roleId = roleQuery.result[0]._id;

                            // Step 3: Only assign if not already present
                            // if (userRoleIds.indexOf(roleId) === -1) { 
                            //     rolesToAssign.push({
                            //         "_ref": "managed/alpha_role/" + roleId,
                            //         "_refResourceCollection": "managed/alpha_role",
                            //         "_refResourceId": roleId
                            //     });
                            //     logger.error("Mapped NEW Role: " + auth.RoleName + " under App: " + auth.ApplicationName);
                            // } else {
                            //     logger.error("Role already assigned: " + auth.RoleName + " under App: " + auth.ApplicationName);
                            // }
                            //var assignedRoleIds = [];
                            
                            // Step 3: Only assign if not already present
                            if (userRoleIds.indexOf(roleId) === -1) {
                                if (assignedRoleIds.indexOf(roleId) === -1) {
                                    rolesToAssign.push({
                                        "_ref": "managed/alpha_role/" + roleId,
                                        "_refResourceCollection": "managed/alpha_role",
                                        "_refResourceId": roleId
                                    });
                                    assignedRoleIds.push(roleId); // avoid duplicates in the rolesToAssign 
                                    logger.error("Mapped NEW Role: " + auth.RoleName + " under App: " + auth.ApplicationName);
                                } else {
                                    logger.error("Duplicate role in already in rolesToAssign: " + auth.RoleName + " under App: " + auth.ApplicationName);
                                }
                            } else {
                                logger.error("Role already assigned to user: " + auth.RoleName + " under App: " + auth.ApplicationName);
                            }

                            
                        } else {
                            logger.error("Role NOT found in Ping or more than one Role found in PING: " + auth.RoleName + " under App: " + auth.ApplicationName);
                            rolesNotFound.push(auth.RoleName);
                        }
                    } else {
                        logger.error("Application NOT found in Ping: " + auth.ApplicationName);
                        rolesNotFound.push(auth.RoleName);
                    }
                }
            });

            // Patch roles if any new roles to assign
            if (rolesToAssign.length > 0) {
                 logger.error("Patched NEW roles: " + JSON.stringify(rolesToAssign));
                var patchOps = rolesToAssign.map(function (role) {
                    return {
                        "operation": "add",
                        "field": "/roles/-",
                        "value": role
                    };
                });
                logger.error("Patching NEW roles");
                try {
                var patchResult = openidm.patch("managed/alpha_user/" + id, null, patchOps);
                logger.error("Patched new roles");  
                        
                } catch (error){
                    logger.error("Failed to patch roles");
                }
                action.goTo(nodeOutcome.SUCCESS);
            } else if (rolesNotFound.length > 0) {
                logger.error("Some roles were not found or already assigned: " + JSON.stringify(rolesNotFound));
                action.goTo(nodeOutcome.ROLE_MISSING_IN_PING);
            } else {
                logger.error("No new roles to assign.");
                action.goTo(nodeOutcome.SUCCESS);
            }

        } else if (data.ResponseStatus === 0 && data.UserAuthorizations === null) {
            logger.error("User has no roles in KOG.");
            action.goTo(nodeOutcome.NOROLESTOUSER);
        } else if (data.ResponseStatus === 1 && data.MessageResponses) {
            var msg = data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ");
            logger.error("KOG Error: " + msg);
            nodeState.putShared("jituserauthzapierror", msg);
            action.goTo(nodeOutcome.ERROR);
        } else {
            logger.error("Unexpected KOG response structure.");
            nodeState.putShared("jituserauthzapierror", "Unknown KOG error");
            action.goTo(nodeOutcome.ERROR);
        }
    } else {
        logger.error("AccessToken API did not return 200 OK.");
        action.goTo(nodeOutcome.API_FAILED);
    }
        }
   } catch (error) {
    logger.error("Exception: " + error);
    action.goTo(nodeOutcome.FAIL);
}
}

function getUserRole(userId) {
    var response = openidm.read("managed/alpha_user/" + userId);
    var result = response.effectiveRoles;
    const userRoleIds = [];
    for (var i = 0; i < result.length; i++) {
        userRoleIds.push(result[i]._refResourceId);
    }
    return userRoleIds;
}
