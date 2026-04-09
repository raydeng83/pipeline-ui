var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: AssociatedAccounts App Enroll",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AppEnroll.AssociatedAccounts.Proccessing",
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
    var mail = nodeState.get("EmailAddress");
    var userInfoJSON = nodeState.get("userInfoJSON1");
    //var userInfo = nodeState.get("userInfoJSON")
    var associatedAccounts = [];
    var terminatedLowRisk = [];
    var associatedAccountKOGID = [];
    var appID = null;
    var roleId = null;
    var usrcreatedId = [];
    var accessArray = [];
    var pingAccounts = [];
    var matchedWithLoggedUser =null;
    var verifiedLexId = null;
    var accessMailArray = [];
    var jitKOGArray = [];
    var roleCheckArray = [];
    var jitArray = [];
    var roleCheckExists = [];
    var flowName = "App Enroll" || nodeState.get("flowName");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse")

    if((nodeState.get("searchEmailArray") && nodeState.get("searchEmailArray") != null) || (nodeState.get("associatedAccountKOGID") && nodeState.get("associatedAccountKOGID") != null) || (nodeState.get("jitKOGIDArray") && nodeState.get("jitKOGIDArray") != null) ){
        associatedAccounts = JSON.parse(nodeState.get("searchEmailArray"));
        associatedAccountKOGID = JSON.parse(nodeState.get("associatedAccountKOGID"));
        jitKOGArray = JSON.parse(nodeState.get("jitKOGIDArray"));
        jitArray = JSON.parse(nodeState.get("jitArray"))
        logger.debug("associatedAccounts is :: "+ associatedAccounts)
        logger.debug("associatedAccountKOGID is :: "+ associatedAccountKOGID)
    }else if(nodeState.get("terminatedLowRisk") && nodeState.get("terminatedLowRisk") != null && nodeState.get("terminatedLowRisk") != "" && nodeState.get("associatedAccountKOGID") && nodeState.get("associatedAccountKOGID") != null && nodeState.get("associatedAccountKOGID") != "" ){
        terminatedLowRisk = JSON.parse( nodeState.get("terminatedLowRisk"));
        associatedAccountKOGID = JSON.parse(nodeState.get("associatedAccountKOGID"));
    }   

    if(nodeState.get("matchedWithLoggedUser")){
        matchedWithLoggedUser = JSON.parse(nodeState.get("matchedWithLoggedUser"))
        logger.debug("matchedWithLoggedUser is :: "+ matchedWithLoggedUser)
    }


    if(associatedAccounts.includes(mail) || associatedAccountKOGID.includes(usrKOGID) || terminatedLowRisk.includes(mail) || associatedAccountKOGID.includes(usrKOGID)){
        if(associatedAccounts && associatedAccounts.length == 1 && matchedWithLoggedUser && matchedWithLoggedUser.length == 1 && associatedAccounts[0]==matchedWithLoggedUser[0]){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "logged in account is the only associated account with requested access, procced to patch user identity");
            verifiedLexId = nodeState.get("verifiedLexId");
            var patchUserIdentityResponse = patchUserIdentity(matchedWithLoggedUser[0],verifiedLexId);
            if(patchUserIdentityResponse){
                //auditLog("RIDP006", "KYID-LN-001 - Logged in account is patched with verified identity");
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-001 - Logged in account is patched with verified identity, proccet to patch pre-requisites");
                nodeState.putShared("prereqStatus","COMPLETED")
                reason = "Create Account - The user personal information provided to LexisNexis is verified ";
                title = "User identity verification is successful."
                auditLog("KYID-LN-007", "App Enroll - Identity Proofing is successful", true, transactionid, flowName, mail, userInfoJSON, lexisnexisResponse, reason);
                action.goTo("patchPreReq")
            }
        }else if(associatedAccounts.length > 0 ){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Active/Suspended accounts associated with the verified Identity");
            //auditLog("RIDP006", "KYID-LN-001 - Active/Suspended accounts associated with the verified Identity");
            //Request Access Logic Here
            logger.debug("appId is :: "+ nodeState.get("appId"))
            if(nodeState.get("appId")){
                appID = nodeState.get("appId");
            }

            logger.debug("roleId is :: "+ nodeState.get("roleId"))
            logger.debug("roleId is :: "+ nodeState.get("userPrereqRoleId"))
            if(nodeState.get("roleId") || nodeState.get("userPrereqRoleId")){
                roleId = nodeState.get("roleId") || nodeState.get("userPrereqRoleId")
            }

             logger.debug("usrcreatedId: "+ nodeState.get("createdIDArray"))
            // if(nodeState.get("createdIDArray")){
            //    // usrcreatedId.push(nodeState.get("createdIDArray"));
            //     usrcreatedId = JSON.parse(nodeState.get("createdIDArray"))
            //     logger.debug(" is usrcreatedId array"+ Array.isArray(usrcreatedId))
            // }

            if(nodeState.get("pingAccounts")){
                pingAccounts = JSON.parse(nodeState.get("pingAccounts"));
            }
            logger.debug("pingAccounts is ::: "+ JSON.parse(nodeState.get("pingAccounts")))
            logger.debug("pingAccounts value is ::: "+ pingAccounts)
            logger.debug("pingAccounts value is ::: "+  Array.isArray(pingAccounts))
            
            // if(Array.isArray(usrcreatedId) && usrcreatedId.length >0){
            //     usrcreatedId.forEach(function(createdId){
            //         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Querying Access Request for ID: " + createdId);
            //         var response = openidm.query("managed/alpha_kyid_access", { "_queryFilter": '/roleIdentifier eq "' + roleId + '"'  + ' and /appIdentifier eq "' + appID + '"' + ' and /userIdentifier eq "' + createdId + '"' + ' and recordState eq "0"' }, ["*"]);
            //         logger.debug("response for usrcreatedId is :: " + JSON.stringify(response))
            //         if(response && response.resultCount >0){
            //             accessArray.push(response.result[0]);
            //         }
            //     });
            // }

            if(pingAccounts && Array.isArray(pingAccounts) && pingAccounts.length >0){
                pingAccounts.forEach(function(pingAccountsId){
                    if(pingAccountsId !== nodeState.get("UserId")){
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Querying Access Request for ID: " + pingAccountsId);
                        var response = openidm.query("managed/alpha_kyid_access", { "_queryFilter": '/roleIdentifier eq "' + roleId + '"'  + ' and /appIdentifier eq "' + appID + '"' + ' and /userIdentifier eq "' + pingAccountsId + '"' + ' and recordState eq "0"' }, ["*","user/mail"]);
                        logger.debug("response for pingAccounts is :: " + JSON.stringify(response))
                        if(response && response.resultCount >0){
                            accessArray.push(response.result[0]);
                            if(response.result[0].user && response.result[0].user.mail){
                                accessMailArray.push(response.result[0].user.mail)
                            }
                        }
                    }
                });
            }

            logger.debug("jitKOGArray is " + jitKOGArray)
            if(jitKOGArray && Array.isArray(jitKOGArray) && jitKOGArray.length >0){
                jitKOGArray.forEach(function(accounts){
                   var roleCheck = checkRoleInKOG(accounts);
                    if(roleCheck && roleCheck.roleExists == true && roleCheck.roleCount > 0){
                        roleCheckExists.push(roleCheck);
                        roleCheckArray.push(accounts);
                    }
                })
            }

            logger.debug("roleCheckArray is :: " + JSON.stringify(roleCheckArray))
            logger.debug("jitArray is :: " + JSON.stringify(jitArray))
            
            nodeState.putShared("roleCheckArray",JSON.stringify(roleCheckArray));
            nodeState.putShared("roleCheckExists",JSON.stringify(roleCheckExists));
            var getMailAddressesArray = getMailAddresses(roleCheckArray,jitArray) || [];

            // if(getMailAddressesArray.length>0 && accessMailArray.length>0){
            //   var accessMailArray = mergeIntoAccessMailArray(getMailAddressesArray,accessMailArray)
            // }
            logger.debug("getMailAddressesArray is :: " + JSON.stringify(getMailAddressesArray))
            logger.debug("accessMailArray is :: " + JSON.stringify(accessMailArray))
            var accessMailArray = mergeArrays(getMailAddressesArray,accessMailArray)
            
            logger.debug("accessMailArray are " + JSON.stringify(getMailAddressesArray))
            logger.debug("accessMailArray are " + JSON.stringify(accessMailArray))
            logger.debug("associatedAccounts are " + JSON.stringify(associatedAccounts))
            
            // associatedAccounts = associatedAccounts.filter(function(item) {
            //     return item !== mail
            // });
            
            if(accessArray.length>0 || accessMailArray.length>0){
                if (callbacks.isEmpty()) {
                    requestCallbacks(accessMailArray);
                } else {
                    //handleUserResponses(usrcreatedId,pingAccounts,accessArray,roleId, appID);
                    handleUserResponses(pingAccounts,accessArray,roleId, appID);
                }   
            }else{
                var verifiedLexId = nodeState.get("verifiedLexId");
                logger.debug("in line 144")
                var patchUserIdentityResponse = patchUserIdentity(nodeState.get("EmailAddress"),verifiedLexId);
                nodeState.putShared("prereqStatus","COMPLETED")
               // auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, false, transactionid, flowName, mail, userInfoJSON, lexisnexisResponse, reason, title);
                reason = "The user personal information provided to LexisNexis is verified";
                title = "User identity verification is successful."
                auditLog("KYID-LN-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfoJSON, lexisnexisResponse, reason, title);
                action.goTo("patchPreReq")
            }
            

        }else if(terminatedLowRisk.length > 0){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-002 - Inactive accounts associated with the Identity");
            auditLog("RIDP006", "KYID-LN-002 - Inactive accounts associated with the Identity");
            if(nodeState.get("prereqStatus")== "REVERIFY"){
                nodeState.putShared("prereqStatus","PENDING")
            }else{
                nodeState.putShared("prereqStatus","REVERIFY")
            }
            action.goTo("terminatedLowRisk");
        }
    }else{
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-001 - Input not match with verified Identity");
        auditLog("RIDP006", "KYID-LN-001 - Input not match with verified Identity");
        if(nodeState.get("prereqStatus")== "REVERIFY"){
            nodeState.putShared("prereqStatus","PENDING")
        }else if(nodeState.get("prereqStatus")== "COMPLETED"){
            nodeState.putShared("prereqStatus","COMPLETED")
        }else{
            nodeState.putShared("prereqStatus","REVERIFY")
        }
        action.goTo("inputNotMatchWithVerifiedIdentity");
    }

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error.message);
        action.goTo("error");
    }
}

