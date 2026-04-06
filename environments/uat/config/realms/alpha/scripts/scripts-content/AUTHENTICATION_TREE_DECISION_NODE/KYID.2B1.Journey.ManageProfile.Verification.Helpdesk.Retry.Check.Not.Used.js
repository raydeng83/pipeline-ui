var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Manage Retry Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ManageProfile.Verification.Helpdesk.Retry.Check",
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
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    var verificationAttempt = Number(nodeState.get("verificationAttempt")) || 0;
    nodeLogger.debug("Current Verification Attempt: " + verificationAttempt);
    var helpDeskInfo = null;
    var outcome = {}
    var ridpFlag1 = systemEnv.getProperty("esv.ridp.manageprofile.version.flag") ? systemEnv.getProperty("esv.ridp.manageprofile.version.flag").toLowerCase() : "v2";
    var ridpFlag2 = systemEnv.getProperty("esv.ridp.user.verification.version.flag") ? systemEnv.getProperty("esv.ridp.user.verification.version.flag").toLowerCase() : "v2";
    try{
        if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "updateprofile" && nodeState.get("Context") === "manageprofile"){
          if(ridpFlag1 && ridpFlag1 === "v2"){
                if(nodeState.get("orig_proofingMethod") && (nodeState.get("orig_proofingMethod") == "4" || nodeState.get("orig_proofingMethod") == "-1" || nodeState.get("orig_proofingMethod") == "2")){
                    if(systemEnv.getProperty("esv.manageprofile.bsp.retry.limit")){
                        var retryLimit = systemEnv.getProperty("esv.manageprofile.bsp.retry.limit")
                        if(verificationAttempt >= retryLimit){
                            diffInDays = diffInDays();
                            if(systemEnv.getProperty("esv.manageprofile.ssp.refresh.limit")){
                                var refreshLimit = systemEnv.getProperty("esv.manageprofile.ssp.refresh.limit")
                                logger.debug("refreshLimit in ESV :: " + refreshLimit)
                                if(Number(diffInDays) < Number(refreshLimit)){
                                    nodeLogger.debug("Max Retry Attempt Reached. Current Attempt: " + verificationAttempt);
                                    callbacksBuilder.textOutputCallback(1, '{"pageHeader":"Retry_Limit_Reached"}');
                                    callbacksBuilder.textOutputCallback(0,"Unable to update personal information")
                                    callbacksBuilder.textOutputCallback(0,"Please contact KYID help desk to update your personal information.");
                                    helpDeskInfo = helpDesk();  
                                    if(helpDeskInfo != null){
                                        outcome["helpDeskContactInfo"] = helpDeskInfo;
                                    }else{
                                        outcome["helpDeskContactInfo"] = "";
                                    }
                                    outcome["Flow"] = "updateprofile";
                                    callbacksBuilder.textOutputCallback(0,JSON.stringify(outcome));
                                }else{
                                    nodeLogger.debug("Retry Attempt Allowed After Date Check. Current Attempt: " + verificationAttempt);
                                    nodeState.putShared("nextDayRetry", "true");
                                    action.goTo("true")
                                }
                            }else{
                                nodeLogger.debug("Retry Refresh Allowed. Current Attempt: " + verificationAttempt);
                                action.goTo("true")
                            }
                        }else{
                            nodeLogger.debug("Retry Attempt Allowed. Current Attempt: " + verificationAttempt);
                            action.goTo("true")
                        }
                    }else{
                        nodeLogger.error("No retry limit set in esv");
                        action.goTo("true")
                    }
                }else{
                    nodeLogger.error("Proofind Method is 1, no KBA needed");
                    action.goTo("true")
                }
            }else{
                nodeLogger.error("going to v1");
                action.goTo("true")
            }
        }else if (nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "forgotpassword" && nodeState.get("Context") === "id_verification"){
            if(ridpFlag2 && ridpFlag2 === "v2"){
                if(systemEnv.getProperty("esv.user.verification.bsp.retry.limit")){
                    var retryLimit = systemEnv.getProperty("esv.user.verification.bsp.retry.limit")
                    if(verificationAttempt >= retryLimit){
                        diffInDays = diffInDays();
                        if(systemEnv.getProperty("esv.user.verification.bsp.refresh.limit")){
                            var refreshLimit = systemEnv.getProperty("esv.user.verification.bsp.refresh.limit")
                            logger.debug("refreshLimit in ESV :: " + refreshLimit)
                            if(Number(diffInDays) < Number(refreshLimit)){
                                nodeLogger.debug("Max Retry Attempt Reached. Current Attempt: " + verificationAttempt);
                                callbacksBuilder.textOutputCallback(1, '{"pageHeader":"Retry_Limit_Reached"}');
                                callbacksBuilder.textOutputCallback(0,"Unable to verify user's identity")
                                callbacksBuilder.textOutputCallback(0,"The following message is for help desk consumption only. Do NOT share the following information with the end user.");
                                callbacksBuilder.textOutputCallback(0,"We are unable to verify user's identity as maximum failed attempts have reached.");
                                //helpDeskInfo = helpDesk();  
                                // if(helpDeskInfo != null){
                                //     outcome["helpDeskContactInfo"] = helpDeskInfo;
                                // }else{
                                //     outcome["helpDeskContactInfo"] = "";
                                // }
                                // outcome["Flow"] = "updateprofile";
                                //callbacksBuilder.textOutputCallback(0,JSON.stringify(outcome));  
                            }else{
                                nodeLogger.debug("Retry Attempt Allowed After Date Check. Current Attempt: " + verificationAttempt);
                                nodeState.putShared("nextDayRetry", "true");
                                action.goTo("true")
                            }
                        }else{
                            nodeLogger.debug("Retry Refresh Allowed. Current Attempt: " + verificationAttempt);
                            action.goTo("true")
                        }
                    }else{
                        nodeLogger.debug("Retry Attempt Allowed. Current Attempt: " + verificationAttempt);
                        action.goTo("true")
                    }
                }else{
                    nodeLogger.error("No retry limit set in esv");
                    action.goTo("true")
                }
            }else{
                nodeLogger.error("going to v1");
                action.goTo("true")
            }
        }else{
            nodeLogger.error("not an update profile journey or user verification");
            action.goTo("true")
        }
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main function " + error);
    }
}

main();


function helpDesk(){
    try{
        var helpDeskName = null;
        var query = null;
        var helpDeskInfo = null;
        if (systemEnv.getProperty("esv.helpdesk.name")) {
            var helpDeskName = systemEnv.getProperty("esv.helpdesk.name");
            var query = openidm.query("managed/alpha_kyid_helpdeskcontact", { "_queryFilter": '/name eq "' + helpDeskName + '"' }, ["*"]);
            if (query.result.length > 0) {
                var helpDeskInfo = query.result[0];
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Help Desk Info::" + JSON.stringify(helpDeskInfo));
                return helpDeskInfo;
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in helpDesk function " + error);
        return null;
    }
}

function diffInDays(){
    var isNextDay = false;
    var lastVerificationDate = null;
    var dateTime = new Date().toISOString();
    try{
        lastVerificationDate = nodeState.get("lastVerificationDate");
        
        // Convert to Date objects
        var date1 = new Date(lastVerificationDate);
        var date2 = new Date(dateTime);

        date1.setHours(0, 0, 0, 0); 
        date2.setHours(0, 0, 0, 0);

        var diffInMs = date2 - date1;

        // Check if today is strictly after the last verification date's day
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        logger.debug("differnce in days in helpdesk manage profile is :: " + diffInDays)

        return diffInDays;
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in checkDate function " + error);
        return false;
    }
}
