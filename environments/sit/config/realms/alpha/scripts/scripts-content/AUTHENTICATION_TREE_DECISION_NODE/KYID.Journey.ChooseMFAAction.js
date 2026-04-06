var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Choose MFA Action",
    script: "Script",
    scriptName: "KYID.Journey.ChooseMFAAction",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    MFAReg: "MFA Registration",
    RemoveReset: "Remove/Reset"
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
                registeredMethods:"You have the below registered security methods.",
                verify: "Register new security method",
                removeReset: "Remove registered security method"
            },
            es: {
                registeredMethods:"<Add Spanish Text>",
                verify: "Registrar nuevos métodos de seguridad",
                removeReset: "Eliminar método de seguridad"
            }
        };

        // Get locale-specific messages
        localeMessages = messages[clocale] || messages.en;

        // Set prompt message based on locale
        var promptMessage = clocale === "es" ? "Acciones del Ministerio de Asuntos Exteriores" : "MFA Actions";

        if (callbacks.isEmpty()) {
            if (nodeState.get("errorRegistrationNotSupportedMessage") != null) {
                //logger.error("line88")
                var error = nodeState.get("errorRegistrationNotSupportedMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)       
            }
            
            if (nodeState.get("noMFALeftToRemove")!= null) {
                //logger.error("line94")
                var error = nodeState.get("noMFALeftToRemove");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)       
            }

            
            //callbacksBuilder.textOutputCallback(0,`<div class='page-element'>${localeMessages.registeredMethods}</div>`)
            //COMMET: ADD Code To Display: User's registered security methods.
            
            callbacksBuilder.confirmationCallback(0, [localeMessages.verify, localeMessages.removeReset], 0);
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if (selectedOutcome === 0) {
                nodeState.putShared("errorRegistrationNotSupportedMessage", null)
                nodeState.putShared("noMFALeftToRemove", null)
                action.goTo(NodeOutcome.MFAReg);
            } else if (selectedOutcome === 1) {
                nodeState.putShared("errorRegistrationNotSupportedMessage", null)
                nodeState.putShared("noMFALeftToRemove", null)
                action.goTo(NodeOutcome.RemoveReset);
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