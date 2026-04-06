var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication IDP-Auth-Type SMS and Voice",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.SetIDPAuthType.SMSAndVoice",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
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


var resultIDPAuthType = []

resultIDPAuthType.push("pwd")

resultIDPAuthType.push("mfa")

resultIDPAuthType.push("sms")

resultIDPAuthType.push("tel")

resultIDPAuthType.push("mca")

nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "*****inside idpauthtype node*****");
nodeState.putShared("anotherFactor", "");
nodeState.putShared("setupAdditionalSecurityMethods", "");
action.goTo(NodeOutcome.SUCCESS).putSessionProperty('idpauthtype', resultIDPAuthType).putSessionProperty('idpauthlevel', "4");