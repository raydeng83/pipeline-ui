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


var kogUsrAuthorizationApiURL;
if(systemEnv.getProperty("esv.kyid.usr.authorization") && systemEnv.getProperty("esv.kyid.usr.authorization")!=null){
    kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

var sihcertforapi;
if(systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client")!=null){
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

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
                logger.error("KOG API Response: " + JSON.stringify(data));

                if (data.ResponseStatus === 0 && data.UserAuthorizations) {
                    var userId = nodeState.get("usrcreatedId");
                    nodeState.putShared("createdUserId", userId);

                    var userRoleIds = getUserRole(userId); // get alpha_role
                    var processedRoles = [];
                    var rolesNotFound = [];

                    data.UserAuthorizations.forEach(function (auth) {
                        if (auth.ApplicationName && auth.RoleName && auth.ApplicationName.localeCompare("EDRS") !== 0) {

                            logger.error("Processing Auth: App=" + auth.ApplicationName + " Role=" + auth.RoleName);

                            // Check Application by name
                            var appQuery = openidm.query("managed/alpha_kyid_businessapplication", {
                                "_queryFilter": 'name eq "' + auth.ApplicationName + '"'
                            });

                            if (appQuery.result.length > 0) {
                                var appId = appQuery.result[0]._id;

                                // Check Role inside this App
                                var roleQuery = openidm.query("managed/alpha_role", {
                                    "_queryFilter": 'name eq "' + auth.RoleName +'" and businessAppId/_refResourceId eq "' + appId + '"'
                                });

                                if (roleQuery.result.length > 0) {
                                    var roleId = roleQuery.result[0]._id;

                                    // Build query filter along with optional conditions
                                    var accessFilter =
                                        'userIdentifier eq "' + userId + '"' +
                                        ' and roleIdentifier eq "' + roleId + '"' +
                                        ' and appIdentifier eq "' + appId + '"' +
                                        ' and (recordState eq "0" or recordState eq "ACTIVE")';
                                        

                                    // Append orgId condition if present

                                    if (auth.KOGOrgId && auth.KOGOrgId !== 0) {
                                        accessFilter += ' and orgId eq "' + auth.KOGOrgId.toString() + '"';
                                    }

                                    // Append BusinessKeyId condition if present
                                    if (auth.BusinessKeyId) {
                                        accessFilter += ' and kogOrgBusinessKeyId eq "' + auth.BusinessKeyId + '"';
                                    }

                                    var accessQuery = openidm.query("managed/alpha_kyid_access", {
                                        "_queryFilter": accessFilter
                                    });

                                    if (accessQuery.result.length > 0) {
                                        //Check here if relationship exists ==> if not then just patch to the existing one 
                                       
                                         var existingAccess = accessQuery.result[0];
                                        logger.error("the existingAccess result::"+JSON.stringify(existingAccess))
                                        var patchOps = [];

                                        // Check if any reference is missing or incorrect
                                        if (existingAccess.user == null || !existingAccess.user) {
                                            logger.error("user do not have user relationship with access"+userId)
                                        patchOps.push({
                                            operation: "replace",
                                            field: "/user",
                                            value: { 
                                                "_ref": "managed/alpha_user/" + userId, 
                                                "_refResourceId": userId, 
                                                "_refResourceCollection": "managed/alpha_user" 
                                            }
                                        });
                                    }
                                    
                                    if (!existingAccess.role || existingAccess.role == null) {
                                        logger.error("user has role relationship with access:"+roleId)
                                        patchOps.push({
                                            operation: "replace",
                                            field: "/role",
                                            value: { 
                                                "_ref": "managed/alpha_role/" + roleId, 
                                                "_refResourceId": roleId, 
                                                "_refResourceCollection": "managed/alpha_role" 
                                            }
                                        });
                                    }
                                    
                                    if (!existingAccess.app || existingAccess.app == null) {
                                        logger.error("user has app relationship with access:"+appId)
                                        patchOps.push({
                                            operation: "replace",
                                            field: "/app",
                                            value: { 
                                                "_ref": "managed/alpha_kyid_businessapplication/" + appId, 
                                                "_refResourceId": appId, 
                                                "_refResourceCollection": "managed/alpha_kyid_businessapplication" 
                                            }
                                        });
                                    }

                                        if (patchOps.length > 0) {
                                            try {
                                                openidm.patch("managed/alpha_kyid_access/" + existingAccess._id, null, patchOps);
                                                logger.error("Updated existing Access MO with missing references: " + existingAccess._id);
                                            } catch (patchErr) {
                                                logger.error("Error patching Access MO references: " + patchErr);
                                            }
                                        } else {
                                            logger.error("Access entry already correct for App=" + auth.ApplicationName + " Role=" + auth.RoleName+ "Access ID: " + existingAccess._id);
                                        }

                                        // Add role to alpha_user if missing
                                        if (userRoleIds.indexOf(roleId) === -1) {
                                            logger.error("Role: "+roleId+ "missing in alpha_user, patching now...");
                                            patchAlphaRoleMO(userId, roleId);
                                        } else {
                                            logger.error("Role: "+roleId+ " already present in alpha_user");
                                        }
                                    } else {
                                        logger.error("No access entry found for role :" + roleId+", creating...");
                                        var accessResult = createAccessMO(appId, roleId, userId, auth);

                                        if (userRoleIds.indexOf(roleId) === -1) {
                                            logger.error("Role: " +roleId+ "missing in alpha_user, patching now...");
                                            patchAlphaRoleMO(userId, roleId);
                                        } else {
                                            logger.error("Role already present in alpha_user. Access MO updated"+accessResult.result._id);
                                        }
                                    }

                                    processedRoles.push({ appId: appId, roleId: roleId });

                                } else {
                                    logger.error("No role found for: " + auth.RoleName + " under App: " + auth.ApplicationName);
                                    rolesNotFound.push(auth.RoleName);
                                }

                            } else {
                                logger.error("No application found for: " + auth.ApplicationName);
                                rolesNotFound.push(auth.ApplicationName);
                            }
                        }
                    });

                    logger.error("Processed Roles: " + JSON.stringify(processedRoles));
                    action.goTo(nodeOutcome.SUCCESS);

                } else if (data.ResponseStatus === 0 && data.UserAuthorizations === null) {
                    logger.error("User has no roles in KOG");
                    action.goTo(nodeOutcome.NOROLESTOUSER);
                } else {
                    logger.error("Unexpected KOG response: " + JSON.stringify(data));
                    action.goTo(nodeOutcome.SUCCESS);
                }

            } else {
                logger.error("KOG Authz API failed with status: " + res.status);
                action.goTo(nodeOutcome.SUCCESS);
            }

        } else {
            logger.error("Access Token retrieval failed");
            action.goTo(nodeOutcome.SUCCESS);
        }

    } catch (error) {
        logger.error("Exception in JIT User Authz: " + error);
        action.goTo(nodeOutcome.SUCCESS);
    }
}

