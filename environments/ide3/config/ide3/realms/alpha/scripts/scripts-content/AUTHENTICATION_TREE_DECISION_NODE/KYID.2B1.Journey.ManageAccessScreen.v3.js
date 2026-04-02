var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");
var dashboard = require("KYID.2B1.Library.Dashboard");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Dashboard Manage Access",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ManageAccessScreen.v3",
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
        logger.debug("Missing appID from both nodeState and query parameter.");
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
        if (nodeState.get("roleremovalstatus")) {
            var removalSummary = nodeState.get("roleremovalstatus");

            var successCount = 0;
            var failureCount = 0;

            for (var i = 0; i < removalSummary.length; i++) {
                if (removalSummary[i].roleremovalstatus === "success") successCount++;
                else if (removalSummary[i].roleremovalstatus === "failure") failureCount++;
            }

            var summaryMessage = "";
            if (successCount > 0) summaryMessage += `${successCount}_role${successCount > 1 ? "s" : ""}_removed_successfully.`;
            if (failureCount > 0) {
                if (summaryMessage.length > 0) summaryMessage += " ";
                summaryMessage += `${failureCount}_role${failureCount > 1 ? "s" : ""}_failed_to_remove.`;
            }

            callbacksBuilder.textOutputCallback(0, summaryMessage);
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

        // Prepare  json data for json response
        var userRoles = dashboard.getUserRole(userId);       // User's roles
        logger.debug("userRoles"+JSON.stringify(userRoles))

        logger.debug("the app id in request callback is"+appId)
        var appRoles = dashboard.getAppRole(appId);          // App's roles
        logger.debug("appRoles"+JSON.stringify(appRoles))
        
        var matchedRoles = dashboard.matchingRoles(userRoles, appRoles); // Common roles
        logger.debug("matchedRoles: "+JSON.stringify(matchedRoles))
        
        var removableRoles = dashboard.filterSelfServiceRemovableRoles(matchedRoles, userKyAccountType); // Only removable
        logger.debug("removableRoles"+JSON.stringify(removableRoles))
        
        nodeState.putShared("AppRoleIds", appRoles); // Saving for downstream usage

        //Handle case where no roles are removable - show empty array
        // if (removableRoles.length === 0) {
        //    // callbacksBuilder.textOutputCallback(0, "ERROR: No removable roles available for this application.");
        //     // var errMsg = {
        //     //         error: "No removable roles available for this application"
        //     //     };
                
        //     // callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg, null, 2));
        //     //callbacksBuilder.textOutputCallback(0, JSON.stringify([]));
        //     callbacksBuilder.textOutputCallback(0, "[]");
        //      callbacksBuilder.textInputCallback("JSON Input");
        //     //callbacksBuilder.confirmationCallback(0, ["Back to dashboard"], 0);
        //     //return;
        // } else {
        //Proceed with removable roles
        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, appId);

        var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        var applicationData = dashboard.getApphelpdesk(appId); 
        var finalResponse = dashboard.formatJSON(businessAppName, businessAppLogo, removableRoles, applicationData);

        //Build response to UI
        callbacksBuilder.textOutputCallback(0, finalResponse);
        callbacksBuilder.textInputCallback("JSON Input");
        // }

        
        callbacksBuilder.confirmationCallback(0, ["Request Access", "Remove Roles", "refresh", "Back to dashboard"], 0);

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::requestCallbacks error::" + error.message)
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses(appId, userId) {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var userInput = callbacks.getTextInputCallbacks().get(0).trim();

        if (selectedOutcome === 3) {
            clearErrors();
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 2) {
            clearErrors();
            action.goTo(NodeOutcome.REFRESH);
        } else if (selectedOutcome === 1) {
            if (dashboard.validateJsonFormat(userInput)) {
                var response = JSON.parse(userInput);
                var roleIds = response.roleId;
                var matchedRoles = dashboard.matchingRoles(dashboard.getUserRole(userId), dashboard.getAppRole(appId));
               var validRoles = dashboard.filterSelfServiceRemovableRoles(matchedRoles, userKyAccountType);
                var unmatchedRoles = roleIds.filter(role => !validRoles.includes(role));
                if (unmatchedRoles.length > 0) {
                    nodeState.putShared("invalidRoles", unmatchedRoles.toString());
                    nodeState.putShared("roleIds", roleIds);
                    clearErrors();
                    nodeState.putShared("invalidRoleError", "Invalid_RoleId");
                    action.goTo(NodeOutcome.INVALID_ROLE);
                } else {
                    nodeState.putShared("roleIds", roleIds);
                    clearErrors();
                    action.goTo(NodeOutcome.REMOVE_ROLE);
                }
            } else {
                nodeState.putShared("invalidJSONError", "Invalid_JSON");
                clearErrors("invalidJSONError");
                action.goTo(NodeOutcome.INVALID_JSON);
            }
        } else {
            //clearErrors();
            logger.debug("user selected request access")
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
