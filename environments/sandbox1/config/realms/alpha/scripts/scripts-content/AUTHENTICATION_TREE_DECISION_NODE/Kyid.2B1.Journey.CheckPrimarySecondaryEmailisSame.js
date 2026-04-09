/**
 * Script: Kyid.2B1.Journey.CheckPrimarySecondaryEmailisSame
 * Description: 
 * Node Outcome:
 * - Success: "true"
 * - Pass: "pass"
 */
var dateTime = new Date().toISOString();
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Primary and Secondary Email",
    scriptName: "Kyid.2B1.Journey.CheckPrimarySecondaryEmailisSame",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    SUCCESS: "true",
    PASS: "pass"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

try {
    nodeLogger.error(nodeConfig.begin);

    // Retrieve values from nodeState
    var mail = nodeState.get("objectAttributes").get("mail");
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Mail::" + mail);

    if(nodeState.get("Secondary_Email")){
       var Secondary_Email = nodeState.get("Secondary_Email");
       nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Secondary Email::" + Secondary_Email);

       if (mail === Secondary_Email) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Primary and Secondary emails are the same: " + mail);
        action.goTo(nodeOutcome.SUCCESS);
    } else {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Primary and Secondary emails are the different");
        action.goTo(nodeOutcome.PASS);
    }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.PASS);
}