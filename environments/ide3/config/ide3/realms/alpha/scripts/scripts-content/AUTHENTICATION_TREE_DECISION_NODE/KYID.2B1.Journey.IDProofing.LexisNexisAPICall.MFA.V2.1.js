var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select LexisNexisAPICall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexisAPICall.MFA.V2.1",
    timestamp: dateTime,
    end: "Node Execution Completed"
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


function main() {
    var userInfoJSON = nodeState.get("userInfoJSON")
    var userInfoJSON1 = nodeState.get("userInfoJSON1")
    if(userInfoJSON1 && userInfoJSON1.ssn){
        delete userInfoJSON1.ssn;
    }
   
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "userInfoJSON1 :: "+ userInfoJSON1);
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var context = null;
        var AppEnrollIDVerificationMethod = null;
        // var userInfoJSON = nodeState.get("userInfoJSON");
        var action = null;
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "RidpMethod :: "+ nodeState.get("RidpMethod"));
        if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
            nodeState.putShared("kbaStatus","noKBA")
            nodeState.putShared("isLNKbaRequired","false")
            handleUserResponses();
        }else if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
            action = "KBA"
            nodeState.putShared("isLNKbaRequired","true")
            var displayCallBackJSON = {
            "apiCalls":[
                {
                    "method" :"LexisNexis",
                    "action" : action,
                            
                }
            ],
            "collectedUserInfo": nodeState.get("userInfoJSON"),
            "userID": usrKOGID,
            "userMail": mail
            }
            if(nodeState.get("context")){
                context = nodeState.get("context")
            }
            if(nodeState.get("AppEnrollIDVerificationMethod")){
                AppEnrollIDVerificationMethod = nodeState.get("AppEnrollIDVerificationMethod")
            }
        
            if (callbacks.isEmpty()) {
                requestCallbacks(displayCallBackJSON);
            } else {
                handleUserResponses();
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
    }
}

main();

