/**
 * Script: KYID.Journey.GCaptchaV3Status
 * Description:  This function is used to display Login Email to the user and set GCaptcha validation status in the sharedState.             
 * Date: 24th September 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "GCaptcha V3 Verify Status",
     script: "Script",
     scriptName: "KYID.Journey.GCaptchaV3Status",
     gcaptchaV3Status: "Google Captcha V3 Verification Failed",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
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

try{
   nodeState.putShared("gcaptchaV3VerifyFail", true);
   nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.gcaptchaV3Status);  
   action.goTo(nodeOutcome.SUCCESS);
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}



