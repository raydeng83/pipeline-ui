/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Back to Application",
    script: "Script",
    scriptName: "KKYID.JourneyBacktoApplication",
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
    if (requestCookies.get("ReturnURL")){
        var link =requestCookies.get("ReturnURL");
    }
    else{
        var link =systemEnv.getProperty("esv.default.app.url");
    }

    var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
    action.goTo("redirect"); 
 
   } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
   }
 
