var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Recovery Decision",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Recovery.Decision",
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
    var searchAccountArray = [];
    var searchLoggedInUser = null;
    var loggedInUserLexId = null;
    var verificationAttempt = null;
    var filteredSearchAccountArray = [];
    
    try {
        verifiedLexId = nodeState.get("verifiedLexId");
        flowName = Flowname() || nodeState.get("flowName");
        riskIndicator = nodeState.get("riskIndicator");
        verificationStatus = nodeState.get("verificationStatus");
        userAttributes = nodeState.get("userAttributes");
        usrKOGID = nodeState.get("KOGID");
        mail = nodeState.get("mail");
        _id = nodeState.get("_id");
        lexisnexisResponse = nodeState.get("lexisnexisResponse")
        userInfo = nodeState.get("userInfoJSON1")
        var isHighRisk = [];
        var noLexActiveUserFoundInPing =[];
        var noLexTerminatedUserFoundInPing = [];
        var InputUserNoMatchWSearchUser = [];
        

        if(riskIndicator && riskIndicator.toLowerCase() === "high" && systemEnv.getProperty("esv.ridp.recovery.high.risk.flag") && systemEnv.getProperty("esv.ridp.recovery.high.risk.flag").toLowerCase() == "true") {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            reason = "The LexisNexis response contains high risk indicators";
            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
            auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-000")
            action.goTo("highRisk");
        }else if(verificationStatus.toLowerCase() == "notverified"){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-005: Verification Status is Not Verified, Going to Not Verified Node");
            var reason = "The user personal information provided to LexisNexis is NOT verified";
            title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis."
            auditLog("KYID-LN-005", `${flowName} - Individual is not verified`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-005", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-005")
            action.goTo("notVerified");
        }else if(nodeState.get("kbaVerificationStatus") === "failed"){
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-005: KBA Verification Failed");
            var reason = "The user personal information provided to LexisNexis is NOT verified";
            title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis."
            auditLog("KYID-LN-005", `${flowName} - Individual is not verified`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            auditLog("KYID-LN-005", `User identity failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("verificationStatus","notverified")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-005")
            action.goTo("kbaFailed");
        }else if((riskIndicator.toLowerCase() === "moderate" || riskIndicator.toLowerCase() === "low" || riskIndicator.toLowerCase() === "norisk") && (verificationStatus.toLowerCase() === "fullyverified" || verificationStatus.toLowerCase() === "partiallyverified") && (verifiedLexId!==null && verifiedLexId!=="")){ 
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Risk Indicator is Moderate/Low/noRisk and Verification Status is Fully/Partially Verified ");
            searchLoggedInUser = lib.searchUserByKOGID(_id, nodeConfig, transactionid);
            if(searchLoggedInUser && searchLoggedInUser!==null){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "User found with KOGID in the system"+ JSON.stringify(searchLoggedInUser));
                if(searchLoggedInUser.custom_userIdentity && searchLoggedInUser.custom_userIdentity!==null && searchLoggedInUser.custom_userIdentity.uuid && searchLoggedInUser.custom_userIdentity.uuid!==null){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Logged in users lexID is "+ searchLoggedInUser.custom_userIdentity.uuid)
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Logged in users verificationAttempt is "+ searchLoggedInUser.custom_userIdentity.verificationAttempt)
                    verificationAttempt = searchLoggedInUser.custom_userIdentity.verificationAttempt || "0";
                    nodeState.putShared("verificationAttempt", verificationAttempt)
                    nodeState.putShared("patchUserId",searchLoggedInUser.custom_userIdentity._id)
                    loggedInUserLexId = searchLoggedInUser.custom_userIdentity.uuid;
                    if(loggedInUserLexId === verifiedLexId){
                       nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "LexID matched for logged in user with KOGID "+ usrKOGID + "::" + "KYID-LN-001 : Recovery Input - matching verified identity");   
                       // reason = "The user personal information provided to LexisNexis is verified";
                       // auditLog("KYID-LN-007", "User identity verification is successful", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason);
                       //nodeState.putShared("MCISYNC","false")
                       filteredSearchAccountArray.push(mail);
                       nodeState.putShared("filteredSearchAccountArray", JSON.stringify(filteredSearchAccountArray))
                       nodeState.putShared("accountStatus", "active")
                       action.goTo("lexMatch");
                    }else if(loggedInUserLexId !== verifiedLexId){
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "verified LexID not matching with  logged in user Lexid with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Input NOT matching verified identity");   
                        reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                        title = "User identity verification  transaction failed due to user details provided as part of the input does not match with the verified identity."
                        auditLog("KYID-LN-001", `${flowName} - Input NOT matching with the verified identity`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        auditLog("KYID-LN-001", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
                        nodeState.putShared("errorMessage","KYID-LN-001")
                        action.goTo("lexMisMatch");
                    }else{
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Error in LexID comparison for logged in user with KOGID "+ usrKOGID + "::" + " Going to Error Node");
                        action.goTo("error");
                    }
                }else{
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No lexID found for logged in user with KOGID "+ usrKOGID);
                    //Search Ping with verified LexID
                    searchAccountArray = lib.queryPingByLexiID(verifiedLexId, nodeConfig, transactionid);
                    nodeLogger.debug("searchAccountArray is :: "+ JSON.stringify(searchAccountArray))

                    if(searchAccountArray && searchAccountArray.length > 0){
                        nodeState.putShared("searchAccountArray", JSON.stringify(searchAccountArray));
                        isHighRisk = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                        filteredSearchAccountArray.push(searchAccountArray[0].mail);
                        nodeState.putShared("filteredSearchAccountArray", JSON.stringify(filteredSearchAccountArray))
    
                        if(isHighRisk && isHighRisk.length > 0){
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID");
                            //auditLog("RIDP015", "KYID-LN-000:  High Risk Account found in Ping for verified identity");
                            reason = "The associated account(s) in Ping Identity is marked as High Risk.";
                            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                            auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
                            nodeState.putShared("errorMessage","KYID-LN-000")
                            action.goTo("highRisk");
                        }else{
                            if(searchAccountArray && searchAccountArray.length > 0 && searchAccountArray[0].mail == mail){
                               if(searchAccountArray[0].accountStatus.toLowerCase()=== "active"){
                                   nodeState.putShared("accountStatus", "active")
                                   action.goTo("mciSearch");
                               }else if(searchAccountArray[0].accountStatus.toLowerCase() !== "active"){
                                   nodeState.putShared("accountStatus", "inactive")
                                   action.goTo("mciSearch");
                               }
                            }else{
                                nodeState.putShared("accountStatus", "notMatching")
                                action.goTo("mciSearch");
                            }
                        }
                    }else{
                        action.goTo("mciSearch");
                    }
                    
                    
                    // if(searchAccountArray && searchAccountArray.length > 0){                                                                                       
                    //     //nodeState.putShared("searchAccountArray", JSON.stringify(searchAccountArray));
                    //     //auditLog("RIDP020", "KYID-LN-004 : Accounts found in ping with verified identity");
                    //     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Accounts found in Ping for verified LexID . proceeding for terminated and high risk check"+ verifiedLexId);
                    //     isHighRisk = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                    //     if(isHighRisk && isHighRisk.length > 0){
                    //         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID");
                    //         //auditLog("RIDP015", "KYID-LN-000:  High Risk Account found in Ping for verified identity");
                    //         reason = "The associated account(s) in Ping Identity is marked as High Risk.";
                    //         title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                    //         auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    //         auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
                    //         nodeState.putShared("errorMessage","KYID-LN-000")
                    //         action.goTo("highRiskSoftRemove");
                    //     }else{
                    //         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No High Risk/Terminated accounts found in Ping for verified LexID "+ verifiedLexId + "::" + "Proceeding to Update Profile Node");
                    //         searchAccountArray.forEach(searchAccountArrayMail => {
                    //             if(searchAccountArrayMail.mail.toLowerCase() === mail.toLowerCase()){
                    //                 nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " matches with "+ searchAccountArrayMail.mail + "::" + "Going to check user is active or not Node");
                    //                 if(searchAccountArrayMail.accountStatus.toLowerCase() === "active" || searchAccountArrayMail.accountStatus.toLowerCase() === "suspended"){
                    //                     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Account is Active for user " +mail + ":: " + " Going to lexMatchUpdateProfile Node");
                    //                     //auditLog("RIDP025", "KYID-LN-005 :  Active account found in ping for user");
                    //                     noLexActiveUserFoundInPing.push(searchAccountArrayMail.mail);
                    //                     filteredSearchAccountArray.push(searchAccountArrayMail.mail);
                    //                     //action.goTo("noLexActiveUserFoundInPing");
                    //                 }else{
                    //                     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input is associated with terminated/suspended account for user " + searchAccountArrayMail.mail + ":: " + " Going to error Node");
                    //                     //auditLog("RIDP026", "KYID-LN-006 :  Terminated/Suspended account found in ping for user");
                    //                     noLexTerminatedUserFoundInPing.push(searchAccountArrayMail.mail)
                    //                     //action.goTo("noLexTerminatedUserFoundInPing");
                    //                 }
                    //             }else{
                    //                 nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " does not match with "+ searchAccountArrayMail.mail );
                    //                 //auditLog("RIDP021", "KYID-LN-004 :  No matching account found in ping for user");
                    //                 //filteredSearchAccountArray.push(searchAccountArrayMail.mail);
                    //                 InputUserNoMatchWSearchUser.push(searchAccountArrayMail.mail)
                    //                 //action.goTo("InputUserNoMatchWSearchUser");
                    //             }

                    //         });

                    //         if(filteredSearchAccountArray && filteredSearchAccountArray.length >0 ){
                    //             nodeState.putShared("filteredSearchAccountArray", JSON.stringify("filteredSearchAccountArray"))
                    //             action.goTo("mciSearch");
                    //         }else{
                    //             action.goTo("mciSearch");
                    //         }

                    //         // if(noLexActiveUserFoundInPing && noLexActiveUserFoundInPing.length>0){
                    //         //     action.goTo("noLexActiveUserFoundInPing");
                    //         // }else if(noLexTerminatedUserFoundInPing && noLexTerminatedUserFoundInPing.length>0){
                    //         //     action.goTo("noLexTerminatedUserFoundInPing");
                    //         // }else if(InputUserNoMatchWSearchUser && InputUserNoMatchWSearchUser.length>0){
                    //         //     nodeState.putShared("verifiedLexId","")
                    //         //     nodeState.putShared("proofingMethod","-1")
                    //         //     nodeState.putShared("verificationStatus","notverified")
                    //         //     action.goTo("InputUserNoMatchWSearchUser");
                    //         // }
                    //     }
                    // }else{
                    //     auditLog("RIDP021", "KYID-LN-004 :  No Accounts found in ping with verified identity");
                    //     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No Accounts found in Ping for verified LexID "+ verifiedLexId);
                    //     action.goTo("mciSearch");
                    // }
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


function Flowname(){
    if(nodeState.get("flowName").toLowerCase() === "forgotpassword"){
        return "Forgot Password";
    }else if(nodeState.get("flowName").toLowerCase() === "mfarecovery"){
        return "MFA Recovery";
    }else if(nodeState.get("flowName").toLowerCase() === "userverification"){
        return "User Verification";
    }else{
        return null;
    }
}