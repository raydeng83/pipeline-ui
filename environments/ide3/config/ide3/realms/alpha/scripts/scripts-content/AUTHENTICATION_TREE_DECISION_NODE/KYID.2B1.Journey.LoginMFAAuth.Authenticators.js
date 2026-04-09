function isMFARegisteredWithValue(usrKOGID, mfaMethod, mfaValue) {
    try {
        var filter = 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"';
        if (mfaValue) {
            filter += ' AND MFAValue eq "' + mfaValue + '"';
        }
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": filter
        });

        return response && response.result && response.result.length > 0;
    } catch (e) {
        logger.error("Error in isMFARegisteredWithValue for " + mfaMethod + " and " + mfaValue + ": " + e);
        return false;
    }
}

// Helper to check general MFA method registration (no MFAValue)
function isMFARegistered(usrKOGID, mfaMethod) {
    try {
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"'
        });

        return response && response.result && response.result.length > 0;
    } catch (e) {
        logger.error("Error in isMFARegistered for " + mfaMethod + ": " + e);
        return false;
    }
}

// Show MFA options to the user
function showMFAOptions() {
    try {
        var mfaOptions = [];
        var methodMapping = [];

        if (nodeState.get("isGoogleTOTPRegistered")) {
            mfaOptions.push("GoogleAuthenticator");
            methodMapping.push("googleAuthenticator");
        }
        if (nodeState.get("isMicrosoftTOTPRegistered")) {
            mfaOptions.push("MicrosoftAuthenticator");
            methodMapping.push("microsoftAuthenticator");
        }
        // Show only one ForgeRock option if either TOTP or PUSH registered
        if (nodeState.get("isForgeRockTOTPRegistered") || nodeState.get("isPUSHRegistered")) {
            mfaOptions.push("ForgeRockAuthenticator");
            methodMapping.push("forgeRockAuthenticator");
        }
        if (nodeState.get("isSymantecRegistered")) {
            mfaOptions.push("SymantecVIP");
            methodMapping.push("symantec");
        }

        if (mfaOptions.length === 0) {
            logger.debug("No registered MFA options found");
            action.goTo("error");
            return;
        }

        nodeState.putShared("methodMapping", methodMapping);

        var jsonobj = {"pageHeader": "2_Select an authenticator app"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        callbacksBuilder.choiceCallback("Which app would you like to use for authentication?", mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        if (getFaqTopicId != null) {
                
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
            }


    } catch (e) {
        logger.error("Error in showMFAOptions: " + e);
        action.goTo("error");
    }
}

// Evaluate user's selection and return string indicating next node
function evaluateMFASelection() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; 
        var outcome = callbacks.getChoiceCallbacks().get(0)[0];
        var methodMapping = nodeState.get("methodMapping");

        if (selectedOutcome === 1) {
            nodeState.putShared("anotherFactor", "anotherFactor");
            return "back";
        } else {
            var selectedMethod = methodMapping[outcome];
            if (selectedMethod === "forgeRockAuthenticator") {
                var hasTOTP = nodeState.get("isForgeRockTOTPRegistered");
                var hasPUSH = nodeState.get("isPUSHRegistered");
    
                if (hasTOTP || hasPUSH) {
                    nodeState.putShared("anotherFactor", null);
                    return "forgerock";
                } else {
                    logger.debug("ForgeRock selected but no TOTP or PUSH registered");
                    return "error";
                }
            }
    
            // Other MFA method routing
            if (selectedMethod === "googleAuthenticator") {
                return "googleTOTP";
            } else if (selectedMethod === "microsoftAuthenticator") {
                return "microsoftTOTP";
            } else if (selectedMethod === "symantec") {
                return "symantec";
            } else {
                logger.debug("Unhandled MFA method: " + selectedMethod);
                return "error";
            }
        }

        var selectedMethod = methodMapping[outcome];
        if (!selectedMethod) {
            logger.debug("Invalid MFA selection index: " + outcome);
            return "error";
        }

    } catch (e) {
        logger.error("Error in evaluateMFASelection: " + e);
        nodeState.putShared("anotherFactor", null);
        return "error";
    }
}

