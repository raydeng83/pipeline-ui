var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Remove MFA",
    script: "Script",
    scriptName: "KYID.Journey.RemovalofMFAMethodandDevice",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

var user = nodeState.get("_id");

function getUserId() {
    try {
        var userId = nodeState.get("_id");
        if (!userId) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: User ID is null or undefined.");
        }
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from nodeState: " + error.message);
        return null;
    }
}

function fetchUserData(userId) {
    try {
        logger.error("Reading User Data from profile for user " + userId);
        var userData = openidm.read("managed/alpha_user/" + userId);
        logger.error("User Data from profile: " + userData);
        return userData;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

function fetchuserKOGId(userId,userData) {
var userId = getUserId();
var userData = fetchUserData(userId);
var usrKOGID = userData.userName;
    return usrKOGID;
}


var deletedAny = false;
var mfamethod = nodeState.get("methodToRemove");

nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Printing ---- " + mfamethod);

if (!user) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User ID (_id) is null or undefined.");
    action.goTo(NodeOutcome.FAILED);
} else {
    var telephonenumber = nodeState.get("telephonenumber");
   var credId = nodeState.get("credentialId");

    // Function to handle the deactivation of MFA methods
    function deactivateMfaMethod(mfaMethodName) {
       var usrKOGID = fetchuserKOGId();
        logger.error("printing the usrKOGId" +usrKOGID);
        var query = {
            "_queryFilter": '/KOGId eq "' + usrKOGID + '" and /MFAMethod eq "' + mfaMethodName + '"'
        };

        // Modify the query for SMSVOICE to include telephonenumber
        if (mfaMethodName === "SMSVOICE") {
            query._queryFilter += ' and /MFAValue eq "' + telephonenumber + '"';
        }
        if (mfaMethodName === "SYMANTEC") {
            query._queryFilter += ' and /MFAValue eq "' + credId + '"';
        }
        var mfaMethodId = openidm.query("managed/alpha_kyid_mfa_methods", query);
        nodeLogger.error("Printing usrKOGID: " + usrKOGID);
        nodeLogger.error("Printing mfaMethodId: " + JSON.stringify(mfaMethodId));

        if (mfaMethodId.resultCount > 0) {
            for (var i = 0; i < mfaMethodId.result.length; i++) {
                var mfamethodId = mfaMethodId.result[i]._id;
                openidm.patch("managed/alpha_kyid_mfa_methods/" + mfamethodId, null, [
                    { "operation": "add", "field": "MFAStatus", "value": "INACTIVE" }
                ]);
                
                deletedAny = true;
                nodeLogger.error("MFA method with ID " + mfamethodId + " set to INACTIVE.");
            }
            return true; // Indicate that at least one method was deactivated
        } else {
            nodeLogger.error("No matching MFA methods found for user " + user + " with method " + mfaMethodName);
            return false; // Indicate failure to deactivate
        }
    }

     if (mfamethod === "FRPUSH" || mfamethod === "FRTOTP") {
            logger.error("************inside swk or otp*************");
            var requestURL;
            var URL = systemEnv.getProperty("esv.kyid.tenant.fqdn");
            logger.error("Removing PUSH for USer ----"+ user)
            if (mfamethod === "FRPUSH") {
                logger.error("IN Side PUSH REMOVAl..")
                logger.error("Removing PUSH for USer ----"+ user)
                requestURL = URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/push?_action=reset";
            } else if (mfamethod === "FRTOTP") {
                requestURL = URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/oath?_action=reset";
            }
logger.error("*********reading requestURL************" +requestURL)
        
            var bearerToken = nodeState.get("amAccessToken");
          logger.error("reading access token" +bearerToken)
            var options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-API-Version": "resource=1.0"
                },
                token: bearerToken,
                body: {}
            };


            try {
                var apiResponse = httpClient.send(requestURL, options).get();
            } catch (e) {
                nodeLogger.error("Error during API call: " + e);
                action.goTo(NodeOutcome.FAILED);
            }

            var status = apiResponse.status;
            nodeLogger.error("API Response: " + JSON.stringify(apiResponse));

            if (status === 200) {
                nodeLogger.error("Response status is 200 for mfamethod: " + mfamethod);
                deletedAny = true;
            } else {
                nodeLogger.error("Failed API call for mfamethod: " + mfamethod + " with status: " + status);
            }
        }

    // Check and deactivate the specified MFA method
    if (["SMSVOICE", "FRTOTP", "FRPUSH", "SYMANTEC"].includes(mfamethod)) {
        var success = deactivateMfaMethod(mfamethod);
        if (success && deletedAny == true) {
            nodeState.putShared("registerremoveadditionalmfa", null);
            action.goTo(NodeOutcome.SUCCESS);
        } else {
            nodeState.putShared("registerremoveadditionalmfa", null);
            action.goTo(NodeOutcome.FAILED);
        }
    } else {
        nodeLogger.error("Invalid MFA method specified: " + mfamethod);
        nodeState.putShared("registerremoveadditionalmfa", null);
        action.goTo(NodeOutcome.FAILED);
    }
}

