var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select Authenticators",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.MFA.Select.Authenticators",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      BACK: "back",
      SYMANTEC: "symantec",
      FORGEROCK:"forgeRock",
      MICROSOFT_TOTP:"microsoftTOTP",
      GOOGLE_TOTP : "googleTOTP",
      ERROR: "error"
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
    },
    info: function (message) {
        logger.info(message);
    }
}

// Main Execution
try {
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var isTOTPRegistered = isMFARegistered(usrKOGID, "TOTP");
    if(!isTOTPRegistered){
         isTOTPRegistered = isMFARegistered(usrKOGID, "FRTOTP");
    }
    var isSyamtecRegistered = isMFARegistered(usrKOGID, "SYMANTEC")
    logger.debug("isSyamtecRegistered is in "+ isSyamtecRegistered)
    var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH")
    if(!isPUSHRegistered){
         isPUSHRegistered = isMFARegistered(usrKOGID, "FRPUSH");
    }
    nodeState.putShared("isPUSHRegistered", isPUSHRegistered);
    nodeState.putShared("isTOTPRegistered", isTOTPRegistered);
    nodeState.putShared("isSyamtecRegistered", isSyamtecRegistered);
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;
        var process ="RegisterMFA";
        var pageHeader= "2_add_methods";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        logger.debug("getFaqTopicId : "+getFaqTopicId);
        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }

        if (nodeState.get("TOTPErrorMessage") != null) {
            var errorMessage = nodeState.get("TOTPErrorMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        if(nodeState.get("isMasterLogin")){
            var jsonobj = {"pageHeader": "2_add_methods"};
            callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
            }
        var jsonobj = {"pageHeader": "2_add_methods"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
        //callbacksBuilder.textOutputCallback(0, "2_add_methods")
        

        if (isTOTPRegistered == true && isPUSHRegistered == true && isSyamtecRegistered == false) {
             nodeState.putShared("mfaOption4","SymantecVIP")
             mfaOptions = ["SymantecVIP"];
        }
        else if (isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == false) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             mfaOptions = ["ForgeRockAuthenticator"];
        }
        else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == true) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             nodeState.putShared("mfaOption2","MicrosoftAuthenticator")
             nodeState.putShared("mfaOption3","GoogleAuthenticator")
             mfaOptions = ["ForgeRockAuthenticator", "MicrosoftAuthenticator", "GoogleAuthenticator"];
        }
        else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == true) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             nodeState.putShared("mfaOption2","MicrosoftAuthenticator")
             nodeState.putShared("mfaOption3","GoogleAuthenticator")
             mfaOptions = ["ForgeRockAuthenticator", "MicrosoftAuthenticator", "GoogleAuthenticator"];
        }
        else if (isTOTPRegistered == true && isPUSHRegistered == false && isSyamtecRegistered == false) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             nodeState.putShared("mfaOption4","SymantecVIP")
             mfaOptions = ["ForgeRockAuthenticator", "SymantecVIP"];
        }
        else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == false) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             nodeState.putShared("mfaOption2","MicrosoftAuthenticator")
             nodeState.putShared("mfaOption3","GoogleAuthenticator")
             nodeState.putShared("mfaOption4","SymantecVIP")
              mfaOptions = ["ForgeRockAuthenticator", "MicrosoftAuthenticator", "GoogleAuthenticator", "SymantecVIP"];
        }
        else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == false) {
             nodeState.putShared("mfaOption1","ForgeRockAuthenticator")
             nodeState.putShared("mfaOption2","MicrosoftAuthenticator")
             nodeState.putShared("mfaOption3","GoogleAuthenticator")
             nodeState.putShared("mfaOption4","SymantecVIP")
             mfaOptions = ["ForgeRockAuthenticator", "MicrosoftAuthenticator", "GoogleAuthenticator", "SymantecVIP"];
        }
        var promptMessage = "which_app_would_you_like_for_authentication";
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
        logger.debug("outcome :: => "+ outcome)
        if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            action.goTo("back");


        }
        else if (selectedOutcome == 0) {

            if (isTOTPRegistered == true && isPUSHRegistered == true && isSyamtecRegistered == false) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("1.MFAmethod :: "+ nodeState.get("MFAmethod"))
                    //action.goTo("symantec")
                    if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            // logger.error("2. inside limit reached ::"+ nodeState.get("limit"))
                            // nodeState.putShared("script", "selectAuthenticators")
                            nodeState.putShared("error","showed")
                            action.goTo("limit");
                        }else{
                            nodeState.putShared("MFAType","SymantecVIP")
                            action.goTo("symantec")
                    }
                }
            }
            else if (isTOTPRegistered == true && isPUSHRegistered == false && isSyamtecRegistered == false) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("MFAType","ForgeRockAuthenticator")
                    action.goTo("forgeRock")
                }
                else {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    logger.debug("2.MFAmethod :: "+ nodeState.get("MFAmethod"))
                    //action.goTo("symantec")
                    if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            // logger.error("2. inside limit reached ::"+ nodeState.get("limit"))
                            // nodeState.putShared("script", "selectAuthenticators")
                            nodeState.putShared("error","showed")
                            action.goTo("limit");
                    }else{
                        nodeState.putShared("MFAType","SymantecVIP")    
                        action.goTo("symantec")
                    }
                }
            }
            else if (isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == false) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);
                nodeState.putShared("MFAType","ForgeRockAuthenticator")
                action.goTo("forgeRock")
            }
            else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == true) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("MFAType","ForgeRockAuthenticator")
                    action.goTo("forgeRock")
                }
                else if (outcome == 1) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("TOTPType", "MSTOTP");
                    nodeState.putShared("MFAType","MicrosoftAuthenticator")
                    nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                    action.goTo("microsoftTOTP")
                }
                else if (outcome == 2) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("TOTPType", "GTOTP");
                    nodeState.putShared("MFAType","GoogleAuthenticator")
                    nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                    action.goTo("googleTOTP")
                }
            }
                else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == true) {

                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("MFAType","ForgeRockAuthenticator")
                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                         nodeState.putShared("MFAType","MicrosoftAuthenticator");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeState.putShared("MFAType","GoogleAuthenticator")
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                }
                else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == false) {
                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("MFAType","ForgeRockAuthenticator")
                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                         nodeState.putShared("MFAType","MicrosoftAuthenticator")
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeState.putShared("MFAType","GoogleAuthenticator")
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                    else if (outcome == 3) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        logger.debug("MFAmethod is :: "+ nodeState.get("MFAmethod"))
                        nodeState.putShared("MFAType","SymantecVIP")
                       if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            logger.debug("1. inside limit reached ::"+ nodeState.get("limit"))
                            nodeState.putShared("script", "selectAuthenticators")
                            action.goTo("limit");
                        }else{
                            action.goTo("symantec")
                        }
                    }
                }
                else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == false) {
                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("MFAType","ForgeRockAuthenticator")
                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                        nodeState.putShared("MFAType","MicrosoftAuthenticator")
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeState.putShared("MFAType","GoogleAuthenticator")
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                    else if (outcome == 3) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        logger.debug("MFAmethod :: "+ nodeState.get("MFAmethod"))
                        logger.debug("MFAmethod :: "+ nodeState.get("MFAmethodS"))
                        nodeState.putShared("MFAType","SymantecVIP")
                        if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            // logger.error("2. inside limit reached ::"+ nodeState.get("limit"))
                            // nodeState.putShared("script", "selectAuthenticators")
                            nodeState.putShared("error","showed")
                            action.goTo("limit");
                        }else{
                            action.goTo("symantec")
                        }
                    }
                }
            
        }



    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error+mail);
        action.goTo("error");

    }

}

