var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: LexisNexis Verification",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexis.Verification",
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
    try {
        logger.debug("userInfoJSON is :: " + JSON.stringify(nodeState.get("userInfoJSON")))
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var userInfoJSON = nodeState.get("userInfoJSON") || {};

        
        var displayCallBackJSON = {
            "apiCalls":[
                {
                    "method" :"LexisNexis",
                    //"action" : "Verification"
                }
            ],
            "collectedUserInfo": userInfoJSON,
            "userID": usrKOGID,
            "userMail": mail
        };

        if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase()==="createaccount"){
             logger.debug("RidpMethod is :: " + nodeState.get("RidpMethod"))
             displayCallBackJSON["IsLNKbaRequired"] = "false"
             logger.debug("tempTelephone " +nodeState.get("telephoneNumber"))
            var tempTelephone = null
            tempTelephone = nodeState.get("telephoneNumber") ;
            logger.debug("tempTelephone " + tempTelephone)
            if (!tempTelephone || tempTelephone === "undefined" || tempTelephone === null) {
                displayCallBackJSON.collectedUserInfo["telephoneNumber"] = "";
            } else {
                displayCallBackJSON.collectedUserInfo["telephoneNumber"] = tempTelephone;
            }
        }else if((nodeState.get("journeyName") == "updateprofile" || nodeState.get("journeyName") == "organdonor") && nodeState.get("RidpMethod") == "LexisNexisVerification"){
           logger.debug("RidpMethod is :: " + nodeState.get("RidpMethod"))
           displayCallBackJSON["IsLNKbaRequired"] = "false"
        }else{
            logger.debug("RidpMethod is :: " + nodeState.get("RidpMethod"))
            displayCallBackJSON["IsLNKbaRequired"] = "true"
        }

        if(nodeState.get("alternateEmail") && nodeState.get("alternateEmail")!==null){
            var alternateEmail = nodeState.get("alternateEmail");
            displayCallBackJSON.collectedUserInfo["alternateEmail"] = alternateEmail;
            //displayCallBackJSON.apiCalls[0]["method"] = "LexisNexisEmailVerification";
             displayCallBackJSON.apiCalls[0]["action"] = "lninstantidemailverification";
        }else{
            //displayCallBackJSON.apiCalls[0]["method"] = "LexisNexis";
            displayCallBackJSON.apiCalls[0]["action"] = "Verification";
        }
        
        if (callbacks.isEmpty()) {
            requestCallbacks(displayCallBackJSON);
        } else {
            handleUserResponses();
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

        var pageHeader= {"pageHeader": "2_RIDP_lexisNexis_Verification"};

        if (nodeState.get("validationMessage") != null) {
            logger.debug("validationMessage"+nodeState.get("validationMessage") )
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

// Function to handle User Responses
function handleUserResponses() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var response = null;
    var selectedOutcome = null;
    var verifiedLexId = null;
    var lexisNexisVerificationStatus = null;
    var riskIndicator = null;
    var parsedResponse = null
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            response = callbacks.getTextInputCallbacks().get(0);
            parsedResponse = JSON.parse(response);
            logger.debug("User Response1: " + JSON.stringify(parsedResponse))
            logger.debug("User Response2: " + parsedResponse)
            response = removeSSN(parsedResponse)
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Response: " + JSON.stringify(response));
            nodeState.putShared("lexisnexisResponse", response)
           // var parsedResponse = JSON.parse(response);
            if(parsedResponse.lexId && parsedResponse.lexId != null && parsedResponse.lexId != ""){
                verifiedLexId = parsedResponse.lexId;
                nodeState.putShared("verifiedLexId", parsedResponse.lexId);
                nodeState.putShared("verifiedLexIdHelpdesk", parsedResponse.lexId);
            }

            if(parsedResponse.riskIndicator && parsedResponse.riskIndicator != null && parsedResponse.riskIndicator != ""){
                riskIndicator = parsedResponse.riskIndicator;
                nodeState.putShared("riskIndicator", parsedResponse.riskIndicator);
            }

            if(parsedResponse.verificationStatus && parsedResponse.verificationStatus != null){
                lexisNexisVerificationStatus = parsedResponse.verificationStatus;
                nodeState.putShared("verificationStatus", parsedResponse.verificationStatus);
            }


            logger.debug("inside riskIndicatorDetails :: " + JSON.stringify(parsedResponse.identityRiskIndicator))
            if(parsedResponse.identityRiskIndicator && parsedResponse.identityRiskIndicator != null && Array.isArray(parsedResponse.identityRiskIndicator) && (parsedResponse.identityRiskIndicator && parsedResponse.identityRiskIndicator.length > 0)){
                var transformedDetails = transformRiskIndicatorDetails(parsedResponse.identityRiskIndicator);
                logger.debug("transformedDetails is :: " + JSON.stringify(transformedDetails))
                nodeState.putShared("riskIndicatorDetails", JSON.stringify(transformedDetails));
                nodeState.putShared("riskIndicatorDetailsForTransaction", transformedDetails);
            }

            //emailRiskIndicator
            logger.debug("inside emailRiskIndicator :: " + JSON.stringify(parsedResponse.emailRiskIndicator))
            if(parsedResponse.emailRiskIndicator && parsedResponse.emailRiskIndicator != null){
                logger.debug("inside emailRiskIndicator")
                var transformedDetails = transformRiskIndicatorDetailsMFA(parsedResponse.emailRiskIndicator.emailageRiskIndicator);
                logger.debug("emailRiskIndicator transformedDetails is :: " + JSON.stringify(transformedDetails))
                nodeState.putShared("emailRiskIndicator", JSON.stringify(transformedDetails));
                nodeState.putShared("emailRiskIndicatorForTransaction", transformedDetails);
                nodeState.putShared("mailTransactionIdLN", parsedResponse.emailRiskIndicator.transactionId);
                nodeState.putShared("mailRisk",parsedResponse.emailRiskIndicator.risk);
                nodeState.putShared("mailRequestStatus", parsedResponse.emailRiskIndicator.requestStatus);
                nodeState.putShared("mailRiskReasonId", parsedResponse.emailRiskIndicator.riskReasonId);
                nodeState.putShared("mailRiskReason", parsedResponse.emailRiskIndicator.riskReason);
                nodeState.putShared("mailRiskReasonDescription", parsedResponse.emailRiskIndicator.riskReasonDescription);
                nodeState.putShared("mailRiskBand", JSON.stringify(parsedResponse.emailRiskIndicator.riskBand));
                nodeState.putShared("mailFailureReason", parsedResponse.emailRiskIndicator.mailFailureReason);
            }

            //phoneRiskIndicator
            logger.debug("inside phoneRiskIndicator :: " + JSON.stringify(parsedResponse.phoneRiskIndicator))
            if(parsedResponse.phoneRiskIndicator && parsedResponse.phoneRiskIndicator != null){
                logger.debug("inside phoneRiskIndicator")
                var transformedDetails = transformRiskIndicatorDetailsMFA(parsedResponse.phoneRiskIndicator.phoneFinderRiskIndicator);
                logger.debug("phoneRiskIndicator transformedDetails is :: " + JSON.stringify(transformedDetails))
                nodeState.putShared("phoneRiskIndicator", JSON.stringify(transformedDetails));
                nodeState.putShared("phoneRiskIndicatorForTransaction", transformedDetails);
                nodeState.putShared("phoneTransactionIdLN", parsedResponse.phoneRiskIndicator.transactionId);
                nodeState.putShared("phoneRisk",parsedResponse.phoneRiskIndicator.risk)
                nodeState.putShared("phoneRequestStatus", parsedResponse.phoneRiskIndicator.requestStatus);
                nodeState.putShared("phoneRiskReason", parsedResponse.phoneRiskIndicator.riskReason);
                nodeState.putShared("phoneRiskReasonId", parsedResponse.phoneRiskIndicator.riskReasonId);
                nodeState.putShared("phoneRiskReasonDescription", parsedResponse.phoneRiskIndicator.riskReasonDescription);
                nodeState.putShared("phoneRiskBand", JSON.stringify(parsedResponse.phoneRiskIndicator.riskBand));
                nodeState.putShared("phoneFailureReason", parsedResponse.phoneRiskIndicator.phoneFailureReason);
            }

            //alternateEmailRiskIndicator
            logger.debug("inside alternateEmailRiskIndicator :: " + JSON.stringify(parsedResponse.alternateEmailRiskIndicator))
            if(parsedResponse.alternateEmailRiskIndicator && parsedResponse.alternateEmailRiskIndicator != null){
                logger.debug("inside alternateEmailRiskIndicator")
                var transformedDetails = transformRiskIndicatorDetailsMFA(parsedResponse.alternateEmailRiskIndicator.emailageRiskIndicator);
                logger.debug("alternateEmailRiskIndicator transformedDetails is :: " + JSON.stringify(transformedDetails))
                nodeState.putShared("alternateEmailRiskIndicator", JSON.stringify(transformedDetails));
                nodeState.putShared("alternateEmailRiskIndicatorForTransaction", transformedDetails);
                nodeState.putShared("alternateEmailTransactionIdLN", parsedResponse.alternateEmailRiskIndicator.transactionId);
                nodeState.putShared("alternateEmailRisk",parsedResponse.alternateEmailRiskIndicator.risk)
                nodeState.putShared("alternateEmailRequestStatus", parsedResponse.alternateEmailRiskIndicator.requestStatus);
                nodeState.putShared("alternateEmailRiskReason", parsedResponse.alternateEmailRiskIndicator.riskReason);
                nodeState.putShared("alternateEmailRiskReasonId", parsedResponse.alternateEmailRiskIndicator.riskReasonId);
                nodeState.putShared("alternateEmailRiskReasonDescription", parsedResponse.alternateEmailRiskIndicator.riskReasonDescription);
                nodeState.putShared("alternateEmailRiskBand", JSON.stringify(parsedResponse.alternateEmailRiskIndicator.riskBand));
                nodeState.putShared("alternateEmailFailureReason", parsedResponse.alternateEmailRiskIndicator.alternateEmailFailureReason);
            }


            if(parsedResponse.userAttributes && parsedResponse.userAttributes != null && Array.isArray(parsedResponse.userAttributes) && (parsedResponse.userAttributes && parsedResponse.userAttributes.length > 0)){
                nodeState.putShared("userAttributes", JSON.stringify(parsedResponse.userAttributes));
                nodeState.putShared("userAttributesForTransaction", parsedResponse.userAttributes);
            }

            if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "createaccount" && !nodeState.get("firsttimeloginjourneyskip")){
                nodeState.putShared("flowName","createaccount")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "createaccount" && nodeState.get("firsttimeloginjourneyskip") == "false"){
                nodeState.putShared("flowName","firsttimelogin")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "updateprofile"){
                nodeState.putShared("flowName","updateprofile")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "organdonor"){
                nodeState.putShared("flowName","organdonor")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "forgotpassword"){
                if(nodeState.get("ishelpdesk") == "true"){
                    nodeState.putShared("flowName","userverification")
                }else{
                    nodeState.putShared("flowName","forgotpassword")
                }
            }else if((nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "mfarecovery") || (nodeState.get("getTiles") && nodeState.get("getTiles") === "true")){
                nodeState.putShared("flowName","mfarecovery")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "mfarecovery"){
                nodeState.putShared("flowName","mfarecovery")
            }else if(nodeState.get("context") && nodeState.get("context").toLowerCase() === "appenroll"){
                nodeState.putShared("flowName","appenroll")
            }else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "forgotemail"){
                nodeState.putShared("flowName","forgotemail")
            }

           if((verifiedLexId != null) && (lexisNexisVerificationStatus.toLowerCase() === "fullyverified") ){
                nodeState.putShared("MCISync","true")
                nodeState.putShared("validationMessage",null)
                if(riskIndicator != null && riskIndicator.toLowerCase() === "high"){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "High Risk with Fully Verified Status");
                    //auditLog("RIDP001", "High Risk with Fully Verified Status detected", true);
                    action.goTo("fullyVerifiedHighRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "moderate")){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Moderate Risk with Fully Verified Status");
                    //auditLog("RIDP001", "Moderate Risk with Fully Verified Status detected", true);
                    action.goTo("fullyVerifiedModerateRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "low" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Low Risk with Fully Verified Status");
                    //auditLog("RIDP001", "Low Risk with Fully Verified Status detected", true);
                    action.goTo("fullyVerifiedLowRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "norisk" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "No Risk with Fully Verified Status");
                    //auditLog("RIDP001", "No Risk with Fully Verified Status detected", true);
                    action.goTo("fullyVerifiedNoRisk");
                }
            }else if((verifiedLexId != null) && (lexisNexisVerificationStatus.toLowerCase() === "partiallyverified") ){
                if(riskIndicator != null && riskIndicator.toLowerCase() === "high"){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "High Risk with Partially Verified Status");
                    //auditLog("RIDP001", "High Risk with Partially Verified Status detected", true);
                    action.goTo("partiallyVerifiedHighRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "moderate")){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Moderate Risk with Partially Verified Status");
                    //auditLog("RIDP001", "Moderate Risk with Partially Verified Status detected", true);
                    action.goTo("partiallyVerifiedModerateRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "low" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Low Risk with Partially Verified Status");
                    //auditLog("RIDP001", "Low Risk with Partially Verified Status detected", true);
                    action.goTo("partiallyVerifiedLowRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "norisk" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "No Risk with Partially Verified Status");
                    //auditLog("RIDP001", "No Risk with Partially Verified Status detected", true);
                    action.goTo("partiallyVerifiedNoRisk");
                }
            }else if(verifiedLexId == null || verifiedLexId == "" || (lexisNexisVerificationStatus.toLowerCase() === "notverified") ){
                if(riskIndicator != null && riskIndicator.toLowerCase() === "high"){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "High Risk with Not Verified Status");
                    //auditLog("RIDP001", "High Risk with Not Verified Status detected", true);
                    action.goTo("notVerifiedHighRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "moderate")){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Moderate Risk with Not Verified Status");
                    //auditLog("RIDP001", "Moderate Risk with Not Verified Status detected", true);
                    action.goTo("notVerifiedModerateRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "low" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Low Risk with Not Verified Status");
                    //auditLog("RIDP001", "Low Risk with Not Verified Status detected", true);
                    action.goTo("notVerifiedLowRisk");
                }else if(riskIndicator != null && (riskIndicator.toLowerCase() === "norisk" )){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "No Risk with Not Verified Status");
                    //auditLog("RIDP001", "No Risk with Not Verified Status detected", true);
                    action.goTo("notVerifiedNoRisk");
                }
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

