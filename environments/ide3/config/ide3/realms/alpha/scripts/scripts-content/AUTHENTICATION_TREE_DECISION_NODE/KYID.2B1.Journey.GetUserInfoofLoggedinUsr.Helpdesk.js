var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "GetUserID",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetUserIDfromKOGID",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUND: "User Found",
    NOT_FOUND: "User Not Found",
    ERROR: "Error"
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
    }
};

function queryUserByKOGID(loggedinusrKOGID) {
    try {
        logger.debug("KOGID in Get User Script" + loggedinusrKOGID);
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + loggedinusrKOGID + '"'
        }, ["_id", "userName", "mail", "frIndexedString2", "frIndexedString1", "custom_selfEnrollMFA"]);
        logger.debug("userQueryResult" + userQueryResult);
        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            logger.debug("Inside" + userQueryResult.result[0]);
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
        return null;
    }
}


function getMFAObject(usrKOGID) {
    try {
        var mfaValue = null;
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
        });

        if (mfaMethodResponses.result.length > 0) {
            for (var i = 0; i < mfaMethodResponses.result.length; i++) {
                var mfaMethod = mfaMethodResponses.result[i].MFAMethod;
                if (mfaMethod === "SECONDARY_EMAIL") {
                    mfaValue = mfaMethodResponses.result[i].MFAValue;
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " SECONDARY_EMAIL: " + mfaValue + " " + KOGID);

                }
            }
        }

        return mfaValue;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

// Main execution
try {
    var loggedinusrKOGID = nodeState.get("loggedinusrKOGID");
  
    if (loggedinusrKOGID) {
        var user = queryUserByKOGID(loggedinusrKOGID);
        logger.debug("the KOGID in KYID.2B1.Journey.GetUserIDfromKOGID"+ loggedinusrKOGID)
        var alternateEmail = getMFAObject(loggedinusrKOGID);
        nodeState.putShared("alternateEmail",alternateEmail);
         
        if (user && user._id) {
            nodeState.putShared("_id", user._id);
            nodeState.putShared("requesterUserId", user._id);
            //nodeState.putShared("userMail",user.mail);
           // nodeState.putShared("mail",user.mail);
            nodeState.putShared("searchAttribute","mail");
            if (user.frIndexedString1){
                nodeState.putShared("UPN",user.frIndexedString1)
            }
            
           if (user.frIndexedString2 && user.frIndexedString2.indexOf("@") !== -1) {
                var Logon = user.frIndexedString2;
                var domain = Logon.split("@");
                if (domain.length > 1) {
                    var domainParts = domain[1].split(".");
                    if (domainParts.length > 0) {
                        var prefix = domainParts[0];
                        nodeState.putShared("domain", domain[1]);
                    }
                }
            }

            // if(user.custom_selfEnrollMFA){
            //     nodeState.putShared("selfEnrollMFA", user.custom_selfEnrollMFA);
            // }

            if (typeof user.custom_selfEnrollMFA !== "undefined") {
                logger.debug("the selfEnrollMFA from nodeState: "+user.custom_selfEnrollMFA)
                nodeState.putShared("selfEnrollMFA", user.custom_selfEnrollMFA);
            }
            
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Session valid for user " +user.mail);
            action.goTo(NodeOutcome.FOUND);
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            action.goTo(NodeOutcome.NOT_FOUND);
        }
    } else {
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}