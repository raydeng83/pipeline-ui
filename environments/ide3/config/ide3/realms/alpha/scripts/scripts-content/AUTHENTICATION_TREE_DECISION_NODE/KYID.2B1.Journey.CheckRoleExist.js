var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "CheckRoleExist",
    script: "Script",
    scriptName: "KYID.Journey.CheckRoleExist",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUNDINIVITATION: "Invitation",
    FOUNDAPPCREATED: "AppCreated",
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
function getRoleId() {
    try {
        var roleId = requestParameters.get("roleID");
        if (!roleId || !roleId[0]) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Role ID not provided.");
        }
        return roleId[0];
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving role ID: " + error.message);
    }
}

// Function to decode and clean the email ID
// function decodeAndCleanRoleID(roleId) {
//     try {
//         var decodedRole = decodeURIComponent(roleId);
//         var roleParts = decodedEmail.split('"');
//         return roleParts.length > 1 ? roleParts[1] : roleParts[0];
//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error decoding role ID: " + error.message);
//         return null;
//     }
// }

// Function to query user data based on email
function queryRolebyID(roleId) {
    try {
        var userQueryResult = openidm.query("managed/alpha_role", {
            "_queryFilter": '_id eq "' + roleId + '"'
        }, ["_id","name"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "No role found ");
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error querying role by id: " + error.message);
        return null;
    }
}

// Main execution
try {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    var roleId = getRoleId();
        if (roleId) {
            var role = queryRolebyID(roleId);
            if (role) {
                logger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::role is" + role)
                logger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::role id" + role._id)
                logger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::role name" + role.name)
                if (role._id && role.name) {
                    nodeState.putShared("roleid", role._id);
                   nodeState.putShared("rolename", role.name);
                   if(nodeState.get("inviteothers")){
                    var inviteothers = nodeState.get("inviteothers");
                    if(inviteothers === "true"){
                        action.goTo(NodeOutcome.FOUNDINIVITATION);
                    } else {
                        action.goTo(NodeOutcome.FOUNDAPPCREATED);
                    }
                   }
                    
                } else {
                    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Role data is incomplete");
                    action.goTo(NodeOutcome.NOT_FOUND);
                }
            } else {
                nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Role not found in PING");
                action.goTo(NodeOutcome.NOT_FOUND);
            }
        } else {
            nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Role not captured");
            action.goTo(NodeOutcome.ERROR);
        }
    } catch (error) {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}

