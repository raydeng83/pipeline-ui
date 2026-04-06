/**
 * Script: KYID.Journey.IsManualRiskLevelSelectionEnabled
 * Description:  This script is used to check if manual risk level selection is enabled
 **/

var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Is Manual Risk Level Selection Enabled",
     script: "Script",
     scriptName: "KYID.2B1.Journey.IsManualRiskLevelSelectionEnabled",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Declare Global Variables
 var missingInputs = [];

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
  
var isRiskLevelManualSelectionTest = systemEnv.getProperty("esv.select.risklevel.enabled");
try{
   if(isRiskLevelManualSelectionTest === "true"|| isRiskLevelManualSelectionTest == true || isRiskLevelManualSelectionTest === true) {
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::isRiskLevelManualSelectionTest is ON::Show drop down");  
       action.goTo("manualSelection");
    } else {
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::isRiskLevelManualSelectionTest is OFF::Skip manual selection");  
       action.goTo("skipManualSelection");
    } 
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}