/**
 * Script: KYID.Joruney.IsCaptchaEnabled
 * Description:  This script is used to check if google recaptcha verification is enabled or not.            
 * Date: 29th Oct 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Is Captcha Enabled",
     script: "Script",
     scriptName: "KYID.Journey.IsCaptchaEnabled",
     captchaIsEnabled: "Authentication requires captcha verification",
     captchaIsNotEnabled: "Authentication doesn't require captcha verification",
     ACCESS_TOKEN_STATE_FIELD: "idmAccessTokenOne",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    FAILURE: "False"
};


// Declare Global Variables
 var missingInputs = [];
 var isCaptchaEnabled = "true";

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

if(systemEnv.getProperty("esv.captcha.enabled") && systemEnv.getProperty("esv.captcha.enabled")!=null) { 
  isCaptchaEnabled = systemEnv.getProperty("esv.captcha.enabled");  
  nodeLogger.debug("Value of isCaptchaEnabled: "+isCaptchaEnabled);
}  

try{
   if(isCaptchaEnabled.localeCompare("true")==0){
       nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.captchaIsEnabled);  
       action.goTo(nodeOutcome.SUCCESS);
    } else {
       nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.captchaIsNotEnabled);  
       action.goTo(nodeOutcome.FAILURE);
    } 
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}
