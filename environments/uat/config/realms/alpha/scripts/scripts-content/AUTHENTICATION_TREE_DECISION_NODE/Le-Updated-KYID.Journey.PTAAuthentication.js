/**
 * Function: KYID.Journey.PTAAuthentication
 * Description: This script is used to authenticate password in Active Directory.
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "PTA Authentication in AD",
    script: "Script",
    scriptName: "KYID.Journey.PTAAuthentication",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingInternalDomain: "Missing Internal Domain Details",
    missingExternalDomain: "Missing External Domain Details",
    missingEmail: "Missing email",
    missingCreds: "Missing credentials",
    missingKOGID: "Missing KOGID for KOG User",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    ldapConnSuccess: "Connected to AD successfully",
    pwdVerifySuccess: "Successfully validated password in AD",
    pwdExpired: "PasswordExpiredException",
    pwdExpiredUsrErr: "PasswordExpiredException",
    inActiveUsrErr: "Invalid",
    idmQueryFail: "IDM query operation failed",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    ERROR: "connFail",
    PWD_EXPIRE: "pwdExpire",
    FAIL_INACTIVE: "failOrInactive"
};

// Declare Global Variables
var missingInputs = [];
var extDomain = "";
var intDomain = "";
var email = nodeState.get("mail").toLowerCase();
var domain = nodeState.get("domain").toLowerCase();
var windowsaccountname = "";
var isinternaluser = true;


// Logging Function
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};

nodeLogger.error("le-deng-log: start of PTA");

if (nodeState.get("KOGID")) {
    var usrKOGID = nodeState.get("KOGID");
} else {
    missingInputs.push(nodeConfig.missingKOGID);
}

if (nodeState.get("password")) {
    var password = nodeState.get("password");
} else {
    missingInputs.push(nodeConfig.missingCreds);
}


// var ConnectorName = "SIT";
var ConnectorName = "kyinternalgov";

var UserNameAttribute = "mail";

var query = {
    _queryFilter: UserNameAttribute + ` eq "` + email + `"`,
}
nodeLogger.error("le-deng-log: query: " + query);
try {
    // Query to check if user exists in AD
    var ldapUserQuery = openidm.query(`system/` + ConnectorName + `/User`, query);
} catch (error) {

    action.goTo(nodeOutcome.ERROR);
}

nodeLogger.error("le-deng-log: query result: " + ldapUserQuery);

if (ldapUserQuery.result.length > 0) {
    var ldapUser = ldapUserQuery.result[0];

    nodeState.putShared("firstName", ldapUser.givenName);
    nodeState.putShared("lastName", ldapUser.sn);

    windowsaccountname = "CHFS\\" + ldapUser.sAMAccountName;
    nodeLogger.error("windowsaccountname: " + windowsaccountname)


    var systemUser = `system/` + ConnectorName + `/User`;
    // openidm.patch(systemUser, "null", [{"operation":"replace", "field":"pwdLastSet", "value":"-1"}]);
    openidm.action(systemUser, "authenticate", {
        "username": ldapUser.sAMAccountName,
        "password": password
    });

    //nodeState.putShared("username",usrKOGID);

    //Checks if pwdLastSet flag in AD is set to 0  

    nodeLogger.error("pwdLastSet:" + ldapUser.pwdLastSet.trim())
    action.goTo(nodeOutcome.SUCCESS).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', true);

} else {

    action.goTo(nodeOutcome.FAIL_INACTIVE);
}