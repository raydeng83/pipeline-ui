/**
 * Function: kyid.journey.Terms&Conditions
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
    scriptName: "kyid.journey.Terms&Conditions.updated",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    NEXT: "Next",
    CANCEL: "Back"
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
        nodeLogger.error("Callbacks are empty, prompting user with Next and Cancel options.");
        callbacksBuilder.confirmationCallback(0, ["Next", "Cancel"], 1);
    } else {
        var choice = callbacks.getConfirmationCallbacks()[0];
        nodeLogger.error("User choice received: " + choice);

        if (choice) {
            nodeLogger.error("User selected CANCEL.");
            action.goTo(nodeOutcome.CANCEL);
        } else {
            nodeLogger.erorr("User selected NEXT.");
            action.goTo(nodeOutcome.NEXT);
        }
    }

    nodeLogger.debug(nodeConfig.end);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    logger.error("line67")
    action.goTo(nodeOutcome.CANCEL);
}
