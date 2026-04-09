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
      nodeName: "Push Reject Message",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Login.Register.PUSH.RejectMessage",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      RESEND_PUSH: "resendPush",
      BACK: "back"
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
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Failed while Sending ForgeRock Push Notification" +"::"+mail );
     if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
     

  } catch (error) {
      action.goTo("error")
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message+"::"+mail );
      
  }

// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {
        errMsg["code"] = "ERR-2FA-FRP-003";
        errMsg["message"] = libError.readErrorMessage("ERR-2FA-FRP-003"); 
        // nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
            
        callbacksBuilder.textOutputCallback(0, JSON.stringify(errMsg))
        callbacksBuilder.confirmationCallback(0, ["resend_PUSH", "Back"], 1);
    
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message+"::"+mail );
    }
    
}



function handleUserResponses() {
try {
    var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
    if(selectedOutcome === 0){
       // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"ForegRock Push notification is regenerated successfully" +error.message+"::"+mail );
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"ForegRock Push notification is regenerated successfully" +"::"+mail );
        action.goTo(NodeOutcome.RESEND_PUSH);
    }
    else if(selectedOutcome === 1){
         nodeState.putShared("BackPUSH","true") 
        action.goTo(NodeOutcome.BACK);
    }
} catch (error) {
   nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error handleUserResponses Function" +error.message +"::"+mail);
    
}
}
    