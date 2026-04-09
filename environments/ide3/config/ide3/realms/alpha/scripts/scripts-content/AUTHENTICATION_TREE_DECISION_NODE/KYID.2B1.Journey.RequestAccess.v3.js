var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");
var dashboard = require("KYID.2B1.Library.Dashboard");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Dashboard Manage Access",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RequestAccess.v3",
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
    var appName = nodeState.get("appIDinWidget") || requestParameters.get("appIDinWidget")[0];
    logger.debug("appIDinWidget from request param or nodeState is: " + appName);

    if (!appName) {
        logger.debug("Missing appID from both nodeState and query parameter.");
        action.goTo(NodeOutcome.ERROR);
    }

    var appIdResp = dashboard.getBusinessAppByName(appName);
    var appId = appIdResp._id;
    logger.debug("The appId is: " + appId);

    // Get logged-in user details
    var userId;
    //nodeState.putShared("_id","798c6cf1-899c-45fd-83c9-06e44a51738c")
    if (nodeState.get("_id")) {
        userId = nodeState.get("_id");
    } else if (existingSession.get("KOGID")) {
        var KOGID = existingSession.get("KOGID");
        var user = queryUserByKOGID(KOGID);
        if (user) {
            userId = user._id;
        }
    }

    if (!userId) {
        logger.debug("Unable to determine user ID.");
        action.goTo(NodeOutcome.ERROR);
    }

    nodeState.putShared("_id", userId);

    if (callbacks.isEmpty()) {
        requestCallbacks(appName, userId, appId);
    } else {
        handleUserResponses(appId, userId);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main execution:: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}

// ===== Functions =====

function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        }
    } catch (error) {
        nodeLogger.error("Error querying user by KOGID: " + error.message);
    }
    return null;
}

function requestCallbacks(appName, userId, appId) {
    try {
        if (nodeState.get("invalidJSONError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
        }
        if (nodeState.get("invalidRoleError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));
        }

        callbacksBuilder.textOutputCallback(1, JSON.stringify({ pageHeader: "request_access" }));

        // Fetch roles the user has
        var userRoles = dashboard.getUserRole(userId);

        //Fetch all roles of application
        var appRoles = dashboard.getAppRole(appId);

        // Roles the user doesn't have
        var unmatchedRoles = appRoles.filter(function (roleId) {
            return !userRoles.includes(roleId);
        });

        // Filter for self-service eligible
        var unmatchedRequestableRoles = dashboard.filterSelfServiceRequestableRoles(userId, appId);
        logger.debug("Requestable unmatched roles: " + JSON.stringify(unmatchedRequestableRoles));

        nodeState.putShared("AppRoleIds", appRoles); // For downstream use

        if (unmatchedRequestableRoles.length === 0) {
            callbacksBuilder.textOutputCallback(0, "No valid requestable roles available for this application.");
            return;
        }

        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, appId);
        var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        var applicationData = dashboard.getApphelpdesk(appId);

        var finalResponse = dashboard.formatJSON(businessAppName, businessAppLogo, unmatchedRequestableRoles, applicationData);

        callbacksBuilder.textOutputCallback(0, finalResponse);
        callbacksBuilder.textInputCallback("JSON Input");

        if (requestParameters.get("appIDinWidget")) {
            callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
        } else {
            callbacksBuilder.confirmationCallback(0, ["Continue", "Refresh", "Back to manage access"], 1);
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::requestCallbacks error::" + error.message);
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses(appId, userId) {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var userInput = callbacks.getTextInputCallbacks().get(0).trim();

        if (selectedOutcome === 2) {
            clearErrors();
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 1) {
            clearErrors();
            action.goTo(NodeOutcome.REFRESH);
        } else if (selectedOutcome === 0) {
            if (dashboard.validateJsonFormat(userInput)) {
                var response = JSON.parse(userInput);
                var roleIds = response.roleId;

                var validUnmatchedRoles = dashboard.filterSelfServiceRequestableRoles(userId, appId);
                var unmatchedRoles = roleIds.filter(role => !validUnmatchedRoles.includes(role));

                if (unmatchedRoles.length > 0) {
                    nodeState.putShared("invalidRoles", unmatchedRoles.toString());
                    nodeState.putShared("roleIds", roleIds);
                    clearErrors();
                    nodeState.putShared("invalidRoleError", "Invalid_RoleId");
                    action.goTo(NodeOutcome.INVALID_ROLE);
                } else {
                    nodeState.putShared("roleIds", roleIds);
                    clearErrors();
                    action.goTo(NodeOutcome.REQUEST_ROLE);
                }
            } else {
                nodeState.putShared("invalidJSONError", "Invalid_JSON");
                clearErrors("invalidJSONError");
                action.goTo(NodeOutcome.INVALID_JSON);
            }
        }

    } catch (error) {
        nodeLogger.error(transactionid +"::"+nodeConfig.timestamp+" handleUserResponses error:: "+error);
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