function requestCallbacks(displayCallBackJSON) {
    logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    try {
        if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
            var pageHeader= {"pageHeader": "4_RIDP_KBA"};
        }
        
        if (nodeState.get("validationMessage") != null) {
            logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + " validationMessage " + nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}

function handleUserResponses() {
    var selectedOutcome = null;
    var response = null;
    var uuid = null;
    var newLexID = [];
    var kbaResponse = null;
    var kbaParsedResponse = null
    var kbaResult = false;;
    var failedKBALexID = null;
    var parsedResponse = null;
    var proofingMethod = null;
    var searchResult = null;
    var userIdentity = null;
    var userLexID = null;
    var searchEmailArray = [];
    var journeyName = null;
    var _id = null
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses function");
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "journeyContext :: "+ nodeState.get("journeyContext"));
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "journeyName :: "+ nodeState.get("journeyName"));
        
        if(nodeState.get("journeyName")){
            journeyName = nodeState.get("journeyName");
        }

        if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
            selectedOutcome = 0;
        }else if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
            selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        }

    
        if(selectedOutcome === 0 && nodeState.get("RidpMethod")==="LexisNexisKBA"){
            kbaResponse = callbacks.getTextInputCallbacks().get(0);
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " kbaResponse " + JSON.stringify(kbaResponse));
            kbaParsedResponse = JSON.parse(kbaResponse);
            if(kbaParsedResponse.status && kbaParsedResponse.status !== null && kbaParsedResponse.status.toLowerCase() === "success"){
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KBA Verification Successful");
                nodeState.putShared("kbaStatus", "success");
                kbaResult = true
            }else if(kbaParsedResponse.status && kbaParsedResponse.status !== null && kbaParsedResponse.status.toLowerCase() === "failed"){
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KBA Verification Failed");
                nodeState.putShared("kbaStatus", "failed");
                kbaResult = false
            }else if(kbaParsedResponse.reason && kbaParsedResponse.reason != null && kbaParsedResponse.reason.toLowerCase() == "unexpected Error from service"){
                logger.error("Identified service error, routing to serviceError node");
            }
        }else if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexisNexis Verification Method - No KBA to process");
            kbaResult = true;
        }else{
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " invalid selection in selectedOutcome confirmation callback" + " :: "+ selectedOutcome);
            action.goTo("error");
        }

        if( nodeState.get("Response") && nodeState.get("Response") !== null){
            response = nodeState.get("Response")
            parsedResponse = JSON.parse(response);
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User Response: " + response); 
        }else{
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No response received from LexisNexis " + " :: "+ nodeState.get("Response"));
            action.goTo("error");
        }


        if(parsedResponse.lexId && parsedResponse.lexId != null && parsedResponse.lexId != ""){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " verifiedLexId received from LexisNexis: " + parsedResponse.lexId);
            verifiedLexId = parsedResponse.lexId;
            if(verifiedLexId && verifiedLexId !== null){
                if(kbaResult == true){
                    newLexID.push(parsedResponse.lexId);
                }else{
                    failedKBALexID = parsedResponse.lexId
                    nodeState.putShared("lexId",failedKBALexID)
                }
            }
            nodeState.putShared("verifiedLexId", parsedResponse.lexId);
            nodeState.putShared("verifiedLexIdHelpdesk", parsedResponse.lexId);
        }

        if(parsedResponse.riskIndicator && parsedResponse.riskIndicator != null && parsedResponse.riskIndicator != ""){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " riskIndicator received from LexisNexis: "+parsedResponse.riskIndicator);
            riskIndicator = parsedResponse.riskIndicator;
            nodeState.putShared("riskIndicator", parsedResponse.riskIndicator);
        }else{
            logger.debug("no riskIndicator")
        }

        if(parsedResponse.verificationStatus && parsedResponse.verificationStatus != null){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " verificationStatus is "+parsedResponse.verificationStatus);
            lexisNexisVerificationStatus = parsedResponse.verificationStatus;
            nodeState.putShared("verificationStatus", parsedResponse.verificationStatus);
        }else{
             logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + " no verificationStatus")
        }

        if(parsedResponse.userAttributes && parsedResponse.userAttributes != null && Array.isArray(parsedResponse.userAttributes) && parsedResponse.userAttributes.length > 0){
            nodeState.putShared("userAttributes", JSON.stringify(parsedResponse.userAttributes));
            nodeState.putShared("userAttributesForTransaction", parsedResponse.userAttributes);
        }else{
             logger.debug("no userAttributes")
        }

        // Code block to handle service error
        if((nodeState.get("reason") && nodeState.get("reason")=="service_error") || (parsedResponse.reason && parsedResponse.reason.toLowerCase() === "unexpected error from service")){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Identified service error, routing to serviceError node");
            nodeState.putShared("reason", "service_error"); 
            if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Update Profile or Organ Donor with service error");
                patchUserIdentity(userIdentity,"-1");
                auditLog("VER009", "Remote Identity Verification Failure");
                action.goTo("unableToVerify")
            }else if(nodeState.get("journeyName") === "createAccount"){
                 if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First time login with service error");
                    patchUserIdentity(userIdentity,"-1")
                    nodeState.putShared("MCISync","false")
                    auditLog("VER009", "Remote Identity Verification Failure");
                    action.goTo("MCISearch")
                }else{
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account with service error");
                    nodeState.putShared("MCISync","false")
                    action.goTo("MCISearch");
                }
            }else if(nodeState.get("journeyName")==="RIDP_LoginMain"){
                patchUserIdentity(userIdentity,"-1");
                auditLog("VER009", "Remote Identity Verification Failure");
                nodeState.putShared("unableToVerify","true");
                action.goTo("unableToVerify")
            }else if(nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="accountRecovery" ||  nodeState.get("journeyName")==="MFARecovery" || nodeState.get("isMFARecovery")==="true"){
                patchUserIdentity(userIdentity,"-1");
                auditLog("VER009", "Remote Identity Verification Failure");
                nodeState.putShared("unableToVerify","true");
                action.goTo("unableToVerify")
            }else if(nodeState.get("context")==="appEnroll"){
                nodeState.putShared("appEnrollUnableToVerify", "true");
                patchUserIdentity(userIdentity,"-1");
                auditLog("VER009", "Remote Identity Verification Failure");
                action.goTo("unableToVerify");
            }else{
                patchUserIdentity(userIdentity,"-1");
                auditLog("VER009", "Remote Identity Verification Failure");
                nodeState.putShared("unableToVerify","true");
                action.goTo("unableToVerify")
            }
        }else if(riskIndicator && riskIndicator.toLowerCase() === "high") {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            nodeState.putShared("errorMessage","KYID-LN-000")
            action.goTo("highRisk");
        }else if(nodeState.get("journeyContext") === "ridp"){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Journey Context is Standalone RIDP");
            if(newLexID.length === 1 && nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                 action.goTo("standaloneSuccess");
            }else{
                  nodeState.putShared("unableToVerify","true");
                  action.goTo("unableToVerify")  
            }
        }else{
            var isValidInputs = isValidInput(newLexID)
            if(isValidInputs===false){
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Invalid Inputs received from LexisNexis or not a proper array " + " :: "+ newLexID);
                action.goTo("error");
            }else{
                if (selectedOutcome === 0) {
                    nodeState.putShared("validationErrorCode", null);
                    proofingMethod = nodeState.get("proofingMethod");
                    var _id = nodeState.get("_id");
                    var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
                    var userMatch= []
                    var terminatedFound = []
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " proofingMethod is :: "+ proofingMethod);
                    logger.debug("_id :: "+ _id)
                    logger.debug("mail :: "+ mail)
                    if(newLexID.length === 1 && nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                        //Single LexID Found
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "userLexID in nodeState --> "+ nodeState.get("uuid"))
                        userLexID = nodeState.get("uuid");
                        searchResult = searchUserIdentity(newLexID[0])
                        userIdentity = nodeState.get("userIdentity");
                        nodeLogger.debug("searchResult is --> "+JSON.stringify(searchResult));
                        if(searchResult && searchResult.resultCount>0){
                            //Iterate over searchResult
                            searchResult.result.forEach(function(user) {
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID Search Result :: " + JSON.stringify(user.account));
                                user = user.account[0]
                                logger.debug("user._id :: "+ user._id)
                                logger.debug("user.mail :: "+ user.mail)
                                if(user._id && user._id !== null && user.mail && user.mail !== null && user.accountStatus && user.accountStatus !== null && user.accountStatus &&  user.accountStatus.toLowerCase() !== "terminated"){
                                    if(user._id == _id || user.mail == mail){
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "user searched with newLexID matched with logged in user");
                                        userMatch.push(user.mail)
                                    }else{
                                        searchEmailArray.push(user.mail)
                                    }
                                }else{
                                    if( user.accountStatus && user.accountStatus.toLowerCase() !== "terminated"){
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Terminated account found with LexID");
                                        terminatedFound.push(user.mail);                                  
                                    }
                                }
                            });
                            logger.debug("userMatch Array length :: " + userMatch.length)
                            logger.debug("searchEmailArray Array length :: " + searchEmailArray.length)
                            logger.debug("terminatedFound Array length :: " + terminatedFound.length)
                            nodeState.putShared("searchEmailArray",searchEmailArray)
                            if(userLexID && userLexID !== null ){
                                if(userMatch.length === 0 && searchEmailArray.length > 0){
                                    // LexID's does not match
                                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " :: " + "verifiedLexID and userLexID does not match");
                                    nodeState.putShared("lexId",null)
                                    // nodeState.putShared("verificationMismatch", true)
                                    // nodeState.putShared("proofingMethod","-1")
                                    if(nodeState.get("journeyName") !== "createAccount"){
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Non Create Account journey with mismatched lexid, verification failed unable to verify");
                                        nodeState.putShared("unableToVerify","true")
                                        action.goTo("unableToVerify");
                                    }else if(nodeState.get("journeyName")==="createAccount" && nodeState.get("firsttimeloginjourneyskip") == "false"){
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First time login , verification failed unable to verify");
                                        nodeState.putShared("unableToVerify","true")
                                        action.goTo("unableToVerify");
                                    }else{
                                        action.goTo("createAccount");
                                    }
                                }else{
                                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "verifiedLexID and userLexID match, verification success");
                                    nodeState.putShared("uuid",newLexID[0])
                                    nodeState.putShared("lexId",newLexID[0])
                                    nodeState.putShared("MCISync","true")
                                    nodeState.putShared("validationMessage", null);
                                    nodeState.putShared("LexIdMachFound", true)
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    if(nodeState.get("journeyName")==="createAccount"){
                                        if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First time login with matched lexid, verification success")
                                            patchUserIdentity(userIdentity,"1")
                                            action.goTo("firstTimeLogin")
                                        }else{
                                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Create Account with matched lexid, verification success")
                                            auditLog("VER008", "Remote Identity Verification Success");
                                            action.goTo("createAccount")
                                        }
                                        
                                    }//else if(nodeState.get("context")==="appEnroll"){
                                        else if(nodeState.get("prereqStatus") == "REVERIFY"){
                                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "App Enroll with matched lexid, verification success and status REVERIFY")
                                            nodeState.putShared("proofingMethod", "4")
                                            patchUserIdentity(userIdentity,"4")
                                        //}
                                    }else{
                                        //Going MCI SYNC
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " :: " + journeyName + " :: "+"with matched lexid, verification success")
                                        patchUserIdentity(userIdentity,proofingMethod)
                                        auditLog("VER008", "Remote Identity Verification Success");
                                        action.goTo("MCISYNC")
                                    }
                                }
                            }else{
                                //Logged in user does not have any LexID associated
                                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " :: " + "Logged in user does not have any LexID associated")
                                nodeState.putShared("lexId",newLexID[0])
                                
                                if(nodeState.get("journeyName")==="createAccount"){
                                    if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First time login with no prior lexid, verification success")
                                        patchUserIdentity(userIdentity,"1")
                                        nodeState.putShared("uuid",newLexID[0])
                                        nodeState.putShared("lexId",newLexID[0])
                                        nodeState.putShared("MCISync","true")
                                        nodeState.putShared("validationMessage", null);
                                        nodeState.putShared("LexIdMachFound", true)
                                        nodeState.putShared("prereqStatus","COMPLETED")
                                        patchUserIdentity(userIdentity,proofingMethod)
                                        auditLog("VER008", "Remote Identity Verification Success");
                                        action.goTo("createAccount")
                                    }else{
                                        if(searchResult.result[0].account.length>0){
                                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " CREATE ACCOUN no prior lexid, verification success")
                                            nodeLogger.debug("searchMail is in createAccount -->"+searchResult.result[0].account[0].mail)
                                            var searchMail = searchResult.result[0].account[0].mail
                                            var searchEmailArray = []
                                            searchEmailArray.push(searchMail)
                                            nodeState.putShared("searchEmailArray",searchEmailArray) 
                                        }
                                    if(nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                                        nodeState.putShared("MCISync","true")
                                    }
                                    action.goTo("createAccount")
                                    }
                                }else if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                                    nodeState.putShared("uuid",newLexID[0])
                                    nodeState.putShared("lexId",newLexID[0])
                                    nodeState.putShared("MCISync","true")
                                    nodeState.putShared("validationMessage", null);
                                    nodeState.putShared("LexIdMachFound", true)
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    patchUserIdentity(userIdentity,proofingMethod)
                                    auditLog("VER008", "Remote Identity Verification Success");
                                    action.goTo("MCISYNC")
                                }else if(nodeState.get("context")==="appEnroll"){
                                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " App Enroll, user no prior lexid going for MCI search")
                                    action.goTo("MCISearch")
                                }
                                else{
                                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Other journey with no prior lexid, verification failed")
                                    nodeState.putShared("unableToVerify","true")
                                    action.goTo("unableToVerify")
                                }
                             }
                        }else{
                            //MCI Search
                            if(userLexID && userLexID !== null ){
                                if(userLexID != newLexID[0]){
                                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No LexID found in search with verifiedLexID, but user has existing lexID, verification failed")
                                    if(nodeState.get("journeyName") == "createAccount"){
                                        if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "First Time Login , going to unableToVerify")
                                            nodeState.putShared("unableToVerify","true")
                                            action.goTo("unableToVerify");
                                        }else{
                                            action.goTo("createAccount")
                                        }
                                    }else{
                                        nodeState.putShared("unableToVerify","true")
                                        action.goTo("unableToVerify");
                                    }
                                }
                                else{
                                    // Edge Case: If User LexID and LexisNexis Response ID is matching
                                    nodeState.putShared("uuid",newLexID[0])
                                    nodeState.putShared("lexId",newLexID[0])
                                    nodeState.putShared("MCISync","true")
                                    nodeState.putShared("validationMessage", null);
                                    nodeState.putShared("LexIdMachFound", true)
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    patchUserIdentity(userIdentity,proofingMethod)
                                     auditLog("VER008", "Remote Identity Verification Success");
                                    action.goTo("MCISYNC")
                                }
                            }else{
                                nodeState.putShared("lexId",newLexID[0])
                                action.goTo("MCISearch")
                            }

                        }
                    }else{
                        // LexID greater than 1 or Zero
                        // nodeState.putShared("notVerified","true")
                        nodeState.putShared("uuid", null);
                        nodeState.putShared("newLexID", null);
                        nodeState.putShared("lexId",null);
                        nodeState.putShared("verifiedLexId",null);
                        nodeState.putShared("proofingMethod","-1")
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID is greater than 1 or Zero " + " :: "+ newLexID);
                        var userIdentity = nodeState.get("userIdentity");
                        if(nodeState.get("journeyName")==="createAccount"){
                            // Checking First time login
                            if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                patchUserIdentity(userIdentity,"-1");
                                auditLog("VER009", "Remote Identity Verification Failure"); 
                            }
                            else if(nodeState.get("journeyName")==="RIDP_LoginMain"){
                                logger.error("First time login with unable to verify identity, continuing journey");
                                patchUserIdentity(userIdentity,"-1");
                                nodeLogger.debug("User verification failed");
                                //Continue Journey for first time login
                            }
                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Create Account with unable to verify identity, going to MCI Search");
                            action.goTo("createAccount");
                        }else if(nodeState.get("context")==="appEnroll"){
                            nodeState.putShared("appEnrollUnableToVerify", "true");
                            if(nodeState.get("LexisNexisFARS")==="true"){
                                nodeState.putShared("prereqStatus", "PENDING");
                            }
                            else{
                                nodeState.putShared("LexisNexisFARS","true")
                                nodeState.putShared("prereqStatus", "REVERIFY");
                            }

                            //Generating REFID for lexisNexis
                            if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                                if(!nodeState.get("refId")){
                                refId= generateGUID()
                                nodeState.putShared("refId",refId)   
                                }
                            }
                            // Fars Scenario
                            patchUserIdentity(userIdentity,"-1");
                            auditLog("VER009", "Remote Identity Verification Failure");
                            action.goTo("FARS");
                        }else if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                            logger.error("Update Profile or Organ Donor with unable to verify identity, verification failed")
                            if(nodeState.get("userIdentity")!= null && nodeState.get("userIdentity")){
                                patchUserIdentity(userIdentity,"-1");
                                nodeState.putShared("unableToVerify",null)
                                nodeLogger.debug("Update Profile Not Verified Success")
                                auditLog("VER009", "Remote Identity Verification Failure"); 
                                action.goTo("updateprofile_organdonor");
                            }
                        }else{                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                            nodeState.putShared("unableToVerify","true")
                            nodeLogger.debug("unableToVerify")
                            patchUserIdentity(userIdentity,"-1");
                            auditLog("VER009", "Remote Identity Verification Failure");
                            action.goTo("unableToVerify")
                            //action.goTo("unableToVerify");
                        } 
                    }
                }
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }
}

