// /*
//   - Data made available by nodes that have already executed are available in the sharedState variable.
//   - The script should set outcome to either "true" or "false".
//  */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthenticationAndRegistration IsMFARequiredAsPerTheContext",
    script: "Script",
    scriptName: "KYID.journey.MFAAuthenticationAndRegistration.IsMFARequiredAsPerTheContext",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FAILED: "false"
};

try {
    var setMFAContext=null;
    var isMFARequired = null;
    //var requiredMFAMethodCode = null;
    if(nodeState.get("setMFAContext")){
        setMFAContext = JSON.parse(JSON.stringify(nodeState.get("setMFAContext")));
        logger.error("Set MFA Context in json: "+JSON.stringify(setMFAContext));    

        var MFAContextCode = setMFAContext.requiredMFAMethodCode
        var isRegistrationAllowed = setMFAContext.isRegistrationAllowed

        logger.error("Printing the mfa context code and the is registration allowed in the ISMFARequired As per the context script :::::::: " + MFAContextCode + "*******" + isRegistrationAllowed)
        
        if (setMFAContext.isMFARequired) {
            logger.error(`${scriptName} : IsMFARequired is True`);
            action.goTo(NodeOutcome.TRUE)
        } else {
            logger.error(`${scriptName} : IsMFARequired is False`);
            action.goTo(NodeOutcome.FAILED)
        }
    }
    
} catch (e) {
    logger.error("Exception occurred " + e)
    action.goTo(NodeOutcome.FAILED)
}


