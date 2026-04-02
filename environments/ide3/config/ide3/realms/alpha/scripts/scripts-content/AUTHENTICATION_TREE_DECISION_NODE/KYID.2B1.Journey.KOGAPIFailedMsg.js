/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Password Expired",
    script: "Script",
    scriptName: "KYID.2B1.Journey.KOGAPIFailedMsg",
    //error: "Password is expired.",
    timestamp: dateTime
}

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

var nodeOutcome = {
    NEXT: "next"
};


/*var transactionId = nodeState.get("transactionId");
var UserNameAttribute = nodeState.get("searchAttribute");
if(UserNameAttribute === "mail"){
    username = nodeState.get("mail").trim();
}else{
    username = nodeState.get("username").trim();
}*/

    //apireturnederror
    //nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + transactionId +"::"+ nodeConfig.error+"::"+username);
    var errormsg=nodeState.get("apireturnederror")
    logger.debug("ErrorMessagePTA:"+errormsg)
    action.goTo(nodeOutcome.NEXT);
  //  action.goTo(nodeOutcome.NEXT);
   //callbacksBuilder.textOutputCallback(0,errormsg)
            
  
  