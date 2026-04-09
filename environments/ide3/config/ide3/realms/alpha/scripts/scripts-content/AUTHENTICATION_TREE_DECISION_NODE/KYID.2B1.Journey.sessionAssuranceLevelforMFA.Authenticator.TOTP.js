logger.debug("**********start sessionAssuranceLevelforMFA****************")
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication sessionAssuranceLevelforMFA Authenticator",
    script: "Script",
    scriptName: "KYID.2B1.Journey.sessionAssuranceLevelforMFA.Authenticator",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
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
    }
};

// action.goTo(NodeOutcome.SUCCESS).putSessionProperty('sessionAssuranceLevelforMFA', "5");
// logger.debug("**********end sessionAssuranceLevelforMFA****************")

if(nodeState.get("isMasterLogin") === "true"){
        nodeState.putShared("MFAMethod","TOTP")
       auditLog("MFA_AUTH_SUCCESS", "TOTP Validation Success - MFA Reporting")
       logger.debug("**********end sessionAssuranceLevelforMFA****************")
        action.goTo(NodeOutcome.SUCCESS).putSessionProperty('sessionAssuranceLevelforMFA', "5");
         } else {
            auditLog("MFA_AUTH_SUCCESS", "TOTP Validation Success - MFA Reporting")
            action.goTo(NodeOutcome.SUCCESS)
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
               //eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""    

               //MFAReporting
               // Retrieve journey purpose based on journey name
               var purpose = "";
            var journeyName = nodeState.get("journeyName");
            var alternateJourneyName = nodeState.get("journeyNameReporting");
            var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
            var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
            logger.error("the journey name in KYID.2B1.Journey.sessionAssuranceLevelforMFA.Authenticator.TOTP:: "+nodeState.get("journeyName"))
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
                  || nodeState.get("journeyNameReporting") === "StepUpApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney"
                   || nodeState.get("journeyNameReporting") === "RiskBased"
                   || nodeState.get("journeyName") === "ApplicationLogin"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "TOTP Validation Failed - MFA Reporting"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

               if(nodeState.get("retryTOTPAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get("retryTOTPAttempt")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }

                var nextStep = nodeState.get("nextStep") || nodeState.get("optedMFAMethod") || "";
                logger.error("nextstep value in KYID.2B1.Journey.sessionAssuranceLevelforMFA.Authenticator.TOTP => "+nextStep)
                var mfaType = "";
                if (nextStep === "googleTOTP" || nextStep.toUpperCase() == "GOOGLE") {
                    mfaType = "Google TOTP";
                } else if (nextStep === "microsoftTOTP" || nextStep.toUpperCase() == "MICROSOFT") {
                    mfaType = "Microsoft TOTP";
                } else if (nextStep === "forgerock" || nextStep.toUpperCase() == "DEVICE") {
                    mfaType = "ForgeRock TOTP";
                }
                eventDetails["mfatype"] = mfaType;

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