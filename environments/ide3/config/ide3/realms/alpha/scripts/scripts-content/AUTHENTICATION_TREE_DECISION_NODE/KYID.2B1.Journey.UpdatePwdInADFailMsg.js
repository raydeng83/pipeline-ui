var dateTime = new Date().toISOString();
var libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UpdatePwdInADFailMsg",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UpdatePwdInADFailMsg",
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

// Function to set error message
function setErrorMessage() {
var errorMessage = libError.readErrorMessage("ERR-SMW-TEC-000");
var errorCode = "ERR-SMW-TEC-000";
var errors = {};
errors["code"] = errorCode;
errors["message"] = JSON.stringify(errorMessage);
nodeState.putShared("changePasswordValidationError", errors);
   nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Set error message: " + errorMessage);
}

// Main execution
try {
   setErrorMessage();
   outcome = NodeOutcome.SUCCESS; 
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in setting error message: " + error.message);
}