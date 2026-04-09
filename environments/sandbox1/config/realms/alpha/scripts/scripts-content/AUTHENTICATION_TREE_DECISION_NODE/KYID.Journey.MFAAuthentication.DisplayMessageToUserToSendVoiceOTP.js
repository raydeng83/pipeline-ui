var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication DisplayMessageToUser",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.DisplayMessageToUserToSendVoiceOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ANOTHER_FACTOR: "Another Factor"
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

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :: " + userId);

        return userId;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}


// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
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

function GetRequestID() {
    var ReqID = "";
    var RequestIDError="";
        if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null){
            logger.error("Request id is " + requestCookies.get("ReqID"))
            if(getLocale()==="es"){
                 RequestIDError = `<br>`+"ID de transacción"+`<br>`+ ReqID
            }
            else{
            RequestIDError = `<br>`+"Transaction ID:"+`<br>`+ ReqID
            }
        }
 

    return RequestIDError
}


function getTelephoneNumber() {
    var userId = getUserId();
    if (userId) {
        var userData = fetchUserData(userId);
        if (userData && userData.telephoneNumber) {
            return userData.telephoneNumber;
        } else {
            nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is null or telephone number is not available for user ID: " + userId);
        }
    } else {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID is null or undefined.");
    }
    return null;
}

function createArray() {
    var nodeStateNumber = null;
    var userEmail = nodeState.get("email");
    var lastLetter = userEmail.split("@")[0];
    lastLetter = lastLetter.slice(-1);
    if(nodeState.get("smsvoice") && nodeState.get("smsvoice")!=null){
        nodeStateNumber  = nodeState.get("smsvoice")
    }
    //var nodeStateNumber = getTelephoneNumber()
    var displayMessage = "Click the below button to receive a verification code on " + nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4) + ". Carrier messaging charges may apply."
    return displayMessage
}

function processCallbacks(displayMessage) {
    getLocale();
    var clocale = nodeState.get("clocale");
    var nodeStateNumber = null;
    try {
        if (callbacks.isEmpty()) {
            var userEmail = nodeState.get("email")
            var lastLetter = userEmail.split("@")[0]
            lastLetter = lastLetter.slice(-1)
            //var nodeStateNumber = getTelephoneNumber()
            if(nodeState.get("smsvoice") && nodeState.get("smsvoice")!=null){
               nodeStateNumber  = nodeState.get("smsvoice")
            }
            if (clocale === "en") {
                if (nodeState.get("errorMessage") != null) {
                    var error = nodeState.get("errorMessage");
                    callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                }

                var boldoutput =  nodeStateNumber.substring(0, nodeStateNumber.length-10) + " XXX-XXX-" + nodeStateNumber.slice(-4)
                var displayMessage = "Send a code via voice call to " + boldoutput.bold() + ". \n Carrier messaging charges may apply."
                callbacksBuilder.textOutputCallback(0, `<div class='page-element'>${displayMessage}</div>`)
                callbacksBuilder.confirmationCallback(0, ["Send voice call", "Return to authenticator list"], 0);
            }
            else if (clocale === "es") {
                if (nodeState.get("errorMessage") != null) {
                    var error = nodeState.get("errorMessage");
                    callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                }
                var boldoutput = nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4)
                var displayMessage = "Enviar un código mediante llamada de voz a " + boldoutput.bold() + ". \n Se pueden aplicar cargos por mensajes del operador."
                callbacksBuilder.textOutputCallback(0, displayMessage)
                callbacksBuilder.confirmationCallback(0, ["Enviar llamada de voz", "Verificar con otra cosa"], 0);
            }
            else {
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Unsupported locale: " + clocale);
            }
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

            if (selectedOutcome === 0) {
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.SUCCESS);

            } if (selectedOutcome === 1) {
                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.ANOTHER_FACTOR);
            }
        }
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error processing callbacks: " + error.message);

    }
}


// Main execution
try {
    var userId = getUserId();
    if (userId) {
        var userData = fetchUserData(userId)
        nodeState.putShared("email", userData.mail)
        var displayMessage = createArray();
        processCallbacks(displayMessage);
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
}