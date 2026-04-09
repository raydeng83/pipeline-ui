/**
 * Script: KYID.2B1.Journey.SamePrimaryandSecondaryEmail
 * Description: This script checks if the primary email is used as the secondary email and prompts the user to try again with a different email.
 * Node Outcome:
 * - Try Again: "try again"
 */

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "PrimaryEmailCheck",
    scriptName: "KYID.2B1.Journey.SamePrimaryandSecondaryEmail",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRY_AGAIN: "try again"
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

    var mail = nodeState.get("objectAttributes").get("mail");

    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Primary email: " + mail);

    if (callbacks.isEmpty()) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "displaying primary email prompt");

        callbacksBuilder.textOutputCallback(0, "primary_mail_ " + mail.bold() + "_same_as_secondary_mail");
        callbacksBuilder.confirmationCallback(0, ["Try with different email"], 0);
    } else {
        var option = callbacks.getConfirmationCallbacks()[0];

        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User response option: " + option);

        if (option === 0) {

            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User chose to try with a different email. Proceeding to TRY_AGAIN outcome");

            action.goTo(nodeOutcome.TRY_AGAIN);
        }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.TRY_AGAIN);
}