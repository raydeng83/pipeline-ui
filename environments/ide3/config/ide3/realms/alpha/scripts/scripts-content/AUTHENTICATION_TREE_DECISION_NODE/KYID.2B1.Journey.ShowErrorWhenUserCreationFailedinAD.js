var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ShowErrorWhenUserCreationFailedinAD",
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
    // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside Duplicate Email");

var msg = nodeState.get("errorAPIuserexistsinAD");

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,"KOG ERROR: "+msg);
    
if(nodeState.get("fetchedKOGID")){
    var usrKOGID = nodeState.get("fetchedKOGID");
    callbacksBuilder.textOutputCallback(1,"KOGID: " +usrKOGID);
}
    
callbacksBuilder.textOutputCallback(1,"TransactionID: " +transactionid);
callbacksBuilder.textOutputCallback(1,"UserCreationFailedinAD_ContactHelpdesk");
callbacksBuilder.confirmationCallback(0,[ "Error"],0);
    
} else {
    var option = callbacks.getConfirmationCallbacks()[0];
    if(option === 0)
    action.goTo(NodeOutcome.WAIT);   
    }
    
    
} catch (error) {
     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution "+"::"+error );
    
}
