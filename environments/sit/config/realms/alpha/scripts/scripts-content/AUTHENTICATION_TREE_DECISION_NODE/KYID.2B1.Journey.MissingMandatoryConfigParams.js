/**
 * Script: 
 * Description:               
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Missing Mandatory Configuration Parameters",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MissingMandatoryConfigParams",
    timestamp: dateTime,
    errorMsg_EN: "esv.missing.required.config.params.msgen",
    errorMsg_ES: "esv.missing.required.config.params.msges", 
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};
 
// Declare Global Variables
var missingInputs = [];
var errLangMsgJSON = {};
var libFunc = "";

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

// Function to set error message
function setErrorMessage() {
    var errorMessage = systemEnv.getProperty(nodeConfig.errorMsg_EN);  // Default to English error message
   
    nodeState.putShared("errormessage", errorMessage);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Set error message: " + errorMessage);
}

// Main execution
function main() {
    try {
        setErrorMessage();
        action.goTo(nodeOutcome.SUCCESS).withErrorMessage(nodeState.getShared("errormessage"));
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
}

// Invoke Main Function
main();