main()


function requestCallbacks(associatedAccounts) {
    var appTitle = null;
    var roleTitle = null;
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Requesting User Response via Callbacks");
        pageHeader= {"pageHeader": "5_RIDP_Sync_SIH_Display_Email"};
        callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader))
        if(nodeState.get("appTitle") || nodeState.get("appName")){
            appTitle = nodeState.get("appTitle") || nodeState.get("appName")
        }
        if(nodeState.get("roleTitle") || nodeState.get("roleName")){
            roleTitle = nodeState.get("roleTitle") || nodeState.get("roleName");
        }
        //var ErrorMsg = "KYID-LN-009"
        if(nodeState.get("flow") && nodeState.get("flow") === "helpdesk"){
            callbacksBuilder.textOutputCallback(0, JSON.stringify({"ErrorMsg":"KYID-LN-009","Flow":"resumeappenrollment"}));
        }else{
            callbacksBuilder.textOutputCallback(0, JSON.stringify({"ErrorMsg":"KYID-LN-009","Flow":"appEnroll"}));
        }
        
        
        //callbacksBuilder.textOutputCallback(0, "We found your following account(s) that already has the requested access")
        var jsonObj = {"requestedAccess":{"applicationName":appTitle, "roleName":roleTitle}};
        callbacksBuilder.textOutputCallback(0, "We found your following account that already has the requested access")
        callbacksBuilder.textOutputCallback(0, JSON.stringify(jsonObj));
        var prompt = "Account(s) with the requested access:";
        //callbacksBuilder.textOutputCallback(0, JSON.stringify({"Flow":"appEnroll"}))
        var associatedJSONObj = {"associatedEmailIds": associatedAccounts};
        callbacksBuilder.textOutputCallback(0, JSON.stringify(associatedJSONObj))
        callbacksBuilder.textOutputCallback(0, "Please select the option below to continue with the request.")
        callbacksBuilder.textOutputCallback(0, "1. Use account with the requested access. If you continue with this option, you don't need to request the access. <It may terminate the current logged in account.>")
        callbacksBuilder.textOutputCallback(0, "2. Use the current logged in account to request the access. If you continue with this option, it will <revoke the requested access from the existing account / remove the existing account>.")
        var userChoice= ["Use account(s) with the requested access", "Continue with the current logged in account"]
        var prompt = "Select from below options"
        //callbacksBuilder.confirmationCallback(0, ["(Use account(s) with the requested access)", "Continue with the current logged in account"], 0);
         callbacksBuilder.choiceCallback(`${prompt}`, userChoice, 0 ,false)
         callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Request Callback Function: " + error.message);
        action.goTo("error");
    }
}