function getUserRole(userId) {
    var response = openidm.read("managed/alpha_user/" + userId);
    var result = response.effectiveRoles || [];
    const userRoleIds = [];
    for (var i = 0; i < result.length; i++) {
        userRoleIds.push(result[i]._refResourceId);
    }
    return userRoleIds;
}

function patchAlphaRoleMO(userId, roleId) {
    try {
        // Get current roles using your safe getUserRole function
        var currentRoles = getUserRole(userId);

        // If role already exists, skip patch
        if (currentRoles.indexOf(roleId) !== -1) {
            logger.error("patchAlphaRoleMO: Skipping patch, role already exists: " + roleId);
            return;
        }

        // Build patch operation
        var patchOps = [{
            operation: "add",
            field: "/roles/-",
            value: {
                "_ref": "managed/alpha_role/" + roleId,
                "_refResourceCollection": "managed/alpha_role",
                "_refResourceId": roleId
            }
        }];

        try {
            openidm.patch("managed/alpha_user/" + userId, null, patchOps);
            logger.error("patchAlphaRoleMO: Patched role in alpha_user: " + roleId);
        } catch (e) {
            logger.error("patchAlphaRoleMO: Error in patching user role: " + e);
        }

    } catch (err) {
        logger.error("patchAlphaRoleMO exception: Failed to patch role in alpha_user: " + err);
    }
}

// function patchAlphaRoleMO(userId, roleId) {
//     try {
//         var currentRoles = [];
//         try {
//             var userResp = openidm.read("managed/alpha_user/" + userId);
//             currentRoles = (userResp.effectiveRoles || []).map(function (r) {
//                 return r._refResourceId;
//             });
//         } catch (readErr) {
//             logger.error("patchAlphaRoleMO: Failed to read user before patch: " + readErr);
//         }

//         if (currentRoles.indexOf(roleId) !== -1) {
//             logger.error("patchAlphaRoleMO: Skipping patch, role already exists: " + roleId);
//             return;
//         }

