/**
 * Function: KYID.Journey.GetJwtFromQueryParam
 * Description: This script is used to get JWT parameter from Request
 * Date: 17th March 2025
 * Author: Deloitte
 */

 var dateTime = new Date().toISOString();

 // Node Config
 var nodeConfig = {
     begin: "Beginning Node Execution",
     node: "Node",
     nodeName: "Get JWT Parameters from Request",
     script: "Script",
     scriptName: "KYID.Journey.GetJwtFromQueryParam",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };
 
 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "True",
     ERROR: "False",
 };
 
 // Declare Global Variables
 var missingInputs = [];
 
 
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


 var oldAssertionJwt = requestParameters.get("jwt");

// Check if the JWT is present and not empty
if (oldAssertionJwt && oldAssertionJwt[0]) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ":: Found old JWT from IG. Falling back to form login." );
    action.goTo(nodeOutcome.SUCCESS);
} else {
    action.goTo(nodeOutcome.ERROR);
}
