var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Update User Profile for MFA",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.UpdateMFAMethod",
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
        if (!userId) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: User ID is null or undefined.");
        }
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from nodeState: " + error.message);
        return null;
    }
}

function fetchUserData(userId) {
    try {
        logger.error("Reading User Data from profile for user " + userId);
        var userData = openidm.read("managed/alpha_user/" + userId);
        logger.error("User Data from profile: " + userData);
        return userData;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}


/**
 * Retrieves the MFA method from nodeState.
 * @returns {string|null} - The MFA method or null if not found.
 */
function getMFAMethod() {
    try {
        return nodeState.get("MFAMethod");
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving MFA method from nodeState: " + error.message);
        return null;
    }
}

/**
 * Queries for MFA context object based on the given MFA method.
 * @param {string} mfamethod - The MFA method to query for.
 * @returns {Object} - The result of the query.
 */
function queryMFAContext(mfamethod) {
    try {
        return openidm.query("managed/MFAContextObject", {
            "_queryFilter": "/MFAMethods eq \"" + mfamethod + "\""
        }, ["_id"]);
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error querying MFA context object: " + error.message);
        return { resultCount: 0, result: [] };
    }
}

function createMFAObjects(mfaMethod, usrKOGID, usrEmailAddress, usrMobilePhoneNumber, usrSymantecVIPCredentialID) {

    if ((mfaMethod === "sms" || mfaMethod === "voice") && usrMobilePhoneNumber) {
        if(!lookupInMFAObject(usrKOGID, usrMobilePhoneNumber)) {
                         createMFAObject(usrKOGID,"SMSVOICE",usrMobilePhoneNumber,"ACTIVE");
                     }
    } 
    if (mfaMethod === "symantec" && usrSymantecVIPCredentialID) {
        if(!lookupInMFAObject(usrKOGID, usrSymantecVIPCredentialID)) {
                         createMFAObject(usrKOGID,"SYMANTEC",usrSymantecVIPCredentialID,"ACTIVE");
                     }
    } 
    if (mfaMethod === "otp") {
        logger.error("mfaMethod: "+mfaMethod)
        createMFAObject(usrKOGID, "FRTOTP", "DEVICE", "ACTIVE");
    } 
    if (mfaMethod === "swk") {
        createMFAObject(usrKOGID, "FRPUSH", "DEVICE", "ACTIVE");
    }
}

/**
 * Creates an MFA object in OpenIDM.
 * @param {string} usrKOGID - The user KOGID.
 * @param {string} method - The MFA method.
 * @param {string} usrMfaValue - The value for MFA.
 * @param {string} status - The status of the MFA.
 */
function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    logger.error("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status
    };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});
	if (mfaMethodResponses.result.length>0){
       for(i=0;i<mfaMethodResponses.result.length;i++){
           var mfaMethodResponse = mfaMethodResponses.result[i];
		   if(mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue)===0 && 
				mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE")===0) {
			   return true;
		   }
	   }
	}
	return false;
}

// Main execution
try {
    var userId = getUserId();
    if (!userId) {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User ID is not available.");
        outcome = NodeOutcome.FAILED;
    } else {
        var userData = fetchUserData(userId);
        if (!userData) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data not found for user ID: " + userId);
            outcome = NodeOutcome.FAILED;
        } else {
            var usrKOGID = userData.userName; 
            var usrEmailAddress = userData.mail; 
            var usrMobilePhoneNumber = nodeState.get("telephoneNumber");
            var usrSymantecVIPCredentialID = userData.frIndexedString4;

            var availableMFAMethods = ["email", "sms", "swk", "otp", "symantec", "voice"];
            var mfamethod = getMFAMethod();
            if (!mfamethod || !availableMFAMethods.includes(mfamethod)) {
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " MFAMethod " + mfamethod + " is not valid.");
                outcome = NodeOutcome.FAILED;
            } else {
                createMFAObjects(mfamethod,usrKOGID, usrEmailAddress, usrMobilePhoneNumber, usrSymantecVIPCredentialID);
                outcome = NodeOutcome.SUCCESS;
            }
        }
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + error.message);
    outcome = NodeOutcome.FAILED;
}