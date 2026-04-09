var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check isLogin Completed",
    script: "Script",
    scriptName: "KYID.Journey.CheckisLoginCompleted",
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


var isLoginCompleted = nodeState.get("isLoginCompleted");

// Check if isLoginCompleted is not null or undefined, and then evaluate its value
if (isLoginCompleted !== null && isLoginCompleted !== undefined) {
    if (isLoginCompleted === "isLoginCompleted") {
        outcome = NodeOutcome.SUCCESS;
    } else {
        outcome = NodeOutcome.FAILED;
    }
} else {
    logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "isLoginCompleted is null or undefined.");
    outcome = NodeOutcome.FAILED;
}