//         var patchOps = [{
//             operation: "add",
//             field: "/roles/-",
//             value: {
//                 "_ref": "managed/alpha_role/" + roleId,
//                 "_refResourceCollection": "managed/alpha_role",
//                 "_refResourceId": roleId
//             }
//         }];

//         try {
//             openidm.patch("managed/alpha_user/" + userId, null, patchOps);
//             logger.error("patchAlphaRoleMO: Patched role in alpha_user: " + roleId);
//         } catch (e) {
//             logger.error("patchAlphaRoleMO: Error in patching user role" + e);
//         }

//     } catch (err) {
//         logger.error("patchAlphaRoleMO exception: Failed to patch role in alpha_user: " + err);
//     }
// }

function createAccessMO(appId, roleId, userId, auth) {
    var now = new Date().toISOString();
    var nowEpoch = Date.now();

    // Base Access MO data
    var data = {
        app: { "_ref": "managed/alpha_kyid_businessapplication/" + appId },
        user: { "_ref": "managed/alpha_user/" + userId },
        role: { "_ref": "managed/alpha_role/" + roleId },
        isForwardDelegable: false,
        assignmentDate: now,
        assignmentDateEpoch: nowEpoch,
        recordState: "0",
        recordSource: "1",
        createDate: now,
        createDateEpoch: nowEpoch,
        updateDate: now,
        updateDateEpoch: nowEpoch,
        createdBy: userId,
        updatedBy: userId,
        appIdentifier: appId,
        roleIdentifier: roleId,
        userIdentifier: userId
    };

    try {
        //Add Org details if present
        if (auth.KOGOrgId && auth.KOGOrgId !== 0) {
            data.orgId = auth.KOGOrgId.toString();
        }

        if (auth.OrgTypeName) {
            data.orgType = auth.OrgTypeName;
        }
        if (auth.OrgName) {
            data.OrgName = auth.OrgName;
        }

        //Add Business Key details if present
        if (auth.BusinessKeyTypeName) {
            data.businessKeyTypeName = auth.BusinessKeyTypeName;
        }
        if (auth.BusinessKeyId) {
            data.businessKeyName = auth.BusinessKeyId;
        }
        if (auth.BusinessKeyValue) {
            data.businessKeyValue = auth.BusinessKeyValue;
        }

        //Lookup Current Delegator in alpha_user
        if (auth.CurrentDelegatorKOGID) {
            try {
                var currDelegatorQuery = openidm.query("managed/alpha_user", {
                    "_queryFilter": 'userName eq "' + auth.CurrentDelegatorKOGID + '"'
                });
                if (currDelegatorQuery.result.length > 0) {
                    var currDelegatorId = currDelegatorQuery.result[0]._id;
                    data.currentDelegatorIdentifier = currDelegatorId;
                    data.currentDelegator = { "_ref": "managed/alpha_user/" + currDelegatorId };
                } else {
                    logger.error("createAccessMO: CurrentDelegator not found in alpha_user: " + auth.CurrentDelegatorKOGID);
                }
            } catch (e1) {
                logger.error("createAccessMO: Error querying CurrentDelegator: " + e1);
            }
        }

        //Lookup Original Delegator in alpha_user
        if (auth.OriginalDelegatorKOGID) {
            try {
                var origDelegatorQuery = openidm.query("managed/alpha_user", {
                    "_queryFilter": 'userName eq "' + auth.OriginalDelegatorKOGID + '"'
                });
                if (origDelegatorQuery.result.length > 0) {
                    var origDelegatorId = origDelegatorQuery.result[0]._id;
                    data.originalDelegatorIdentifier = origDelegatorId;
                    data.originalDelegator = { "_ref": "managed/alpha_user/" + origDelegatorId };
                } else {
                    logger.error("createAccessMO: OriginalDelegator not found in alpha_user: " + auth.OriginalDelegatorKOGID);
                }
            } catch (e2) {
                logger.error("createAccessMO: Error querying OriginalDelegator: " + e2);
            }
        }

        //Create the Access MO entry
        try {
            var resp = openidm.create("managed/alpha_kyid_access", null, data);
            logger.error("createAccessMO: Created Access MO Entry: " + JSON.stringify(resp));
        } catch (createErr) {
            logger.error("createAccessMO: Failed to create Access MO: " + createErr);
        }

    } catch (outerErr) {
        logger.error("createAccessMO: Unexpected error: " + outerErr);
    }
}
