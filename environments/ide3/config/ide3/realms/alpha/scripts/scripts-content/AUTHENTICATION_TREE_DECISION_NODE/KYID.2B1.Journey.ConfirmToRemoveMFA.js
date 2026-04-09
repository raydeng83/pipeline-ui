var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Confirm to Remove MFA",
    script: "Script",
    scriptName: "KYID.Journey.ConfirmToRemoveMFA",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    Confirm: "Confirm",
    GoBack: "GoBack"
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
    // Logs errors that may impact application functionality
    error: function (message) {
        logger.error(message);
    }
};

var messages = {};
var localeMessages;

function getLocale() {
    var clocale = "en";
    if (requestCookies && Object.keys(requestCookies).length !== 0) {
        if (requestCookies.clocale) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") === 0 || cookieValue.localeCompare("es") === 0) {
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
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Printing the user ID :: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

function processCallbacks(clocale) {
    try {
        // Define locale-specific messages
        messages = {
            en: {
                confirm: "Confirm",
                goback: "Return to authenticator list"
            },
            es: {
                confirm: "Confirmar",
                goback: "Volver a la lista de autenticadores"
            }
        };

        // Get locale-specific messages
        localeMessages = messages[clocale] || messages.en;
        
        var displayMessage = "";
        var methodToRemove = nodeState.get("methodToRemove")      
        // Set appropriate message based on the method to be removed
        if (clocale === "en") {
            if (methodToRemove === "SMSVOICE") {
                var phoneNum = nodeState.get("telephonenumber");
                displayMessage = "Are you sure you want to remove the Phone " + phoneNum.substring(0, phoneNum.length - 10) + " XXX-XXX-" + phoneNum.slice(-4) + " as a MFA method?";
            } else if (methodToRemove === "SYMANTEC") {
                var credId = nodeState.get("credentialId");
                var credIdtobeRemoved = credId.substring(0, 3) + " XXX-XXX-" + credId.substring(credId.length - 3);
                displayMessage = "Are you sure you want to remove the Symantec VIP ID " + credIdtobeRemoved + " as a MFA method?";
            } else if (methodToRemove === "FRTOTP") {
                displayMessage = "Are you sure you want to remove the ForgeRock Authenticator App Code as a MFA method?";
            } else if (methodToRemove === "FRPUSH") {
                displayMessage = "Are you sure you want to remove the ForgeRock Authenticator App Notification as a MFA method?";
            }
        } else {
            if (methodToRemove === "SMSVOICE"){
                var phoneNum = nodeState.get("telephonenumber");
                var displayMessage = "¿Estás seguro de que deseas eliminar el teléfono " + phoneNum.substring(0, phoneNum.length-10) + " XXX-XXX-" + phoneNum.slice(-4) + " como método MFA?"
            }
            if (methodToRemove === "SYMANTEC"){
                var credId = nodeState.get("credentialId");
                var credIdtobeRemoved = credId.substring(0, 3) + " XXX-XXX-" + credId.substring(credId.length - 3);
                var displayMessage = "¿Está seguro de que desea eliminar Symantec VIP ID " + credIdtobeRemoved + " como método MFA?"
            }
            if (methodToRemove === "FRTOTP"){
                var displayMessage = "¿Está seguro de que desea eliminar el código de la aplicación ForgeRock Authenticator como método MFA?"
            }
            if (methodToRemove === "FRPUSH"){
                var displayMessage = "¿Está seguro de que desea eliminar la notificación de la aplicación ForgeRock Authenticator como método MFA?"
            }
        }

        // Set prompt message based on locale
        if (callbacks.isEmpty()) {   
            callbacksBuilder.textOutputCallback(0,`<div class='page-element'>`+displayMessage+`</div>`);
            callbacksBuilder.confirmationCallback(0, [localeMessages.confirm, localeMessages.goback], 0);
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if (selectedOutcome === 0) {
                action.goTo(NodeOutcome.Confirm);
            } else if (selectedOutcome === 1) {
                action.goTo(NodeOutcome.GoBack);
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error processing callbacks: " + error.message);
    }
}

// Main execution
try {
    var clocale = getLocale();
    var userId = getUserId();
    if (userId) {
        processCallbacks(clocale);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
}

