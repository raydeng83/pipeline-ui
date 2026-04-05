/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Redirect to Login with RoleID",
    script: "Script",
    scriptName: "KYID.2B1.journey.RegistrationAcceptance.RedirectLoginRoleID",
    timestamp: dateTime,
    end: "Node Execution Completed"
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

// var clocale = requestCookies.get("clocale");
var clocale = nodeState.get("SelflangCookie")


try {
    var roleId=nodeState.get("roleId")
    var journeyURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=/alpha&authIndexType=service&authIndexValue=kyid_2b1_login";
    var link = journeyURL+"&roleId="+roleId;
    var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
    action.goTo("redirect"); 
 
   } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
   }
 