//function handleUserResponses(usrcreatedId,pingAccounts,accessArray,roleId, appID) {
function handleUserResponses(pingAccounts,accessArray,roleId, appID) {
    var flowName = "App Enroll" || nodeState.get("flowName");
    var mail = nodeState.get("mail");
    var _id = nodeState.get("_id");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse")
    var userInfo = nodeState.get("userInfoJSON")
    var userInfoJSON = nodeState.get("userInfoJSON1");
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Handling User Responses from Callbacks"); 
        var selectedConfirmationOutcome = callbacks.getConfirmationCallbacks()[0];
        logger.debug("selectedConfirmationOutcome are :: "+ selectedConfirmationOutcome)
        var selectedOutcome = callbacks.getChoiceCallbacks().get(0)[0];
         logger.debug("selectedOutcome are :: "+ selectedOutcome)
        //var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        //var selectedUser = callbacks.getChoiceCallbacks().get(0)[0];
        var pingMailId = JSON.parse(nodeState.get("pingMailId"));
        var createdMailArray = JSON.parse(nodeState.get("createdMailArray"));
        logger.debug("pingAccounts are :: "+ JSON.stringify(pingAccounts))
        pingAccounts = pingAccounts.filter(function(item) {
                return item !== nodeState.get("UserId")
            });
        logger.debug("pingAccounts after removing logged in user is :: "+ JSON.stringify(pingAccounts))
        if(selectedConfirmationOutcome === 0){
            if(selectedOutcome === 1){
                var count = 0;
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User selected to continue with the logged in account");
                //var patchUserIdentityResponse = patchUserIdentity(selectedUser);
                
                // if(Array.isArray(usrcreatedId) && usrcreatedId.length >0){
                //     usrcreatedId.forEach(function(usrcreatedAccountId){
                //         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Querying Access Request for ID: " + usrcreatedAccountId);
                //         var response = openidm.query("managed/alpha_kyid_access", { "_queryFilter": '/userIdentifier eq "' + usrcreatedAccountId + '"' + ' and recordState eq "0"' }, ["*"]);
                //         logger.debug("response is :::: "+ JSON.stringify(response))
                //         logger.debug("Array.isArray(accessArray) is :::: "+ Array.isArray(accessArray))
                //         logger.debug("AccessArray is :::: "+ JSON.stringify(accessArray))
                //         if(response && response.resultCount >1){
                //            if(Array.isArray(accessArray) && accessArray.length >0){
                //                 accessArray.forEach(function(accessRecord){
                //                     if(accessRecord.userIdentifier === usrcreatedAccountId && accessRecord.roleIdentifier === roleId && accessRecord.appIdentifier === appID){
                //                         logger.debug("removing role for created account " + usrcreatedAccountId)
                //                         removeRole(accessRecord._id, usrcreatedAccountId);
                //                     }
                //                 });
                //             }
                //         }else if(response && response.resultCount == 1){
                //             if(Array.isArray(accessArray) && accessArray.length >0){
                //                 accessArray.forEach(function(accessRecord){
                //                     if(accessRecord.userIdentifier === usrcreatedAccountId){
                //                         logger.debug("removing role for created account " + usrcreatedAccountId)
                //                         removeRole(accessRecord._id, usrcreatedAccountId);
                //                         terminateUserInPing(usrcreatedAccountId, createdMailArray[count]);
                //                         logger.debug("terminateUserInPing for created account " + usrcreatedAccountId)
                //                         terminateUserInKog(nodeState.get("terminatedKogId"));
                //                         logger.debug("terminateUserInKog role for created account " + usrcreatedAccountId)
                //                         count = count + 1;
                //                     }
                //                 });
                //             }
                //         }
                //     });
                // }
                
                if(Array.isArray(pingAccounts) && pingAccounts.length >0){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Processing Ping Accounts");
                    var count = 0;
                    pingAccounts.forEach(function(pingAccountId){
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Querying Access Request for ID: " + pingAccountId);
                        var response = openidm.query("managed/alpha_kyid_access", { "_queryFilter": '/userIdentifier eq "' + pingAccountId + '"' + ' and recordState eq "0"' }, ["*"]);
                        logger.debug("response of alpha_kyid_access query is :::: "+ JSON.stringify(response))
                        logger.debug("Array.isArray(accessArray) is :::: "+ Array.isArray(accessArray))
                        logger.debug("accessArray is :::: "+ JSON.stringify(accessArray))
                        logger.debug("pingAccountId is :::: "+ pingAccountId)
                        
                        if(response && response.resultCount >1){
                            logger.debug("more than one count ")
                            if(Array.isArray(accessArray) && accessArray.length >0){
                                accessArray.forEach(function(accessRecord){
                                    logger.debug("accessRecord.userIdentifier is :::: "+ accessRecord.userIdentifier)
                                    if(accessRecord.userIdentifier == pingAccountId){
                                        logger.debug("removing role for ping account " + pingAccountId)
                                        removeRole(accessRecord._id);
                                    }
                                });
                            }
                        }else if(response && response.resultCount == 1){
                            logger.debug("exact 1 count ")
                           // if(Array.isArray(accessArray) && (accessArray.length == 0 ){
                            if(Array.isArray(accessArray) && accessArray.length == 1){
                                accessArray.forEach(function(accessRecord){
                                    logger.debug("accessRecord.userIdentifier is :::: "+ accessRecord.userIdentifier)
                                    if(accessRecord.userIdentifier == pingAccountId){
                                        logger.debug("removing role for ping account " + pingAccountId)
                                        removeRole(accessRecord._id, pingAccountId);
                                        terminateUserInPing(pingAccountId, pingMailId[count]);
                                        logger.debug("terminateUserInPing for ping account " + pingAccountId)
                                        terminateUserInKog(nodeState.get("terminatedKogId"));
                                        logger.debug("terminateUserInKog role for ping account " + pingAccountId)
                                        count = count + 1;
                                    }
                                });
                            }
                        }
                    });
                }

                logger.debug("roleCheckExists is :: " + nodeState.get("roleCheckExists") )
                var roleCheckExists = JSON.parse(nodeState.get("roleCheckExists"))
                if(roleCheckExists && roleCheckExists.length>0){
                    roleCheckExists.forEach(function(accounts){
                        if(accounts.roleExists == true && accounts.roleCount>0){
                            removeDeprovisioning(accounts.KOGID);
                        }
                    })

                    roleCheckExists.forEach(function(accounts){
                        if(accounts.roleExists == true && accounts.roleCount == 1){
                            terminateUserInKog(accounts.KOGID);
                        }
                    })
                }
                
                logger.debug("in line 268")
                var patchUserIdentityResponse = patchUserIdentity(nodeState.get("EmailAddress"));
                if(patchUserIdentityResponse){
                    nodeState.putShared("prereqStatus","COMPLETED")
                    reason = "AppEnroll - The user personal information provided to LexisNexis is verified ";
                    title = "User identity verification is successful."
                    //auditLog("KYID-LN-007", "AppEnroll - Identity Proofing is successful", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    //auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, false, transactionid, flowName, mail, userInfoJSON, lexisnexisResponse, reason, title);
                    reason = "The user personal information provided to LexisNexis is verified";
                    title = "User identity verification is successful."
                    auditLog("KYID-LN-007", `User identity verification successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                    auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`, true, transactionid, flowName, mail, userInfoJSON, lexisnexisResponse, reason, title);
                    action.goTo("patchPreReq")
                }
            }else{
                var loggedInUserId = nodeState.get("_id") || null;
                var loggedinMail = nodeState.get("EmailAddress") || null;
                var userPrereqId = nodeState.get("userPrereqId") || null;
                var enrollmentRequestID = nodeState.get("enrollmentRequestID") || null;
                logger.debug("enrollmentRequestID is ::: "+ enrollmentRequestID)
                logger.debug("loggedInUserId is ::: "+ loggedInUserId)
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User selected to continue with the not logged in account ");
                var response = openidm.query("managed/alpha_kyid_access", { "_queryFilter": '/userIdentifier eq "' + loggedInUserId + '"' + ' and recordState eq "0"' }, ["*"]);
                var counterr = 0;
                        if(response && response.resultCount >0){
                            response.result.forEach(function(accessRecord){
                                if(accessRecord.userIdentifier === loggedInUserId && accessRecord.roleIdentifier === roleId && accessRecord.appIdentifier === appID){
                                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Access already exists for the selected account ID: " + loggedinMail);
                                    removeRole(accessRecord._id, loggedInUserId);                      
                                    }
                                logger.debug("counterr is ::"+counterr)
                                counterr = counterr + 1;    
                            });
                     logger.debug("counterr final is ::"+counterr)
                    if(counterr > 1){
                        logger.debug("cancelEnrollmentRequest for ping account " + loggedinMail)
                        cancelEnrollmentRequest(enrollmentRequestID, loggedInUserId);
                        action.goTo("logout");
                    }else if(counterr == 1){
                        logger.debug("cancelEnrollmentRequest for ping account " + loggedinMail)
                        cancelEnrollmentRequest(enrollmentRequestID, loggedInUserId);
                        logger.debug("terminateUserInPing :::: " + loggedinMail)
                        terminateUserInPing(loggedInUserId, loggedinMail);
                        logger.debug("terminateUserInKog for ping account :::" + loggedinMail)
                        terminateUserInKog(nodeState.get("terminatedKogId"));
                        
                        //auditLog("RIDP025", "KYID-LN-003 - Access revoked and terminated logged in account");
                        action.goTo("logout");
                    }
                }else{  
                    logger.error("no record in alpha_kyid_access with record state 0")
                    logger.debug("cancelEnrollmentRequest for ping account " + loggedinMail)
                    cancelEnrollmentRequest(enrollmentRequestID, loggedInUserId);
                    logger.debug("terminateUserInPing :::: " + loggedinMail)
                    terminateUserInPing(loggedInUserId, loggedinMail);
                    logger.debug("terminateUserInKog for ping account :::" + loggedinMail)
                    terminateUserInKog(nodeState.get("terminatedKogId"));
                    action.goTo("logout");
                }
            }
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Handle User Response Function: " + error);
        action.goTo("error");
    }
}

