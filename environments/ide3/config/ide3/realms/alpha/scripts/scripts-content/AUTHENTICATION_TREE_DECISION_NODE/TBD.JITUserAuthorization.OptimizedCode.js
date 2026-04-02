/**
 * Script: KYID.Journey.ReadUserKOGProfileInfo
 * Description: This script is used to invoke KOG user authorization API.
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();
logger.error("Script started at: " + dateTime);

/* ================= NODE CONFIG ================= */

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
    end: "Node Execution Completed"
};

var nodeOutcome = {
    SUCCESS: "next",
    FAIL: "failure",
    MISSING_MANDATORY_CONFIG: "missingMandatoryConfig",
    NOROLESTOUSER: "noUserAuthz",
    ERROR: "error"
};

var nodeLogger = {
    debug: function(msg) { logger.debug(msg); },
    error: function(msg) { logger.error(msg); }
};

/* ================= INPUT HANDLING ================= */

logger.debug("Starting input handling...");
var missingInputs = [];
var mail = null;

if (typeof existingSession !== 'undefined') {
    mail = existingSession.get("emailaddress");
    nodeState.putShared("mail", mail);
    logger.debug("Email fetched from session: " + mail);
} else if (nodeState.get("mail")) {
    mail = nodeState.get("mail");
    logger.debug("Email fetched from nodeState: " + mail);
} else {
    missingInputs.push(nodeConfig.missingEmail);
   logger.debug("Missing email address in session/nodeState");
}

var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
var kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");

if (!kogTokenApi || !kogUsrAuthorizationApiURL || !sihcertforapi) {
    missingInputs.push(nodeConfig.missingInputParams);
    logger.debug("Missing mandatory API configuration properties");
}

var userKOGID = nodeState.get("KOGID");
logger.debug("User KOGID: " + userKOGID);

/* ================= EXIT IF CONFIG MISSING ================= */

if (missingInputs.length > 0) {
    logger.debug("Exiting due to missing inputs: " + missingInputs.join(", "));
    action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);
} else {
    try {
        logger.debug("Requesting KOG API token...");
        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
       logger.debug("KOG API token response status: " + kogAPITokenResponse.status);

        if (kogAPITokenResponse.status === 200) {
            var bearerToken = kogAPITokenResponse.response;
            var payload = { KOGID: userKOGID };
            logger.debug("Bearer token retrieved, sending user authorization request...");

            var requestOptions = {
                clientName: sihcertforapi,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                token: bearerToken,
                body: payload
            };

            var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();
            logger.debug("KOG user authorization API response status: " + res.status);

            if (res.status === 200) {
                var data = JSON.parse(res.text());
                logger.debug("User authorizations fetched. ResponseStatus: " + data.ResponseStatus);

                if (data.ResponseStatus === 0 && data.UserAuthorizations) {
                    var userId = nodeState.get("usrcreatedId");
                    nodeState.putShared("createdUserId", userId);
                    logger.debug("User ID: " + userId);

                    // Cache user roles ONCE
                    logger.debug("Fetching effective roles for user...");
                    var userRoleIds = getUserRole(userId);
                    var userRoleIdMap = {};
                    userRoleIds.forEach(function(r) { userRoleIdMap[r] = true; });
                   // logger.error("Effective roles: " + userRoleIds.join(", "));

                    // Application & Role Cache
                    var appCache = {};
                    var roleCache = {};

                    // Cache Access MOs ONCE
                    var accessMap = {};
                    logger.error("Fetching existing access MOs...");
                    var accessResult = openidm.query("managed/alpha_kyid_access", {
                        "_queryFilter": 'userIdentifier eq "' + userId + '" and (recordState eq "0" or recordState eq "ACTIVE")'
                    });

                    if (accessResult && accessResult.result) {
                        accessResult.result.forEach(function(acc) {
                            var key = acc.appIdentifier + "::" + acc.roleIdentifier + "::" +
                                (acc.orgId || "") + "::" + (acc.kogOrgBusinessKeyId || "");
                            accessMap[key] = acc;
                        });
                        logger.error("Existing access MOs cached: " + Object.keys(accessMap).length);
                    }

                    // Delegator Cache
                    var delegatorCache = {};

                    data.UserAuthorizations.forEach(function(auth) {
                        //logger.error("Processing authorization for Application: " + auth.ApplicationName + ", Role: " + auth.RoleName);

                        if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
                            logger.error("Skipping invalid or EDRS application");
                            return;
                        }

                        /* ================= APPLICATION CACHE ================= */
                        var appId = appCache[auth.ApplicationName];
                        if (!appId) {
                            var aq = openidm.query("managed/alpha_kyid_businessapplication", {
                                "_queryFilter": 'name eq "' + auth.ApplicationName + '"'
                            });
                            if (!aq.result.length) return;
                            appId = aq.result[0]._id;
                            appCache[auth.ApplicationName] = appId;
                            logger.error("Application cached: " + auth.ApplicationName + " -> " + appId);
                        }

                        /* ================= ROLE CACHE ================= */
                        var roleKey = appId + "::" + auth.RoleName;
                        var roleId = roleCache[roleKey];
                        if (!roleId) {
                            var rq = openidm.query("managed/alpha_role", {
                                "_queryFilter": 'name eq "' + auth.RoleName +
                                    '" and businessAppId/_refResourceId eq "' + appId + '"'
                            });
                            if (!rq.result.length) return;
                            roleId = rq.result[0]._id;
                            roleCache[roleKey] = roleId;
                           // logger.error("Role cached: " + auth.RoleName + " -> " + roleId);
                        }

                        /* ================= ACCESS CACHE LOOKUP ================= */
                        var accessKey = appId + "::" + roleId + "::" +
                            (auth.KOGOrgId ? auth.KOGOrgId.toString() : "") + "::" +
                            (auth.BusinessKeyId || "");

                        var existingAccess = accessMap[accessKey];

                        if (!existingAccess) {
                            //logger.error("Creating new access MO for key: " + accessKey);
                            var accessResp = createAccessMO(appId, roleId, userId, auth, delegatorCache);
                            if (accessResp && accessResp._id) {
                                accessMap[accessKey] = accessResp;
                                logger.error("Access MO created: " + accessResp._id);
                            }
                        }

                        /* ================= ROLE PATCH (IN-MEMORY) ================= */
                        if (!userRoleIdMap[roleId]) {
                           // logger.error("Patching user role: " + roleId);
                            patchAlphaRoleMO(userId, roleId);
                            userRoleIdMap[roleId] = true;
                        }
                    });

                    action.goTo(nodeOutcome.SUCCESS);
                   logger.error("Script completed successfully at: " + new Date().toISOString());

                } else {
                    //logger.error("No roles found for user.");
                    action.goTo(nodeOutcome.NOROLESTOUSER);
                }

            } else {
              //  logger.error("Failed to fetch user authorizations. Status: " + res.status);
                action.goTo(nodeOutcome.SUCCESS);
            }
        } else {
           // logger.error("Failed to get KOG API token.");
            action.goTo(nodeOutcome.SUCCESS);
        }

    } catch (e) {
        logger.error("Exception encountered: " + e);
        action.goTo(nodeOutcome.SUCCESS);
    }
}

