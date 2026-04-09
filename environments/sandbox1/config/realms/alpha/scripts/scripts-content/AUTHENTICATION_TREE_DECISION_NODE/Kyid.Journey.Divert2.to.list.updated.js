/**
 * Script: Kyid.Journey.Divert2.to.list.updated
 * Description: This script checks if an alternate method is chosen or if a phone already exists.
 * Node Outcome:
 * - Success: "true"
 * - Failure: "false"
 */

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Divert 2",
    scriptName: "Kyid.Journey.Divert2.to.list.updated",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRUE: "true",
    FALSE: "false"
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

    // Retrieve values from nodeState
    var chooseAnotherMethod = nodeState.get("chooseanothermethod");
    var existedPhone = nodeState.get("ExistedPhone");

    nodeLogger.debug("chooseanothermethod: " + chooseAnotherMethod);
    nodeLogger.debug("ExistedPhone: " + existedPhone);

    // Perform null checks
    if (chooseAnotherMethod === null || typeof chooseAnotherMethod === "undefined") {
        chooseAnotherMethod = "false";
        nodeLogger.debug("chooseanothermethod not set, defaulting to 'false'");
    }

    if (existedPhone === null || typeof existedPhone === "undefined") {
        existedPhone = "false";
        nodeLogger.debug("ExistedPhone not set, defaulting to 'false'");
    }

    // Evaluate conditions
    if (chooseAnotherMethod === "true" || existedPhone === "true") {
        nodeState.putShared("chooseanothermethod", "false");
        nodeState.putShared("ExistedPhone", "false");

        nodeLogger.debug("Conditions met, proceeding to TRUE outcome.");
        action.goTo(nodeOutcome.TRUE);
    } else {
        nodeLogger.debug("Conditions not met, proceeding to FALSE outcome.");
        action.goTo(nodeOutcome.FALSE);
    }

    nodeLogger.debug(nodeConfig.end);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.FALSE);
}