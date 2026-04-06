var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.MCIApiCall",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

  };

/**
   * Logging function
   * @type {Function}
   */
var nodelogger = {
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
function main(){
    try {
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var userInfoJSON = nodeState.get("userInfoJSON");
    
        var displayCallBackJSON = {
                "apiCalls":[{
                    "method" :"MCI",
                    "action" : "search"
                    
                }],

                "collectedUserInfo": nodeState.get("userInfoJSON")
        };
    
    
        if (callbacks.isEmpty()) {
            requestCallbacks(displayCallBackJSON);
        } else {
            handleUserResponses();
        }

    } catch (error) {
        nodelogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution ");
    }
}

main();

function requestCallbacks(displayCallBackJSON) {
    nodelogger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }

        // var pageHeader= "2_add_methods";
         var pageHeader= {"pageHeader": "3_RIDP_MCI_Search"};


        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
       
        callbacksBuilder.textInputCallback("Response")
   

        callbacksBuilder.confirmationCallback(0, ["Next"], 0);



    } catch (error) {
        nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}   

function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var responseMCISearchApiCall = callbacks.getTextInputCallbacks()[0];
        var journeyName = null
        var emailWithMatchedRole = [];
        var flowName = "App Enroll" || nodeState.get("flowName");
        var userInfo = nodeState.get("userInfoJSON1") || ""
        var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
        var lexisnexisResponse = nodeState.get("lexisnexisResponse") || ""


        if(nodeState.get("journeyName")){
            nodelogger.debug("Journey Name is "+nodeState.get("journeyName"))
            journeyName = nodeState.get("journeyName") || "";
        }

        nodelogger.error("responseMCISearchApiCall :: "+ JSON.stringify(responseMCISearchApiCall));
        isResponseValidResult = isResponseValid(responseMCISearchApiCall) 
        nodelogger.debug("isResponseValidResult is ::: => " + isResponseValidResult)
        responseMCISearchApiCall = JSON.parse(responseMCISearchApiCall);
        nodelogger.debug("responseMCISearchApiCall response is --> " + JSON.stringify(responseMCISearchApiCall));
        nodelogger.debug("responseMCISearchApiCall status " + responseMCISearchApiCall.status)
        
        if(!isResponseValidResult){
            nodelogger.debug("inside error")
            action.goTo("error")
        }else{
            if (selectedOutcome === 0) {
            nodelogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Response is valid proceeding further")
            nodeState.putShared("validationErrorCode", null);

            // Code block to handle failure MCI Search API response
            if(responseMCISearchApiCall.reason && responseMCISearchApiCall.reason !==null && responseMCISearchApiCall.reason !==""){
                var searchResponse = searchUserIdentity();
                var uuid = nodeState.get("uuid") || nodeState.get("userLexID") || null;
                nodeState.putShared("lexId", uuid);
                nodeState.putShared("proofingMethod","-1")
                nodeState.putShared("verificationStatus", "not_verified");
                nodeState.putShared("reason","service_error")
                if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Update Profile or Organ Donor with MCI Search service error");
                    patchUserIdentity(searchResponse._id,"-1");
                    auditLog("VER009", "Remote Identity Verification Failure");
                    action.goTo("notVerifiedSuccess")
                }else if(nodeState.get("journeyName") === "createAccount"){
                     if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First time login with MCI Search service error");
                        patchUserIdentity(searchResponse._id,"-1")
                        if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                            nodeState.putShared("MCISync","true")
                         }else{
                              nodeState.putShared("MCISync","false")
                         } 
                        auditLog("VER009", "Remote Identity Verification Failure");
                       action.goTo("createAccount")
                    }else{
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account with MCI Search service error");
                         if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
                            nodeState.putShared("MCISync","true")
                         }else{
                              nodeState.putShared("MCISync","false")
                         }                        
                        action.goTo("createAccount")
                    }
                }else if(nodeState.get("journeyName")==="RIDP_LoginMain"){
                    patchUserIdentity(searchResponse._id,"-1")
                    auditLog("VER009", "Remote Identity Verification Failure");
                    nodeState.putShared("unableToVerify","true");
                    action.goTo("unableToVerify")
                }else if(nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="accountRecovery" ||  nodeState.get("journeyName")==="MFARecovery" || nodeState.get("isMFARecovery")==="true"){
                    patchUserIdentity(searchResponse._id,"-1")
                    auditLog("VER009", "Remote Identity Verification Failure");
                    nodeState.putShared("unableToVerify","true");
                    action.goTo("displayUser")
                }else if(nodeState.get("context")==="appEnroll"){
                    nodeState.putShared("appEnrollUnableToVerify", "true");
                    patchUserIdentity(searchResponse._id,"-1");
                    auditLog("VER009", "Remote Identity Verification Failure");
                    action.goTo("FARS");
                }else{
                    patchUserIdentity(searchResponse._id,"-1")
                    auditLog("VER009", "Remote Identity Verification Failure");
                    nodeState.putShared("unableToVerify","true");
                    action.goTo("unableToVerify")
                }
            }else if(responseMCISearchApiCall.status === "fullMatch"){
                    nodelogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside Full Match Condtion")
                    var mciKogIDs = []
                    if(responseMCISearchApiCall.MCIResponse.length>0){
                        nodelogger.debug("responseMCISearchApiCall.MCIResponse.length"+responseMCISearchApiCall.MCIResponse.length)
                        var searchUserInKOGResponse = null;
                        var searchUserInKOGArray = []
                        var searchEmailArray = []
                        var validUser = false
                        var applicationList = []
                        var skip  = true;
                        var roleMatch = false;
                        // var emailWithMatchedRole = [];
                        var mail = nodeState.get("mail") || nodeState.get("EmailAddress");  
                        var kogID = nodeState.get("KOGID");


                        if(systemEnv.getProperty("esv.ridp.experian.application")){
                            applicationList = JSON.parse(systemEnv.getProperty("esv.ridp.experian.application"))
                        }
                        var roleName = []
                        if(systemEnv.getProperty("esv.ridp.experian.role")){
                            roleName = JSON.parse(systemEnv.getProperty("esv.ridp.experian.role"))
                        }

                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                             mciKogIDs.push(responseMCISearchApiCall.MCIResponse[i].KOGID)
                        }
                        
                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodelogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside for loop")
                            searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);

                            // if(searchUserInKOGResponse && searchUserInKOGResponse !== null && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                            //     mciKogIDs.push(responseMCISearchApiCall.MCIResponse[i].KOGID)
                            //     nodelogger.debug("searchUserInKOGResponse is --> "+searchUserInKOGResponse)
                            // }

                            
                            
                            //For EXPERIAN
                            if(nodeState.get("appEnrollRIDPMethod") === "Experian"){    
                                // roleName and appName should come from ESV
                                //nodeState.putShared("appName","Kyid Portal")
                                //nodeState.putShared("roleName","Citizen")
                                nodelogger.debug("applicationList in esv is : => "+ applicationList)
                                nodelogger.debug("roleName in esv is : => "+ roleName)
                                nodelogger.debug("App Name is "+nodeState.get("appName"))
                                nodelogger.debug("appKOGParentName is "+nodeState.get("appKOGParentName"))
                                nodelogger.debug("appSystemName is "+nodeState.get("appSystemName"))
                                nodelogger.debug("RoleName is "+nodeState.get("roleName"))
                                // if((applicationList.includes(nodeState.get("appName")) || applicationList.includes(nodeState.get("appKOGParentName")) || applicationList.includes(nodeState.get("appSystemName"))) && roleName.includes(nodeState.get("roleName"))){  
                                 if((applicationList.includes(nodeState.get("appName"))) && roleName.includes(nodeState.get("roleName"))){  
                                    roleMatch = true;
                                    var roleInKOG = checkRoleInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID, applicationList, roleName);
                                    nodelogger.error("roleInKOG is --> "+roleInKOG)  
                                    if(roleInKOG && roleInKOG === true ){ 
                                        if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                            emailWithMatchedRole.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        }
                                    }
                                }
                            }

                            nodelogger.debug("searchUserInKOGResponse KOGID is --> "+responseMCISearchApiCall.MCIResponse[i].KOGID)
                            nodelogger.debug("KOGID in nodeState is --> "+nodeState.get("KOGID"))
                            if(responseMCISearchApiCall.MCIResponse[i].KOGID === nodeState.get("KOGID") && roleMatch==false && searchUserInKOGResponse && searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress == mail && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                validUser = true;   
                                break;
                            }
        
                            if(searchUserInKOGResponse && roleMatch==false && searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                 nodelogger.debug("Getting User Emails")
                                //if(searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                if(searchUserInKOGResponse.UserDetails.EmailAddress){
                                    searchEmailArray.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                }
                                                    
                                searchUserInKOGArray.push(searchUserInKOGResponse)
                            }
                        } 
                        nodeState.putShared("searchUserInKOGArray",searchUserInKOGArray)
                       
                        if(emailWithMatchedRole.length>0){
                            nodeState.putShared("searchEmailArray",emailWithMatchedRole);
                        }else{
                            nodeState.putShared("searchEmailArray",searchEmailArray);
                        }

                        if(!validUser){
                            nodeState.putShared("verificationMismatch", true)
                        }else{
                            nodeState.putShared("verificationMismatch", false)
                        }
                        
                        if(searchUserInKOGArray.length>0){  
                            searchUserInKOGResponse = true
                        }
                       
                    }
                    if(validUser===true){
                        // MCI Search KOGID matched with logged in user KOGID
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI KOGID matched with logged in user KOGID");
                        nodelogger.error("###0000####")
                        nodeState.putShared("validationMessage", null);
                        var proofingMethod = nodeState.get("proofingMethod");
                        var lexId = nodeState.get("lexId") || null;
                        nodeState.putShared("mciKogIDs", JSON.stringify(mciKogIDs))
                
                        if(searchUserIdentity()){
                            var searchResponse = searchUserIdentity();
                            if(nodeState.get("journeyName")==="createAccount"){
                                if( nodeState.get("firsttimeloginjourneyskip") == "false"){
                                    nodeState.putShared("proofingMethod","1")
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                    patchUserIdentity(searchResponse._id,lexId)
                                    action.goTo("MCISYNC")
                                }else{
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                    action.goTo("createAccount")
                                }
                            }else if(nodeState.get("journeyName") && (nodeState.get("journeyName").toLowerCase() === "updateprofile" || nodeState.get("journeyName").toLowerCase() === "organdonor")){
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + journeyName + "  Full match, matching with logged in user ")
                                patchUserIdentity(searchResponse._id,lexId)
                                auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC")
                            }else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
                                nodeState.putShared("proofingMethod","4")
                                nodeState.putShared("prereqStatus","COMPLETED")
                                patchUserIdentity(searchResponse._id,lexId)
                                auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC")
                            }else if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                                nodeState.putShared("proofingMethod","2")
                                patchUserIdentity(searchResponse._id,null, "2")
                                nodeState.putShared("prereqStatus","COMPLETED")
                                //auditLog("VER008", "Remote Identity Verification Success");
                                reason = "The user personal information provided to Experian is verified";
                                title = "User identity verification is successful."
                                auditLog("KYID-EX-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                                auditLog("KYID-EX-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                action.goTo("MCISYNC")
                            }
                            else{
                                nodeState.putShared("proofingMethod","4")
                                nodeState.putShared("prereqStatus","COMPLETED")
                                patchUserIdentity(searchResponse._id,lexId,"4")
                                auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC")
                                
                            }
                        }else if(nodeState.get("journeyName")==="createAccount"){
                            if( nodeState.get("firsttimeloginjourneyskip") == "false"){
                                nodeState.putShared("proofingMethod","1")
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                patchUserIdentity(searchResponse._id,lexId)
                                action.goTo("MCISYNC")
                            }else{
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                action.goTo("createAccount")
                            }
                        }
                    }else if(searchUserInKOGResponse && searchUserInKOGResponse !== null && searchUserInKOGResponse !== false){
                        // MCI Search KOGID did not match with logged in user KOGID
                        nodelogger.error("###1111####")
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI KOGID did not match with logged in user ");
                        nodeState.putShared("searchUserInKOGResponse",searchUserInKOGResponse)
                        nodeState.putShared("mciKogIDs", JSON.stringify(mciKogIDs))
                        var lexId = nodeState.get("lexId") || null;
                        if (searchUserIdentity()) {
                            var searchResponse = searchUserIdentity();

                            if(nodeState.get("journeyName") === "createAccount"){
                                if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                    nodeState.putShared("proofingMethod","1")
                                    nodeState.putShared("lexId", lexId)
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                    patchUserIdentity(searchResponse._id,lexId)
                                    action.goTo("MCISYNC")                                   
                                }else{
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                    if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified") && nodeState.get("lexId") && nodeState.get("lexId")!= null){
                                        nodeState.putShared("MCISync","true")
                                    }
                                    action.goTo("createAccount")
                                }
                            }else if(nodeState.get("journeyName") && (nodeState.get("journeyName").toLowerCase() === "updateprofile" || nodeState.get("journeyName").toLowerCase() === "organdonor")){
                                nodeState.putShared("lexId", lexId)
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                patchUserIdentity(searchResponse._id,lexId)
                                action.goTo("MCISYNC")   
                            }else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
                                auditLog("VER008", "Remote Identity Verification Failure");
                                nodeState.putShared("unableToVerify","true")
                                action.goTo("unableToVerify")
                            }else if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                                if(emailWithMatchedRole.length>0){
                                    var searchResponse = searchUserIdentity();
                                    nodeState.putShared("proofingMethod","-1")
                                    patchUserIdentity(searchResponse._id,null, "-1")
                                    nodeState.putShared("prereqStatus","NOT_STARTED")
                                    reason = "KYID or LexID does not match with the response provided Experian LexID";
                                    title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                    auditLog("KYID-EX-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                    auditLog("KYID-EX-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                    //auditLog("VER009", "Remote Identity Verification Failure");
                                    action.goTo("displayUser") 
                                }else{
                                    var searchResponse = searchUserIdentity();
                                    nodeState.putShared("proofingMethod","2")
                                    patchUserIdentity(searchResponse._id,null, "2")
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    reason = "The user personal information provided to Experian is verified";
                                    title = "User identity verification is successful."
                                    auditLog("KYID-EX-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                                    auditLog("KYID-EX-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                    action.goTo("MCISYNC") 
                                }
                            }else if(nodeState.get("journeyName") && (nodeState.get("journeyName")==="RIDP_LoginMain" || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName")==="forgotPassword" || nodeState.get("isMFARecovery")==="true" || (nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() ==="forgotpassword"))){
                                nodeState.putShared("unableToVerify","true")
                                auditLog("VER009", "Remote Identity Verification Failure");
                                action.goTo("unableToVerify")
                            }
                        }else if(nodeState.get("journeyName") === "createAccount"){
                            if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                nodeState.putShared("proofingMethod","1")
                                nodeState.putShared("lexId", lexId)
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                patchUserIdentity(searchResponse._id,lexId)
                                action.goTo("MCISYNC")                                   
                            }else{
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified") && nodeState.get("lexId") && nodeState.get("lexId")!= null){
                                    nodeState.putShared("MCISync","true")
                                }
                                action.goTo("createAccount")
                            }
                        }
                    }else if(searchUserInKOGResponse === false && searchUserInKOGResponse !== null && nodeState.get("context") === "appEnroll"){
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI KOGID was not found in KOG for AppEnroll");
                        nodelogger.error("###2222####")
                        if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                           //auditLog("VER008", "Remote Identity Verification Success");
                           reason = "The user personal information provided to Experian is verified";
                           title = "User identity verification is successful."
                           auditLog("KYID-LN-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                           auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                           var searchResponse = searchUserIdentity();
                           nodeState.putShared("proofingMethod","2")
                           nodeState.putShared("prereqStatus","COMPLETED")
                           patchUserIdentity(searchResponse._id,null, "2")
                           action.goTo("MCISYNC")  
                        }else{
                            var proofingMethod = nodeState.get("proofingMethod");
                            var lexId = nodeState.get("lexId") || null;
                            nodelogger.debug("NodeState.get --> LexId is "+nodeState.get("lexId"))
                            nodeState.putShared("prereqStatus", "COMPLETED");
                            //auditLog("VER008", "Remote Identity Verification Success");
                            reason = "The user personal information provided to Experian is verified";
                            title = "User identity verification is successful."
                            auditLog("KYID-LN-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                            auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            action.goTo("MCISYNC") 
                        }     
                    }else if(searchUserInKOGResponse === false && searchUserInKOGResponse !== null){
                        nodelogger.error("###3333####")
                        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI KOGID was not found in KOG");
                        nodeState.putShared("mciKogIDs", JSON.stringify(mciKogIDs))
                        var lexId = nodeState.get("lexId") || null;
                        if (searchUserIdentity()) {
                            var searchResponse = searchUserIdentity();

                            if(nodeState.get("journeyName") === "createAccount"){
                                if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                    nodeState.putShared("proofingMethod","1")
                                    nodeState.putShared("lexId", lexId)
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                    patchUserIdentity(searchResponse._id,lexId)
                                    action.goTo("MCISYNC")                                   
                                }else{
                                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                    if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified") && nodeState.get("lexId") && nodeState.get("lexId")!= null){
                                        nodeState.putShared("MCISync","true")
                                    }
                                    action.goTo("createAccount")
                                }
                            }else if(nodeState.get("journeyName") && (nodeState.get("journeyName").toLowerCase() === "updateprofile" || nodeState.get("journeyName").toLowerCase() === "organdonor")){
                                nodeState.putShared("lexId", lexId)
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                patchUserIdentity(searchResponse._id,lexId)
                                action.goTo("MCISYNC")   
                            }else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
                                auditLog("VER008", "Remote Identity Verification Failure");
                                nodeState.putShared("unableToVerify","true")
                                action.goTo("unableToVerify")
                            }else if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                                if(emailWithMatchedRole.length>0){
                                    var searchResponse = searchUserIdentity();
                                    nodeState.putShared("proofingMethod","-1")
                                    patchUserIdentity(searchResponse._id,null, "-1")
                                    nodeState.putShared("prereqStatus","NOT_STARTED")
                                    reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                    title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                    auditLog("KYID-EX-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                    auditLog("KYID-EX-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                    // auditLog("VER009", "Remote Identity Verification Failure");
                                    action.goTo("displayUser") 
                                }else{
                                    var searchResponse = searchUserIdentity();
                                    nodeState.putShared("proofingMethod","2")
                                    patchUserIdentity(searchResponse._id,null, "2")
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    reason = "The user personal information provided to Experian is verified";
                                    title = "User identity verification is successful."
                                    auditLog("KYID-EX-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                                    auditLog("KYID-EX-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                    //auditLog("VER008", "Remote Identity Verification Success");
                                    action.goTo("MCISYNC") 
                                }
                            }else if(nodeState.get("journeyName") && (nodeState.get("journeyName")==="RIDP_LoginMain" || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName")==="forgotPassword" || nodeState.get("isMFARecovery")==="true" || nodeState.get("journeyName").toLowerCase() ==="forgotpassword")){
                                nodeState.putShared("unableToVerify","true")
                                auditLog("VER009", "Remote Identity Verification Failure");
                                action.goTo("unableToVerify")
                            }
                        }else if(nodeState.get("journeyName") === "createAccount"){
                            if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                nodeState.putShared("proofingMethod","1")
                                nodeState.putShared("lexId", lexId)
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " First Time Login Full match , matching with logged in user")
                                patchUserIdentity(searchResponse._id,lexId)
                                action.goTo("MCISYNC")                                   
                            }else{
                                logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Create Account Full match ")
                                if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified") && nodeState.get("lexId") && nodeState.get("lexId")!= null){
                                    nodeState.putShared("MCISync","true")
                                }
                                action.goTo("createAccount")
                            }
                        }
                    }
                }else if(responseMCISearchApiCall.status === "partialMatch" || responseMCISearchApiCall.status === "noMatch"){
                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside Partial Match or No Match Condtion")
                    var lexId = nodeState.get("lexId") || null;
                    if (searchUserIdentity()) {
                        var searchResponse = searchUserIdentity();
                        if(nodeState.get("journeyName") === "createAccount"){
                            if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                nodeState.putShared("proofingMethod","1")
                                nodeState.putShared("lexId", lexId)
                                patchUserIdentity(searchResponse._id)
                                auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC")
                            }
                            if(nodeState.get("lexId") && nodeState.get("lexId") !=null){
                                nodeState.putShared("MCISync","true")
                                nodelogger.debug("MCI Sync is true")
                                nodeState.putShared("createProofingMethod","-1")
                            }else{
                                nodeState.putShared("createProofingMethod","-1")
                            }
                            action.goTo("createAccount")
                        }else if(nodeState.get("journeyName") && (nodeState.get("journeyName").toLowerCase() === "updateprofile" || nodeState.get("journeyName").toLowerCase() === "organdonor")){
                            nodeState.putShared("proofingMethod","1")
                            nodeState.putShared("lexId", lexId)
                            patchUserIdentity(searchResponse._id)
                            auditLog("VER008", "Remote Identity Verification Success");
                            action.goTo("MCISYNC")
                        }else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
                            nodeState.putShared("prereqStatus","COMPLETED");
                            nodeState.putShared("proofingMethod","4")
                            patchUserIdentity(searchResponse._id)
                            auditLog("VER008", "Remote Identity Verification Success");
                            action.goTo("MCISYNC")
                        }else if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                            if(emailWithMatchedRole && emailWithMatchedRole.length>0){
                                var searchResponse = searchUserIdentity();
                                nodeState.putShared("proofingMethod","-1")
                                patchUserIdentity(searchResponse._id,null, "-1")
                                nodeState.putShared("prereqStatus","NOT_STARTED")
                                reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                auditLog("KYID-EX-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-EX-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                //auditLog("VER009", "Remote Identity Verification Failure");
                                action.goTo("displayUser") 
                            }else{
                                var searchResponse = searchUserIdentity();
                                nodeState.putShared("proofingMethod","2")
                                nodeState.putShared("prereqStatus","COMPLETED")
                                patchUserIdentity(searchResponse._id,null, "2")
                                reason = "The user personal information provided to Experian is verified";
                                title = "User identity verification is successful."
                                auditLog("KYID-EX-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                                auditLog("KYID-EX-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);                           
                                //auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC") 
                            }
                        }else if(nodeState.get("journeyName") && (nodeState.get("journeyName")==="RIDP_LoginMain" || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName")==="forgotPassword" || nodeState.get("isMFARecovery")==="true" || nodeState.get("journeyName").toLowerCase() ==="forgotpassword")){
                            nodeState.putShared("unableToVerify","true")
                            auditLog("VER009", "Remote Identity Verification Failure");
                            action.goTo("unableToVerify")
                        }
                    }else if(nodeState.get("journeyName") === "createAccount"){
                            if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                nodeState.putShared("proofingMethod","1")
                                nodeState.putShared("lexId", lexId)
                                patchUserIdentity(searchResponse._id)
                                auditLog("VER008", "Remote Identity Verification Success");
                                action.goTo("MCISYNC")
                            }else if(nodeState.get("lexId") && nodeState.get("lexId") !=null){
                                nodeState.putShared("MCISync","true")
                                nodelogger.debug("MCI Sync is true")
                                nodeState.putShared("createProofingMethod","1")
                            }else{
                                nodeState.putShared("createProofingMethod","-1")
                            }
                            action.goTo("createAccount")
                        }
                }else{
                    logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI Search service error, neither fullMatch, partialMatch nor noMatch ");
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("error")
                }
            }
        }
    } catch (error) {
        nodelogger.error("error in main of KYID.2B1.Journey.IDProofing.responseMCISearchApiCallV2" + error);
        nodeState.putShared("validationMessage", "invalid_input");
        action.goTo("error");
    }

}


