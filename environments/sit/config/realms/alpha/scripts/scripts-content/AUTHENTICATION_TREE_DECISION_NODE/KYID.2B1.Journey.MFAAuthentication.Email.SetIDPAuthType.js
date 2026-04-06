var dateTime = new Date().toISOString();

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication Email Set IDP Auth Type",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.Email.SetIDPAuthType",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
};

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
  resultIDPAuthType.push("email")

nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "***Inside idpauthtype node***");
nodeState.putShared("anotherFactor", "");
action.goTo(NodeOutcome.SUCCESS).putSessionProperty('idpauthtype', resultIDPAuthType).putSessionProperty('idpauthlevel', "3");