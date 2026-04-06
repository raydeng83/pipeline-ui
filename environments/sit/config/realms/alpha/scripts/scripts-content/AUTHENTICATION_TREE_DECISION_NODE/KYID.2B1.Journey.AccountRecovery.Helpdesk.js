var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var utilScripts = require("KYID.2B1.Library.GenericUtils copy");

//Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Account Recovery Help Desk Contact",
    script: "Script",
    scriptName: "KYID.2B1.Journey.AccountRecovery.Helpdesk",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "True",
    FALSE: "False",
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

try {
    var lib = require("KYID.2B1.Library.GenericUtils");
    var obj = "KYID Helpdesk";
    var helpdeskItem = lib.getHelpdeskContactInfo(obj);
    var contacts = JSON.parse(helpdeskItem);

    helpdeskObj = {
        "helpDeskEmail": contacts.helpDeskEmail,
        "helpDeskNumber": contacts.helpDeskNumber
    }

    callbacksBuilder.textOutputCallback(0, JSON.stringify(helpdeskObj))
     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "true outcome");
  
    action.goTo(NodeOutcome.TRUE);
  
} catch (e) {
    logger.debug("Main script error: " + e);
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Main script error: " + e);
    action.goTo(NodeOutcome.FALSE);
  
}