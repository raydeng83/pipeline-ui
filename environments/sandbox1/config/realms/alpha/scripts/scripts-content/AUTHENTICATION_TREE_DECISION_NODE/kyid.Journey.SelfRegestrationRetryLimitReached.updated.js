/**
 * Script: OTPValidationMaxRetry
 * Description: This script checks if the OTP validation has failed due to the maximum retry limit being reached.
 * Node Outcome:
 * - Success: "true"
 */

// Node Config
var dateTime = new Date().toISOString();
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "OTPValidationMaxRetry",
    scriptName: "kyid.Journey.SelfRegestrationRetryLimitReached.updated",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRUE: "true"
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
    nodeLogger.error("******************* Coming here **************");

    if (callbacks.isEmpty()) {
        nodeLogger.error("OTP validation failed - Max Retry Limit Reached.");
        callbacksBuilder.textOutputCallback(1, "maximum_limit_reached");
        nodeState.remove("Secondary_Email");
        nodeLogger.debug("Secondary_Email removed from nodeState.");
        action.goTo(nodeOutcome.TRUE);
    } else {
        nodeLogger.error("Maximum_Limit_Reached.");
        nodeState.remove("Secondary_Email");
        nodeLogger.debug("Secondary_Email removed from nodeState.");
        action.goTo(nodeOutcome.TRUE);
    }

    nodeLogger.debug(nodeConfig.end);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.TRUE);
}