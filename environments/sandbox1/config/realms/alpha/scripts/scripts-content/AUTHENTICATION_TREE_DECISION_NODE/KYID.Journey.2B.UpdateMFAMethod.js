var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Update User Profile for MFA",
    script: "Script",
    scriptName: "KYID.Journey.2B.UpdateMFAMethod",
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
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};

/**
 * Retrieves the user ID from nodeState.
 * @returns {string|null} - The user ID or null if not found.
 */
function getUserId() {
    try {
        var userId = nodeState.get("_id");
       // var userId = "ace845e3-d921-44cc-8b4e-13ba26a39065";
        if (!userId) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: User ID is null or undefined.");
            action.goTo(NodeOutcome.FAILED);
        }
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error retrieving user ID from nodeState: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }
}

function fetchUserData(userId) {
    try {
        nodeLogger.error("Reading User Data from profile for user " + userId);
        var userData = openidm.read("managed/alpha_user/" + userId);
        nodeLogger.error("User Data from profile: " + userData);
        return userData;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error reading user data from OpenIDM: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }
}


function getMFAMethod() {
    try {
        return nodeState.get("MFAMethod");
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error retrieving MFA method from nodeState: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }
}

function updateMFAObjects(mfamethod, usrKOGID, usrEmailAddress, oldMFAEmailValue) {
    if (mfamethod === "EMAIL") {
        var MFA_ID = lookupInMFAObject(usrKOGID, oldMFAEmailValue); 
        if (MFA_ID) {
            updateMFAObject(MFA_ID, usrEmailAddress);
        } else {
            nodeLogger.error("MFA record not found for the original email.");
        }
    } 
}

function updateMFAObject(MFA_ID, usrEmailAddress) {
    nodeLogger.error("MFA Method is being registered for " + MFA_ID + " and the new email is " + usrEmailAddress);
    
    // Perform the patch operation to update MFA object with the new email
    openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, [
        {
            "operation": "replace",
            "field": "MFAValue",
            "value": usrEmailAddress
        }
    ]);
    
    nodeLogger.error("Updated MFA with ID: " + MFA_ID);
}

function lookupInMFAObject(usrKOGID, oldMFAEmailValue) {
    nodeLogger.error("Looking up MFA Method for KOGID: " + usrKOGID + " with original email: " + oldMFAEmailValue);
    
    // Query to find MFA records for the given user (usrKOGID) and original email
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
        "_queryFilter": '/KOGId eq "' + usrKOGID + '" and /MFAValue eq "' + oldMFAEmailValue + '"'
    });
    
    if (mfaMethodResponses.result.length > 0) {
        for (var i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            var MFA_ID = mfaMethodResponse._id;

            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                nodeLogger.error("MFA found with ID: " + MFA_ID);
                return MFA_ID;  
            }
        }
    }
    return null;
}

// Main execution
try {
    var userId = getUserId();
    var userData = fetchUserData(userId);
    if (!userData) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data not found for user ID: " + userId);
        action.goTo(NodeOutcome.FAILED);
    }

    var usrKOGID = userData.userName;
    var usrEmailAddress = nodeState.get("newemail1");
    var oldMFAEmailValue = nodeState.get("originalemail");

    // Validate that email is available
    if (!usrEmailAddress) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: Email address is null or undefined.");
        action.goTo(NodeOutcome.FAILED);
    }

    // Get MFA method and validate
    var mfamethod = getMFAMethod();
    if (!mfamethod) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Invalid MFA Method: " + mfamethod);
        action.goTo(NodeOutcome.FAILED);
    }

    // Update the MFA objects based on the selected method
    updateMFAObjects(mfamethod, usrKOGID, usrEmailAddress, oldMFAEmailValue);

    // Successfully updated MFA, proceed
    action.goTo(NodeOutcome.SUCCESS);

} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}