function getMailAddresses(roleCheckArray, jitArray) {
    logger.debug("roleCheckArray is :: " + JSON.stringify(roleCheckArray))
    logger.debug("jitArray is :: " + JSON.stringify(jitArray))
  var roleMap = {};
    if(roleCheckArray && roleCheckArray.length>0){
      for (var i = 0; i < roleCheckArray.length; i++) {
        roleMap[String(roleCheckArray[i])] = true;
      }
    }

  if (typeof jitArray === "string") {
    jitArray = JSON.parse(jitArray);
  }

  var mailAddress = [];
    if(jitArray && jitArray.length>0){
      for (var j = 0; j < jitArray.length; j++) {
        var user = jitArray[j];
        if (!user) continue;
    
        var kogid = user.KOGID;
        var email = user.EmailAddress;
    
        if (kogid != null && roleMap[String(kogid)] === true && email) {
          mailAddress.push(String(email));
        }
      }
    }

  return mailAddress;
}

function mergeArrays(getMailAddressesArray, accessMailArray) {
  if (!getMailAddressesArray) getMailAddressesArray = [];
  if (!accessMailArray) accessMailArray = [];

  // If either is empty, merged result is just the other one
  if (getMailAddressesArray.length === 0) return accessMailArray;
  if (accessMailArray.length === 0) return getMailAddressesArray;

  // Otherwise return merged (new array; originals unchanged)
  var merged = [];
  for (var i = 0; i < accessMailArray.length; i++) merged.push(accessMailArray[i]);
  for (var j = 0; j < getMailAddressesArray.length; j++) merged.push(getMailAddressesArray[j]);
  return merged;
}

