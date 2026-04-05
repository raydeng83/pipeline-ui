var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "SettingMailInNodeStateForADUpdating",
    script: "Script",
    scriptName: "KYID.Journey.ForgotPassword.SettingMailInNodeStateForADUpdating",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Define NodeOutcome object
var NodeOutcome = {
    TRUE: "true",
    FALSE: "false"
};

// Function to log errors
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
    var mail = nodeState.get("mail");
    if (mail && typeof mail === 'string' && mail.trim() !== "") {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the email for the expired password script :: " + mail);
        nodeState.putShared("mail", mail);
        action.goTo(NodeOutcome.TRUE);
    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Mail is either null, empty, or invalid in nodeState.");
        action.goTo(NodeOutcome.FALSE);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An error occurred: " + error.message);
    action.goTo(NodeOutcome.FALSE);
}