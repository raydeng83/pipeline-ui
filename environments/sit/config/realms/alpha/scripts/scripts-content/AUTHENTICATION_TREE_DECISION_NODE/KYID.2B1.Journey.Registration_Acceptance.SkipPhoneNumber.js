var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var lib = require("KYID.Library.FAQPages");
var process ="SelfRegistration";
var pageHeader= "3_account_recovery";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Registration Acceptance SkipPhoneNumber",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.SkipPhoneNumber",
    timestamp: dateTime,
    errorId_emailValidation:"errorID:KYID007",
    errorId_InvalidPhoneNumber:"errorID::KYID011",
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EMAIL: "email",
    PHONE: "phone",
    INVALID_EMAIL: "invalidEmail",
    INVALID_PHONE:"invalidPhone",
    DONTVERIFY:"dontverify",
    ERROR: "error",
    BACK: "back"
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

// Main Execution
main();



// Functions
function isValidEmail(email) {
    try {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error occurred in isValidEmail Function " +error );
        action.goTo(NodeOutcome.ERROR);

    }

}

function isValidPhone(phoneNumber) {
    try {
        const phoneRegex = /^\+[1-9]{1}[0-9]{1,14}$/;
        return phoneRegex.test(phoneNumber);

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error occurred in isValidPhone Function" +error );
        action.goTo(NodeOutcome.ERROR);
    }
}

function requestCallbacks() {
    try {

        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`)
        }
        if (nodeState.get("invalidPhoneNumber")) {
            logger.debug("inside the invalidphonenumber")
            var invalidPhoneNumber = nodeState.get("invalidPhoneNumber")
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + invalidPhoneNumber + `</div>`)
        }

        callbacksBuilder.textOutputCallback(1, "3_account_recovery")
        callbacksBuilder.textInputCallback("recovery_attribute_value");
        
        var mfaOptions = ["phone_sms", "alternate_email"];
        var promptMessage = "set_account_recovery_method";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
                if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
      

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error inRequestCallbacks" +error );
        action.goTo(NodeOutcome.ERROR);

    }

}

function handleUserResponses() {
    try {
        var value = callbacks.getTextInputCallbacks()[0];
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];

        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "SelectedOutcome::" + selectedOutcome);

        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "selectedMFA::" + selectedMFA);

        if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("Phone_Email_Verification", "back");
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 0) {

            if (selectedMFA === 1) {
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "inside email");
                var checkEmail = isValidEmail(value)
                if (checkEmail == true) {
                    nodeState.putShared("alternateEmail", value);
                    nodeState.putShared("errorMessage", null);
                    action.goTo(NodeOutcome.EMAIL);
                }
                else {
                    nodeState.putShared("invalidPhoneNumber", null);
                    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "email validation failed for "+value+"::"+nodeConfig.errorId_emailValidation);
                    action.goTo(NodeOutcome.INVALID_EMAIL);
                }

            } else {
                nodeState.putShared("postrecoverymfa", "true");
                nodeState.putShared("MaxLimitReachedSkipPhone", "false");
                var phoneNumber = value
                var checdkPhone = isValidPhone(value);
                if (checdkPhone == false) {
                    nodeState.putShared("errorMessage", null);
                     nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "phone validation failed ::"+nodeConfig.errorId_phoneValidation);
                    action.goTo(NodeOutcome.INVALID_PHONE);
                }
                else {

                    var phoneVerified = nodeState.get("phoneVerified");
                    if (phoneVerified == "true") {
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "phoneVerified is true");
                        var verifiedTelephone = nodeState.get("verifiedTelephoneNumber");
                        

                        if (phoneNumber === verifiedTelephone) {
                            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Don't Verify Condtion");
                            nodeState.putShared("errorMessage", null);
                            action.goTo(NodeOutcome.DONTVERIFY);
                        }
                        else {
                            nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "inside phone");
                            nodeState.putShared("telephoneNumber", phoneNumber);
                            nodeState.putShared("MFAMethod", "sms");
                            nodeState.putShared("errorMessage", null);
                            action.goTo(NodeOutcome.PHONE);

                        }

                    }
                    else {
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "inside phone");
                        nodeState.putShared("telephoneNumber", phoneNumber);
                        nodeState.putShared("MFAMethod", "sms");
                        nodeState.putShared("errorMessage", null);
                        action.goTo(NodeOutcome.PHONE);

                    }
                }

            }
        }

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in HandelUser Response" +error );
        action.goTo(NodeOutcome.ERROR);
        

    }

}

function main() {
    try {
        if (callbacks.isEmpty()) {
            requestCallbacks();

        }
        else {
            handleUserResponses();

        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution" +error );
        action.goTo(NodeOutcome.ERROR);

    }

}



