/**
 * Script: KYID.Journey.IsDomainCIT
 * Description: This script is used to check if user is from CIT domain.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check External Domain User",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IsUserExternal",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingExternalDomain: "Missing External AD Domain Details",
    presentExtDomain: "User present in CIT Domain",
    presentIntDomain: "User present in CHFS Domain",
    end: "Node Execution Completed"
};


// Node outcomes
var nodeOutcome = {
    SUCCESS: "Yes",
    ERROR: "No",
    Neither: "Neither"
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

try{   
    if(nodeState.get("isinternaluser")!=null){
        if(!nodeState.get("isinternaluser")){
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.presentExtDomain);
            action.goTo(nodeOutcome.SUCCESS);
        }
        else{
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.presentIntDomain);
            action.goTo(nodeOutcome.ERROR);
        }
    } else {
          action.goTo(nodeOutcome.Neither);
    }
    
} catch(error){
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
    action.goTo(nodeOutcome.Neither);
}  
  

