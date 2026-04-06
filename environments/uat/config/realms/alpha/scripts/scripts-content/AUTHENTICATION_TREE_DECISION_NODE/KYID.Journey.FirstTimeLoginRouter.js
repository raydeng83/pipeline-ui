var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Redirects to First Time Login",
    script: "Script",
    scriptName: "KYID.Journey.FirstTimeLoginRouter",
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

try {
    if(systemEnv.getProperty("esv.kyid.firsttimelogin.url") && systemEnv.getProperty("esv.kyid.firsttimelogin.url")!=null){
         var firstTimeLoginurl = systemEnv.getProperty("esv.kyid.firsttimelogin.url")
         var url = requestCookies.ReturnURL;
         var link= decodeURIComponent(firstTimeLoginurl)+url;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
         var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
         action.goTo("redirect");  
     }
   } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
   }
 