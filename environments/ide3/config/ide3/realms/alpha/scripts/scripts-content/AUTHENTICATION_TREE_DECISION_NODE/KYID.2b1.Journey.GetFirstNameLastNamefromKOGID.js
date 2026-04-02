var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "GetUserID",
    script: "Script",
    scriptName: "KYID.2b1.Journey.GetFirstNameLastNamefromKOGID",
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

// function queryUserByKOGID(KOGID) {
//     try {
//         var userQueryResult = openidm.query("managed/alpha_user", {
//             "_queryFilter": 'userName eq "' + KOGID + '"'
//         }, ["_id", "userName", "mail", "givenName"]);

//         if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
//             return userQueryResult.result[0];
//         } else {
//             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
//             return null;
//         }
//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
//         return null;
//     }
// }

// Main execution
try {
    
    var KOGID = nodeState.get("KOGID");
    logger.error("Printing the KOGID:::"+KOGID)
    if (KOGID) {
        //var user = queryUserByKOGID(KOGID);
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, []);

        var user = userQueryResult.result[0]
        if (user) {

            nodeState.putShared("givenName",user.givenName);
            nodeState.putShared("lastName",user.sn);

          
          
            
      
            logger.error("user found");
            action.goTo(NodeOutcome.FOUND);
        
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            action.goTo(NodeOutcome.NOT_FOUND);
        }
    } else {
        logger.error("KOG ID is null. Sending to Error");
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}