/* ================= HELPERS ================= */

function getUserRole(userId) {
    var resp = openidm.read("managed/alpha_user/" + userId);
    var roles = [];
    if (resp && resp.effectiveRoles) {
        resp.effectiveRoles.forEach(function(r) {
            roles.push(r._refResourceId);
        });
    }
    //logger.error("getUserRole returned roles: " + roles.join(", "));
    return roles;
}

function patchAlphaRoleMO(userId, roleId) {
    try {
        openidm.patch("managed/alpha_user/" + userId, null, [{
            operation: "add",
            field: "/roles/-",
            value: {
                "_ref": "managed/alpha_role/" + roleId,
                "_refResourceId": roleId,
                "_refResourceCollection": "managed/alpha_role"
            }
        }]);
        //logger.error("patchAlphaRoleMO completed for role: " + roleId);
    } catch (e) {
        logger.error("patchAlphaRoleMO failed: " + e);
    }
}

function createAccessMO(appId, roleId, userId, auth, delegatorCache) {

    var now = new Date().toISOString();
    var nowEpoch = Date.now();
    logger.error("Creating access MO at: " + now);

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
        createdByID: userId,
        appIdentifier: appId,
        roleIdentifier: roleId,
        userIdentifier: userId
    };

    function resolveDelegator(kogId) {
        if (!delegatorCache[kogId]) {
            var q = openidm.query("managed/alpha_user", {
                "_queryFilter": 'userName eq "' + kogId + '"'
            });
            if (q.result.length) {
                delegatorCache[kogId] = q.result[0]._id;
                logger.error("Delegator resolved for KOGID " + kogId + ": " + delegatorCache[kogId]);
            }
        }
        return delegatorCache[kogId];
    }

    if (auth.CurrentDelegatorKOGID) {
        var cid = resolveDelegator(auth.CurrentDelegatorKOGID);
        if (cid) {
            data.currentDelegatorIdentifier = cid;
            data.currentDelegator = { "_ref": "managed/alpha_user/" + cid };
        }
    }

    if (auth.OriginalDelegatorKOGID) {
        var oid = resolveDelegator(auth.OriginalDelegatorKOGID);
        if (oid) {
            data.originalDelegatorIdentifier = oid;
            data.originalDelegator = { "_ref": "managed/alpha_user/" + oid };
        }
    }

    try {
        var created = openidm.create("managed/alpha_kyid_access", null, data);
       // logger.error("Access MO created with ID: " + (created ? created._id : "null"));
        return created;
    } catch (e) {
        logger.error("createAccessMO failed: " + e);
        return null;
    }
}
// var dateTime = new Date().toISOString();

