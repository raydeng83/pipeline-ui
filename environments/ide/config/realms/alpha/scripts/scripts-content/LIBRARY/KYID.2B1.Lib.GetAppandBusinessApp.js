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
var ops = require("KYID.2B1.Library.IDMobjCRUDops");

exports.getAppAndBusinessAppFromRole = function (roleId) {
    try {
        var appResponse = openidm.query("managed/alpha_role/" + roleId + "/applications", {
            "_queryFilter": "true"
        }, [""]);

        if (!appResponse || appResponse.result.length === 0) {
            logger.error("No applications found for role");
            return [];
        }

        var appResults = [];

        for (var i = 0; i < appResponse.result.length; i++) {
            var appItem = appResponse.result[i];
            var appId = appItem._refResourceId;
            var appName = appItem.name;

            var appObj = ops.crudOps("read", "alpha_application", null, null, null, appId);
            if (!appObj || !appObj.businessApplication) {
                logger.error("No business application linked with app: " + appId);
                continue;
            }

            var businessAppId = appObj.businessApplication._refResourceId;
            var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
            if (!busApp) {
                logger.error("Business app not found for id: " + businessAppId);
                continue;
            }

            appResults.push({
                appId: appId,
                appName: appName,
                businessAppId: businessAppId,
                businessAppName: busApp.name,
                businessAppLogo: busApp.logoURL,
                businessAppDescription: busApp.description,
                businessAppURL: busApp.applicationURL                
            });
        }

        return appResults;

    } catch (error) {
        logger.error("Error in getAppAndBusinessAppFromRole: " + error.message);
    }
};

//Below functions are being used in login master journey for MFA evaluation
function getUserRole(userId) {
    try {
        var response = openidm.query("managed/alpha_user/", {
             "_queryFilter": 'userName eq "' + userId + '"'
        }, [""]);

        var result = response.result[0].effectiveRoles;
        const userRoleIds = [];

        for (var i = 0; i < result.length; i++) {
            userRoleIds.push(result[i]._refResourceId);
        }

        logger.error("PritingUserRoles:"+userRoleIds);

        return userRoleIds;

    } catch (error) {
        nodeLogger.error("getUserRole() error: " + error);
        return [];
    }
}

function getAppRole(appName) {
    logger.error("appName in getAppRole is :: => "+ appName)
  try {
    var response = openidm.query("managed/alpha_kyid_businessapplication/" , {  _queryFilter: '/name/ eq "' + appName + '"' }, []);
    logger.error("response in getAppRole is :: => "+ JSON.stringify(response))
    const appRoleIds = [];
    for (var i = 0; i < response.result.length; i++) {
        response.result[i].roleAppId.forEach(value => {
             appRoleIds.push(value._refResourceId);
        })
     
    }

   // nodeState.putShared("AppRoleIds", appRoleIds);
    logger.error("PritingAppRoleIds"+appRoleIds)  
    logger.error("appRoleIds in getAppRole is :: => "+ appRoleIds)  
    return appRoleIds;
  } catch (error) {
    nodeLogger.error("getAppRole() error: " + error);
    return "error";
  }
}

//get the roles the user has for that particular application
function getRelevantRolesForApp(userId,appId) {
    try {
        var userRoles = getUserRole(userId);
        var appRoles = getAppRole(appId);

        if (userRoles.length === 0 || appRoles.length === 0) {
            logger.error("User or App roles are empty.");
            return [];
        }

        var relevantRoleIds = userRoles.filter(function (roleId) {
            return appRoles.includes(roleId);
        });
        logger.error("PritingCommonRoles"+JSON.stringify(relevantRoleIds))
        logger.error("Relevant roles for user [" + userId + "] and app [" + appId + "]: " + JSON.stringify(relevantRoleIds));
        return relevantRoleIds;

    } catch (error) {
        logger.error("getRelevantRolesForApp() error: " + error);
        return [];
    }
}
//To evaluate the highest MFA among all the roles the user has
function getHighestRequiredMFA(roleIds) {
    try {
        if (!roleIds || roleIds.length === 0) {
            logger.error("No role IDs provided to getHighestRequiredMFA()");
            //return null;
            return 0;
        }

        var highestMFA = 0;
        var mfaValues = [];

        roleIds.forEach(function (roleId) {
            var role = openidm.read("managed/alpha_role/" + roleId);
            if (role && role.requiredMFAMethod != null) {
                mfaValues.push(role.requiredMFAMethod);
                if (role.requiredMFAMethod > highestMFA) {
                    logger.error("role.requiredMFAMethod = "+role.requiredMFAMethod)
                    highestMFA = role.requiredMFAMethod;
                }
            } else {
                logger.error("Missing requiredMFAMethod for role: " + roleId);
            }
        });

        logger.error("MFA values from roles: " + JSON.stringify(mfaValues));
        logger.error("Highest MFA value: " + highestMFA);

      //  nodeState.putShared("requiredMFAMethod", highestMFA);

        //Map MFA code to name
        var mfaCodeToName = {
            5: "AUTHENTICATOR",
            4: "MOBILE",
            3: "EMAIL",
            0: "NA"
        };

        //nodeState.putShared("requiredMFAMethodName", mfaCodeToName[highestMFA] || "UNKNOWN");

        return highestMFA;

    } catch (error) {
        logger.error("getHighestRequiredMFA() error: " + error);
        //return null;
        return 0;
    }
}

//Get highest MFA from all roles of an application
function getAppRolesHighestMFA(appName,userId) {
    try {
        var commonRoles=getRelevantRolesForApp(userId,appName);
        logger.error("common roles = "+commonRoles);
        return getHighestRequiredMFA(commonRoles);
    } catch (e) {
        logger.error("getAppRolesHighestMFA() error: " + e);
        return null;
    }
}

//Exporting
exports.getUserRole = getUserRole;
exports.getAppRole = getAppRole;
exports.getRelevantRolesForApp = getRelevantRolesForApp;
exports.getHighestRequiredMFA = getHighestRequiredMFA;
exports.getAppRolesHighestMFA = getAppRolesHighestMFA;