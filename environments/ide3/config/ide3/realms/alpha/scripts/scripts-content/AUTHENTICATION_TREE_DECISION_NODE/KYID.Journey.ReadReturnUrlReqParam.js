/**
 * Function: KYID.Journey.ReadReturnUrlReqParam
 * Description: This function is used to read URL and cookies from the login request.
 * Date: 13th August 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Read Login Request",
    script: "Script",
    scriptName: "KYID.Journey.ReadReturnUrlReqParam",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "GotoURLPresent",
    ERROR: "GotoURLAbsent"
};

//Logging Function
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

// Declare Global Variables

//Function to check if goto url is present in Request
function isGotoURlPresent() {
    if(nodeState.get("GoToURLPresent")){
        nodeLogger.error("GoToURLPresent is present")
        action.goTo(nodeOutcome.SUCCESS);
    } else {
        nodeLogger.error("GoToURLPresent is absent")
        action.goTo(nodeOutcome.ERROR);
    }
}

// Invoke Main Function
isGotoURlPresent();
   

