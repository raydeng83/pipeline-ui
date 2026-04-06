/**
* Function: KYID.Journey.IsValidSessionExist
* Description: This script is used to check existing session of the user.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 28th Dec 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Enable Kerberos Authentication",
    script: "Script",
    scriptName: "KYID.Journey.EnableKerberos",
    missingRequestURLParams: "Following mandatory request URL params are missing",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     KERBEROS_ENABLED: "True",
     KERBEROS_DISABLED: "False",
 };

 // Declare Global Variables
 var kerberosEnabled = false;


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
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.envType+"::"+envType);
}  else {
     missingInputs.push(nodeConfig.missingEnvType);
}

kerberosEnabled = systemEnv.getProperty("esv.kyid.kerberos.enabled"); 

if (kerberosEnabled == null || kerberosEnabled == "") {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: missing kerberos enabled ESV, default to kerberos disabled ");
    action.goTo(nodeOutcome.KERBEROS_DISABLED);
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+":: Kerberos authentication enabled: " + kerberosEnabled);
    
    if (kerberosEnabled && kerberosEnabled.toString().toLowerCase() == 'true') {
        action.goTo(nodeOutcome.KERBEROS_ENABLED);
    } else {
        action.goTo(nodeOutcome.KERBEROS_DISABLED);
    }
}


