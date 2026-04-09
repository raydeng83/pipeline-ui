var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check Existing PhoneNumber",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckExistingPhoneNumber",
    timestamp: dateTime
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "true",
    ERROR: "false"
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

if(nodeState.get("telephoneNumber")){
    var telephone=nodeState.get("telephoneNumber");
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+telephone);
}

function lookupInPhone(telephone) {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"lookupInPhone");

    var mfaMethodResponses = openidm.query("managed/alpha_user", { "_queryFilter": '/telephoneNumber eq "' + telephone + '"' });
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"mfaMethodResponses in lookupInPhone "+mfaMethodResponses );

    if (mfaMethodResponses.result.length > 0) {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"mfaMethodResponses is more than one");
                return true;
            }
}

if(lookupInPhone(telephone)){
nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"lookupinphone gives true result");

    action.goTo("true")
}
else{
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"phonenumber is not existing");

    action.goTo("false")
}