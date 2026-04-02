/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Incorrect username",
    script: "Script",
    scriptName: "KYID.Journey.IncorrectUsername",
    //error: "Password is expired.",
    timestamp: dateTime
}

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

var nodeOutcome = {
    NEXT: "next"
};


    var errormsg= "ERR-INP-LOG-001 The email or password you entered is invalid. Please reenter the email and password and try again.";
   nodeState.putShared("apireturnederror", errormsg);
  //  logger.error("ErrorMessagePTA:"+errormsg)
    action.goTo(nodeOutcome.NEXT);
  