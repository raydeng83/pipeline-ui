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
var KOGID;
var UserId;
// Check if KOGID exists in the session and handle accordingly
if (nodeState.get("KOGID") || existingSession.get("KOGID")) {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    KOGID = nodeState.get("KOGID") || existingSession.get("KOGID");
    logger.debug("KOGID :: => " + KOGID);
    UserId = nodeState.get("_id") || existingSession.get("UserId");
    logger.debug("UserId is :: => "+UserId)
    if(UserId){
        nodeState.putShared("_id", UserId)
    }
    // Additional check for empty string
    if (KOGID === null || KOGID === undefined || KOGID === "") {
        nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "KOGID is null, undefined, or empty.");
        action.goTo(NodeOutcome.ERROR);
    } else {
        nodeState.putShared("KOGID", KOGID);
        nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "KOGID found");
        nodeState.putShared("firsttimeloginjourney","true")
        //nodeState.putShared("journeyName","createAccount")
        action.goTo(NodeOutcome.SUCCESS);
    }
} else {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "KOGID Not found in session");
    action.goTo(NodeOutcome.ERROR);
}


