var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthenticationAndRegistration FirstTimeLogin",
    script: "Script",
    scriptName: "KYID,journey.MFAAuthenticationAndRegistration.FirstTimeLogin",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false",
    ERROR: "error"
};

// Declare Global Variables
var KOGID = "";
var userExistinIDM=false; 

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


function main() {
    var mail = nodeState.get("mail");
    var response = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+mail+"\""}, ["mail", "frUnindexedString4"]);
    var firstTimeLogin = response.result[0].frUnindexedString4
    logger.error("********firstTimeLogin value: "+firstTimeLogin)
     logger.error("********firstTimeLogin type: "+typeof firstTimeLogin)
    if(firstTimeLogin === "false") {
         logger.error("********Inside firstTimeLogin false");
        nodeState.putShared("isJourneyRecoveryMFA", "false");
        action.goTo(NodeOutcome.FAILED);
    } else {
          logger.error("********Inside firstTimeLogin else");
        action.goTo(NodeOutcome.SUCCESS);
    }
}

//Invoke Main Function
main() 