function searchUserIdentity(lexId) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "srating searching user with verified lexId "+ lexId);
    try {
        logger.debug("lexId is --> "+lexId)
        var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'uuid eq "' + lexId + '"' }, ["account/*",["*"]]);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "userIdentityResponse with verified lexId :: " + JSON.stringify(userIdentityResponse));
        if(userIdentityResponse){
            return userIdentityResponse
        }else{
            return null
        }
    } catch (error) {
        logger.error("Error Occurred While searchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error searchUserIdentity Function" + error.message);
    }    
}

function patchUserIdentity(selectedUser, verifiedLexId, proofingMethod) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    selectedUser = nodeState.get("mail") || nodeState.get("EmailAddress")
    logger.debug("selectedUser is :: "+ selectedUser)
    try {
        //var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["*","custom_userIdentity/*"]);
        var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["_id","frIndexedString1","frIndexedString2","userName","custom_organdonor","custom_userIdentity/*"]);

        if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
            if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity._id){
                var Id = pingSearchResponse.result[0].custom_userIdentity._id
                nodeState.putShared("patchUserId",Id)
                //var proofingMethod = "4";
                logger.debug("_patchUserIdentity id is --> "+Id)
                var jsonArray = []
                nodeState.putShared("orig_logOn", pingSearchResponse.result[0].frIndexedString1);
                nodeState.putShared("orig_upn", pingSearchResponse.result[0].frIndexedString2);
                nodeState.putShared("KOGID", pingSearchResponse.result[0].userName);
                 nodeState.putShared("organDonorStatus", pingSearchResponse.result[0].custom_organdonor);
               
                if(!((nodeState.get("context") =="appEnroll" || nodeState.get("journeyName")==="MFARecovery") && nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase()== "notverified")){
                    if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
                        nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
                        var userAttributes = JSON.parse(nodeState.get("userAttributes"));
                        nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
                        if(Array.isArray(userAttributes) && userAttributes.length > 0){
                            userAttributes.forEach(function(attribute){
                            // nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))

                            if(attribute.attributeName.toLowerCase()=="firstname"){
                                    if(nodeState.get("givenName")){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "givenName",
                                        "value": nodeState.get("givenName")
                                        }
                                        jsonArray.push(jsonObj)
                                    }
                                    
                                    if(attribute.correctedValue){
                                        var jsonObj = { 
                                            "operation": "replace",
                                            "field": "corrected_givenName",
                                            "value": attribute.correctedValue || ""
                                            }
                                            jsonArray.push(jsonObj)
                                    }

                                    if(attribute.status){
                                        var jsonObj = {
                                            "operation": "replace",
                                            "field": "status_givenName",
                                            "value": attribute.status
                                            }
                                            jsonArray.push(jsonObj)
                                    }
                            }

                            if(attribute.attributeName.toLowerCase()=="lastname"){
                                if(nodeState.get("sn")){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "sn",
                                        "value": nodeState.get("sn")
                                        }
                                        jsonArray.push(jsonObj)
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_sn",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }

                                if(attribute.status){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "status_sn",
                                        "value": attribute.status || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="middlename"){
                                if(nodeState.get("custom_middleName") && nodeState.get("custom_middleName")!==null){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "middleName",
                                    "value": nodeState.get("custom_middleName")
                                    }
                                    jsonArray.push(jsonObj) 
                                }else{
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "middleName",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj) 
                                    
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_middleName",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }

                                if(attribute.status){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "status_middleName",
                                        "value": attribute.status || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="dob"){
                                if(nodeState.get("custom_dateofBirth")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "dob",
                                    "value": nodeState.get("custom_dateofBirth")
                                    }
                                    jsonArray.push(jsonObj) 
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_dob",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }

                                if(attribute.status){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "status_dob",
                                        "value": attribute.status || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="addressline1"){
                                //Address Line1
                                if(nodeState.get("postalAddress")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "addressLine1",
                                    "value": nodeState.get("postalAddress")
                                    }
                                    jsonArray.push(jsonObj)  
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "addressLine1",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_addressLine1",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="addressline2"){
                                if(nodeState.get("custom_postalAddress2")){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "addressLine2",
                                        "value": nodeState.get("custom_postalAddress2")
                                    }
                                    jsonArray.push(jsonObj)
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "addressLine2",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_addressLine2",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="city"){
                                if(nodeState.get("city")){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "city",
                                        "value": nodeState.get("city")
                                        }
                                        jsonArray.push(jsonObj) 
                                    }else{
                                        var jsonObj = {
                                        "operation": "replace",
                                        "field": "city",
                                        "value": ""
                                        }
                                        jsonArray.push(jsonObj) 
                                    }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_city",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="state"){
                                if(nodeState.get("stateProvince")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "stateCode",
                                    "value": nodeState.get("stateProvince")
                                    }
                                    jsonArray.push(jsonObj)  
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "stateCode",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                    
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_stateCode",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            if(attribute.attributeName.toLowerCase()=="county"){
                                if(nodeState.get("custom_county")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "countyCode",
                                    "value": nodeState.get("custom_county")
                                    }
                                    jsonArray.push(jsonObj)   
                                }
                                else if(nodeState.get("orig_custom_county")){
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "countyCode",
                                    "value": nodeState.get("orig_custom_county")
                                    }
                                    jsonArray.push(jsonObj)  
                                }
                                else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "countryCode",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_countyCode",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }

                            }

                            if(attribute.attributeName.toLowerCase()=="countrycode"){
                                if(nodeState.get("orig_custom_country") || nodeState.get("country")){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "countryCode",
                                        "value": nodeState.get("orig_custom_country") || nodeState.get("country")
                                        }
                                        jsonArray.push(jsonObj)   
                                    }else{
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "countryCode",
                                        "value": ""
                                        }
                                        jsonArray.push(jsonObj)   
                                        
                                    }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_countryCode",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }


                            if(attribute.attributeName.toLowerCase()=="zipcode"){
                                if(nodeState.get("zip")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "zip",
                                    "value": nodeState.get("zip") || ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "zip",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }
                                logger.error("Corrected Zip is "+attribute.correctedValue )

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_zip",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }


                            if(attribute.attributeName.toLowerCase()=="zipextension"){
                                    if(nodeState.get("zipExtension")){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "zipExtension",
                                    "value": nodeState.get("zipExtension")
                                    }
                                    jsonArray.push(jsonObj)  
                                }else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "zipExtension",
                                    "value": ""
                                    }
                                    jsonArray.push(jsonObj)  
                                }

                                if(attribute.correctedValue){
                                    var jsonObj = {
                                        "operation": "replace",
                                        "field": "corrected_zipExtension",
                                        "value": attribute.correctedValue || ""
                                        }
                                        jsonArray.push(jsonObj)
                                }
                            }

                            });
                        }
                    }

                        //Given Name
                    if (nodeState.get("givenName")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "givenName",
                            "value": nodeState.get("givenName")
                        }
                        jsonArray.push(jsonObj)
                    }
        
                    //Middle Name
                    if (nodeState.get("custom_middleName") && nodeState.get("custom_middleName") !== null) {
                        logger.debug("custom_middleName is in patch :: " + nodeState.get("custom_middleName"))
                        logger.debug("orig_custom_middleName is in patch :: " + nodeState.get("orig_custom_middleName"))
                        var jsonObj = {
                            "operation": "replace",
                            "field": "middleName",
                            "value": nodeState.get("custom_middleName")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "middleName",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }
        
                    //SN
                    if (nodeState.get("sn")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "sn",
                            "value": nodeState.get("sn")
                        }
                        jsonArray.push(jsonObj)
                    }

                    //Suffix
                    if (nodeState.get("custom_suffix")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "suffix",
                            "value": nodeState.get("custom_suffix")
                        }
                        jsonArray.push(jsonObj)
                    }
        
        
        
                    //Gender
                    if (nodeState.get("custom_gender")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "gender",
                            "value": nodeState.get("custom_gender")
                        }
                        jsonArray.push(jsonObj)
                    }
        
                    //DOB
                    if (nodeState.get("custom_dateofBirth")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "dob",
                            "value": nodeState.get("custom_dateofBirth")
                        }
                        jsonArray.push(jsonObj)
                    }

                    //isHomeless
                    if(nodeState.get("isHomeless")){
                    var jsonObj = {
                        "operation": "replace",
                        "field": "isHomeless",
                        "value": JSON.parse(nodeState.get("isHomeless"))
                        }
                        jsonArray.push(jsonObj)  
                    }
                    else{
                    var jsonObj = {
                        "operation": "replace",
                        "field": "isHomeless",
                        "value": false
                        }
                        jsonArray.push(jsonObj)  
                        
                    }

                    //Address Line1
                    if (nodeState.get("postalAddress")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "addressLine1",
                            "value": nodeState.get("postalAddress")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "addressLine1",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //Address Line2
                    if (nodeState.get("custom_postalAddress2")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "addressLine2",
                            "value": nodeState.get("custom_postalAddress2")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "addressLine2",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //City
                    if (nodeState.get("city")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "city",
                            "value": nodeState.get("city")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "city",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //Postal Code
                    if (nodeState.get("postalCode")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "zip",
                            "value": nodeState.get("postalCode") || ""
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "zip",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //Postal Extension
                    if (nodeState.get("zipExtension")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "zipExtension",
                            "value": nodeState.get("zipExtension")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "zipExtension",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                    }


                    //Country Code
                    if (nodeState.get("stateProvince")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "stateCode",
                            "value": nodeState.get("stateProvince")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "stateCode",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //County Code
                    if (nodeState.get("custom_county")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "countyCode",
                            "value": nodeState.get("custom_county")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "countyCode",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //Title Code
                    if (nodeState.get("custom_title") || nodeState.get("orig_custom_title")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "title",
                            "value": nodeState.get("custom_title") || nodeState.get("orig_custom_title")
                        }
                        jsonArray.push(jsonObj)
                    }
                    else{
                        var jsonObj = {
                            "operation": "replace",
                            "field": "title",
                            "value": ""
                        }
                        jsonArray.push(jsonObj)
                        
                    }

                    //LanguagePreference
                    if (nodeState.get("languagePreference")) {
                        var jsonObj = {
                            "operation": "replace",
                            "field": "languagePreference",
                            "value": nodeState.get("languagePreference")
                        }
                        jsonArray.push(jsonObj)
                    }
                    
                    //Proofing Method
                    if(nodeState.get("proofingMethod")){
                        var jsonObj = {
                            "operation": "replace",
                            "field": "proofingMethod",
                            "value": nodeState.get("proofingMethod")
                            }
                            jsonArray.push(jsonObj) 
                        } 
                    }
                    
                    //riskIndicator
                    if(nodeState.get("riskIndicator") ){
                    var jsonObj = {
                        "operation": "replace",
                        "field": "riskIndicator",
                        "value": nodeState.get("riskIndicator")
                        }
                        jsonArray.push(jsonObj)
                    }

                    //flowName
                    if( nodeState.get("flowName") && nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                    var jsonObj = {
                        "operation": "replace",
                        "field": "lastVerificationMethod",
                        "value": nodeState.get("flowName")
                        }
                        jsonArray.push(jsonObj)
                    }

                    //assuranceLevel
                    if(nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified"){
                        var jsonObj = {
                            "operation": "replace",
                            "field": "assuranceLevel",
                            "value": "1"
                            }
                            jsonArray.push(jsonObj)  
                    }

                //kbaStatus
                    var jsonObj = {
                        "operation": "replace",
                        "field": "kbaStatus",
                        "value": nodeState.get("kbaStatus") || "noKBA"
                        }
                        jsonArray.push(jsonObj)

                    //uuid
                    if(nodeState.get("lexId") && nodeState.get("verificationStatus") && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                    var jsonObj = {
                        "operation": "replace",
                        "field": "uuid",
                        "value": nodeState.get("lexId")
                        }
                        jsonArray.push(jsonObj)   
                    }


                }

                //verificationStatus
                if(nodeState.get("verificationStatus") ){
                  var jsonObj = {
                    "operation": "replace",
                    "field": "verificationStatus",
                    "value": nodeState.get("verificationStatus")
                    }
                    jsonArray.push(jsonObj)
                }

                //reason for failure
                if(nodeState.get("reason") && nodeState.get("reason")!==null && nodeState.get("reason") === "service_error"){
                var jsonObj = {
                    "operation": "replace",
                    "field": "reason",
                    "value": nodeState.get("reason")
                    }
                    jsonArray.push(jsonObj)   
                }else{
                    var jsonObj = {
                    "operation": "replace",
                    "field": "reason",
                    "value": ""
                    }
                    jsonArray.push(jsonObj)
                }              

                

                //verificationMismatch
                if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!==null && nodeState.get("verificationMismatch") === true){
                var jsonObj = {
                    "operation": "replace",
                    "field": "verificationMismatch",
                    "value": nodeState.get("verificationMismatch")
                    }
                    jsonArray.push(jsonObj)   
                }else{
                    var jsonObj = {
                    "operation": "replace",
                    "field": "verificationMismatch",
                    "value": false
                    }
                    jsonArray.push(jsonObj)
                }
            
                //lastVerificationDate
                var jsonObj = {
                    "operation": "replace",
                    "field": "lastVerificationDate",
                    "value": dateTime
                    }
                    jsonArray.push(jsonObj) 
            
                 
                //assuranceLevel
                var jsonObj = {
                    "operation": "replace",
                    "field": "assuranceLevel",
                    "value": "1"
                    }
                    jsonArray.push(jsonObj)   

                //updateDate
                var jsonObj = {
                    "operation": "replace",
                    "field": "updateDate",
                    "value": dateTime
                    }
                    jsonArray.push(jsonObj)

                //updateDateEpoch
                var jsonObj = {
                    "operation": "replace",
                    "field": "updateDateEpoch",
                    "value": currentTimeEpoch
                    }
                    jsonArray.push(jsonObj)

                logger.debug("jsonArray in KYID.2B1.Journey.IDProofing.LexisNexisAPICall.MFA.V2.1 is :: "+ JSON.stringify(jsonArray))
                if(jsonArray.length>0){
                    var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
                    logger.debug("Patch Response -->"+response)
                    if(response){
                        return true
                    }
                }else{
                    return false
                }  

            }
        
    } catch (error) {
        logger.error("Error Occurred While patchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
    }    
}