// /* ================= NODE CONFIG ================= */

// var nodeConfig = {
//     begin: "Begining Node Execution",
//     node: "Node",
//     nodeName: "Get KOG User Authorization",
//     script: "Script",
//     scriptName: "KYID.Journey.ReadUserAuthz",
//     timestamp: dateTime,
//     missingInputParams: "Following mandatory input params are missing",
//     missingEmail: "Missing email",
//     emailInfoInSession: "emailaddress value in session",
//     end: "Node Execution Completed"
// };

// var nodeOutcome = {
//     SUCCESS: "next",
//     FAIL: "failure",
//     MISSING_MANDATORY_CONFIG: "missingMandatoryConfig",
//     NOROLESTOUSER: "noUserAuthz",
//     ERROR: "error"
// };

// /* ================= LOGGER ================= */

// var nodeLogger = {
//     debug: function(msg) { logger.debug(msg); },
//     error: function(msg) { logger.error(msg); }
// };

// /* ================= INPUT HANDLING ================= */

// var missingInputs = [];
// var mail = null;

// if (typeof existingSession !== 'undefined') {
//     mail = existingSession.get("emailaddress");
//     nodeState.putShared("mail", mail);
// } else if (nodeState.get("mail")) {
//     mail = nodeState.get("mail");
// } else {
//     missingInputs.push(nodeConfig.missingEmail);
// }

// var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
// var kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
// var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");

// if (!kogTokenApi || !kogUsrAuthorizationApiURL || !sihcertforapi) {
//     missingInputs.push(nodeConfig.missingInputParams);
// }

// var userKOGID = nodeState.get("KOGID");

// /* ================= EXIT IF CONFIG MISSING ================= */

// if (missingInputs.length > 0) {
//     action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);
// } else {
//     try {
//         var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
//         var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);

//         if (kogAPITokenResponse.status === 200) {

//             var bearerToken = kogAPITokenResponse.response;
//             var payload = { KOGID: userKOGID };

//             var requestOptions = {
//                 clientName: sihcertforapi,
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 token: bearerToken,
//                 body: payload
//             };

//             var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();

//             if (res.status === 200) {
//                 var data = JSON.parse(res.text());

//                 if (data.ResponseStatus === 0 && data.UserAuthorizations) {

//                     var userId = nodeState.get("usrcreatedId");
//                     nodeState.putShared("createdUserId", userId);

//                     //Cache user roles ONCE
//                     var userRoleIds = getUserRole(userId);
//                     var userRoleIdMap = {};
//                     userRoleIds.forEach(function(r) { userRoleIdMap[r] = true; });

//                     // Application & Role Cache
//                     var appCache = {};
//                     var roleCache = {};

//                     // Cache Access MOs ONCE
//                     var accessMap = {};
//                     var accessResult = openidm.query("managed/alpha_kyid_access", {
//                         "_queryFilter": 'userIdentifier eq "' + userId + '" and (recordState eq "0" or recordState eq "ACTIVE")'
//                     });

//                     if (accessResult && accessResult.result) {
//                         accessResult.result.forEach(function(acc) {
//                             var key = acc.appIdentifier + "::" + acc.roleIdentifier + "::" +
//                                 (acc.orgId || "") + "::" + (acc.kogOrgBusinessKeyId || "");
//                             accessMap[key] = acc;
//                         });
//                     }

//                     // Delegator Cache
//                     var delegatorCache = {};

//                     data.UserAuthorizations.forEach(function(auth) {

//                         if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
//                             return;
//                         }

//                         /* ================= APPLICATION CACHE ================= */
//                         var appId = appCache[auth.ApplicationName];
//                         if (!appId) {
//                             var aq = openidm.query("managed/alpha_kyid_businessapplication", {
//                                 "_queryFilter": 'name eq "' + auth.ApplicationName + '"'
//                             });
//                             if (!aq.result.length) return;
//                             appId = aq.result[0]._id;
//                             appCache[auth.ApplicationName] = appId;
//                         }

//                         /* ================= ROLE CACHE ================= */
//                         var roleKey = appId + "::" + auth.RoleName;
//                         var roleId = roleCache[roleKey];
//                         if (!roleId) {
//                             var rq = openidm.query("managed/alpha_role", {
//                                 "_queryFilter": 'name eq "' + auth.RoleName +
//                                     '" and businessAppId/_refResourceId eq "' + appId + '"'
//                             });
//                             if (!rq.result.length) return;
//                             roleId = rq.result[0]._id;
//                             roleCache[roleKey] = roleId;
//                         }

