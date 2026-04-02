var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication CheckNodeStateAnotherFactor",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.CheckNodeStateAnotherFactor",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    WITHOUT: "without",
    FAILED: "false"
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

var isRegistrationAllowed = nodeState.get("isRegistrationAllowed");

// Check if isRegistrationAllowed is null or undefined
if (isRegistrationAllowed === null || isRegistrationAllowed === undefined) {
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "isRegistrationAllowed is null or undefined.");
    outcome = NodeOutcome.FAILED;
} else {
    // Proceed with your existing logic
    if (nodeState.get("anotherFactor") === "anotherFactor") {
        if (isRegistrationAllowed === "true") {
            outcome = NodeOutcome.SUCCESS;
        } else if (isRegistrationAllowed === "false") {
            outcome = NodeOutcome.WITHOUT;
        } else {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Invalid value for isRegistrationAllowed: " + isRegistrationAllowed);
            outcome = NodeOutcome.FAILED;
        }
    } else {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "anotherFactor does not match.");
        outcome = NodeOutcome.FAILED;
    }
}