/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// JavaScript source code


var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Enter SMS OTP",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.EnterSMSOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    ANOTHER_METHOD: "Choose Another Method",
    RESEND: "Resend Code",
    VERIFY: "Verify",
    FAILED: "false"
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

// Function to get the OTP from node state
function getOTPFromNodeState() {
    try {
        return nodeState.get("oneTimePassword");
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Error retrieving OTP from node state: " + error.message);
        return null;
    }
}

// Function to handle callback requests
function requestCallbacks() {
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
        if (clocale === "en") {
            // English locale
            if (nodeState.get("errorMessage") !=null){
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(2,error)
            }
            callbacksBuilder.passwordCallback("Enter code", false);
            callbacksBuilder.confirmationCallback(0, ["Verify", "Resend Code", "Return to authenticator list"], 0);
        } else if (clocale === "es") {
            if (nodeState.get("errorMessage") !=null){
         var error = nodeState.get("errorMessage");
        callbacksBuilder.textOutputCallback(2,error)
            }
            // Spanish locale
            callbacksBuilder.passwordCallback("introduce el código", false);
            callbacksBuilder.confirmationCallback(0, ["Verificar", "Reenviar Code", "Volver a la lista de autenticadores"], 0);
        } else {
            // Default or unsupported locale
            nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+  "Unsupported locale: " + clocale);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ " Error requesting callbacks: " + error.message);
    }
}

// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getPasswordCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+  "Print Outcome Selected :::: " + selectedOutcome);

        var otpFromNodeState = getOTPFromNodeState();

        if (selectedOutcome === 2) {
            nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+  "Inside the Choose Another Method condition");

            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.ANOTHER_METHOD);
        } else if (selectedOutcome === 1) {
            nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Inside the Resend OTP condition");

            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
            if (password && otpFromNodeState && otpFromNodeState === password) {
                nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Inside the Submit condition");
                outcome = NodeOutcome.VERIFY;
            } else {
                outcome = NodeOutcome.FAILED;
            }
        } else if (!password) {
            nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Inside the password null condition");
            action.goTo(NodeOutcome.FAILED);
        } else {
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Error handling user responses: " + error.message);

        action.goTo(NodeOutcome.FAILED);
    }
}

// Main execution
try {
    var otpFromNodeState = getOTPFromNodeState();
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin+ "Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}
