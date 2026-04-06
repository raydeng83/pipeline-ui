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
    scriptName: "KYID.2B1.Journey.SelfRegestration.Password.Collector.Back.Limit.Reached",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRUE: "true",
    FALSE:"false"
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

function requestCallbacks() {
    logger.debug("Inside requestCallbacks");
 
    try {
       callbacksBuilder.textOutputCallback(1, "max_limit_reached");
        callbacksBuilder.confirmationCallback(0, ["Next"],0);
    } catch (error) {
        logger.error("Error in requestCallbacks: " + error.message);
    }
}
 
function handleUserResponses() {
    try {
        //var inputJsonString = callbacks.getTextInputCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
 
        logger.debug("Selected Outcome: " + selectedOutcome);
 
        if (selectedOutcome === 0) {
        nodeState.putShared("backretrylimitforpassword","true");
        nodeState.putShared("maxlimitforpasswordback",null);
        nodeState.putShared("passwordgobackcount",null);
            action.goTo("true")
        } else {
            logger.debug("User skipped input. Proceeding without action.");
            action.goTo("false")
        }
 
    } catch (error) {
        logger.error("Error in handleUserResponses: " + error.message);
    }
}
 
// Main Execution
try {
    if (callbacks.isEmpty()) {
        logger.debug("Callbacks are empty. Starting user input process.");
        requestCallbacks();
    } else {
        logger.debug("Callbacks exist. Handling user responses.");
        handleUserResponses();
    }
} catch (error) {
    logger.error("Error in main execution: " + error.message);
}