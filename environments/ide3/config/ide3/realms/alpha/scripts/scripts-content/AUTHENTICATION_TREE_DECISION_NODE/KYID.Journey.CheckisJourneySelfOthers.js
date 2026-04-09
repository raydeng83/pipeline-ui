var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check isSelfOthers Journey Completed",
    script: "Script",
    scriptName: "KYID.Journey.CheckisJourneySelfOthers",
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


var isJourneySelfOthers = nodeState.get("isJourneySelfOthers");

// Check if isLoginCompleted is not null or undefined, and then evaluate its value
if (isJourneySelfOthers !== null && isJourneySelfOthers !== undefined) {
  
    if (isJourneySelfOthers === "true") {
        nodeLogger.debug("line 41");
        outcome = NodeOutcome.SUCCESS;
    } else {
       nodeLogger.debug("line 44");
          nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Checking if journey is self or others MFA::::: FAILED");
    outcome = NodeOutcome.FAILED;
        outcome = NodeOutcome.FAILED;
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "isJourneySelfOthers is null or undefined.");
    outcome = NodeOutcome.FAILED;
}