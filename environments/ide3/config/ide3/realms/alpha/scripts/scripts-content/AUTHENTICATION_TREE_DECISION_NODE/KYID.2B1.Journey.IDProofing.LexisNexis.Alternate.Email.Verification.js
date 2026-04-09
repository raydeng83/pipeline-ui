var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: LexisNexis Alternate Email Verification",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexis.Alternate.Email.Verification",
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
    var flowName = null

    try {
        if(nodeState.get("alternateEmail") && nodeState.get("alternateEmail")!==null){
            var mail = nodeState.get("alternateEmail");
            var displayCallBackJSON = {
                apiCalls: [
                {
                    method: "LexisNexis"
                }
                ],
                collectedUserInfo: nodeState.get("userInfoJSON") || nodeState.get("userInfoJSON1"),
                userMail: mail
            };
            
                displayCallBackJSON.apiCalls[0].action = "emailVerification";
                flowName = "Email Verification"
                displayCallBackJSON.collectedUserInfo.mail =  nodeState.get("alternateEmail");
            
            if (callbacks.isEmpty()) {
                requestCallbacks(displayCallBackJSON);
            } else {
                handleUserResponses(flowName);
            }
        }else{
            logger.debug("no Alternate Email for verification")
             action.goTo("skip");
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ error);
    }
}

main();

// Function to request Callbacks
function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    var pageHeader = null;
    
    try {
        if (nodeState.get("validationMessage") != null) {
            logger.debug("validationMessage"+nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        
        pageHeader = {"pageHeader": "2_RIDP_lexisNexis_Mail_Verification"};
        nodeState.putShared("flowContext", "emailAge")
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}

// Function to handle User Responses
function handleUserResponses(flowName) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var response = null;
    var selectedOutcome = null;
    var transactionIdLN = null;
    var risk = null;
    var requestStatus = null;
    var riskReason = null;
    var riskReasonID = null;
    var riskReasonDescription = null;
    var riskBand = null;
    var failureReason = null;
    var reason = null;
    var title = null;
    var mail = nodeState.get("mail") || "";
    var userInfo = nodeState.get("userInfoJSON");
    var lexisnexisResponse = null;
    
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            response = callbacks.getTextInputCallbacks().get(0);
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Response: " + response);
            nodeState.putShared("lexisnexisResponse", JSON.parse(response))
            lexisnexisResponse = response;
            var parsedResponse = JSON.parse(response);
            // Ensure required attributes are present in parsedResponse
            if (parsedResponse.transactionId && parsedResponse.risk) {
                // Store values in nodeState
                transactionIdLN = parsedResponse.transactionId || "" ;
                risk = parsedResponse.risk || "" ;
                requestStatus = parsedResponse.requestStatus || "" ;
                riskReason = parsedResponse.reason || "" ;
                riskReasonID = parsedResponse.riskReasonId || "" ;
                riskReasonDescription = parsedResponse.riskReasonDescription || "" ;
                riskBand = parsedResponse.riskBand || "" ;
                failureReason = parsedResponse.failureReason || "" ;

                if(parsedResponse.emailRiskIndicator && parsedResponse.emailRiskIndicator != null){
                    logger.debug("inside emailRiskIndicator")
                    //nodeState.putShared("emailRiskIndicator", JSON.stringify(parsedResponse.emailRiskIndicator));
                    nodeState.putShared("secondEmailRiskIndicator", JSON.stringify(parsedResponse.emailRiskIndicator))
                    nodeState.putShared("emailRiskIndicatorForTransaction", parsedResponse.emailRiskIndicator);
                    nodeState.putShared("mailRisk",parsedResponse.riskIndicatorDetails.risk)
                }

                nodeState.putShared("transactionIdLN", transactionIdLN);
                nodeState.putShared("mailRisk", risk);
                nodeState.putShared("requestStatus", requestStatus);
                nodeState.putShared("riskReason", riskReason);
                nodeState.putShared("riskReasonId", parsedResponse.riskReasonID);
                nodeState.putShared("riskReasonDescription", riskReasonDescription);
                nodeState.putShared("riskBand", riskBand);
                nodeState.putShared("failureReason", failureReason);

                if(risk && risk.toLowerCase() === "high") {
                    nodeState.putShared("errorMessage","KYID-LN-000")
                    reason = "The LexisNexis response contains high risk indicators";
                    title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                    auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                    action.goTo("highRisk");
                } else if (risk && risk.toLowerCase() !== "high") {
                    nodeState.putShared("phoneVerification", "success")
                    auditLog("KYID-LN-007", `${flowName} success as part of `, false, transactionid, flowName, mail, null, null, null, null, true);
                    action.goTo("success");
                }
                
            } else {
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Missing required LexisNexis response attributes");
                action.goTo("error");
                return;
            }

        }else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "back button clicked");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error handleUserResponses Function " + error.message);
        action.goTo("error");
    }  
} 
        

// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title, sspVisibility) {
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
        //eventDetails["transactionid"] = transactionid || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || "";
        
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
        var sspVisibility = sspVisibility || false;
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