var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Symantec Blank OTPError Message",
    script: "Script",
    scriptName: "KYID.2B1.Journey.errormessage.BlankOTP",
    timestamp: dateTime,
    errorMsg_EN: "esv.error.blankotp.en",
    errorMsg_ES: "esv.error.blankotp.es", 
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


/*
  Name: getLocale()
  Description: Reads locale value from clocale cookie
  Returns: If clocale cookie present, returns clocale value. 
           Otherwise, returns default "en" as clocale value.
 */
function getLocale() {
    
   var clocale = "en";
   
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   
   return clocale;
}


// Main Function
function main() {
    
    if(!isMandatoryConfigParamsPresent()){
        action.goTo(nodeOutcome.ERROR);
    }
     else {
         try{
             libFunc = require("KYID.Library.GenericFunctions");
             errorMessage = libFunc.setErrorMessage(getLocale(),errLangMsgJSON);
             nodeState.putShared("errorMessage_BlankOTP",errorMessage);
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
