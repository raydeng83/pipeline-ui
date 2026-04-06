/**
* Function: KYID.Journey.HomeUrlRedirect
* Description: This script is used to failureURL to KOG home .
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 23th Jan 2025
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Setting Failure URL",
    script: "Script",
    scriptName: "KYID.Journey.HomeUrlRedirect",
    timestamp: dateTime,
    end: "Node Execution Completed"
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
var redirect_uri = systemEnv.getProperty("esv.kyid.kog.home.url");  

nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"
                     +nodeConfig.scriptName+"::setting failureURL for KOG home redirect to " + redirect_uri);
   


nodeState.putShared("failureUrl", redirect_uri);

action.goTo("True");


