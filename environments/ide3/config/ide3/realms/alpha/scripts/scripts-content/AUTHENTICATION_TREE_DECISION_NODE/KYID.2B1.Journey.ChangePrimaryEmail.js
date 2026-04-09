// JavaScript source code
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Change Primary Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ChangePrimaryEmail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VERIFY: "Verify",
    FAILED: "false",
    DUPLICATE: "Duplicate",
    EMPTY_OTP: "BlankOTP",
    NOTMATCHING: "EmailDifferent",
    BACK: "Back",
    USER_EXISTS: "user exists"
};


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

/**
 * Function to print all received callbacks (only works when callbacks is not empty)
 */
function printAllCallbacks(prefix) {
    try {
        if (callbacks.isEmpty()) {
            logger.debug(prefix + " callbacks.isEmpty() = true");
            return;
        }
        
        logger.debug(prefix + " === All Received Callbacks ===");

        // Try to get TextInputCallbacks
        try {
            var textInputCbs = callbacks.getTextInputCallbacks();
            if (textInputCbs && textInputCbs.size() > 0) {
                logger.debug(prefix + " TextInputCallbacks count: " + textInputCbs.size());
                for (var i = 0; i < textInputCbs.size(); i++) {
                    logger.debug(prefix + " TextInputCallback[" + i + "]: " + textInputCbs.get(i));
                }
            }
        } catch (e) {
            logger.error(prefix + " No TextInputCallbacks");
        }

        // Try to get ConfirmationCallbacks
        try {
            var confirmCbs = callbacks.getConfirmationCallbacks();
            if (confirmCbs && confirmCbs.size() > 0) {
                logger.debug(prefix + " ConfirmationCallbacks count: " + confirmCbs.size());
                for (var k = 0; k < confirmCbs.size(); k++) {
                    logger.debug(prefix + " ConfirmationCallback[" + k + "]: " + confirmCbs.get(k));
                }
            }
        } catch (e) {
            logger.error(prefix + " No ConfirmationCallbacks");
        }

        logger.debug(prefix + " === End All Received Callbacks ===");
    } catch (error) {
        logger.error(prefix + " Error in printAllCallbacks: " + error.message);
    }
}

// Function to handle callback requests
function requestCallbacks() {

    try {
        // if (nodeState.get("validationError") != null) {
        //     callbacksBuilder.textOutputCallback(0, nodeState.get("validationError"));
        // }
        if(nodeState.get("journeyName")=== "helpdeskChangeEmail"){
            var jsonobj = {"pageHeader": "1_Helpdesk_Collect_Email"};
            callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));            
        }
        callbacksBuilder.textOutputCallback(0, mail);
      //  callbacksBuilder.textOutputCallback(0, firstName);
       // callbacksBuilder.textOutputCallback(0, lastName);
        callbacksBuilder.textInputCallback("New Email");
        callbacksBuilder.textInputCallback("Confirm New Email");
        callbacksBuilder.confirmationCallback(0, ["Continue", "Back"], 0);

        if (nodeState.get("validationError") != null) {

            if(nodeState.get("validationError") === "Primary and alternate emails cannot be the same.")
            {
                callbacksBuilder.textOutputCallback(0, "ERR-CHN-EML-003");
                callbacksBuilder.textOutputCallback(0, nodeState.get("validationError"));
                logger.debug("[ChangePrimaryEmail-requestCallbacks] Added error callbacks: ERR-CHN-EML-003 and validationError");
            }else{
                callbacksBuilder.textOutputCallback(0, nodeState.get("validationError"));
            }
        }

        // Print debug information
        logger.debug("[ChangePrimaryEmail-requestCallbacks] === Debug Information ===");
        logger.debug("[ChangePrimaryEmail-requestCallbacks] validationError: " + nodeState.get("validationError"));
        logger.debug("[ChangePrimaryEmail-requestCallbacks] journeyName: " + nodeState.get("journeyName"));
        logger.debug("[ChangePrimaryEmail-requestCallbacks] mail: " + mail);
        logger.debug("[ChangePrimaryEmail-requestCallbacks] alternateEmail: " + nodeState.get("alternateEmail"));
        logger.debug("[ChangePrimaryEmail-requestCallbacks] originalemail: " + nodeState.get("originalemail"));
        logger.debug("[ChangePrimaryEmail-requestCallbacks] === End Debug Information ===");

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);
    }
}


