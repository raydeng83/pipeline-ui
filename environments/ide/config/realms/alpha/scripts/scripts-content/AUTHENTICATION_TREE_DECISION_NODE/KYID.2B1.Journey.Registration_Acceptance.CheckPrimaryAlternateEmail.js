var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Primary & Alternate Email are same",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.CheckPrimaryAlternateEmail",
    timestamp: dateTime,
    errorId_emailMatchedwithPrimary:"errorID::KYID014",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
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
    var primaryEmail = null;
    var alternateEmail = null;
    var collectedPrimaryEmail = null;
    if (nodeState.get("collectedPrimaryEmail") != null) {
        collectedPrimaryEmail = nodeState.get("collectedPrimaryEmail").toLowerCase();
    }
    if (nodeState.get("primaryEmail") != null) {
        primaryEmail = nodeState.get("primaryEmail");
    }
    if (nodeState.get("alternateEmail") != null) {
        alternateEmail = nodeState.get("alternateEmail").toLowerCase();
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Primary Email , Collected Primary Email, Alternate Email" + primaryEmail + collectedPrimaryEmail + alternateEmail );

    if (collectedPrimaryEmail != null) {
        if (collectedPrimaryEmail.toLowerCase() == alternateEmail.toLowerCase()) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Alternate Email cannot be same as Primary Email" +nodeConfig.errorId_emailMatchedwithPrimary );
            action.goTo(NodeOutcome.TRUE);
        }
        else {
            nodeState.putShared("addtionalEmailFlag", "true")
            action.goTo(NodeOutcome.FALSE)

        }
    }
    else {

        if (primaryEmail.toLowerCase() == alternateEmail.toLowerCase()) {
            action.goTo(NodeOutcome.TRUE);
        }
        else {
            nodeState.putShared("addtionalEmailFlag", "true")
            action.goTo(NodeOutcome.FALSE);

        }

    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    action.goTo(NodeOutcome.ERROR);
}