function patchUserIdentity(selectedUser, verifiedLexId, proofingMethod) {
    nodelogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
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
               logger.error("Inside verificationStatus is  "+nodeState.get("verificationStatus") )
                logger.error("Inside appEnrollRIDPMethod is  "+nodeState.get("appEnrollRIDPMethod") )
                // logger.error("Inside verificationStatus is  "+nodeState.get("appEnrollRIDPMethod") )
                // if(nodeState.get("context")!="appEnroll" && nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase()!= "notverified"){
                if(!((nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase()== "notverified") && nodeState.get("appEnrollRIDPMethod") && nodeState.get("appEnrollRIDPMethod")==="LexisNexis")){
                    logger.error("Inside verificationStatus condtion ")
                    if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
                        nodelogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
                        var userAttributes = JSON.parse(nodeState.get("userAttributes"));
                        nodelogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
                        if(Array.isArray(userAttributes) && userAttributes.length > 0){
                            userAttributes.forEach(function(attribute){
                            // nodelogger.debug("attribute is :: " + JSON.stringify(attribute))

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
                                if(nodeState.get("orig_custom_county") || nodeState.get("custom_county") ){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "countyCode",
                                    "value": nodeState.get("custom_county") || nodeState.get("orig_custom_county")
                                    }
                                    jsonArray.push(jsonObj)   
                                }
                            
                                else{
                                    var jsonObj = {
                                    "operation": "replace",
                                    "field": "custom_county",
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
                    if((nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || (nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
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
             //mciKogIDs
                var mciKogIDs = []
                logger.debug("mciKogIDs is :: " + JSON.parse(nodeState.get("mciKogIDs")))
                if (nodeState.get("mciKogIDs") && nodeState.get("mciKogIDs") != null){
                    mciKogIDs = JSON.parse(nodeState.get("mciKogIDs"))
                    var jsonObj = {
                        "operation": "replace",
                        "field": "mciKogIDs",
                        "value": mciKogIDs
                    }   
                    jsonArray.push(jsonObj)  
                }

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
        nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
    }    
}


// function patchUserIdentity(selectedUser, verifiedLexId, proofingMethod) {
//     nodelogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
//     selectedUser = nodeState.get("mail") || nodeState.get("EmailAddress")
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
//                     nodelogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
//                     var userAttributes = JSON.parse(nodeState.get("userAttributes"));
//                     nodelogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
//                     if(Array.isArray(userAttributes) && userAttributes.length > 0){
//                         userAttributes.forEach(function(attribute){
//                         nodelogger.debug("attribute is :: " + JSON.stringify(attribute))

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="firstname"){
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
//                                         "value": attribute.correctedValue
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

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="lastname"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_sn",
//                                     "value": attribute.status
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="middlename"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_middleName",
//                                     "value": attribute.status
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="dob"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }

//                             if(attribute.status){
//                                 var jsonObj = {
//                                     "operation": "replace",
//                                     "field": "status_dob",
//                                     "value": attribute.status
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="addressline1"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="addressline2"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="city"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="stateCode"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="countyCode"){
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

//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="countrycode"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }


//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="zip"){
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
//                                     "value": attribute.correctedValue
//                                     }
//                                     jsonArray.push(jsonObj)
//                             }
//                         }


//                         if(attribute.attributeName && attribute.attributeName.toLowerCase()=="zipextension"){
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
//                                     "value": attribute.correctedValue
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
//                 if (nodeState.get("custom_title")) {
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "title",
//                         "value": nodeState.get("custom_title")
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
//                      var jsonObj = {
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

//                 //lastVerificationMethod
//                 if( nodeState.get("flowName") && ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || (nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "partiallyverified"))){
//                  var jsonObj = {
//                     "operation": "replace",
//                     "field": "lastVerificationMethod",
//                     "value": nodeState.get("flowName")
//                     }
//                     jsonArray.push(jsonObj)
//                 }

//                 //assuranceLevel
//                 if((nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || (nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
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

//             if(nodeState.get("appEnrollRIDPMethod") === "SSA"){
//                 //status_givenName
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "status_givenName",
//                     "value": nodeState.get("status_givenName") || ""
//                     }
//                     jsonArray.push(jsonObj)
    
//                 //status_middleName
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "status_middleName",
//                     "value":  nodeState.get("status_middleName") || ""
//                     }
//                     jsonArray.push(jsonObj)
    
//                 //status_dob
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "status_dob",
//                     "value":  nodeState.get("status_dob") || ""
//                     }
//                     jsonArray.push(jsonObj)
    
//                 //status_ssn
//                 var jsonObj = {
//                     "operation": "replace",
//                     "field": "updateDateEpoch",
//                     "value":  nodeState.get("status_ssn") || ""
//                     }
//                     jsonArray.push(jsonObj)
//             }

           

//                 //mciKogIDs
//                 var mciKogIDs = []
//                 logger.debug("mciKogIDs is :: " + JSON.parse(nodeState.get("mciKogIDs")))
//                 if (nodeState.get("mciKogIDs") && nodeState.get("mciKogIDs") != null){
//                     mciKogIDs = JSON.parse(nodeState.get("mciKogIDs"))
//                     var jsonObj = {
//                         "operation": "replace",
//                         "field": "mciKogIDs",
//                         "value": mciKogIDs
//                     }   
//                     jsonArray.push(jsonObj)  
//                 }
                
//                 logger.debug("jsonArray in KYID.2B1.Journey.IDProofing.Manage.Profile.UpdateUserIdentity is :: "+ JSON.stringify(jsonArray))
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
//         nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
//     }    
// }

function checkRoleInKOG(userKOGID, applicationList, roleList) {
    var kogTokenApi; 
    var foundRole = false;
    if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
        kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }


    var kogUsrAuthorizationApiURL;
    if (systemEnv.getProperty("esv.kyid.usr.authorization") && systemEnv.getProperty("esv.kyid.usr.authorization") != null) {
        kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }

    var sihcertforapi;
    if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
        sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }

    try {
            var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
            var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
            nodelogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));
            
            //If the Access token is 200
            if (kogAPITokenResponse.status === 200) {
                var bearerToken = kogAPITokenResponse.response;

                var payload = {
                    KOGID: userKOGID
                }
                nodelogger.debug("payload in ReadUserAuthz " + JSON.stringify(payload));
                var requestOptions = {
                    "clientName": sihcertforapi,
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "token": bearerToken,
                    "body": payload
                };

                var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();

                nodelogger.debug("KOG API Status: " + res.status);
                action.withHeader(`Response code: ${res.status}`);


                if (res.status === 200) {
                    var data = JSON.parse(res.text());
                    nodelogger.debug("KOG API Response: " + JSON.stringify(data));

                    if (data.ResponseStatus === 0 && data.UserAuthorizations) {
                        data.UserAuthorizations.forEach(function(auth) {
                            nodelogger.debug("appName in nodeState is :: => "+ nodeState.get("appName"))
                            nodelogger.debug("roleName in nodeState is :: "+ nodeState.get("roleName"))
                            //if (auth.ApplicationName && auth.RoleName && applicationList.includes(nodeState.get("appName")) && auth.RoleName.localeCompare(roleList) == 0) {  
                            if ((auth.ApplicationName && auth.RoleName) 
                                && (auth.ApplicationName.toLowerCase() === nodeState.get("appName").toLowerCase()) 
                                && (auth.RoleName.toLowerCase() ===  nodeState.get("roleName").toLowerCase())) {  
                                foundRole =  true;
                            }
                        })
                        return foundRole;
                    }
                    else{
                        return foundRole
                    }
                }
            }
        }catch (e) {
            nodelogger.error("Exception in KYID KOG API call: " + e.message);
        }
}

function searchUserInKOG(KOGID) {
    try {
        var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
        var kogUsrProfileApi = systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile");
        var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
        var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
        var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
        if (kogAPITokenResponse.status === 200) {
            var payload = {
                "KOGID": KOGID,
            };
            var bearerToken = kogAPITokenResponse.response;
            var requestOptions = {
                clientName: sihcertforapi,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                token: bearerToken,
                body: payload,
            };
            var startTime = new Date();
            var kogUserProfileAPIResponse = httpClient.send(kogUsrProfileApi, requestOptions).get();
            var endTime = new Date();
            var duration = endTime - startTime;  
            var durationInSeconds = duration / 1000;
            nodelogger.debug("KYID.2B1.Journey.IDProofing.responseresponseMCISearchApiCall call duration in seconds : " + durationInSeconds );
            if (kogUserProfileAPIResponse.status === 200) {
                var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
                nodelogger.debug("kogUserProfileAPIResponse apiResponse is --> "+ JSON.stringify(apiResponse))
                if (apiResponse.ResponseStatus === 0) {
                return apiResponse
                }
                else if (apiResponse.ResponseStatus === 1) {
                    return false
                }

                
            }
            else{
                return null
            }
            
            
        
        
        }
        else{
            return null
        }
        
        
    } catch (error) {
        nodelogger.error("Error Occurred while searchUserInKOG "+ error)
        
    }
}

function searchUserIdentity() {
try {
    nodelogger.debug("User Id -->"+  nodeState.get("UserId"))
    var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'account/_refResourceId eq "' +  nodeState.get("UserId") + '"' }, ["*"]);
    nodelogger.debug("userIdentityResponse --> "+userIdentityResponse)
    
    if(userIdentityResponse && userIdentityResponse.resultCount>0){
        return userIdentityResponse.result[0]
    }
    else{
        return null
    }
    
} catch (error) {
    nodelogger.error("Error Occurred While searchUserIdentity "+ error)
    
}    
}

