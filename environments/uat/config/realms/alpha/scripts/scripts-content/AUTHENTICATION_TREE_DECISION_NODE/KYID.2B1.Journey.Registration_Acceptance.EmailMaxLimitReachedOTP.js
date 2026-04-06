/**
 * Script: OTPValidationMaxRetry
 * Description: This script checks if the OTP validation has failed due to the maximum retry limit being reached.
 * Node Outcome:
 * - Success: "true"
 */

// Node Config
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");


errMsg["code"] = "ERR-INP-OTP-003";
errMsg["message"] = libError.readErrorMessage("ERR-INP-OTP-003"); 
//nodeState.putShared("errorMessage",JSON.stringify(errMsg));
nodeState.putShared("errorMessage_userlockout",JSON.stringify(errMsg)) //Added for invalidation all otp after max limit retry
logger.debug("errMsg = "+nodeState.get("errorMessage"));


//nodeState.putShared("errorMessage", null)
  //          nodeState.putShared("errorMessage_ExpiredOtp", null)
    //        nodeState.putShared("errorMessage_BlankOTP", null)
      //      nodeState.putShared("resendcodeMessage", null)
        //    nodeState.putShared("maxlimiterror", null);
            nodeState.putShared("resendotpretryCount", null);
            nodeState.putShared("emptyotpretryCount", null);
            nodeState.putShared("incorrectotpretryCount", null);

action.goTo("true");

/*var dateTime = new Date().toISOString();
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
        logger.debug(message);
    }
};

try {
    nodeLogger.debug(nodeConfig.begin);
    nodeLogger.debug("******************* Coming here **************");

    if (callbacks.isEmpty()) {
        
        nodeLogger.debug("OTP validation failed - Max Retry Limit Reached.");
        callbacksBuilder.textOutputCallback(1, "maximum_limit_reached");
        
    } 
    else {
        if(nodeState.get("MaxLimitReachedSkipEmail") == "true"){
        nodeState.putShared("skipEmail","true");
        action.goTo(nodeOutcome.TRUE);
        }
        else{
            // nodeState.putShared("chooseanothermethod","true")
            action.goTo("false");
        }

    }

    nodeLogger.debug(nodeConfig.end);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    // action.goTo(nodeOutcome.TRUE);
}*/
// nodeState.putShared("MaxLimitReachedSkipPhone","true");