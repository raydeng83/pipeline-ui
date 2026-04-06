/**
* Function: KYID.Journey.KYID.Journey.KYAuthService
* Description: This script is to query parameter to enable Kerberos or not.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 3rd Jan 2025
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check KYAuthService Query Parameter",
    script: "Script",
    scriptName: "KYID.Journey.KYAuthService",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     KERBEROS: "Kerberos",
     PASSTHROUGH: "Passthrough",
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

if(systemEnv.getProperty("esv.environment.type") != "" && systemEnv.getProperty("esv.environment.type") != null) {
    envType = systemEnv.getProperty("esv.environment.type"); 
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType);
}  else {
     missingInputs.push(nodeConfig.missingEnvType);
}

var kyAuthService = requestParameters.get("kyAuthService");

if (kyAuthService && String(kyAuthService.get(0)).toLocaleLowerCase() === "kerberos") {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: found kyAuthService URL query parameter as kerberos ");
    
    action.goTo(nodeOutcome.KERBEROS);
} else if (kyAuthService && String(kyAuthService.get(0)).toLocaleLowerCase() === "passthrough") {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: found kyAuthService URL query parameter as passthrough ");

    action.goTo(nodeOutcome.PASSTHROUGH);
} else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: no kyAuthService URL query parameter is present, default to Kerberos authentication ");

    action.goTo(nodeOutcome.KERBEROS);
}
