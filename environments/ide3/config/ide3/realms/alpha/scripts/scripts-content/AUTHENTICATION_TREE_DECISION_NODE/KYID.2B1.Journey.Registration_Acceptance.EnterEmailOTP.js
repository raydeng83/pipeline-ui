var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var autoTesting = systemEnv.getProperty("esv.automation.testing").toLowerCase();
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enter Email OTP",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.EnterEmailOTP",
    errorId_InvalidOTP:"errorID::KYID008",
    errorId_BlankOTP:"errorID::KYID009",
    errorId_ExpiredOTP:"errorID::KYID010",
    InvalidOtpMaxLimit: 2,
    resendMaxLimit: 2,
    BlankOtpMaxLimit: 2,
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another",
    EXPIRED: "expired",
    RESEND: "Resend Code",
    FAILED: "false",
    EMPTY_OTP: "BlankOTP",
    MAX_LIMIT: "MaxLimit",
    ERROR:"error",
    BACK_LIMIT:"backLimit"
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


function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
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
                   || nodeState.get("journeyName") === "accountRecovery"
                   || nodeState.get("journeyNameReporting") === "SelfMFAManagement"
                   || nodeState.get("journeyNameReporting") === "StepUpApplicationLogin"
                   || nodeState.get("journeyName") === "ApplicationLogin"
                   || nodeState.get("journeyNameReporting") === "FirstTimeLoginJourney"
                   || nodeState.get("journeyNameReporting") === "loginPrerequisite"
                   || nodeState.get("journeyName") === "createAccount"
                   || nodeState.get("journeyNameReporting") === "RiskBased"){
                    eventDetails["action"] = "MFA Performed"
                }

                if(message === "OTP validation Failure"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

               if(nodeState.get("MFAMethodReporting") === "SECONDARY_EMAIL"){
                   eventDetails["mfatype"] = "Alternate Email OTP";
                   if(nodeState.get("resendSecondaryotpretryCountforReporting")){
                   var resendSecondaryotpretryCountforReporting = parseInt(nodeState.get("resendSecondaryotpretryCountforReporting")) - 1
                   eventDetails["NumberofResendCodes"] = resendSecondaryotpretryCountforReporting
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               } else {
                   eventDetails["mfatype"] = "Primary Email OTP";
                    if(nodeState.get("resendotpretryCountforReporting")){
                   var resendemailretryCount = parseInt(nodeState.get("resendotpretryCountforReporting")) - 1
                   eventDetails["NumberofResendCodes"] = resendemailretryCount
                   } else {
                       eventDetails["NumberofResendCodes"] = 0
                   }
               }
             
               if(message === "OTP validation Failure"){
                	eventDetails["MFAFailureReason"] = "Invalid OTP"
                } else if (message === "Error Occured"){                
                	eventDetails["MFAFailureReason"] = "Error Occured"                
                } else {               
                	eventDetails["MFAFailureReason"] = ""              
                }
    
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
                var userEmail = nodeState.get("mail") || "";
        logger.error("the email from nodestate KYID.2B1.Journey.Registration_Acceptance.EnterEmailOTP"+nodeState.get("mail"))
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
        logger.error("Failed to log OTP validation failure "+ error)
       // action.goTo(NodeOutcome.SUCCESS);
    }
    
}

// Function to get the OTP from node state
function getOTPFromNodeState() {
    try {
        return nodeState.get("oneTimePassword");
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving OTP from node state: " + error.message);
        return null;
    }
}

function getDisplayMessage(userEmail) {
    var lastLetter = userEmail.split("@")[0]
    lastLetter = lastLetter.slice(-1)
    var displayMessage = "<div class='page-element'>verification_code_sent_to_" + userEmail.bold() + "</div>"
    logger.error("debugpoint: displayMessage: " + displayMessage)
    return displayMessage
}

