var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeState Setup Additional Security Methods",
    script: "Script",
    scriptName: "KYID.Journey.MFAregistration.NodeStateSetupAdditionalSecurityMethods",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "True"
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

var setupAdditionalSecurityMethods = "setupAdditionalSecurityMethods"
nodeState.putShared("setupAdditionalSecurityMethods", setupAdditionalSecurityMethods)
nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Choose Setup Additional Security Methods = True");
outcome = NodeOutcome.SUCCESS;