try {
    var usrKOGID = nodeState.get("KOGID");
    nodeState.putShared("anotherFactor", null);
    var lib = require("KYID.Library.FAQPages");
      var process ="MasterLogin";
      var pageHeader= "2_Select an authenticator app";
      var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    // Check all registered MFA methods
    var isGoogleTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "GOOGLE");
    var isMicrosoftTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "MICROSOFT");
    var isForgeRockTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "FORGEROCK");
    if(isForgeRockTOTPRegistered === false){
        isForgeRockTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "FRTOTP","DEVICE");
        if(isForgeRockTOTPRegistered){
           isForgeRockTOTPRegistered["MFAMethod"] = "TOTP"
            isForgeRockTOTPRegistered["MFAValue"] = "FORGEROCK"
        }
    }
    var isSymantecRegistered = isMFARegistered(usrKOGID, "SYMANTEC");
    var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH");
    if(isPUSHRegistered === false){
        isPUSHRegistered = isMFARegisteredWithValue(usrKOGID, "FRPUSH","DEVICE");
        if(isPUSHRegistered){
           isPUSHRegistered["MFAMethod"] = "PUSH"
            isPUSHRegistered["MFAValue"] = "FORGEROCK"
        }
    }

    nodeState.putShared("isGoogleTOTPRegistered", isGoogleTOTPRegistered);
    nodeState.putShared("isMicrosoftTOTPRegistered", isMicrosoftTOTPRegistered);
    nodeState.putShared("isForgeRockTOTPRegistered", isForgeRockTOTPRegistered);
    nodeState.putShared("isSymantecRegistered", isSymantecRegistered);
    nodeState.putShared("isPUSHRegistered", isPUSHRegistered);

    if (callbacks.isEmpty()) {

        showMFAOptions();
    } else {
        // Evaluate selection and go to next step
        var nextStep = evaluateMFASelection();
        logger.error("nextStep is KYID.2B1.Journey.LoginMFAAuth.Authenticators"+nextStep)
        nodeState.putShared("nextStep", nextStep)
        action.goTo(nextStep);
    }
} catch (e) {
    logger.error("Main script error: " + e);
    action.goTo("error");
}
// function isMFARegisteredWithValue(usrKOGID, mfaMethod, mfaValue) {
//     try {
//         var filter = 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"';
//         if (mfaValue) {
//             filter += ' AND MFAValue eq "' + mfaValue + '"';
//         }
//         var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
//             "_queryFilter": filter
//         });

//         return response && response.result && response.result.length > 0;
//     } catch (e) {
//         logger.error("Error in isMFARegisteredWithValue for " + mfaMethod + " and " + mfaValue + ": " + e);
//         return false;
//     }
// }

// // Helper to check general MFA method registration (no MFAValue)
// function isMFARegistered(usrKOGID, mfaMethod) {
//     try {
//         var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
//             "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"'
//         });

//         return response && response.result && response.result.length > 0;
//     } catch (e) {
//         logger.error("Error in isMFARegistered for " + mfaMethod + ": " + e);
//         return false;
//     }
// }

// // Show MFA options to the user
// function showMFAOptions() {
//     try {
//         var mfaOptions = [];
//         var methodMapping = [];

//         if (nodeState.get("isGoogleTOTPRegistered")) {
//             mfaOptions.push("Google_Authenticator");
//             methodMapping.push("googleAuthenticator");
//         }
//         if (nodeState.get("isMicrosoftTOTPRegistered")) {
//             mfaOptions.push("Microsoft_Authenticator");
//             methodMapping.push("microsoftAuthenticator");
//         }
//         // Show only one ForgeRock option if either TOTP or PUSH registered
//         if (nodeState.get("isForgeRockTOTPRegistered") || nodeState.get("isPUSHRegistered")) {
//             mfaOptions.push("ForgeRock_Authenticator");
//             methodMapping.push("forgeRockAuthenticator");
//         }
//         if (nodeState.get("isSymantecRegistered")) {
//             mfaOptions.push("Symantec_VIP");
//             methodMapping.push("symantec");
//         }

//         if (mfaOptions.length === 0) {
//             logger.error("No registered MFA options found");
//             action.goTo("error");
//             return;
//         }

