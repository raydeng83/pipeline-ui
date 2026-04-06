var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Error for Unauthorized User",
    script: "Script",
    scriptName: "KYID.Journey.errormessage.unauthorizedhelpdeskuser",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    REDIRECT: "Click here to redirect to Helpdesk KOG App"
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

// Function to handle callbacks and set the action
function processCallbacks() {
    try {

        var errorMessage = "";
        var redirectMessage = "";
        var clocale = nodeState.get("clocale");

        // Determine error and redirection messages based on locale
        if (clocale === "es") {
            errorMessage = systemEnv.getProperty("esv.errorunauthorizedhelpdeskuser.es");
            redirectMessage = systemEnv.getProperty("esv.redirect.message.unauthorized.helpdesk.user.es");
        } else {
            errorMessage = systemEnv.getProperty("esv.errorunauthorizedhelpdeskuser.en");
            redirectMessage = systemEnv.getProperty("esv.redirect.message.unauthorized.helpdesk.user.en");
        }
        if (callbacks.isEmpty()) {
            // Build confirmation callback
            nodeState.putShared("errorMessage", errorMessage);

            var error = nodeState.get("errorMessage");
           // callbacksBuilder.textOutputCallback(2, error)
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            callbacksBuilder.confirmationCallback(0, [redirectMessage], 0);
        } else {
            // Retrieve the user's choice
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0)
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected outcome: " + selectedOutcome);

            if (selectedOutcome === 0) {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected to Click here to redirect to Helpdesk KOG App.");
                action.goTo(NodeOutcome.REDIRECT);
            } else {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Unexpected user choice or no choice made.");
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error processing callbacks: " + error.message);
    }
}

// Main execution
try {
    getLocale();
    processCallbacks();
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
}
