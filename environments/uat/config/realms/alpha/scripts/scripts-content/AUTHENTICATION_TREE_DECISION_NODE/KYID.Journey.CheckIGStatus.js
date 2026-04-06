/**
 * Script: KYID.Journey.CheckIGStatus
 * Description: This script is used to check heartbeat endpoint of IG.
 * Date: 3rd Dec 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

var nodeConfig = {
  nodeName: "Get KOG User Profile",
  node: "Node",
  nodeName: "Check IG Status",
  script: "Script",
  scriptName: "KYID.Journey.CheckIGStatus",
  timestamp: dateTime,
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

var apiRequest = {
  method: 'GET',
    headers: {
                                "Content-Type": "application/json"
                              }
}
// var apiURL = systemEnv.getProperty("esv.kyid.ig.identity.assertion.url") + '/openig/ping';  
var apiURL = 'https://ig.ide.kyid.ky.gov/openig/ping';  

var apiResponse = httpClient.send(apiURL, apiRequest).get();

if (apiResponse.status === 200) {
  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::IG heartbeat returns 200");
  action.goTo("True");
} else {
  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::IG heartbeat returns invalid Status");
  action.goTo("False");
}