function checkRoleInKOG(userKOGID) {
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
        var roleCount = 0;
            var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
            var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
            nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));
            
            //If the Access token is 200
            if (kogAPITokenResponse.status === 200) {
                var bearerToken = kogAPITokenResponse.response;

                var payload = {
                    KOGID: userKOGID
                }
                nodeLogger.debug("payload in ReadUserAuthz " + JSON.stringify(payload));
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

                nodeLogger.debug("KOG API Status: " + res.status);
                action.withHeader(`Response code: ${res.status}`);


                if (res.status === 200) {
                    var data = JSON.parse(res.text());
                    nodeLogger.debug("KOG API Response: " + JSON.stringify(data));

                    if (data.ResponseStatus === 0 && data.UserAuthorizations) {
                        data.UserAuthorizations.forEach(function(auth) {
                            nodeLogger.debug("appName in nodeState is :: => "+ nodeState.get("appName"))
                            nodeLogger.debug("roleName in nodeState is :: "+ nodeState.get("roleName"))
                            //if (auth.ApplicationName && auth.RoleName && applicationList.includes(nodeState.get("appName")) && auth.RoleName.localeCompare(roleList) == 0) {  
                            if ((auth.ApplicationName && auth.RoleName) && (auth.ApplicationName.toLowerCase() === nodeState.get("appName").toLowerCase())  && (auth.RoleName.toLowerCase() ===  nodeState.get("roleName").toLowerCase())) {  
                                foundRole =  true;
                            }
                        })
                        
                    if(data.UserAuthorizations.length == 1){
                       roleCount  = 1
                    }else if(data.UserAuthorizations.length > 1){
                       roleCount = data.UserAuthorizations.length;
                    }
                    return {"roleExists":foundRole,"roleCount": roleCount, "KOGID": userKOGID};
                        
                    }else{
                        return {"roleExists":false,"roleCount": 0, "KOGID":userKOGID};
                    }  
                }
            }
        }catch (e) {
            nodeLogger.error("Exception in KYID KOG API call: " + e.message);
        }
}

function removeRole(accessroleid,_id){
    try {
    var userId = _id
    var targetRoleData = [accessroleid]

    logger.debug("handleRemoveRoles - Retrieved userId: " + userId);
    logger.debug("handleRemoveRoles - Retrieved targetRoleData from nodeState: " + JSON.stringify(targetRoleData));
    logger.debug("handleRemoveRoles - typeof targetRoleData: " + typeof targetRoleData);

    //targetRoleData array
    if (!Array.isArray(targetRoleData)) {
        //  stringified array or object
        if (typeof targetRoleData === "string") {
            try {
                targetRoleData = JSON.parse(targetRoleData);
            } catch (e) {
                logger.debug("handleRemoveRoles - Failed to parse targetRoleData JSON: " + e);

            }
        } else if (typeof targetRoleData === "object") {
            // Convert object/array-like to array
            targetRoleData = Array.from(targetRoleData);
        }
    }

    if (!Array.isArray(targetRoleData) || targetRoleData.length === 0) {
        logger.debug("handleRemoveRoles - targetRoleData is empty after conversion. Exiting.");

    }

    logger.debug("handleRemoveRoles - Final targetRoleData array: " + JSON.stringify(targetRoleData));

        // Build query filter
    var roleIdsString = JSON.stringify(targetRoleData); 
    var queryFilter = `_id in '${roleIdsString}' AND (recordState eq "0" OR recordState eq "ACTIVE")`;

    var requestBody = {
        payload: {
            queryFilter: queryFilter,
            id: userId
        },
        action: 3
    };

    logger.debug("handleRemoveRoles - Request body for openidm.create: " + JSON.stringify(requestBody));

    var response = openidm.create("endpoint/access_v2B", null, requestBody);
    logger.debug("handleRemoveRoles - Roles removed successfully for userId: " + userId + " :: Response: " + JSON.stringify(response));
    nodeState.putShared("roleremovalstatus","Role Removed Successfully")
         return true
    // action.goTo("true")

    } catch (e) {
        logger.error("handleRemoveRoles - Error removing roles for userId " + userId + ": " + e);
        nodeState.putShared("roleremovalstatus","Role Removed Failed")
        return true
        // action.goTo("true")
    }
}


function formatDateEST() {
    var now = new Date();
    var year = now.getUTCFullYear();
 
    // Calculate DST boundaries
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7;
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0));
 
    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7;
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0));
 
    var isDST = (now >= dstStart && now < dstEnd);
    var offset = isDST ? -4 : -5;
    var eastern = new Date(now.getTime() + offset * 60 * 60 * 1000);
 
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
 
    var month = eastern.getUTCMonth() + 1;
    var day = eastern.getUTCDate();
    var hours = eastern.getUTCHours();
    var minutes = pad(eastern.getUTCMinutes());
    var seconds = pad(eastern.getUTCSeconds());
 
    // Format for display: M/D/YYYY  H:MM:SS EST
    return month + "/" + day + "/" + eastern.getUTCFullYear() + "  " + hours + ":" + minutes + ":" + seconds + " EST";
}

