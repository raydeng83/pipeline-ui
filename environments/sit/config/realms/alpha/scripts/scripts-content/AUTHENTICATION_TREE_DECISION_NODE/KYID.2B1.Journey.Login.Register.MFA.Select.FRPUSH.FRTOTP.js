// Main Execution
try {
    var isTOTPRegistered= nodeState.get("isTOTPRegistered");
    var isPUSHRegistered= nodeState.get("isPUSHRegistered");
        if (callbacks.isEmpty()) {
            if(nodeState.get("isMasterLogin")){
            var jsonobj = {"pageHeader": "3_select_forgerock_authenticator"};
            callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
            }
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {

}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var process ="RegisterMFA";
        var pageHeader= "select_how_to_authenticate";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        logger.debug("getFaqTopicId : "+getFaqTopicId);
        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        var jsonobj = {"pageHeader": "select_how_to_authenticate"};
        callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
        //callbacksBuilder.textOutputCallback(0, "select_how_to_authenticate")
        if(isTOTPRegistered == true && isPUSHRegistered == false ) {
            var mfaOptions = ["push_notification"];
        }
        else if(isTOTPRegistered == false && isPUSHRegistered == true){
            var mfaOptions = ["one_time_code"];
        }
            
        else{
        var mfaOptions = ["push_notification", "one_time_code"];
        }
        var promptMessage = ".";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
		if (getFaqTopicId != null) {
        callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses() {
    try {
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var outcome = callbacks.getChoiceCallbacks().get(0)[0];

        if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("BackFromTOTP","true")  
            action.goTo("back");
        }
        else if (selectedOutcome == 0) {
            if(isTOTPRegistered == true && isPUSHRegistered == false ) {
                   if (outcome == 0) {
                  action.goTo("FRPUSH")
            }
        }
        else if(isTOTPRegistered == false && isPUSHRegistered == true){
                  if (outcome == 0) {
                nodeState.putShared("TOTPType", "FRTOTP");
                action.goTo("FRTOTP")
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
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }

}
