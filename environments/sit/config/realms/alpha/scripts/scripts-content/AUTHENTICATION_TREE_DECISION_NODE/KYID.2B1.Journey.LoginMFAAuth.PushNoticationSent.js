var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication PushNoticationSent",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginMFAAuth.PushNoticationSent",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"
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

try{
    var username = nodeState.get("tempUsername");
    logger.debug("tempUsername is :: "+nodeState.get("tempUsername"))
nodeState.putShared("username", username);
logger.debug("username"+username);

nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "ForgeRock Push notification is generated successfully "+mail);
outcome = NodeOutcome.TRUE;
} catch (e)
{
  logger.error("forgerock push exception"+e)  
}
