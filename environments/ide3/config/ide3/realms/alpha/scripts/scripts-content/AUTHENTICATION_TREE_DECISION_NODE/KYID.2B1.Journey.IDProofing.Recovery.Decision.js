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
    var isHighRisk = [];
    var noLexActiveUserFoundInPing =[];
    var noLexTerminatedUserFoundInPing = [];
    var InputUserNoMatchWSearchUser = [];
    var emailsWithVerifiedLexID = [];

    var riskIndicatorMatch = false;
    var dateCheck = false;
    var phoneRisk = null;
    var alternateEmailRisk = null;
    var exisitingHighRiskOverrideDate = null;
    var exisitingRiskIndicatorDetails = null;
    var exisitingRiskIndicator = null;
    var riskIndicatorDetails = null;
    var assuranceLevel = null ;
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

        var response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.error("response from query :: " + JSON.stringify(response))
        var highRisk = response.result[0].ridp_forgot_password_high_risk;
        logger.debug("Create Account highRisk flag from query :: " + highRisk)
        nodeState.putShared("highRisk", highRisk)
        nodeState.putShared("highRiskFlag", highRisk)

        exisitingHighRiskOverrideDate = nodeState.get("exisitingHighRiskOverrideDate") || null;
        exisitingRiskIndicatorDetails = nodeState.get("exisitingRiskIndicatorDetails") || null;
        exisitingRiskIndicator = nodeState.get("exisitingRiskIndicator") ? nodeState.get("exisitingRiskIndicator") : null;
        riskIndicatorDetails = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")).riskIndicatorDetails : null;


        logger.debug("Risk Indicator Details from LexisNexis response is :: " + JSON.stringify(riskIndicatorDetails));
        logger.debug("Existing Risk Indicator Details is :: " + JSON.stringify(exisitingRiskIndicatorDetails));
        logger.debug("Existing Risk Indicator is :: " + exisitingRiskIndicator);
        logger.debug("Risk Indicator is :: " + riskIndicator);
        logger.debug("Existing High Risk Override Date is :: " + exisitingHighRiskOverrideDate);


        var isEqual = (obj1, obj2) => {
          return JSON.stringify(obj1) === JSON.stringify(obj2);
        };


        var parseIfNeeded = (data) => {
            return typeof data === 'string' ? JSON.parse(data) : data;
        };
        
        // Robust Comparison
        var isEqual = (obj1, obj2) => {
            var clean1 = parseIfNeeded(obj1);
            var clean2 = parseIfNeeded(obj2);
            logger.debug("clean1 is :: " + JSON.stringify(clean1))
            logger.debug("clean2 is :: " + JSON.stringify(clean2))
            // Sort keys to ensure order doesn't break the match
            return JSON.stringify(clean1) === JSON.stringify(clean2);
        };

        logger.debug("riskIndicatorDetails is :: " + JSON.stringify(riskIndicatorDetails))
        
         if(riskIndicatorDetails && exisitingRiskIndicatorDetails ) {
            var result = isEqual(riskIndicatorDetails, exisitingRiskIndicatorDetails);
            nodeLogger.debug("result is :: " + result);
            riskIndicatorMatch = result;
        } 

        if(exisitingHighRiskOverrideDate){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + "Existing High Risk Override Date is :: " + exisitingHighRiskOverrideDate);
            logger.debug("dateTime" + dateTime);
            if(dateTime < exisitingHighRiskOverrideDate){
                dateCheck = true;
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + "Existing High Risk Override is still valid");
            }
        }

        logger.debug("riskIndicator flag is :: " + riskIndicator)
        logger.debug("highRisk flag1 is :: " + highRisk)
        logger.debug("riskIndicatorMatch flag is :: " + riskIndicatorMatch)
        logger.debug("exisitingRiskIndicator flag is :: " +  exisitingRiskIndicator);
        logger.debug("riskIndicatorMatch flag is :: " +  riskIndicatorMatch);
        logger.debug("dateCheck flag is :: " + dateCheck)

        
        if(((riskIndicator && riskIndicator.toLowerCase() === "high") || (phoneRisk && phoneRisk.toLowerCase() === "high") || (alternateEmailRisk && alternateEmailRisk.toLowerCase() === "high")) && highRisk && highRisk == true && (exisitingRiskIndicator && exisitingRiskIndicator.toLowerCase() == "override") && riskIndicatorMatch == true && dateCheck == true ){
            highRisk = false;
        }

        logger.debug("highRisk flag2 is :: " + highRisk)
 
 
        

        if(riskIndicator && riskIndicator.toLowerCase() === "high" && highRisk && highRisk == true) {
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
            if(riskIndicator){
               patchRiskIndicator();
            }
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
        }else if((riskIndicator.toLowerCase() === "moderate" || riskIndicator.toLowerCase() === "low" || riskIndicator.toLowerCase() === "norisk" || !highRisk) && (verificationStatus.toLowerCase() === "fullyverified" || verificationStatus.toLowerCase() === "partiallyverified") && (verifiedLexId!==null && verifiedLexId!=="")){ 
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

                       searchAccountArray = lib.queryPingByLexiID(verifiedLexId, nodeConfig, transactionid);
                       nodeLogger.debug("searchAccountArray is :: "+ JSON.stringify(searchAccountArray))
                       nodeState.putShared("lexMatch","true")

                        if(searchAccountArray && searchAccountArray.length > 0){                                                                                       
                            nodeState.putShared("searchAccountArray", JSON.stringify(searchAccountArray));
                            //auditLog("RIDP003", "KYID-LN-004 : Manage Profile - Accounts found in ping with verified identity");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Accounts found in Ping for verified LexID . proceeding for terminated and high risk check"+ verifiedLexId);
                            isHighRisk = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                            if(isHighRisk && isHighRisk.length > 0){
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID, Going to soft delete MCI Node");
                                reason = "The LexID associated account(s) in Ping Identity is marked as High Risk";
                                title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity"
                                auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                                auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                                action.goTo("highRiskSoftRemove");
                            }else{
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No High Risk/Terminated accounts found in Ping for verified LexID "+ verifiedLexId + "::" + "Proceeding to Update Profile Node");
                                searchAccountArray.forEach(searchAccountArrayMail => {
                                    if(searchAccountArrayMail.mail.toLowerCase() === mail.toLowerCase()){
                                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " matches with "+ searchAccountArrayMail.mail + "::" + "Going to check user is active or not Node");
                                        if(searchAccountArrayMail.accountStatus.toLowerCase() === "active"){
                                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Account is Active for user " +mail + ":: " + " Going to lexMatchUpdateProfile Node");
                                            
                                            noLexActiveUserFoundInPing.push(searchAccountArrayMail.mail)
                                            emailsWithVerifiedLexID.push(searchAccountArrayMail.mail)
                                            //action.goTo("noLexActiveUserFoundInPing");
                                        }else{
                                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input is associated with terminated/suspended account for user " + searchAccountArrayMail.mail + ":: " + " Going to error Node");                                        
                                            noLexTerminatedUserFoundInPing.push(searchAccountArrayMail.mail)
                                            //action.goTo("noLexTerminatedUserFoundInPing");
                                        }
                                    }else{
                                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " does not match with "+ searchAccountArrayMail.mail );
                                        InputUserNoMatchWSearchUser.push(searchAccountArrayMail.mail)
                                        emailsWithVerifiedLexID.push(searchAccountArrayMail.mail)
                                        //action.goTo("InputUserNoMatchWSearchUser");
                                    }
    
                                });

                                nodeState.putShared("emailsWithVerifiedLexID",JSON.stringify(emailsWithVerifiedLexID));
                            }
                        }
                        
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
                        //auditLog("RIDP003", "KYID-LN-004 : Manage Profile - Accounts found in ping with verified identity");
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Accounts found in Ping for verified LexID . proceeding for terminated and high risk check"+ verifiedLexId);
                        isHighRisk = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                        if(isHighRisk && isHighRisk.length > 0){
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID, Going to soft delete MCI Node");
                            reason = "The LexID associated account(s) in Ping Identity is marked as High Risk";
                            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity"
                            auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                            auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                            action.goTo("highRiskSoftRemove");
                        }else{
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No High Risk/Terminated accounts found in Ping for verified LexID "+ verifiedLexId + "::" + "Proceeding to Update Profile Node");
                            searchAccountArray.forEach(searchAccountArrayMail => {
                                if(searchAccountArrayMail.mail.toLowerCase() === mail.toLowerCase()){
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " matches with "+ searchAccountArrayMail.mail + "::" + "Going to check user is active or not Node");
                                    if(searchAccountArrayMail.accountStatus.toLowerCase() === "active"){
                                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Account is Active for user " +mail + ":: " + " Going to lexMatchUpdateProfile Node");
                                        
                                        noLexActiveUserFoundInPing.push(searchAccountArrayMail.mail)
                                        emailsWithVerifiedLexID.push(searchAccountArrayMail.mail)
                                        //action.goTo("noLexActiveUserFoundInPing");
                                    }else{
                                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input is associated with terminated/suspended account for user " + searchAccountArrayMail.mail + ":: " + " Going to error Node");                                        
                                        noLexTerminatedUserFoundInPing.push(searchAccountArrayMail.mail)
                                        //action.goTo("noLexTerminatedUserFoundInPing");
                                    }
                                }else{
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input user " +mail +":: " + " does not match with "+ searchAccountArrayMail.mail );
                                    InputUserNoMatchWSearchUser.push(searchAccountArrayMail.mail)
                                    emailsWithVerifiedLexID.push(searchAccountArrayMail.mail)
                                    //action.goTo("InputUserNoMatchWSearchUser");
                                }

                            });

                            nodeState.putShared("emailsWithVerifiedLexID",JSON.stringify(emailsWithVerifiedLexID));
                        }


                        filteredSearchAccountArray.push(searchAccountArray[0].mail);
                        logger.debug("filteredSearchAccountArray is :: " + filteredSearchAccountArray)
                        nodeState.putShared("filteredSearchAccountArray", JSON.stringify(filteredSearchAccountArray))

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


