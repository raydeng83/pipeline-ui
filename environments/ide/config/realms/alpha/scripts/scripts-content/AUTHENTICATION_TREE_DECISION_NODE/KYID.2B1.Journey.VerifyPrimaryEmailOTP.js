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
    RESENDPRIMARY: "Resend Code Primary Email",
    SENDALTERNATE: "Send Alternate OTP",
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
    var displayMessage = "<div class='page-element'>A six-digit verification code was sent to the following:" + userEmail.bold() + "</div>"

    return displayMessage
}

//function to invalidate all email otp after max re try
function invalidateEmailOtp(reason) {
    try {
        nodeState.putShared("oneTimePassword", null);
        nodeState.putShared("oneTimePasswordTimestamp", null);
        nodeState.putShared("primaryemailhotp", null);
        nodeState.putShared("alternatemailhotp", null);
        nodeState.putShared("primaryotptimestamp", null);
        nodeLogger.error("::Invalidated Email OTP::");
    } catch (error) {
        nodeLogger.error(" Error invalidating Email OTP: " + error.message);
    }
}

// Function to handle callback requests
function requestCallbacks() {
    try {
        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
            nodeState.putShared("errorMessage", null)
        }
        if (nodeState.get("errorMessage_userlockout") != null) {
                logger.error("display the userlockout error")
            //defect 211194 fix
            invalidateEmailOtp("userlockout");
            var errorMessage_userlockout = nodeState.get("errorMessage_userlockout");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_userlockout + `</div>`)
           
            nodeState.putShared("errorMessage_userlockout", null)
           
        }
        if (nodeState.get("errorMessage_ExpiredOtp") != null) {
            var error = nodeState.get("errorMessage_ExpiredOtp");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
        }
        if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_BlankOTP + `</div>`)
            nodeState.putShared("errorMessage_BlankOTP", null)
        }

        if (nodeState.get("resendcodeMessage") != null) {
            var resendcodeMessage = nodeState.get("resendcodeMessage");
            callbacksBuilder.textOutputCallback(1,resendcodeMessage)
            nodeState.putShared("resendcodeMessage", null)
        }

        if (nodeState.get("maxlimiterror") != null) {
            var maxlimiterror = nodeState.get("maxlimiterror");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + maxlimiterror + `</div>`)
            nodeState.putShared("maxlimiterror", null)
        }
        if(nodeState.get("isForgotPasswordJourney") == true || nodeState.get("journeyName")=="MFARecovery"  || nodeState.get("journeyName")=="RIDP_LoginMain" || nodeState.get("helpdeskjourney") === "true"){
            var jsonobj = {"pageHeader": "2_Verify Email"};
            logger.debug("jsonobj : "+jsonobj);
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
            callbacksBuilder.textOutputCallback(0, "A six-digit verification code was sent to the following:");
            callbacksBuilder.textOutputCallback(0, "Primary email: "+primaryEmail);
            callbacksBuilder.textOutputCallback(0, "Enter the verification code provided to verify user.");
            callbacksBuilder.textOutputCallback(0, "Enter verification code for primary email: "+primaryEmail);
            callbacksBuilder.textInputCallback("enter_code");
                      
        }
        
        callbacksBuilder.confirmationCallback(0, ["Verify","Primary Resend code","Back"], 0);

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
        var otpcallbacks = callbacks.getTextInputCallbacks();
        logger.debug("otp callbacks : "+otpcallbacks);
        var primaryotp = callbacks.getTextInputCallbacks().get(0).trim();
        
        //var password = callbacks.getTextInputCallbacks().get(0).trim();

        var confirmationOutcome = callbacks.getConfirmationCallbacks().get(0);
        logger.debug("confirmationOutcome : "+confirmationOutcome);

      
        var otpFromNodeState = getOTPFromNodeState();
        var nodeStatePrimaryOtp = nodeState.get("primaryemailhotp");
        logger.debug("nodeStatePrimaryOtp : "+nodeStatePrimaryOtp);
        var nodeStateAlternateOtp = nodeState.get("alternatemailhotp");
        

        var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");
        var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 10);

        var primaryotp_timestamp = nodeState.get("primaryotptimestamp");
        logger.debug("primaryotp_timestamp : "+primaryotp_timestamp)

        logger.debug("changeEmailCount from : "+nodeState.get("alternatemail"));

        logger.debug("changeEmailCount from nodestate1: "+nodeState.get("changeEmailCount"));
        //select back option
        if (confirmationOutcome === 2) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");

            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("maxlimiterror", null);
            nodeState.putShared("resendotpretryCount", null);
            nodeState.putShared("emptyotpretryCount", null);
            nodeState.putShared("incorrectotpretryCount", null);
              if(nodeState.get("changeEmailCount")){
                    var changeEmailCount = nodeState.get("changeEmailCount")
                  logger.debug("changeEmailCount from nodestate: "+changeEmailCount);
                } else {
                    var changeEmailCount = 1;
                }
            
                if (changeEmailCount > retryLimit) {
                    nodeState.putShared("emailretrylimit","true")
    
                    action.goTo(NodeOutcome.BACK_LIMIT);
                    
                } else {
                    changeEmailCount++
                    nodeState.putShared("changeEmailCount", changeEmailCount);
                    nodeState.putShared("Back",true);
                    nodeState.putShared("primaryEmailComplete", null);
                    action.goTo(NodeOutcome.ANOTHER_FACTOR);
                }
            
        } else if(confirmationOutcome === 1){
            logger.debug("inside resendOutcome2");
             nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend Primary OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("anotherFactor", null);

             logger.debug("resendprimaryotpretryCount in enter otp: "+nodeState.get("resendprimaryotpretryCount"));
            logger.debug("resendotpretryCount in primary otp: "+nodeState.get("emptyotpretryCount"));
            logger.debug("resendotpretryCount in primary otp: "+nodeState.get("incorrectotpretryCount"));
            if (nodeState.get("resendprimaryotpretryCount")) {
                var resendprimaryotpretryCount = nodeState.get("resendprimaryotpretryCount")
                logger.debug("resendotpretryCount in primary otp: "+nodeState.get("resendotpretryCount"));
            } else {
                var resendprimaryotpretryCount = 1;
            }
            if (resendprimaryotpretryCount > nodeConfig.resendMaxLimit) {
                nodeState.putShared("resendprimaryotpretryCount", null);
                action.goTo(NodeOutcome.MAX_LIMIT);
            } else {
                resendprimaryotpretryCount++
                nodeState.putShared("resendprimaryotpretryCount", resendprimaryotpretryCount);
            
            nodeState.putShared("resend_primary_mail",true);
            nodeState.putShared("primaryEmailComplete", null);
            action.goTo(NodeOutcome.RESENDPRIMARY);
            }
            
        } else if (confirmationOutcome === 0) {
            logger.debug("confirmationOutcome 0");
            if(autoTesting === "true" && primaryotp === "000000"){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+primaryEmail );
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("maxlimiterror", null);
                    nodeState.putShared("resendotpretryCount", null);
                    nodeState.putShared("emptyotpretryCount", null);
                    nodeState.putShared("incorrectotpretryCount", null);
                    nodeState.putShared("anotherFactor", null);
                    action.goTo(NodeOutcome.VERIFY);
            }
            else{  
                logger.debug("auto testing false");
        if (!primaryotp || primaryotp === null) {
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
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is expired"+"::"+nodeConfig.errorId_ExpiredOTP +"::"+primaryEmail );
                    action.goTo(NodeOutcome.EXPIRED);
                }else if (nodeStatePrimaryOtp === primaryotp) {
                    logger.debug("inside valid otp");
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+primaryEmail );
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("maxlimiterror", null);
                    nodeState.putShared("resendotpretryCount", null);
                    nodeState.putShared("emptyotpretryCount", null);
                    nodeState.putShared("incorrectotpretryCount", null);
                    nodeState.putShared("anotherFactor", null);
                    nodeState.putShared("primaryEmailComplete", true);
                    action.goTo(NodeOutcome.SENDALTERNATE);
                }else {
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is invalid"+"::"+nodeConfig.errorId_InvalidOTP +"::"+primaryEmail);
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("anotherFactor", null);
                    var incorrectotpretryCount = nodeState.get("incorrectotpretryCount") || 1;
                    if (incorrectotpretryCount > nodeConfig.InvalidOtpMaxLimit) {
                         nodeState.putShared("incorrectotpretryCount", null);
                        nodeState.putShared("resendprimaryotpretryCount", null); 
                        action.goTo(NodeOutcome.MAX_LIMIT);
                    } else {
                        incorrectotpretryCount++;
                        nodeState.putShared("incorrectotpretryCount", incorrectotpretryCount);
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
        action.goTo(NodeOutcome.ERROR);
    }
}

// Main execution
try {
        
    var primaryEmail = nodeState.get("mail");
    logger.debug("primaryEmail from enter otp : "+primaryEmail);
    var secondaryEmail = nodeState.get("alternatemail");
   logger.debug("secondaryEmail email from enter otp : "+secondaryEmail);
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
