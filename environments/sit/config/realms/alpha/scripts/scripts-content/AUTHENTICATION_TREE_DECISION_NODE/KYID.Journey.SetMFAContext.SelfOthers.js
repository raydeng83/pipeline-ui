// var MFAContextCode = 3
// outcome = "true"

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "SetMFAContext&RegistrationAllowed",
    script: "Script",
    scriptName: "KYID.Journey.SetMFAContext&RegistrationAllowed",
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

// var MFAContextCode = 3
// var setMFAContext = JSON.parse(JSON.stringify(nodeState.get("setMFAContext")));
// var setMFAContextJSON = {
//                  "user": nodeState.get("mail"),
//                  "isMFARequired" : setMFAContext.isMFARequired,
//                  "requiredMFAMethodCode": 3,
//                  "isRegistrationAllowed":  "true"
//              }

// nodeState.putShared("setMFAContextt",setMFAContextJSONN);
// var setMFAContext = JSON.parse(JSON.stringify(nodeState.get("setMFAContext")));
// logger.error("printing the line 45 "+ setMFAContext.isMFARequired);
// logger.error("printing the line 46" + setMFAContext.requiredMFAMethodCode);
nodeState.putShared("isJourneySelfOthers", "true");
outcome = NodeOutcome.SUCCESS;