//function to invalidate all email otp after max re try
function invalidateEmailOtp(reason) {
    try {
        nodeState.putShared("oneTimePassword", null);
        nodeState.putShared("oneTimePasswordTimestamp", null);
        nodeLogger.error("::Invalidated Email OTP::");
    } catch (error) {
        nodeLogger.error(" Error invalidating Email OTP: " + error.message);
    }
}
// Function to handle callback requests
function requestCallbacks() {
    try {
        logger.debug("errorMessage = "+nodeState.get("errorMessage"));
        if (nodeState.get("errorMessage") != null) {
            logger.error("xiaohandebugpoint: building errorMessage callback");
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
            nodeState.putShared("errorMessage", null)
                      
            
        }
            else if (nodeState.get("errorMessage_userlockout") != null) {
                logger.error("display the userlockout error")
            //defect 211194 fix
            invalidateEmailOtp("userlockout");
            var errorMessage_userlockout = nodeState.get("errorMessage_userlockout");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_userlockout + `</div>`)
           
            nodeState.putShared("errorMessage_userlockout", null)
           
        }
        else if (nodeState.get("errorMessage_ExpiredOtp") != null) {
            //defect 209484 fix
            logger.error("xiaohandebugpoint: building expired OTP callback");
            var errorMessage_ExpiredOtp = nodeState.get("errorMessage_ExpiredOtp");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_ExpiredOtp + `</div>`)
           
            nodeState.putShared("errorMessage_ExpiredOtp", null)
           
        }
        else if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_BlankOTP + `</div>`)
            
            nodeState.putShared("errorMessage_BlankOTP", null)
            
        }

        else if (nodeState.get("resendcodeMessage") != null) {
            var resendcodeMessage = nodeState.get("resendcodeMessage");
            callbacksBuilder.textOutputCallback(1, resendcodeMessage)
           
            nodeState.putShared("resendcodeMessage", null)
        }
        /*if(nodeState.get("emailOTPFailed")!=null &&nodeState.get("emailOTPFailed")=="true"){
            nodeState.putShared("emailOTPFailed",null)
            callbacksBuilder.textOutputCallback(1, "OTP was not sent successfully. Please click on resend below to try again.")
        }*/
        logger.debug("maxlimiterror = "+nodeState.get("maxlimiterror"));
        if (nodeState.get("maxlimiterror") != null) {
            var maxlimiterror = nodeState.get("maxlimiterror");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + maxlimiterror + `</div>`)
           
            nodeState.putShared("maxlimiterror", null);
        }
        if(!(nodeState.get("IsJourneyForgotEmail") || nodeState.get("isForgotPasswordJourney"))){
            logger.debug("registration journey email header");
            callbacksBuilder.textOutputCallback(1, "1_verify_email");
        }
        else if(nodeState.get("isForgotPasswordJourney") == true || nodeState.get("isMasterLogin")){
            var jsonobj = {"pageHeader": "2_Verify Email"};
            logger.debug("jsonobj : "+jsonobj);
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        }
        
        callbacksBuilder.textOutputCallback(0, getDisplayMessage(userEmail))
        callbacksBuilder.textInputCallback("enter_code");
        
       // callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Use a different email"], 0);
        if(nodeState.get("forgotPassword")){
    callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Back"], 0);
} else {
    callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Use a different email"], 0);
}
        if (getFaqTopicId != null && nodeState.get("IsJourneyForgotEmail")== null) {
            callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
        }
        else if(getFaqTopicId != null){
            callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
        }
    

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error requesting callbacks: " + error.message);

    }
}


function isWithinExpiryTime(passwordTimestamp, passwordExpiryMinutes) {
    var passwordTimeStampLong = Number(passwordTimestamp);
    var passwordExpiry = passwordTimeStampLong + (passwordExpiryMinutes * 60);
    var currentTimeStampEpoch = Math.ceil((new Date()).getTime() / 1000);
    var withinExpiryTime = (passwordExpiry - currentTimeStampEpoch) > 0 ? true : false;
    return withinExpiryTime;
}



// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getTextInputCallbacks().get(0).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);


        var otpFromNodeState = getOTPFromNodeState();

        var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");
        var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 10);
        if (selectedOutcome === 2) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");

            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("maxlimiterror", null);
            nodeState.putShared("resendotpretryCount", null);
            nodeState.putShared("emptyotpretryCount", null);
            nodeState.putShared("incorrectotpretryCount", null);
            nodeState.putShared("differentMail", "true")
              if(nodeState.get("changeEmailCount")){
                    var changeEmailCount = nodeState.get("changeEmailCount")
                } else {
                    var changeEmailCount = 1;
                }

                logger.debug("changeEmailCount is :: " + changeEmailCount)
                if (changeEmailCount > retryLimit) {
                    nodeState.putShared("emailretrylimit","true")
                    action.goTo(NodeOutcome.BACK_LIMIT);
                } else {
                    changeEmailCount++
                    nodeState.putShared("changeEmailCount", changeEmailCount);
                   // nodeState.putShared("Back",true);
                    nodeState.putShared("Back","true");
                    nodeState.putShared("Alternate_Email_Verification","back")
                    //nodeState.putShared("collectedPrimaryEmail",null);
                    action.goTo(NodeOutcome.ANOTHER_FACTOR);
                }
            
        } else if (selectedOutcome === 1) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("anotherFactor", null);
            nodeState.putShared("differentMail", null)
            var resendotpretryCountforReporting = 1 //MFA reporting
            
            if (nodeState.get("resendotpretryCount")) {
                var resendotpretryCount = nodeState.get("resendotpretryCount")
            } else {
                var resendotpretryCount = 1;
            }

            if (resendotpretryCount > nodeConfig.resendMaxLimit) {
                nodeState.putShared("resendotpretryCount", null);
                action.goTo(NodeOutcome.MAX_LIMIT);
            } else {  
              if(nodeState.get("MFAMethodReporting") === "SECONDARY_EMAIL"){
                  if(nodeState.get("resendSecondaryotpretryCountforReporting")){
                      var resendSecondaryotpretryCountforReporting = nodeState.get("resendSecondaryotpretryCountforReporting")
                  } else{
                   var resendSecondaryotpretryCountforReporting = 1
                  }
                  if (resendSecondaryotpretryCountforReporting > nodeConfig.resendMaxLimit) {
                nodeState.putShared("resendSecondaryotpretryCountforReporting", 1);
                action.goTo(NodeOutcome.MAX_LIMIT);
               } else {
                  resendSecondaryotpretryCountforReporting = resendSecondaryotpretryCountforReporting + 1
                nodeState.putShared("resendSecondaryotpretryCountforReporting", resendSecondaryotpretryCountforReporting); //MFA reporting
                logger.error("the resendSecondaryotpretryCountforReporting nodeState in create account"+nodeState.get("resendSecondaryotpretryCountforReporting"))
                action.goTo(NodeOutcome.RESEND);    
               }
                
              } else {
                  resendotpretryCount++
                resendotpretryCountforReporting = resendotpretryCountforReporting + 1
                nodeState.putShared("resendotpretryCount", resendotpretryCount);
                nodeState.putShared("resendotpretryCountforReporting", resendotpretryCountforReporting); //MFA reporting
                logger.error("the resendotpretryCountforReporting nodeState in create account"+nodeState.get("resendotpretryCountforReporting"))
                action.goTo(NodeOutcome.RESEND);
              }
                
            }


        } else if (selectedOutcome === 0) {
            if(autoTesting === "true" && password === "000000"){
                    logger.debug("autoTesting = "+autoTesting+" OTP = "+ password);
                    nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+userEmail );
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("maxlimiterror", null);
                    nodeState.putShared("resendotpretryCount", null);
                    nodeState.putShared("emptyotpretryCount", null);
                    nodeState.putShared("incorrectotpretryCount", null);
                    nodeState.putShared("anotherFactor", null);
                    nodeState.putShared("Alternate_Email_Verification",null);
                    nodeState.putShared("Email_Verification_Status","success");
                    nodeState.putShared("differentMail", null)
                    //var auditLib = require("KYID.2B1.Library.AuditLogger")
                    // if(nodeState.get("userId")){
                    // userId = nodeState.get("userId");
                    // }
                    // else if(typeof existingSession != 'undefined'){
                    //  userId = existingSession.get("UserId")
                    // }else if(nodeState.get("_id")){
                    //  userId = nodeState.get("_id")
                    // }else {
                    //     userid = ""
                    // }
                    var userId = nodeState.get("userId") || (typeof existingSession !== 'undefined' && existingSession.get("UserId")) || nodeState.get("_id") || "";
        
                    var headerName = "X-Real-IP";
                    var headerValues = requestHeaders.get(headerName); 
                    var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
                    
                    var browser = requestHeaders.get("user-agent"); 
                    var os = requestHeaders.get("sec-ch-ua-platform"); 
                    
                    var eventDetails = {};
                    eventDetails["IP"] = ipAdress;
                    eventDetails["Browser"] = browser;
                    eventDetails["OS"] = os;
                    eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
                    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                    var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || nodeState.get("alternateEmail") || "";
                    
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
                //auditLib.auditLogger("VER003",sessionDetails,"Email OTP Validation", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                auditLog("VER003", "Email OTP Validation");
                action.goTo(NodeOutcome.VERIFY);
            }
            else{  
            if (!password || password == null) {
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is empty"+"::"+nodeConfig.errorId_BlankOTP );
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("errorMessage_ExpiredOtp", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("anotherFactor", null);
                var emptyotpretryCount = nodeState.get("emptyotpretryCount") || 1;
                if (emptyotpretryCount > nodeConfig.BlankOtpMaxLimit) {
                    nodeState.putShared("errorMessage_BlankOTP", null)
                   nodeState.putShared("emptyotpretryCount", null);

                    action.goTo(NodeOutcome.MAX_LIMIT);
                } else {
                    emptyotpretryCount++;
                    nodeState.putShared("emptyotpretryCount", emptyotpretryCount);
                    action.goTo(NodeOutcome.EMPTY_OTP);
                }
            } else {
                if (!isWithinExpiry) {
                    nodeState.putShared("anotherFactor", null);
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    //defect 209484 code grammar fix
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is expired"+"::"+nodeConfig.errorId_ExpiredOTP +"::"+userEmail );
                    action.goTo(NodeOutcome.EXPIRED);
                }
                else if (password && otpFromNodeState && otpFromNodeState === password) {

                    // nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                    nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+userEmail );
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("maxlimiterror", null);
                    nodeState.putShared("resendotpretryCount", null);
                    nodeState.putShared("emptyotpretryCount", null);
                    nodeState.putShared("incorrectotpretryCount", null);
                    nodeState.putShared("anotherFactor", null);
                    nodeState.putShared("Alternate_Email_Verification",null)
                    nodeState.putShared("Email_Verification_Status","success");
                    //var auditLib = require("KYID.2B1.Library.AuditLogger")
                    if(nodeState.get("userId")){
                    userId = nodeState.get("userId");
                    }
                    else if(typeof existingSession != 'undefined'){
                     userId = existingSession.get("UserId")
                    }else if(nodeState.get("_id")){
                     userId = nodeState.get("_id")
                    }else {
                        userid = ""
                    }
        
                    var headerName = "X-Real-IP";
                    var headerValues = requestHeaders.get(headerName); 
                    var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
                    
                    var browser = requestHeaders.get("user-agent"); 
                    var os = requestHeaders.get("sec-ch-ua-platform"); 
                    
                    var eventDetails = {};
                    eventDetails["IP"] = ipAdress;
                    eventDetails["Browser"] = browser;
                    eventDetails["OS"] = os;
                    eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
                    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                    var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || "";
                    
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
                    //auditLib.auditLogger("VER003",sessionDetails,"Email OTP Validation", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                    auditLog("VER003", "Email OTP Validation");
                    action.goTo(NodeOutcome.VERIFY);
                } else {
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is invalid"+"::"+nodeConfig.errorId_InvalidOTP +"::"+userEmail);
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("anotherFactor", null);
                    var incorrectotpretryCount = nodeState.get("incorrectotpretryCount") || 1;
                    if (incorrectotpretryCount > nodeConfig.InvalidOtpMaxLimit) {
                       //nodeState.putShared("resendotpretryCount", null);
                        auditLog("VER005", "OTP validation Failure");
                        nodeState.putShared("incorrectotpretryCount", null);
                        action.goTo(NodeOutcome.MAX_LIMIT);
                    } else {
                        incorrectotpretryCount++;
                        nodeState.putShared("incorrectotpretryCount", incorrectotpretryCount);
                        auditLog("VER005", "OTP validation Failure");
                        action.goTo(NodeOutcome.FAILED);
                    }
                }

            }
        }

        }
        else{
            action.goTo(NodeOutcome.ERROR);
        }
    } catch (error) {
        nodeState.putShared("anotherFactor", null);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error handling user responses: " + error.message);
        nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        nodeState.putShared("errorMessage", null)
        nodeState.putShared("resendcodeMessage", null)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"Error in handelUserResponse Function" +"::"+error);
        auditLog("VER005", "Error Occured");
        action.goTo(NodeOutcome.ERROR);
    }
}

