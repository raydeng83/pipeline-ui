var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Manage Retry Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ManageProfile.Retry.Check",
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
    try{

    response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
    logger.debug("response from query :: " + JSON.stringify(response))
    var ridpFlag = response.result[0].ridp_manage_profile_version ? response.result[0].ridp_manage_profile_version : "v2";
    logger.error("KYID.2B1.Journey.ManageProfile.RIDP.Version.Flag response from query :: " + ridpFlag)
        
    if(ridpFlag && ridpFlag === "v2"){
         if(nodeState.get("orig_proofingMethod") && (nodeState.get("orig_proofingMethod") == "4" || nodeState.get("orig_proofingMethod") == "-1" || nodeState.get("orig_proofingMethod") == "2")){
                    if(response.result[0].ridp_manage_profile_retry_limit){
                        var retryLimit = response.result[0].ridp_manage_profile_retry_limit;
                        if(verificationAttempt >= retryLimit){
                            diffInDays = diffInDays();
                            if(response.result[0].ridp_manage_profile_refresh_limit){
                                var refreshLimit = response.result[0].ridp_manage_profile_refresh_limit
                                logger.debug("refreshLimit in KYID.2B1.Journey.ManageProfile.Retry.Check :: " + refreshLimit)
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
        logger.debug("isNextDay in KYID.2B1.Journey.ManageProfile.Retry.Check :: " + isNextDay)

        // Convert to Date objects
        var date1 = new Date(lastVerificationDate);
        var date2 = new Date(dateTime);
        date1.setHours(0, 0, 0, 0); 
        date2.setHours(0, 0, 0, 0);
        var diffInMs = date2 - date1;

        // Check if today is strictly after the last verification date's day
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        logger.debug("diffInDays in KYID.2B1.Journey.ManageProfile.Retry.Check :: " + diffInDays)

        return diffInDays;
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in checkDate function " + error);
        return false;
    }
}


// function checkdate(){
//     var isNextDay = false;
//     var lastVerificationDate = null;
//     var dateTime = new Date().toISOString();
//     try{
//         lastVerificationDate = nodeState.get("lastVerificationDate");
//         logger.debug("isNextDay in KYID.2B1.Journey.ManageProfile.Retry.Check :: " + isNextDay)

//         // Convert to Date objects
//         var lastDate = new Date(lastVerificationDate);
//         var today = new Date(dateTime);

//         // Check if today is strictly after the last verification date's day
//         var isNextDay = 
//             today.getUTCFullYear() > lastDate.getUTCFullYear() ||
//             (today.getUTCMonth() > lastDate.getUTCMonth() && today.getUTCFullYear() === lastDate.getUTCFullYear()) ||
//             (today.getUTCDate() > lastDate.getUTCDate() && today.getUTCMonth() === lastDate.getUTCMonth() && today.getUTCFullYear() === lastDate.getUTCFullYear());

//         logger.debug("isNextDay in KYID.2B1.Journey.ManageProfile.Retry.Check :: " + isNextDay)

//         return isNextDay;
//     }catch (error) {
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in checkDate function " + error);
//         return false;
//     }
// }