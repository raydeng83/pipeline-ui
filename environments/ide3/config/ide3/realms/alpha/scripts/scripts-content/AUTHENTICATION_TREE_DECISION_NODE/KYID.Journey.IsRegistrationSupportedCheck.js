
var dateTime = new Date().toISOString();

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Is Registration Supported",
    script: "Script",
    scriptName: "KYID.Journey.IsRegistrationSupportedCheck",
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



if (nodeState.get("errorRegistrationNotSupportedMessage")) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Operation not supported" + nodeState.get("errorRegistrationNotSupportedMessage"));
    outcome = NodeOutcome.SUCCESS;
} else {
    outcome = NodeOutcome.FAILED;
}