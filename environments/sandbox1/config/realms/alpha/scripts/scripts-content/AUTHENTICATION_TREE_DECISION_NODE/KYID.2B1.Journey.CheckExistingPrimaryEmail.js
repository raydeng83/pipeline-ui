var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckExistingPrimaryEmail",
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

nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside Duplicate Email");

var mail = nodeState.get("objectAttributes").get("mail");

var status=nodeState.get("objectAttributes").get("accountStatus");

if(status==="unregistered"){
    var id= nodeState.get("_id");
    openidm.patch("managed/alpha_user/" + id, null, [{"operation":"replace", "field":"accountStatus", "value":"unregistered"}]);
    action.goTo(NodeOutcome.PASS);
}
else{
if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,mail);    
callbacksBuilder.confirmationCallback(0,[ "Try again with different email"],0);
    
} else {
    var option = callbacks.getConfirmationCallbacks()[0];
    if(option === 0)
    action.goTo(NodeOutcome.TRYAGAIN);   
    }
    
}