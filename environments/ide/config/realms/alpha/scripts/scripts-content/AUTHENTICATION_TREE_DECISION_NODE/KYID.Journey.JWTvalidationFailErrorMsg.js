/**
 * Script: 
 * Description:               
 * Date: 29th Oct 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "JWT Validation Fail Error Msg",
    script: "Script",
    scriptName: "KYID.Journey.JWTvalidationFailErrorMsg",
    timestamp: dateTime,
    errorMsg_EN: "esv.jwt.validation.fail.error.msg.en",
    errorMsg_ES: "esv.jwt.validation.fail.error.msg.es", 
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};
 
// Declare Global Variables
var errLangMsgJSON = {};
var clocale = "";


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
    try{
        if(getLocale() === "en") {
            //action.goTo(nodeOutcome.SUCCESS).withErrorMessage(systemEnv.getProperty(nodeConfig.errorMsg_EN));
            action.goTo(nodeOutcome.SUCCESS).withErrorMessage("Please try to login again.");
    
        } else if (getLocale() === "es") {
            //action.goTo(nodeOutcome.SUCCESS).withErrorMessage(systemEnv.getProperty(nodeConfig.errorMsg_ES));
             action.goTo(nodeOutcome.SUCCESS).withErrorMessage("Se ha producido un error inesperado al realizar la operación. Intente iniciar sesión nuevamente.");
        }     
    
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
    }
}


//Invoke Main Function
main() 