//                         /* ================= ACCESS CACHE LOOKUP ================= */
//                         var accessKey =
//                             appId + "::" +
//                             roleId + "::" +
//                             (auth.KOGOrgId ? auth.KOGOrgId.toString() : "") + "::" +
//                             (auth.BusinessKeyId || "");

//                         var existingAccess = accessMap[accessKey];

//                         if (!existingAccess) {
//                             var accessResp = createAccessMO(appId, roleId, userId, auth, delegatorCache);
//                             if (accessResp && accessResp._id) {
//                                 accessMap[accessKey] = accessResp;
//                             }
//                         }

//                         /* ================= ROLE PATCH (IN-MEMORY) ================= */
//                         if (!userRoleIdMap[roleId]) {
//                             patchAlphaRoleMO(userId, roleId);
//                             userRoleIdMap[roleId] = true;
//                         }
//                     });

//                     action.goTo(nodeOutcome.SUCCESS);

//                 } else {
//                     action.goTo(nodeOutcome.NOROLESTOUSER);
//                 }

//             } else {
//                 action.goTo(nodeOutcome.SUCCESS);
//             }
//         } else {
//             action.goTo(nodeOutcome.SUCCESS);
//         }

//     } catch (e) {
//         logger.error("Exception: " + e);
//         action.goTo(nodeOutcome.SUCCESS);
//     }
// }

// /* ================= HELPERS ================= */

// function getUserRole(userId) {
//     var resp = openidm.read("managed/alpha_user/" + userId);
//     var roles = [];
//     if (resp && resp.effectiveRoles) {
//         resp.effectiveRoles.forEach(function(r) {
//             roles.push(r._refResourceId);
//         });
//     }
//     return roles;
// }

// function patchAlphaRoleMO(userId, roleId) {
//     try {
//         openidm.patch("managed/alpha_user/" + userId, null, [{
//             operation: "add",
//             field: "/roles/-",
//             value: {
//                 "_ref": "managed/alpha_role/" + roleId,
//                 "_refResourceId": roleId,
//                 "_refResourceCollection": "managed/alpha_role"
//             }
//         }]);
//     } catch (e) {
//         logger.error("patchAlphaRoleMO failed: " + e);
//     }
// }

// /* ================= CREATE ACCESS MO (OPTIMIZED) ================= */

// function createAccessMO(appId, roleId, userId, auth, delegatorCache) {

//     var now = new Date().toISOString();
//     var nowEpoch = Date.now();
//    var data = {
//             app: {
//                 "_ref": "managed/alpha_kyid_businessapplication/" + appId
//             },
//             user: {
//                 "_ref": "managed/alpha_user/" + userId
//             },
//             role: {
//                 "_ref": "managed/alpha_role/" + roleId
//             },
//             isForwardDelegable: false,
//             assignmentDate: now,
//             assignmentDateEpoch: nowEpoch,
//             recordState: "0",
//             recordSource: "1",
//             createDate: now,
//             createDateEpoch: nowEpoch,
//             updateDate: now,
//             updateDateEpoch: nowEpoch,
//             createdBy: userId,
//             updatedBy: userId,
//             createdByID: userId,
//             appIdentifier: appId,
//             roleIdentifier: roleId,
//             userIdentifier: userId
//         };
//     function resolveDelegator(kogId) {
//         if (!delegatorCache[kogId]) {
//             var q = openidm.query("managed/alpha_user", {
//                 "_queryFilter": 'userName eq "' + kogId + '"'
//             });
//             if (q.result.length) {
//                 delegatorCache[kogId] = q.result[0]._id;
//             }
//         }
//         return delegatorCache[kogId];
//     }

//     if (auth.CurrentDelegatorKOGID) {
//         var cid = resolveDelegator(auth.CurrentDelegatorKOGID);
//         if (cid) {
//             data.currentDelegatorIdentifier = cid;
//             data.currentDelegator = { "_ref": "managed/alpha_user/" + cid };
//         }
//     }

//     if (auth.OriginalDelegatorKOGID) {
//         var oid = resolveDelegator(auth.OriginalDelegatorKOGID);
//         if (oid) {
//             data.originalDelegatorIdentifier = oid;
//             data.originalDelegator = { "_ref": "managed/alpha_user/" + oid };
//         }
//     }

//     try {
//         return openidm.create("managed/alpha_kyid_access", null, data);
//     } catch (e) {
//         logger.error("createAccessMO failed: " + e);
//         return null;
//     }
// }