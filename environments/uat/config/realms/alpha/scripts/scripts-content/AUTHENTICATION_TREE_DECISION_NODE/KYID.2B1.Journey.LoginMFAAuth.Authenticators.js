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
        nodeState.putShared("nextStep", nextStep)
        action.goTo(nextStep);
    }
} catch (e) {
    logger.error("Main script error: " + e);
    action.goTo("error");
}