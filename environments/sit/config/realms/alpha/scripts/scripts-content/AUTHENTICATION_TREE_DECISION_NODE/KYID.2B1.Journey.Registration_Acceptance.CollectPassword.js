/**
 * Script: 
 * Description:               
 * Date: 17th July 2025
 * Author: Deloitte
 **/

// Compute current system timestamp
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var dateTime = new Date().toISOString();
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");
var passwordValidatorLib = require('KYID.2B1.Journey.PasswordPolicyValidatorLibrary');

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate Password Policy",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.CollectPassword",
    timestamp: dateTime,
    idmQueryFail: "IDM Query Operation Failed",
    validatePwdSuccess: "Password Validation Successful",
    validatePwdFail: "Password Validation Fail for",
    mismatchPassword: "Password Mismatch",
    emptyPassword: "Password is Empty",
    errorId_pwdValidation: "errorID::KYID015",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Next",
    EMPTY: "Empty",
    MISMATCH: "Mismatch",
    INVALID: "InValid",
    BACK: "Back",
    MAX_LIMIT: "max limit",
    FALSE: "False"
};

// Declare Global Variables
var firstName = "";
var lastName = "";

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    },
    info: function(message) {
        logger.info(message);
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


// Main Function
function main() {
    try {
       
        nodeLogger.debug("verifiedEMail" + nodeState.get("verifiedPrimaryEmail") + "Alternate Email: " + nodeState.get("verifiedAlternateEmail") + "Phone Number: " + nodeState.get("verifiedTelephoneNumber") + "firstName: " + nodeState.get("givenName") + "lastName: " + nodeState.get("lastName"));
        if (callbacks.isEmpty()) {

            var jsonobj = {"pageHeader": "Create_Password"};
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));

            //FAQ topics
            var lib = require("KYID.Library.FAQPages");
            var process ="SelfRegistration";
            var pageHeader= "Create_Password";
            var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
            
            if (nodeState.get("inValidPasswordErrorMessage") != null) {
                var error = nodeState.get("inValidPasswordErrorMessage")
                callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            } else if (nodeState.get("emptyPasswordErrorMessage") != null) {
                var error = nodeState.get("emptyPasswordErrorMessage")
                callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            } else if (nodeState.get("mismatchPasswordErrorMessage") != null) {
                var error = nodeState.get("mismatchPasswordErrorMessage")
                callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            }


            callbacksBuilder.passwordCallback("New password", true);
            callbacksBuilder.passwordCallback("Confirm Password", true);
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1)

             if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
            
            var errorMsg = nodeState.get("passwordErrorMessage");

            if (errorMsg != null && errorMsg.outcome === false && errorMsg.firstNameError === true) {
                var error = errorMsg.message;
                var code = errorMsg.code;

                callbacksBuilder.textOutputCallback(0, code);
                callbacksBuilder.textOutputCallback(0, error);

                nodeState.putShared("passwordErrorMessage", null)

            } else if (errorMsg != null && errorMsg.outcome === false && errorMsg.lastNameError === true) {
                var error = errorMsg.message;
                var code = errorMsg.code;
                callbacksBuilder.textOutputCallback(0, code);
                callbacksBuilder.textOutputCallback(0, error);
                nodeState.putShared("passwordErrorMessage", null)

            } else if (errorMsg != null && errorMsg.outcome === false) {
                var error = errorMsg.message;
                var code = errorMsg.code;
                callbacksBuilder.textOutputCallback(0, code);
                callbacksBuilder.textOutputCallback(0, error);
                nodeState.putShared("passwordErrorMessage", null)

            }

        } else {

            var password = callbacks.getPasswordCallbacks().get(0);
            var newpassword = callbacks.getPasswordCallbacks().get(1);
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            nodeState.putShared("password", password)
            if (selectedOutcome === 0) {
                // if ((password && password!=null) && (newpassword && newpassword!=null)) {
                nodeState.putShared("inValidPasswordErrorMessage", null)
                nodeState.putShared("emptyPasswordErrorMessage", null)
                nodeState.putShared("mismatchPasswordErrorMessage", null)


                var isPassValid = passwordValidatorLib.validatePassword(nodeState, password, newpassword);
                logger.debug("isPassValid " + JSON.stringify(isPassValid))


                if (isPassValid.outcome === false) {

                    logger.debug("outcome is false")

                    nodeState.putShared("passwordErrorMessage", isPassValid)
                    action.goTo(nodeOutcome.FALSE);
                } else if (isPassValid.outcome === true) {

                    var errMessage = isPassValid.message;
                    logger.debug("password  " + errMessage)
                    action.goTo(nodeOutcome.SUCCESS);
                }

            } else {
                if (nodeState.get("passwordgobackcount")) {
                    var passwordgobackcount = nodeState.get("passwordgobackcount")
                } else {
                    var passwordgobackcount = 1;
                }

                if (passwordgobackcount > retryLimit) {
                    nodeState.putShared("maxlimitforpasswordback", "true");
                    action.goTo(nodeOutcome.MAX_LIMIT);
                } else {
                    passwordgobackcount++
                    nodeState.putShared("passwordgobackcount", passwordgobackcount);
                    action.goTo(nodeOutcome.BACK);
                }

            }


        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
            "::" + nodeConfig.scriptName + "::" + error + "::" + nodeState.get("verifiedPrimaryEmail"));
    }
}


//Invoke Main Function
main()