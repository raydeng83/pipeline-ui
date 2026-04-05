var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");
var dashboard = require("KYID.2B1.Library.Dashboard");

var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Dashboard Manage Access",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ManageAccessScreen.v4",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    ERROR: "error",
    BACK: "back",
    REQUEST_ROLE: "requestRole",
    REMOVE_ROLE: "removeRole",
    REFRESH: "refresh",
    INVALID_JSON: "invalidJson",
    INVALID_ROLE: "invalidRoleId"
};

// Logger
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

// ===== Main Execution =====
try {
    //get the application name for which manage access is selected
    var appName = nodeState.get("appIDinWidget") || requestParameters.get("appIDinWidget")[0];
    logger.debug("appIDinWidget from request param or nodestate is"+appName)
    if (!appName) {
        logger.error("Missing appID from both nodeState and query parameter.");
    }
    var appIdResp = dashboard.getBusinessAppByName(appName)  //Get the app _id from the appName
    var appId = appIdResp._id
    logger.debug("the appid is"+appId)
   // nodeState.putShared("_id","798c6cf1-899c-45fd-83c9-06e44a51738c")
    //get the logged in user details
    var userKyAccountType;
        if(nodeState.get("_id")){
        var userId = nodeState.get("_id");
        var userObj = openidm.read("managed/alpha_user/" + userId);
        if (userObj) {
        userKyAccountType = mapKyAccountTypeToNumber(userObj.custom_kyidAccountType);
        }
    } else {
        if (existingSession.get("KOGID")) {
        var KOGID = existingSession.get("KOGID")
        var user = queryUserByKOGID(KOGID);
        if (user){
            var userId = user._id
            userKyAccountType = mapKyAccountTypeToNumber(user.custom_kyidAccountType);
        }
    }
    }

    nodeState.putShared("_id", userId);

   
    if (callbacks.isEmpty()) {
        if(nodeState.get("roleremovalstatus")){
            logger.debug("roleremovalstatus::::"+nodeState.get("roleremovalstatus"))
            //callbacksBuilder.textOutputCallback(0, nodeState.get("roleremovalstatus"));
            if(nodeState.get("roleremovalstatus") === "Role Removed Failed"){
            errMsg["code"] = "ERR-REM-ROL-001";
            errMsg["message"] = nodeState.get("roleremovalstatus");  
            callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
            } else {
            errMsg["code"] = "ERR-REM-ROL-000";
            errMsg["message"] = nodeState.get("roleremovalstatus");  
            callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
        }
        }

        requestCallbacks(appName, userId, appId);
    } else {
        handleUserResponses(appId, userId);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main execution:: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}

// =====Functions=====

function mapKyAccountTypeToNumber(typeStr) {
    var map = {
        "P": 0,
        "B": 1,
        "C": 2
    };
    return map[typeStr];
}

function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail", "custom_kyidAccountType"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
        return userQueryResult.result[0];
    } 
    } catch (error) {
        nodeLogger.error("Error querying user by KOGID: " + error.message);
        return null;
    }
}