// Function to handle user responses
function handleUserResponses() {
    try {
        // Print all received callbacks for debugging
        printAllCallbacks("[ChangePrimaryEmail-handleUserResponses]");

        //var originalemail = callbacks.getTextInputCallbacks().get(0).toUpperCase().trim();
        var newemail1 = callbacks.getTextInputCallbacks().get(0).trim();
        var newemail2 = callbacks.getTextInputCallbacks().get(1).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        //originalemail = nodeState.get("originalemail")
        // nodeState.putShared("selectedOutcome", selectedOutcome);
      
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome);

        if (selectedOutcome === 0) {

        var newemail1_lc = newemail1.toLowerCase();
        var newemail2_lc = newemail2.toLowerCase();
        logger.debug("Checking email match: " + (newemail1_lc ===  newemail2_lc));
        logger.debug("newemail1_lc is :: "+ newemail1_lc)
        logger.debug("newemail2_lc is :: "+ newemail2_lc)
        nodeState.putShared("changePrimary","true")

            if (!newemail1 || !newemail2) {
                logger.debug("In empty loop");
               // nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the newemail1 null condition");
                nodeState.putShared("validationError", "Empty Filed")
                action.goTo(NodeOutcome.EMPTY_OTP);
            } else if (newemail1_lc !== newemail2_lc) {
                logger.debug("In mismatch loop");
                nodeState.putShared("validationError", "Mismatch")
                action.goTo(NodeOutcome.NOTMATCHING)
            } else if(alternateEmail !=null && (alternateEmail.toLowerCase() === newemail2_lc)){
                //if (alternateEmail.toLowerCase() === newemail2.toLowerCase()) {
                logger.debug("In match with alt mail loop");
                logger.debug("Primary and alternate emails cannot be the same." + alternateEmail);
                nodeState.putShared("validationError", "Primary and alternate emails cannot be the same.")
                action.goTo(NodeOutcome.NOTMATCHING)
                //}
            } else if (newemail1_lc === newemail2_lc) {
                logger.debug("In happy loop");
                logger.debug("Orignal Email is" + originalemail);
                if (newemail1 === originalemail) {
                    logger.debug("In match with original loop");
                    nodeState.putShared("validationError", "existingEmail cannot be same as new")
                    action.goTo(NodeOutcome.NOTMATCHING)
                } else {
                    if (isValidEmail(newemail1) === true) {
                        logger.debug("In email validation loop");
                        if (isUserExist = validateUser(newemail1 == true)) {
                            logger.debug("In user validation loop");
                            nodeState.putShared("validationError", "User already exsit");
                            action.goTo(NodeOutcome.USER_EXIST);
                        } else {
                            logger.debug("In happy path loop");
                            //nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
                            nodeState.putShared("EMAIL", "MFAMethod")
                            nodeState.putShared("collectedPrimaryEmail", newemail1);
                            nodeState.putShared("newemail1", newemail1);
                            nodeState.putShared("validationError", null);
                            action.goTo(NodeOutcome.VERIFY);
                        }
                    } else {
                        logger.debug("In check1 loop");
                        nodeState.putShared("validationError", "Invalid_Email_ID");
                        action.goTo(NodeOutcome.NOTMATCHING);
                    }
                }
            }else{
                logger.debug("In check3 loop");
            }
        }else {
            logger.debug("In check2 loop");
            nodeState.putShared("validationError", null);
            action.goTo(NodeOutcome.BACK);
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
        auditLog("PRO002", "Primary Email Update Failure");
        action.goTo(NodeOutcome.FAILED);
    }
}

function validateUser(email) {
    try {
        var response = openidm.query("managed/alpha_user/", {
            "_queryFilter": '/mail eq "' + email + '"'
        }, [""]);
        logger.debug("User Response is :: " + response)
        if (response.result.length > 0) {
            return true;

        } else {
            return false;
        }

    } catch (error) {

        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred while validating user" + "::" + "emailId::" + email + "::" + error);



    }

}


// function getUserActiveMFAValue(usrMFAData, usrMFAType) {
//     var mfaValueArray = []
//     if (usrMFAData.result.length > 0) {
//         for (var i = 0; i < usrMFAData.result.length; i++) {
//             var mfaMethodResponse = usrMFAData.result[i];
//             if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") == 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) == 0) {
//                 mfaValueArray.push(mfaMethodResponse["MFAValue"]);
//             }
//         }
//     }
//     return mfaValueArray;
// }


// function getMFAObject(usrKOGID) {
//     try {
//         var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
//             "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
//         });
//         nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: " + mfaMethodResponses)
//         return mfaMethodResponses;

//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
//     }
// }

// Main execution
try {
    var originalemail = nodeState.get("mail");
    var mail = nodeState.get("mail");
    var firstName = nodeState.get("givenName");
    var lastName = nodeState.get("lastName");
    var alternateEmail = null;//nodeState.get("alternateEmail");
    logger.debug("alternateEmail. " + alternateEmail);
    nodeState.putShared("verification", "mail")
    nodeState.putShared("flowName","SetupMFA")

        if (nodeState.get("alternateEmail") != null) {
            alternateEmail = nodeState.get("alternateEmail");
        }
    logger.debug("alternateEmail. " + alternateEmail);


    
    if (callbacks.isEmpty()) {
        logger.debug("line 173" + originalemail)
        nodeState.putShared("originalemail", originalemail)
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}

function isValidEmail(email) {
    inputFlag = "email";
    /*const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);    */

    var lib = require('KYID.2B1.Library.RestrictedEntriesLibraryScript');
    var restrictedEntries = lib.checkRestrictedEntries(inputFlag);
    logger.debug("restrictedEntries response : " + restrictedEntries);
    var checkUserInput = lib.checkEmail(email, restrictedEntries);
    logger.debug("checkEmail response : " + checkUserInput);
    if (checkUserInput == true) {
        return false;
    } else {
        return true;
    }
}


function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userQueryResult = null;
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var requestedUserId = nodeState.get("_id") || null
                /* userQueryResult = openidm.query("managed/alpha_user", {
            _queryFilter: 'userName eq "' + usrKOGID + '"'
                }, ["_id"]);
                  requesteduserId = userQueryResult.result[0]._id;
                  */
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requestedUserId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log email update scenario "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}



