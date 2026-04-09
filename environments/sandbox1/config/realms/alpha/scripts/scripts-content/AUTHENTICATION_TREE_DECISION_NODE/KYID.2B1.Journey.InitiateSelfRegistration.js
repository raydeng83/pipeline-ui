var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Initiate Self Registration",
    script: "Script",
    scriptName: "KYID.2B1.Journey.InitiateSelfRegistration",
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
};

nodeState.putShared("phoneVerified","false")

if (callbacks.isEmpty()) {
callbacksBuilder.textOutputCallback(1,"don't_have_email")
    action.goTo(NodeOutcome.TRUE);
    } else {    
    action.goTo(NodeOutcome.TRUE); 
    }