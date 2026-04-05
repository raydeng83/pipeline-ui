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
    REQUEST_ROLE: "continue",
    REMOVE_ROLE: "removeRole",
    REFRESH: "refresh",
    INVALID_JSON: "invalidJson",
    INVALID_ROLE: "invalidRoleId"
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
},
       info: function (message) {
        logger.info(message);
}
};

// ===== Functions =====

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
    }
    return null;
}

function requestCallbacks(appName, userId, appId, userKyAccountType) {
    try {

        //for FAQ topic
        var lib = require("KYID.Library.FAQPages");
        var process ="RequestAccess";
        var pageHeader= "request_access";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        
        if (nodeState.get("invalidJSONError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
        }
        if (nodeState.get("invalidRoleError") !== null) {
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidRoleError"));
        }

        var jsonobj = {"pageHeader": "request_access"};
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        
        // Fetch roles the user has
        var userRoles = dashboard.getUserRole(userId);

        //Fetch all roles of application
        var appRoles = dashboard.getAppRole(appId);
         
        var unmatchedRequestableRoles = [];
        // Roles the user doesn't have
        try {
            unmatchedRequestableRoles = dashboard.filterSelfServiceRequestableRoles(userId, appId, userKyAccountType);
            logger.debug("Requestable unmatched roles: " + JSON.stringify(unmatchedRequestableRoles));
        } catch (e) {
            logger.error("Error fetching requestable roles: " + e);
        }
                
        nodeState.putShared("AppRoleIds", appRoles); // For downstream use

       // if (unmatchedRequestableRoles.length > 0) {
        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, appId);
        if (busApp) {
        if(busApp && busApp.content && busApp.content[0].title && busApp.content[0].title.en){
           var businessAppName = busApp.content[0].title.en
           var businessAppDisplayName = busApp.content[0].title
        }
        else{
          var businessAppName = busApp.name;
          var businessAppDisplayName = {}
        }
        // var businessAppName = busApp.name;
        var businessAppLogo = busApp.logoURL;
        var applicationData = dashboard.getApphelpdesk(appId);

        //logger.debug("helpdesk data for app"+JSON.stringify(applicationData))
        var finalRequestAccessResponse = dashboard.formatJSON(businessAppName, businessAppLogo, unmatchedRequestableRoles, applicationData,businessAppDisplayName);


        callbacksBuilder.textOutputCallback(0, finalRequestAccessResponse); 
        callbacksBuilder.textInputCallback("JSON Input");
       // logger.debug("after output");
        if (requestParameters.get("appIDinWidget") && requestParameters.get("appIDinWidget")[0]) {
            callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
         } else {
            callbacksBuilder.confirmationCallback(0, ["Continue", "Refresh", "Back to manage access"], 0);
        }

            //FAQ ID added only for login authz scenario 5. External user dont have any requestable roles. 
             if (unmatchedRequestableRoles.length === 0 && requestParameters.get("appId") && requestParameters.get("appLogo")) {
                logger.debug("No requestable roles found for external user during login authorization check, showing FAQ page.");
        
                    var lib = require("KYID.Library.FAQPages");
                    var process = "kyid_2B1_requestAccess_Dashboard";
                    var pageHeader = "1_internaluser_norequestableroles";
                    var getFaqTopicId = lib.getFaqTopidId(pageHeader, process);
                    logger.debug("getFaqTopicId : " + getFaqTopicId);
        
                    if (getFaqTopicId != null) {
                        callbacksBuilder.textOutputCallback(0, "" + getFaqTopicId + "");
                    }
                } else {
                 if(getFaqTopicId!= null){
                    callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
                }
                }
            
            return;
        } else {
            logger.debug("no business app found")
            action.goTo(NodeOutcome.ERROR);
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
            clearErrors();
            //logger.debug("user clicks on continue")
            if (dashboard.validateJsonFormat(userInput)) {
                var response = JSON.parse(userInput);
                var roleIds = response.roleId;

                var validUnmatchedRoles = dashboard.filterSelfServiceRequestableRoles(userId, appId, userKyAccountType);
                var unmatchedRoles = roleIds.filter(role => !validUnmatchedRoles.includes(role));

                if (unmatchedRoles.length > 0) {
                    nodeState.putShared("invalidRoles", unmatchedRoles.toString());
                    nodeState.putShared("roleIds", roleIds);
                   // clearErrors();
                    nodeState.putShared("invalidRoleError", "Invalid_RoleId");
                    action.goTo(NodeOutcome.INVALID_ROLE);
                } else {
                    logger.debug("roleid is valid and requestable")
                    nodeState.putShared("roleIds", roleIds);
                   // clearErrors();
                    action.goTo(NodeOutcome.REQUEST_ROLE);
                }
            } else {
                //clearErrors();
                nodeState.putShared("invalidJSONError", "Invalid_JSON");
                action.goTo(NodeOutcome.INVALID_JSON);
            }
        }

    } catch (error) {
        nodeLogger.error(transactionid +"::"+nodeConfig.timestamp+" handleUserResponses error:: "+error);
        action.goTo(NodeOutcome.ERROR);
    }
}
function clearErrors(keepKey) {
    nodeState.putShared("invalidJSONError",null)
    nodeState.putShared("invalidRoleError",null)
    nodeState.putShared("internaluser",null)
    nodeState.putShared("rolenotremovable",null)
}

