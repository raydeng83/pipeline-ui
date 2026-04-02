var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

logger.debug("Inside InvalidFirstName Script");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Error Invalid Name",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Error.InvalidFirstName",
    timestamp: dateTime,
    errorMessage:"invalid_name",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"
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
}

try {
    nodeState.putShared("errorInvalidName",nodeConfig.errorMessage);
    action.goTo(NodeOutcome.TRUE);
    
} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    
}

