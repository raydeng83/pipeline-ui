/**
 * Function: KYID.2B1.Journey.DiverttoList
 * Description: This script checks whether the user has chosen another method or if an existing phone is detected.
 * Param(s):
 * Input:
 *                              
 * Returns: 
 * • Success: "true" if the condition is met.
 * • Error: "false" if the condition is not met.
 *
 
 
 */

// Capture timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Divert",
    scriptName: "KYID.2B1.Journey.DiverttoList",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRUE: "true",
    FALSE: "false"
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
    nodeLogger.debug(nodeConfig.begin);

    if(nodeState.get("chooseanothermethod")){
         var chooseAnotherMethod = nodeState.get("chooseanothermethod") 

        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "chooseanothermethod: " + chooseAnotherMethod);

        if (!chooseAnotherMethod || chooseAnotherMethod === null || typeof chooseAnotherMethod === "undefined") {
            chooseAnotherMethod = "false";

            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "chooseanothermethod not set defaulting to false");
        }
    }

    if (nodeState.get("ExistedPhone")){
        
        var existedPhone = nodeState.get("ExistedPhone");

        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "existedPhone:: " + existedPhone);

        if (!existedPhone || existedPhone === null || typeof existedPhone === "undefined") {
            existedPhone = "false";
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "existedPhone not set defaulting to false");
        }
    }
    
    // Evaluate conditions
    if(nodeState.get("invalidPhoneNumber")){
        nodeState.putShared("telephoneNumber", null);
        action.goTo(nodeOutcome.TRUE);
    }
    else if (chooseAnotherMethod === "true" || existedPhone === "true") {
        nodeState.putShared("chooseanothermethod", "false");
        nodeState.putShared("ExistedPhone", "false");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "choose another method is true");
        nodeState.putShared("telephoneNumber", null);
        action.goTo(nodeOutcome.TRUE);
    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "choose another method is false");
        nodeState.putShared("postrecoveryemail", "true")
        action.goTo(nodeOutcome.FALSE);
    }

} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    nodeState.putShared("postrecoveryemail", "true")
    action.goTo(nodeOutcome.FALSE);
}