//         nodeState.putShared("methodMapping", methodMapping);

//         callbacksBuilder.textOutputCallback(0, "Select an authenticator app");
//         callbacksBuilder.choiceCallback("Which app would you like to use for authentication?", mfaOptions, 0, false);
//         callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);

//         action.send(callbacksBuilder.build()).build();

//     } catch (e) {
//         logger.error("Error in showMFAOptions: " + e);
//         action.goTo("error");
//     }
// }

// // Evaluate user's selection and return string indicating next node
// function evaluateMFASelection() {
//     try {
//         var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; // 0=Next, 1=Back
//         var outcome = callbacks.getChoiceCallbacks().get(0)[0];
//         var methodMapping = nodeState.get("methodMapping");

//         if (selectedOutcome === 1) {
//             nodeState.putShared("anotherFactor", "anotherFactor");
//             return "back";
//         }

//         var selectedMethod = methodMapping[outcome];
//         if (!selectedMethod) {
//             logger.error("Invalid MFA selection index: " + outcome);
//             return "error";
//         }

//         // ForgeRock combined handling
//         if (selectedMethod === "forgeRockAuthenticator") {
//             var hasTOTP = nodeState.get("isForgeRockTOTPRegistered");
//             var hasPUSH = nodeState.get("isPUSHRegistered");

//             if (hasTOTP || hasPUSH) {
//                 nodeState.putShared("anotherFactor", null);
//                 return "forgerock";
//             } else {
//                 logger.error("ForgeRock selected but no TOTP or PUSH registered");
//                 return "error";
//             }
//         }

//         // Other MFA method routing
//         if (selectedMethod === "googleAuthenticator") {
//             return "googleTOTP";
//         } else if (selectedMethod === "microsoftAuthenticator") {
//             return "microsoftTOTP";
//         } else if (selectedMethod === "symantec") {
//             return "symantec";
//         } else {
//             logger.error("Unhandled MFA method: " + selectedMethod);
//             return "error";
//         }

//     } catch (e) {
//         logger.error("Error in evaluateMFASelection: " + e);
//         nodeState.putShared("anotherFactor", null);
//         return "error";
//     }
// }

// try {
//     var usrKOGID = nodeState.get("KOGID");

//     // Check all registered MFA methods
//     var isGoogleTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "GOOGLE");
//     var isMicrosoftTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "MICROSOFT");
//     var isForgeRockTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "FORGEROCK");
//     var isSymantecRegistered = isMFARegistered(usrKOGID, "SYMANTEC");
//     var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH");

//     nodeState.putShared("isGoogleTOTPRegistered", isGoogleTOTPRegistered);
//     nodeState.putShared("isMicrosoftTOTPRegistered", isMicrosoftTOTPRegistered);
//     nodeState.putShared("isForgeRockTOTPRegistered", isForgeRockTOTPRegistered);
//     nodeState.putShared("isSymantecRegistered", isSymantecRegistered);
//     nodeState.putShared("isPUSHRegistered", isPUSHRegistered);

//     if (callbacks.isEmpty()) {
//         // Show MFA options to user
//         showMFAOptions();
//     } else {
//         // Evaluate selection and go to next step
//         var nextStep = evaluateMFASelection();
//         action.goTo(nextStep);
//     }
// } catch (e) {
//     logger.error("Main script error: " + e);
//     action.goTo("error");
// }
// try {
//     var usrKOGID = nodeState.get("KOGID");

//     // Check registered MFA methods
//     var isGoogleTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "GOOGLE");
//     var isMicrosoftTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "MICROSOFT");
//     var isForgeRockTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "FORGEROCK");
//     var isForgeRockPUSHRegistered = isMFARegistered(usrKOGID, "PUSH");
//     var isSymantecRegistered = isMFARegistered(usrKOGID, "SYMANTEC");

