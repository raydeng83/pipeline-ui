var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ShowErrorWhenUserPrereqFailsinJIT",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    PASS: "pass",
    WAIT: "wait"
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
    // nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside Duplicate Email");

    if(nodeState.get("jituserprereqapierror")){
        var msg = nodeState.get("jituserprereqapierror");
    } else {
        var msg = "JIT API for UserPrereq Failed"
    }


// if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,"KOG ERROR: "+msg);

callbacksBuilder.textOutputCallback(1,"TransactionID: " +transactionid);

} catch (error) {
     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution "+"::"+error );
    
}
