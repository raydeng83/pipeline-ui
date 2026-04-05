// JavaScript source code
// nodeState.putShared("errorMessage","ERROR: Invalid OTP. Please re-enter");
// outcome = "true"

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UpdatePwdInADFailMsg",
    script: "Script",
    scriptName: "KYID.Journey.UpdatePwdInADFailMsg",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
};

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
   nodeState.putShared("clocale", clocale);
   return clocale;
}

// Function to set error message based on locale
function setErrorMessage() {
   var clocale = getLocale();
   var errorMessage = "";

   if (clocale === "es") {
       errorMessage = systemEnv.getProperty("esv.error.passwordupdatefailed.es");
   } else {
       errorMessage = systemEnv.getProperty("esv.error.passwordupdatefailed.en");
   }
   
   nodeState.putShared("errormessagepwdUpdateFailedinAD", errorMessage);
   nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Set error message: " + errorMessage);
}

// Main execution
try {
   setErrorMessage();
   outcome = NodeOutcome.SUCCESS; 
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in setting error message: " + error.message);
   }
