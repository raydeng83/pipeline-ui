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
    var divertBack = null;
    if(nodeState.get("chooseanothermethod") != null ){
    divertBack= nodeState.get("chooseanothermethod");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin+"divertBack value is"+ divertBack)
    nodeState.putShared("chooseanothermethod",null);
    action.goTo(NodeOutcome.BACK); 
}

if(nodeState.get("errorMessage") != null){
    action.goTo(NodeOutcome.BACK); 
}
else if(nodeState.get("ExistedPhone") == "true"){
nodeState.putShared("ExistedPhone", null);
action.goTo(NodeOutcome.BACK);    
}
else if(nodeState.get("Journey_Phone_Verification")=="back"){
    logger.debug("KYID.2B1.Journey.Registration_Acceptance_Email_Phone_Divert::back")
    //nodeState.putShared("Journey_Phone_Verification", null);    
    action.goTo(NodeOutcome.NEXT);
}
else if(nodeState.get("Journey_Phone_Verification")=="skip"){
    //nodeState.putShared("Journey_Phone_Verification", null);    
    action.goTo(NodeOutcome.NEXT);
}
else if(nodeState.get("skipPhone")=="true"){
    nodeState.putShared("phoneVerified",null);
    nodeState.putShared("verifiedTelephoneNumber",null);
    nodeState.putShared("chooseanothermethod","false");
    nodeState.putShared("skipPhone","false");
    nodeState.putShared("invalidPhoneNumber",null);
    nodeState.putShared("Phone_Verification","true");
    nodeState.putShared("Journey_Phone_Verification","skip")
    action.goTo(NodeOutcome.SKIP);
}
else if(divertBack == "false"){
    nodeState.putShared("phoneVerified","true");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Verified Telephone Number is"+ nodeState.get("telephoneNumber"))
    nodeState.putShared("verifiedTelephoneNumber",nodeState.get("telephoneNumber"));
    nodeState.putShared("verifiedAlternateEmail",null);
    nodeState.putShared("chooseanothermethod","false");
    nodeState.putShared("Phone_Verification","true");
    action.goTo(NodeOutcome.NEXT);
}
    else if(phonemaxlimit === "true"){
         action.goTo(NodeOutcome.NEXT);
    }

else{
    // nodeState.putShared("verifiedTelephoneNumber",null);
    nodeState.putShared("chooseanothermethod","false");
    action.goTo(NodeOutcome.BACK);
}

    
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" +error );
    action.goTo(NodeOutcome.ERROR);    
}

