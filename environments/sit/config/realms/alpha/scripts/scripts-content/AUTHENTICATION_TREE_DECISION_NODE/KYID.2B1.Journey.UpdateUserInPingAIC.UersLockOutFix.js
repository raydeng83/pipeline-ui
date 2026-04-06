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

// Performance logging - require shared library
var perfLog = require("KYID.2B1.Library.PerfLog");
var scriptTimer = perfLog.scriptStart("KYID.2B1.Journey.UpdateUserInPingAIC");

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
    missingKOGID: "Missing User KOG ID",
    missingOrganDonorStatus: " Missing OrganDonorStatus",
    missingAddress2: " Missing Address2",
    missingAddress1: " Missing Address1",
    missingAccountTypeCode: " Missing AccountTypeCode",
    missingBase64EncodedKOGID: "Missing Base64EncodedKOGID",
    missingAULevel1Code: "Missing AULevel1Code",
    missingAULevel2Code: "Missing Missing AULevel2Name",
    missingAULevel3Code: "Missing AULevel3Code",
    missingAULevel4Code: "Missing AULevel4Code",
    missingAULevel5Code: "Missing AULevel5Code",
    missingWindowsAccountName: "Missing Windows Account Name",
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
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};


// Declare Global Variables
var missingInputs = [];
var jsonArray = [];
var extDomain = "";
var intDomain = "";
var sAMAccountName = "";
var usrType = "";
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
var OrganDonorStatus = null;
var Address2 = null;
var Address1 = null;
var AccountTypeCode = null;
var Base64EncodedKOGID = null;
var AULevel1Code = null;
var AULevel2Code = null;
var AULevel3Code = null;
var AULevel4Code = null;
var AULevel5Code = null;
var windowsAccName = null;
var county = null;
var city = null;
var zipCode = null;
var state = null;
var usrMiddleName = null;

if (nodeState.get("domain") && nodeState.get("domain") != null) {
    domain = nodeState.get("domain").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingDomain);
}
if (nodeState.get("KOGID")) {
    usrKOGID = nodeState.get("KOGID");
} else {
    missingInputs.push(nodeConfig.missingKOGID);
}

if (nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingEmail);
}

if (nodeState.get("_id")) {
    logger.debug("IDValueinUpdateScript:" + nodeState.get("_id"))
    id = nodeState.get("_id");
} else {
    missingInputs.push(nodeConfig.missingUsrIdIDM);
}

if (nodeState.get("FirstName")) {
    usrFirstName = nodeState.get("FirstName");
    nodeState.putShared("givenName", usrFirstName);
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "givenName";
    jsonObj["value"] = usrFirstName;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingFirstName);
}

if (nodeState.get("windowsAccName")) {
    windowsAccName = nodeState.get("windowsAccName");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_windowsAccountName";
    jsonObj["value"] = windowsAccName;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingWindowsAccountName);
}

if (nodeState.get("LastName")) {
    usrLastName = nodeState.get("LastName");
    nodeState.putShared("lastName", usrLastName);
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "sn";
    jsonObj["value"] = usrLastName;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingLastName);
}

/*var fullname=usrFirstName+" "+usrLastName;
var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "cn";
jsonObj["value"] = fullname;
jsonArray.push(jsonObj);
*/

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

var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "accountStatus";
jsonObj["value"] = "active";
jsonArray.push(jsonObj);

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

if (nodeState.get("ZipCode") != null) {
    zipCode = nodeState.get("ZipCode");
    logger.debug("ValueforZipcodeinsideupdatescript" + zipCode)
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "postalCode";
    jsonObj["value"] = zipCode;
    jsonArray.push(jsonObj);
}

if (nodeState.get("City") != null) {
    city = nodeState.get("City");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "city";
    jsonObj["value"] = city;
    jsonArray.push(jsonObj);
}

if (nodeState.get("State") != null) {
    state = nodeState.get("State");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "stateProvince";
    jsonObj["value"] = state;
    jsonArray.push(jsonObj);
}

if (nodeState.get("MiddleName") != null) {
    usrMiddleName = nodeState.get("MiddleName");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_middleName";
    jsonObj["value"] = usrMiddleName;
    jsonArray.push(jsonObj);
}


if (nodeState.get("county") != null && typeof nodeState.get("county") !== 'number' ) {
    county = nodeState.get("county");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_county";
    jsonObj["value"] = county;
    jsonArray.push(jsonObj);
}

// var jsonObj = {};
//  jsonObj["operation"] = "replace";
//  jsonObj["field"] = "frUnindexedString3";
//  jsonObj["value"] = "en";
//  jsonArray.push(jsonObj);


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

if (nodeState.get("SymantecVIPCredentialID")) {
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
}

if (domain != null) {
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString2";
    jsonObj["value"] = domain;
    jsonArray.push(jsonObj);
}

