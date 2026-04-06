dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "KYID.Journey.CheckifNoMFAisPresenttoRemove",
    script: "Script",
    scriptName: "KYID.Journey.CheckifNoMFAisPresenttoRemove",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "True",
    NO_MFA: "noMFA"
};

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

// Function to get the locale from request parameters
function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User ID: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

function main() {
    
    nodeState.putShared("noMFALeftToRemove","");
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try {
        var clocale = getLocale();
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Data: " + userData);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                var userMFAMethods = getUserMFAMethods(usrMFAData);
                logger.error("printing userMFAMethods" + userMFAMethods);

                if (userMFAMethods.length === 1 && userMFAMethods.includes("EMAIL")) {
                    nodeLogger.error("No MFA options available to remove");
                     action.goTo(NodeOutcome.NO_MFA)
                } else {
                  action.goTo(NodeOutcome.TRUE)
                }
                }
        }
    }
     catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + ("Error in main execution: " + error.message));
        // Optionally handle errors by setting a default action or response
    }
}


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]); // Need to check duplicate
            }
        }
    }
    return mfaOptionsArray;
}


function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) === 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;
}


// Main execution
main();