function generateGUID() {
    const firstName = nodeState.get("givenName") ||"A"
    const firstLetter = firstName.charAt(0).toUpperCase();
    const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000; // 10 digits
    return `${firstLetter}${randomNumber}`;
}

function isValidInput(newLexID) { 

    if(Array.isArray(newLexID)){
        if(newLexID.length>=0){
            if(newLexID.length > 0){
                newLexID.filter(item => typeof item === "string");
            }
        }else{
            nodeState.putShared("validationMessage", "invalid_input");
            return false;
        }
    }else{
        nodeState.putShared("validationMessage", "invalid_input");
        logger.error("IN MY ERROR "+newLexID);
        return false;
    }   
}

function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        var browser = requestHeaders.get("user-agent");
        var os = requestHeaders.get("sec-ch-ua-platform");
        var userId = null;
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = browser;
        eventDetails["OS"] = os;
        eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
        }
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

        if (userEmail) {
            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: 'mail eq "' + userEmail + '"'
            }, ["_id"]);
            userId = userQueryResult.result[0]._id;
        }
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}


// function patchUserIdentity(selectedUser, verifiedLexId, proofingMethod) {
//     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
//     selectedUser = nodeState.get("mail") || nodeState.get("EmailAddress")
//     logger.debug("selectedUser is :: "+ selectedUser)
//     try {
//         var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["*","custom_userIdentity/*"]);

