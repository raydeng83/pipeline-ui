var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var mail = nodeState.get("mail");
var username = nodeState.get("username");
nodeState.putShared("tempUsername", username);
nodeState.putShared("username", mail)

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Log Push Generated Success Error",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.NavigatePUSHGeneratedSuccessfullyErrorLog",
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
    },
    info: function (message) {
        logger.info(message);
    }
}
nodeState.putShared("BackFromTOTP","true");
//MFA Reporting
var retryPUSHAttempt = 0;
if(nodeState.get("retryPUSHAttempt")){
    retryPUSHAttempt = nodeState.get("retryPUSHAttempt")
    retryPUSHAttempt = retryPUSHAttempt + 1
    } else {
         retryPUSHAttempt = 1
    }
    
    nodeState.putShared("retryPUSHAttempt",retryPUSHAttempt) 
 
nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ForegRock Push notification is generated successfully"+"::"+ mail);
action.goTo(NodeOutcome.SUCCESS);