// if(nodeState.get("OKTAVerify")!=null) {
//      usrOktaVerify = nodeState.get("OKTAVerify"); 
//      var jsonObj = {};
//      jsonObj["operation"] = "replace";
//      jsonObj["field"] = "frIndexedInteger1";
//      jsonObj["value"] = usrOktaVerify;
//      jsonArray.push(jsonObj);
// }  

if (nodeState.get("AULevel1Name") != null) {
    AULevel1Name = nodeState.get("AULevel1Name");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit1Code";
    jsonObj["value"] = AULevel1Name;
    jsonArray.push(jsonObj);
}

if (nodeState.get("AULevel2Name") != null) {
    AULevel2Name = nodeState.get("AULevel2Name");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit2Code";
    jsonObj["value"] = AULevel2Name;
    jsonArray.push(jsonObj);
}

if (nodeState.get("AULevel3Code") != null) {
    AULevel3Code = nodeState.get("AULevel3Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit3Code";
    jsonObj["value"] = AULevel3Code;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingAULevel3Code);
}
if (nodeState.get("AULevel4Code") != null) {
    AULevel4Code = nodeState.get("AULevel4Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit4Code";
    jsonObj["value"] = AULevel4Code;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingAULevel4Code);
}
if (nodeState.get("AULevel5Code") != null) {
    AULevel5Code = nodeState.get("AULevel5Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit5Code";
    jsonObj["value"] = AULevel5Code;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingAULevel5Code);
}
if (nodeState.get("Base64EncodedKOGID") != null) {
    Base64EncodedKOGID = nodeState.get("Base64EncodedKOGID");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_base64KOGId";
    jsonObj["value"] = Base64EncodedKOGID;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingBase64EncodedKOGID);
}
if (nodeState.get("kyidAccountType") != null) {
    kyidAccountType = nodeState.get("kyidAccountType");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_kyidAccountType";
    jsonObj["value"] = kyidAccountType;
    jsonArray.push(jsonObj);
}

if (nodeState.get("AccountTypeCode") != null) {
    AccountTypeCode = nodeState.get("AccountTypeCode");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_kogAccountType";
    jsonObj["value"] = AccountTypeCode;
    jsonArray.push(jsonObj);
} else {
    missingInputs.push(nodeConfig.missingAccountTypeCode);
}

if (nodeState.get("Address1") != null) {
    Address1 = nodeState.get("Address1");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "postalAddress";
    jsonObj["value"] = Address1;
    jsonArray.push(jsonObj);
}

if (nodeState.get("Address2") != null) {
    Address2 = nodeState.get("Address2");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_postalAddress2";
    jsonObj["value"] = Address2;
    jsonArray.push(jsonObj);
}

// if(nodeState.get("OrganDonorStatus")!=null) {
//      OrganDonorStatus = nodeState.get("OrganDonorStatus"); 
//      var jsonObj = {};
//      jsonObj["operation"] = "replace";
//      jsonObj["field"] = "custom_organdonor";
//      jsonObj["value"] = OrganDonorStatus;
//      jsonArray.push(jsonObj);
// }  

//if user created failed from self registration journey earlier, this flag will be changed to true from false upon JIT
var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "custom_ADFlag";
jsonObj["value"] = true;
jsonArray.push(jsonObj);

//Adding the last logon timestamp for the authenticated user
var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "custom_lastLogonDate";
jsonObj["value"] = new Date().toISOString();
jsonArray.push(jsonObj);



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
    // usrType = "External";
    if (nodeState.get("userType")) {
        usrType = nodeState.get("userType")
    }else {
        //defect 210736: handle the case when user change email in KOG and then reset password with new email address
        usrType = "External"
    }
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
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.intUser);
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "frUnindexedString1";
    jsonObj["value"] = "Internal";
    jsonArray.push(jsonObj);

    if (domain && domain != null) {
        //ConnectorName = domain.replace(/\./g, '');
        // ConnectorName = "kyinternalgov"
        ConnectorName = systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase();
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ConnectorName + "::" + ConnectorName);
    }
}

