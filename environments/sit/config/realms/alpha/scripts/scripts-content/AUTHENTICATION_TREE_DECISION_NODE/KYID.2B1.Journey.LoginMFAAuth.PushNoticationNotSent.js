var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication PushNoticationSent",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginMFAAuth.PushNoticationNotSent",
    timestamp: dateTime,
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
    },
        info: function (message) {
        logger.info(message);
    }
};
var mail = nodeState.get("mail") || "";
nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "An unexpected error has occurred while generating the ForgeRock Push notification "+mail);
outcome = NodeOutcome.TRUE;
