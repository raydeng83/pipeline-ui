// Main Execution
try {
    var usrKOGID = nodeState.get("KOGID");
    // var usrKOGID ="e53843a0-4001-4294-8582-96cdf8eb4060"
    // nodeState.putShared("KOGID",usrKOGID)
    nodeState.putShared("OtherMFA", null);
    nodeState.putShared("mailLimit", null);
    var isTOTPRegistered = isMFARegistered(usrKOGID, "TOTP");
    if(!isTOTPRegistered){
        isTOTPRegistered = isMFARegistered(usrKOGID, "FRTOTP");
    }
    var isSyamtecRegistered = isMFARegistered(usrKOGID, "SYMANTEC")
    var isPUSHRegistered = isMFARegistered(usrKOGID, "PUSH")
    if(!isPUSHRegistered){
       isPUSHRegistered = isMFARegistered(usrKOGID, "FRPUSH");
    }
    var isPhoneRegistered = isMFARegistered(usrKOGID, "SMSVOICE")
    var isAlternateEmailRegistered = isMFARegistered(usrKOGID, "SECONDARY_EMAIL");
    if( nodeState.get("context") === "appEnroll"){
        isAlternateEmailRegistered = true
    }
    logger.debug("isAlternateEmailRegistered is ::: "+ isAlternateEmailRegistered)
    logger.debug("1: isTOTPRegistered , isSyamtecRegistered, isPUSHRegistered,isPhoneRegistered  " +isTOTPRegistered+isSyamtecRegistered + isPUSHRegistered +isPhoneRegistered) 
    if(nodeState.get("requiredMFACode")==="5"){
        isTOTPRegistered = false 
        isSyamtecRegistered = false 
        isPUSHRegistered = false
        isPhoneRegistered = true
        
    }
    else if((nodeState.get("requiredMFACode")==="4")){
        isTOTPRegistered = false
        isSyamtecRegistered = false
        isPUSHRegistered = false
        isPhoneRegistered = false
        
    }
   logger.debug("isTOTPRegistered , isSyamtecRegistered, isPUSHRegistered,isPhoneRegistered  " +isTOTPRegistered+isSyamtecRegistered + isPUSHRegistered +isPhoneRegistered) 
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {

}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var mfaOptions =null;
        var lib = require("KYID.Library.FAQPages");
        var process ="RegisterMFA";
        var pageHeader= "1_add_methods";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        nodeState.putShared("process", "RegisterMFA")
        nodeState.putShared("pageHeader", "1_add_methods")
        logger.debug("getFaqTopicId : "+getFaqTopicId);
        // if (nodeState.get("validationErrorCode") != null) {
        //     var errorMessage = nodeState.get("validationErrorCode")
        //     callbacksBuilder.textOutputCallback(0, errorMessage)
        // }
        
        var jsonobj = {"pageHeader": "1_add_methods"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
        //callbacksBuilder.textOutputCallback(0, "1_add_methods")
        // callbacksBuilder.textOutputCallback(0, "how_would_you_like_to_authenticate_when_signing_into_your_account?")
        // callbacksBuilder.textOutputCallback(0, "* Indicates a required field.")

        if(isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == true && isAlternateEmailRegistered == true){
            callbacksBuilder.textOutputCallback(0, "No MFA Method Left to Register")
            callbacksBuilder.confirmationCallback(0, ["Back"], 0);
        }
        else{
        if(isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == false && isAlternateEmailRegistered == true){
            nodeState.putShared("mfaOption1","MobilePhone")
            mfaOptions = ["MobilePhone"];   
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false) && isPhoneRegistered == true && isAlternateEmailRegistered == true){
            nodeState.putShared("mfaOption1","AuthenticatorApplication")         
            mfaOptions = ["AuthenticatorApplication"];
   
        }
              else if ((isTOTPRegistered == true || isSyamtecRegistered == true || isPUSHRegistered == true) && isPhoneRegistered == true && isAlternateEmailRegistered == false){
            nodeState.putShared("mfaOption3","AlternateEmail")         
            mfaOptions = ["AlternateEmail"];
   
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false) && isPhoneRegistered == false && isAlternateEmailRegistered == true){
            nodeState.putShared("mfaOption1","MobilePhone")
            nodeState.putShared("mfaOption2","AuthenticatorApplication")       
            mfaOptions = ["AuthenticatorApplication", "MobilePhone"];
  
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false ) && isPhoneRegistered == true && isAlternateEmailRegistered == false){
		nodeState.putShared("mfaOption2","AuthenticatorApplication")
            nodeState.putShared("mfaOption3","AlternateEmail")       
            mfaOptions = ["AuthenticatorApplication", "AlternateEmail"];
   
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false) && isPhoneRegistered == false && isAlternateEmailRegistered == false){
                nodeState.putShared("mfaOption1","MobilePhone")
              nodeState.putShared("mfaOption2","AuthenticatorApplication")
              nodeState.putShared("mfaOption3", "AlternateEmail");
            mfaOptions = ["AuthenticatorApplication", "MobilePhone", "AlternateEmail"];
    
        }
       
        var promptMessage = ".";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        if(nodeState.get("context")==="appEnroll"){
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }
        else{
            callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        }
        
        if (getFaqTopicId != null) {
        
        callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
        }
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses() {
    try {
        var outcome = null;
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.debug("selectedOutcome is =="+ selectedOutcome);
        //if((isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == true ) || nodeState.get("error") === "showed"){
        if(isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == true && isAlternateEmailregistered == true){
         outcome = null;
        }
        else{
            outcome = callbacks.getChoiceCallbacks().get(0)[0];
        }
        logger.debug("outcome is"+ outcome)
        if(outcome == 0){
            var method = "Symantec"
            nodeState.putShared("method", "Symantec")
        }else if(outcome == 1){
            var method = "phone"
            nodeState.putShared("method", "phone")
        }else if (outcome == 2){
            var method = "SECONDARY_EMAIL"
            nodeState.putShared("method", "SECONDARY_EMAIL");
        }else if (outcome == null){
            var method = nodeState.get("method");
        }
        if(selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("SelectPhonAuthNode","back");
            action.goTo("back");
         

        }
        
         else if(selectedOutcome === 0) {
             logger.debug("Selected 0 Outcome")
            // if(nodeState.get("error") === "showed"){
            //     action.goTo("limit");
            // }else
                if(isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == true && isAlternateEmailRegistered == true){
                logger.debug("All Methods Registered Going Back")
             nodeState.putShared("SelectPhonAuthNode","back");
             action.goTo("back");
        }
        else if(isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == false && isAlternateEmailRegistered == true){
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);
                action.goTo("phone")
            }
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false) && isPhoneRegistered == true && isAlternateEmailRegistered == true){
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);
                action.goTo("authenticator")
            }
        }
        else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false )&& isPhoneRegistered == false && isAlternateEmailRegistered == false){
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                action.goTo("authenticator")
            }
            else if (outcome == 1){
                nodeState.putShared("errorMessage", null);
                logger.debug("reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("limit") === "reached" && (nodeState.get("MFAmethod")===method)){
                     nodeState.putShared("error","showed")

                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                    logger.debug("GoingFOrPhoneReg")
                    action.goTo("phone")
                }
                
            }
            else if (outcome == 2){
                nodeState.putShared("errorMessage", null);
                logger.debug("Mail reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("mailLimit") === "reached" && (nodeState.get("MFAValue")===method)){
                     nodeState.putShared("error","showed")
                      nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                     nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                    nodeState.putShared("MFAMethodReporting", "SECONDARY_EMAIL"); //MFA Report
                    action.goTo("secondaryEmail");
                }
                
            }
        }else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false )&& isPhoneRegistered == false && isAlternateEmailRegistered == true){
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                action.goTo("authenticator")
            }
            else if (outcome == 1){
                nodeState.putShared("errorMessage", null);
                logger.debug("reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("limit") === "reached" && (nodeState.get("MFAmethod")===method)){
                     nodeState.putShared("error","showed")

                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                    logger.debug("GoingFOrPhoneReg")
                    action.goTo("phone")
                }
                
            }
            else if (outcome == 2){
                nodeState.putShared("errorMessage", null);
                logger.debug("Mail reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("mailLimit") === "reached" && (nodeState.get("MFAValue")===method)){
                     nodeState.putShared("error","showed")
                      nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                     nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                    nodeState.putShared("MFAMethodReporting", "SECONDARY_EMAIL"); //MFA Report
                    action.goTo("secondaryEmail");
                }
                
            }
        }
        else if ((isTOTPRegistered == true || isSyamtecRegistered == true || isPUSHRegistered == true )&& isPhoneRegistered == true && isAlternateEmailRegistered == false){
                        logger.debug("inside alternate email if in MFA journey ")
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);
             if(nodeState.get("mailLimit") === "reached" && (nodeState.get("MFAValue")===method)){
                     nodeState.putShared("error","showed")
                      nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                    nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                    nodeState.putShared("MFAMethodReporting", "SECONDARY_EMAIL"); //MFA Report
                    action.goTo("secondaryEmail");
                }
            }
        }else if ((isTOTPRegistered == false || isSyamtecRegistered == false || isPUSHRegistered == false ) && isPhoneRegistered == true && isAlternateEmailRegistered == false){
            if (outcome == 0) {
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("validationErrorCode", null);
                action.goTo("authenticator")
            }
            else if (outcome == 2){
                nodeState.putShared("errorMessage", null);
                logger.debug("reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("mailLimit") === "reached" && (nodeState.get("MFAValue")===method)){
                     nodeState.putShared("error","showed")
                     nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                   nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                    nodeState.putShared("MFAMethodReporting", "SECONDARY_EMAIL"); //MFA Report
                    action.goTo("secondaryEmail");
                }
                
            }

        }else if ((isTOTPRegistered == true || isSyamtecRegistered == true || isPUSHRegistered == true) && isPhoneRegistered == false && isAlternateEmailRegistered == false){
            if (outcome == 1){
                nodeState.putShared("errorMessage", null);
                logger.debug("reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("limit") === "reached" && (nodeState.get("MFAmethod")===method)){
                     nodeState.putShared("error","showed")

                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                    logger.debug("GoingFOrPhoneReg")
                    action.goTo("phone")
                }  
           
            }
            else if (outcome == 2){
                nodeState.putShared("errorMessage", null);
                logger.debug("reached limit:: "+ nodeState.get("limit"))
                if(nodeState.get("mailLimit") === "reached" && (nodeState.get("MFAValue")===method)){
                     nodeState.putShared("error","showed")
                     nodeState.putShared("MFAmethod", "SECONDARY_EMAIL");
                     //callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                     action.goTo("limit");
                }else{
                  //  nodeState.putShared("MFAMethod", "SECONDARY_EMAIL");
                    nodeState.putShared("MFAMethodReporting", "SECONDARY_EMAIL"); //MFA Report
                    action.goTo("secondaryEmail");
                }
                
            }

    }             
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error);
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
                return false;
            }
            else {
                logger.debug("Symantec MFAmethod")
                nodeState.putShared("limit","reached")
                nodeState.putShared("MFAmethod","Symantec")
                nodeState.putShared("MFAmethodS","Symantec")
                return false;
            }
        }
        else if (mfaMethod === "TOTP" || mfaMethod === "FRTOTP") {
            if (MFACount == 1) {
                return true
            }
            else {
                return false
            }
        }
        else if (mfaMethod === "PUSH" || mfaMethod === "FRPUSH") {
            if (MFACount == 1) {
                return true
            }
            else {
                return false
            }
        }
        else if (mfaMethod === "SMSVOICE") {
            if (MFACount < 3) {
                return false
            }
            else {
                logger.debug("inside count 3")
                nodeState.putShared("limit","reached")
                nodeState.putShared("MFAmethod","phone")
                return false
            }
        }
        else if (mfaMethod === "SECONDARY_EMAIL")
        {
            if (MFACount < 1) {
                return false;
            }
            else{
               nodeState.putShared("MFAValue", "SECONDARY_EMAIL");
               nodeState.putShared("mailLimit","reached");
                return true;
            }
        }
        else {
            return false
        }
    }


    else {
        return "No Response for mfaMethodResponses"
    }
}


function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        logger.debug("nodeState" + nodeState.get("browser"));
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = nodeState.get("browser") || "";
        eventDetails["OS"] = nodeState.get("os") || "";
        eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFAMethod"] = nodeState.get("MFAmethod") || null;
        var sessionDetails = {}
        var sessionDetail = null;
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = {
                "sessionRefId": ""
            }
        }

        userQueryResult = openidm.query("managed/alpha_user", {
            _queryFilter: 'userName eq "' + usrKOGID + '"'
        }, ["_id"]);
        requesteduserId = userQueryResult.result[0]._id;
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var userEmail = nodeState.get("mail") || "";
        if (typeof existingSession != 'undefined') {
            userId = existingSession.get("UserId")
        } else if (nodeState.get("_id")) {
            userId = nodeState.get("_id")
        }
        auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requesteduserId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
    } catch (error) {
        logger.error("Failed to log additonal recovery method" + error)
        //action.goTo(NodeOutcome.SUCCESS);
    }

}