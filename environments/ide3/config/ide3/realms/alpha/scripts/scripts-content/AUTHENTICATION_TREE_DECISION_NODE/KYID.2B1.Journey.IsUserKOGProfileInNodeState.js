/**
 * Script: KYID.Journey.IsUserKOGProfileInSharedState
 * Description: This script is used to check if KOG user profile exist in session.
 * Date: 19th Aug 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Is KOGUserProfile in SharedState",
    script: "Script",
    scriptName: "KYID.Journey.IsUserKOGProfileInSharedState",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKOGProfile: "Missing KOG Profile in sharedState",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    EXIST: "Yes",
    NOT_EXIST: "No"
};

// Declare Global Variables
var missingInputs = [];
var userKOGProfile = "";


//Logging Funcation
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


try{
    nodeState.putShared("lang",getLocale());
    logger.debug("Printing lang" +getLocale());
    if(nodeState.get("kogUserProfileAPIResponse")) {
        logger.debug("InsideExistBlock")
         userKOGProfile = nodeState.get("kogUserProfileAPIResponse"); 
         action.goTo(nodeOutcome.EXIST);
    }  else {
        logger.debug("InsideNotExistBlock")
        missingInputs.push(nodeConfig.missingKOGProfile);
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
        action.goTo(nodeOutcome.NOT_EXIST);
    }
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+error);
}