//     // Store flags for use in callbacks
//     nodeState.putShared("isGoogleTOTPRegistered", isGoogleTOTPRegistered);
//     nodeState.putShared("isMicrosoftTOTPRegistered", isMicrosoftTOTPRegistered);
//     nodeState.putShared("isForgeRockTOTPRegistered", isForgeRockTOTPRegistered);
//     nodeState.putShared("isForgeRockPUSHRegistered", isForgeRockPUSHRegistered);
//     nodeState.putShared("isSymantecRegistered", isSymantecRegistered);

//     var result;
//     if (callbacks.isEmpty()) {
//         result = buildMFASelectionCallbacks();
//     } else {
//         var outcome = evaluateMFASelection();
//         result = action.goTo(outcome);
//     }
//     result;

// } catch (e) {
//     logger.error("Main script error: " + e);
//     action.goTo("error");
// }

// function buildMFASelectionCallbacks() {
//     try {
//         var mfaOptions = [];
//         var methodMapping = [];

//         if (nodeState.get("isGoogleTOTPRegistered")) {
//             mfaOptions.push("Google_Authenticator");
//             methodMapping.push("googleTOTP");
//         }
//         if (nodeState.get("isMicrosoftTOTPRegistered")) {
//             mfaOptions.push("Microsoft_Authenticator");
//             methodMapping.push("microsoftTOTP");
//         }

//         // Show ONE ForgeRock option if either TOTP or PUSH is registered
//         if (nodeState.get("isForgeRockTOTPRegistered") || nodeState.get("isForgeRockPUSHRegistered")) {
//             mfaOptions.push("ForgeRock_Authenticator");
//             methodMapping.push("forgeRockAuthenticator");
//         }

//         if (nodeState.get("isSymantecRegistered")) {
//             mfaOptions.push("Symantec_VIP");
//             methodMapping.push("symantec");
//         }

//         if (mfaOptions.length === 0) {
//             logger.error("No MFA methods available for user.");
//             return action.goTo("error");
//         }

//         nodeState.putShared("methodMapping", methodMapping);

//         callbacksBuilder.textOutputCallback(0, "Select an authenticator app");
//         callbacksBuilder.choiceCallback("Which app would you like to use for authentication?", mfaOptions, 0, false);
//         callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);

//         return action.send(callbacksBuilder.build()).build();

//     } catch (error) {
//         logger.error("Error building MFA options: " + error);
//         return action.goTo("error");
//     }
// }

// function evaluateMFASelection() {
//     try {
//         var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; // 0 = Next, 1 = Back
//         var selectedIndex = callbacks.getChoiceCallbacks().get(0).getSelectedIndexes()[0];
//         var methodMapping = nodeState.get("methodMapping");

//         if (selectedOutcome === 1) {
//             nodeState.putShared("anotherFactor", "anotherFactor");
//             return "back";
//         }

//         var selectedMethod = methodMapping[selectedIndex];
//         if (!selectedMethod) {
//             logger.error("Invalid MFA selection index: " + selectedIndex);
//             return "error";
//         }

//         // If user chose ForgeRock Authenticator, determine which method(s) to use
//         if (selectedMethod === "forgeRockAuthenticator") {
//             var hasTOTP = nodeState.get("isForgeRockTOTPRegistered");
//             var hasPUSH = nodeState.get("isForgeRockPUSHRegistered");

//             // Customize your preference/order here:
//             if (hasTOTP) {
//                 return "forgerockTOTP";
//             } else if (hasPUSH) {
//                 return "push";
//             } else {
//                 // Should not happen but fallback
//                 logger.error("ForgeRock option selected but no method registered");
//                 return "error";
//             }
//         }

//         nodeState.putShared("anotherFactor", null);
//         logger.error("Selected MFA method: " + selectedMethod);
//         return selectedMethod;

//     } catch (error) {
//         logger.error("Error handling MFA selection: " + error);
//         return "error";
//     }
// }

// function isMFARegistered(usrKOGID, mfaMethod) {
//     try {
//         var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
//             "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"'
//         });
//         return response && response.result && response.result.length > 0;
//     } catch (e) {
//         logger.error("Error checking MFA registration for " + mfaMethod + ": " + e);
//         return false;
//     }
// }

