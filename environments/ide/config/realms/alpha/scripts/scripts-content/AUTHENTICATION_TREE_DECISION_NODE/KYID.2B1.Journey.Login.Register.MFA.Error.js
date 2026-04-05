var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Max Limit",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.MFA.Error",
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
function main(){
    try{
     if (callbacks.isEmpty()) {
     var lib = require("KYID.Library.FAQPages");
     var pageHeader= "1_add_methods";
     var process ="RegisterMFA";
     var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
     var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    // var mfaMethod = nodeState.get("MFAmethod")
     var invalidFormat = `ERR-MFA-MAX-001 This ${nodeState.get("MFAmethod")} has exceeded the allowed max number. Please choose a different method.`
     var promptMessage = ".";
     var MFAoptions = []
         logger.debug("invalid format message" +invalidFormat);
         logger.debug("mfaoption1 is :: "+ nodeState.get("mfaOption1"))
         logger.debug("mfaOption2 is :: "+ nodeState.get("mfaOption2"))
         logger.debug("mfaOption3 is :: "+ nodeState.get("mfaOption3"))
         logger.debug("mfaOption4 is :: "+ nodeState.get("mfaOption4"))
         
         if(nodeState.get("MFAmethod")==="phone"){
              if(nodeState.get("mfaOption2")){
                 MFAoptions.push(nodeState.get("mfaOption2"))
              }
              if(nodeState.get("mfaOption1")){
                 MFAoptions.push(nodeState.get("mfaOption1"))
              }
              if(nodeState.get("mfaOption3") && nodeState.get("mailLimit") != "reached"){
                MFAoptions.push(nodeState.get("mfaOption3"))
              }
         }/*else if(nodeState.get("MFAmethod")==="Symantec"){
             if(nodeState.get("mfaOption1")){
                 MFAoptions.push(nodeState.get("mfaOption1"))
             }
             if(nodeState.get("mfaOption2")){
                 MFAoptions.push(nodeState.get("mfaOption2"))
             }
             
         */else if(nodeState.get("MFAmethod")==="SECONDARY_EMAIL"){
              if(nodeState.get("mfaOption2")){
                 MFAoptions.push(nodeState.get("mfaOption2"))
              }
              if(nodeState.get("mfaOption1")){
                 MFAoptions.push(nodeState.get("mfaOption1"))
              }
              if(nodeState.get("mfaOption3") && nodeState.get("mailLimit") != "reached"){
                MFAoptions.push(nodeState.get("mfaOption3"))
              }
         }
         else{
             if(nodeState.get("mfaOption1")!=="MobilePhone"){
                 MFAoptions.push(nodeState.get("mfaOption1"))
             }
             if(nodeState.get("mfaOption2")!=="AuthenticatorApplication"){
                 MFAoptions.push(nodeState.get("mfaOption2"))
             }
             if(nodeState.get("mfaOption3") && nodeState.get("mailLimit") != "reached"){
                 MFAoptions.push(nodeState.get("mfaOption3"))
             }
             if(nodeState.get("mfaOption4")){
                 MFAoptions.push(nodeState.get("mfaOption4"))
             }
         }


     var jsonobj = {"pageHeader": "1_add_methods"};
     logger.debug("jsonobj : "+jsonobj);
     callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
     callbacksBuilder.textOutputCallback(2,`<div class='error-message'>`+invalidFormat+`</div>`);
     callbacksBuilder.choiceCallback(`${promptMessage}`,MFAoptions, 0, false);
     if (getFaqTopicId != null) {
     callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
     }               
     callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
} else {
     var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
     var outcome = callbacks.getChoiceCallbacks().get(0)[0];
     logger.debug("selectedOutcome is ::: "+ selectedOutcome)
     logger.debug("outcome is ::: "+ outcome)
     if(nodeState.get("MFAmethod")==="phone"){
         logger.debug("inside MFAMethod Phone");
         if(selectedOutcome === 0 && outcome ===1 && nodeState.get("MFAmethod")==="phone"){
             action.goTo("divert")
         }else if (selectedOutcome === 0 && outcome === 0 && nodeState.get("MFAmethod")==="phone"){
             action.goTo("auth")
         }
        else if (selectedOutcome === 0 && outcome === 2 && nodeState.get("MFAmethod")==="phone"){
            if(nodeState.get("mailLimit") === "reached"){
                nodeState.putShared("MFAmethod","SECONDARY_EMAIL");
                action.goTo("divert");
            }
            else{
             action.goTo("alternateEmail")
            }
         }else if(selectedOutcome === 1){
             nodeState.putShared("errorMessage", null);
             nodeState.putShared("SelectPhonAuthNode","back");
             action.goTo("back")
         }     
     }
    else if(nodeState.get("MFAmethod")==="SECONDARY_EMAIL"){
         logger.debug("inside MFAMethod secondary Email");
         if(selectedOutcome === 0 && outcome ===1 && nodeState.get("MFAmethod")==="SECONDARY_EMAIL"){
            if(nodeState.get("limit") === "reached"){
                nodeState.putShared("MFAmethod","phone");
                action.goTo("divert");
            }
            else{
             action.goTo("phone")
            }
         }else if (selectedOutcome === 0 && outcome === 0 && nodeState.get("MFAmethod")==="SECONDARY_EMAIL"){
             action.goTo("auth")
         }
         else if (selectedOutcome === 0 && outcome === 2 && nodeState.get("MFAmethod")==="SECONDARY_EMAIL"){
             action.goTo("divert")
         }else if(selectedOutcome === 1){
             nodeState.putShared("errorMessage", null);
             nodeState.putShared("SelectPhonAuthNode","back");
             action.goTo("back")
         }     
     }else if(nodeState.get("MFAmethod")==="Symantec"){
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var isTOTPRegistered =nodeState.get("isTOTPRegistered")
        var isSyamtecRegistered = nodeState.get("isSyamtecRegistered")
        var isPUSHRegistered =nodeState.get("isPUSHRegistered")
        logger.debug("isSyamtecRegistered is in "+ isSyamtecRegistered)

        if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            action.goTo("back");


        }
        else if (selectedOutcome == 0) {

            if (isTOTPRegistered == true && isPUSHRegistered == true && isSyamtecRegistered == false) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo("symantec")
                }
            }
            else if (isTOTPRegistered == true && isPUSHRegistered == false && isSyamtecRegistered == false) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo("forgeRock")
                }
                else {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    action.goTo("symantec")

                }
            }
            else if (isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == false) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);

                action.goTo("forgeRock")
            }
            else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == true) {
                if (outcome == 0) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);

                    action.goTo("forgeRock")
                }
                else if (outcome == 1) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("TOTPType", "MSTOTP");
                    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                    action.goTo("microsoftTOTP")
                }
                else if (outcome == 2) {
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("validationErrorCode", null);
                    nodeState.putShared("TOTPType", "GTOTP");
                    nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                    action.goTo("googleTOTP")
                }
            }
                else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == true) {

                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                        nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                }
                else if (isTOTPRegistered == false && isPUSHRegistered == true && isSyamtecRegistered == false) {
                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                    else if (outcome == 3) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                       if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            logger.debug("1. inside limit reached ::"+ nodeState.get("limit"))
                            nodeState.putShared("script", "selectAuthenticators")
                            action.goTo("symantec");
                        }else{
                            action.goTo("symantec")
                        }
                    }
                }
                else if (isTOTPRegistered == false && isPUSHRegistered == false && isSyamtecRegistered == false) {
                    if (outcome == 0) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);

                        action.goTo("forgeRock")
                    }
                    else if (outcome == 1) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "MSTOTP");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Microsoft Authenticator OTP is initated successfully"+mail);
                        action.goTo("microsoftTOTP")
                    }
                    else if (outcome == 2) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("TOTPType", "GTOTP");
                        nodeLogger.info(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Google Authenticator OTP is initated successfully"+mail);
                        action.goTo("googleTOTP")
                    }
                    else if (outcome == 3) {
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("validationErrorCode", null);
                        if(nodeState.get("limit") === "reached" && nodeState.get("MFAmethod") === "Symantec"){
                            // nodeState.putShared("script", "selectAuthenticators")
                            nodeState.putShared("error","showed")
                            action.goTo("symantec");
                        }else{
                            action.goTo("symantec")
                        }
                    }
                }
            
        }
     }

}   
}catch(error){ 
    logger.error("Error in try:: "+ error)
}
}
main()
