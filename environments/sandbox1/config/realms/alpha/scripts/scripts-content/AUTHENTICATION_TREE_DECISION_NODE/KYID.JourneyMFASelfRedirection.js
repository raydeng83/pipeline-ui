/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "KYID.JourneyMFASelfRedirection",
    script: "Script",
    scriptName: "KYID.JourneyMFASelfRedirection",
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
         nodeState.putShared("clocale",clocale);
        if (clocale == null){
            clocale = "en";
        }
    
         var url = systemEnv.getProperty("esv.kyid.tenant.fqdn");
        var journeyName = systemEnv.getProperty("esv.mfaforselfjourneyname");
         var kogurl = url + "/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=" + journeyName + "&clocale=" + clocale + "&locale=" + clocale + "&ForceAuth=true";
       
         var link=kogurl;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+link); 
         var redirect = callbacksBuilder.redirectCallback(link, null, "GET");
         action.goTo("redirect");  
     
   } catch (error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+error); 
   }
 
