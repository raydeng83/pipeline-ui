/**
 * Script: SelfRegistrationCreateSecondryMFAEmail
 * Description: This script manages MFA registration based on user preferences using the alpha environment.
 * Param(s):
 * Input:
 * - Secondary_Email
 * - email
 * - sms
 * - voice
 * - usrKOGID
 * - MFA_Additional
 * - MFAMethod
 * - MFAMethodEmail
 * Returns: 
 * - Success: MFA registration completed successfully.
 * - Error: MFA registration failed.
 */

// Capture timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "create mail/Phone object",
    scriptName: "SelfRegistrationCreateSecondryMFAEmail",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    SUCCESS: "true"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

nodeLogger.debug(nodeConfig.begin);

// Retrieve values from nodeState
var secondaryEmail = nodeState.get("Secondary_Email");
var email = nodeState.get("email");
var sms = nodeState.get("sms");
var voice = nodeState.get("voice");
var usrKOGID = nodeState.get("usrKOGID");
var mfaAdditional = nodeState.get("MFA_Additional");
var usrMfaValue = nodeState.get("MFAMethod");

nodeLogger.debug("Email: " + email);
nodeLogger.debug("Secondary Email: " + secondaryEmail);
nodeLogger.debug("SMS: " + sms);
nodeLogger.debug("Voice: " + voice);
nodeLogger.debug("usrKOGID: " + usrKOGID);
nodeLogger.debug("MFA Additional: " + mfaAdditional);
nodeLogger.debug("MFA Method: " + usrMfaValue);

// Process MFA Methods
try {
    if (usrMfaValue === "sms") {
        if (mfaAdditional === "add_email") {
            createMFAObject(usrKOGID, "SMS", sms, "ACTIVE");
            createMFAObject(usrKOGID, "SECONDARY_MAIL", secondaryEmail, "ACTIVE");
            nodeLogger.debug("SMS and Secondary Email registered.");
        } else {
            createMFAObject(usrKOGID, "SMS", sms, "ACTIVE");
            nodeLogger.debug("SMS registered.");
        }
    } else if (usrMfaValue === "voice") {
        if (mfaAdditional === "add_email") {
            createMFAObject(usrKOGID, "PHONE_VOICE", voice, "ACTIVE");
            createMFAObject(usrKOGID, "SECONDARY_MAIL", email, "ACTIVE");
            nodeLogger.debug("Voice and Email registered.");
        } else {
            createMFAObject(usrKOGID, "PHONE_VOICE", voice, "ACTIVE");
            nodeLogger.debug("Voice registered.");
        }
    } else {
        createMFAObject(usrKOGID, "SECONDARY_MAIL", secondaryEmail, "ACTIVE");
        nodeLogger.debug("Secondary Email registered.");
    }
    
    nodeLogger.debug("MFA registration completed.");
    action.goTo(nodeOutcome.SUCCESS);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.SUCCESS);
}

/**
 * Creates MFA Object
 * @param {string} usrKOGID 
 * @param {string} method 
 * @param {string} usrMfaValue 
 * @param {string} status 
 */
function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status
    };
    nodeLogger.debug("Creating MFA Object: " + JSON.stringify(mfajsonObj));
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

/**
 * Looks up existing MFA Object
 * @param {string} usrKOGID 
 * @param {string} usrMfaValue 
 * @returns {boolean}
 */
function lookupInMFAObject(usrKOGID, usrMfaValue) {
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
        "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
    });

    if (mfaMethodResponses.result.length > 0) {
        for (var i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (
                mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0
            ) {
                return true;
            }
        }
    }
    return false;
}

nodeLogger.debug(nodeConfig.end);