var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var lib = require("KYID.2B1.Library.GenericUtils");
var libDashboard = require("KYID.2B1.Library.Dashboard");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Dashboard Manage Access",
    script: "Script",
    scriptName: "KYID.2B1.Journey.manageAccess",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    ERROR: "error",
    BACK: "back",
    CONTINUE: "continue",
    REFRESH: "refresh"
};

// Logger
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

// Main Execution
try {
    var appId = nodeState.get("appIDinWidget") || requestParameters.get("appIDinWidget")[0];
    if (!nodeState.get("appIDinWidget")) nodeState.putShared("requestroleType", "APP_LIBRARY");

    var userId = nodeState.get("_id");
    nodeState.putShared("_id", userId);

    if (callbacks.isEmpty()) {
        if (nodeState.get("invalidJSONError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
        }
        if (nodeState.get("invalidRoleError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));
        }
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(`${transactionid}::${nodeConfig.timestamp}::${nodeConfig.node}::${nodeConfig.nodeName}::${nodeConfig.script}::${nodeConfig.scriptName}::${nodeConfig.begin}::Error in main execution: ${error.message}`);
    action.goTo(NodeOutcome.ERROR);
}

function requestCallbacks() {
    try {
        logger.debug("inside requestCallbacks");

        callbacksBuilder.textOutputCallback(1, "request_access");
        var response = formatJSON(appId, userId);
        callbacksBuilder.textOutputCallback(0, response);
        callbacksBuilder.textInputCallback("JSON Input");

        if (requestParameters.get("appIDinWidget")) {
            callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
        } else {
            callbacksBuilder.confirmationCallback(0, ["Continue", "Refresh", "Back to manage access"], 1);
        }
    } catch (error) {
        nodeLogger.error(`${transactionid}::${nodeConfig.timestamp}::${nodeConfig.node}::${nodeConfig.nodeName}::${nodeConfig.script}::${nodeConfig.scriptName}::${nodeConfig.begin}::Error in requestCallbacks: ${error.message}`);
    }
}

function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var userInput = callbacks.getTextInputCallbacks().get(0).trim();

        if (selectedOutcome === 2) {
            nodeState.putShared("invalidJSONError", null);
            nodeState.putShared("invalidRoleError", null);
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 1) {
            nodeState.putShared("invalidJSONError", null);
            nodeState.putShared("invalidRoleError", null);
            action.goTo(NodeOutcome.REFRESH);
        } else if (selectedOutcome === 0) {
            if (validateJsonFormat(userInput)) {
                if (!isInputValid(userInput)) {
                    nodeState.putShared("invalidJSONError", null);
                    nodeState.putShared("invalidRoleError", null);
                    action.goTo(NodeOutcome.CONTINUE);
                } else {
                    nodeState.putShared("invalidJSONError", null);
                    nodeState.putShared("invalidRoleError", null);
                    action.goTo("invalidRoles");
                }
            } else {
                nodeState.putShared("invalidJSONError", null);
                nodeState.putShared("invalidRoleError", null);
                action.goTo("invalidJSON");
            }
        }
    } catch (error) {
        nodeLogger.error(`${transactionid}::${nodeConfig.timestamp}::${nodeConfig.node}::${nodeConfig.nodeName}::${nodeConfig.script}::${nodeConfig.scriptName}::${nodeConfig.begin}::Error in handleUserResponses: ${error.message}`);
        nodeState.putShared("invalidJSONError", null);
        nodeState.putShared("invalidRoleError", null);
        action.goTo(NodeOutcome.ERROR);
    }
}

function formatJSON(appId, userId) {
    try {

        var appDetails = ops.crudOps("read", "alpha_application", null, null, null, appId);
        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, appDetails.businessApplication._refResourceId);

        var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        
        // var appDetails = libDashboard.getAppDetails(appId);
        // var businessAppName = appDetails.result[0].businessAppName;
        // var businessAppLogo = appDetails.result[0].businessAppLogo;

        var eligibleUnmatchedRoles = libDashboard.filterSelfServiceRequestableRoles(userId, appId);
        var roleList = [];

        for (var i = 0; i < eligibleUnmatchedRoles.length; i++) {
            var currentRoleId = eligibleUnmatchedRoles[i];

            var response = openidm.query("managed/alpha_role/", {
                "_queryFilter": '/_id/ eq "' + currentRoleId + '"'
            }, []);
            var content = response.result[0].content || [];

            var queryFilter = 'requester eq "' + userId + '" and approleid eq "' + currentRoleId + '" and (status eq "TODO" or status eq "NOT_STARTED" or status eq "IN_PROGRESS" or status eq "PENDINGAPPROVAL")';
            var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter }, []);

            var requestedbutinprogress = kyidResponse.result && kyidResponse.result.length > 0;
            var requestedbutinprogressdescription = requestedbutinprogress ? `https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=${currentRoleId}` : "";

            roleList.push({
                roleId: currentRoleId,
                content: content,
                requestedbutinprogress: requestedbutinprogress,
                requestedbutinprogressdescription: requestedbutinprogressdescription
            });
        }

        var appResponse = JSON.parse(lib.getBusinessAppInfo(eligibleUnmatchedRoles[0] || ""));
        return JSON.stringify({
            businessAppName: businessAppName,
            businessAppLogo: businessAppLogo,
            roles: roleList,
            application: appResponse.application || {}
        });
    } catch (error) {
        logger.error("Error in formatJSON: " + error.message);
        return JSON.stringify({ error: "Failed to format JSON" });
    }
}

function isInputValid(input) {
    try {
        var response = JSON.parse(input);
        var roleIds = response.roleId;
        nodeState.putShared("requestedRoleId", roleIds);

        var validRoles = libDashboard.getEligibleSelfServiceUnmatchedRoles(nodeState.get("_id"), appId);
        var unmatchedRoles = roleIds.filter(role => !validRoles.includes(role));

        if (unmatchedRoles.length > 0) {
            nodeState.putShared("invalidRoles", unmatchedRoles.toString());
            return true;
        }
        return false;
    } catch (e) {
        logger.error("Error in isInputValid: " + e.message);
        return true;
    }
}

function validateJsonFormat(json) {
    try {
        var parsedJson = JSON.parse(json);
        if (typeof parsedJson !== 'object' || parsedJson === null) return false;
        const keys = Object.keys(parsedJson);
        if (keys.length !== 1 || keys[0] !== 'roleId') return false;
        if (!Array.isArray(parsedJson.roleId)) return false;
        return parsedJson.roleId.every(role => typeof role === "string");
    } catch (e) {
        logger.error("Exception in validateJsonFormat: " + e.message);
        return false;
    }
}