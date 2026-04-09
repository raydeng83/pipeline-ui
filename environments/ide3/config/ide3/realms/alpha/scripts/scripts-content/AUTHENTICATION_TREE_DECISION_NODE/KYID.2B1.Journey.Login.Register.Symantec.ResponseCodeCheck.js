/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var mail = nodeState.get("mail");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Symantec ResponseCode Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.Symantec.ResponseCodeCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
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


function patchCredID() {
    try {
        var credID = nodeState.get("credId");
        var userId = nodeState.get("_id");

        // Check if credId and userId are null or undefined
        if (!credID) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: credId is null or undefined." + "::" + mail);
            return false;
        }

        if (!userId) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: userId is null or undefined." + "::" + mail);
            return false;
        }

        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cred ID inside the patchCredID :: " + nodeState.get("credId") + "::" + mail)
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID inside the patchCredID" + nodeState.get("_id"))
        //var userData = openidm.read("managed/alpha_user/" + userId);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "credID for the patch object  ***" + credID + "::" + mail);

        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails(existingSession, "UPDATE", nodeState)
        logger.debug("auditDetail " + auditData)
        var result = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "frIndexedString4", "value": credID },
        { operation: "replace", field: "/custom_updatedDateEpoch", value: auditData.updatedDateEpoch },
        { operation: "replace", field: "/custom_updatedByID", value: auditData.updatedByID },
        { operation: "replace", field: "/custom_updatedDateISO", value: auditData.updatedDate },
        { operation: "replace", field: "/custom_updatedBy", value: auditData.updatedBy }
        ]);
        if (result) {
            return true
        } else {
            logger.debug("PATCH FAILED");
            return false
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the patching cred ID function" + error + "::" + mail)
    }
}


function extractTagValue(xml, tagName) {
    try {
        var tagPattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
        var match = tagPattern.exec(xml);
        if (match && match[1]) {
            return match[1].trim();
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error extracting tag value: " + error.message + "::" + mail);
        return null;
    }
}


// Main execution
try {

    //Printing the response code and response body
    var responsecode = nodeState.get("responsecode");
    var responsebody = nodeState.get("responsebody");
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode :: " + responsecode + "::" + mail);
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsebody :: " + responsebody + "::" + mail);

    //var otpFromNodeState = getOTPFromNodeState();
    if (extractTagValue(responsebody, "ReasonCode") === "0000") {
        // if (patchCredID()) {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is validated successfully :: " + "::" + mail);

        //MFA Reporting
        var resendsymantecretryCount = 0
        if(nodeState.get("resendsymantecretryCount")){
               resendsymantecretryCount = nodeState.get("resendsymantecretryCount")
           } else {
               resendsymantecretryCount = 0
           }
        nodeState.putShared("resendsymantecretryCount",resendsymantecretryCount)
        
        auditLog("MFA_AUTH_SUCCESS", "Symantec OTP Validation Success - MFA Reporting")
        action.goTo(NodeOutcome.SUCCESS);
        // }
    } else {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid :: " + "::" + mail);
        nodeState.putShared("SymantecErrorMessage", "verification_failed");
        

        //MFA Reporting
        var resendsymantecretryCount = 0
        if(nodeState.get("resendsymantecretryCount")){
               resendsymantecretryCount = nodeState.get("resendsymantecretryCount")
               resendsymantecretryCount = resendsymantecretryCount + 1
           } else {
               resendsymantecretryCount = 1
           }
        nodeState.putShared("resendsymantecretryCount",resendsymantecretryCount)
        auditLog("MFA_AUTH_FAILED", "Symantec OTP Validation Failed - MFA Reporting")
        
        action.goTo(NodeOutcome.FAILED);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the main execution of reason code check " + error + "::" + mail)
    auditLog("MFA_AUTH_EXCEPTION", "Symantec OTP Exception Caught - MFA Reporting")
}

function auditLog(code, message){
    try{
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

               //MFAReporting
               // Retrieve journey purpose based on journey name
                var purpose = "";
            var journeyName = nodeState.get("journeyName");
            var alternateJourneyName = nodeState.get("journeyNameReporting");
            var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
            var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
            logger.error("the journey name in KYID.2B1.Journey.VerifyPrimaryEmailOTP:: "+nodeState.get("journeyName"))
            if (journeyName) {
                logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[journeyName])
               
                if (parsedjourneyPurposeMapping) {
                    if (parsedjourneyPurposeMapping.hasOwnProperty(journeyName)) {
                        logger.error("Journey Name: " + journeyName + ", Purpose: " + parsedjourneyPurposeMapping[journeyName]);
                        purpose = parsedjourneyPurposeMapping[journeyName];
                    } else {
                        logger.error("No purpose mapping found for Journey Name: " + journeyName);
                        if (alternateJourneyName && parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Trying alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        }
                        }
                    }
                } else if (alternateJourneyName) {
                    logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                    logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[alternateJourneyName])
                    if (parsedjourneyPurposeMapping) {
                        if (parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        } else {
                            logger.error("No purpose mapping found for Alternate Journey Name: " + alternateJourneyName);
                        }
                    }
                }
                    
                
                eventDetails["purpose"] = purpose || ""

                if(nodeState.get("journeyName") === "PasswordRecovery"
                  || nodeState.get("journeyName") === "BSPUserVerification"
                  || nodeState.get("journeyName") === "MyAccountUpdate"
                  || nodeState.get("journeyNameReporting") === "MFARecovery"
                  || nodeState.get("journeyNameReporting") === "SelfMFAManagement"
                  || nodeState.get("journeyNameReporting") === "loginPrerequisite"
                  || nodeState.get("journeyNameReporting") === "RiskBased"
                  || nodeState.get("journeyNameReporting") === "ApplicationEnrollment"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "Symantec OTP Validation Failed - MFA Reporting"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

                if(message === "Symantec OTP Validation Failed - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Invalid OTP"
                } else if (message === "Symantec OTP Exception Caught - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Error Occured"
                } else {
                    eventDetails["MFAFailureReason"] = ""
                }


                if(nodeState.get("resendsymantecretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsymantecretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }

               var credID = nodeState.get("credId") || "";
                if (credID.startsWith("SYMC")) {
                    eventDetails["mfatype"] = "Symantec Mobile Soft Token"
                } else if (credID.startsWith("VSS")) {
                    eventDetails["mfatype"] = "Symantec Desktop Soft Token"
                } else {
                    eventDetails["mfatype"] = "Symantec Hard Token"
                }


          var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

                if (userEmail){
              var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
              userId = userQueryResult.result[0]._id;
                }
              var requesterUserId = null;
               if (typeof existingSession != 'undefined') {
              requesterUserId = existingSession.get("UserId")
                }

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA Authentication success "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}