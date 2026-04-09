/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
nodeState.putShared("d9731e5e-dc2a-415c-9a28-712fd125f84d.retryCount",0)
nodeState.putShared("f978088e-3b21-4e84-bf72-5c9f335c2cc1.retryCount",0)//alt email verify
nodeState.putShared("2a8c5ae6-7bfc-49c5-a129-09a04f02299a.retryCount",0)
nodeState.putShared("75b75c76-5cd9-41f6-9f8d-65ac6b1787d8.retryCount",0)
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enter Email OTP",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.EnterEmailOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another",
    EXPIRED: "expired",
    RESEND: "Resend Code",
    FAILED: "false",
    EMPTY_OTP: "BlankOTP"
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
        // var boldoutput = userEmail[0] + "****" + lastLetter + "@" + userEmail.split("@")[1]
        // var displayMessage = "We sent an email to " + boldoutput.bold() + ". Enter the code below."
       // var displayMessage = "<div class='page-element'>We sent an email to " + userEmail.bold() + ". Enter the verification code sent in the email below.</div>"
        var displayMessage = "<div class='page-element'> verification_code_sent_to_" + userEmail.bold() + "</div>"

        
    }
    if (clocale === "es") {
        // var boldoutput = userEmail[0] + "****" + lastLetter + "@" + userEmail.split("@")[1]
        var displayMessage = "Le enviamos un correo electrónico a " + userEmail.bold() + ". Ingrese el código a continuación."
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
            
            callbacksBuilder.textOutputCallback(0, getDisplayMessage())
            callbacksBuilder.textInputCallback("enter_code");
           // callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Return to authenticator list"], 0);
             callbacksBuilder.confirmationCallback(0, ["Verify", "Resend code", "Back"], 0);

        }
        else if (clocale === "es") {
            if (nodeState.get("errorMessage")) {
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
            
            callbacksBuilder.textOutputCallback(0, getDisplayMessage())
            callbacksBuilder.textInputCallback("introduce el código");
            callbacksBuilder.confirmationCallback(0, ["Verificar", "Reenviar código", "Verificar con otra cosa"], 0);
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
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);


        var otpFromNodeState = getOTPFromNodeState();
       
        var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Retrieved OTP timestamp :: " + passwordTimeStamp);

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
            nodeState.remove("Secondary_Email")
            nodeState.putShared("28f253a1-9cb2-4276-aacd-b0c8949be6b1.retryCount",0)

            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
         
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
           if (!password || password == null) {
                nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the password null condition");
                nodeState.putShared("errorMessage", null)
               nodeState.putShared("errorMessage_ExpiredOtp", null)
               nodeState.putShared("resendcodeMessage", null)
                action.goTo(NodeOutcome.EMPTY_OTP);
            } else {
                if (!isWithinExpiry) {
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    action.goTo(NodeOutcome.EXPIRED);
                }
                else if (password && otpFromNodeState && otpFromNodeState === password) {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("MFAMethodEmail", "Secondary_mail");
                    var userEmail = nodeState.get("mail");

                    nodeState.putShared("email", userEmail);
                    nodeState.putShared("MFA_Additional","add_email")


                    action.goTo(NodeOutcome.VERIFY);
                } else {
                   
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    action.goTo(NodeOutcome.FAILED);
                }

    }
        } else if (!password) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Inside the password null condition ");
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.EMPTY_OTP);
        } else {
            
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error handling user responses: " + error.message);
        nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("errorMessage_ExpiredOtp", null)
        nodeState.putShared("errorMessage", null)
        nodeState.putShared("resendcodeMessage", null)
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
    action.goTo(NodeOutcome.FAILED);
}
