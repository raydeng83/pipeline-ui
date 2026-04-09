// Logger Function
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

function queryUserByEmail(email) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + email + '"'
        }, ["_id", "userName", "mail"]);

        logger.error("printing userQueryResult " +userQueryResult);
        if (userQueryResult && userQueryResult.result && userQueryResult.result.length >0) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "No user found for email: " + email);
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error querying user by email: " + error.message);
        return null;
    }
}
var email = requestCookies.get("email");
if (email) {
    logger.error("**************Email cookie: ****************"+email);
    var user = queryUserByEmail(email);
    logger.error("**************printing user: ****************"+user._id);
    logger.error("**************printing usermail: ****************"+user.mail);
    
        if (user._id && user.mail) {
            nodeState.putShared("mail", email);
           nodeState.putShared("_id", user._id);
           nodeState.putShared("username", user.userName);
             nodeState.putShared("KOGID", user.userName);
            logger.error("printing KOGID" + nodeState.get("KOGID"));
            logger.error("printing id" + nodeState.get("_id"));
            
        }
    }

// var clocale = requestCookies.get("clocale");
// logger.error("************locale cookie:***************8 "+clocale);
// nodeState.putShared("clocale",clocale);
outcome = "True";