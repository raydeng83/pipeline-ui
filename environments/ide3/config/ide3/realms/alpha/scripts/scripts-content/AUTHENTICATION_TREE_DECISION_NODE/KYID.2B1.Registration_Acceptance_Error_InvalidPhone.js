// var invalidPhoneNumbererror = "invalid_phone_number";
// logger.error("Invalid Phone Number");
// nodeState.putShared("invalidPhoneNumber","invalid_phone_number");
// action.goTo("true");

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Invalid Phone Number",
    script: "Script",
    scriptName: "KYID.2B1.Registration_Acceptance_Error_InvalidPhonet",
    timestamp: dateTime,
    errorMessage:"invalid_phone_number",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"
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
}

try {
    nodeState.putShared("validationErrorCode",nodeConfig.errorMessage);
    action.goTo(NodeOutcome.TRUE);
    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    
}
