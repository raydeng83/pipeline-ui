var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: LexisNexis KBA",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexis.KBA",
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

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    var flowName = null;
    var proofingMethod = null;
    var ridpMethod = null;
    try {
        flowName = nodeState.get("flowName");
        logger.debug("flowName in KBA " + flowName);
        proofingMethod = nodeState.get("orig_proofingMethod") || nodeState.get("proofingMethod");
        ridpMethod = nodeState.get("RidpMethod")
        logger.debug("ridpMethod in KBA " + ridpMethod);
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var displayCallBackJSON = {
            "apiCalls":[
                {
                    "method" :"LexisNexis",
                    "action" : "KBA",
                }
            ],
            "collectedUserInfo": nodeState.get("userInfoJSON"),
            "userID": usrKOGID,
            "userMail": mail
        };

        if(flowName.toLowerCase() === "createaccount" || (flowName.toLowerCase() === "firsttimelogin" && !nodeState.get("isMFARecovery"))){
            action.goTo("noKBA");
        }else if((ridpMethod.toLowerCase() == "lexisnexisverification")  && (flowName && flowName.toLowerCase() === "updateprofile" || flowName.toLowerCase() === "organdonor")){
            action.goTo("noKBA");
        }else{
            if (callbacks.isEmpty()) {
                requestCallbacks(displayCallBackJSON);
            } else {
                handleUserResponses();
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ error);
    }
}

main();

// Function to request Callbacks
function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    try {

        // var pageHeader= {"pageHeader": "2_RIDP_LexisNexis_KBA"};
        var pageHeader= {"pageHeader": "4_RIDP_KBA"};

        if (nodeState.get("validationMessage") != null) {
            logger.error("validationMessage"+nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}


function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var response = null;
    var parsedResponse = null;
    var selectedOutcome = null;
    var riskIndicator = null;
    var verificationStatus = null;
    var flowName = null
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        riskIndicator = nodeState.get("riskIndicator");
        verificationStatus = nodeState.get("verificationStatus");
        flowName = nodeState.get("flowName");
        if(selectedOutcome === 0){
            response = callbacks.getTextInputCallbacks().get(0);
            parsedResponse = JSON.parse(response);
            logger.debug("parsedResponse is :: "+ JSON.stringify(parsedResponse))
            if(parsedResponse && parsedResponse.status && parsedResponse.status.toLowerCase() === "success"){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "KBA Verification Successful with risk Indicator: " + riskIndicator + " and verification Status: " + verificationStatus);
                //auditLog("RIDP_KBA_VERIFICATION_SUCCESS", "KBA Verification Successful with risk Indicator: " + riskIndicator + " and verification Status: " + verificationStatus);
                nodeState.putShared("kbaVerificationStatus", parsedResponse.status);
                if(flowName && (flowName.toLowerCase() === "updateprofile" || flowName.toLowerCase() === "organdonor" || flowName.toLowerCase() === "appenroll" || flowName.toLowerCase() === "forgotpassword"  || flowName.toLowerCase() === "mfarecovery" || flowName.toLowerCase() === "userverification") && nodeState.get("nextDayRetry") && nodeState.get("nextDayRetry") == "true"){
                    nodeState.putShared("successVerificationAttempts","0")
                    // if(nodeState.get("ishelpdesk") == true){
                    //     patchRetryLimitHelpdesk();
                    // }else{
                    //     patchRetryLimit();
                    // }  
                    patchRetryLimitHelpdesk();
                    patchRetryLimit();
                }
                action.goTo("kbaSuccess");
            }else if(parsedResponse && parsedResponse.status && parsedResponse.status.toLowerCase() === "failed"){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "KBA Verification Failed with risk Indicator: " + riskIndicator + " and verification Status: " + verificationStatus);
                //auditLog("RIDP_KBA_VERIFICATION_FAILED", "KBA Verification Failed with risk Indicator: " + riskIndicator + " and verification Status: " + verificationStatus);
                nodeState.putShared("kbaVerificationStatus", parsedResponse.status);
                if(flowName && (flowName.toLowerCase() === "updateprofile" || flowName.toLowerCase() === "organdonor" || flowName.toLowerCase() === "appenroll" || flowName.toLowerCase() === "forgotpassword" || flowName.toLowerCase() === "mfarecovery" || flowName.toLowerCase() === "userverification")){
                    if(nodeState.get("helpdesk") == "true" || nodeState.get("ishelpdesk") == "true"){
                        patchRetryLimitHelpdesk();
                    }else{
                        patchRetryLimit();
                    }  
                }
                action.goTo("kbaFailed");
            }
        }else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "back button clicked");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in handleUserResponses Function" + error.message);
        action.goTo("error");
    }
}


function patchRetryLimitHelpdesk(){
    var verificationAttempts = Number(nodeState.get("verificationAttemptHelpdesk")) || 0;
    logger.debug("verificationAttemptHelpdesk in patchRetryLimitHelpdesk :: "+ verificationAttempts)
    var userIdentity = nodeState.get("userIdentity");
    var jsonArray = [];
    try {
        var jsonObj = {
            "operation": "replace",
            "field": "verificationAttemptHelpdesk",
            "value": nodeState.get("successVerificationAttempts") || String(verificationAttempts+1)
        }
        
        jsonArray.push(jsonObj)

        var jsonObj = {
            "operation": "replace",
            "field": "lastVerificationDate",
            "value": dateTime
        }
        nodeState.putShared("verificationAttempt",(verificationAttempts+1))
        jsonArray.push(jsonObj)
        if(jsonArray.length>0 && userIdentity){
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, jsonArray);
            logger.debug("Patch Response for Retry Limit Update: " + JSON.stringify(response));
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in patchRetryLimit Function" + error.message);
    }
}


function patchRetryLimit(){
    var verificationAttempts = Number(nodeState.get("verificationAttempt")) || 0;
    logger.debug("verificationAttempts is :: "+ verificationAttempts)
    var userIdentity = nodeState.get("userIdentity");
    var jsonArray = [];
    try {
        var jsonObj = {
            "operation": "replace",
            "field": "verificationAttempt",
            "value": nodeState.get("successVerificationAttempts") || String(verificationAttempts+1)
        }
        jsonArray.push(jsonObj)
         var jsonObj = {
            "operation": "replace",
            "field": "lastVerificationDate",
            "value": dateTime
        }
        jsonArray.push(jsonObj)
        nodeState.putShared("verificationAttempt",(verificationAttempts+1))
        if(jsonArray.length>0 && userIdentity){
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, jsonArray);
            logger.debug("Patch Response for Retry Limit Update: " + JSON.stringify(response));
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in patchRetryLimit Function" + error.message);
    }
}

// Audit Log Function
function auditLog(code, message) {
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}