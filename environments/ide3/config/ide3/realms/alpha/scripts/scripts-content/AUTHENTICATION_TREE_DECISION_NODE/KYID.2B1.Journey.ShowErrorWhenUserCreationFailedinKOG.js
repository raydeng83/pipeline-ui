var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckExistingPrimaryEmail.revised",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    PASS: "pass",
    TRYAGAIN: "try again"
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
    }
};

try {
    // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside Duplicate Email");

var msg = nodeState.get("apireturnederror");
logger.debug("error message" +msg);
if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1, '{"pageHeader":"Patch_Failed_In_KOG"}'); 
if(msg){
callbacksBuilder.textOutputCallback(1,"KOG ERROR: "+ msg);
}
else
{
    var errorMessage = libError.readErrorMessage("ERR-SMW-TEC-000");
    var errorCode = "ERR-SMW-TEC-000";
  //  callbacksBuilder.textOutputCallback(1,"KOG ERROR: "+errorCode);
 //   callbacksBuilder.textOutputCallback(1,"KOG ERROR: "+JSON.stringify(errorMessage));
    callbacksBuilder.textOutputCallback(0,errorCode);
    callbacksBuilder.textOutputCallback(0,JSON.stringify(errorMessage));

}   
callbacksBuilder.confirmationCallback(0,[ "Try again with correct values"],0);
    
} else {
    var option = callbacks.getConfirmationCallbacks()[0];
    if(option === 0)
    action.goTo(NodeOutcome.TRYAGAIN);   
    }
    
    
} catch (error) {
     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in main execution "+"::"+error );
    
}
