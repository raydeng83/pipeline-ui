var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: MCI Search",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Create.Account.MCI.Search",
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
    var riskIndicator = nodeState.get("riskIndicator")
    var highRisk = nodeState.get("highRisk");
    try {

        if(riskIndicator && riskIndicator.toLowerCase() === "high" && highRisk && highRisk == true) {
            // High Risk Transaction, Go to High Risk Node
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            reason = "The LexisNexis response contains high risk indicators";
            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
            auditLog("KYID-LN-000", "Create Account - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            nodeState.putShared("errorMessage","KYID-LN-000")
            action.goTo("highRiskTransaction");
        }
        // if(nodeState.get("riskIndicator").toLowerCase() === "high"){
        //     action.goTo("highRisk")
        // }
        else{
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
        }


    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error.message);
        action.goTo("error");
    }
}

// Invoking Main
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
    var flowName = "Create Account";
    var varverificationStatus = nodeState.get("verificationStatus");
    var usrKOGID = nodeState.get("KOGID");
    var userInfo = JSON.stringify(nodeState.get("userInfoJSON1"));
    var lexisnexisResponse =  nodeState.get("lexisnexisResponse");
    var parameters = {};
    var mail = nodeState.get("mail") || nodeState.get("EmailAddress") ||  nodeState.get("collectedPrimaryEmail");
    var reason = null;
    var title = null
    var verificationStatus = nodeState.get("verificationStatus");
    var emailsWithVerifiedLexID = JSON.parse(nodeState.get("emailsWithVerifiedLexID"));
    var ListOfPrimaryEmails = nodeState.get("emailsWithVerifiedLexID") ? JSON.parse(nodeState.get("emailsWithVerifiedLexID")) : []
    
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Inside handleUserResponses Function");
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var responseMCISearchApiCall = callbacks.getTextInputCallbacks()[0];
        var lib = require("KYID.2B1.Library.RIDP.Generic.Utils");
        var verifiedLexId = nodeState.get("verifiedLexId");
        var mciKogIDs = []
        nodeLogger.debug("MCI Search API Call Response: " + responseMCISearchApiCall);
        isResponseValidResult = isResponseValid(responseMCISearchApiCall)
        nodeLogger.debug("isResponseValidResult : " + isResponseValidResult); 
        responseMCISearchApiCall = JSON.parse(responseMCISearchApiCall)


        if(!isResponseValidResult){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " MCI Search Response is not valid");
            action.goTo("error")
        }else{
            if (selectedOutcome === 0) {
                nodeLogger.error("Valid Response received for MCI Search API Call: " + JSON.stringify(responseMCISearchApiCall));
                nodeState.putShared("validationErrorCode", null);
                if(responseMCISearchApiCall.status === "fullMatch"){
                    // Full Match Logic
                    if(responseMCISearchApiCall.MCIResponse.length>0){
                        nodeLogger.debug("Length of MCIResponse" + responseMCISearchApiCall.MCIResponse.length)
                        var searchUserInPingResponse = null;
                        var searchUserInKOGResponse = null;
                        var isHighRisk = false;
                        var associatedAccounts = [];

                        // Collecting all KOGIDs from MCI Response. to patch in mciKogIDs array in user identity
                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                             mciKogIDs.push(responseMCISearchApiCall.MCIResponse[i].KOGID)
                        }
                        nodeState.putShared("mciKogIDs", JSON.stringify(mciKogIDs))

                        // Looping through each KOGID from MCI Response to check in Ping Identity or KOG
                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodeLogger.debug("For Loop Iteration: " + i)
                            // Search User in Ping Identity
                            searchUserInPingResponse = lib.searchUserInPingResponse(responseMCISearchApiCall.MCIResponse[i].KOGID, verifiedLexId);
                            nodeLogger.debug("searchUserInPingResponse is --> "+ JSON.stringify(searchUserInPingResponse));

                            if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus.toLowerCase() =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel.toLowerCase() == "high"){
                                if(searchUserInPingResponse.kogID){
                                    nodeState.putShared("kogIDToDelete",searchUserInPingResponse.kogID)
                                }
                                //auditLog("RIDP004", "KYID-LN-000: High Risk Transaction in MCI Search", true);
                                isHighRisk = true;
                                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-000: High Risk Transaction:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                break;
                            }else if(searchUserInPingResponse && searchUserInPingResponse.mail && searchUserInPingResponse.accountStatus && (searchUserInPingResponse.accountStatus.toLowerCase() =="active" || searchUserInPingResponse.accountStatus.toLowerCase() =="suspended")){
                                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Associated Active/Suspended Account Found in Ping Identity:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                associatedAccounts.push(searchUserInPingResponse.mail);
                                 if(searchUserInPingResponse && searchUserInPingResponse.mail && !ListOfPrimaryEmails.includes(searchUserInPingResponse.mail)){
                                         ListOfPrimaryEmails.push(searchUserInPingResponse.mail)
                                 }
                            }else if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus.toLowerCase() =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel.toLowerCase() !== "high"){
                                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Low Risk Terminated Account Found in Ping Identity:: " + responseMCISearchApiCall.MCIResponse[i].KOGID);
                                 // if(!ListOfPrimaryEmails.includes(searchUserInPingResponse.mail)){
                                 //         ListOfPrimaryEmails.push(searchUserInPingResponse.mail)
                                 // }
                            }else if(searchUserInPingResponse == null || !searchUserInPingResponse){ 
                                // Search User in KOG 
                                searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                        associatedAccounts.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                } 
                                if(searchUserInPingResponse && searchUserInPingResponse.mail && !ListOfPrimaryEmails.includes(searchUserInPingResponse.mail)){
                                         ListOfPrimaryEmails.push(searchUserInPingResponse.mail)
                                }
                            }else if(searchUserInPingResponse && searchUserInPingResponse.error && searchUserInPingResponse.error.toLowerCase()=="lexid_mismatch"){
                                // Search User in KOG
                                searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                                if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                        associatedAccounts.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                } 
                                if(searchUserInPingResponse && searchUserInPingResponse.mail && !ListOfPrimaryEmails.includes(searchUserInPingResponse.mail)){
                                         ListOfPrimaryEmails.push(searchUserInPingResponse.mail)
                                }
                            }
                        } 

                        // Decisioning based on High Risk or Associated Accounts found
                        if(isHighRisk){
                            reason = "The LexisNexis response contains high risk indicators (id, name, description)";
                            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity."
                            auditLog("KYID-LN-000", "Create Account - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            nodeState.putShared("highRiskTransaction", true);
                            nodeState.putShared("errorMessage","KYID-LN-000")
                            action.goTo("highRiskTransaction");
                        }else if(associatedAccounts.length>0){
                            nodeState.putShared("searchEmailArray",associatedAccounts);
                            //reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(associatedAccounts);
                            reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(ListOfPrimaryEmails);
                            title = "One or more active account(s) are identified for the input and personal information provided."
                            auditLog("KYID-LN-003", "Create Account - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            action.goTo("associatedAccounts");
                        }else{
                            if(nodeState.get("verificationStatus") && nodeState.get("verificationStatus").toLowerCase()=== "notverified"){
                                nodeState.putShared("MCISync","false")
                            }else{
                                nodeState.putShared("MCISync","true")
                            }
                            action.goTo("createAccount");
                        }
                    }
                }else if(responseMCISearchApiCall.status === "noMatch" || responseMCISearchApiCall.status === "partialMatch"){
                    // No Match or Partial Match Logic
                    //auditLog("RIDP004", "No Match/Partial Match in MCI Search, creating account", true);
                    logger.debug("emailsWithVerifiedLexID :: " + nodeState.get("emailsWithVerifiedLexID"))
                    if(nodeState.get("emailsWithVerifiedLexID")){
                        var emailsWithVerifiedLexID = JSON.parse(nodeState.get("emailsWithVerifiedLexID"));
                    }
                    
                    if(verificationStatus && verificationStatus.toLowerCase() !== "notverified"){

                       if(emailsWithVerifiedLexID && emailsWithVerifiedLexID.length > 0){
                           reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(ListOfPrimaryEmails);
                           title = "One or more active account(s) are identified for the input and personal information provided."
                           auditLog("KYID-LN-003", "Create Account - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                       }
                        // reason = "Create Account - The user personal information provided to LexisNexis is verified ";
                        // title = "User identity verification is successful."
                        // auditLog("KYID-LN-007", "Create Account - Identity Proofing is successful", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search with verificationStatus :: " + verificationStatus + " going to createAccount");
                        nodeState.putShared("MCISync","true")
                        action.goTo("noMatchCreateAccount");
                    }else if(verificationStatus && verificationStatus.toLowerCase() == "notverified"){
                        if( emailsWithVerifiedLexID && emailsWithVerifiedLexID.length > 0){
                           reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(ListOfPrimaryEmails);
                           title = "One or more active account(s) are identified for the input and personal information provided."
                           auditLog("KYID-LN-003", "Create Account - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        }
                        nodeState.putShared("MCISync","false")
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search with verificationStatus :: " + verificationStatus + " going to createAccount");
                        action.goTo("noMatchCreateAccount");
                    }else{
                        if(emailsWithVerifiedLexID && emailsWithVerifiedLexID.length > 0){
                           reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(ListOfPrimaryEmails);
                           title = "One or more active account(s) are identified for the input and personal information provided."
                           auditLog("KYID-LN-003", "Create Account - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        }
                        nodeState.putShared("MCISync","false")
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Match or Partial Match Found in MCI Search with verificationStatus :: " + verificationStatus + " going to createAccount");
                        action.goTo("noMatchCreateAccount");
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
// function isResponseValid(input) {
//     try {
//         var parsedInput = JSON.parse(input);
//         var allowedStatuses = ["noMatch", "partialMatch", "fullMatch"];
//         var isValid = false;
//         if (typeof parsedInput === "object") {
//             var status = parsedInput.status || parsedInput[""] || null;
//             if (allowedStatuses.includes(status)) {
//                 parsedInput.status = status;
//                 isValid = true;
//                 if (parsedInput.status === "fullMatch") {
//                     isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null;
//                     logger.debug("isValid is ::: => " + isValid)
//                     return isValid;
//                 } else {
//                     isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
//                     logger.debug("isValid is ::: => " + isValid)
//                     return isValid;
//                 }
//             }
//         }
//         if (!isValid) {
//             nodeState.putShared("validationMessage", "invalid_input");
//             return false;
//         }
//     } catch (e) {
//         nodeLogger.error("isResponseValid " + e.message);
//         nodeState.putShared("validationMessage", "invalid_input");
//         return false;
//     }
// } 

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
                    nodeLogger.debug("isValid is ::: => " + isValid)
                    return isValid;
                } else {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
                    nodeLogger.debug("isValid is ::: => " + isValid)
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
        eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        //eventDetails["transactionid"] = transactionId || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || {};
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || {};
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || "";
        
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || "";
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
        var helpdeskVisibility = helpdeskVisibility || false;
        
        // if (userEmail) {
        //     var userQueryResult = openidm.query("managed/alpha_user", {
        //         _queryFilter: 'mail eq "' + userEmail + '"'
        //     }, ["_id"]);
        //     userId = userQueryResult.result[0]._id;
        // }
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