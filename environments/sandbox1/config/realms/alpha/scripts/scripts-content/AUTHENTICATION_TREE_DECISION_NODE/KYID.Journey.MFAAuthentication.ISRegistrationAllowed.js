/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication IS Registartion Allowed",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.ISRegistrationAllowed",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
};

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


// var isRegistrationAllowed;
// isRegistrationAllowed = "false"
// nodeState.putShared("isRegistrationAllowed", isRegistrationAllowed)

// try {
//     var setMFAContext=null;
//     var isMFARequired = null;
//     //var requiredMFAMethodCode = null;
//     if(nodeState.get("setMFAContext")){
//         setMFAContext = nodeState.get("setMFAContext");
//         logger.error("Set MFA Context: "+setMFAContext);
//     }
//     if (JSON.parse(setMFAContext).isMFARequired) {
//         logger.error("Going to TRUE");
//         action.goTo(NodeOutcome.TRUE)
//     } else {
//         logger.error("Going to FALSE");
//         action.goTo(NodeOutcome.FAILED)
//     }
// } catch (e) {
//     logger.error("Exception occurred " + e)
// }

// nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the is Registration allowed from node state ::  " + nodeState.get("isRegistrationAllowed"));
// nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Trying to check if mail is coming in node state ::::  " + nodeState.get("mail"));

// if (isRegistrationAllowed == "true") {
//     nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the outcome :: Inside true");
//     action.goTo(NodeOutcome.SUCCESS);
// }
// else {
//     action.goTo(NodeOutcome.FAILED);
// }



try {
    var setMFAContext=null;
    var isMFARequired = null;
    //var requiredMFAMethodCode = null;
    logger.error("Set MFA Context in json: "+JSON.parse(JSON.stringify(setMFAContext)));    

    if(nodeState.get("setMFAContext")){
        setMFAContext = JSON.parse(JSON.stringify(nodeState.get("setMFAContext")));
        logger.error("Set MFA Context in json: "+JSON.parse(JSON.stringify(setMFAContext)));    
        if (setMFAContext.isRegistrationAllowed === true) {
            logger.error(`${scriptName} : isRegistrationAllowed is True`);
            nodeState.putShared("isRegistrationAllowed","true");
            action.goTo(NodeOutcome.TRUE)
        } else {
            logger.error(`${scriptName} : isRegistrationAllowed is False`);
            nodeState.putShared("isRegistrationAllowed","false");
            action.goTo(NodeOutcome.FAILED)
        }
    }

} catch (e) {
    logger.error("Exception occurred " + e)
    action.goTo(NodeOutcome.FAILED)
}
