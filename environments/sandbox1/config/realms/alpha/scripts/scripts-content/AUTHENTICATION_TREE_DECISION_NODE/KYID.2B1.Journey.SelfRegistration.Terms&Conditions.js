/**
 * Function: KYID.2B1.Journey.SelfRegistration.Terms&Conditions
 * Description: This script handles a confirmation prompt with options to proceed or cancel.
 * Param(s):
 * Input:
 *                              
 * Returns: 
 * • Success: User chose "Next".
 * • Error: User chose "Cancel" or an exception occurred.
 *

 */

// Capture timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "create password",
    scriptName: "KYID.2B1.Journey.SelfRegistration.Terms&Conditions",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    NEXT: "Next",
    BACK: "Back"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

try {
    nodeLogger.debug(nodeConfig.begin);

    if (callbacks.isEmpty()) {
        nodeLogger.debug("Callbacks are empty, prompting user with Next and Back options.");
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
    } else {
        //var choice = callbacks.getConfirmationCallbacks()[0];
        
       var choice = callbacks.getConfirmationCallbacks().get(0);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User choice received:" + choice);

        if (choice === 1) {  
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected BACK");
    action.goTo(nodeOutcome.BACK);
} else if (choice === 0) {  
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected NEXT");
    action.goTo(nodeOutcome.NEXT);
} else {
    nodeLogger.error("Unexpected user choice: " + choice);
    action.goTo(nodeOutcome.BACK);  
}
    }

    nodeLogger.debug(nodeConfig.end);

} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.BACK);
}
