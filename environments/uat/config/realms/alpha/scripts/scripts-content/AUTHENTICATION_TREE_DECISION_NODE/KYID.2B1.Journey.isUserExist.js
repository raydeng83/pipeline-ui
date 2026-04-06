var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "MFAforOthers_isUserExist",
    script: "Script",
    scriptName: "KYID.2B1.Journey.isUserExist",
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

// Function to get the email ID from request parameters
function getEmailId() {
    try {
        var emailId = requestParameters.get("email");
        logger.debug("emailId is" +emailId)
        if (!emailId || !emailId[0]) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email ID not provided.");
        }
        return emailId[0]; // Return the first item if it's an array
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving email ID: " + error.message);
    }
}

// Function to decode and clean the email ID
function decodeAndCleanEmail(emailId) {
    try {
        var decodedEmail = decodeURIComponent(emailId);
        var emailParts = decodedEmail.split('"');
        return emailParts.length > 1 ? emailParts[1] : emailParts[0];
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error decoding email ID: " + error.message);
        return null;
    }
}

// Function to query user data based on email
function queryUserByEmail(email) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + email + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "No user found for email: " + email);
            return null;
        }
    } catch (error) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error querying user by email: " + error.message);
        return null;
    }
}

// Main execution
try {
    var emailId = getEmailId();
    if (emailId) {
        var email = decodeAndCleanEmail(emailId);
        if (email) {
            var user = queryUserByEmail(email);
            if (user) {
                if (user._id && user.mail) {
                    nodeState.putShared("mail", email);
                    nodeState.putShared("objectAttributes", {"mail": email}); 
                   nodeState.putShared("_id", user._id);
                   nodeState.putShared("username", user.userName);
                    nodeState.putShared("KOGID", user.userName);
                    action.goTo(NodeOutcome.FOUND);
                } else {
                    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is incomplete: _id or mail is missing.");
                    action.goTo(NodeOutcome.NOT_FOUND);
                }
            } else {
                action.goTo(NodeOutcome.NOT_FOUND);
            }
        } else {
            action.goTo(NodeOutcome.ERROR);
        }
    } else {
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}
