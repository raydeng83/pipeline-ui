/**
 * Script: KYID.2B1.SelfRegistration.CreateSecondryEmailMFAObject
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
    nodeName: "Create Mail and Phone Object",
    scriptName: "KYID.2B1.SelfRegistration.CreateSecondryEmailMFAObject",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    SUCCESS: "true",
    FAILURE: "false"
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
if(nodeState.get("Secondary_Email")){
    var secondaryEmail = nodeState.get("Secondary_Email");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Secondary Email: " + secondaryEmail);
}

if(nodeState.get("email")){
    var email = nodeState.get("email");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email: " + email);
}

if(nodeState.get("sms")){
    var sms = nodeState.get("sms");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SMS: " + sms);
}

if(nodeState.get("voice")){
    var voice = nodeState.get("voice");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Voice: " + voice);
}

if(nodeState.get("usrKOGID")){
    var usrKOGID = nodeState.get("usrKOGID");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "usrKOGID: " + usrKOGID);
}

if(nodeState.get("MFA_Additional")){
    var mfaAdditional = nodeState.get("MFA_Additional");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Additional: " + mfaAdditional);
}
if(nodeState.get("MFAMethod")){
    var usrMfaValue = nodeState.get("MFAMethod");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Method: " + usrMfaValue);
}

// Process MFA Methods
try {
    if (usrMfaValue === "sms") {
        if (mfaAdditional === "add_email") {
            createMFAObject(usrKOGID, "SMS", sms, "ACTIVE");
            createMFAObject(usrKOGID, "SECONDARY_MAIL", secondaryEmail, "ACTIVE");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SMS and Secondary Email registered");
        } else {
            createMFAObject(usrKOGID, "SMS", sms, "ACTIVE");
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SMS registered");
        }
    } else if (usrMfaValue === "voice") {
        if (mfaAdditional === "add_email") {
            createMFAObject(usrKOGID, "PHONE_VOICE", voice, "ACTIVE");
            createMFAObject(usrKOGID, "SECONDARY_MAIL", email, "ACTIVE");
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Voice and Email registered");
        } else {
            createMFAObject(usrKOGID, "PHONE_VOICE", voice, "ACTIVE");
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Voice registered");
        }
    } else {
        createMFAObject(usrKOGID, "SECONDARY_MAIL", secondaryEmail, "ACTIVE");
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"Secondary Email registered");
    }
    
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA registration completed");
    action.goTo(nodeOutcome.SUCCESS);
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.FAILURE);
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
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Creating MFA Object: " + JSON.stringify(mfajsonObj));
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