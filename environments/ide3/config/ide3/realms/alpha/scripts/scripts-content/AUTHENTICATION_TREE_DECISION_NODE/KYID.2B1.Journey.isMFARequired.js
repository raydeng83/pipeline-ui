var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA isRequired",
    script: "Script",
    scriptName: "KYID.2B1.Journey.isMFARequired",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    MFAREQUIRED: "mfaRequired",
    MFANOTREQUIRED: "mfaNotRequired"
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

try {
    var requiredMFAMethod = nodeState.get("requiredMFAMethod");
    var riskLevel = nodeState.get("riskLevel");
    var mfaCode = nodeState.get("appRequiredMFACode");

    //var riskLevel="HIGH";
    //var mfaCode = nodeState.get("appRequiredMFACode");
     //var mfaCode ="AUTHENTICATOR";
    var selfEnrollMFA = false;
    if(nodeState.get("selfEnrollMFA")){
        selfEnrollMFA = nodeState.get("selfEnrollMFA");
    }  

    // Logging all inputs
    logger.debug("=== MFA Decision Tree Start ===");
    logger.debug("riskLevel: " + riskLevel);
    logger.debug("MFACodeForClaims: " + mfaCode);
    logger.debug("selfEnrollMFA: " + selfEnrollMFA);
    logger.debug("requiredMFAMethod: " + requiredMFAMethod);

    var riskLevelMFA = systemEnv.getProperty("esv.risklevelmfa.enabled")
    logger.debug("the esv for risk level::"+riskLevelMFA)
    
    // === Continuous if-else logic ===

    if (
        (nodeState.get("enforceRiskBasedAuthn") === false || nodeState.get("enforceRiskBasedAuthn") === "false") ||
        (riskLevelMFA === false || riskLevelMFA === "false"|| riskLevel === "LOW") &&
        (mfaCode === "0" || mfaCode === 0 ) &&
        (selfEnrollMFA === "false" || selfEnrollMFA === false)
    ) {
        logger.error("MFA NOT required: LOW risk, app doesn't require MFA, and selfEnroll is false.");
        action.goTo(NodeOutcome.MFANOTREQUIRED);
    }

    else if (typeof existingSession != 'undefined' && existingSession.get("sessionAssuranceLevelforMFA")) {
        var sessionAssuranceLevelforMFA = existingSession.get("sessionAssuranceLevelforMFA");

        logger.error("Checking session assurance level against required MFA method level");
        logger.error("Session Assurance Level: " + sessionAssuranceLevelforMFA);
        logger.error("Required MFA Method Level: " + requiredMFAMethod);

        // if (isperftest.localeCompare("true")==0 && (riskLevelMFA === false || riskLevelMFA === "false") && (sessionAssuranceLevelforMFA < requiredMFAMethod)) {
        //     logger.error("Perf is ON. Risk MFA is Disabled. Session assurance level is LOWER than required but MFA is not required.");
        //     action.goTo(NodeOutcome.MFANOTREQUIRED);
        // }
        // else 
            if (sessionAssuranceLevelforMFA < requiredMFAMethod) {
            logger.error("Session assurance level is LOWER than required. MFA is required.");
            nodeState.putShared("journeyNameReporting","StepUpApplicationLogin") //MFAReporting
                if(nodeState.get("journeyName") === "ApplicationLogin"){
                    nodeState.putShared("journeyName","")
                }
            
            action.goTo(NodeOutcome.MFAREQUIRED);
        } else {
            logger.error("Session assurance level is HIGHER or EQUAL. MFA not required.");
            action.goTo(NodeOutcome.MFANOTREQUIRED);
        }
    }

    else {
        logger.error("MFA required: No valid session or assurance level found.");
        action.goTo(NodeOutcome.MFAREQUIRED);
    }

} catch (e) {
    logger.error("Error during MFA decision flow: " + e);
    action.goTo(NodeOutcome.MFAREQUIRED); 
}

