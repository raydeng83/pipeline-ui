var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.callFARS.v2",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

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

// Main Execution
try {
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = nodeState.get("userInfoJSON");
    var transactionRecord = null;
    var helpDeskContact = null;
    var visitInPerosnalInfo = null;

    var userInfoJSON = nodeState.get("userInfoJSON") || {};
    //userInfoJSON["mobileNumber"] = nodeState.get("telephoneNumber") || nodeState.get("orig_telephoneNumber") || "";

    var callFARS = {
            "apiCalls":[
                {
                   	"method" :"FARS",
                	"action" : "verify",
                            
                }
            ],
            "collectedUserInfo": userInfoJSON
    }
    if(nodeState.get("transcationRecord")!== null){
        transactionRecord = nodeState.get("transcationRecord");
        if(transactionRecord.helpDeskContact){
            helpDeskContact = transactionRecord.helpDeskContact;
        }
        if(transactionRecord.visitInPerosnalInfo){
            visitInPerosnalInfo = transactionRecord.visitInPerosnalInfo;
        }
    }
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }

        // var pageHeader= "2_add_methods";
         var pageHeader= {"pageHeader": "FARS_VERIFY"};


        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(callFARS));
       
      
        callbacksBuilder.textInputCallback("Response");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);



    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}


function handleUserResponses() {
    try {
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var apiResponse = callbacks.getTextInputCallbacks().get(0);
        logger.debug("validateObject(apiResponse):: " + typeof apiResponse);
        logger.debug("validateObject(apiResponse):: " + validateObject(apiResponse));

        var flowName = "App Enroll" || nodeState.get("flowName");
        var userInfo = nodeState.get("userInfoJSON1") || ""
        var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
        var lexisnexisResponse = nodeState.get("lexisnexisResponse") || ""

        if (typeof apiResponse === "string") {
            try {
                apiResponse = JSON.parse(apiResponse);
            } catch (e) {
                logger.debug("Error parsing apiResponse: " + e);
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }
        }
        logger.debug("KYID.2B1.Journey.IDProofing.APICAllCSM response is --> " + JSON.stringify(apiResponse));
        if (selectedOutcome === 0) {
            nodeState.putShared("validationErrorCode", null);
            logger.debug("KYID.2B1.Journey.IDProofing.API CAllCSM response is --> " + apiResponse.status);
            if ( apiResponse.status && typeof apiResponse.status === "string" && apiResponse.status.toLowerCase() === "success" ) {
                nodeState.putShared("validationMessage", null);
                nodeState.putShared("allFARS", "success");
                nodeState.putShared("prereqStatus","COMPLETED")
                nodeState.putShared("completedAttemp","2")
                reason = "The user personal information provided to Experian is verified";
                title = "User identity verification is successful."
                auditLog("KYID-EX-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                auditLog("KYID-EX-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                action.goTo("success");
            } else if ( apiResponse.status && typeof apiResponse.status === "string" && apiResponse.status.toLowerCase() === "failed") {
                if(nodeState.get("context") === "appEnroll") {
                    nodeState.putShared("validationMessage", null);
                    nodeState.putShared("callFARSFailed","true")
                    nodeState.putShared("prereqStatus","PENDING")
                    if(apiResponse && apiResponse.errorMessage && typeof apiResponse.errorMessage === "string" && apiResponse.errorMessage.trim() !== ""){
                        nodeState.putShared("errorMessageFARS", apiResponse.errorMessage);
                    }
                    reason = "KYID or LexID does not match with the response provided Experian LexID";
                    title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                    auditLog("KYID-EX-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    auditLog("KYID-EX-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                    action.goTo("displayFARS");
                }
            } else {
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
            }
        }  
        
    } catch (error) {
        logger.debug(
            (typeof transactionid !== "undefined" ? transactionid : "") + "::" +
            (nodeConfig && nodeConfig.timestamp ? nodeConfig.timestamp : "") + "::" +
            (nodeConfig && nodeConfig.node ? nodeConfig.node : "") + "::" +
            (nodeConfig && nodeConfig.nodeName ? nodeConfig.nodeName : "") + "::" +
            (nodeConfig && nodeConfig.script ? nodeConfig.script : "") + "::" +
            (nodeConfig && nodeConfig.scriptName ? nodeConfig.scriptName : "") + "::" +
            (nodeConfig && nodeConfig.begin ? nodeConfig.begin : "") + "::" +
            "error occurred in handleUserResponses function ::" + error +
            (typeof mail !== "undefined" ? mail : "")
        );
        nodeState.putShared("validationMessage", "invalid_input");
        action.goTo("error");

    }

}
function validateObject(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return true;
        }
    }

    return true;
}


// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title) {
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
        if(nodeState.get("flow") === "helpdesk"){
            eventDetails["applicationName"] = systemEnv.getProperty("esv.helpdesk.name");
        }else{
            eventDetails["applicationName"] = systemEnv.getProperty("esv.kyid.portal.name");
        }
        
        eventDetails["requestedApplication"] = nodeState.get("appName") || "";
        eventDetails["requestedRole"] = nodeState.get("roleName") || "";
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