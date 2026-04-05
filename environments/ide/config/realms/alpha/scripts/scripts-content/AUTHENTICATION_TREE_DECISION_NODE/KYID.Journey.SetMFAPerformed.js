var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "SetMFAPerformed",
    script: "Script",
    scriptName: "KYID.Journey.SetMFAPerformed",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
var NodeOutcome = {
    SUCCESS: "true"
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


nodeState.putShared("isMFAPerformed", "true")
outcome = NodeOutcome.SUCCESS;