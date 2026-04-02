var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "IsUserAuthorized",
    script: "Script",
    scriptName: "KYID.Journey.IsUserAuthorized",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke API as required parameters are missing.",
    apiRequest_isAuthorized: "KOG_isAuthorized",
    apiRespParam_FirstName: "FirstName",
    apiRespParam_LastName: "LastName",
    apiRespParam_EmailAddress: "EmailAddress",
    apiRespParam_UPN: "UPN",
    apiRespParam_Logon: "Logon",
    apiRespParam_KOGID: "KOGID",
    apiResponse_KOG_TOKEN: "KOG_TOKEN_API_RESPONSE",
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE",
    apiResponseStatus: "Status",
    apiResponsePass: "true",
    apiResponseFail: "false",
    apiRespFailMsgCode: "MessageCode",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    FAIL: "Failed",
    ERROR: "Error"
};

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


// Declare Global Variables
var missingInputs = [];

// Check for KOG token API
nodeLogger.error("Inside_IsAuthorized_Before_Variables");
var kogTokenApi = systemEnv.getProperty("esv.kyid.kogapi.isauthztoken");
if (kogTokenApi) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Read kogTokenAPIURL :: " + kogTokenApi);
} else {
    missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}

// Check for KOG isAuthorized API
var kogAuthzApi = systemEnv.getProperty("esv.kyid.kogapi.isauthzendpoint");
if (kogAuthzApi) {
    logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Read kogAuthzApi :: " + kogAuthzApi);
} else {
    missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}

// Handle missing inputs
if (missingInputs.length > 0) {
    logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);
} else {
    try {
        var apiTokenRequest = require('KYID.Library.isAuthzKOGAPIAccessToken');
        var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
        logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Reading access token :: " + kogAPITokenResponse.status);
        //Hardcoded the help desk KOG ID as we only have one user from Helpdesk
        if (kogAPITokenResponse.status === 200) {
            var bearerToken = kogAPITokenResponse.response;
            var KOGID = nodeState.get("KOGID");
            var body = {
                "UserIdentifier": {
                    "KOGID": KOGID
                },
                "ApplicationName": "Help Desk",
                "RoleName": "ManageForgeRockUserMFA"
            };


            var apiKOGisUserAuthzRequest = require("KYID.Library.ProcessKOGAPIRequest");
            var kogisUserAuthzResponse = apiKOGisUserAuthzRequest.processHttpRequest(null, kogAuthzApi, "POST", body, bearerToken);
            var status = kogisUserAuthzResponse.status;

            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "API Request Response (Stringified): " + kogisUserAuthzResponse.status);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "API Request Response : " + kogisUserAuthzResponse.success);

            if (kogisUserAuthzResponse.status === 200) {
                if (kogisUserAuthzResponse.success === "true") {
                    action.goTo(nodeOutcome.SUCCESS);
                } else {
                    logger.debug("inside the false response******************************")
                    action.goTo(nodeOutcome.FAIL);
                }
            } else {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + nodeConfig.errorAPICall + " Response Status: " + kogisUserAuthzResponse.status);
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving API token: " + kogAPITokenResponse.status);
            action.goTo(nodeOutcome.FAIL);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error during API token retrieval: " + error.message);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error stack: " + error.stack);
        action.goTo(nodeOutcome.FAIL);
    }
}