//         if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
//             if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity._id){
//                 var Id = pingSearchResponse.result[0].custom_userIdentity._id
//                 nodeState.putShared("patchUserId",Id)
//                 //var proofingMethod = "4";
//                 logger.debug("_patchUserIdentity id is --> "+Id)
//                 var jsonArray = []
//                 nodeState.putShared("orig_logOn", pingSearchResponse.result[0].frIndexedString1);
//                 nodeState.putShared("orig_upn", pingSearchResponse.result[0].frIndexedString2);
//                 nodeState.putShared("KOGID", pingSearchResponse.result[0].userName);
//                  nodeState.putShared("organDonorStatus", pingSearchResponse.result[0].custom_organdonor);
               


//                 if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
//                     nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
//                     var userAttributes = JSON.parse(nodeState.get("userAttributes"));
//                     nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
//                     if(Array.isArray(userAttributes) && userAttributes.length > 0){
//                         userAttributes.forEach(function(attribute){
//                         nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))

//                         if(attribute.attributeName.toLowerCase()=="firstname"){
//                               if(nodeState.get("givenName")){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "givenName",
//                                     "value": nodeState.get("givenName")
//                                     }
//                                     jsonArray.push(jsonObj)
//                                 }
                                
//                                 if(attribute.correctedValue){
//                                     var jsonObj = { 
//                                         "operation": "replace",
//                                         "field": "corrected_givenName",
//                                         "value": attribute.correctedValue || ""
//                                         }
//                                         jsonArray.push(jsonObj)
//                                 }

