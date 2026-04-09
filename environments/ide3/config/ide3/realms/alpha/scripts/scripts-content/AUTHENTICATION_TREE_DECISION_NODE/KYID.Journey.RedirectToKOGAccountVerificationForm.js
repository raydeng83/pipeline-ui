/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Redirects to KOG Account Verification Form Page",
    script: "Script",
    scriptName: "KYID.Journey.RedirectToKOGAccountVerificationForm",
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
     if(systemEnv.getProperty("esv.kog.accountverification.url") && systemEnv.getProperty("esv.kog.accountverification.url")!=null){
         var kogurl = systemEnv.getProperty("esv.kog.accountverification.url");
         //var url = requestCookies.ReturnURL;
         var url = encodeURIComponent(requestCookies.ReturnURL);  /**** Tableau Issue Fix 24/01 :: 183821, 183826, 183801 ****/
         var link= decodeURIComponent(kogurl)+url;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
         var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
         action.goTo("redirect"); 
      }
 } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
 }
