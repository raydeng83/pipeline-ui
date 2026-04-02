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
        setMFAContext = nodeState.get("setMFAContext");
        logger.error("Set MFA Context: "+JSON.parse(setMFAContext));
    }
    if (setMFAContext.isMFARequired) {
        logger.error("Going to TRUE");
        action.goTo(NodeOutcome.TRUE)
    } else {
        logger.error("Going to FALSE");
        action.goTo(NodeOutcome.FAILED)
    }
} catch (e) {
    logger.error("Exception occurred " + e)
     action.goTo(NodeOutcome.FAILED)
}


