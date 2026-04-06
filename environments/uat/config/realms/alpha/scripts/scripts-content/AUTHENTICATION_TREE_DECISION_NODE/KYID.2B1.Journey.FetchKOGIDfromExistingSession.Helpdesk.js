var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "GetKOGIDfromExistingSession",
    script: "Script",
    scriptName: "KYID.2B1.Journey.FetchKOGIDfromExistingSession",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ERROR: "false"
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
var loggedinusrKOGID;

// Check if KOGID exists in the session and handle accordingly
if (existingSession.get("KOGID")) {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    loggedinusrKOGID = existingSession.get("KOGID");
    logger.debug("loggedinusrKOGID :: => " + loggedinusrKOGID);

    // Additional check for empty string
    if (loggedinusrKOGID === null || loggedinusrKOGID === undefined || loggedinusrKOGID === "") {
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "loggedinusrKOGID is null, undefined, or empty.");
        action.goTo(NodeOutcome.ERROR);
    } else {
        nodeState.putShared("loggedinusrKOGID", loggedinusrKOGID);
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "loggedinusrKOGID found");
        action.goTo(NodeOutcome.SUCCESS);
    }
} else {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "loggedinusrKOGID Not found in session");
    action.goTo(NodeOutcome.ERROR);
}


