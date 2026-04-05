var dateTime = new Date().toISOString();
var phonemaxlimit = nodeState.get("phonemaxlimit")
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Email_Phone_Divert",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance_Email_Phone_Divert",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    SKIP: "skip",
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

// Main Execution

try {
    logger.debug("Phone Status is "+ nodeState.get("phoneStatus"));
    var divertBack = null;
    if(nodeState.get("chooseanothermethod") != null){
    divertBack= nodeState.get("chooseanothermethod");
}
if(divertBack =="true"){
    nodeState.putShared("chooseanothermethod",null);
    action.goTo("back");
}
else if(nodeState.get("phoneStatus")=="true"){
    nodeState.putShared("phoneStatus",null);
    action.goTo("verify");
} else if(nodeState.get("Phone_Verification")){
   nodeState.putShared("Phone_Verification",null);
    nodeState.putShared("phoneReg","true")
   action.goTo("next");
}
else if(nodeState.get("Journey_Phone_Verification")=="back"){
     action.goTo("next");
}
else{
     nodeState.putShared("phoneReg","true")
    action.goTo("next");
}
    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    action.goTo(NodeOutcome.ERROR);    
}

