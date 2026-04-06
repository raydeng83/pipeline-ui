/**
 * Function: KYID.Journey.IsClaimsRequired
 * Description: This script is used to check if claims are required or not based on app metadata.
 * Param(s):
 * Input:
 *     <String> credentials              
 *                
 * Returns: 
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Is Claims Required",
    script: "Script",
    scriptName: "KYID.Journey.IsClaimsRequired",
    timestamp: dateTime,
    needClaims: "Required Claims",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Yes",
    ERROR: "No"
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

if(nodeState.get("needClaims")) {
    logger.error("rajatlogs::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.needClaims+"::"+nodeState.get("needClaims"))
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.needClaims+"::"+nodeState.get("needClaims"));
    action.goTo(nodeOutcome.SUCCESS);
    
} else {
    logger.error("rajatlogs::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.needClaims+"::"+nodeState.get("needClaims"))
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.needClaims+"::"+nodeState.get("needClaims"));
    action.goTo(nodeOutcome.ERROR);
}


