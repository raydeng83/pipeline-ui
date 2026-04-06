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

var msg = "User creation failed in KOG. Retry after sometime"

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,msg);
//callbacksBuilder.textOutputCallback(1,"user creation failed in AD");
callbacksBuilder.confirmationCallback(0,[ "Error"],0);
    
} else {
    var option = callbacks.getConfirmationCallbacks()[0];
    if(option === 0)
    action.goTo(NodeOutcome.WAIT);   
    }
    
    
} catch (error) {
     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution "+"::"+error );
    
}
