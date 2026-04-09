/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//outcome = "true";

// if(nodeState.get("isMFAPerformed") == "isMFAPerformed"){
//     outcome = "true"
// }
// else{
//     outcome="false"
// }

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "isMFAPerformed",
    script: "Script",
    scriptName: "KYID.Journey.isMFAPerformed",
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


// Function to determine the outcome based on the isMFAPerformed state
function determineOutcome() {
    try {
        var isMFAPerformed = nodeState.get("isMFAPerformed");
        
        if (isMFAPerformed === null || isMFAPerformed === undefined) {
            logger.error("The value of isMFAPerformed is null or undefined.");
            outcome = NodeOutcome.FAILED;
        } else if (isMFAPerformed === "true" || isMFAPerformed === true) {
            outcome = NodeOutcome.SUCCESS;
        } else {
            outcome = NodeOutcome.FAILED;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in determining outcome: " + error.message);
        outcome = NodeOutcome.FAILED;
    }
}

determineOutcome();

