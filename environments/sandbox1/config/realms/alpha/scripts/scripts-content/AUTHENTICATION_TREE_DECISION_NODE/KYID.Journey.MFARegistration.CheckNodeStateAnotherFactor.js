var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Registration CheckNodeStateAnotherFactor",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.CheckNodeStateAnotherFactor",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
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

// Main Execvution

    if (nodeState.get("anotherFactor") === "anotherFactor" || nodeState.get("setupAdditionalSecurityMethods") === "setupAdditionalSecurityMethods") {
        outcome = NodeOutcome.SUCCESS;
        
    } else {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "anotherFactor does not match.");
        outcome = NodeOutcome.FAILED;
    }
