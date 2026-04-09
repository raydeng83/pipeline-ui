/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Existing Phone Error Message",
    script: "Script",
    scriptName: "KYID.2B1.journey.Registration_Acceptance_PhoneRegistration.Existing_Phone_number_Message",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"
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
}
var telephone=nodeState.get("telephoneNumber");

if(callbacks.isEmpty()){
callbacksBuilder.textOutputCallback(1,telephone);    
callbacksBuilder.confirmationCallback(0,[ "Try again with different Phone Number"],0);
    
}else
{
    var option = callbacks.getConfirmationCallbacks()[0];

    if(option === 0)
    {
        nodeState.putShared("telephoneNumber",null);
        nodeState.putShared("ExistedPhone","true")
        action.goTo("try again");   
    }
    
}