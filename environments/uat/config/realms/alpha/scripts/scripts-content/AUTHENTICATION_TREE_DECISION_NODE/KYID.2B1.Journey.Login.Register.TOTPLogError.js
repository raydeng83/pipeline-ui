var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "TOT Log Error for Failure",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.TOTPLogError",
    timestamp: dateTime,
    errorId_InvalidPhoneNumber:"errorID::KYID011",
    errorId_MaxLimitExceed:"errorID::KYID012",
    errorId_SMSFailed:"errorID::KYID013",
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
    },
    info: function (message) {
        logger.info(message);
    }
}

//main
var mail = nodeState.get("mail");
nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP initiation failed for"+"::"+mail);
action.goTo(NodeOutcome.SUCCESS);

