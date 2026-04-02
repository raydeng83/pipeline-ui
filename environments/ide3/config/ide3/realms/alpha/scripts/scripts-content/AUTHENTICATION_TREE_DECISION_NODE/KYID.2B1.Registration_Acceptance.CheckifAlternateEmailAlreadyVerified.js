var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check if Alternate Email_Already_Verified",
    script: "Script",
    scriptName: "KYID.2B1.Registration_Acceptance.CheckifAlternateEmailAlreadyVerified",
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
        logger.debug(message);
    },
    info: function (message) {
        logger.info(message);
    }
}

try {
    // logger.debug("Invoking CheckifAlternateEmailAlreadyVerified")
    // logger.debug("Verified Alternate Email " + nodeState.get("verifiedAlternateEmail"))
    // logger.debug("New Alternate Email " + nodeState.get("alternateEmail"))
    if (nodeState.get("verifiedAlternateEmail") != null) {
        var oldprimaryemail = nodeState.get("verifiedAlternateEmail").toLowerCase();
        logger.debug("oldprimaryemail" + oldprimaryemail);
        if (nodeState.get("alternateEmail") != null) {
            var newprimaryemail = nodeState.get("alternateEmail").toLowerCase();
            logger.debug("newprimaryemail" + newprimaryemail);
        }
        if (newprimaryemail === oldprimaryemail) {
            nodeState.putShared("verificationNotRequired", "true");
            action.goTo(NodeOutcome.TRUE);
        } else {
            nodeState.putShared("verificationNotRequired", "false");
            action.goTo(NodeOutcome.FALSE);
        }
    } else {
        nodeState.putShared("verificationNotRequired", "false");
        action.goTo(NodeOutcome.FALSE);
}
    
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error in main execution"+"::"+error );
    
}