function requestCallbacks(appName, userId, appId) {
    try {
        //FAQ topic
        var lib = require("KYID.Library.FAQPages");
        var process ="ManageAccess";
        var pageHeader= "2_manage_access";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

        
        if (nodeState.get("unexpectederror"))
            callbacksBuilder.textOutputCallback(0, nodeState.get("unexpectederror"));

        if (nodeState.get("invalidJSONError"))
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));

        if (nodeState.get("invalidRoleError"))
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));

        if (nodeState.get("internaluser"))
            callbacksBuilder.textOutputCallback(0, nodeState.get("internaluser"));

        if (nodeState.get("rolenotremovable"))
            callbacksBuilder.textOutputCallback(0, nodeState.get("rolenotremovable"));

        
        var jsonobj = {"pageHeader": "2_manage_access"};
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));


        // Prepare JSON data for response
        var userRoles = getUserRoles(userId, appId);  // User's roles
        logger.debug("userRoles: " + JSON.stringify(userRoles));
        
        logger.debug("The appId in request callback is: " + appId);
        
        var appRoles = dashboard.getAppRole(appId);  // App's roles
        logger.debug("appRoles: " + JSON.stringify(appRoles));

        var userRoleIds = userRoles.map(ur => ur.roleId);

        var matchedRoles = matchingRoles(userRoles, appRoles);
       // var matchedRoles = dashboard.matchingRoles(userRoles, appRoles);  // Common roles
        logger.debug("matchedRoles: " + JSON.stringify(matchedRoles));
        
        // Get roles with removable flag
        var rolesWithFlags = dashboard.filterRemovableRoles(matchedRoles, userKyAccountType);
        logger.debug("rolesWithFlags: " + JSON.stringify(rolesWithFlags));
        
        // Save appRoleIds for downstream usage
        nodeState.putShared("AppRoleIds", appRoles);
        
        // Fetch business application metadata
        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, appId);

        // Default fallback for business application name
        var fallbackBusinessAppName = {
            en: (busApp && busApp.name) || "",
            es: (busApp && busApp.name) || ""
        };
        
        // localized businessAppName
        var localizedBusinessAppName = (busApp && busApp.content && busApp.content[0] && busApp.content[0].title) || {};
        
        // Ensure final name always has 'en' and 'es'
        var businessAppName = {
            en: localizedBusinessAppName.en || fallbackBusinessAppName.en,
            es: localizedBusinessAppName.es || fallbackBusinessAppName.es
        };
        
        //var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        var applicationData = dashboard.getApphelpdesk(appId);
        
        // Generate final response JSON
        var finalResponse = dashboard.formatJSONRemoveRole(businessAppName, businessAppLogo, rolesWithFlags, applicationData);
        
        // Build response to UI
        callbacksBuilder.textOutputCallback(0, finalResponse);
        callbacksBuilder.textInputCallback("JSON Input");

        
        callbacksBuilder.confirmationCallback(0, ["Request Access", "Remove Roles", "refresh", "Back to dashboard"], 0);

        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::requestCallbacks error::" + error.message)
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses(appId, userId) {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var userInput = callbacks.getTextInputCallbacks().get(0).trim();

        if (selectedOutcome === 3) {  // Back
            clearErrors();
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 2) {  // Refresh
            clearErrors();
            action.goTo(NodeOutcome.REFRESH);
        } else if (selectedOutcome === 1) {  // Remove Role
            logger.debug("user clicked on remove role")
            if (validateJsonFormat(userInput)) {
                logger.debug("user input for remove role"+userInput)
                var response = JSON.parse(userInput);
               // var accessRoleIds = response.accessroleid; // "accessroleid" array
      var RoleIds = response.roleids; // "roleids" array
                if (!Array.isArray(RoleIds) || RoleIds.length === 0) {
                    nodeState.putShared("invalidJSONError", "Invalid_JSON");
                    clearErrors("invalidJSONError");
                    action.goTo(NodeOutcome.INVALID_JSON);
                    return;
                }

                // Simply store the accessroleid in nodeState
                //nodeState.putShared("accessroleid", accessRoleIds);
                 nodeState.putShared("roleIds", RoleIds);
                clearErrors();
                logger.debug("user going for remove role")
                action.goTo(NodeOutcome.REMOVE_ROLE);

            } else {
                nodeState.putShared("invalidJSONError", "Invalid_JSON");
                clearErrors("invalidJSONError");
                action.goTo(NodeOutcome.INVALID_JSON);
            }
        } else {  // Request Role
            logger.debug("User selected request access");
            action.goTo(NodeOutcome.REQUEST_ROLE);
        }

    } catch (error) {
        nodeLogger.error(`${transactionid}::${nodeConfig.timestamp}::handleUserResponses error:: ${error}`);
        action.goTo(NodeOutcome.ERROR);
    }
}


function clearErrors(keepKey) {
    var keys = ["invalidJSONError", "invalidRoleError", "internaluser", "rolenotremovable"];
    keys.forEach(function(key) {
        if (key !== keepKey) {
            nodeState.putShared(key, null);
        }
    });
}

function getUserRoles(userId, appId) {
    try {
        var queryFilter = 'appIdentifier eq "' + appId + '" AND userIdentifier eq "' + userId + '" AND (recordState eq "0" OR recordState eq "ACTIVE")';
        var resp = openidm.query("managed/alpha_kyid_access", {
            "_queryFilter": queryFilter
        }, ["*", "role/*"]);

        var userRoles = [];
        var seenRoles = {}; // For de-duplication

        if (resp && resp.result && resp.result.length > 0) {
            logger.debug("in manage access script --> search the access MO. Result greater than 0");
            for (var i = 0; i < resp.result.length; i++) {
                var roleEntry = resp.result[i];
                if (roleEntry.role && roleEntry.role._id) {
                    var roleKey = roleEntry.role._id; // Key to detect duplicate roles for same user & app
                    if (!seenRoles[roleKey]) {
                        userRoles.push({
                            roleId: roleEntry.role._id,
                            accessId: roleEntry._id
                        });
                        seenRoles[roleKey] = true;
                    } else {
                        logger.debug("Duplicate role found for userId " + userId + " & appId " + appId + ": " + roleKey + ", skipping");
                    }
                }
            }
        }
        return userRoles;
    } catch (error) {
        logger.error("Error fetching user roles from alpha_kyid_access: " + error.message);
        return [];
    }
}


function matchingRoles(userRoles, appRoles) {
    var matched = [];

    for (var i = 0; i < userRoles.length; i++) {
        var userRoleId = userRoles[i].roleId.trim();
        logger.debug("Checking userRoleId: '" + userRoleId + "'");

        for (var j = 0; j < appRoles.length; j++) {
            var appRoleId = appRoles[j].trim();
            logger.debug("Against appRoleId: '" + appRoleId + "'");

            if (userRoleId === appRoleId) {
                logger.debug("MATCH FOUND: " + userRoleId);
                matched.push({
                    roleId: userRoleId,
                    accessId: userRoles[i].accessId
                });
            }
        }
    }

    return matched;
}

function validateJsonFormat(json) {
    try {
        var parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null) return false;

        const keys = Object.keys(parsed);

        // Accept roleids, roleId, or accessroleid
        if (keys.length !== 1 || 
            (keys[0] !== 'roleId' && keys[0] !== 'accessroleid' && keys[0] !== 'roleids')) {
            return false;
        }

        var arr = parsed[keys[0]];
        if (!Array.isArray(arr)) return false;

        for (var i = 0; i < arr.length; i++) {
            if (typeof arr[i] !== 'string') return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}


