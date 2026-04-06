/**
 * Script: KYID.Journey.EmptyPasswordErrorMsg
 * Description: This script is used to display error message.             
 * Date: 7th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Empty Password Error Msg",
    script: "Script",
    scriptName: "KYID.2B1.Journey.EmptyPasswordErrorMsg",
    timestamp: dateTime,
    errorMsg_EN: "esv.emptypassworderrormsg.en",
    errorMsg_ES: "esv.emptypassworderrormsg.es", 
    missingEnglishMsg: "English Message", 
    missingSpanishMsg: "Spanish Message", 
    errorMsg: "Error Message", 
    missingInputParams: "Following mandatory input params are missing", 
    end: "Node Execution Completed",
    email: "Email"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};
 
// Declare Global Variables
var missingInputs = [];
var errLangMsgJSON = {};
var libFunc = "";
var emptyPasswordErrorMessage = "";


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


/*
  Name: isMandatoryConfigParamsPresent()
  Description: Checks whether mandatory configuration parameters are present or not.
  Returns: If mandatory configuration parameters are present, returns True. 
           Otherwise, returns False.
 */
function isMandatoryConfigParamsPresent(){
    
    if(systemEnv.getProperty(nodeConfig.errorMsg_EN) && systemEnv.getProperty(nodeConfig.errorMsg_EN)!=null){
         errLangMsgJSON["en"] = systemEnv.getProperty(nodeConfig.errorMsg_EN);
    } else {
        missingInputs.push(nodeConfig.missingEnglishMsg);
    }
    
    if(systemEnv.getProperty(nodeConfig.errorMsg_ES) && systemEnv.getProperty(nodeConfig.errorMsg_ES)!=null){
        errLangMsgJSON["es"] = systemEnv.getProperty(nodeConfig.errorMsg_ES);
    } else {
        missingInputs.push(nodeConfig.missingSpanishMsg);
    }
    
    if(missingInputs.length>0){
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
        return false;
        
    } else {
        return true;
    }
}

// Main Function
function main() {
    
    if(!isMandatoryConfigParamsPresent()){
        action.goTo(nodeOutcome.ERROR);
    }
     else {
         try{
             libFunc = require("KYID.Library.GenericFunctions");
             // Removed locale-related code and defaulted to English
             emptyPasswordErrorMessage = libFunc.setErrorMessage("en", errLangMsgJSON);
             nodeState.putShared("emptyPasswordErrorMessage", emptyPasswordErrorMessage);
             nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                     + "::" + nodeConfig.scriptName + "::" + nodeConfig.errorMsg + "::" + emptyPasswordErrorMessage);
             action.goTo(nodeOutcome.SUCCESS); 
             
         } catch(error) {
             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
                     + "::" + nodeConfig.scriptName + "::" + error + "::" + nodeConfig.email + "::" + nodeState.get("mail"));
         }
     }
}

// Invoke Main Function
main();