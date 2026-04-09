var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "CheckMFAMethod is SMSorVoice",
    script: "Script",
    scriptName: "KYID.2B1.Journey.SMSorVoice",
    timestamp: dateTime
};

// Node outcomes
var nodeOutcome = {
    SMS: "sms",
    VOICE: "voice"
};

// Logging Function
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

if(nodeState.get("MFAMethod")){
    var MFAMethod=nodeState.get("MFAMethod")
    if(MFAMethod==="sms"){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"mfamethod selected is sms");
    action.goTo(nodeOutcome.SMS);
}
else
{
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"mfamethod selected is voice");
    action.goTo(nodeOutcome.VOICE);
}
}
else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"MFAMethod not in shared state");
}
