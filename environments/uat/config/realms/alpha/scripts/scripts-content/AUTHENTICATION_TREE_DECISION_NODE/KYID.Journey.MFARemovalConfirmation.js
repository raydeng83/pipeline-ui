var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MFARemoval Method Confirmation",
    script: "Script",
    scriptName: "KYID.Journey.MFARemovalConfirmation",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CONFIRM: "Confirm",
    GOBACK: "Goback"
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

var messages = {};
var localeMessages;

function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);

        return null;
    }
}

function processCallbacks(clocale) {
    try {
        // Define locale-specific messages
        messages = {
            en: {
                registeredMethods:"Would you like to remove the selected MFA Method?",
                confirm: "Confirm",
                goback: "Return to authenticator list"
            },
            es: {
                registeredMethods:"¿Desea eliminar el método MFA seleccionado?",
                confirm: "Confirmar",
                goback: "Volver a la lista de autenticadores"
            }
        };

        // Get locale-specific messages
        localeMessages = messages[clocale] || messages.en;

            if (callbacks.isEmpty()) {    
            if (clocale === "en") {      
                  var methodToRemove = nodeState.get("methodToRemove")
                  if (methodToRemove === "SMSVOICE"){
                    var displaytext = "Phone " + nodeState.get("telephonenumber")
                  }
                  if (methodToRemove === "SYMANTEC"){
                    var displaytext = "Symantec " + nodeState.get("credentialId")
                  }
                  if (methodToRemove === "FRPUSH"){
                    var displaytext = "ForgeRock Push Notification"
                  }
                  if (methodToRemove === "FRTOTP"){
                    var displaytext = "ForgeRock Authenticator app"
                  }

            var displayMessage = "Would you like to remove the " + displaytext + " MFA Method?";
            }

            if (clocale === "es") {        
                var displayMessage = "¿Le gustaría eliminar el método MFA " + displaytext + "?";
                }
            callbacksBuilder.textOutputCallback(0,`<div class='page-element'>${displayMessage}</div>`)
            callbacksBuilder.confirmationCallback(0, [localeMessages.confirm, localeMessages.goback], 0);
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if (selectedOutcome === 0) {
                action.goTo(NodeOutcome.CONFIRM);
            } else if (selectedOutcome === 1) {
                action.goTo(NodeOutcome.GOBACK);
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error processing callbacks: " + error.message);

    }
}


// Main execution
try {
    var clocale = getLocale();
    var userId = getUserId();
    if (userId) {
        processCallbacks(clocale)
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);

}