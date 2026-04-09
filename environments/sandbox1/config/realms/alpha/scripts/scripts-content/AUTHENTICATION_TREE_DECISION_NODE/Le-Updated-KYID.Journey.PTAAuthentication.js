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
var netBiosDomain = domain.split(".", 2)[0]; // Getting the first part of the domain, e.g. eas.ds.ky.gov -> eas
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

if (systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain") != null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingExternalDomain); // external domain is missing
}

if(systemEnv.getProperty("esv.kyid.int.ad.domain") && systemEnv.getProperty("esv.kyid.int.ad.domain")!=null) {
  intDomain = systemEnv.getProperty("esv.kyid.int.ad.domain").toLowerCase();  
}  

if (extDomain.localeCompare(domain) == 0) {
    isinternaluser = false;
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.extUser);
    if (systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector") != null) {
        var ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
    } else {
        missingInputs.push(nodeConfig.missingConnectorInfo);
    }

    if (systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr") != null) {
        var UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");
    } else {
        missingInputs.push(nodeConfig.missingConnectorAttrs);
    }

} else {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.intUser);
    
    if (intDomain && intDomain!=null) { // for Non-Production Environment
        if(systemEnv.getProperty("esv.kyid.int.connector") && systemEnv.getProperty("esv.kyid.int.connector")!=null) {
            var ConnectorName = systemEnv.getProperty("esv.kyid.int.connector").toLowerCase();    
        }  else {
            missingInputs.push(nodeConfig.missingConnectorInfo);
        }

        if(systemEnv.getProperty("esv.kyid.int.connector.attr") && systemEnv.getProperty("esv.kyid.int.connector.attr")!=null) {
            var UserNameAttribute = systemEnv.getProperty("esv.kyid.int.connector.attr");   
        }  else {
            missingInputs.push(nodeConfig.missingConnectorAttrs);
        }
    } else { // for Production Environment
        var esvConnectorString = "esv.kyid." + netBiosDomain + ".connector";
        var esvConnectorAttrString = "esv.kyid." + netBiosDomain + ".connector.attr";
    
        if (systemEnv.getProperty(esvConnectorString) && systemEnv.getProperty(esvConnectorString) != null) {
            var ConnectorName = systemEnv.getProperty(esvConnectorString).toLowerCase();
        } else {
            missingInputs.push(nodeConfig.missingConnectorInfo);
        }
    
        if (systemEnv.getProperty(esvConnectorAttrString) && systemEnv.getProperty(esvConnectorAttrString) != null) {
            var UserNameAttribute = systemEnv.getProperty(esvConnectorString);
        } else {
            missingInputs.push(nodeConfig.missingConnectorAttrs);
        }
    }
}


// Checks if mandatory input params are missing
if (missingInputs.length > 0) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
        "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {

    try {
        nodeState.putShared("isinternaluser", isinternaluser);
        var query = {
            _queryFilter: UserNameAttribute + ` eq "` + email + `"`,
        }
        try {
            // Query to check if user exists in AD
            var ldapUserQuery = openidm.query(`system/` + ConnectorName + `/User`, query);
        } catch (error) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmQueryFail + "::" + error);
            action.goTo(nodeOutcome.ERROR);
        }

        if (ldapUserQuery.result.length > 0) {
            var ldapUser = ldapUserQuery.result[0];
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
                "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapConnSuccess + "::" + nodeConfig.userFound + "::" + JSON.stringify(ldapUser));
            nodeState.putShared("firstName", ldapUser.givenName);
            nodeState.putShared("lastName", ldapUser.sn);
            nodeLogger.error("isinternaluser:" + isinternaluser);

            if (isinternaluser) {
                if (intDomain && intDomain!=null) { // for Non-Production Environment
                   windowsaccountname = "CHFS\\" + ldapUser.sAMAccountName;
                 nodeLogger.error("windowsaccountname: "+windowsaccountname)
                } else { // for Production Environment
                    windowsaccountname = netBiosDomain.toUpperCase() + "\\" + ldapUser.sAMAccountName;
                    nodeLogger.error("windowsaccountname: " + windowsaccountname)
                }
            } else {
                windowsaccountname = "CIT\\" + ldapUser.sAMAccountName;
                nodeLogger.error("windowsaccountname: " + windowsaccountname)
            }

            var systemUser = `system/` + ConnectorName + `/User`;
            openidm.action(systemUser, "authenticate", {
                "username": ldapUser.sAMAccountName,
                "password": password
            });
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
                "::" + nodeConfig.scriptName + "::" + nodeConfig.pwdVerifySuccess);
            //nodeState.putShared("username",usrKOGID);

            //Checks if pwdLastSet flag in AD is set to 0  
            if (ldapUser.pwdLastSet.trim().localeCompare("0") == 0) {
                nodeLogger.error("pwdLastSet:" + ldapUser.pwdLastSet.trim())
                action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);

            } else {
                action.goTo(nodeOutcome.SUCCESS).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);
            }

        } else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
                "::" + nodeConfig.ldapConnSuccess + "::" + nodeConfig.userNotFound + "::" + JSON.stringify(ldapUserQuery.result));
            action.goTo(nodeOutcome.FAIL_INACTIVE);
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        var adConnFailErr = error.message;
        if (adConnFailErr.includes(nodeConfig.pwdExpiredUsrErr)) {
            //nodeState.putShared("username",usrKOGID);
            action.goTo(nodeOutcome.PWD_EXPIRE).putSessionProperty('windowsaccountname', windowsaccountname).putSessionProperty('isinternaluser', isinternaluser);

        } else if (adConnFailErr.includes(nodeConfig.inActiveUsrErr)) {
            action.goTo(nodeOutcome.FAIL_INACTIVE);

        } else {
            action.goTo(nodeOutcome.ERROR);
        }
    }
}