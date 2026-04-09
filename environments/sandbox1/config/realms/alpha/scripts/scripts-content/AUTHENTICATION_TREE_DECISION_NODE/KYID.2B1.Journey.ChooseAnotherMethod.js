var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Choose Another Method",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ChooseAnotherMethod",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    ANOTHERFACTOR: "Choose Another Method"
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

if (nodeState.get("anotherFactor") === "anotherFactor"){
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Another moethod selected");
    outcome = NodeOutcome.ANOTHERFACTOR;
} else {
    nodeState.putShared("postrecoveryemail", "true")
    outcome = NodeOutcome.TRUE;
}