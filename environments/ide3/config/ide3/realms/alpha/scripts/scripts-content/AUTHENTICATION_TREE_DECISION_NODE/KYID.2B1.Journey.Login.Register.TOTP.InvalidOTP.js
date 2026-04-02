var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var mail = nodeState.get("mail");

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Invalid OTP Message Node",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Login.Register.TOTP.InvalidOTPe",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "reEnterOTP",
      BACK: "back",
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
    },
    info: function (message) {
        logger.info(message);
    }
}


// Main Execution
try {
     if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
     

  } catch (error) {
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message +"::"+mail);
      action.goTo("error");
      
      
  }

// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {
        errMsg["code"] = "ERR-2FA-TVF-000";
        errMsg["message"] = libError.readErrorMessage("ERR-2FA-TVF-000"); 
        // nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Entered Authenticator TOTP is invalid" +"::"+ mail );   
        callbacksBuilder.textOutputCallback(0,JSON.stringify(errMsg))
        
        callbacksBuilder.confirmationCallback(0, ["Re-Enter_OTP", "Back"], 0);
    
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message+"::" +mail );
    }
    
}



function handleUserResponses() {
try {
    var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    var retryTOTPAttempt = 0;
    var retryTOTPAttemptReporting = 0
    if(selectedOutcome === 0){
        if(nodeState.get("retryTOTPAttemptReporting")){
             retryTOTPAttemptReporting = nodeState.get("retryTOTPAttemptReporting")
            retryTOTPAttemptReporting = retryTOTPAttemptReporting + 1
        } else {
             retryTOTPAttemptReporting = 1
        }
        //nodeState.putShared("retryTOTPAttempt",retryTOTPAttempt) //MFA Reporting
        nodeState.putShared("retryTOTPAttemptReporting",retryTOTPAttemptReporting) //MFA Reporting
        action.goTo(NodeOutcome.NEXT);
    }
    else if(selectedOutcome === 1 ){
        nodeState.putShared("BackFromTOTP","true")  
        nodeState.putShared("anotherFactor","anotherFactor")
        action.goTo(NodeOutcome.BACK);
    }
} catch (error) {
   nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error handleUserResponses Function" +error.message+"::"+mail );
    
}
}
    