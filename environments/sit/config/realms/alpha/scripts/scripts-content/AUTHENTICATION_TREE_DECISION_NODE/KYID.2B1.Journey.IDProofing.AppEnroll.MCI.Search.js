var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: MCI Search AppEnroll",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AppEnroll.MCI.Search",
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

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
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

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error.message);
        action.goTo("error");
    }
}

main();

// Function to request Callbacks
function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside requestCallbacks Function");
    try {
        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
         
        var pageHeader= {"pageHeader": "3_RIDP_MCI_Search"};
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}


// Function to handle User Responses
function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside handleUserResponses Function");
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var responseMCISearchApiCall = callbacks.getTextInputCallbacks()[0];
        var lib = require("KYID.2B1.Library.RIDP.Generic.Utils");
        var verifiedLexId = nodeState.get("verifiedLexId");
        var loggedInUserId = nodeState.get("_id") || nodeState.get("UserId");
        var loggedInUsermail = nodeState.get("mail") || nodeState.get("EmailAddress");
        var loggedInUserKogId = nodeState.get("userName")
        var loggedInUserCustomId = nodeState.get("userIdentity")
        var usrKOGID = nodeState.get("KOGID");
        var flowName = "App Enroll" || nodeState.get("flowName");
        var userInfo = nodeState.get("userInfoJSON1")
        var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
        var lexisnexisResponse = nodeState.get("lexisnexisResponse");
        var mciKogIDs = [];
        var jitKOGIDArray = [];
        
        nodeLogger.debug("MCI Search API Call Response: " + responseMCISearchApiCall);
        isResponseValidResult = isResponseValid(responseMCISearchApiCall)
        nodeLogger.debug("isResponseValidResult : " + isResponseValidResult); 
        responseMCISearchApiCall = JSON.parse(responseMCISearchApiCall)


        if(!isResponseValidResult){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Response is not valid");
            action.goTo("error")
        }else{
            if (selectedOutcome === 0) {
                nodeLogger.debug("Valid Response received for MCI Search API Call: " + JSON.stringify(responseMCISearchApiCall));
                nodeState.putShared("validationErrorCode", null);
                if(responseMCISearchApiCall.status === "fullMatch"){
                    if(responseMCISearchApiCall.MCIResponse.length>0){
                        nodeLogger.debug("Length of MCIResponse" + responseMCISearchApiCall.MCIResponse.length)
                        var searchUserInPingResponse = null;
                        var searchUserInKOGResponse = null;
                        var searchUserInKOGArray = []
                        var searchEmailArray = []
                        var isHighRisk = false;
                        var associatedAccounts = nodeState.get("searchEmailArray") ? JSON.parse(nodeState.get("searchEmailArray")) : [];
                        var associatedAccountKOGID = [];
                        var searchKOG = false;
                        var validUser = false;
                        var isAccountActive = true;
                        var terminatedLowRisk = [];
                        var terminatedLowRiskKogId = []
                        var jitArray = [];
                        var pingAccounts = []
                        var pingMailId = []
                        var matchedWithLoggedUser = []
                        var jitMailID = []
                        var isTerminated = false;
                        var pingAccounts = nodeState.get("pingAccounts") ? JSON.parse(nodeState.get("pingAccounts")) : [];
                        

                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodeLogger.debug("For Loop Iteration: " + i)
                            searchUserInPingResponse = lib.searchUserInPingResponse(responseMCISearchApiCall.MCIResponse[i].KOGID, verifiedLexId);
                            mciKogIDs.push(responseMCISearchApiCall.MCIResponse[i].KOGID);
                            nodeLogger.debug("searchUserInPingResponse is --> "+ JSON.stringify(searchUserInPingResponse))


                            if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel !== "high" ){
                                //isHighRisk = true;
                                isTerminated = true
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-000: High Risk Transaction:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                break;
                            }else if(searchUserInPingResponse && searchUserInPingResponse._id && searchUserInPingResponse.mail && searchUserInPingResponse.accountStatus && (searchUserInPingResponse.accountStatus =="active" || searchUserInPingResponse.accountStatus =="suspended")){
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Associated Active/Suspended Account Found in Ping Identity:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                if(searchUserInPingResponse.mail == loggedInUsermail && searchUserInPingResponse._id == loggedInUserId && searchUserInPingResponse.kogID == loggedInUserKogId){
                                    matchedWithLoggedUser.push(searchUserInPingResponse.mail)
                                }
                                if(!(associatedAccounts.includes(searchUserInPingResponse.mail))){
                                   associatedAccounts.push(searchUserInPingResponse.mail);
                                }
                                
                                associatedAccountKOGID.push(searchUserInPingResponse.kogID);
                                if(!(pingAccounts.includes(searchUserInPingResponse._id))){
                                    pingAccounts.push(searchUserInPingResponse._id);
                                }
                               
                                pingMailId.push(searchUserInPingResponse.mail)
                            }else if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel !== "high"){
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Low Risk Account Found in Ping Identity:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                isAccountActive = false;
                                terminatedLowRisk.push(searchUserInPingResponse.mail);
                                terminatedLowRiskKogId.push(searchUserInPingResponse.kogID);
                                associatedAccountKOGID.push(searchUserInPingResponse.kogID);
                            }else if(searchUserInPingResponse && searchUserInPingResponse.error && searchUserInPingResponse.error === "lexid_mismatch" && searchUserInPingResponse._id){
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID Mismatch Found in Ping Identity, Searching in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                logger.debug("searchUserInKOGResponse ::: "+ JSON.stringify(searchUserInKOGResponse))
                                logger.debug("UserDetails ::: "+ JSON.stringify(searchUserInKOGResponse.UserDetails))
                                logger.debug("EmailAddress ::: "+ JSON.stringify(searchUserInKOGResponse.UserDetails.EmailAddress))
                                if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                        if(!(associatedAccounts.includes(searchUserInKOGResponse.UserDetails.EmailAddress))){
                                            associatedAccounts.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        }
                                       
                                        associatedAccountKOGID.push(searchUserInPingResponse.kogID);
                                        if(!(pingAccounts.includes(searchUserInPingResponse._id))){
                                             pingAccounts.push(searchUserInPingResponse._id);
                                        }
                                       
                                        pingMailId.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                }
                                //Proceed with JIT or Not??????
                            }else if(searchUserInPingResponse == null || !searchUserInPingResponse){  
                                // Record not found scenario in Ping Identity or verifification mismatch, search in KOG
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No Record Found in Ping Identity, Searching in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                associatedAccountKOGID.push(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Active Account Found in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID + " :: ");
                                        //Proceed with JIT
                                        if(!(associatedAccounts.includes(searchUserInKOGResponse.UserDetails.EmailAddress))){
                                            associatedAccounts.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        }
                                        jitMailID.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        jitArray.push(searchUserInKOGResponse.UserDetails);
                                        jitKOGIDArray.push(responseMCISearchApiCall.MCIResponse[i].KOGID)
                                } 
                            }
                        } 

                        if(isHighRisk){
                           nodeState.putShared("highRiskTransaction", true);
                           nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to FARS");
                           reason = "The LexID associated account(s) in Ping Identity is marked as High Risk.";
                           title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                           auditLog("KYID-LN-000", "AppEnroll  - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                           auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                           nodeState.putShared("errorMessage","KYID-LN-000")
                           nodeState.putShared("patchPrereq","false")
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                                action.goTo("highRiskTransaction");
                            }else{
                                action.goTo("highRiskTransactionBSP");
                            }
                        }else if(terminatedLowRisk.length > 0 && mciKogIDs.length === terminatedLowRisk.length){
                            reason = "AppEnroll - KYID or LexID matches with inactive account (email) associated with the verified identity - LexID";
                            title = "User identity verification transaction failed due to user details provided as part of the input match with inactive accounts"
                            auditLog("KYID-LN-002", "AppEnroll - Inactive accounts associated with the Identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-002", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            //nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inactive accounts associated with the Identity");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-002: Inactive accounts associated with the Identity");
                            if(nodeState.get("prereqStatus")== "REVERIFY"){
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","PENDING")
                            }else{
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","REVERIFY")
                            }
                            nodeState.putShared("errorMessage","KYID-LN-002")
                            
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                                action.goTo("terminatedUnableToVerify");
                            }else{
                                action.goTo("terminatedUnableToVerifyBSP");
                            }
                        }
                        else if(matchedWithLoggedUser.length == 0 && associatedAccounts.length == 0){
                            // Account exist in ping does not match with logged in user error out
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                            auditLog("KYID-LN-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID not matched with logged in user with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Input NOT matching verified identity");
                            nodeState.putShared("errorMessage","KYID-LN-001")
                            nodeState.putShared("patchPrereq","false")
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                                action.goTo("unableToVerify");
                            }else{
                                action.goTo("unableToVerifyBSP");
                            }
                        }else if(associatedAccounts.length>0){
                            nodeState.putShared("searchEmailArray",JSON.stringify(associatedAccounts));
                            nodeState.putShared("associatedAccountKOGID",JSON.stringify(associatedAccountKOGID));
                            nodeState.putShared("pingAccounts",JSON.stringify(pingAccounts));
                            nodeState.putShared("pingMailId",JSON.stringify(pingMailId));
                            nodeState.putShared("matchedWithLoggedUser",JSON.stringify(matchedWithLoggedUser))
                            nodeState.putShared("jitKOGIDArray", JSON.stringify(jitKOGIDArray));
                            nodeState.putShared("jitArray", JSON.stringify(jitArray));
                            // reason = "AppEnroll - KYID or LexID matches with inactive account (email) associated with the verified identity - LexID " + JSON.stringify(associatedAccounts);
                            // title = "One or more active account(s) are identified for the input and personal information provided "
                            // auditLog("KYID-LN-003", "AppEnroll - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason);
                            nodeState.putShared("patchPrereq","false")
                            action.goTo("associatedAccounts");
                        }else if(isTerminated){
                            reason = "AppEnroll - KYID or LexID matches with inactive account (email) associated with the verified identity - LexID";
                            title = "User identity verification transaction failed due to user details provided as part of the input match with inactive accounts"
                            auditLog("KYID-LN-002", "AppEnroll - Inactive accounts associated with the Identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-002", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            //nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inactive accounts associated with the Identity");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-002: Inactive accounts associated with the Identity");
                            if(nodeState.get("prereqStatus")== "REVERIFY"){
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","PENDING")
                            }else{
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","REVERIFY")
                            }
                            nodeState.putShared("errorMessage","KYID-LN-002")
                            
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                                action.goTo("terminatedUnableToVerify");
                            }else{
                                action.goTo("terminatedUnableToVerifyBSP");
                            }
                        }else if(!isAccountActive){
                            nodeState.putShared("terminatedLowRisk", JSON.stringify(terminatedLowRisk));
                            nodeState.putShared("terminatedLowRiskKogId", JSON.stringify(terminatedLowRiskKogId));
                            nodeState.putShared("errorMessage","KYID-LN-002")
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                            auditLog("KYID-LN-002", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-002", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            nodeState.putShared("patchPrereq","false")
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                                action.goTo("inActiveAccountFound");
                            }else{
                                nodeState.putShared("prereqStatus","REVERIFY")
                                action.goTo("inActiveAccountFoundBSP");
                            }
                            
                        }else if(jitArray.length>0){
                            nodeState.putShared("jitArray", JSON.stringify(jitArray));
                            nodeState.putShared("pingAccounts",JSON.stringify(pingAccounts));
                            nodeState.putShared("pingMailId",JSON.stringify(pingMailId))
                            nodeState.putShared("jitMailID",JSON.stringify(jitMailID));     
                            nodeState.putShared("searchEmailArray",JSON.stringify(associatedAccounts));
                            nodeState.putShared("associatedAccountKOGID",JSON.stringify(associatedAccountKOGID));
                            nodeState.putShared("jitKOGIDArray", JSON.stringify(jitKOGIDArray));
                            nodeState.putShared("patchPrereq","false")
                            action.goTo("jitProvisioning");
                        }
                    }
                }else if(responseMCISearchApiCall.status === "noMatch" || responseMCISearchApiCall.status === "partialMatch"){
                    var searchEmailArray = nodeState.get("searchEmailArray") ? JSON.parse(nodeState.get("searchEmailArray")) : []
                    var prereqStatus = nodeState.get("prereqStatus") 
                    // if(nodeState.get("noLexID") == "true" && nodeState.get("accountsFound") && nodeState.get("accountsFound") == "true"){
                    //     nodeState.putShared("prereqStatus","COMPLETED")
                    // }  
                    if(searchEmailArray && searchEmailArray.length>0){
                        if(searchEmailArray.includes(mail)){
                             action.goTo("associatedAccounts");
                        }else{
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = "User identity verification transaction failed as there is no identity present within the KYID platform based on the verified information provided"
                            auditLog("KYID-LN-004", "AppEnroll - Not able to find the individual based on verified information", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-004", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search");
                            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                             if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                                nodeState.putShared("prereqStatus","PENDING")
                                action.goTo("unableToVerify")
                             }else{
                                nodeState.putShared("prereqStatus","REVERIFY")
                                action.goTo("unableToVerify")
                             }
                            }else{
                                action.goTo("unableToVerifyBSP")
                            }
                        }
                    }else{
                        // reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                        // title = "User identity verification transaction failed as there is no identity present within the KYID platform based on the verified information provided"
                        // auditLog("KYID-LN-004", "AppEnroll - Not able to find the individual based on verified information", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        // auditLog("KYID-LN-004", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);

                        reason = "The user personal information provided to LexisNexis is verified";
                        title = "User identity verification is successful."
                        auditLog("KYID-LN-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                        auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search");
                        nodeState.putShared("prereqStatus","COMPLETED")
                        action.goTo("patchPreReq")
                        
                        //action.goTo("unableToVerifyBSP")
                        // if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                        //     if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                        //         nodeState.putShared("prereqStatus","PENDING")
                        //     action.goTo("unableToVerify")
                        //     }else{
                        //         nodeState.putShared("prereqStatus","REVERIFY")
                        //     action.goTo("unableToVerify")
                        //     }
                        // }else{
                        //     action.goTo("unableToVerifyBSP")
                        // }
                    }
                }
            }
        }
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in handleUserResponses Function: " + error.message);
        action.goTo("error");
    }
}


// Function to validate Response
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
                    logger.debug("isValid is ::: => " + isValid)
                    return isValid;
                } else {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
                    logger.debug("isValid is ::: => " + isValid)
                    return isValid;
                }
            }
        }
        if (!isValid) {
            nodeState.putShared("validationMessage", "invalid_input");
            return false;
        }
    } catch (e) {
        nodeLogger.error("isResponseValid " + e.message);
        nodeState.putShared("validationMessage", "invalid_input");
        return false;
    }
} 


// Audit Log Function
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


function searchUserInKOG(KOGID) {
     nodeLogger.debug("starting searchUserInKOG ");
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
            nodeLogger.debug("KYID.2B1.Journey.IDProofing.responseresponseMCISearchApiCall call duration in seconds : " + durationInSeconds );
            if (kogUserProfileAPIResponse.status === 200) {
                var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
                nodeLogger.debug("kogUserProfileAPIResponse apiResponse is --> "+ JSON.stringify(apiResponse))
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
        nodeLogger.error("Error Occurred while searchUserInKOG "+ error)
        
    }
}