function terminateUserInPing(userId, mail){
    try{
        var loggedInUserId = nodeState.get("_id") || null
        var patchArray = [];
        var jsonObj = {}
        var currentTimeinEpoch = Date.now();
        var currentDate = new Date().toISOString();
        var emailAppend = Math.floor(Math.random() * 999) + 100;
        var emailOld = null 
        var emailNew = null
        var terminationDateFull = formatDateEST();
    
        if(mail!=null && mail){
            var emailOld = nodeState.get("mail")
            logger.debug("Email before update is => "+emailOld)
            var emailNew = emailOld.split("@")[0] + "@" + emailAppend + emailOld.split("@")[1]
            nodeState.putShared("newEmailKOG",emailNew)
            logger.debug("Email after update is => "+emailNew)
        }
    
    
        //Terminate in Ping
        jsonObj = {
                "operation": "replace",
                "field": "accountStatus",
                "value": "Terminated"
            }
            patchArray.push(jsonObj)
        
            jsonObj = {
                "operation": "replace",
                "field": "/custom_updatedDateEpoch",
                "value": currentTimeEpoch
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            }     
        
            jsonObj = {
                "operation": "replace",
                "field": "/custom_updatedByID",
                "value": loggedInUserId
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            }     
        
            jsonObj = {
                "operation": "replace",
                "field": "/custom_updatedDateISO",
                "value": dateTime
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            }  
        
            jsonObj = {
                "operation": "replace",
                "field": "/custom_updatedBy",
                "value": loggedInUserId
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            }  
        
            jsonObj = {
                "operation": "replace",
                "field": "/mail",
                "value": emailNew
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            }  

            jsonObj =  {
                operation: "replace",
                field: "/custom_terminationDate",
                value: terminationDateFull
            }
            if(jsonObj.value!=null){
               patchArray.push(jsonObj) 
            } 
        
            jsonObj = {
                "operation": "add",
                "field": "/custom_audit/",
                "value": {
                    "action": "Terminate",
                    "reason": "Client requested account termination on Self Service Portal",
                    "comment": "",
                    "requesterUserId": loggedInUserId
                }
            }
          if(jsonObj.value.requesterUserId!=null){
               patchArray.push(jsonObj) 
            }  
          logger.debug("Patch Array value - "+JSON.stringify(patchArray))
    
        var result = openidm.patch("managed/alpha_user/" + userId, null, patchArray);
        logger.debug("User Terminated in Ping with ID => "+userId+" :: Response => "+JSON.stringify(result))
        if(result && result.userName){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User Terminated in Ping with ID: " + userId);
            nodeState.putShared("terminatedKogId",result.userName)
        }
        return true
    }catch(error){
        logger.error("Error in catch of terminateUserInPing " + error);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" +error );
        return true;
    }
}

function removeDeprovisioning(kogID) {
    // Declare Global Variables
    var missingInputs = [];
        nodeLogger.debug(nodeConfig.timestamp +"::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +"::" +nodeConfig.scriptName +":: script started ");
    try {
        //RequestorKOGID
        // if (nodeState.get("jitKOGIDArray") != null) {
        //     kogID = JSON.stringify(nodeState.get("jitKOGIDArray"));
        // } else {
        //     missingInputs.push("jitKOGIDArray");
        // }

        transactionID = generateGUID();

        if (systemEnv.getProperty("esv.kyid.role.removerolesfromuser") && systemEnv.getProperty("esv.kyid.role.removerolesfromuser") != null) {
            var getadditionalflagsinfoAPIURL = systemEnv.getProperty("esv.kyid.role.removerolesfromuser");
        } else {
            missingInputs.push("getadditionalflagsinfoAPIURL");
        }

        // SIH Cert for API
        var sihcertforapi;
        if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
            sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
        } else {
            missingInputs.push("sihcertforapi");
        }

        // KOG API Token
        var kogTokenApi;
        if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
            kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
        } else {
            missingInputs.push("kogTokenApi");
        }

        var scope = "kogkyidapi.removerolesfromuser"
    

        if (missingInputs.length > 0) {
            logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" +  missingInputs);
            action.goTo(nodeOutcome.ERROR);
        } else {
            var roleNames = [];
            // var roles = nodeState.get("rolesToProvision");
            if(nodeState.get("roleName")){
                var roleName = nodeState.get("roleName");
            }

            if(nodeState.get("appName")){
                var appName = nodeState.get("appName");
            }

            var userAuths = [];
            if(roleName && appName){
                    userAuths.push({
                        ApplicationName: appName,
                        RoleName: roleName
                    });                
            }

            //kogID.forEach(function(accounts){
                var payload = {
                    KOGID: kogID,
                    RequestorKOGID: kogID,
                    TransactionID: transactionID,
                    UserAuths: userAuths,
                };
    
                logger.debug("Payload prepared: " + JSON.stringify(payload));
    
                var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
                logger.debug("ran the access token lib script for email");
                var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(
                    kogTokenApi,
                    scope
                );
                nodeLogger.debug("kogAPITokenResponse" +JSON.stringify(kogAPITokenResponse) +"for email");
    
                if (kogAPITokenResponse.status === 200) {
                    logger.debug("access token status is 200" + kogAPITokenResponse + "for email");
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
    
                    var res = httpClient.send(getadditionalflagsinfoAPIURL, requestOptions).get();
                    logger.debug("response status of addRole from KOG AD " + JSON.stringify(res));
                    logger.debug("response status of addRole from KOG AD " + res.status);
                    logger.debug( "response of addRole from KOG AD " + JSON.stringify(JSON.parse(res.text())));
                    action.withHeader(`Response code: ${res.status}`);
    
                    if (res.status === 200) {
                        var data = JSON.parse(res.text());
                        if (data.ResponseStatus === 0) {
                            logger.debug("data is :: => " + JSON.stringify(data));
                            nodeState.putShared("userData", data);
                            nodeLogger.debug(nodeConfig.timestamp +"::" +nodeConfig.node +"::" +nodeConfig.nodeName +"::" +nodeConfig.script +"::" +nodeConfig.scriptName +":: Roles added successfully");
                            // Return success object for further processing
                            
                        } else if (data.MessageCode == -117 || data.MessageCode == "-117") {
                            logger.debug("data is :: => " + JSON.stringify(data));
                            nodeState.putShared("userData", data);
                            nodeLogger.debug(nodeConfig.timestamp +"::" +nodeConfig.node +"::" +nodeConfig.nodeName +"::" +nodeConfig.script +"::" +nodeConfig.scriptName +":: Role already exist");
                            // Return success object for further processing
                           
                        } else {
                            // ResponseStatus not 0, error details present
                            var msg = data.MessageResponses && data.MessageResponses.length > 0 ? data.MessageResponses.map( (m) => `[${m.MessageCode}] ${m.MessageDescription}`  ).join(" | ")  : "Unknown error";
                            logger.debug("API returned an error ResponseStatus=" +data.ResponseStatus +" Details: " + msg);
                            nodeState.putShared("apireturnederror", msg);
                            
                        }
                    } else {
                        logger.debug("Non-200 HTTP response: " + res.status);
                        nodeLogger.debug(nodeConfig.timestamp +"::" +nodeConfig.node +"::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status );
                       
                    }
                    action.withHeader(`Response code: ${res.status}`);
                } else {
                    logger.debug("kogAPITokenResponse is not 200 "); 
                    nodeLogger.debug( nodeConfig.timestamp + "::" + nodeConfig.node +"::" +nodeConfig.nodeName +"::" +nodeConfig.script +"::" +nodeConfig.scriptName +":: kogAPITokenResponse is not 200 ::");
                }                
            //})

            return true;
        }
    } catch (error) {
        logger.error("Error in catch is  " + error);nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" +error );
        return false;
    }
}
 
