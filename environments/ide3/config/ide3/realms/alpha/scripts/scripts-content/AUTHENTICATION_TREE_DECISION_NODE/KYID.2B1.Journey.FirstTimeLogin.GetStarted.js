var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
nodeState.putShared("journeyName","createAccount") //RIDP Flow (Added on 27March26)
  // Node Config
  var nodeConfig = {
      begin: "Beginning Node Execution",
      node: "Node",
      nodeName: "Get Started",
      script: "Script",
      scriptName: "KYID.2B1.Journey.FirstTimeLogin.GetStarted",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      ERROR: "error"
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
  

// Main execution
try {
    nodeState.putShared("journeyNameReporting","FirstTimeLoginJourney") 
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
      }
    
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in main execution :: "+  error );
    action.goTo(NodeOutcome.ERROR);
    
}

function requestCallbacks() {
    try {
        var firstName = null;
        var lastName = null;
        if (nodeState.get("firstName")) {
            firstName = nodeState.get("firstName");
        }
        if (nodeState.get("lastName")) {
            lastName = nodeState.get("lastName");
        }
        var firstAndLastName = firstName + " " + lastName
        logger.debug("firstAndLastName " + firstAndLastName)
        var headerObj = {
            "pageHeader": "1_FirstTime_GetStarted",
            "userName":firstAndLastName
            
        }  
        
        // var headerObj={
            // "pageHeader": "1_FirstTime_GetStarted"
            // }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
            callbacksBuilder.confirmationCallback(0, ["Get Started"], 0);
    } catch (error) {
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in requestCallbacks function :: "+  error );
        action.goTo(NodeOutcome.ERROR);
        
    }
    
}
function handleUserResponses() {
    try {

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
        logger.debug("user clicked on get started of login first time")
        action.goTo(NodeOutcome.NEXT);
        }    
        }
    catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error occurred in handleUserResponses function :: "+  error );
        action.goTo(NodeOutcome.ERROR);
        
    }
    
}

