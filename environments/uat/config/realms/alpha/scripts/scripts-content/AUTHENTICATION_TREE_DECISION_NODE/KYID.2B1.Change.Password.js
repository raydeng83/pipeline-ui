/**
 * Script: 
 * Description:               
 * Date: 7th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Validate Password Policy",
    script: "Script",
    scriptName: "KYID.Journey.ValidatePwdPolicy",
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
    BACK:"back"
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

// Validate Password Policy
function validatePassword(newpassword) {
    var password = newpassword.toLowerCase();
    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Starting password policy validation"+ "::"+ mail);

    try {    
        if (nodeState.get("KOGID") && nodeState.get("KOGID") != null) {
            var KOGID = nodeState.get("KOGID");
            logger.debug("Fetching user details for KOGID: " + KOGID);
            var response = openidm.query("managed/alpha_user", { "_queryFilter": "/userName eq \"" + KOGID + "\""}, ["givenName", "sn"]);
            if (response.result.length == 1) {
                var idmUser = response.result[0];
                if (idmUser.givenName != null) {
                    firstName = idmUser.givenName.toLowerCase();
                }
                if (idmUser.sn != null) {
                    lastName = idmUser.sn.toLowerCase();
                }
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.idmQueryFail + "::" + error);
    }

    if (newpassword.length < 8 || newpassword.length > 64) {
        logger.debug("Password failed length requirement.");
        return false;
    }

    if (!/[A-Z]/.test(newpassword)) {
        logger.debug("Password missing uppercase letter.");
        return false;
    }

    if (!/[a-z]/.test(newpassword)) {
        logger.debug("Password missing lowercase letter.");
        return false;
    }

    if (!/\d/.test(newpassword)) {
        logger.debug("Password missing number.");
        return false;
    }

    if (password.includes(firstName) || password.includes(lastName)) {
        logger.debug("Password contains user's first or last name.");
        return false;
    }

    logger.debug("Password passed all policy checks.");
    return true;
}

// Main Function
function main() {
    logger.debug("Main function entered.");

    try {
        if (callbacks.isEmpty()) {
             nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Callbacks are empty. Displaying UI prompts."+ "::"+ mail);
            // if (nodeState.get("inValidPasswordErrorMessage") != null) {
            //     var error = nodeState.get("inValidPasswordErrorMessage");
            //     callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            // } else if (nodeState.get("emptyPasswordErrorMessage") != null) {
            //     var error = nodeState.get("emptyPasswordErrorMessage");
            //     callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            // } else if (nodeState.get("mismatchPasswordErrorMessage") != null) {
            //     var error = nodeState.get("mismatchPasswordErrorMessage");
            //     callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            // } else if (nodeState.get("errormessagepwdUpdateFailedinAD") != null) {
            //     var error = nodeState.get("errormessagepwdUpdateFailedinAD");
            //     callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
            // }
            if(nodeState.get("changePasswordValidationError")!=null){
                callbacksBuilder.textOutputCallback(0, nodeState.get("changePasswordValidationError"));
            }
            var jsonobj = {"pageHeader": "Change_Password"};
            callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
            //callbacksBuilder.textOutputCallback(0, "Change_Password");
            callbacksBuilder.passwordCallback("Current password", true);
            callbacksBuilder.passwordCallback("New password", true);
            callbacksBuilder.passwordCallback("Re-enter new password", true);
            callbacksBuilder.confirmationCallback(0, ["Continue", "Back"], 1); 
            
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
                logger.debug("KOGID: " + KOGID + ", Email: " + mail);

                if (newPassword.localeCompare(reenteredPassword) == 0) {
                    if(currentPassword === newPassword){
                        nodeState.putShared("changePasswordValidationError","Password Missmatch");
                        action.goTo(nodeOutcome.MISMATCH);
                    }
                    else{
                    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "New password and re-entered password match."+ "::"+ mail);
                    if (validatePassword(newPassword)) {
                        nodeState.putShared("password", newPassword);
                         nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+ nodeConfig.validatePwdSuccess+ "::"+ mail);                        
                        nodeState.putShared("changePasswordValidationError",null);
                        action.goTo(nodeOutcome.SUCCESS);
                    } else {
                         nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::"+nodeConfig.validatePwdFail+ "::"+ mail);
                        action.goTo(nodeOutcome.INVALID);
                    }
                    }
                } else {
                     nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+nodeConfig.mismatchPassword+ "::"+ mail);
                    nodeState.putShared("changePasswordValidationError","missmatch Password");
                    action.goTo(nodeOutcome.MISMATCH);
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