//                                 if(attribute.status){
//                                     var jsonObj = {
//                                         "operation": "replace",
//                                         "field": "status_givenName",
//                                         "value": attribute.status
//                                         }
//                                         jsonArray.push(jsonObj)
//                                 }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="lastname"){
//                             if(nodeState.get("sn")){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "sn",
//                                     "value": nodeState.get("sn")
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_sn",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_sn",
//                                     "value": attribute.status || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="middlename"){
//                             if(nodeState.get("custom_middleName") && nodeState.get("custom_middleName")!==null){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "middleName",
//                                 "value": nodeState.get("custom_middleName")
//                                 }
//                                 jsonArray.push(jsonObj) 
//                             }else{
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "middleName",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj) 
                                
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_middleName",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_middleName",
//                                     "value": attribute.status || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="dob"){
//                             if(nodeState.get("custom_dateofBirth")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "dob",
//                                 "value": nodeState.get("custom_dateofBirth")
//                                 }
//                                 jsonArray.push(jsonObj) 
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_dob",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_dob",
//                                     "value": attribute.status || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="addressline1"){
//                             //Address Line1
//                             if(nodeState.get("postalAddress")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "addressLine1",
//                                 "value": nodeState.get("postalAddress")
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "addressLine1",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_addressLine1",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="addressline2"){
//                             if(nodeState.get("custom_postalAddress2")){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "addressLine2",
//                                     "value": nodeState.get("custom_postalAddress2")
//                                 }
//                                 jsonArray.push(jsonObj)
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "addressLine2",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_addressLine2",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="city"){
//                             if(nodeState.get("city")){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "city",
//                                     "value": nodeState.get("city")
//                                     }
//                                     jsonArray.push(jsonObj) 
//                                 }else{
//                                     var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "city",
//                                     "value": ""
//                                     }
//                                     jsonArray.push(jsonObj) 
//                                 }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_city",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="stateCode"){
//                             if(nodeState.get("stateProvince")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "stateCode",
//                                 "value": nodeState.get("stateProvince")
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "stateCode",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
                                
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_stateCode",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName.toLowerCase()=="countyCode"){
//                             if(nodeState.get("postalCode")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zip",
//                                 "value": nodeState.get("postalCode")
//                                 }
//                                 jsonArray.push(jsonObj)   
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zip",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_zip",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                         }

