/**
 * Script: KYID.Joruney.IsCaptchaRequired
 * Description:  This script is used to check if google recaptcha verification is required or not.            
 * Date: 29th Oct 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Is Captcha Required",
     script: "Script",
     scriptName: "KYID.Journey.IsCaptchaRequired",
     captchaIsRequired: "Authentication requires captcha verification",
     captchaIsNotRequired: "Authentication doesn't require captcha verification",  
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};


// Declare Global Variables
 var missingInputs = [];
 var isperftest = "true";

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

if(systemEnv.getProperty("esv.perftest") && systemEnv.getProperty("esv.perftest")!=null) { 
  isperftest = systemEnv.getProperty("esv.perftest");  
  nodeLogger.error("Value of isperftest: "+isperftest)
}  

try{
   if(isperftest.localeCompare("true")==0){
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.captchaIsNotRequired);  
       nodeState.putShared("gcaptchaV3VerifyFail", false);
       action.goTo(nodeOutcome.ERROR);
    } else {
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.captchaIsRequired);  
       action.goTo(nodeOutcome.SUCCESS);
    } 
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}



