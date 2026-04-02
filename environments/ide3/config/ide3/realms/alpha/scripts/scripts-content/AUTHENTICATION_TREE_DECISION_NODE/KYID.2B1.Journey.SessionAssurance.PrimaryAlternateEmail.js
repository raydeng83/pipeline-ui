logger.debug("**********start sessionAssuranceLevelforMFA****************")
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication sessionAssuranceLevelforMFA PrimaryAlternateEmail",
    script: "Script",
    scriptName: "KYID.2B1.Journey.SessionAssurance.PrimaryAlternateEmail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
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

if(nodeState.get("isMasterLogin") === "true"){
        //nodeState.putShared("MFAMethod","PrimaryAlternateEmail")
        action.goTo(NodeOutcome.SUCCESS).putSessionProperty('sessionAssuranceLevelforMFA', "3");
        logger.debug("**********end sessionAssuranceLevelforMFA****************")
         } else {
            action.goTo(NodeOutcome.SUCCESS)
         }