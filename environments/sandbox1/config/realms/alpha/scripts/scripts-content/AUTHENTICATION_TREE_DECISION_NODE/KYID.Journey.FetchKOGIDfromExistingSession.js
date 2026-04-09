var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "GetKOGIDfromExistingSession",
    script: "Script",
    scriptName: "KYID.Journey.FetchKOGIDfromExistingSession",
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
var KOGID;

// Check if KOGID exists in the session and handle accordingly
if (existingSession.get("KOGID")) {
    KOGID = existingSession.get("KOGID");

    // Additional check for empty string
    if (KOGID === null || KOGID === undefined || KOGID === "") {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "KOGID is null, undefined, or empty.");
        action.goTo(NodeOutcome.ERROR);
    } else {
        nodeState.putShared("KOGID", KOGID);
        action.goTo(NodeOutcome.SUCCESS);
    }
} else {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "KOGID Not found in session");
    action.goTo(NodeOutcome.ERROR);
}


