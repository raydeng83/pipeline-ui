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
    ERROR:"error"
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


// Function to handle callback requests
function requestCallbacks() {
    try {
        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
        }
        if (nodeState.get("errorMessage_ExpiredOtp") != null) {
            var error = nodeState.get("errorMessage_ExpiredOtp");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
        }
        if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_BlankOTP + `</div>`)
        }

        if (nodeState.get("resendcodeMessage") != null) {
            var resendcodeMessage = nodeState.get("resendcodeMessage");
            callbacksBuilder.textOutputCallback(1, resendcodeMessage)
        }

        if (nodeState.get("maxlimiterror") != null) {
            var maxlimiterror = nodeState.get("maxlimiterror");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + maxlimiterror + `</div>`)
        }

        var displayMessage = "Enter_the_six-digit_code_sent_on_your_primary_email"
        callbacksBuilder.textOutputCallback(0, displayMessage)
        callbacksBuilder.textInputCallback("Enter_the_6_digit_code_sent_to_your_primarry_email*");
        callbacksBuilder.confirmationCallback(0, ["Verify", "Resend_Code", "Back"], 0);


        // if (getFaqTopicId != null) {
        //     callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
        // }


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
        var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 15);

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
              
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
            
        } else if (selectedOutcome === 1) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_ExpiredOtp", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("anotherFactor", null);
            action.goTo(NodeOutcome.RESEND);

        } else if (selectedOutcome === 0) {
            if(autoTesting === "true" && password === "000000"){
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
                  action.goTo(NodeOutcome.VERIFY);
            }
            else{  
            if (!password || password == null) {
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is empty"+"::"+nodeConfig.errorId_BlankOTP );
                nodeState.putShared("errorMessage", null)
                nodeState.putShared("errorMessage_ExpiredOtp", null)
                nodeState.putShared("resendcodeMessage", null)
                nodeState.putShared("anotherFactor", null);
                action.goTo(NodeOutcome.EMPTY_OTP);
            } else {
                if (!isWithinExpiry) {
                    nodeState.putShared("anotherFactor", null);
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is expired"+"::"+nodeConfig.errorId_ExpiredOTP +"::"+userEmail );
                    action.goTo(NodeOutcome.EXPIRED);
                }
                else if (password && otpFromNodeState && otpFromNodeState === password) {

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
                    action.goTo(NodeOutcome.VERIFY);
                } else {
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is invalid"+"::"+nodeConfig.errorId_InvalidOTP +"::"+userEmail);
                    nodeState.putShared("errorMessage", null)
                    nodeState.putShared("errorMessage_ExpiredOtp", null)
                    nodeState.putShared("errorMessage_BlankOTP", null)
                    nodeState.putShared("resendcodeMessage", null)
                    nodeState.putShared("anotherFactor", null);
                    action.goTo(NodeOutcome.FAILED);
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
    var userEmail = nodeState.get("mail")
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

// var dateTime = new Date().toISOString();
// var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// var autoTesting = systemEnv.getProperty("esv.automation.testing").toLowerCase();
// var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "Enter Email OTP",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.LoginAuthn.EnterEmailOTP",
//     errorId_InvalidOTP:"errorID::KYID008",
//     errorId_BlankOTP:"errorID::KYID009",
//     errorId_ExpiredOTP:"errorID::KYID010",
//     InvalidOtpMaxLimit: 2,
//     resendMaxLimit: 2,
//     BlankOtpMaxLimit: 2,
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     VERIFY: "Verify",
//     ANOTHER_FACTOR: "back",
//     EXPIRED: "expired",
//     RESEND: "Resend Code",
//     FAILED: "false",
//     EMPTY_OTP: "BlankOTP",
//     MAX_LIMIT: "MaxLimit",
//     ERROR:"error",
//     BACK_LIMIT:"backLimit"
// };

// /**
//    * Logging function
//    * @type {Function}
//    */
// var nodeLogger = {
//     // Logs detailed debug messages for troubleshooting  
//     debug: function (message) {
//         logger.debug(message);
//     },
//     // Logs Error that can impact Application functionality
//     error: function (message) {
//     },
//     info: function (message) {
//         logger.info(message);
//     }
// };

// // Function to get the OTP from node state
// function getOTPFromNodeState() {
//     try {
//         return nodeState.get("oneTimePassword");
//     } catch (error) {
//         return null;
//     }
// }

// // function getDisplayMessage(userEmail) {
// //     var lastLetter = userEmail.split("@")[0]
// //     lastLetter = lastLetter.slice(-1)
// //     //var displayMessage = "<div class='page-element'>verification_code_sent_to_" + userEmail.bold() + "</div>"
// //     var displayMessage = "Enter_the_six-digit_code_sent_on_your_primary_email"
// //     return displayMessage
// // }

// // Function to handle callback requests
// function requestCallbacks() {
//     try {
//         if (nodeState.get("errorMessage") != null) {
//             var error = nodeState.get("errorMessage");
//             callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
//         }
//         if (nodeState.get("errorMessage_ExpiredOtp") != null) {
//             var error = nodeState.get("errorMessage_ExpiredOtp");
//             callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
//         }
//         if (nodeState.get("errorMessage_BlankOTP") != null) {
//             var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
//             callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_BlankOTP + `</div>`)
//         }

//         if (nodeState.get("resendcodeMessage") != null) {
//             var resendcodeMessage = nodeState.get("resendcodeMessage");
//             callbacksBuilder.textOutputCallback(1, resendcodeMessage)
//         }

//         if (nodeState.get("maxlimiterror") != null) {
//             var maxlimiterror = nodeState.get("maxlimiterror");
//             callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + maxlimiterror + `</div>`)
//         }
//          var displayMessage = "Enter_the_six-digit_code_sent_on_your_primary_email"
//         callbacksBuilder.textOutputCallback(0, displayMessage)
//         callbacksBuilder.textInputCallback("Enter_the_6_digit_code_sent_to_your_primarry_email*");
//         callbacksBuilder.confirmationCallback(0, ["Verify", "Resend_Code", "Back"], 0);
//         if (getFaqTopicId != null) {
//             callbacksBuilder.textOutputCallback(0, getFaqTopicId + "");
//         }


//     } catch (error) {

//     }
// }


// function isWithinExpiryTime(passwordTimestamp, passwordExpiryMinutes) {
//     var passwordTimeStampLong = Number(passwordTimestamp);
//     var passwordExpiry = passwordTimeStampLong + (passwordExpiryMinutes * 60);
//     var currentTimeStampEpoch = Math.ceil((new Date()).getTime() / 1000);
//     var withinExpiryTime = (passwordExpiry - currentTimeStampEpoch) > 0 ? true : false;
//     return withinExpiryTime;
// }



// // Function to handle user responses
// function handleUserResponses() {
//     try {
//         var password = callbacks.getTextInputCallbacks().get(0).trim();
//         var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

//         nodeState.putShared("selectedOutcome", selectedOutcome);
//         nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);


//         var otpFromNodeState = getOTPFromNodeState();

//         var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");
//         var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 15);

//         if (selectedOutcome === 2) {
//             nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");

//             nodeState.putShared("errorMessage", null)
//             nodeState.putShared("errorMessage_ExpiredOtp", null)
//             nodeState.putShared("errorMessage_BlankOTP", null)
//             nodeState.putShared("resendcodeMessage", null)
//             nodeState.putShared("maxlimiterror", null);
//             nodeState.putShared("resendotpretryCount", null);
//             nodeState.putShared("emptyotpretryCount", null);
//             nodeState.putShared("incorrectotpretryCount", null);
              
//                     action.goTo(NodeOutcome.ANOTHER_FACTOR);
                
            
//         } else if (selectedOutcome === 1) {
//             nodeState.putShared("errorMessage", null)
//             nodeState.putShared("errorMessage_ExpiredOtp", null)
//             nodeState.putShared("errorMessage_BlankOTP", null)
//             nodeState.putShared("anotherFactor", null);


//             action.goTo(NodeOutcome.RESEND);
//             }


//         else if (selectedOutcome === 0) {
//             if(autoTesting === "true" && password === "000000"){
//                     nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+userEmail );
//                     nodeState.putShared("errorMessage", null)
//                     nodeState.putShared("errorMessage_ExpiredOtp", null)
//                     nodeState.putShared("errorMessage_BlankOTP", null)
//                     nodeState.putShared("resendcodeMessage", null)
//                     nodeState.putShared("maxlimiterror", null);
//                     nodeState.putShared("resendotpretryCount", null);
//                     nodeState.putShared("emptyotpretryCount", null);
//                     nodeState.putShared("incorrectotpretryCount", null);
//                     nodeState.putShared("anotherFactor", null);
//                   action.goTo(NodeOutcome.VERIFY);
//             }
//             else{  
//             if (!password || password == null) {
//                 nodeState.putShared("errorMessage", null)
//                 nodeState.putShared("errorMessage_ExpiredOtp", null)
//                 nodeState.putShared("resendcodeMessage", null)
//                 nodeState.putShared("anotherFactor", null);

//                     action.goTo(NodeOutcome.EMPTY_OTP);
//                 }
//             else {
//                 if (!isWithinExpiry) {
//                     nodeState.putShared("anotherFactor", null);
//                     nodeState.putShared("errorMessage", null)
//                     nodeState.putShared("errorMessage_ExpiredOtp", null)
//                     nodeState.putShared("errorMessage_BlankOTP", null)
//                     nodeState.putShared("resendcodeMessage", null)
//                     action.goTo(NodeOutcome.EXPIRED);
//                 }
//                 else if (password && otpFromNodeState && otpFromNodeState === password) {

//                     nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Email OTP Validation completed successfully for"+"::"+userEmail );
//                     nodeState.putShared("errorMessage", null)
//                     nodeState.putShared("errorMessage_ExpiredOtp", null)
//                     nodeState.putShared("errorMessage_BlankOTP", null)
//                     nodeState.putShared("resendcodeMessage", null)
//                     nodeState.putShared("maxlimiterror", null);
//                     nodeState.putShared("resendotpretryCount", null);
//                     nodeState.putShared("emptyotpretryCount", null);
//                     nodeState.putShared("incorrectotpretryCount", null);
//                     nodeState.putShared("anotherFactor", null);
//                     action.goTo(NodeOutcome.VERIFY);
//                 } else {
//                     nodeState.putShared("errorMessage", null)
//                     nodeState.putShared("errorMessage_ExpiredOtp", null)
//                     nodeState.putShared("errorMessage_BlankOTP", null)
//                     nodeState.putShared("resendcodeMessage", null)
//                     nodeState.putShared("anotherFactor", null);
//                     var incorrectotpretryCount = nodeState.get("incorrectotpretryCount") || 1;
//                     if (incorrectotpretryCount > nodeConfig.InvalidOtpMaxLimit) {
//                         action.goTo(NodeOutcome.MAX_LIMIT);
//                     } else {
//                         incorrectotpretryCount++;
//                         nodeState.putShared("incorrectotpretryCount", incorrectotpretryCount);
//                         action.goTo(NodeOutcome.FAILED);
//                     }
//                 }

//             }
//         }

//         }  
//     }
//   catch (error) {
//         nodeState.putShared("anotherFactor", null);
//         nodeState.putShared("errorMessage_BlankOTP", null)
//         nodeState.putShared("errorMessage_ExpiredOtp", null)
//         nodeState.putShared("errorMessage", null)
//         nodeState.putShared("resendcodeMessage", null)
//         action.goTo(NodeOutcome.ERROR);
//     }


// // Main execution
// try {
//     if (callbacks.isEmpty()) {
//         requestCallbacks();
//     } else {
//         handleUserResponses();
//     }
// } catch (error) {
//     nodeState.putShared("errorMessage_BlankOTP", null)
//     nodeState.putShared("errorMessage_ExpiredOtp", null)
//     nodeState.putShared("errorMessage", null)
//     nodeState.putShared("resendcodeMessage", null)
//     action.goTo(NodeOutcome.ERROR);
// }
