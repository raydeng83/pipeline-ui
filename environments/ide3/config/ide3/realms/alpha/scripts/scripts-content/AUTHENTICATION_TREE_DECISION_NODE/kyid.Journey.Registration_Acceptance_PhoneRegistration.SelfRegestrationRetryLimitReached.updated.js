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
        
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");


errMsg["code"] = "ERR-INP-OTP-003";
errMsg["message"] = libError.readErrorMessage("ERR-INP-OTP-003"); 
nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));

 action.goTo("maxlimit");

    } else {

        if(nodeState.get("isPhoneEditable") == false){
        nodeState.putShared("skipPhone","true");
        nodeLogger.error("phone is not editable");
        action.goTo(nodeOutcome.TRUE);
        }
        else if(nodeState.get("MaxLimitReachedSkipPhone") == "true"){
        nodeState.putShared("skipPhone","true");
        nodeLogger.error("setting skipPhone to true");
        action.goTo(nodeOutcome.TRUE);
        }
        else if(nodeState.get("MaxLimitReachedSkipPhone") == "false"){
         nodeState.putShared("chooseanothermethod",null);
        nodeLogger.error("MaxLimitReachedSkipPhone to false");
         action.goTo("false");
        }
        else{
            nodeState.putShared("chooseanothermethod","true")
            nodeLogger.error("user chose another method");
            action.goTo("back");
        }

    }

    nodeLogger.error(nodeConfig.end);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo("false");
}
// nodeState.putShared("MaxLimitReachedSkipPhone","true");