// function isMFARegisteredWithValue(usrKOGID, mfaMethod, mfaValue) {
//     try {
//         var filter = 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"';
//         if (mfaValue) {
//             filter += ' AND MFAValue eq "' + mfaValue + '"';
//         }
//         var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
//             "_queryFilter": filter
//         });
//         return response && response.result && response.result.length > 0;
//     } catch (e) {
//         logger.error("Error checking MFA registration for " + mfaMethod + " with value " + mfaValue + ": " + e);
//         return false;
//     }
// }

// try {
//     var usrKOGID = nodeState.get("KOGID");
//     var isTOTPRegistered = isMFARegistered(usrKOGID, "TOTP");
//     var isSymantecRegistered = isMFARegistered(usrKOGID, "SYMANTEC");
//     var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH");

//     nodeState.putShared("isTOTPRegistered", isTOTPRegistered);
//     nodeState.putShared("isSymantecRegistered", isSymantecRegistered);
//     nodeState.putShared("isPUSHRegistered", isPUSHRegistered);

//     if (callbacks.isEmpty()) {
//         showMFAOptions();
//     } else {
//         handleMFASelection();
//     }
// } catch (error) {
//     logger.error("Main script error: " + error);
//     action.goTo("error");
// }

// function showMFAOptions() {
//     try {
//         var mfaOptions = [];
//         var methodMapping = [];

//         if (isTOTPRegistered) {
//             mfaOptions.push("ForgeRock_Authenticator");
//             methodMapping.push("forgeRock");
//         }
//         if (isPUSHRegistered) {
//             mfaOptions.push("ForgeRock_PUSH");
//             methodMapping.push("push");
//         }
//         if (isSymantecRegistered) {
//             mfaOptions.push("Symantec_VIP");
//             methodMapping.push("symantec");
//         }

//         // Store mapping in shared state for use in handleMFASelection
//         nodeState.putShared("methodMapping", methodMapping);

//         callbacksBuilder.textOutputCallback(0, "Select_an_authenticator_app");
//         callbacksBuilder.choiceCallback("which_app_would_you_like_to_use_for_authenticator", mfaOptions, 0, false);
//         callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);

//     } catch (error) {
//         logger.error("Error in showMFAOptions: " + error);
//         action.goTo("error");
//     }
// }

// // function handleMFASelection() {
// //     try {
// //         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
// //         var selectedIndex = callbacks.getChoiceCallbacks().get(0).getSelectedIndexes()[0];
// //         var methodMapping = nodeState.get("methodMapping");

// //         if (selectedOutcome === 1) {
// //             nodeState.putShared("anotherFactor","anotherFactor")
// //             action.goTo("back");
// //         } else {
// //             var selectedMethod = methodMapping[selectedIndex];
// //             nodeState.putShared("anotherFactor",null)
// //             logger.error("printing the selectedMethod" + selectedMethod)
// //             action.goTo(selectedMethod);
// //         }

// //     } catch (error) {
// //         logger.error("Error in handleMFASelection: " + error);
// //         nodeState.putShared("anotherFactor",null)
// //         action.goTo("error");
// //     }
// // }

// function handleMFASelection() {
//     try {
//         var selectedOutcome = callbacks.getConfirmationCallbacks()[0]; // 0 = Next, 1 = Back
//         var outcome = callbacks.getChoiceCallbacks().get(0)[0]; // Index of selected method
//         var methodMapping = nodeState.get("methodMapping");

//         if (selectedOutcome === 1) {
//             nodeState.putShared("anotherFactor", "anotherFactor");
//             return action.goTo("back");
//         } else {
//             var selectedMethod = methodMapping[outcome];
//             nodeState.putShared("anotherFactor", null);
//             logger.error("Selected MFA method: " + selectedMethod);
//             return action.goTo(selectedMethod);
//         }

//     } catch (error) {
//         logger.error("Error in handleMFASelection: " + error);
//         nodeState.putShared("anotherFactor", null);
//         return action.goTo("error");
//     }
// }

// function isMFARegistered(usrKOGID, mfaMethod) {
//     try {
//         var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
//             "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"'
//         });

//         return response && response.result && response.result.length > 0;
//     } catch (e) {
//         logger.error("Error in isMFARegistered for " + mfaMethod + ": " + e);
//         return false;
//     }
// }