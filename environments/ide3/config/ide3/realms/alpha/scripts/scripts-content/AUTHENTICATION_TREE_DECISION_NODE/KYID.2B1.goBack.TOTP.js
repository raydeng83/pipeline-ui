var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication PushNoticationSent",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginMFAAuth.TOTPLoginSuccess",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false"
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
    },
        info: function (message) {
        logger.info(message);
    }
};
var mail = nodeState.get("mail") || "";


if(nodeState.get("TOTPVerifyNode") == "back"){
    nodeState.putShared("TOTPVerifyNode",null);
   nodeState.putShared("anotherFactor","anotherFactor")
   action.goTo(NodeOutcome.FALSE)
}
else{
    nodeState.putShared("TOTPVerifyNode",null);
    nodeState.putShared("MFAMethod","TOTP")
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "TOTP is initated successfully "+mail);
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "OTP Validation completed successfully"+"::"+mail );
action.goTo(NodeOutcome.TRUE)
}

// if(nodeState.get("TOTPVerifyNode") == "back"){
//      nodeState.putShared("TOTPVerifyNode",null);
//     nodeState.putShared("anotherFactor","anotherFactor")
//     action.goTo("false")
// }
// else{
//      nodeState.putShared("TOTPVerifyNode",null);
//      action.goTo("true")
// }
