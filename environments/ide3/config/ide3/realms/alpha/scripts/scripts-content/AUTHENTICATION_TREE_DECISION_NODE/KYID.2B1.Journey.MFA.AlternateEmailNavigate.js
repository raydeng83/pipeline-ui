
var dateTime = new Date().toISOString();
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Email_Phone_Divert",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFA.Email_Divert",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    SKIP: "skip",
    ERROR: "error",
    UPDATE: "update"
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
    var divertBack = null;
    if(nodeState.get("chooseanothermethod") != null){
    divertBack= nodeState.get("chooseanothermethod");
}
if(divertBack =="true"){
    nodeState.putShared("chooseanothermethod",null);
    action.goTo("next");
}
else if(nodeState.get("backfrommail")== "true"){
    action.goTo("next");
}
else if(nodeState.get("anotherFactor") != null){
    var anotherFactor=nodeState.get("anotherFactor");
    nodeState.putShared("anotherFactor",null);
    action.goTo("back");   
}
else if(nodeState.get("Email_Verification_Status") === "success"){
    nodeState.putShared("Email_Verification_Status",null);
    action.goTo("update");
}
else{
    action.goTo("back");
}
    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    action.goTo("error");    
}