function patchRiskIndicator(){
    try{
        var selectedUser = nodeState.get("mail") || nodeState.get("EmailAddress");
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        if (typeof existingSession != 'undefined') {
            if(existingSession.get("UserId")){
                var existingID = existingSession.get("UserId")
            }
        
            //logger.error(" existingSession  is ::::::::: " + JSON.stringify(existingSession))
            if(existingSession.get("emailaddress")){
                var existingMail = existingSession.get("emailaddress")
            }
        }
        nodeState.putShared("audit_ID",existingID);
        nodeState.putShared("audit_LOGON",existingMail)
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
        logger.debug("auditData is :: " + JSON.stringify(auditData))
        nodeState.putShared("auditData", auditData)
        //var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["*","custom_userIdentity/*"]);
        logger.debug("selectedUser is :: " + selectedUser)
        var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["_id","frIndexedString1","frIndexedString2","userName","custom_organdonor","custom_userIdentity/*"]);
        logger.debug("pingSearchResponse is :: " + JSON.stringify(pingSearchResponse))

        jsonArray = []
        if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
            if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity._id){
                var alphaUserId = pingSearchResponse.result[0]._id
                var Id = pingSearchResponse.result[0].custom_userIdentity._id
                nodeState.putShared("patchUserId",Id)
                nodeState.putShared("alphaUserId",alphaUserId)
                logger.debug("_patchUserIdentity id is --> "+Id)


                
                //riskIndicator
                if(nodeState.get("riskIndicator") ){
                  var jsonObj = {
                    "operation": "replace",
                    "field": "riskIndicator",
                    "value": nodeState.get("riskIndicator")
                    }
                    jsonArray.push(jsonObj)
                }

                //lastVerificationMethod
                if( nodeState.get("flowName")){
                 var jsonObj = {
                    "operation": "replace",
                    "field": "lastVerificationMethod",
                    "value": nodeState.get("flowName")
                    }
                    jsonArray.push(jsonObj)
                }

                // //lastVerificationDate
                // var jsonObj = {
                //     "operation": "replace",
                //     "field": "lastVerificationDate",
                //     "value": dateTime
                //     }
                //     jsonArray.push(jsonObj) 

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

                //Audit Details
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedDateEpoch",
                     "value": auditData.updatedDateEpoch
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedByID",
                     "value": auditData.updatedByID
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updatedBy",
                     "value": auditData.updatedBy
                 });
            
                 jsonArray.push({
                     "operation": "replace",
                     "field": "/updateDate",
                     "value": auditData.updatedDate
                 });
                }
            }

             if(jsonArray.length>0){
                var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
                logger.debug("Patch Response -->"+response)
                if(response){
                    return true
                }
            }

    }catch(error){
        logger.error("Error in patchRiskIndicator function :: " + error)   
    } 
}