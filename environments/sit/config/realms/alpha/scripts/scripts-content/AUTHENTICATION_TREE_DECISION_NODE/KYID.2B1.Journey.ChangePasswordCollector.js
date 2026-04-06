/**
 * Script: 
 * Description:               
 * Date: 7th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var passwordValidatorLib = require('KYID.2B1.Journey.PasswordPolicyValidatorLibrary');

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate Password Policy",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ChnagePasswordCollector",
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
    EMPTY: "Empty",
    MISMATCH: "Mismatch",
    INVALID: "InValid",
    BACK:"back",
    FALSE: "False"
};

// Declare Global Variables
var firstName = "";
var lastName = "";
var mail = "";
if(nodeState.get("mail")!= null){
    mail = nodeState.get("mail");
}

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
    },
    info: function (message) {
        logger.info(message);
    }
}


// Main Function
function main() {
    logger.debug("Main function entered.");
    nodeState.putShared("journeyName", "changePassword"); // this is required to find out the journey name to store corresponding user activity

    try {
        if (callbacks.isEmpty()) {
             nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Callbacks are empty. Displaying UI prompts."+ "::"+ mail);



           /* if(nodeState.get("changePasswordValidationError")!=null){
                callbacksBuilder.textOutputCallback(0, nodeState.get("changePasswordValidationError"));
                
            }
            */
            var jsonobj = {"pageHeader": "Change_Password"};


            callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
            //callbacksBuilder.textOutputCallback(0, "Change_Password");
            
            callbacksBuilder.passwordCallback("Current password", true);
            callbacksBuilder.passwordCallback("New password", true);
            callbacksBuilder.passwordCallback("Re-enter new password", true);
            callbacksBuilder.confirmationCallback(0, ["Continue", "Back"], 1); 

                var errorMsg = nodeState.get("passwordErrorMessage");
                var changePwdErrMsg = nodeState.get("changePasswordValidationError");


          if(changePwdErrMsg !=null && changePwdErrMsg.code && changePwdErrMsg.message){
              logger.debug("inside changePwdErrMsg");
              var errorCode = changePwdErrMsg.code;
              var errorMessage = changePwdErrMsg.message;
                callbacksBuilder.textOutputCallback(0,errorCode);
                callbacksBuilder.textOutputCallback(0,errorMessage);
                nodeState.putShared("changePasswordValidationError", null);
              logger.debug("changePasswordValidationError" +nodeState.get("changePasswordValidationError"));
            }
            
            if (errorMsg !=null && errorMsg.outcome === false && errorMsg.firstNameError === true) {
                var error = errorMsg.message;
               var code = errorMsg.code;
                
                callbacksBuilder.textOutputCallback(0,code);
                callbacksBuilder.textOutputCallback(0,error);
                
                nodeState.putShared("passwordErrorMessage", null)
                
            }    else if (errorMsg !=null && errorMsg.outcome === false && errorMsg.lastNameError === true) {
                 var error = errorMsg.message;
                var code = errorMsg.code;
                 callbacksBuilder.textOutputCallback(0,code);
                 callbacksBuilder.textOutputCallback(0,error);
                 nodeState.putShared("passwordErrorMessage", null)
                
             } else if (errorMsg !=null && errorMsg.outcome === false) {
                var error = errorMsg.message;
                  var code = errorMsg.code;
                  callbacksBuilder.textOutputCallback(0,code);
                callbacksBuilder.textOutputCallback(0,error);
                nodeState.putShared("passwordErrorMessage", null)
            }
            
        } else {
            var currentPassword = callbacks.getPasswordCallbacks().get(0);
            var newPassword = callbacks.getPasswordCallbacks().get(1);
            var reenteredPassword = callbacks.getPasswordCallbacks().get(2);
            var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

            nodeState.putShared("TempPassword", currentPassword);

            if(selectedOutcome === 1){
            nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User selected: Back"+ "::"+ mail);
            action.goTo(nodeOutcome.BACK);
            }
            else{

           
            
            if (currentPassword && newPassword && reenteredPassword) {
                nodeState.putShared("inValidPasswordErrorMessage", null);
                nodeState.putShared("emptyPasswordErrorMessage", null);
                nodeState.putShared("mismatchPasswordErrorMessage", null);
                nodeState.putShared("errormessagepwdUpdateFailedinAD", null);

                var KOGID = nodeState.get("KOGID");
                var mail = nodeState.get("userMail");
                nodeState.putShared("EmailAddress", mail);
                nodeState.putTransient("currentPassword", currentPassword);
                nodeState.putTransient("reenteredPassword", reenteredPassword);
                nodeState.putTransient("newPassword", newPassword);
                nodeState.putTransient("password", currentPassword);
                 nodeState.putShared("KOGID", KOGID);
                logger.debug("KOGID: " + KOGID + ", Email: " + mail);


               var isPassValid = passwordValidatorLib.validatePassword(nodeState, newPassword, reenteredPassword);
            logger.debug("isPassValid " + JSON.stringify(isPassValid))


            if (isPassValid.outcome === false) {
                
                logger.debug("outcome is false")
               
                nodeState.putShared("passwordErrorMessage", isPassValid)
                action.goTo(nodeOutcome.FALSE);
            } else if (isPassValid.outcome === true) {
               
                           var errMessage = isPassValid.message;
                action.goTo(nodeOutcome.SUCCESS);
            }

            } else {
                nodeState.putShared("inValidPasswordErrorMessage", null);
                nodeState.putShared("emptyPasswordErrorMessage", null);
                nodeState.putShared("mismatchPasswordErrorMessage", null);
                nodeState.putShared("errormessagepwdUpdateFailedinAD", null);
                 nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+nodeConfig.emptyPassword+ "::"+ mail);
                nodeState.putShared("changePasswordValidationError","Empty Fields");
                action.goTo(nodeOutcome.EMPTY);
                }
        }
        }
    } catch (error) {
         nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+"Unhandled Error"+ "::"+ mail);
    }

    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+"Main function execution completed."+ "::"+ mail);
}

//Invoke Main Function
main();