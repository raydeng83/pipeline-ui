/**
 * Function: Email_Mobile_Authentication 
 * Description: This function is used to check whether authentication needs to done via email or mobile.
 * Param(s):
 * Input:
 *     <String> credentials              
 *                
 * Returns: 
 * Date: 18th March 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Create User With KOG Profile",
    script: "Script",
    scriptName: "KYID.Journey.CreateUserInPingAIC",
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

// Node outcomes
var nodeOutcome = {
    MAIL: "mail",
    PHONE: "telephoneNumber"
};

nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +nodeConfig.begin);

var userInput = nodeState.get("username");

// Check whether the input is mail or phone
 function isEmail(userInput) {
  return userInput.includes("@");
 }

var searchAttribute = isEmail(userInput) ? "mail" : "telephoneNumber";
nodeState.putShared("searchAttribute",searchAttribute);
if (searchAttribute === "mail") {
     action.goTo(nodeOutcome.MAIL);
} else {
   action.goTo(nodeOutcome.PHONE);
}