/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getCurrentEasternTimeFormatted() {
    const now = new Date();

    // Get current year
    const year = now.getUTCFullYear();

    // Calculate DST start: Second Sunday in March at 2am local (7am UTC)
    const march = new Date(Date.UTC(year, 2, 1));
    const marchDay = (7 - march.getUTCDay() + 7) % 7 + 7; // 2nd Sunday
    const dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0)); // 7am UTC

    // Calculate DST end: First Sunday in November at 2am local (6am UTC)
    const november = new Date(Date.UTC(year, 10, 1));
    const novDay = (7 - november.getUTCDay()) % 7; // 1st Sunday
    const dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0)); // 6am UTC

    // Determine if now is in DST
    var offset;
    if (now >= dstStart && now < dstEnd) {
        offset = -4; // EDT
    } else {
        offset = -5; // EST
    }

    // Convert UTC to Eastern time
    const easternDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours() + offset,
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
    ));

        easternDate.setUTCSeconds(easternDate.getUTCSeconds() - 50);
    // Format components
    const formatted = [
        easternDate.getUTCFullYear(),
        String(easternDate.getUTCMonth() + 1).padStart(2, '0'),
        String(easternDate.getUTCDate()).padStart(2, '0')
    ].join('-') + ' ' +
    [
        String(easternDate.getUTCHours()).padStart(2, '0'),
        String(easternDate.getUTCMinutes()).padStart(2, '0'),
        String(easternDate.getUTCSeconds()).padStart(2, '0')
    ].join(':') + '.' +
    String(easternDate.getUTCMilliseconds()).padStart(3, '0');

    return formatted;
}

function invokeUsrEmailUpdateKOGAPI(kogID,updateUserPrimaryEmailAPI,sihcertforapi,bearerToken,txID){
    var emailNew = null
    var res = null

    if(kogID==null || updateUserPrimaryEmailAPI==null || sihcertforapi==null || bearerToken==null || txID==null){
        logger.debug("Missing mandatory Params for invokeUsrEmailUpdateKOGAPI()")
        return res
    }
    
    if(nodeState.get("newEmailKOG")!=null && nodeState.get("newEmailKOG")){
        logger.debug("newEmailKOG in KYID.2B1.Journey.UpdateUserStatusSIHAPI => "+nodeState.get("newEmailKOG"))
        emailNew = nodeState.get("newEmailKOG")
    } else {
        return res
    }
    
    var requestOptions = {
        "clientName": sihcertforapi,
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "token": bearerToken,
        "body": {
            "KOGID": kogID,
            "EmailAddress": emailNew,
            "TransactionID": txID,
            "RequestorKOGID": kogID
        }
    };

    logger.debug("requestOptions in invokeUsrEmailUpdateKOGAPI() =>"+JSON.stringify(requestOptions))
     
    if(updateUserPrimaryEmailAPI!=null && requestOptions!=null){
        try{
            res = httpClient.send(updateUserPrimaryEmailAPI, requestOptions).get();
            logger.debug("Result of the updateUserPrimaryEmail API =>" + res.text());
            return JSON.parse(res.text())
        } catch(error){
             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
             return res;
        }
    } else {
        return res;
    }
}

function terminateUserInKog(kogID){
    try {
        // Transaction ID
        var transactionID = generateGUID();
        var updateUserStatusAPIURL = null;
        
        if (systemEnv.getProperty("esv.kyid.usr.updateuserstatus") && systemEnv.getProperty("esv.kyid.usr.updateuserstatus") != null) {
            updateUserStatusAPIURL = systemEnv.getProperty("esv.kyid.usr.updateuserstatus");
        } else {
            missingInputs.push("updateUserStatusAPIURL");
        }

        if (systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail") && systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail") != null) {
            updateUserPrimaryEmailAPI = systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail");
        } else {
            missingInputs.push("updateUserPrimaryEmailAPI");
        }

        var sihcertforapi;
        if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
            sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
        } else {
            missingInputs.push("sihcertforapi");
        }

        var kogTokenApi;
        if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
            kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
        } else {
            missingInputs.push("kogTokenApi");
        }

        var updateUserProfileScope;
        if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") != null) {
            updateUserProfileScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile");
            logger.debug("profile scope" + updateUserProfileScope);
        } else {
            missingInputs.push("updateUserProfileScope");
        }

        var payload = {}
        var userStatusValue = "3";
        var terminationDate = new Date();
        terminationDate = getCurrentEasternTimeFormatted();
        logger.debug("termination Date" +terminationDate);
        var payload = {
            KOGID: kogID,
            TransactionID: transactionID,
            UserStatus: userStatusValue,
            TerminationReason: "Client requested account termination on Self Service Portal",
            TerminationDate: terminationDate,
            RequestorKOGID: kogID
        }

        logger.debug("Payload to terminate user account is :: => "+ JSON.stringify(payload))
        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, updateUserProfileScope);
        logger.debug("kogAPITokenResponse value => "+JSON.stringify(kogAPITokenResponse))
        logger.debug("kogAPITokenResponse: " + JSON.stringify(kogAPITokenResponse) + "for KYID" + kogID);

        if (kogAPITokenResponse.status === 200) {
            logger.debug("access token status is 200" + kogAPITokenResponse + "for KYID" + kogID)
            var bearerToken = kogAPITokenResponse.response;
            var requestOptions = {
                "clientName": sihcertforapi,
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "token": bearerToken,
                "body": payload
            };

            logger.debug("calling the update user status API" + updateUserStatusAPIURL);
            var startTime = new Date();
            var res = httpClient.send(updateUserStatusAPIURL, requestOptions).get();
            logger.debug("result of the updatestatus API" + JSON.stringify(res));
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.debug("KYID.2B1.Journey.UpdateUser status SIH API call duration in seconds : " + durationInSeconds);
            logger.debug("response of user email in KOG AD " + JSON.stringify(JSON.parse(res.text())));
            action.withHeader(`Response code: ${res.status}`);

            if (res.status === 200) {
                var data = JSON.parse(res.text());
                if (data.ResponseStatus === 0 && data.TransactionID) {
                    var fetchedTransactionID = data.TransactionID;
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::user status update in KOG successful::KYID::" + kogID);
                    var kogAPIResponse = invokeUsrEmailUpdateKOGAPI(kogID,updateUserPrimaryEmailAPI,sihcertforapi,bearerToken,fetchedTransactionID);
                    logger.debug("kogAPIResponse after invokeUsrEmailUpdateKOGAPI =>"+JSON.stringify(kogAPIResponse))
                    auditLog("ACM001", "Account Termination Success");
                    if(kogAPIResponse!=null && kogAPIResponse.ResponseStatus==0){
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Terminated user primary email update in KOG successful::KYID::" + kogID);
                        auditLog("ACM003", "Terminated KOG Account Email Update Success");
                    } else {
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Terminated user primary email update in KOG fail::KYID::" + kogID);
                        auditLog("ACM004", "Terminated KOG Account Email Update Failure");
                    }
                    
                } else {
                    // ResponseStatus not 0, error details present
                    var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                        data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                        "Unknown error";
                    logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                    nodeState.putShared("apireturnederror", msg)
                    auditLog("ACM002", "Account Termination Failure");
                }

            }else {
                logger.debug("Non-200 HTTP response: " + res.status);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::KYID::" + kogID);
                auditLog("ACM002", "Account Termination Failure");
            }
        } else {
            logger.debug("kogAPITokenResponse is not 200 ");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: KYID ::" + kogID);
            auditLog("ACM002", "Account Termination Failure");
        }
    
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
        auditLog("ACM002", "Account Termination Failure");
    }
}

