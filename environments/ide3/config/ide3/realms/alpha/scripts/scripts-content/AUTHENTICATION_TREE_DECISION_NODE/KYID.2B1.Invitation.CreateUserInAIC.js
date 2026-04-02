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
    scriptName: "KYID.2B1.Invitation.CreateUserInAIC",
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
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    var usrEmailAddress = nodeState.get("mail");
    var usrLastName = nodeState.get("sn");
    var usrFirstName = nodeState.get("givenName");
    //var usrPassword = nodeState.get("objectAttributes").get("password");
    //var usrPassword = nodeState.get("password");
    var phoneNumber = nodeState.get("phonenumber");
    var usrKOGID = generateGUID();
    nodeState.putShared("usrKOGID", usrKOGID);

    if(nodeState.get("inviteothers")){
        var inviteothers = nodeState.get("inviteothers")
        if(inviteothers === "true"){
            var accountStatus = "INVITED";
        } else {
            var accountStatus = "APPCREATED";
        }
    }
    
    var external = "External";
    var frUnindexedString2 = systemEnv.getProperty("esv.kyid.dev.ext.ad.domain");
    

    // Creating JSON object for user creation
    jsonObj = {
        givenName: usrFirstName,
        sn: usrLastName,
        mail: usrEmailAddress,
        userName: usrKOGID,
        accountStatus: accountStatus,
        telephoneNumber: phoneNumber,
        frUnindexedString1: external,
        frUnindexedString2: frUnindexedString2
    };

    jsonObj1 = Object.assign({}, jsonObj);
    delete jsonObj1.telephoneNumber;

    // Logging input data
    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Data: " + JSON.stringify(jsonObj));

    // Attempt user creation
    var createUserResponse;
    if (!phoneNumber) {
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Phone number not provided, creating user without phone");

        createUserResponse = openidm.create("managed/alpha_user", null, jsonObj1);
    } else {
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Phone number provided creating user with phone");
        createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
    }

    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Created Successfully: " + JSON.stringify(createUserResponse));
    nodeLogger.debug(nodeConfig.end);
    action.goTo(nodeOutcome.SUCCESS);

} catch (error) {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    nodeLogger.error(transactionid+ "::" + nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.ERROR);
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