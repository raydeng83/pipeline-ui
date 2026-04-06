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

var roleOps = require("KYID.2B1.Lib.GetAppandBusinessApp");

// Get userId and appId from state
var userId = nodeState.get("KOGID");


var appName;
if(nodeState.get("appname")) {
appName=nodeState.get("appname")
logger.debug("the appName is:"+appName)
} else if(nodeState.get("appName")) {
appName=nodeState.get("appName")
logger.debug("the appName is:"+appName)
} else if (nodeState.get("kogAppName")) {
appName=nodeState.get("kogAppName")
logger.debug("the kogAppName is:"+appName)
} else {
logger.debug("application information cannot be fetched")
}

logger.debug("UserIDformfa:"+userId)

if (appName && userId) {
    // Get requiredMFAMethod from ALL roles of the application
    var highestMFA = roleOps.getAppRolesHighestMFA(appName,userId);
    logger.debug("the app highest MFA " +highestMFA )
    if (highestMFA !== null) {
        // Map MFA code to name
        var mfaCodeToName = {
        5: "AUTHENTICATOR",
        4: "MOBILE",
        3: "EMAIL",
        0: "NA"
    };

    var appRequiredMFAMethodName = mfaCodeToName[highestMFA];
    nodeState.putShared("appRequiredMFAMethod", appRequiredMFAMethodName);
    nodeState.putShared("appRequiredMFACode",highestMFA);
    nodeState.putShared("requiredMFAMethod", highestMFA);
    logger.debug("App Required MFA Method (name): " + appRequiredMFAMethodName);
        
    action.goTo("success");
 }

else{
    logger.error("Could not determine user's highest MFA");
    action.goTo("failed");
  }
}
else {
    logger.error("Missing userId or appId");
    action.goTo("failed");
}
