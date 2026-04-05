/**
 * Function: KYID.Journey.GetJwtFromQueryParam
 * Description: This script is used to remove error message from Identity Assertion Node
 * Date: 19th March 2025
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Remove Error Message from Identity Assertion Node",
    script: "Script",
    scriptName: "KYID.Journey.RemoveErrorMessage",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
};

// Declare Global Variables
var missingInputs = [];


 // Logging Function
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


  nodeState.putShared("errorMessage", null);
  action.goTo(nodeOutcome.SUCCESS);