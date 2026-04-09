/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UpdateNodeStateInEmail",
    script: "Script",
    scriptName: "KYID.Journey.ForgotPassword.UpdateNodeStateInEmail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
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


var mail = nodeState.get("mail");

if (mail !== null && mail !== undefined) {
    nodeState.putShared("mail", mail);
} else {
    logger.error("The email ID is not present in nodeState or it is null.");
}

outcome = NodeOutcome.SUCCESS;








