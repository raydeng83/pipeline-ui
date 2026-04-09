var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enter Email OTP",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.EnterEmailOTP",
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
    MAX_LIMIT: "MaxLimit"
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

// Function to get the OTP from node state
function getOTPFromNodeState() {
    try {
        return nodeState.get("oneTimePassword");
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving OTP from node state: " + error.message);
        return null;
    }
}

function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}


function getDisplayMessage() {
    var clocale = nodeState.get("clocale");
    if(nodeState.get("Secondary_Email")!=null)
    {
        var userEmail = nodeState.get("Secondary_Email")
    }else{
        
    var userEmail = nodeState.get("mail")}
    var lastLetter = userEmail.split("@")[0]
    lastLetter = lastLetter.slice(-1)
    if (clocale === "en") {
        var displayMessage = "<div class='page-element'>verification_code_sent_to_" + userEmail.bold() + "</div>"   
    }
    return displayMessage
}
// Function to handle callback requests
function requestCallbacks() {
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
        if (clocale === "en") {
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            if (nodeState.get("errorMessage_ExpiredOtp") != null) {
                var error =nodeState.get("errorMessage_ExpiredOtp");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
        }

            if (nodeState.get("resendcodeMessage") != null) {
                var resendcodeMessage = nodeState.get("resendcodeMessage");
                callbacksBuilder.textOutputCallback(1,resendcodeMessage)
            }

            if (nodeState.get("maxlimiterror") != null) {
                var maxlimiterror = nodeState.get("maxlimiterror");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+maxlimiterror+`</div>`)
            }
            
            callbacksBuilder.textOutputCallback(0, getDisplayMessage())
            callbacksBuilder.textInputCallback("enter_code");
            callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Use a different email "], 0);

        }
        else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Unsupported locale: " + clocale);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error requesting callbacks: " + error.message);

    }
}

/**
 * Checks if the provided timestamp is within the expiry time.
 * @param {number} passwordTimestamp - The timestamp of the password creation in seconds.
 * @param {number} passwordExpiryMinutes - The expiry time for the password in minutes.
 * @returns {boolean} - True if within expiry time, false otherwise.
 */

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
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);


        var otpFromNodeState = getOTPFromNodeState();
       
        var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Retrieved OTP timestamp :: " + passwordTimeStamp);

        var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 5);

        // if (!isWithinExpiry) {
        //     action.goTo(NodeOutcome.EXPIRED);
        // }

        if (selectedOutcome === 2) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");

            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            nodeState.putShared("maxlimiterror",null);
            nodeState.putShared("resendotpretryCount", null);
            nodeState.putShared("emptyotpretryCount", null);
            nodeState.putShared("incorrectotpretryCount", null);
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
         
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)


           // var resendotpretryCount = nodeState.get("resendotpretryCount") || 0;
                if(nodeState.get("resendotpretryCount")){
                    logger.error("line173");
                    var resendotpretryCount = nodeState.get("resendotpretryCount")
                } else {
                    logger.error("line176");
                    var resendotpretryCount = 1;
                }
            
                if (resendotpretryCount > 2) {
                    logger.error("line173");
                action.goTo(NodeOutcome.MAX_LIMIT);
                } else {
                    logger.error("line184");
                resendotpretryCount++
                    logger.error("line186");
                nodeState.putShared("resendotpretryCount", resendotpretryCount);
                    logger.error("line188");
                action.goTo(NodeOutcome.RESEND);
                }


        } else if (selectedOutcome === 0) {
           if (!password || password == null) {
                nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
                nodeState.putShared("errorMessage", null)
               nodeState.putShared("errorMessage_ExpiredOtp", null)
               nodeState.putShared("resendcodeMessage", null)
               var emptyotpretryCount = nodeState.get("emptyotpretryCount") || 1;
               if (emptyotpretryCount > 2) {
                   logger.error("line191 count"+emptyotpretryCount);
                   logger.error("line191");
                   //nodeState.putShared("errorMessage_BlankOTP","");
                   nodeState.putShared("errorMessage_BlankOTP", null)
                 action.goTo(NodeOutcome.MAX_LIMIT);
               } else {
                 emptyotpretryCount++;
                 nodeState.putShared("emptyotpretryCount", emptyotpretryCount);
                   logger.error("line196");
                 action.goTo(NodeOutcome.EMPTY_OTP);
               }
            } else {
                if (!isWithinExpiry) {
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    logger.error("line205");
                    action.goTo(NodeOutcome.EXPIRED);
                }
                else if (password && otpFromNodeState && otpFromNodeState === password) {
                    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("maxlimiterror",null);
                    nodeState.putShared("resendotpretryCount", null);
                    nodeState.putShared("emptyotpretryCount", null);
                    nodeState.putShared("incorrectotpretryCount", null);
                    logger.error("line214");
                    action.goTo(NodeOutcome.VERIFY);
                } else {
                   
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
                   // logger.error(transactionid+"The OTP entered by the user is invalid")

                    var incorrectotpretryCount = nodeState.get("incorrectotpretryCount") || 1;
                    if (incorrectotpretryCount > 2) {
                        logger.error("line227");
                    action.goTo(NodeOutcome.MAX_LIMIT);
                    } else {
                    incorrectotpretryCount++;
                    nodeState.putShared("incorrectotpretryCount", incorrectotpretryCount);
                    logger.error("line225 Count" +incorrectotpretryCount);
                    logger.error("line225");
                    action.goTo(NodeOutcome.FAILED);
                    }
                }

    }
        } else if (!password) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Inside the password null condition ");
            nodeState.putShared("resendcodeMessage", null)
            var emptyotpretryCount = nodeState.get("emptyotpretryCount") || 0;
            if (emptyotpretryCount > 2) {
                logger.error("line243");
            action.goTo(NodeOutcome.MAX_LIMIT);
            } else {
            emptyotpretryCount++;
            nodeState.putShared("emptyotpretryCount", emptyotpretryCount);
                logger.error("line248");
            action.goTo(NodeOutcome.EMPTY_OTP);
            }
        } else {
            
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            var incorrectotpretryCount = nodeState.get("incorrectotpretryCount") || 0;
                if (incorrectotpretryCount > 2) {
                    logger.error("line259");
                action.goTo(NodeOutcome.MAX_LIMIT);
                } else {
                incorrectotpretryCount++;
                nodeState.putShared("incorrectotpretryCount", incorrectotpretryCount);
                logger.error("line264");
                action.goTo(NodeOutcome.FAILED);;
                }
        }
    } catch (error) {
        
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error handling user responses: " + error.message);
        nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        nodeState.putShared("errorMessage", null)
        nodeState.putShared("resendcodeMessage", null)
        logger.error("line275");
        action.goTo(NodeOutcome.FAILED);
    }
}

// Main execution
try {
    var otpFromNodeState = getOTPFromNodeState();
   // logger.error("Printing the otp from node state ::::; " + otpFromNodeState);
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage_BlankOTP", null)
    nodeState.putShared("errorMessage_ExpiredOtp", null)
    nodeState.putShared("errorMessage", null)
    nodeState.putShared("resendcodeMessage", null)
    logger.error("line295");
    action.goTo(NodeOutcome.FAILED);
}