// ===== Main Execution =====
try {
        var appName;
        
        if (nodeState.get("appIDinWidget")) {
            appName = nodeState.get("appIDinWidget");
            logger.debug("appName from nodeState: " + appName);
        } else if (requestParameters.get("appIDinWidget") && requestParameters.get("appIDinWidget")[0]) {
            try {
                var appNameFromURL = requestParameters.get("appIDinWidget")[0];
                appName = decodeURIComponent(appNameFromURL);
                logger.debug("appName from requestParameters (decoded): " + appName);
            } catch (e) {
                logger.error("Failed to decode appIDinWidget from requestParameters: " + e);
                action.goTo(NodeOutcome.ERROR);
            }
        } else {
            logger.debug("Missing appID from both nodeState and requestParameters.");
            action.goTo(NodeOutcome.ERROR);
        }

    var appIdResp = dashboard.getBusinessAppByName(appName);
    var appId = appIdResp._id;
    logger.debug("The appId is: " + appId);

    // Get logged-in user details
    var userId;
    var userKyAccountType;
    //nodeState.putShared("_id","798c6cf1-899c-45fd-83c9-06e44a51738c")
    if (nodeState.get("_id")) {
        userId = nodeState.get("_id");
        var userObj = openidm.read("managed/alpha_user/" + userId);
        if (userObj) {
       // userKyAccountType = userObj.custom_kyidAccountType;
        userKyAccountType = mapKyAccountTypeToNumber(userObj.custom_kyidAccountType);
        }
    } else if (existingSession.get("KOGID")) {
        var KOGID = existingSession.get("KOGID");
        var user = queryUserByKOGID(KOGID);
        if (user) {
            userId = user._id;
            userKyAccountType = mapKyAccountTypeToNumber(user.custom_kyidAccountType);
        }
    }

    if (!userId) {
        logger.debug("Unable to determine user ID.");
        action.goTo(NodeOutcome.ERROR);
    }
    logger.debug("the user id: "+userId);
    nodeState.putShared("_id", userId);

    if (callbacks.isEmpty()) {
        logger.debug("entering the requestCallbacks")
        logger.debug("userKyAccountType before calling requestCallbacks: " + userKyAccountType);
       requestCallbacks(appName, userId, appId, userKyAccountType);
    } else {
        handleUserResponses(appId, userId);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.scriptName + "::Error in main execution:: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}