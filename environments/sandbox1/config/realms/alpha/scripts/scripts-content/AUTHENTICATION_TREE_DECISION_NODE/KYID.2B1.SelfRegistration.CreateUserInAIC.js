/**
* Function: KYID.2B1.SelfRegistration.CreateUserInAIC
* Description: This script creates a user in the alpha environment. It also handles MFA registration if required.
* Param(s):
* Input:
* - usrEmailAddress
* - usrLastName
* - usrFirstName
* - usrPassword
* - phoneNumber
* - objectAttributes
* - mail
* - sn
* - givenName
* Returns: 
* - Success: User created successfully.
* - Error: User creation failed.

*/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Create User in AIC",
    script: "Script",
    scriptName: "KYID.2B1.SelfRegistration.CreateUserInAIC",
    timestamp: dateTime,
    idmCreateOperationFailed: "IDM Create Operation Failed",
    mfaCreateOperationFailed: "MFA Create Operation Failed",
    exceptionErrMsg: "Error during user creation: ",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

nodeLogger.debug(nodeConfig.begin);

var jsonObj = {};
var jsonObj1 = {};
var createUserSuccess = false;

try {
    var usrEmailAddress = nodeState.get("mail");
    var usrLastName = nodeState.get("sn");
    var usrFirstName = nodeState.get("givenName");
    //var usrPassword = nodeState.get("objectAttributes").get("password");
    var usrPassword = nodeState.get("password");
    var phoneNumber = nodeState.get("telephoneNumber");
    var usrKOGID = generateGUID();
    nodeState.putShared("usrKOGID", usrKOGID);

    var accountStatus = "Active";
    var external = "External";
    var frUnindexedString2 = systemEnv.getProperty("esv.kyid.dev.ext.ad.domain");
    

    // Creating JSON object for user creation
    jsonObj = {
        givenName: usrFirstName,
        sn: usrLastName,
        mail: usrEmailAddress,
        userName: usrKOGID,
        accountStatus: accountStatus,
        password: usrPassword,
        telephoneNumber: phoneNumber,
        frUnindexedString1: external,
        frUnindexedString2: frUnindexedString2
    };

    jsonObj1 = Object.assign({}, jsonObj);
    delete jsonObj1.telephoneNumber;

    // Logging input data
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Data: " + JSON.stringify(jsonObj));

    // Attempt user creation
    var createUserResponse;
    if (!phoneNumber) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Phone number not provided, creating user without phone");

        createUserResponse = openidm.create("managed/alpha_user", null, jsonObj1);
    } else {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Phone number provided creating user with phone");

        createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
    }

    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Created Successfully: " + JSON.stringify(createUserResponse));

    // MFA Registration
    if (createUserResponse) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Attempting to register MFA for user: " + usrEmailAddress);

        if (usrEmailAddress && !lookupInMFAObject(usrKOGID, usrEmailAddress)) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Email Registration in Progress");
            createMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE");
        }
    }
    nodeLogger.debug(nodeConfig.end);
    action.goTo(nodeOutcome.SUCCESS);

} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.ERROR);
}

/**
 * Create MFA Object
 */
function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    var mfajsonObj = {
        KOGId: usrKOGID,
        MFAMethod: method,
        MFAValue: usrMfaValue,
        MFAStatus: status
    };
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Creating MFA Object: " + JSON.stringify(mfajsonObj));
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

/**
 * Lookup MFA Object
 */
function lookupInMFAObject(usrKOGID, usrMfaValue) {
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
        "_queryFilter": '/KOGId eq "' + usrKOGID + '"'
    });

    if (mfaMethodResponses.result.length > 0) {
        for (var i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"] === usrMfaValue &&
                mfaMethodResponse["MFAStatus"] === "ACTIVE") {
                return true;
            }
        }
    }
    return false;
}

/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}