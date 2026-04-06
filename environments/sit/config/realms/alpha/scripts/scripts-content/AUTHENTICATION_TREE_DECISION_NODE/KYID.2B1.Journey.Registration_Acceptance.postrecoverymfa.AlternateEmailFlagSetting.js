var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Setting Flags in SharedState Phone_Email_Verification",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.postrecoverymfa.AlternateEmailFlagSettingr",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back"
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
try {
    if (nodeState.get("addtionalEmailFlag") != null){
    nodeState.putShared("addtionalEmailFlag","false");
}
if(nodeState.get("anotherFactor") != null){
    var anotherFactor=nodeState.get("anotherFactor");
}
if(nodeState.get("Phone_Email_Verification") =="back"){
    action.goTo(NodeOutcome.NEXT)
}
else if(nodeState.get("verificationNotRequired") == "true"){
    nodeState.putShared("anotherFactor",null);
    nodeState.putShared("postrecoverymfa","true")
    nodeState.putShared("verifiedAlternateEmail",nodeState.get("alternateEmail"))
    nodeState.putShared("verifiedTelephoneNumber",null)
    action.goTo(NodeOutcome.NEXT)
}

else if(anotherFactor=="anotherFactor"){
    nodeState.putShared("anotherFactor",null);
   action.goTo(NodeOutcome.BACK) 
}
else{
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("verifiedAlternateEmail",nodeState.get("alternateEmail"))
    nodeState.putShared("verifiedTelephoneNumber",null)
    nodeState.putShared("postrecoverymfa","true");
    action.goTo(NodeOutcome.NEXT)
}

    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    
}
