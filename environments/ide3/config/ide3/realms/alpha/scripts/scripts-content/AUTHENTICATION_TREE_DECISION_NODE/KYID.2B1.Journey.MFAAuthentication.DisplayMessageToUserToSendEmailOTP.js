var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "DisplayMessageToUser",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.DisplayMessageToUserToSendEmailOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ANOTHERFACTOR: "Another Factor"
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


// Function to get user ID from node state
function getUserId() {
    try {
        //var userId = nodeState.get("_id");
        var userId = "ace845e3-d921-44cc-8b4e-13ba26a39065";
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);

        return null;
    }
}


// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

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

function GetRequestID(){
    var ReqID = "";
    var RequestIDError="";
        if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null){
            logger.debug("Request id is " + requestCookies.get("ReqID"))
            ReqID= requestCookies.get("ReqID")
            if(getLocale()==="es"){
                 RequestIDError = `<br>`+"ID de transacción"+`<br>`+ ReqID
            }
            else{
            RequestIDError = `<br>`+"Transaction ID:"+`<br>`+ ReqID
            }
        }
 

    return RequestIDError
}

function createArray(userEmail) {
    var mfaOptionsArray = []
     logger.debug(" :::::::: Prinintg Email from node state ::::::::: "+ nodeState.get("newemail1"));
    var lastLetter = userEmail.split("@")[0]
    lastLetter = lastLetter.slice(-1)
    var displayMessage = "<div class='page-element'>Send a verification email to " + userEmail + " by clicking on" + " \"Send me an email\"</div>"
    mfaOptionsArray.push(displayMessage)
    return displayMessage
}


function processCallbacks(userEmail,displayMessage) {
    getLocale();
    var clocale = getLocale();
    try {
        if (callbacks.isEmpty()) {
            var lastLetter = userEmail.split("@")[0]
            lastLetter = lastLetter.slice(-1)
            if (clocale === "en") {
                if (nodeState.get("errorMessage") != null) {
                    var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                }
                // var boldoutput = userEmail[0] + "****" + lastLetter + "@" + userEmail.split("@")[1]
                // var displayMessage = "Send a verification email to " + boldoutput.bold() + ' by clicking on "Send me an email"'
                var displayMessage = "<div class='page-element'>Send a verification email to " + userEmail.bold() + ' by clicking on "Send me an email"</div>'
                callbacksBuilder.textOutputCallback(0, displayMessage)
                callbacksBuilder.confirmationCallback(0, ["Send me an email", "Return to authenticator list"], 0);
            }
            else if (clocale === "es") {
                if (nodeState.get("errorMessage") != null) {
                    var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                }

                // var boldoutput = userEmail[0] + "****" + lastLetter + "@" + userEmail.split("@")[1]
                // var displayMessage = "Envíe un correo electrónico de verificación a " + boldoutput.bold() + ' haciendo clic en "Enviarme un correo electrónico"'
                var displayMessage = "Envíe un correo electrónico de verificación a " + userEmail.bold() + ' haciendo clic en "Enviarme un correo electrónico"'
                callbacksBuilder.textOutputCallback(0, displayMessage)
                callbacksBuilder.confirmationCallback(0, ["Enviarme un correo electrónico", "Verificar con otra cosa"], 0);
            }
            else {
                // Default or unsupported locale
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Unsupported locale: " + clocale);
            }
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

            if (selectedOutcome === 0) {
                nodeState.putShared("errorMessage", null)
                logger.debug("Email display message to the user, selected outcome send me an email  ******************** " )
                action.goTo(NodeOutcome.SUCCESS);
            } else if (selectedOutcome === 1) {
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.ANOTHERFACTOR);
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error processing callbacks: " + error.message);
    }
}


// Main execution
function main(){
    try {
        var userEmail = null;
        if(nodeState.get("newemail1") && nodeState.get("newemail1")!=null){
             userEmail = nodeState.get("newemail1");
        }
        logger.debug("***********userEmail in main is: "+userEmail);
        var userId = getUserId();
        logger.debug("Printing the user Id " + userId)
        if (userId) {
            var userData = fetchUserData(userId)
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user data inside Main execution" + userData);
            var displayMessage = createArray(userEmail);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the shared state of the user ::::: " + userEmail);
    
            processCallbacks(userEmail,displayMessage);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
    
    }
}

main();