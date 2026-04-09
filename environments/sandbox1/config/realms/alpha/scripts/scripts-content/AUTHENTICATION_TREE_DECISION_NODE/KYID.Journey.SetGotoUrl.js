/**
 * Script: KYID.Journey.SetGotoUrl
 * Description: This script is used to get the app URL to goto 
 * Date: 10th Jan 2025
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Set Goto URL",
    script: "Script",
    scriptName: "KYID.Journey.SetGotoUrl",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Logging Function
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

var goto;
var langCookie;

try {
    

    if(requestParameters && requestParameters.get("goto") && requestParameters.get("goto") != null) {
            
            goto = requestParameters.get("goto").get(0);
        
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
            +nodeConfig.script+"::"+nodeConfig.scriptName + ":: goto App URL is " + goto); 
        
            nodeState.putShared("failureUrl", goto);

            if(requestParameters && requestParameters.get("lang") && requestParameters.get("lang") != null) {
                langCookie = requestParameters.get("lang").get(0);

                nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
            +nodeConfig.script+"::"+nodeConfig.scriptName + ":: setting language to " + langCookie); 

                nodeState.putShared("langCookie", langCookie);

                if (langCookie.toLowerCase() == "en") {
                    nodeState.putShared("userLanguagePreference", "en-US");
                } else if (langCookie.toLowerCase() == "es") {
                    nodeState.putShared("userLanguagePreference", "es-MX");
                }

                action.goTo("SetLang");
            } else {
                action.goTo("True");      
            }
            
    } else {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
        +"::"+nodeConfig.scriptName+":: goto URL is not present in the request URL parameter");   

        action.goTo(nodeOutcome.False);   
    }
} catch (error) {

    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
        +"::"+nodeConfig.scriptName+"::"+error);   

    action.goTo("False");       
}


