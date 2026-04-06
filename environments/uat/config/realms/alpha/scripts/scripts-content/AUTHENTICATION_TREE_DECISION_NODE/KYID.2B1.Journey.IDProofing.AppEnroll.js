var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: AppEnroll",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AppEnroll",
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
    var lib = require("KYID.2B1.Library.RIDP.Generic.Utils")
    var verifiedLexId = null;
    var flowName = null;
    var riskIndicator = null;
    var verificationStatus = null;
    var userAttributes = null;
    var usrKOGID = null;
    var _id = null
    var mail = null;
    var searchAccountArray = null;
    var prereqStatus = null
    var searchLoggedInUser = null;
    var loggedInUserLexId = null;
    var title = null;
    var userInfo = nodeState.get("userInfoJSON1")
    var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse");
    var isHighRiskAccount = false;
    var isHighRisk = [];
    var searchEmailArray = [];
    var pingAccounts = [];
    var response = null;
    var terminatedArray = [];
    var associatedAccountKOGID = []
    
    try {
        verifiedLexId = nodeState.get("verifiedLexId");
        flowName = "App Enroll" || nodeState.get("flowName");
        riskIndicator = nodeState.get("riskIndicator");
        verificationStatus = nodeState.get("verificationStatus");
        userAttributes = nodeState.get("userAttributes");
        usrKOGID = nodeState.get("KOGID");
        mail = nodeState.get("mail");
        _id = nodeState.get("_id")
        prereqStatus =  nodeState.get("userPrereqStatus") || nodeState.get("prereqStatus");
        
        response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.error("response from query :: " + JSON.stringify(response))
        var highRisk = response.result[0].ridp_app_enroll_high_risk;
        logger.debug("AppEnroll highRisk flag from query " + highRisk)

        if(riskIndicator && riskIndicator.toLowerCase() === "high" && highRisk) {
            //nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to FARS");
            reason = "The LexisNexis response contains high risk indicators";
            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
            auditLog("KYID-LN-000", "AppEnroll - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
            nodeState.putShared("errorMessage","KYID-LN-000")
                if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                    if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                        nodeState.putShared("prereqStatus","PENDING")
                        nodeState.putShared("patchPrereq","false")
                        action.goTo("highRisk")
                    }else{
                        nodeState.putShared("patchPrereq","false")
                        nodeState.putShared("prereqStatus","REVERIFY")
                        action.goTo("highRisk")
                    }                    
                }else{
                    action.goTo("highRiskBSP")
                }
               
            //action.goTo("highRisk");
        }else if(verificationStatus.toLowerCase() == "notverified"){
            nodeState.putShared("errorMessage","KYID-LN-005")
            reason = "The user personal information provided to LexisNexis is NOT verified";
            title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis.";
            auditLog("KYID-LN-005", "AppEnroll - Individual is not verified", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-005", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
             if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                    nodeState.putShared("prereqStatus","PENDING")
                    action.goTo("notVerified")
                }else{
                    nodeState.putShared("prereqStatus","REVERIFY")
                    action.goTo("notVerified")
                }
             }else{
                     action.goTo("notVerifiedBSP")
             }
        }else if(nodeState.get("kbaVerificationStatus") === "failed"){
            nodeState.putShared("errorMessage","KYID-LN-005")
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-003: KBA Verification Failed");
            reason = "The user personal information provided to LexisNexis is NOT verified";
            title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis.";
            auditLog("KYID-LN-005", "AppEnroll - Individual is not verified", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-005", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
            if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                    nodeState.putShared("prereqStatus","PENDING")
                    action.goTo("kbaFailed")
                }else{
                    nodeState.putShared("prereqStatus","REVERIFY")
                    action.goTo("kbaFailed")
                }
            }else{
                 action.goTo("kbaFailedBSP")
             }
        }else if((riskIndicator.toLowerCase() === "moderate" || riskIndicator.toLowerCase() === "low" || riskIndicator.toLowerCase() === "norisk") && (verificationStatus.toLowerCase() === "fullyverified" || verificationStatus.toLowerCase() === "partiallyverified") && (verifiedLexId!==null && verifiedLexId!=="")){ 
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Risk Indicator is Moderate/Low/noRisk and Verification Status is Fully/Partially Verified ");

            searchLoggedInUser = lib.searchUserByKOGID(_id, nodeConfig, transactionid);
            nodeLogger.debug("searchLoggedInUser is :: "+ JSON.stringify(searchLoggedInUser))

            //Search Ping with verified LexID
            searchAccountArray = lib.queryPingByLexiID(verifiedLexId, nodeConfig, transactionid);
            nodeLogger.debug("searchAccountArray is :: "+ JSON.stringify(searchAccountArray))

            if(searchAccountArray && searchAccountArray.length>0){
                searchAccountArray.forEach(function(value){
                    if(value && value.mail && value._id){
                        searchEmailArray.push(value.mail)
                        pingAccounts.push(value._id)
                        associatedAccountKOGID.push(value.userName)
                        if(value.accountStatus && value.accountStatus.toLowerCase() === "terminated"){
                            terminatedArray.push(value.mail)
                        }
                    }
                })
            }
            nodeState.putShared("searchEmailArray",JSON.stringify(searchEmailArray))
            nodeState.putShared("pingAccounts",JSON.stringify(pingAccounts))
             nodeState.putShared("associatedAccountKOGID",JSON.stringify(associatedAccountKOGID))
            if(searchAccountArray && searchAccountArray.length > 0){   
                nodeState.putShared("searchAccountArray", JSON.stringify(searchAccountArray));
                //auditLog("RIDP003", "KYID-LN-004 : Manage Profile - Accounts found in ping with verified identity");
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Accounts found in Ping for verified LexID . proceeding for terminated and high risk check"+ verifiedLexId);
                isHighRisk = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                if(isHighRisk && isHighRisk.length > 0){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID, Going to soft delete MCI Node" + JSON.stringify(isHighRisk));
                    nodeState.putShared("highRiskAccounts", JSON.stringify(isHighRisk));
                    reason = "The LexID associated account(s) in Ping Identity is marked as High Risk";
                    title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                    auditLog("KYID-LN-000", "AppEnroll - User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason);
                    auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                    isHighRiskAccount = true;
                }
            }

            if(searchLoggedInUser && searchLoggedInUser!==null){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "User found with KOGID in the system"+ JSON.stringify(searchLoggedInUser));
                if(searchLoggedInUser.custom_userIdentity && searchLoggedInUser.custom_userIdentity!==null && searchLoggedInUser.custom_userIdentity.uuid && searchLoggedInUser.custom_userIdentity.uuid!==null){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Logged in users lexID is "+ searchLoggedInUser.custom_userIdentity.uuid)
                    loggedInUserLexId = searchLoggedInUser.custom_userIdentity.uuid;
                    
                    if(loggedInUserLexId === verifiedLexId){
                       nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "LexID matched for logged in user with KOGID "+ usrKOGID + "::" + "KYID-LN-001 : Appenroll - matching verified identity");   
                       if(isHighRiskAccount){
                           reason = "The LexID associated account(s) in Ping Identity is marked as High Risk.";
                           title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                           auditLog("KYID-LN-000", "AppEnroll  - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                           auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                        if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                           if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                                nodeState.putShared("prereqStatus","PENDING")
                                nodeState.putShared("patchPrereq","false")
                                action.goTo("highRiskSoftRemove")
                            }else{
                                nodeState.putShared("prereqStatus","REVERIFY")
                                nodeState.putShared("patchPrereq","false")
                                action.goTo("highRiskSoftRemove")
                            }
                        }else{
                            action.goTo("highRiskSoftRemoveBSP")
                        }
                            //action.goTo("highRiskSoftRemove");
                       }else{
                            action.goTo("lexMatch");
                       }                       
                    }else if(loggedInUserLexId !== verifiedLexId){
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "verified LexID not matching with  logged in user Lexid with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Input NOT matching verified identity");   
                        //Need to block the user
                         
                         if(!(nodeState.get("flow") && nodeState.get("flow") === "helpdesk")){
                            if(terminatedArray.length > 0 && terminatedArray.length == searchAccountArray.length){
                                reason = "AppEnroll - KYID or LexID matches with inactive account (email) associated with the verified identity - LexID";
                                title = "User identity verification transaction failed due to user details provided as part of the input match with inactive accounts"
                                auditLog("KYID-LN-002", "AppEnroll - Inactive accounts associated with the Identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-002", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-002")
                                nodeState.putShared("inactiveUserAccounts",JSON.stringify(terminatedArray))
                                action.goTo("terminated");
                            }else if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                                 reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                auditLog("KYID-LN-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-001")
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","PENDING")
                                action.goTo("lexMisMatch");
                            }else{
                                reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                auditLog("KYID-LN-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-001")
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","REVERIFY")
                                action.goTo("lexMisMatch");
                             }
                         }else{
                            if(terminatedArray.length>0 && terminatedArray.length == searchAccountArray.length){
                                reason = "AppEnroll - KYID or LexID matches with inactive account (email) associated with the verified identity - LexID";
                                title = "User identity verification transaction failed due to user details provided as part of the input match with inactive accounts"
                                auditLog("KYID-LN-002", "AppEnroll - Inactive accounts associated with the Identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-002", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-002")
                                nodeState.putShared("inactiveUserAccounts",JSON.stringify(terminatedArray))
                                action.goTo("terminatedBSP");
                            }else if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                                reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                auditLog("KYID-LN-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-001")
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","PENDING")
                                action.goTo("lexMisMatchBSP");
                            }else{
                                reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                                title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity.";
                                auditLog("KYID-LN-001", "AppEnroll - Input NOT matching with the verified identity", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                                nodeState.putShared("errorMessage","KYID-LN-001")
                                nodeState.putShared("patchPrereq","false")
                                nodeState.putShared("prereqStatus","REVERIFY")
                                action.goTo("lexMisMatchBSP");
                             }
                         }
                    }else{
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Error in LexID comparison for logged in user with KOGID "+ usrKOGID + "::" + " Going to Error Node");
                        action.goTo("error");
                    }
                }else{
                    //No lexID found for the logged in user
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No lexID found for logged in user with KOGID "+ usrKOGID);
                    nodeState.putShared("noLexID","true")
                    if(searchAccountArray && searchAccountArray.length > 0){  
                        nodeState.putShared("accountsFound","true")
                        if(isHighRiskAccount){
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "High Risk Account found in Ping for verified LexID but no lexID found for logged in user with KOGID " + "::" + " Going to High Risk Soft Remove Node");   
                            reason = "The LexID associated account(s) in Ping Identity is marked as High Risk.";
                            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                            auditLog("KYID-LN-000", "AppEnroll  - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null);
                            //nodeState.putShared("patchPrereq","false")
                            if(prereqStatus && prereqStatus.toLowerCase() == "reverify"){
                                action.goTo("highRiskSoftRemove");
                            }else{
                            action.goTo("highRiskSoftRemoveBSP")
                            }
                        }else{
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No lexID found for logged in user with KOGID "+ usrKOGID + " but accounts found in Ping for verified LexID "+ verifiedLexId + "::" + " Going to MCI Search Node to search the user with other attributes");
                            action.goTo("mciSearch");
                        }
                    }else{
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No Accounts found in Ping for verified LexID "+ verifiedLexId);
                        action.goTo("mciSearch");
                    }
                }
            }else{
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Error while searching for loggedin user "+ usrKOGID + " ::" + " Going to Error Node");
                action.goTo("error");
            }
        }else{
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Either Risk Indicator is Unknown or Verification Status is Unverified/Failed/Unknown or verifiedLexId is null/empty "+ "::" + " Going to Error Node");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "Error in Main Execution "+ error);
        action.goTo("error");
    }
}

main();


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