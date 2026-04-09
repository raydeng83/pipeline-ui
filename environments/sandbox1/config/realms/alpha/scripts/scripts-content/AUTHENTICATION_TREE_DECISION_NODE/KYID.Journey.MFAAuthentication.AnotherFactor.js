var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Re-enter code Another  factor",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthentication.AnotherFactor",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EXPIRED: "expired",
    ANOTHER_METHOD: "Choose Another Method",
    RESEND: "Resend Code",
    VERIFY: "Verify",
    FAILED: "false",
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
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin +" Error retrieving OTP from node state: " + error.message);

        return null;
    }
}

// Function to handle callback requests
function requestCallbacks() {
    try {
        callbacksBuilder.passwordCallback("One Time Password", false);
        callbacksBuilder.confirmationCallback(0, ["Verify", "Resend Code", "Choose Another Method"], 0);
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin +"Error requesting callbacks: " + error.message);

    }
}

/**
 * Checks if the provided timestamp is within the expiry time.
 * @param {number} passwordTimestamp - The timestamp of the password creation in seconds.
 * @param {number} passwordExpiryMinutes - The expiry time for the password in minutes.
 * @returns {boolean} - True if within expiry time, false otherwise.
 */

function isWithinExpiryTime(passwordTimestamp, passwordExpiryMinutes) {
    // Convert passwordTimestamp to milliseconds
    var passwordDate = new Date(passwordTimestamp * 1000); 

    // Get the current time
    var now = new Date(); 

    // Calculate the expiry time in milliseconds
    var expiryDurationMs = passwordExpiryMinutes * 60 * 1000;

    // Calculate the expiry date
    var expiryDate = new Date(passwordDate.getTime() + expiryDurationMs);

    // Check if the current time is before the expiry date
    var withinExpiryTime = now <= expiryDate;

    // Log debug information
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + `previous: ${passwordDate.toISOString()} \n passwordExpiry (ms): ${expiryDurationMs} \n now: ${now.toISOString()}` + error.message);
    nodeLogger.debug("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin + `withinExpiryTime: ${withinExpiryTime}` + error.message);
    return withinExpiryTime;
}



// Function to handle user responses
function handleUserResponses() {
    try {
        var password = callbacks.getPasswordCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        nodeState.putShared("selectedOutcome", selectedOutcome);
        // logError("Print Outcome Selected :::: " + selectedOutcome);

        var otpFromNodeState = getOTPFromNodeState();
        var expiredPassword = nodeState.get("oneTimePasswordTimestamp")
        var expiredOTPCheck = isWithinExpiryTime(expiredPassword, 5)
        if(expiredOTPCheck){
            action.goTo(NodeOutcome.EXPIRED);
        }

        if (selectedOutcome === 2) {
            // logError("Inside the Choose Another Method condition");
            action.goTo(NodeOutcome.ANOTHER_METHOD);
        } else if (selectedOutcome === 1) {
            // logError("Inside the Resend OTP condition");
            action.goTo(NodeOutcome.RESEND);
        } else if (selectedOutcome === 0) {
            if (password && otpFromNodeState && otpFromNodeState === password) {
                // logError("Inside the Submit condition");
                action.goTo(NodeOutcome.VERIFY);
            } else {
                action.goTo(NodeOutcome.FAILED);
            }
        } else if (!password) {
            // logError("Inside the password null condition");
            action.goTo(NodeOutcome.FAILED);
        } else {
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (error) {
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin +"Error handling user responses: " + error.message);
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
    // logError("Error in main execution: " + error.message);
    // logError("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+ "Error in main execution: " + error.message);
    nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.begin +"Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}