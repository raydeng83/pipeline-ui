var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var lib = require("KYID.Library.FAQPages");
var process ="MasterLogin";
var pageHeader= "2_Verify_TOTP";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

if(callbacks.isEmpty()){
    var jsonobj = {"pageHeader": "2_Verify TOTP"};

    callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    logger.error("the invalidtotp KYID.2B1.Journey.Login.Register.SelectNavigateOptionTOTPVerify"+nodeState.get("invalidtotp"))
    if(nodeState.get("invalidtotp")){
    errMsg["code"] = "ERR-2FA-TVF-000";
    errMsg["message"] = libError.readErrorMessage("ERR-2FA-TVF-000"); 
    logger.debug("Entered Authenticator TOTP is invalid");   
    auditLog("MFA_AUTH_FAILED", "TOTP Validation Failed - MFA Reporting")
    callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
		}
    callbacksBuilder.confirmationCallback(0, ["Submit","Back"], 0);
    if (getFaqTopicId != null) {callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"") }
}
else{
    var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
    if(selectedOutcome==1){
        nodeState.putShared("TOTPVerifyNode","back")
        logger.debug("TOTP Selected Back Button");
        nodeState.putShared("invalidtotp",null)
        action.goTo("true")
    }
    else{
        nodeState.putShared("TOTPVerifyNode","next")
        nodeState.putShared("invalidtotp",null)
        logger.debug("TOTP Selected Next Button");
        action.goTo("true")
    }
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
                   || nodeState.get("journeyNameReporting") === "StepUpApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney"
                   || nodeState.get("journeyName") === "ApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "RiskBased"
                   || nodeState.get("journeyNameReporting") === "SelfMFAManagement"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "TOTP Validation Failed - MFA Reporting"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }



               if(nodeState.get("journeyNameReporting") === "SelfMFAManagement"
                  || nodeState.get("journeyNameReporting") === "loginPrerequisite" 
                  || nodeState.get("journeyNameReporting") === "ApplicationEnrollment" 
                  || nodeState.get("journeyNameReporting") === "RiskBased"
                  || nodeState.get("journeyNameReporting") === "MFARecovery"){
                    if(nodeState.get("retryTOTPAttemptReporting")){
                       eventDetails["NumberofResendCodes"] = nodeState.get("retryTOTPAttemptReporting")
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               } else {
                    if(nodeState.get("retryTOTPAttempt")){
                       eventDetails["NumberofResendCodes"] = nodeState.get("retryTOTPAttempt")
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               }
              

               
               if(message === "TOTP Validation Failed - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Invalid TOTP"
                } else {
                    eventDetails["MFAFailureReason"] = "" //empty as this is successful case
                }

                var nextStep = nodeState.get("nextStep") || nodeState.get("optedMFAMethod") || nodeState.get("TOTPType") || "";
                logger.error("nextstep value in KYID.2B1.Journey.Login.Register.SelectNavigateOptionTOTPVerify => "+nextStep)
                var mfaType = "";
                if (nextStep === "googleTOTP" || nextStep.toUpperCase() == "GOOGLE" || nextStep.toLowerCase() == "gtotp") {
                    mfaType = "Google TOTP";
                } else if (nextStep === "microsoftTOTP" || nextStep.toUpperCase() == "MICROSOFT" || nextStep.toLowerCase() == "mstotp") {
                    mfaType = "Microsoft TOTP";
                } else if (nextStep === "forgerock" || nextStep.toUpperCase() == "DEVICE" || nextStep.toLowerCase() == "frtotp" ) {
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