//                         if(attribute.attributeName.toLowerCase()=="countrycode"){
//                             if(nodeState.get("orig_custom_country") || nodeState.get("country")){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "countryCode",
//                                     "value": nodeState.get("orig_custom_country") || nodeState.get("country")
//                                     }
//                                     jsonArray.push(jsonObj)   
//                                 }else{
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "countryCode",
//                                     "value": ""
//                                     }
//                                     jsonArray.push(jsonObj)   
                                    
//                                 }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_countryCode",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }


//                         if(attribute.attributeName.toLowerCase()=="zip"){
//                             if(nodeState.get("zip")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zip",
//                                 "value": nodeState.get("zip") || ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zip",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_zip",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }


//                         if(attribute.attributeName.toLowerCase()=="zipextension"){
//                              if(nodeState.get("zipExtension")){
//                             var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zipExtension",
//                                 "value": nodeState.get("zipExtension")
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }else{
//                                 var jsonObj = {
//                                 "operation": "replace",
//                                 "field": "zipExtension",
//                                 "value": ""
//                                 }
//                                 jsonArray.push(jsonObj)  
//                             }

//                             if(attribute.correctedValue){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "corrected_zipExtension",
//                                     "value": attribute.correctedValue || ""
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         });
//                     }
//                 }

//                 //Given Name
//                 if (nodeState.get("givenName")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "givenName",
//                         "value": nodeState.get("givenName")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
    
//                 //Middle Name
//                 if (nodeState.get("custom_middleName") && nodeState.get("custom_middleName") !== null) {
//                     logger.debug("custom_middleName is in patch :: " + nodeState.get("custom_middleName"))
//                     logger.debug("orig_custom_middleName is in patch :: " + nodeState.get("orig_custom_middleName"))
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "middleName",
//                         "value": nodeState.get("custom_middleName")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "middleName",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }
    
//                 //SN
//                 if (nodeState.get("sn")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "sn",
//                         "value": nodeState.get("sn")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //Suffix
//                 if (nodeState.get("custom_suffix")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "suffix",
//                         "value": nodeState.get("custom_suffix")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
    
    
    