// Main execution
try {
    var lib = require("KYID.Library.FAQPages");
    var process = "SelfRegistration";
    var pageHeader = "1_verify_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader, process);
    var addtionalEmailFlag = "false";
    var alternateEmail = null;
    var collectedPrimaryEmail = null;
    if (nodeState.get("addtionalEmailFlag") != null) {
        addtionalEmailFlag = nodeState.get("addtionalEmailFlag");
    }
    if (nodeState.get("alternateEmail") != null) {
        alternateEmail = nodeState.get("alternateEmail");
    }
    if (nodeState.get("collectedPrimaryEmail") != null) {
        collectedPrimaryEmail = nodeState.get("collectedPrimaryEmail")
    }
    if (addtionalEmailFlag == "true") {
        logger.error("xiaohan debugpoint: alteremail branch")
        var userEmail = alternateEmail;
    }
    else {

        if (collectedPrimaryEmail != null) {
            logger.error("xiaohan debugpoint: primary email branch 1")
            var userEmail = nodeState.get("collectedPrimaryEmail")
            logger.error("xiaohan debugpoint: primary email 1" + userEmail)
        }

        else {
            logger.error("xiaohan debugpoint: primary email branch 2")
            var userEmail = nodeState.get("mail")
            logger.error("xiaohan debugpoint: primary email 2" + userEmail)
        }
    }

    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"Error in main execution" +"::"+error);
    nodeState.putShared("errorMessage_BlankOTP", null)
    nodeState.putShared("errorMessage_ExpiredOtp", null)
    nodeState.putShared("errorMessage", null)
    nodeState.putShared("resendcodeMessage", null)
    action.goTo(NodeOutcome.ERROR);
}
