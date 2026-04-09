/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Invalid OTP Error Message",
    script: "Script",
    scriptName: "KYID.Journey.errormessage.EmailSMSVoice.InvalidOTP",
    timestamp: dateTime,
    errorMsg_EN: "esv.errorinvalidotpemailsmsvoice.en",
    errorMsg_ES: "esv.errorinvalidotpemailsmsvoice.es", 
    missingEnglishMsg: "English Message", 
    missingSpanishMsg: "Spanish Message", 
    errorMsg: "Error Message", 
    missingInputParams: "Following mandatory input params are missing", 
    end: "Node Execution Completed"
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
var clocale = "";
var mismatchPasswordErrorMessage = "";


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
             var errorMessage = "invalid_otp";
             nodeState.putShared("errorMessage",errorMessage);
             nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.errorMsg+"::"+errorMessage);
             action.goTo(nodeOutcome.SUCCESS); 
             
         } catch(error) {
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+error);
         }
         
     }
    
}

//Invoke Main Function
main()       

