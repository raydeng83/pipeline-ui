var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Unable To Verify",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Recovery.Unable.To.Verify.Retry.DifferentMethod",
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


// Node outcomes
var nodeOutcome = {
    TRUE: "true"
};


function main(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main function");
   try{
       if (callbacks.isEmpty()) {
            requestCallbacks();
        }else {
            handleUserResponses();
        } 
   } catch(error){
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main Function" + error);
   }
}

main()


// Function to request Callbacks
function requestCallbacks() {
    var ridpReferenceID = null;
    var jsonobj = {};
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    try {
        var pageHeader = {"pageHeader":"IdentityVerificationError"};
        ridpReferenceID  = nodeState.get("ridpReferenceID");
        callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
        jsonobj["Flow"]=nodeState.get("flowName");
        jsonobj["ErrorMsg"] = nodeState.get("errorMessage")
        jsonobj["HelpDeskContactId"] ="b93154a8-a55f-4e4e-8769-bdad375eb852";
        jsonobj["TransactionId:"] = ridpReferenceID;
        jsonobj["TransactionDateTime"]=dateTime;
        jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress") || nodeState.get("mail");
        jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || nodeState.get("userAttributes") || "";
        jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
        jsonobj["Context"] = nodeState.get("Context") || "";
        jsonobj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
        jsonobj["userLexID"] = nodeState.get("uuid") || "";
        jsonobj["riskIndicator"] = nodeState.get("riskIndicator") || "";
        jsonobj["riskIndicatorDetails"] = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : "";
        jsonobj["inactiveUserAccounts"] = nodeState.get("terminatedArray") ? JSON.parse(nodeState.get("terminatedArray")) : "";
        var refernceObj = {"referenceId": ridpReferenceID}
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        
        logger.debug("verificationAttempt is :: "+ nodeState.get("verificationAttempt"))
        
        if(nodeState.get("ishelpdesk") == "true" || nodeState.get("verificationAttempt") >= 2){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Helpdesk is true, going to helpdesk node");
            var userChoice = ["Choose a different method"];
        }else{
            var userChoice = ["Choose a different method","Review and retry"];
        }
        
        var prompt = "Please select a option from below"
        callbacksBuilder.choiceCallback(`${prompt}`, userChoice, 0 ,false)
        callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
        //callbacksBuilder.confirmationCallback(0, promt, 0);
        //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in requestCallbacks Function" + error);
        action.goTo("error")
    }
}


function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var flowName = nodeState.get("flowName")
    var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse")
    var userInfo = nodeState.get("userInfoJSON1")
    try {
        //action.goTo("true");
        var selectedConfirmationOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.debug("selectedConfirmationOutcome are :: "+ selectedConfirmationOutcome)
        var selectedOutcome = callbacks.getChoiceCallbacks().get(0)[0];
        logger.debug("selectedOutcome are :: "+ selectedOutcome)
        
        logger.debug("verificationAttempt in handleUserResponses is :: "+ nodeState.get("verificationAttempt"))
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User selected option index: " + selectedOutcome);

        if(!(nodeState.get("ishelpdesk") == "true")){
            if (selectedConfirmationOutcome === 0) {
                 if(!(nodeState.get("verificationAttempt") >= 2)){
                    if(selectedOutcome === 0){
                        logger.debug("true")
                        //auditLog("RIDP005", "KYID-RD-001: Unable to Verify - User chose to Review and Retry");
                        nodeState.putShared("userSelection","retry")
                        reason = "User chose to retry as verification failed";
                        //auditLog("KYID-LN-009", `User chose to retry as part of ${flowName}`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason);
                        action.goTo(nodeOutcome.TRUE)
                    }else{
                        logger.debug("after differentMethod")
                        //auditLog("RIDP005", "KYID-RD-002: Unable to Verify - User chose to Choose a different method");
                        nodeState.putShared("userSelection","differentMethod")
                        reason = "User chose to go for different method as verification failed";
                        //auditLog("KYID-LN-009", `User chose to go for different method as part of ${flowName}`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason);
                        action.goTo("differentMethod");
                    }
                }else{
                    logger.debug("verificationAttempt exceeded in handleUserResponses is :: "+ nodeState.get("verificationAttempt"))
                    //auditLog("RIDP005", "KYID-RD-003: Unable to Verify - Verification attempts exceeded, going to helpdesk", true, transactionid, flowName, mail, userInfo, lexisnexisResponse);
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Verification attempts exceeded, going to helpdesk");
                    nodeState.putShared("userSelection","differentMethod");
                    action.goTo("differentMethod");
                }
            }else{
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in handleUserResponses Function selected outcome is wrong" + error);
                action.goTo("error")
            }
        }else{
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in handleUserResponses Function selected outcome is wrong" + error);
                action.goTo("error")
            }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in handleUserResponses Function" + error);
        action.goTo("error")
    }
}

// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse) {
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
        eventDetails["transactionid"] = transactionid || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        logger.error("sessionRefId in KYID.2B1.Journey.IDProofing.CreateAccount " + nodeState.get("sessionRefId"))
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}