function removeSSN(response){
    var attrs = response.userAttributes;
    
    for (var i = attrs.length - 1; i >= 0; i--) {
        if (attrs[i].attributeName === "SSN") {
            attrs.splice(i, 1); // remove this element
        }
    }

    return response
}



// function transformRiskIndicatorDetails(inputArray) {
//     logger.error("inputArray is :: " + JSON.stringify(inputArray))
//     var result = {
//         "riskIndicatorDetails": []
//     };

//     // Ensure we have a valid array to loop through
//     if (inputArray && inputArray.length > 0) {
//         for (var i = 0; i < inputArray.length; i++) {
//             var item = inputArray[i];
            
//             // Push the new mapped object
//             result.riskIndicatorDetails.push({
//                 "riskIndicatorCode": item.Code,
//                 "riskIndicatorDescription": item.Description
//             });
//         }
//     }
//     logger.error("inputArray is :: " + JSON.stringify(result))
//     return result;
// }

function transformRiskIndicatorDetails(inputArray) {
  var result = { "riskIndicatorDetails": [] };

  if (inputArray && inputArray.length) {
    for (var i = 0; i < inputArray.length; i++) {
      var item = inputArray[i] || {};

      var code = (item.Code != null) ? item.Code : item.riskIndicatorCode;
      var desc = (item.Description != null) ? item.Description : item.riskIndicatorDescription;

      // Only add if we actually have something
      if (code != null || desc != null) {
        result.riskIndicatorDetails.push({
          "riskIndicatorCode": String(code),
          "riskIndicatorDescription": String(desc)
        });
      }
    }
  }

  return result;
}

function transformRiskIndicatorDetailsMFA(inputArray) {
  var result = { "riskIndicator": [] };

  if (inputArray && inputArray.length) {
    for (var i = 0; i < inputArray.length; i++) {
      var item = inputArray[i] || {};

      var code = (item.Code != null) ? item.Code : item.riskIndicatorCode;
      var desc = (item.Description != null) ? item.Description : item.riskIndicatorDescription;

      // Only add if we actually have something
      if (code != null || desc != null) {
        result.riskIndicator.push({
          "riskIndicatorCode": String(code),
          "riskIndicatorDescription": String(desc)
        });
      }
    }
  }

  return result;
}

// Audit Log Function
function auditLog(code, message, helpdeskVisibility ) {
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}