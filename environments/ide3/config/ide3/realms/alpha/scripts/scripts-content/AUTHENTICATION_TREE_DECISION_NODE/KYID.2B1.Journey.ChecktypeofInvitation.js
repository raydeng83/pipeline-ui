var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "CheckRoleExist",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ChecktypeofInvitation",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    INVITATION: "Invitation",
    APPCREATED: "AppCreated",
    ERROR: "Error"
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

    try {
        var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
        var inviteothers = requestParameters.get("inviteothers");
        if(inviteothers){
            logger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::typeofinvitation" +inviteothers)
            if(inviteothers[0] === "true"){
                nodeState.putShared("inviteothers","true")
                action.goTo(NodeOutcome.INVITATION);
            } else if(inviteothers[0] === "false") {
                nodeState.putShared("inviteothers","false")
                action.goTo(NodeOutcome.APPCREATED);
            } else {
                action.goTo(NodeOutcome.ERROR);
            }
        } else {
            nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "query not defined");
        }
        

    } catch (error) {
        var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
        nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving query " + error.message);
    }