// Checks if mandatory input params are missing
if (missingInputs.length > 0) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    var timerLDAP1 = perfLog.start("UpdateUser_LDAP_Query_UPN", "KOGID", usrKOGID);
    result = queryLDAP(ConnectorName, "userPrincipalName", usrUPN.toLowerCase());
    perfLog.end(timerLDAP1);

    if (result.records === 0) {
        var timerLDAP2 = perfLog.start("UpdateUser_LDAP_Query_Email", "KOGID", usrKOGID);
        result = queryLDAP(ConnectorName, UserNameAttribute, email);
        perfLog.end(timerLDAP2);
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
        logger.debug("PrintingBeforeUpdate");
        logger.debug("the json Array " + JSON.stringify(jsonArray))
        var timerPatch1 = perfLog.start("UpdateUser_IDM_Patch1", "KOGID", usrKOGID);
        openidm.patch("managed/alpha_user/" + id, null, jsonArray);
        perfLog.end(timerPatch1);
        nodeState.putShared("usrcreatedId", id)
        //  logger.debug("user patch response "+userPatch.result[0] )
        try {
            var jsonArrayAudit = [];
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
            //var updatedById = null;
            // if (auditData.updatedByID !== null || auditData.updatedByID !== undefined) {
            //     updatedById = auditData.updatedByID;
            // } else {
            //     updatedById = "";
            // }
            // var updatedBy = null;
            // if (auditData.updatedBy !== null || auditData.updatedBy !== undefined) {
            //     updatedBy = auditData.updatedBy;
            // } else {
            //     updatedBy = "";
            // }


            var jsonObj = {};
            jsonObj["operation"] = "replace";
            jsonObj["field"] = "custom_updatedDateEpoch";
            jsonObj["value"] = auditData.updatedDateEpoch;
            jsonArrayAudit.push(jsonObj);


            var jsonObj = {};
            jsonObj["operation"] = "replace";
            jsonObj["field"] = "custom_updatedByID";
            jsonObj["value"] = auditData.updatedByID;
            jsonArrayAudit.push(jsonObj);

            var jsonObj = {};
            jsonObj["operation"] = "replace";
            jsonObj["field"] = "custom_updatedDateISO";
            jsonObj["value"] = auditData.updatedDate;
            jsonArrayAudit.push(jsonObj);


            var jsonObj = {};
            jsonObj["operation"] = "replace";
            jsonObj["field"] = "custom_updatedBy";
            jsonObj["value"] = auditData.updatedBy;
            jsonArrayAudit.push(jsonObj);



            //jsonArray.push(jsonObj)
            logger.debug("auditDetail " + JSON.stringify(auditData))
            logger.debug("auditDetail " + JSON.stringify(jsonArrayAudit))
            var timerPatch2 = perfLog.start("UpdateUser_IDM_Patch2_Audit", "KOGID", usrKOGID);
            openidm.patch("managed/alpha_user/" + id, null, jsonArrayAudit);
            perfLog.end(timerPatch2);

        } catch (error) {
            logger.error("Error Occured : Couldnot find audit details " + error)

        }

        logger.debug("PrintingAfterUpdate");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.updateUsrProfileIDM_Success);
        if (usrEmailAddress && typeof usrEmailAddress !== "undefined") {
            logger.debug("Checking for existing EMAIL MFA method for user " + usrKOGID);

            var MFA_ID = lookupInMFAObject(usrKOGID, usrEmailAddress);

            if (MFA_ID === null) {
                logger.debug("EMAIL MFA exists and is ACTIVE with same value — no action needed.");
            } else if (MFA_ID) {
                logger.debug("EMAIL MFA exists but needs update.");
                logger.debug("Updating EMAIL MFA — MFA_ID: " + MFA_ID);
                updateMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE", MFA_ID);
            } else {
                logger.debug("EMAIL MFA does not exist — creating EMAIL, SMSVOICE, and SYMANTEC MFA");

                // Create EMAIL MFA
                createMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE", false);

                // Create SMSVOICE MFA(s)
                if (PhoneNumbers != null && typeof PhoneNumbers != "undefined") {
                    logger.debug("Processing Phone Numbers for MFA. Count: " + PhoneNumbers.length);
                    for (var j = 0; j < PhoneNumbers.length; j++) {
                        var usrMobilePhoneNumber = PhoneNumbers[j];

                        var mobileMFA_ID = lookupInMFAObject(usrKOGID, usrMobilePhoneNumber);
                        if (!mobileMFA_ID) {
                            logger.debug("Creating MFA for SMSVOICE");
                            createMFAObject(usrKOGID, "SMSVOICE", usrMobilePhoneNumber, "ACTIVE", true);
                        } else {
                            logger.debug("SMSVOICE MFA already exists for");
                        }
                    }
                }

                // Create SYMANTEC MFA
                if (usrSymantecVIPCredentialID && typeof usrSymantecVIPCredentialID === "string" && usrSymantecVIPCredentialID.trim() !== "") {
                    logger.debug("Checking Symantec VIP Credential for MFA");

                    var symantecMFA_ID = lookupInMFAObject(usrKOGID, usrSymantecVIPCredentialID);
                    if (!symantecMFA_ID) {
                        logger.debug("Creating MFA for SYMANTEC");
                        createMFAObject(usrKOGID, "SYMANTEC", usrSymantecVIPCredentialID, "ACTIVE", true);
                    } else {
                        logger.debug("SYMANTEC MFA already exists");
                    }
                }
            }
        }
        perfLog.scriptEnd(scriptTimer, "KOGID", usrKOGID);
        action.goTo(nodeOutcome.SUCCESS);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmPatchOperationFailed + "::" + error);
        perfLog.scriptEnd(scriptTimer, "KOGID", usrKOGID);
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

