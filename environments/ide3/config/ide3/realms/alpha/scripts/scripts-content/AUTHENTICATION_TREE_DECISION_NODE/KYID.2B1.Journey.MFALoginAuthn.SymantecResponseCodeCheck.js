var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication SymantecResponsecodeCheck",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFALoginAuthn.SymantecResponseCodeCheck",
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
};


// function extractTagValue(xml, tagName) {
//     var tagPattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
//     var match = tagPattern.exec(xml);
//     return match ? match[1] : null;
// }

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
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error extracting tag value: " + error.message);
        return null;
    }
}

// Main execution
try {
    //Printing the response code and response body
    var responsecode = nodeState.get("responsecode");
    var responsebody = nodeState.get("responsebody");
    var CredID = nodeState.get("CredID");
    var OTP = nodeState.get("securityCode");
    var mail = nodeState.get("mail") || "";

    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode :: " + responsecode);
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsebody :: " + responsebody);
    // 2024/10/30 add loggers to print out credID and security code
//    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "CredID :: " + CredID);
//    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "securityCode :: " + OTP);
 
    if (responsecode === null || responsecode === undefined || responsebody === null || responsebody === undefined) {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode or Responsebody is null or undefined.");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid "+mail);
        action.goTo(NodeOutcome.FAILED);
    }
    
    //var otpFromNodeState = getOTPFromNodeState();
    
    logger.debug("Printing the reason code ::::::: " + extractTagValue(responsebody, "ReasonCode"))
    if (extractTagValue(responsebody, "ReasonCode") === "0000") {
         nodeLogger.debug("************* INSIDE 0000 Response Code ****************")
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is validated successfully"+mail);
           nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "OTP Validation completed successfully"+"::"+mail );
        nodeState.putShared("MFAMethod","SYMANTEC")
        
        var resendsymantecretryCount = 0
        if(nodeState.get("resendsymantecretryCount")){
               resendsymantecretryCount = nodeState.get("resendsymantecretryCount")
           } else {
               resendsymantecretryCount = 0
           }
        nodeState.putShared("resendsymantecretryCount",resendsymantecretryCount)
        auditLog("MFA_AUTH_SUCCESS", "Symantec OTP Validation Success - MFA Reporting")
        action.goTo(NodeOutcome.SUCCESS);
    }
    else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid "+mail);
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
} catch (e) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in the main execution of reason code check " + e));
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "An unexpected error occurred while performing "+mail);
    auditLog("MFA_AUTH_EXCEPTION", "Symantec OTP Exception Caught - MFA Reporting")
}

//MFAReporting
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
                  || nodeState.get("journeyNameReporting") === "StepUpApplicationLogin"
                  || nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney" 
                  || nodeState.get("journeyName") === "ApplicationLogin"
                  || nodeState.get("journeyNameReporting") === "RiskBased"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "Symantec OTP Validation Failed - MFA Reporting"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

             if(nodeState.get("resendsymantecretryCount")){
               eventDetails["NumberofResendCodes"] = nodeState.get("resendsymantecretryCount")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }

              if(message === "Symantec OTP Validation Failed - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Invalid OTP"
                } else if (message === "Symantec OTP Exception Caught - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Error Occured"
                } else {
                    eventDetails["MFAFailureReason"] = ""
                }
        
               var credID = nodeState.get("CredID") || "";
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
