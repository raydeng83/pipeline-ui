var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "CheckMFAMethod is SMSorVoice",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance_PhoneRegistration.SMSorVoice",
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

if(nodeState.get("MFAMethod") != null){
    var MFAMethod=nodeState.get("MFAMethod")
    if(MFAMethod==="sms"){
    action.goTo(nodeOutcome.SMS);
}
else if(MFAMethod==="voice")
{
    action.goTo(nodeOutcome.VOICE);
}
}
else {
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"MFAMethod not in shared state");
}
