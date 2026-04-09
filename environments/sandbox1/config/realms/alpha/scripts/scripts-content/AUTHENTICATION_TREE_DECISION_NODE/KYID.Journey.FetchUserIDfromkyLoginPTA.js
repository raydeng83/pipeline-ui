var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "GetUserIDfromkyLoginPTA",
    script: "Script",
    scriptName: "KYID.Journey.FetchUserIDfromkyLoginPTA",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ERROR: "false"
};

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

var email = null;
if(nodeState.get("mail")){
    email=nodeState.get("mail");
} else {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Email not found in nodeState");
    action.goTo(NodeOutcome.ERROR);
}

// Check if email is null, undefined, or an empty string
if (email === null || email === undefined) {
      nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email is null, undefined, or empty.");
    action.goTo(NodeOutcome.ERROR);
}

nodeLogger.error("Printing the email for the end user: " + email);

try {
    // Query OpenIDM to find user by email
    var userQueryResult = openidm.query("managed/alpha_user", {
        "_queryFilter": 'mail eq "' + email + '"'
    }, ["_id", "userName", "mail"]);

    // Check if query result is valid and contains user data
    if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
        // User exists, store user details in shared state
        var user = userQueryResult.result[0];
        nodeState.putShared("_id", user._id);
        nodeState.putShared("username", user.userName);

        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID from query result: " + user._id);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Shared state - username: " + nodeState.get("username"));

        // Proceed to the next action
        action.goTo(NodeOutcome.SUCCESS);
    } else {
        // No user found
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found with email: " + email);
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user or setting state: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}