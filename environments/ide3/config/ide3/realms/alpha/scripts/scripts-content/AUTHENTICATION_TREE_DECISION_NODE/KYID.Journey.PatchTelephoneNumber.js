var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch Telephone Numebr",
    script: "Script",
    scriptName: "KYID.Journey.PatchTelephoneNumber",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
  };

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

try {
    // Retrieve user ID and check if it's valid
    var userId = nodeState.get("_id");
    if (!userId) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: User ID is null or undefined.");
        action.goTo(NodeOutcome.FAILED);
    }

    // Retrieve telephone number and check if it's valid
    var telephoneNumber = nodeState.get("telephoneNumber");
    if (telephoneNumber === null || telephoneNumber === undefined) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: Telephone number is null or undefined.");
        action.goTo(NodeOutcome.FAILED);
    }

    // Log the telephone number for debugging purposes
    nodeLogger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " telephoneNum ***" + telephoneNumber);

    // Perform the patch operation to update the user's telephone number
    var result = openidm.patch("managed/alpha_user/" + userId, null, [{"operation": "add","field": "telephoneNumber","value": telephoneNumber }]);

    // Check if the patch operation was successful
    if (result) {
        action.goTo(NodeOutcome.SUCCESS);
    } else {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: Failed to patch telephone number for user ID: " + userId);
        action.goTo(NodeOutcome.FAILED);
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}