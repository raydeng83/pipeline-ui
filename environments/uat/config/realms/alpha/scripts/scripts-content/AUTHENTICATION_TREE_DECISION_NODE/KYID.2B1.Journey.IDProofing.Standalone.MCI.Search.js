var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: MCI Search Standalone",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Forgot.Email.MCI.Search",
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

/// Main Function
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
                        var isHighRisk = false;
                        var associatedAccounts = []
                        var associatedAccountKOGID = [];
                        var terminatedArray = [];
                        var jitArray = [];
                        var pingAccounts = []
                        var pingMailId = []
                        var matchedWithLoggedUser = []
                        var jitMailID = [];
                        var lexIdMismatch = [];
                        var inputNoMatch = [];
                        var verifiedLexId = nodeState.get("verifiedLexId");
                        var emailsWithVerifiedLexID = JSON.parse(nodeState.get("emailsWithVerifiedLexID"));
                        var ListOfPrimaryEmails = JSON.parse(nodeState.get("emailsWithVerifiedLexID"));
                        var mciKogIDs = [];

                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodeLogger.debug("For Loop Iteration: " + i)
                            logger.debug("verifiedLexId in KYID.2B1.Journey.IDProofing.Recovery.MCI.Search :: " + verifiedLexId)
                            searchUserInPingResponse = lib.searchUserInPingResponse(responseMCISearchApiCall.MCIResponse[i].KOGID, verifiedLexId);
                            nodeLogger.debug("searchUserInPingResponse is --> "+ JSON.stringify(searchUserInPingResponse))
                            mciKogIDs.push(responseMCISearchApiCall.MCIResponse[i].KOGID);

                            if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus.toLowerCase() =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel.toLowerCase() == "high" ){
                                isHighRisk = true;
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-000: High Risk Transaction:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                break;
                            }else if(searchUserInPingResponse && searchUserInPingResponse._id && searchUserInPingResponse.mail && searchUserInPingResponse.accountStatus && searchUserInPingResponse.lexID == verifiedLexId){
                                if((searchUserInPingResponse.accountStatus.toLowerCase() =="active")){
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Exact Match Found with logged in user and user status is active in Ping Identity:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                    nodeState.putShared("mail",searchUserInPingResponse.mail)
    
                                    matchedWithLoggedUser.push(searchUserInPingResponse.mail)
                                    if(!ListOfPrimaryEmails.includes(searchUserInPingResponse.mail)){
                                         ListOfPrimaryEmails.push(searchUserInPingResponse.mail)
                                    }
                                    //action.goTo("UpdateUserIdentity")
                                }
                                else{
                                    //auditLog("RIDP004", "KYID-LN-002 - Input is associated with terminated/susupended account");
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " :: " + "KYID-LN-001 - Input is associated with terminated/susupended account");
                                    terminatedArray.push(searchUserInPingResponse.mail);
                                }
                            }else if(searchUserInPingResponse && searchUserInPingResponse.error && searchUserInPingResponse.error === "lexid_mismatch" && searchUserInPingResponse._id){
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID Mismatch Found in Ping Identity, Searching in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                lexIdMismatch.push(searchUserInPingResponse._id) 
                            }else if(searchUserInPingResponse == null || !searchUserInPingResponse){  
                                // Record not found scenario in Ping Identity or verifification mismatch, search in KOG
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No Record Found in Ping Identity, Searching in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                associatedAccountKOGID.push(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Active Account Found in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID + " :: ");
                                        //Proceed with JIT
                                        if(!ListOfPrimaryEmails.includes(searchUserInKOGResponse.UserDetails.EmailAddress)){
                                             ListOfPrimaryEmails.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        }
                                        associatedAccounts.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        jitMailID.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        jitArray.push(searchUserInKOGResponse.UserDetails);
                                }else if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus != 1){
                                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " InActive Account Found in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID + " :: ");
                                }else{
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No Account Found in KOG:: " + responseMCISearchApiCall.MCIResponse[i].KOGID + " :: ");
                                }
                            }
                        } 
                        logger.error("ListOfPrimaryEmails is :: "+ JSON.stringify(ListOfPrimaryEmails))
                        nodeState.putShared("ListOfPrimaryEmails",ListOfPrimaryEmails)
                        if(isHighRisk){
                            nodeState.putShared("highRiskTransaction", true);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to FARS");
                            reason = "The user personal information provided to LexisNexis is verified";
                            title = "User identity verification is successful."
                            //auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeState.putShared("errorMessage","KYID-LN-000")
                            action.goTo("highRiskTransaction");
                        }else if(matchedWithLoggedUser.length == 0 || inputNoMatch.length>0){
                            // Account exist in ping does not match with logged in user error out
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity."
                            //auditLog("KYID-LN-001", `${flowName} - Input NOT matching with the verified identity`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID not matched with logged in user with KOGID "+ ":: " + "KYID-LN-001 - Input NOT matching verified identity");                           
                            nodeState.putShared("verifiedLexId","")
                            nodeState.putShared("proofingMethod","-1")
                            nodeState.putShared("MCISYNC","false")
                            nodeState.putShared("errorMessage","KYID-LN-007")
                            action.goTo("inputNotMatchingVerifiedIdentity");
                        }else if(terminatedArray.length>0 && terminatedArray.length == mciKogIDs.length){
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = `KYID or LexID matches with inactive account ${JSON.stringify(terminatedArray)} associated with the verified identity - LexID`
                            //auditLog("KYID-LN-002", `${flowName} - Inactive accounts associated with the Identity`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeState.putShared("verifiedLexId","")
                            nodeState.putShared("proofingMethod","-1")
                            nodeState.putShared("MCISYNC","false")
                            nodeState.putShared("errorMessage","KYID-LN-007")
                            nodeState.putShared("terminatedArray", JSON.stringify(terminatedArray))
                            action.goTo("inputLink2TerminatedAccount")
                        }
                    else if(matchedWithLoggedUser.length == 1){
                            reason = "The user personal information provided to LexisNexis is verified";
                            title = "User identity verification is successful."
                            //auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            if(emailsWithVerifiedLexID && emailsWithVerifiedLexID.length == 1){
                                action.goTo("exactMatchPatchUser");
                            }else{
                                action.goTo("exactMatch");
                            }
                        }
                        else if(lexIdMismatch.length>0){
                            reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                            title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity."
                            //auditLog("KYID-LN-001", `${flowName} - Input NOT matching with the verified identity`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-001 - Search result user identity does not match with verified identity");
                            nodeState.putShared("errorMessage","KYID-LN-007")
                            action.goTo("lexIdMismatch");
                        }
                    else if(jitArray.length>0){
                            reason = "The user personal information provided to LexisNexis is NOT verified due to MCI KOG ID not present in Ping";
                            title = "Verification Failed as KYID or LexID does not match with the MCI response or LexisNexis LexID"
                            //auditLog("KYID-LN-001", `${flowName} - Input NOT matching with the verified identity`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeState.putShared("jitArray", jitArray);
                            nodeState.putShared("pingAccounts",JSON.stringify(pingAccounts));
                            nodeState.putShared("pingMailId",JSON.stringify(pingMailId))
                            nodeState.putShared("jitMailID",JSON.stringify(jitMailID));     
                            nodeState.putShared("ListOfPrimaryEmails",associatedAccounts);
                            nodeState.putShared("associatedAccountKOGID",JSON.stringify(associatedAccountKOGID));
                            action.goTo("jitProvisioning");
                        }else if(jitArray.length == 0 && matchedWithLoggedUser.length == 0 && inputNoMatch.length == 0 && terminatedArray.length == 0){
                            //auditLog("RIDP004", "KYID-LN-007 - No account found in KOG search");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-007 - No accounts found in KOG search");
                            nodeState.putShared("errorMessage","KYID-LN-007")
                            action.goTo("noKOGAccount");
                        }
                    }
                }else if(responseMCISearchApiCall.status === "noMatch" || responseMCISearchApiCall.status === "partialMatch"){
                    logger.debug("emailsWithVerifiedLexID :: " + nodeState.get("emailsWithVerifiedLexID"))
                     if(nodeState.get("emailsWithVerifiedLexID")){
                        var emailsWithVerifiedLexID = JSON.parse(nodeState.get("emailsWithVerifiedLexID"));
                    }

                    if(emailsWithVerifiedLexID.length > 0){
                        nodeState.putShared("ListOfPrimaryEmails",JSON.stringify(emailsWithVerifiedLexID))
                        action.goTo("emailsWithVerifiedLexID")
                    }else{
                        //auditLog("RIDP004", "KYID-LN-004: No Match/Partial Match in MCI Search");
                        //auditLog("RIDP023", "Not able to find the indiviual based verified information");
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search GOING TO createAccount");
                        //nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Not able to find the indiviual based verified information");
                        nodeState.putShared("verifiedLexId","")
                        nodeState.putShared("proofingMethod","-1")
                        //action.goTo("notVerified");
                        nodeState.putShared("MCISYNC","false")
                        nodeState.putShared("errorMessage","KYID-LN-007")
                        action.goTo("emailsWithVerifiedLexID");
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
            logger.error("status is ::: => " + status)
            if (allowedStatuses.includes(status)) {
                parsedInput.status = status;
                isValid = true;
                if (parsedInput.status === "fullMatch") {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null;
                    logger.error("isValid is ::: => " + isValid)
                    return isValid;
                } else if(parsedInput.status === "partialMatch" || parsedInput.status === "noMatch"){
                    //isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null;
                    logger.error("isValid is ::: => " + isValid)
                    return isValid;
                }else{
                    logger.error("isValid is ::: => " + isValid)
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
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = false;
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
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