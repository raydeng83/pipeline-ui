/**
 * Script: 
 * Description:               
 * Date: 7th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();
//////////////////////////////
var passwordValidatorLib = require('KYID.2B1.Journey.PasswordPolicyValidatorLibrary');
///////////////
// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate Password Policy",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CollectValidatePassword",
    timestamp: dateTime,
    idmQueryFail: "IDM Query Operation Failed",
    validatePwdSuccess: "Password Validation Successful",
    validatePwdFail: "Password Validation Fail",
    mismatchPassword: "Password Mismatch",
    emptyPassword: "Password is Empty",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
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
    }
};

logger.debug("Script started KYID.2B1.Journey.CollectValidatePassword");

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
logger.debug("getLocale KYID.2B1.Journey.CollectValidatePassword");


function GetRequestID() {
    var ReqID = "";
    var RequestIDError = "";
    if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null) {
        logger.debug("Request id is " + requestCookies.get("ReqID"))
        ReqID = requestCookies.get("ReqID")
        if (getLocale() === "es") {
            RequestIDError = `<br>` + "ID de transacción" + `<br>` + ReqID
        } else {
            RequestIDError = `<br>` + "Transaction ID:" + `<br>` + ReqID
        }
    }


    return RequestIDError
}
logger.debug("GetRequestID KYID.2B1.Journey.CollectValidatePassword");

// Main Function
function main() {
    try {
        logger.debug("Main execution started KYID.2B1.Journey.CollectValidatePassword");
        if (callbacks.isEmpty()) {


            var jsonobj = {
                "pageHeader": "3_Create a password"
            };
            logger.debug("jsonobj : " + jsonobj);
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
            callbacksBuilder.textOutputCallback(0, "Passwords must meet the following:");
            //const  passwordReq = 'At least 8 characters. \
            // A lowercase letter '; 
            /*+
                        "An uppercase letter\n" +
                        "A number\n" +
                        "Does not include your first name\n" +
                        "Does not include your last name\n" +
                        "Password can't be the same as your last 24 passwords";*/
            callbacksBuilder.textOutputCallback(0, "At least 8 characters");
            callbacksBuilder.textOutputCallback(0, "A lowercase letter");
            callbacksBuilder.textOutputCallback(0, "An uppercase letter");
            callbacksBuilder.textOutputCallback(0, "A number");
            callbacksBuilder.textOutputCallback(0, "Does not include your first name");
            callbacksBuilder.textOutputCallback(0, "Does not include your last name");
            callbacksBuilder.textOutputCallback(0, "Password can't be the same as your last 24 passwords");
            logger.debug("Callback success started KYID.2B1.Journey.CollectValidatePassword");



            if (getLocale().localeCompare("en") == 0) {
                callbacksBuilder.passwordCallback("New password", true);
                callbacksBuilder.passwordCallback("Re-enter password", true);
            } else {
                callbacksBuilder.passwordCallback("Contraseña nueva", true);
                callbacksBuilder.passwordCallback("Volver a ingresar contraseña", true);
            }
            callbacksBuilder.confirmationCallback(0, ["Reset_Password"], 0);

            var errorMsg = nodeState.get("passwordErrorMessage");
            logger.debug("errorMsg KYID.2B1.Journey.CollectValidatePassword - " + JSON.stringify(errorMsg));
         
            if (errorMsg != null && errorMsg.outcome === false) {

                var error = errorMsg.message;
                var code = errorMsg.code;
                callbacksBuilder.textOutputCallback(0, code);
                callbacksBuilder.textOutputCallback(0, error);
                nodeState.putShared("passwordErrorMessage", null)
            }
            var changePwdErrMsg = nodeState.get("changePasswordValidationError");
            if(changePwdErrMsg !=null && changePwdErrMsg.code && changePwdErrMsg.message){
              var errorCode = changePwdErrMsg.code;
              var errorMessage = changePwdErrMsg.message;
                callbacksBuilder.textOutputCallback(0,errorCode);
                callbacksBuilder.textOutputCallback(0,errorMessage);
                nodeState.putShared("changePasswordValidationError", null);
            }
            
        } else {

            var password = callbacks.getPasswordCallbacks().get(0);
            var newpassword = callbacks.getPasswordCallbacks().get(1);
            var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

            if(selectedOutcome === 0){
            var isPassValid = passwordValidatorLib.validatePassword(nodeState, password, newpassword);
            logger.debug("isPassValid " + JSON.stringify(isPassValid))

            nodeState.putShared("newPassword", password)
             nodeState.putShared("password", password)
            if (isPassValid.outcome === false) {
                nodeState.putShared("passwordErrorMessage", isPassValid)
                action.goTo(nodeOutcome.FALSE);
            } else if (isPassValid.outcome === true) {
                var errMessage = isPassValid.message;
                action.goTo(nodeOutcome.SUCCESS);
            }
             }

            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.validatePwdSuccess);


        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
            "::" + nodeConfig.scriptName + "::" + error);
    }
}


//Invoke Main Function
main()