function cancelEnrollmentRequest(enrollmentRequestID,userID){
    try{
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Inside cancelEnrollmentRequest function");
        var requestBody = {
        payload: {
            enrollmentRequestId: enrollmentRequestID,
            requestedUserAccountId: userID
        },
        action: 2
    };

    logger.debug("handleRemoveRoles - Request body for openidm.create: " + JSON.stringify(requestBody));

    var response = openidm.create("endpoint/enrollment_v2B", null, requestBody);

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Cancel Enrollment Request Function: " + error.message);
        action.goTo("error");
    }
}

function patchUserIdentity(selectedUser, verifiedLexId) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    try {
        var pingSearchResponse = openidm.query("managed/alpha_user", {_queryFilter: 'mail eq "' + selectedUser + '"'}, ["*","custom_userIdentity/*"]);

        if(pingSearchResponse && pingSearchResponse.result && pingSearchResponse.result.length > 0){
            if(pingSearchResponse.result[0].custom_userIdentity && pingSearchResponse.result[0].custom_userIdentity._id){
                var Id = pingSearchResponse.result[0].custom_userIdentity._id
                nodeState.putShared("patchUserId",Id)
                var proofingMethod = "4";
                logger.debug("_patchUserIdentity id is --> "+Id)
                var jsonArray = []

                if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
                    nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
                    var userAttributes = JSON.parse(nodeState.get("userAttributes"));
                    nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
                    if(Array.isArray(userAttributes) && userAttributes.length > 0){
                        userAttributes.forEach(function(attribute){
                        nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))

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
                                        "value": attribute.correctedValue
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_sn",
                                    "value": attribute.status
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_middleName",
                                    "value": attribute.status
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }

                            if(attribute.status){
                                var jsonObj = {
                                    "operation": "replace",
                                    "field": "status_dob",
                                    "value": attribute.status
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
                                    "value": attribute.correctedValue
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
                                    "value": attribute.correctedValue
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        if(attribute.attributeName.toLowerCase()=="stateCode"){
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        if(attribute.attributeName.toLowerCase()=="countyCode"){
                            if(nodeState.get("postalCode")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": nodeState.get("postalCode")
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
                                    "value": attribute.correctedValue
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }


                        if(attribute.attributeName.toLowerCase()=="zip"){
                            if(nodeState.get("zip")){
                            var jsonObj = {
                                "operation": "replace",
                                "field": "zip",
                                "value": nodeState.get("zip")
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
                                    "value": attribute.correctedValue
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
                                    "value": attribute.correctedValue
                                    }
                                    jsonArray.push(jsonObj)
                            }
                        }

                        });
                    }
                }

                //KOGID
                if(nodeState.get("KOGID") ){
                var jsonObj = {
                    "operation": "replace",
                    "field": "KOGID",
                    "value": nodeState.get("KOGID")
                    }
                    jsonArray.push(jsonObj)
                }

                //Proofing Method
                var jsonObj = {
                    "operation": "replace",
                    "field": "proofingMethod",
                    "value": proofingMethod
                    }
                    jsonArray.push(jsonObj) 
                }
                


                //Suffix
                if(nodeState.get("custom_suffix")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "suffix",
                    "value": nodeState.get("custom_suffix")
                    }
                    jsonArray.push(jsonObj)
                }else{
                    var jsonObj = {
                    "operation": "replace",
                    "field": "suffix",
                    "value": ""
                    }
                    jsonArray.push(jsonObj)
                }
                


                //Gender
                if(nodeState.get("custom_gender")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "gender",
                    "value": nodeState.get("custom_gender")
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
                    

      

                //County Code
                if(nodeState.get("custom_county")){
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
                
                //Country Code
 

                //County Code
                if(nodeState.get("custom_title")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "title",
                    "value": nodeState.get("custom_title")
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
                if(nodeState.get("languagePreference")){
                var jsonObj = {
                    "operation": "replace",
                    "field": "languagePreference",
                    "value": nodeState.get("languagePreference")
                    }
                    jsonArray.push(jsonObj)   
                }

                //uuid
                if(verifiedLexId){
                var jsonObj = {
                    "operation": "replace",
                    "field": "uuid",
                    "value": verifiedLexId
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
