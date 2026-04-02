// Main Execution
try {
    //var isTOTPRegistered= nodeState.get("isTOTPRegistered");
    var isForgeRockTOTPRegistered = nodeState.get("isForgeRockTOTPRegistered");
    var isPUSHRegistered= nodeState.get("isPUSHRegistered");
    // var isForgeRockTOTPRegistered = isMFARegisteredWithValue(usrKOGID, "TOTP", "FORGEROCK");
    //  var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH");
        if (callbacks.isEmpty()) {
            logger.debug("in callbacks empty")
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
   logger.error("some error")
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    var lib = require("KYID.Library.FAQPages");
var process ="MasterLogin";
var pageHeader= "2_Select how to authenticate";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    try {
        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        var jsonobj = {"pageHeader": "2_Select how to authenticate"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj))
        if(isForgeRockTOTPRegistered == true && isPUSHRegistered == false ) {
            var mfaOptions = ["one_time_code"];
        }
        else if(isForgeRockTOTPRegistered == false && isPUSHRegistered == true){
            var mfaOptions = ["push_notification"];
        }
            
        else{
        var mfaOptions = ["push_notification", "one_time_code"];
        }
       // logger.debug("mfaOptions for pushtotp" +mfaOptions )
        var promptMessage = "choose_from_below";
        callbacksBuilder.choiceCallback("choose_from_below", mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        if (getFaqTopicId != null) {
                
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
            }


    } catch (error) {
        logger.error("inside catch")
        //logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function isMFARegisteredWithValue(usrKOGID, mfaMethod, mfaValue) {
    try {
        var filter = 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"';
        if (mfaValue) {
            filter += ' AND MFAValue eq "' + mfaValue + '"';
        }
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": filter
        });

        return response && response.result && response.result.length > 0;
    } catch (e) {
        logger.error("Error in isMFARegisteredWithValue for " + mfaMethod + " and " + mfaValue + ": " + e);
        return false;
    }
}

// Helper to check general MFA method registration (no MFAValue)
function isMFARegistered(usrKOGID, mfaMethod) {
    try {
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "ACTIVE"'
        });

        return response && response.result && response.result.length > 0;
    } catch (e) {
        logger.error("Error in isMFARegistered for " + mfaMethod + ": " + e);
        return false;
    }
}



function handleUserResponses() {
    try {
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var outcome = callbacks.getChoiceCallbacks().get(0)[0];
       logger.debug("selectedOutcome" +selectedOutcome)
        logger.debug("outcome" +outcome)
        if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            action.goTo("back");
         

        }
        else if (selectedOutcome == 0) {
            if(isForgeRockTOTPRegistered == true && isPUSHRegistered == false ) {
                   if (outcome == 0) {
                  action.goTo("FRTOTP")
            }
        }
        else if(isForgeRockTOTPRegistered == false && isPUSHRegistered == true){
                  if (outcome == 0) {
                nodeState.putShared("TOTPType", "FRTOTP");
                action.goTo("FRPUSH")
            }
        }
        else{
            if (outcome == 0) {
                action.goTo("FRPUSH")
            }
            else {
                nodeState.putShared("TOTPType", "FRTOTP");
                action.goTo("FRTOTP")
            }
        }



        }

    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }

}
