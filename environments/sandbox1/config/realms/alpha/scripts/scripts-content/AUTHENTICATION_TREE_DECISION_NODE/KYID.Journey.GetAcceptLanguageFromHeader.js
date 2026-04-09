//Script Created for TFS 182954 on 4-Feb-2025

/**
* Function: KYID.Journey.GetAcceptLanguageFromHeader
* Description: This script is used to extract the language from the accept-language header from the browser
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 04-Feb-2025
* Author: Deloitte
*/

var dateTime = new Date().toISOString();
// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get AcceptLanguage From Header",
    script: "Script",
    scriptName: "KYID.Journey.GetAcceptLanguageFromHeader",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

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


if(requestHeaders.get("accept-language")){
    var acceptLanguageValue = requestHeaders.get("accept-language");
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Accept-Language header in loginMain journey is "+acceptLanguageValue);
    var acceptLanguageValuenew= acceptLanguageValue[0]
    var languagesArray = acceptLanguageValuenew.split(',');
    
    var firstValue = languagesArray[0];
    
    if (firstValue.includes("es") ){
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside Spanish Flow");
        nodeState.putShared("acceptLanguageValue", "es-MX")
        nodeState.putShared("langCookie", "es")
        outcome = "true";
    }
    else{
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside English Flow");
        nodeState.putShared("acceptLanguageValue", "en-US")
        nodeState.putShared("langCookie", "en")
        outcome = "true";
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside English Flow");
    nodeState.putShared("acceptLanguageValue", "en-US")
    nodeState.putShared("langCookie", "en")
    outcome = "true";
}
