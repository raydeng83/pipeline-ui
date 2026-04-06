var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Registration IDP-Auth-Type FRCode",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.FRCode.SetIDPAuthType",
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

resultIDPAuthType.push("otp")
resultIDPAuthType.push("forgerock")
nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "*****inside idpauthtype node*****");
nodeState.putShared("anotherFactor", "");
nodeState.putShared("setupAdditionalSecurityMethods", "");
action.goTo(NodeOutcome.SUCCESS).putSessionProperty('idpauthtype', resultIDPAuthType).putSessionProperty('idpauthlevel', "5");