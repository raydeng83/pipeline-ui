var dateTime = new Date().toISOString()

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MFA Self is Registration Allowed",
    script: "Script",
    scriptName: "KYID.Journey.MFASelf.IsRegistrationAllowed",
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

// var isRegistrationAllowed;
var setMFAContext = nodeState.get("setMFAContext")
var MFAContextCode = setMFAContext.requiredMFAMethodCode;
var isRegistrationAllowed = setMFAContext.isRegistrationAllowed
logger.error("IS Registration Allowed >>>>>>>>>" + typeof isRegistrationAllowed + " | " + isRegistrationAllowed)



nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the is Registration allowed from node state for Registration journey :: " + nodeState.get("isRegistrationAllowed"));


if (isRegistrationAllowed === true) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "Printing the outcome :: Inside true");
    action.goTo("true")
}
else {
    action.goTo(NodeOutcome.FAILED)
}

