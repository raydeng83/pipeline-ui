var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckExistingPrimaryEmail.revised",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    PASS: "pass",
    TRYAGAIN: "try again"
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
    // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside Duplicate Email");

var mail = nodeState.get("collectedPrimaryEmail");

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,mail);    
callbacksBuilder.confirmationCallback(0,[ "Try again with different email"],0);
    
} else {
     nodeState.putShared("collectedPrimaryEmail",null);
    var option = callbacks.getConfirmationCallbacks()[0];
    if(option === 0)
    action.goTo(NodeOutcome.TRYAGAIN);   
    }
    
    
} catch (error) {
     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution "+"::"+error );
    
}