function updateMFAObject(usrKOGID, method, usrMfaValue, status, MFA_ID) {



    try {

        logger.debug("Values are :: " + usrKOGID + method + usrMfaValue + status + MFA_ID)
        openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, [{
            "operation": "replace",
            "field": "MFAValue",
            "value": usrMfaValue
        }]);

        var auditDetails = require("KYID.2B1.Library.AuditDetails");
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState);
        var updatedById = null;
        if (auditData.updatedByID !== null || auditData.updatedByID !== undefined) {
            updatedById = auditData.updatedByID;
        } else {
            updatedById = "";
        }
        var updatedBy = null;
        if (auditData.updatedBy !== null || auditData.updatedBy !== undefined) {
            updatedBy = auditData.updatedBy;
        } else {
            updatedBy = "";
        }

        openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, [{
            "operation": "replace",
            "field": "/updateDateEpoch",
            "value": auditData.updatedDateEpoch
        }, {
            "operation": "replace",
            "field": "/updatedByID",
            "value": updatedById
        }, {
            "operation": "replace",
            "field": "/updateDate",
            "value": auditData.updatedDate
        }, {
            "operation": "replace",
            "field": "/updatedBy",
            "value": updatedBy
        }]);
    } catch (error) {
        logger.error("Error Occured : Couldnot find audit details" + error);
        // return;
    }

    //     var patchOps = [];
    //     try {
    //         var auditDetails = require("KYID.2B1.Library.AuditDetails");
    //         var auditData = auditDetails.getAuditDetails("UPDATE", nodeState);
    //         patchOps.push({
    //             operation: "replace",
    //             field: "/updateDateEpoch",
    //             value: auditData.updatedDateEpoch
    //         });
    //         //jsonArray.push(jsonObj)
    //         patchOps.push({
    //             operation: "replace",
    //             field: "/updatedByID",
    //             value: auditData.updatedByID
    //         });
    //         //jsonArray.push(jsonObj)
    //         patchOps.push({
    //             operation: "replace",
    //             field: "/updateDate",
    //             value: auditData.updatedDate
    //         });
    //         //jsonArray.push(jsonObj)
    //         patchOps.push({
    //             operation: "replace",
    //             field: "/updatedBy",
    //             value: auditData.updatedBy
    //         });
    //         //jsonArray.push(jsonObj)
    //         logger.debug("auditDetail " + JSON.stringify(auditData));
    //     } catch (error) {
    //         logger.error("Error Occured : Couldnot find audit details" + error);
    //         return;
    //     }

    //     try {
    //         var patchResult = openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, patchOps);
    //         logger.debug("Patched new audit attributes");
    //     } catch (error) {
    //         logger.error("Patch audit attributes failed");
    //     }
    // }
}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);

    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)

        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
        logger.error("Error Occured : Couldnot find audit details" + error)

    }
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status,
        'isRecoveryOnly': isRecoveryOnly,
        'createDate': auditData.createdDate,
        'createDateEpoch': auditData.createdDateEpoch,
        'createdBy': auditData.createdBy,
        'createdByID': auditData.createdByID
    };


    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    var MFA_ID = false;

    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '"'
        });

        if (mfaMethodResponses.result.length > 0) {
            for (var i = 0; i < mfaMethodResponses.result.length; i++) {
                var mfaMethodResponse = mfaMethodResponses.result[i];

                if (mfaMethodResponse["MFAValue"] === usrMfaValue) {
                    if (mfaMethodResponse["MFAStatus"] === "ACTIVE") {
                        logger.debug("email mfa found for the user")
                        return null;
                    } else {
                        // Exists but not ACTIVE — return ID for update
                        return mfaMethodResponse._id;
                    }
                }
            }
        }
    } catch (e) {
        logger.error("Error during MFA lookup for value [" + usrMfaValue + "]: " + e);
    }

    // No match found — create new
    return MFA_ID;
}
// function lookupInMFAObject(usrKOGID, usrMfaValue) {
//     //logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
//     var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '" and MFAMethod eq "EMAIL"' });
//     if (mfaMethodResponses.result.length > 0) {
//         for (i = 0; i < mfaMethodResponses.result.length; i++) {
//             var mfaMethodResponse = mfaMethodResponses.result[i];
//             var MFA_ID = mfaMethodResponse._id
//             logger.debug("the MFA_ID in lookupInMFAObject "+MFA_ID)
//             if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
//                 mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
//                 return null;
//             }
//         }
//     }
//     return MFA_ID;
// }