function isMFARegistered(usrKOGID, mfaMethod) {
    logger.debug("UserKOG ID is :" + usrKOGID + "MFA Method " + mfaMethod)
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + mfaMethod + '" AND MFAStatus eq "' + "ACTIVE" + '"' });
    logger.debug("mfaMethodResponses is -- " + mfaMethodResponses);
    var MFACount = mfaMethodResponses.result.length;
    logger.debug("MFACount is -- " + MFACount);
    if (mfaMethodResponses != null) {
        if (mfaMethod === "SYMANTEC") {
            if (MFACount < 3) {
                logger.debug("1. MFA count is in :: "+ MFACount)
                return false;
            }
            else {
                logger.debug("2. MFA count is in :: "+ MFACount)
                nodeState.putShared("limit","reached")
                nodeState.putShared("MFAmethod","Symantec")
                return false;
            }
        }
        else if (mfaMethod === "TOTP" || mfaMethod === "FRTOTP") {
            if (MFACount == 1) {
                return true;
            }
            else {
                return false;
            }
        }
        else if (mfaMethod === "PUSH"  || mfaMethod === "FRPUSH") {
            if (MFACount == 1) {
                return true;
            }
            else {
                return false;
            }
        }
        else if (mfaMethod === "SMSVOICE") {
            if (MFACount < 4) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }


    else {
        return "No Response for mfaMethodResponses"
    }
}


