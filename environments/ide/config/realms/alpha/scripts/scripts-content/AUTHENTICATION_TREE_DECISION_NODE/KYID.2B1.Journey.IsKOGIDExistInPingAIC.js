/**
 * Script: KYID.Journey.IsKOGIDExistInPingAIC
 * Description: This script is used to check if user profile with KOGID exist in Ping AIC.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Is KOGID Exist in Ping AIC",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IsKOGIDExistInPingAIC",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKOGID: "Missing KOGID for KOG User",
    missingusrUPN: "Missing UPN for KOG User",
    missingKOGEmailID: "Missing KOG Email ID for KOG User",
    inactiveUserprefix: systemEnv.getProperty("esv.inactive.user.email.prefix"),
    usrExistIDM: "User profile exist in Forgerock AIC",
    usrNotExistIDM: "Either user profile doesn't exist or multiple user profile exist in Forgerock AIC",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    EXIST: "Yes",
    NOT_EXIST: "No"
};

// Declare Global Variables
var missingInputs = [];
var usrKOGID = "";

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

function removeUser(userID) {
    try {
        if (userID) {
            logger.debug("Inside Remove User Function")
            var response = openidm.delete('managed/alpha_user/' + userID, null)
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Duplicate Email ID Senario :: USER Removed from AIC");
            return true
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }


}

function InactivateUser(userID, userEmail) {
    try {
        if (userID) {
            logger.debug("Inside Inactivate User Function")
            var updateMail = openidm.patch("managed/alpha_user/" + userID, null, [{ "operation": "add", "field": "mail", "value": userEmail + nodeConfig.inactiveUserprefix }]);
            var updateUPN = openidm.patch("managed/alpha_user/" + userID, null, [{ "operation": "add", "field": "frIndexedString1", "value": usrUPN + nodeConfig.inactiveUserprefix }]);
            var InactivateUser = openidm.patch("managed/alpha_user/" + userID, null, [{ "operation": "add", "field": "accountStatus", "value": "inactive" }]);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Duplicate Email ID Senario :: USER INACTIVATED in AIC");
            return true
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);

    }


}

if (nodeState.get("KOGID")) {
    usrKOGID = nodeState.get("KOGID");
} else {
    missingInputs.push(nodeConfig.missingKOGID);
}

if (nodeState.get("EmailAddress")) {
    usrKOGEmailID = nodeState.get("EmailAddress")
}
else {
    missingInputs.push(nodeConfig.missingusrKOGEmailID);
}
if (nodeState.get("UPN")) {
    usrUPN = nodeState.get("UPN")
}
else {
    missingInputs.push(nodeConfig.missingusrUPN);
}



// Checks if mandatory input params are missing
if (missingInputs.length > 0) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);

}
else {
    try {
        var response = openidm.query("managed/alpha_user", { "_queryFilter": "/userName eq \"" + usrKOGID + "\"" }, ["userName", "_id", "mail"]);
        logger.debug("Reposne of User in AIC with Kog ID " + response.result.length)
        if (response.result.length == 1) {
            var idmUser = response.result[0];
            nodeState.putShared("_id", idmUser._id);
            var emailResponse = openidm.query("managed/alpha_user", { "_queryFilter": 'mail eq "' + usrKOGEmailID + '" and accountStatus eq "active"' }, ["userName", "_id", "mail"]);
            if (emailResponse.result.length >= 1) {
                for (var i=0 ; i < emailResponse.result.length; i++){
                var emailidmUser = emailResponse.result[i];
                var emailuserID = emailidmUser._id
                var emailuserEmail = emailidmUser.mail
                var emailUserKogID = emailidmUser.userName
                if(emailUserKogID !== usrKOGID){
                    InactivateUser(emailuserID, emailuserEmail)
                }

                }
            }            
            //nodeState.putShared("username",idmUser.mail);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.usrExistIDM + "::" + JSON.stringify(response.result));
            action.goTo(nodeOutcome.EXIST);
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Not Found in AIC with KOG ID");
            var response = openidm.query("managed/alpha_user", { "_queryFilter": 'mail eq "' + usrKOGEmailID + '" and accountStatus eq "active"' }, ["userName", "_id", "mail"]);
            if (response.result.length >= 1) {
                for(var i=0 ; i < response.result.length ; i++){
                var idmUser = response.result[i];
                var userID = idmUser._id
                var userEmail = idmUser.mail
                logger.debug("User ID from AIC is " + userID + userEmail)
                InactivateUser(userID, userEmail) 
                }
                action.goTo(nodeOutcome.NOT_EXIST);
            }
            else {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.usrNotExistIDM);
                action.goTo(nodeOutcome.NOT_EXIST);
            }
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
}

