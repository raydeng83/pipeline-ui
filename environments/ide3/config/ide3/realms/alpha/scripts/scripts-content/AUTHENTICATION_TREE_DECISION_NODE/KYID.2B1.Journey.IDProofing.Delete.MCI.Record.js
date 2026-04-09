var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Delete MCI Record",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Delete.MCI.Record",
    timestamp: dateTime,
    end: "Node Execution Completed"
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
}


function requestCallbacks() {
nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside requestCallbacks");
    try{        
            var kogId= nodeState.get("kogIDToDelete");
            var userInfo = nodeState.get("userInfoJSON") || {};
            userInfo.kogId = kogId;

            var obj = {
                    "apiCalls":[ { "method": "MCI", "action": "delete" }],
                    "collectedUserInfo": userInfo
                };
            if (nodeState.get("validationMessage") != null) {
                var errorMessage = nodeState.get("validationMessage");
                callbacksBuilder.textOutputCallback(0, errorMessage);
            }
            var pageHeader= {"pageHeader": "5_RIDP_MCI_Delete"};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            callbacksBuilder.textOutputCallback(0, JSON.stringify(obj));
            callbacksBuilder.textInputCallback("MCI Delete Status");
            callbacksBuilder.confirmationCallback(0, ["next"], 0);
        //}
    }catch(error){
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in catch of requestCallbacks in KYID.2B1.Journey.IDProofing.Delete.MCI.Record :: " + error)
   }
}

function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside handleUserResponses");
    try{
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var kbaStatus = callbacks.getTextInputCallbacks().get(0);

            if (typeof kbaStatus === "string") {
                try {
                    kbaStatus = JSON.parse(kbaStatus);
                    if (!kbaStatus || typeof kbaStatus !== "object" || typeof kbaStatus.status !== "string") {
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Invalid kbaStatus object or missing status property");
                        nodeState.putShared("validationMessage", "invalid_input");
                        action.goTo("errorMessage");
                        return;
                    }

                    // Only check refId if status is "failure"
                    if (kbaStatus.status.toLowerCase() === "failure") {
                        if (!(kbaStatus.refId === null || typeof kbaStatus.refId === "string")) {
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Invalid refId in kbaStatus (must be null or string) when status is failure");
                            nodeState.putShared("validationMessage", "invalid_input");
                            action.goTo("errorMessage");
                            return;
                        }else{
                            nodeState.putShared("refId",kbaStatus.refId)
                        }
                    }

                } catch (e) {
                    nodeLogger.error("Error parsing kbaStatus or invalid status: " + e);
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("errorMessage");
                    return;
                }
            }
        if (selectedOutcome === 0) {
            nodeState.putShared("validationMessage",null);
            auditLog("RIDP005", "MCI Record Deleted Successfully", false);
            action.goTo("true");
        }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in catch of handleUserResponses in KYID.2B1.Journey.IDProofing.Delete.MCI.Record :: " + error)
    }
}


// Audit Log Function
function auditLog(code, message, helpdeskVisibility) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        var browser = requestHeaders.get("user-agent");
        var os = requestHeaders.get("sec-ch-ua-platform");
        var userId = null;
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = browser;
        eventDetails["OS"] = os;
        eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
        }
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = false;
        var helpdeskVisibility = helpdeskVisibility || false;
        
        if (userEmail) {
            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: 'mail eq "' + userEmail + '"'
            }, ["_id"]);
            userId = userQueryResult.result[0]._id;
        }
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails, sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}


function main(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Node Execution Started");
   try{
       if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }
   } catch(error){
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in catch of KYID.2B1.Journey.IDProofing.Delete.MCI.Record :: " + error)
   }
}

main();