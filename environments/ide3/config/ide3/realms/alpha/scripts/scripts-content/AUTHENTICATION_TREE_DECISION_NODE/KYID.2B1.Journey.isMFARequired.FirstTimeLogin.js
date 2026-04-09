var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA isRequired",
    script: "Script",
    scriptName: "KYID.2B1.Journey.isMFARequired.FirstTimeLogin",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    MFAREQUIRED: "mfaRequired",
    MFANOTREQUIRED: "mfaNotRequired",
    REGISTRATIONREQUIRED: "registrationRequired"
};

/**
 * Logging function
 */
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); }
};

try {
    var requiredMFAMethod = nodeState.get("requiredMFAMethod");
    var riskLevel = nodeState.get("riskLevel");
    var mfaCode = nodeState.get("appRequiredMFACode");
    var lastMFAMethod = nodeState.get("MFAMethod");
    var userMFAs = nodeState.get("userMFAs") || [];
    var selfEnrollMFA = nodeState.get("selfEnrollMFA") || false;

    logger.debug("=== MFA Decision Tree Start for First Time User===");
    logger.debug("riskLevel for First Time User: " + riskLevel);
    logger.debug("appRequiredMFACode for First Time User: " + mfaCode);
    logger.debug("lastMFAMethod for First Time User: " + lastMFAMethod);
    logger.debug("userMFAs for First Time User: " + JSON.stringify(userMFAs));
    logger.debug("selfEnrollMFA for First Time User: " + selfEnrollMFA);
    logger.debug("requiredMFAMethod for First Time User: " + requiredMFAMethod);

    // Allowed methods mapping
    var allowedMethodsMap = {
        "4": ["MOBILE", "AUTHENTICATOR"],
        "5": ["AUTHENTICATOR"],
        "3": ["AUTHENTICATOR", "MOBILE", "EMAIL"],
        "0": ["AUTHENTICATOR", "MOBILE", "EMAIL"]
    };

    var allowedMethods = allowedMethodsMap[mfaCode] || [];

    var riskLevelMFA = systemEnv.getProperty("esv.risklevelmfa.enabled")
    logger.debug("the esv for risk level::"+riskLevelMFA)

    // === Scenario 1: No MFA required ===
    if (
        (nodeState.get("enforceRiskBasedAuthn") === false || nodeState.get("enforceRiskBasedAuthn") === "false") ||
        (riskLevelMFA === false || riskLevelMFA === "false"|| riskLevel === "LOW") &&
        (mfaCode === "0" || mfaCode === 0 ) &&
        (selfEnrollMFA === "false" || selfEnrollMFA === false)
    ) {
        logger.debug("MFA NOT required: LOW risk, app doesn't require MFA, and selfEnroll is false.");
        action.goTo(NodeOutcome.MFANOTREQUIRED);
    }
    // === Scenario 2: Session assurance level check ===
    else if (typeof existingSession !== 'undefined' && existingSession.get("sessionAssuranceLevelforMFA")) {
        var sessionAssuranceLevelforMFA = existingSession.get("sessionAssuranceLevelforMFA");

        logger.debug("Checking session assurance level against required MFA method level");
        logger.debug("Session Assurance Level: " + sessionAssuranceLevelforMFA);
        logger.debug("Required MFA Method Level: " + requiredMFAMethod);

        if (sessionAssuranceLevelforMFA < requiredMFAMethod) {
            logger.debug("Session assurance level is LOWER than required. MFA is required.");
            nodeState.putShared("journeyNameReporting","StepUpApplicationLogin") //MFAReporting
            action.goTo(NodeOutcome.MFAREQUIRED);
        } else {
            logger.debug("Session assurance level is HIGHER or EQUAL. MFA not required.");
            action.goTo(NodeOutcome.MFANOTREQUIRED);
        }
    }

    // === Scenario 3: Check last method and registered methods ===
    else {
        var needRegistration;
        // If last method itself is valid for this mfaCode
        if (allowedMethods.includes(lastMFAMethod)) {
            logger.debug("Last used MFA method is valid for app requirement. MFA NOT REQUIRED");
            action.goTo(NodeOutcome.MFANOTREQUIRED);
        } else {
            // Otherwise check if user has ANY valid MFA already registered
            logger.debug("Last used MFA method is not valid for app requirement.MFA Check REQUIRED");
            var hasRequiredMFA = false;
            for (var i = 0; i < userMFAs.length; i++) {
                if (allowedMethods.includes(userMFAs[i])) {
                    hasRequiredMFA = true;
                    break;
                }
            }
            
            if (hasRequiredMFA) {
                logger.debug("User has at least one allowed MFA registered. Proceed with MFA REQUIRED");
                action.goTo(NodeOutcome.MFAREQUIRED);
            } else {
                // Handle by MFA code
                if (mfaCode === "3" || mfaCode === 3 || mfaCode === "0" || mfaCode === 0) {
                    logger.debug("MFA code is " + mfaCode + " .No registration required. MFA REQUIRED flow.");
                    action.goTo(NodeOutcome.MFAREQUIRED);
                } else if (mfaCode === "4" || mfaCode === 4) {
                    needRegistration = "MOBILE";
                    nodeState.putShared("needregistration", needRegistration);
                    nodeState.putShared("journeyNameReporting","StepUpApplicationLogin") //MFAReporting
                     if(nodeState.get("journeyName") === "ApplicationLogin"){
                    nodeState.putShared("journeyName","")
                    }
                    logger.debug("User missing required MFA Phone. REGISTRATION REQUIRED for: " + needRegistration);
                    action.goTo(NodeOutcome.REGISTRATIONREQUIRED);
                } else if (mfaCode === "5" || mfaCode === 5) {
                    needRegistration = "AUTHENTICATOR";
                    nodeState.putShared("needregistration", needRegistration);
                    nodeState.putShared("journeyNameReporting","StepUpApplicationLogin") //MFAReporting
                    if(nodeState.get("journeyName") === "ApplicationLogin"){
                    nodeState.putShared("journeyName","")
                    }
                    logger.debug("User missing required MFA Authenticator. REGISTRATION REQUIRED for: " + needRegistration);
                    action.goTo(NodeOutcome.REGISTRATIONREQUIRED);
                } else {
                    logger.debug("MFA code retrieval issue. Default to REGISTRATION REQUIRED.");
                    needRegistration = "AUTHENTICATOR";
                    nodeState.putShared("needregistration", needRegistration);
                    action.goTo(NodeOutcome.REGISTRATIONREQUIRED);
                }
            }
        }
    }

} catch (e) {
    logger.error("Error during MFA decision flow: " + e);
    action.goTo(NodeOutcome.MFAREQUIRED);
}