//                 //Gender
//                 if (nodeState.get("custom_gender")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "gender",
//                         "value": nodeState.get("custom_gender")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
    
//                 //DOB
//                 if (nodeState.get("custom_dateofBirth")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "dob",
//                         "value": nodeState.get("custom_dateofBirth")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //isHomeless
//                 if(nodeState.get("isHomeless")){
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "isHomeless",
//                     "value": JSON.parse(nodeState.get("isHomeless"))
//                     }
//                     jsonArray.push(jsonObj)  
//                 }
//                 else{
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "isHomeless",
//                     "value": false
//                     }
//                     jsonArray.push(jsonObj)  
                    
//                 }

//                 //Address Line1
//                 if (nodeState.get("postalAddress")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "addressLine1",
//                         "value": nodeState.get("postalAddress")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "addressLine1",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //Address Line2
//                 if (nodeState.get("custom_postalAddress2")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "addressLine2",
//                         "value": nodeState.get("custom_postalAddress2")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "addressLine2",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //City
//                 if (nodeState.get("city")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "city",
//                         "value": nodeState.get("city")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "city",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //Postal Code
//                 if (nodeState.get("postalCode")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "zip",
//                         "value": nodeState.get("postalCode") || ""
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "zip",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //Postal Extension
//                 if (nodeState.get("zipExtension")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "zipExtension",
//                         "value": nodeState.get("zipExtension")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "zipExtension",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
//                 }


//                 //Country Code
//                 if (nodeState.get("stateProvince")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "stateCode",
//                         "value": nodeState.get("stateProvince")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "stateCode",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //County Code
//                 if (nodeState.get("custom_county")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "countyCode",
//                         "value": nodeState.get("custom_county")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "countyCode",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //Title Code
//                 if (nodeState.get("custom_title") || nodeState.get("orig_custom_title")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "title",
//                         "value": nodeState.get("custom_title") || nodeState.get("orig_custom_title")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
//                 else{
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "title",
//                         "value": ""
//                     }
//                     jsonArray.push(jsonObj)
                    
//                 }

//                 //LanguagePreference
//                 if (nodeState.get("languagePreference")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "languagePreference",
//                         "value": nodeState.get("languagePreference")
//                     }
//                     jsonArray.push(jsonObj)
//                 }
                
//                 //Proofing Method
//                 if(nodeState.get("proofingMethod")){
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "proofingMethod",
//                         "value": nodeState.get("proofingMethod")
//                         }
//                         jsonArray.push(jsonObj) 
//                     } 
//                 }


//                 //verificationStatus
//                 if(nodeState.get("verificationStatus") ){
//                   var jsonObj = {
//                     "operation": "replace",
//                     "field": "verificationStatus",
//                     "value": nodeState.get("verificationStatus")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //reason for failure
//                 if(nodeState.get("reason") && nodeState.get("reason")!==null && nodeState.get("reason") === "service_error"){
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "reason",
//                     "value": nodeState.get("reason")
//                     }
//                     jsonArray.push(jsonObj)   
//                 }else{
//                     var jsonObj = {
//                     "operation": "replace",
//                     "field": "reason",
//                     "value": ""
//                     }
//                     jsonArray.push(jsonObj)
//                 }              


//                 //riskIndicator
//                 if(nodeState.get("riskIndicator") ){
//                   var jsonObj = {
//                     "operation": "replace",
//                     "field": "riskIndicator",
//                     "value": nodeState.get("riskIndicator")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //flowName
//                 if( nodeState.get("flowName") && nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
//                  var jsonObj = {
//                     "operation": "replace",
//                     "field": "lastVerificationMethod",
//                     "value": nodeState.get("flowName")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //assuranceLevel
//                 if(nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified"){
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "assuranceLevel",
//                         "value": "1"
//                         }
//                         jsonArray.push(jsonObj)  
//                 }

//                //kbaStatus
//                  var jsonObj = {
//                     "operation": "replace",
//                     "field": "kbaStatus",
//                     "value": nodeState.get("kbaStatus") || "noKBA"
//                     }
//                     jsonArray.push(jsonObj)

//                 //uuid
//                 if(nodeState.get("lexId") && nodeState.get("verificationStatus") && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "uuid",
//                     "value": nodeState.get("lexId")
//                     }
//                     jsonArray.push(jsonObj)   
//                 }

                

//                 //verificationMismatch
//                 if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!==null && nodeState.get("verificationMismatch") === true){
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "verificationMismatch",
//                     "value": nodeState.get("verificationMismatch")
//                     }
//                     jsonArray.push(jsonObj)   
//                 }else{
//                     var jsonObj = {
//                     "operation": "replace",
//                     "field": "verificationMismatch",
//                     "value": false
//                     }
//                     jsonArray.push(jsonObj)
//                 }
            
//                 //lastVerificationDate
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "lastVerificationDate",
//                     "value": dateTime
//                     }
//                     jsonArray.push(jsonObj) 
            
                 
//                 //assuranceLevel
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "assuranceLevel",
//                     "value": "1"
//                     }
//                     jsonArray.push(jsonObj)   

//                 //updateDate
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "updateDate",
//                     "value": dateTime
//                     }
//                     jsonArray.push(jsonObj)

//                 //updateDateEpoch
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "updateDateEpoch",
//                     "value": currentTimeEpoch
//                     }
//                     jsonArray.push(jsonObj)

//                 logger.debug("jsonArray in KYID.2B1.Journey.IDProofing.LexisNexisAPICall.MFA.V2.1 is :: "+ JSON.stringify(jsonArray))
//                 if(jsonArray.length>0){
//                     var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
//                     logger.debug("Patch Response -->"+response)
//                     if(response){
//                         return true
//                     }
//                 }else{
//                     return false
//                 }  

//             }
        
//     } catch (error) {
//         logger.error("Error Occurred While patchUserIdentity "+ error)
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
//     }    
// }