function isResponseValid(input) {
    try {
        var parsedInput = JSON.parse(input);
        var allowedStatuses = ["noMatch", "partialMatch", "fullMatch"];
        var isValid = false;
        if (typeof parsedInput === "object") {
            var status = parsedInput.status || parsedInput[""] || null;
            if (allowedStatuses.includes(status)) {
                parsedInput.status = status;
                isValid = true;
                if (parsedInput.status === "fullMatch") {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null;
                    nodelogger.debug("isValid is ::: => " + isValid)
                    return isValid;
                } else {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
                    nodelogger.debug("isValid is ::: => " + isValid)
                    return isValid;
                }
            }
        }
        if (!isValid) {
            nodeState.putShared("validationMessage", "invalid_input");
            return false;
        }
    } catch (e) {
        nodelogger.error("isResponseValid " + e.message);
        nodeState.putShared("validationMessage", "invalid_input");
        return false;
    }
} 

// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title) {
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
        if(nodeState.get("flow") === "helpdesk"){
            eventDetails["applicationName"] = systemEnv.getProperty("esv.helpdesk.name");
        }else{
            eventDetails["applicationName"] = systemEnv.getProperty("esv.kyid.portal.name");
        }
        
        eventDetails["requestedApplication"] = nodeState.get("appName") || "";
        eventDetails["requestedRole"] = nodeState.get("roleName") || "";
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        //eventDetails["transactionid"] = transactionid || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || "";
        
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        logger.error("sessionRefId in KYID.2B1.Journey.IDProofing.CreateAccount " + nodeState.get("sessionRefId"))
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
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = false;
        var helpdeskVisibility = helpdeskVisibility || false;
        
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}

