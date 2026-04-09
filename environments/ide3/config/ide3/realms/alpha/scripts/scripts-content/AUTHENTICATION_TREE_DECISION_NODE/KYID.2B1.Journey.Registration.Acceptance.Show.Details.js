var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var autoTesting = systemEnv.getProperty("esv.automation.testing").toLowerCase();
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication TwilioVerificationCheck",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration.Acceptance.Show.Details",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    BACK: "Back",
    CREATE_ACCOUNT: "Create Account",
  
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
};





// Function to handle callback requests
function requestCallbacks() {
    try {    
        if(nodeState.get("verifiedPrimaryEmail") != null){
        primaryEmail=nodeState.get("verifiedPrimaryEmail")
    }
    var usrLastName = null;
    if(nodeState.get("lastName") !=null ){
        usrLastName=nodeState.get("lastName")
    }
    var usrFirstName = null;
    if(nodeState.get("givenName") !=null){
        usrFirstName=nodeState.get("givenName")
    }
    var telephoneNumber = null;
    if(nodeState.get("verifiedTelephoneNumber") !=null ){
        telephoneNumber=nodeState.get("verifiedTelephoneNumber")
    }
    var verifiedAlternateEmail = null;
    if(nodeState.get("verifiedAlternateEmail") !=null ){
        verifiedAlternateEmail=nodeState.get("verifiedAlternateEmail")
    }
           callbacksBuilder.textOutputCallback(0," Legal First Name:"+usrFirstName)
        callbacksBuilder.textOutputCallback(0," Legal Last Name:"+usrLastName)
                callbacksBuilder.textOutputCallback(0,"Primary Email:"+primaryEmail)
        callbacksBuilder.textOutputCallback(0,"Phone Number:"+telephoneNumber)
           callbacksBuilder.textOutputCallback(0,"Alternate Email:"+verifiedAlternateEmail)
            callbacksBuilder.confirmationCallback(0, ["Create Account","Back"], 0);
      

    } catch (error) {
        nodeLogger.error(transactionid+"::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);

    }
}


// Function to handle user responses
function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the handle user response callback ::");
        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :: " + selectedOutcome);

       

        if (selectedOutcome === 0) {
            action.goTo(NodeOutcome.CREATE_ACCOUNT);
        } else if (selectedOutcome === 1) {
          
        
                action.goTo(NodeOutcome.BACK);
            }
       
    } catch (error) {
        nodeLogger.error(transactionid+"::"+ nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
    }
}



// Main execution
try {
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);

}


