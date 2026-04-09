/**
 * Function: KYID.Journey.UpdateUserInPingAIC
 * Description: This function is used to update Forgerock AIC user profile based on KOG Profile.
 * Param(s):
 * Input:
 *     <String> credentials              
 *                
 * Returns: 
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Update User Profile",
    script: "Script",
    scriptName: "KYID.Journey.UpdateUserInPingAIC",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingUsrIdIDM: "Missing ID of IDM user in sharedState",
    missingFirstName: "Missing FirstName for KOG User",
    missingLastName: "Missing LastName for KOG User",
    missingEmailAddress: "Missing EmailAddress for KOG User",
    missingUPN: "Missing UPN for KOG User",
    missingLogon: "Missing Logon for KOG User",
    missingLanguagePreference: "Missing LanguagePreference for KOG User",
    missingSymantecVIPCredentialID: "Missing SymantecVIPCredentialID for KOG User",
    missingOktaVerify: "Missing OktaVerify for KOG User",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    ldapConnSuccess: "Connected to AD successfully",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    idmPatchOperationFailed: "IDM Patch/Update Operation Failed",
    usrCreateOrUpdateFails: "User profile can neither be created nor be updated in the system.",
    usrExistIDM: "User profile exist in Forgerock AIC",
    usrNotExistIDM: "User profile doesn't exist in Forgerock AIC",
    updateUsrProfileIDM_Success: "User profile updated successfully in Forgerock AIC",
    ConnectorName: "ConnectorName",
    missingDomain: "Missing user domain",
    missingEmail: "Missing email",
    ldapQuery: "ldapQuery",
    idmQueryFail: "IDM query operation failed",
    ldapQueryTotalRecords: "Total Records",
    ldapQueryPrintRecords: "List of Records",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

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


// Declare Global Variables
var missingInputs = [];
var jsonArray = [];
var extDomain = "";
var intDomain = "";
var sAMAccountName = "";
var usrType = "Internal";
var email = null;
var domain = null;
var id = null;
var usrFirstName = null;
var usrLastName = null;
var usrEmailAddress = null;
var usrUPN = null;
var usrLogon = null;
var PhoneNumbers = null;
var usrLanguagePreference = null;
var usrOktaVerify = null;
var result = {};

if (nodeState.get("domain") && nodeState.get("domain") != null) {
    domain = nodeState.get("domain").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingDomain);
}

if (nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingEmail);
}

if (nodeState.get("_id")) {
    id = nodeState.get("_id");
} else {
    missingInputs.push(nodeConfig.missingUsrIdIDM);
}

if (nodeState.get("FirstName")) {
    usrFirstName = nodeState.get("FirstName");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "givenName";
    jsonObj["value"] = usrFirstName;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingFirstName);
}

if (nodeState.get("LastName")) {
    usrLastName = nodeState.get("LastName");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "sn";
    jsonObj["value"] = usrLastName;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingLastName);
}

if (nodeState.get("EmailAddress")) {
    usrEmailAddress = nodeState.get("EmailAddress");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "mail";
    jsonObj["value"] = usrEmailAddress;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingEmailAddress);
}

if (nodeState.get("UPN")) {
    usrUPN = nodeState.get("UPN");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frIndexedString1";
    jsonObj["value"] = usrUPN;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingUPN);
}

if (nodeState.get("Logon")) {
    usrLogon = nodeState.get("Logon");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frIndexedString2";
    jsonObj["value"] = usrLogon;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingLogon);
}

if (nodeState.get("PhoneNumbers")) {
    PhoneNumbers = nodeState.get("PhoneNumbers");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedMultivalued1";
    jsonObj["value"] = PhoneNumbers;
    jsonArray.push(jsonObj);
}


if (nodeState.get("LanguagePreference")) {
    usrLanguagePreference = nodeState.get("LanguagePreference");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString3";
    jsonObj["value"] = usrLanguagePreference;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingLanguagePreference);
}

/*if(nodeState.get("SymantecVIPCredentialID")) {
     var usrSymantecVIPCredentialID = nodeState.get("SymantecVIPCredentialID");
     var jsonObj = {};
     jsonObj["operation"] = "replace";
     jsonObj["field"] = "frIndexedString4";
     jsonObj["value"] = usrSymantecVIPCredentialID;
     jsonArray.push(jsonObj);
} else {
     var jsonObj = {};
     jsonObj["operation"] = "replace";
     jsonObj["field"] = "frIndexedString4";
     jsonObj["value"] = " ";
     jsonArray.push(jsonObj);
}*/

