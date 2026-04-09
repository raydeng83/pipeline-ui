var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var mail = nodeState.get("mail");

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "KYID.2B1.Journey.Login.Register.PUSH.RejectMessager",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Login.Register.PUSH.RejectMessage",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      ERROR: "invalidEmail",
      MAX_LIMIT:"max limit"
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
     if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
     

  } catch (error) {
      action.goTo("error")
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message +"::"+mail);
      
  }

// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    var jsonobj = {"pageHeader": "Select your Choice!"};

    callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
    try {
        errMsg["code"] = "ERR-2FA-FRP-001";
        errMsg["message"] = libError.readErrorMessage("ERR-2FA-FRP-001"); 
        // nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
            
        callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
        callbacksBuilder.confirmationCallback(0, ["resend_PUSH", "Back"], 1);
    
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message+"::"+mail );
    }
    
}



function handleUserResponses() {
try {
    var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    if(selectedOutcome === 0){
        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForegRock Push notification is regenerated successfully"+"::"+ mail);
        auditLog("MFA_AUTH_FAILED", "PUSH Validation Failed - MFA Reporting")
        action.goTo("resendPush");
    }
    else if(selectedOutcome === 1 ){
        nodeState.putShared("BackFromTOTP","true")
        nodeState.putShared("BackPUSH","true")     
        action.goTo("back");
    }
} catch (error) {
   nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error handleUserResponses Function" +error.message +"::"+mail);
    
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
                   || nodeState.get("journeyNameReporting") === "StepUpApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney"
                   || nodeState.get("journeyName") === "ApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "loginPrerequisite"
                   || nodeState.get("journeyNameReporting") === "ApplicationEnrollment"
                   || nodeState.get("journeyNameReporting") === "SelfMFAManagement"
                   || nodeState.get("journeyNameReporting") === "RiskBased"
                   || nodeState.get("journeyNameReporting") === "MFARecovery"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "PUSH Validation Failed - MFA Reporting"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

                eventDetails["mfatype"] = "Forgerock Push";

                 if(nodeState.get("retryPUSHAttempt")){
               eventDetails["NumberofResendCodes"] = nodeState.get("retryPUSHAttempt")
               } else {
                   eventDetails["NumberofResendCodes"] = 0
               }

              if(message === "PUSH Validation Failed - MFA Reporting"){
                    eventDetails["MFAFailureReason"] = "Push Notification Expired"
                } else {
                    eventDetails["MFAFailureReason"] = ""
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