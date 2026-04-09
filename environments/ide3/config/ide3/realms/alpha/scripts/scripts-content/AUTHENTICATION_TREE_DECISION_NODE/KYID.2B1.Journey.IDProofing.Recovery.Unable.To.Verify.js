var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Unable To Verify",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Recovery.UnableToVerify",
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


function main(){
    var ridpReferenceID = null;
    var jsonobj = {};
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main function");
        var pageHeader = {"pageHeader":"Unable to Verify Identity"};
        callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
        jsonobj["Flow"]=nodeState.get("flowName");
        jsonobj["ErrorMsg"] ="We are unable to verify your identity based on the submitted information. Please review yoour submitted information and retry or else choose a different method"
        jsonobj["HelpDeskContactId"] ="b93154a8-a55f-4e4e-8769-bdad375eb852";
        jsonobj["TransactionId:"] = ridpReferenceID;
        jsonobj["TransactionDateTime"]=dateTime;
        jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress");
        jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
        var refernceObj = {"referenceId": ridpReferenceID}
        if (callbacks.isEmpty()) {
            requestCallbacks(jsonobj);
        } else {
            var handleresponseRes = handleUserResponses();
            logger.debug("after handle response" + handleresponseRes)
            if(handleresponseRes === "retry"){
                action.goTo("retry")
            }
        }

        // if (callbacks.isEmpty()) {
        //     requestCallbacks(displayCallBackJSON);
        // } else {
        //     handleUserResponses();
        // }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main Function" + error);
        action.goTo("error")
    }
}

main()


// Function to request Callbacks
function requestCallbacks(jsonobj) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    //var promt = null;
    try {
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        logger.debug("verificationAttempt is :: "+ nodeState.get("verificationAttempt"))
        
        if(nodeState.get("verificationAttempt") == "1" || nodeState.get("verificationAttempt") == "0" || !nodeState.get("verificationAttempt")){
            var promt = ["Review and retry","Choose a different method"]
        }else{
            var promt = ["Choose a different method"]
        }

        callbacksBuilder.confirmationCallback(0, promt, 0);
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in requestCallbacks Function" + error);
        action.goTo("error")
    }
}


function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.debug("verificationAttempt in handleUserResponses is :: "+ nodeState.get("verificationAttempt"))
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected option index: " + selectedOutcome);

            if(selectedOutcome === 0){
                if(nodeState.get("verificationAttempt") == "1" || nodeState.get("verificationAttempt") == "0" || nodeState.get("verificationAttempt") == null){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + " User chose to Review and Retry, Going to retry");
                    patchUseridenityResponse = patchUserIdentity("1")
                    auditLog("RIDP025", "KYID-RD-001: Unable to Verify - User chose to Review and Retry");
                    nodeState.putShared("userSelection","retry")
                    if(patchUseridenityResponse){
                        logger.debug("going to retry")
                        return "retry"
                    }
                }else{
                     logger.debug("else block ")
                     return "error"
                }
            }
            /*else{
                patchUseridenityResponse = patchUserIdentity("1")
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + " User chose to Choose a different method, Going to different method");
                auditLog("RIDP026", "KYID-RD-002: Unable to Verify - User chose to Choose a different method");
                nodeState.putShared("userSelection","differentMethod")
                 if(patchUseridenityResponse){
                     action.goTo("differentMethod");
                 }else{
                     logger.debug("something in patchUseridenityResponse2")
                 }
             }*/
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in handleUserResponses Function" + error);
        action.goTo("error")
    }
}


function patchUserIdentity(attempt){
    try{
        var userIdentity = nodeState.get("patchUserId") || nodeState.get("userIdentity")
        if(userIdentity && userIdentity != null && userIdentity != ""){
            logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "In Function patchMCIStatus");
            var jsonArray = []
            var jsonObj = {
                "operation": "replace",
                "field": "verificationAttempt",
                "value": attempt
            }
            jsonArray.push(jsonObj)
            
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, jsonArray);
            logger.debug("response in patchUserIdentity is "+ JSON.stringify(response))
            return response;
        }else{
            logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Identity is null or empty in Function patchMCIStatus");
            nodeState.putShared("validationMessage", "User Identity is null or empty in Function patchMCIStatus");
            action.goTo("errorMessage");
        }

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in patchUserIdentity Function" + error);
        return null;
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