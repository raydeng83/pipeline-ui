var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "2B1 MFAAuthentication SymantecVIPVerificationCall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFALoginAuthn.SymantecVIPVerificationCall",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ANOTHER_FACTOR: "AnotherMethod",
    FAILED: "false",
    SINGLE_SYMANTEC: "singlesymantec",
    EMPTY_SECURITY_CODE: "EmptyCode"
};

/**
   * Logging function
   * @type {Function}
   */
var securityCode = "";
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

logger.debug("Started script SYMANTEC");

function maskSymantecID(id) {
    const first4 = id.slice(0, 4);
    const last4 = id.slice(-4);
    const maskedLength = id.length - 8;
    const masked = 'X'.repeat(maskedLength);
    return first4 + masked + last4;
}

function getCredID() {

    var usrKOGID = null;
    var type = "single";
    if (nodeState.get("KOGID") && nodeState.get("KOGID") != null) {
        nodeLogger.debug("Printing KOGID for enduser" + nodeState.get("KOGID"));
        usrKOGID = nodeState.get("KOGID");
    }
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SYMANTEC");

    //var credID = mfaValueArray[0];
    //to handle when user has only one symantec cred registered

    if (mfaValueArray.length == 1) {
        var credID = mfaValueArray[0];
        logger.debug("Single ID found. Cred ID: " + credID);
        nodeLogger.debug("Only one Symantec ID found, navigating to singlesymantec." + mfaValueArray[0]);
        var symID = maskSymantecID(mfaValueArray[0]);
        nodeState.putShared("CredID", credID);
        nodeState.putShared("MaskedCredID", symID);


    } else {
        logger.debug("Multiple Entering");
        var symantecIDs = [];
        var symantecMaskedIDs = [];
        for (var i = 0; i < mfaValueArray.length; i++) {
            var symantecID = "              <TokenIds>" + mfaValueArray[i] + "</TokenIds>";
            var symantecMaskedID = "              <TokenIds>" + maskSymantecID(mfaValueArray[i]) + "</TokenIds>";
            symantecIDs.push(symantecID);
            symantecMaskedIDs.push(symantecMaskedID);
        }
        var indent = "              ";
        symantecIDs.push(indent);
        symantecMaskedIDs.push(indent);
        var credID = String(symantecIDs).replace(/,/g, '');
        logger.debug("Single ID found. Cred ID: " + credID);
        logger.debug("***********Symnatec Array Config: " + String(symantecIDs).replace(/,/g, ''));
        nodeState.putShared("CredID", String(symantecIDs).replace(/,/g, ''));
        nodeState.putShared("MaskedCredID", String(symantecMaskedIDs).replace(/,/g, ''));
        type = "multiple";
    }
    return type;
}




function generateRandomCode() {
    var letters = '';
    for (i = 0; i < 4; i++) {
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        letters += randomChar
    }

    var numbers = '';
    for (j = 0; j < 4; j++) {
        const randomDigit = Math.floor(Math.random() * 10);
        numbers += randomDigit;
    }

    return letters + numbers;

}


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: " + mfaMethodResponses)
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) === 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;
}


// Function to build callbacks based on locale
function buildCallbacks() {
    try {

        logger.debug("Node State: " + nodeState.get("MaskedCredID"));
        var textPrompt, confirmationOptions, displayMessage1, displayMessage2, pageheader;

        var lib = require("KYID.Library.FAQPages");
        var process = "MasterLogin";
        var pageHeader = "2_Verify TOTP";
        //var getFaqTopicId = lib.getFaqTopidId(pageHeader, process);
        //defect 209603 no faqTopic required for this page
        var getFaqTopicId = null;
        var SYMcredID = nodeState.get("MaskedCredID");

        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
        }

        if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorMessage_BlankOTP + `</div>`)
        }

        pageheader = "Enter_your_verification_code"
        textPrompt = "Enter_the_verification_code"
        displayMessage1 = "Enter_the_six-digit_verification_code_displayed_on_your_app";
        displayMessage2 = "Credential ID: " + SYMcredID;
        confirmationOptions = ["Verify", "Back"];
        var jsonobj = { "pageHeader": "2_Verify TOTP" };
        logger.debug("jsonobj : " + jsonobj);
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj))
        callbacksBuilder.textOutputCallback(0, displayMessage1)
        callbacksBuilder.textOutputCallback(0, displayMessage2);
        callbacksBuilder.textInputCallback(textPrompt);
        callbacksBuilder.confirmationCallback(0, confirmationOptions, 0);

        if (getFaqTopicId != null) {

            callbacksBuilder.textOutputCallback(0, "" + getFaqTopicId + "")
        }

    } catch (e) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error building callbacks :: " + e);

    }
}

// Function to handle user responses
function handleUserResponses() {

    try {
        var securityCode = callbacks.getTextInputCallbacks().get(0).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        nodeState.putShared("securityCode", securityCode);
        logger.debug("Security code = " + securityCode);

        if (selectedOutcome === 0) {
            if (securityCode) {
                if (getCredID().localeCompare("single") == 0) {
                    var SymantecTransId = generateRandomCode();
                    nodeState.putShared("Id", SymantecTransId);
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Symantec Transcation ID " + nodeState.get("Id"))
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("errorMessage_BlankOTP", null);
                    nodeState.putShared("anotherFactor", null);
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside single");
                    action.goTo(NodeOutcome.SINGLE_SYMANTEC);
                } else {
                    var SymantecTransId = generateRandomCode();
                    nodeState.putShared("Id", SymantecTransId);
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Symantec Transcation ID " + nodeState.get("Id"))
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside multiple");
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("errorMessage_BlankOTP", null);
                    nodeState.putShared("anotherFactor", null);
                    action.goTo(NodeOutcome.SUCCESS);
                }

            }
            else {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Security Code is Empty");
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("anotherFactor", null);
                action.goTo(NodeOutcome.EMPTY_SECURITY_CODE);


            }


        } else if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP", null);
            var anotherFactor = "anotherFactor";
            nodeState.putShared("anotherFactor", anotherFactor);
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP", null);
            nodeState.putShared("anotherFactor", null);
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (e) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user response ::::: " + e);

    }
}

// Main execution
try {
    if (callbacks.isEmpty()) {
        var usrKOGID = nodeState.get("KOGID");
        logger.debug("userid = " + nodeState.get("KOGID"));
        var credID = getCredID(usrKOGID);
        logger.debug("Creds Type = " + credID);
        buildCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage", null);
    nodeState.putShared("errorMessage_BlankOTP", null);
    nodeState.putShared("anotherFactor", null);
    action.goTo(NodeOutcome.FAILED);
}
