var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Enter SMS OTP",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.EnterSMSOTP",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    ANOTHER_FACTOR: "Choose Another Method",
    EXPIRED: "expired",
    RESEND: "Resend Code",
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


// Function to get the OTP from node state
function getOTPFromNodeState() {
    try {
        return nodeState.get("oneTimePassword");
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving OTP from node state: " + error.message);
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


// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :::::: " + userId);
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

function getTelephoneNumber() {
    var userId = getUserId();
    if (userId) {
        var userData = fetchUserData(userId);
        if (userData && userData.telephoneNumber) {
            return userData.telephoneNumber;
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is null or telephone number is not available for user ID: " + userId);
        }
    } else {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID is null or undefined.");
    }
    return null;
}

function getDisplayMessage() {
    getLocale();
    var clocale = nodeState.get("clocale");
    var userEmail = nodeState.get("email")
    var lastLetter = userEmail.split("@")[0]
    lastLetter = lastLetter.slice(-1)
    var nodeStateNumber = getTelephoneNumber()
    if (clocale === "en") {
        var boldoutput = nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4)
        var displayMessage = "A code was sent to " + boldoutput.bold() + ". Enter the code below to verify." + "\n Carrier messaging charges may apply."
    }
    if (clocale === "es") {
        var boldoutput = nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4)
        var displayMessage = "Se envió un código a " + boldoutput.bold() + "Ingrese el código a continuación para verificar." + "\n Es posible que se apliquen cargos por mensajería del operador."
    }

    return displayMessage
}

// Function to handle callback requests
function requestCallbacks() {
    getLocale();
    var clocale = nodeState.get("clocale");
    try {
        if (clocale === "en") {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Callbacks getting built for english");
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)

            }
            callbacksBuilder.textOutputCallback(0, getDisplayMessage())
            callbacksBuilder.passwordCallback("Enter Code", false);
            callbacksBuilder.confirmationCallback(0, ["Verify", "Resend Code", "Verify with something else"], 0);
        }
        else if (clocale === "es") {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Callbacks getting built for spanish");
            if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            callbacksBuilder.passwordCallback("introduce el código", false);
            callbacksBuilder.confirmationCallback(0, ["Verificar", "Reenviar código", "Verificar con otra cosa"], 0);
        }
        else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Unsupported locale: " + clocale);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error requesting callbacks: " + error.message);

    }
}

/**
 * Checks if the provided timestamp is within the expiry time.
 * @param {number} passwordTimestamp - The timestamp of the password creation in seconds.
 * @param {number} passwordExpiryMinutes - The expiry time for the password in minutes.
 * @returns {boolean} - True if within expiry time, false otherwise.
 */

function isWithinExpiryTime(passwordTimestamp, passwordExpiryMinutes) {
    var passwordTimeStampLong = Number(passwordTimestamp);
    var passwordExpiry = passwordTimeStampLong + (passwordExpiryMinutes * 60);
    var currentTimeStampEpoch = Math.ceil((new Date()).getTime() / 1000);
    var withinExpiryTime = (passwordExpiry - currentTimeStampEpoch) > 0 ? true : false;
    return withinExpiryTime;
}



// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getPasswordCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        nodeState.putShared("selectedOutcome", selectedOutcome);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome);

        var otpFromNodeState = getOTPFromNodeState();
        var passwordTimeStamp = nodeState.get("oneTimePasswordTimestamp");

        var isWithinExpiry = isWithinExpiryTime(passwordTimeStamp, 5);

        if (selectedOutcome === 2) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");
            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else if (selectedOutcome === 1) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Resend OTP condition");
            nodeState.putShared("errorMessage", null)
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
            if (!isWithinExpiry) {
                action.goTo(NodeOutcome.EXPIRED);
            }
            else if (password && otpFromNodeState && otpFromNodeState === password) {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");

                nodeState.putShared("errorMessage", null)
                action.goTo(NodeOutcome.VERIFY);
            } else {
                action.goTo(NodeOutcome.FAILED);
            }
        } else if (!password) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Inside the password null condition");

            action.goTo(NodeOutcome.FAILED);
        } else {
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error handling user responses: " + error.message);
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
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}