var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check Phone Number",
    script: "Script",
    scriptName: "KYID.CollectedPhoneNumberCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VALID: "Valid Phone Number",
    INVALID: "Invalid Phone Number"
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

function isValidPhoneNumber(number) {
    // Regex to match a '+' followed by one or more digits
    const phoneRegex = /^\+\d[\d\s\-()]*$/;
    return phoneRegex.test(number);
}

// Retrieve the phone number from nodeState
var collectedPhoneNumber = nodeState.get("telephoneNumber");

// Check if the phone number is valid
if (!collectedPhoneNumber || !isValidPhoneNumber(collectedPhoneNumber)) {
    // Log for debugging
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Invalid phone number detected: " + collectedPhoneNumber);
    action.goTo(NodeOutcome.INVALID);
} else {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Valid phone number: " + collectedPhoneNumber);
    action.goTo(NodeOutcome.VALID);
}
