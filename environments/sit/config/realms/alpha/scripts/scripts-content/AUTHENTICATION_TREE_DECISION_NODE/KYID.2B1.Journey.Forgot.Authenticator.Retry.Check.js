var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Retry Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Forgot.Authenticator.Retry.Check",
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
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    var verificationAttempt = Number(nodeState.get("verificationAttempt")) || 0;
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Current Verification Attempt: " + verificationAttempt);
    var helpDeskInfo = null;
    var outcome = {}
    nodeState.putShared("orig_proofingMethod","4")
    
    try {
        response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.debug("response from query :: " + JSON.stringify(response))
        var ridpFlag = response.result[0].ridp_forgot_mfa_version ? response.result[0].ridp_forgot_mfa_version : "v2";
        logger.error("KYID.2B1.Journey.Forgot.Password.Retry.Check response from query :: " + ridpFlag)

        if (ridpFlag && ridpFlag === "v2") {
            if (nodeState.get("orig_proofingMethod") && (nodeState.get("orig_proofingMethod") == "4" || nodeState.get("orig_proofingMethod") == "-1" || nodeState.get("orig_proofingMethod") == "2")) {
                if (response.result[0].ridp_forgot_mfa_retry_limit) {
                    var retryLimit = Number(response.result[0].ridp_forgot_mfa_retry_limit)
                    if (verificationAttempt >= retryLimit) {
                        diffInDays = diffInDays();
                        if (response.result[0].ridp_forgot_mfa_refresh_limit) {
                            var refreshLimit = Number(response.result[0].ridp_forgot_mfa_refresh_limit)
                            // logger.debug("refreshLimit in KYID.2B1.Journey.Forgot.Password.Retry.Check :: " + refreshLimit)
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Refresh Limit: " + refreshLimit);
                            if (Number(diffInDays) < Number(refreshLimit)) {
                                nodeState.putShared("showRIDP", false)
                                action.goTo("true")
                            } else {
                                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Retry Attempt Allowed After Date Check. Current Attempt: " + verificationAttempt);
                                nodeState.putShared("nextDayRetry", "true");
                                nodeState.putShared("showRIDP", true)
                                action.goTo("true")
                            }
                        } else {
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Retry Refresh Allowed. Current Attempt: " + verificationAttempt);
                            nodeState.putShared("showRIDP", true)
                            action.goTo("true")
                        }
                    } else {
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Retry Attempt Allowed. Current Attempt: " + verificationAttempt);
                        nodeState.putShared("showRIDP", true)
                        action.goTo("true")
                    }
                } else {
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "No retry limit set in esv");
                    nodeState.putShared("showRIDP", true)
                    action.goTo("true")
                }
            } else {
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Proofing Method is 1, no KBA needed");
                nodeState.putShared("showRIDP", true)
                action.goTo("true")
            }
        } else {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "going to v1");
            nodeState.putShared("showRIDP", true)
            action.goTo("true")
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main function " + error);
        nodeState.putShared("showRIDP", true)
        action.goTo("true")
    }
}

main();

function diffInDays() {
    var lastVerificationDate = null;
    var dateTime = new Date().toISOString();
    try {
        lastVerificationDate = nodeState.get("lastVerificationDate");

        // Convert to Date objects
        var date1 = new Date(lastVerificationDate);
        var date2 = new Date(dateTime);
        date1.setHours(0, 0, 0, 0);
        date2.setHours(0, 0, 0, 0);
        var diffInMs = date2 - date1;

        // Check if today is strictly after the last verification date's day
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Difference in Days: " + diffInDays);

        return diffInDays;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in checkDate function " + error);
        return false;
    }
}