if (domain != null) {
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString2";
    jsonObj["value"] = domain;
    jsonArray.push(jsonObj);
}

if (nodeState.get("OktaVerify") != null) {
    usrOktaVerify = nodeState.get("OktaVerify");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frIndexedInteger1";
    jsonObj["value"] = usrOktaVerify;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingOktaVerify);
}

if (systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain") != null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingExternalDomain);
}

if (systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr") != null) {
    UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");
} else {
    missingInputs.push(nodeConfig.missingConnectorAttrs);
}

if (extDomain.localeCompare(domain) == 0) {
    usrType = "External";
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.extUser);
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString1";
    jsonObj["value"] = usrType;
    jsonArray.push(jsonObj);

    if (systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector") != null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ConnectorName + "::" + ConnectorName);
    } else {
        missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.intUser);
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString1";
    jsonObj["value"] = usrType;
    jsonArray.push(jsonObj);

    if (domain && domain != null) {
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ConnectorName + "::" + ConnectorName);
    }
}

try {
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    jsonObj = {
        operation: "replace",
        field: "/custom_updatedDateEpoch",
        value: auditData.updatedDateEpoch
    }
    jsonArray.push(jsonObj)
    jsonObj = {
        operation: "replace",
        field: "/custom_updatedByID",
        value: auditData.updatedByID
    }
    jsonArray.push(jsonObj)
    jsonObj = {
        operation: "replace",
        field: "/custom_updatedDateISO",
        value: auditData.updatedDate
    }
    jsonArray.push(jsonObj)
    jsonObj = {
        operation: "replace",
        field: "/custom_updatedBy",
        value: auditData.updatedBy
    }
    jsonArray.push(jsonObj)
    logger.debug("auditDetail " + JSON.stringify(auditData))
} catch (error) {
    logger.error("Error Occured : Couldnot find audit details" + error)

}



// Checks if mandatory input params are missing
if (missingInputs.length > 0) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    result = queryLDAP(ConnectorName, "userPrincipalName", usrUPN.toLowerCase());

    if (result.records === 0) {
        result = queryLDAP(ConnectorName, UserNameAttribute, email);
    }

    if (result.records > 0) {
        var ldapUser = result.data;
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            "::" + nodeConfig.ldapConnSuccess + "::" + nodeConfig.userFound);
        sAMAccountName = ldapUser.sAMAccountName;
        var jsonObj = {};
        jsonObj["operation"] = "replace";
        jsonObj["field"] = "frIndexedString3";
        jsonObj["value"] = sAMAccountName;
        jsonArray.push(jsonObj);

    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            "::" + nodeConfig.ldapConnSuccess + "::" + nodeConfig.userNotFound);
        action.goTo(nodeOutcome.ERROR);
    }

    try {
        //An exception is thrown if the object could not be updated.
        openidm.patch("managed/alpha_user/" + id, null, jsonArray);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.updateUsrProfileIDM_Success);
        action.goTo(nodeOutcome.SUCCESS);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmPatchOperationFailed + "::" + error);
        action.goTo(nodeOutcome.ERROR);
    }

}


function queryLDAP(ConnectorName, UserNameAttribute, UserNameAttributeValue) {

    var records = 0;
    var result = {};
    result['records'] = records;
    result['data'] = "No Record Found";
    var query = {
        _queryFilter: UserNameAttribute + ` eq "` + UserNameAttributeValue + `"`,
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapQuery + "::" + JSON.stringify(query));

    try {
        // Query to check if user exists in AD
        var ldapUserQuery = openidm.query(`system/` + ConnectorName + `/User`, query);
        records = ldapUserQuery.result.length;
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapQueryTotalRecords + "::" + records);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapQueryPrintRecords + "::" + JSON.stringify(ldapUserQuery.result));
        result['records'] = records;
        result['data'] = ldapUserQuery.result[0];

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmQueryFail + "::" + error);
    }

    nodeLogger.debug("LDAP Query result length: " + result.records);
    nodeLogger.debug("LDAP Query user data: " + result.data);
    return result;
}