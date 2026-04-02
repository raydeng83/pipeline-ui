/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// callbacksBuilder.textOutputCallback(0, "code_verification_failed");
// outcome = "true";

var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication PushNoticationSent",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginMFAAuth.TOTPLoginFail",
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
if(nodeState.get("TOTPVerifyNode")){
if(nodeState.get("TOTPVerifyNode") === "back"){
    nodeState.putShared("BackFromTOTP","true")  
    nodeState.putShared("anotherFactor","anotherFactor")
nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "User selected back "+mail);
outcome = NodeOutcome.FALSE;    
} else {
    nodeState.putShared("invalidtotp","true");
    //MFA Reporting
    var retryTOTPAttempt = 0;
        if(nodeState.get("retryTOTPAttempt")){
             retryTOTPAttempt = nodeState.get("retryTOTPAttempt")
            retryTOTPAttempt = retryTOTPAttempt + 1
        } else {
             retryTOTPAttempt = 1
        }
        nodeState.putShared("retryTOTPAttempt",retryTOTPAttempt) //MFA Reporting
        
    outcome = NodeOutcome.TRUE;
}
} else {
nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "TOTP initiation failed for "+mail);
nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "The OTP entered by the user is invalid"+mail);
nodeState.putShared("invalidtotp","true");
outcome = NodeOutcome.TRUE;
}