// function auditLog(code, message){
//     try{
//          var auditLib = require("KYID.2B1.Library.AuditLogger")
//         var headerName = "X-Real-IP";
//         var headerValues = requestHeaders.get(headerName); 
//         var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
//         var browser = requestHeaders.get("user-agent"); 
//         var os = requestHeaders.get("sec-ch-ua-platform"); 
//         var userId = null;
//         var eventDetails = {};
//         eventDetails["IP"] = ipAdress;
//         eventDetails["Browser"] = browser;
//         eventDetails["OS"] = os;
//         eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
//         eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
//         eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""     
//           var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
//                 var sessionDetails = {}
//                 var sessionDetail = null
//                 if(nodeState.get("sessionRefId")){
//                     sessionDetail = nodeState.get("sessionRefId") 
//                     sessionDetails["sessionRefId"] = sessionDetail
//                 }else if(typeof existingSession != 'undefined'){
//                     sessionDetail = existingSession.get("sessionRefId")
//                     sessionDetails["sessionRefId"] = sessionDetail
//                 }else{
//                      sessionDetails = {"sessionRefId": ""}
//                 }
//                 var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

//                 if (userEmail){
//               var userQueryResult = openidm.query("managed/alpha_user", {
//                      _queryFilter: 'mail eq "' + userEmail + '"'
//                  }, ["_id"]);
//               userId = userQueryResult.result[0]._id;
//                 }
//               var requesterUserId = null;
//                if (typeof existingSession != 'undefined') {
//               requesterUserId = existingSession.get("UserId")
//                 }

//                 auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
//     }catch(error){
//         logger.error("Failed to log RIDP verification activity "+ error)
//     }
    
// }