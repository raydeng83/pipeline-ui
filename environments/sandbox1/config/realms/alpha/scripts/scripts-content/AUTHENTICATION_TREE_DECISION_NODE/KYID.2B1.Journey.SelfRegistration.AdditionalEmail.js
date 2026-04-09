/**
 * Function: Kyid.Journey.SelfRegistrationAdditionalEmail
 * Description: Additional Email
 * Returns: 
 * • Success: "true" if condition met.
 * • Error: "false" if condition not met.
 */

// Capture timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Additional Email",
    scriptName: "KYID.2B1.Journey.SelfRegistration.AdditionalEmail",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    BACK: "back",
    NEXT: "email",
    SKIP: "skip"
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
    nodeState.putShared("postadditionalemail", "true");
    // Reset retry count
    //nodeState.putShared("0b3b54df-b3b3-4093-a620-a11c50b3c2d1.retryCount", 0);

    // Retrieve values
    if(nodeState.get("telephoneNumber")){
        var telephone = nodeState.get("telephoneNumber");
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "telephoneNumber from shared state" +telephone);
    }
    nodeState.putShared("phoneVerified", "true");
    nodeState.putShared("verifiedTelephone", telephone);
    

    if (callbacks.isEmpty()) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Initiating additional email input");
        callbacksBuilder.textOutputCallback(1, "3_additional_alternate_email");
        callbacksBuilder.textInputCallback("alternate_mail");
        //callbacksBuilder.confirmationCallback(0, ["Back", "Next", "Skip"], 1);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip"], 1);
    } else {
        var value = callbacks.getTextInputCallbacks()[0];
        nodeState.putShared("Secondary_Email", value);
        nodeState.putShared("Additional_Email", value);

        nodeLogger.error("Secondary Email Set: " + value);

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if (selectedOutcome === 1) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected BACK");

            action.goTo(nodeOutcome.BACK);
        } else if (selectedOutcome === 0) {       
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected Verify");
            nodeState.putShared("MFAResponse", selectedOutcome);
            action.goTo(nodeOutcome.NEXT);
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected SKIP");
            
            action.goTo(nodeOutcome.SKIP);
        }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.FALSE);
}