/**
 * Function: KYID.Journey.CreateUserInPingAIC
 * Description: This function is used to create new Forgerock AIC user profile based on KOG Profile.
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
    nodeName: "Create User With KOG Profile",
    script: "Script",
    scriptName: "KYID.Journey.CreateUserInPingAIC",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingFirstName: "Missing FirstName for KOG User",
    missingLastName: "Missing LastName for KOG User",
    missingEmailAddress: "Missing EmailAddress for KOG User",
    missingUPN: "Missing UPN for KOG User",
    missingLogon: "Missing Logon for KOG User",
    missingKOGID: "Missing KOGID for KOG User",
    missingLanguagePreference: "Missing LanguagePreference for KOG User",
    missingSymantecVIPCredentialID: "Missing SymantecVIPCredentialID for KOG User",
    missingOktaVerify: "Missing OktaVerify for KOG User",
    missingUserStatus: "Missing UserStatus for KOG User",
    missingConnectorInfo: "Missing connector details",
    missingConnectorAttrs: "Missing connector attributes",
    extUser: "External Domain User",
    intUser: "Internal Domain User",
    ldapConnSuccess: "Connected to AD successfully",
    userFound: "User Found in AD",
    userNotFound: "User Not Found in AD",
    idmCreateOperationFailed: "IDM Create Operation Failed",
    idmPatchOperationFailed: "IDM Patch Operation Failed",
    usrCreateOrUpdateFails: "User profile can neither be created nor be updated in the system.",
    createUsrProfileIDM_Success: "User profile created successfully in Forgerock AIC",
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

// Declare Global Variables
var extDomain = null;
var intDomain = null;
var uuid = null;
var createdId = null;
var mapfactorID = null;
var ConnectorName = null;
var usrType = "Internal";
var email = null;
var domain = null;
var availableFactors = {};
var missingInputs = [];
var sAMAccountName = null;
var usrKOGID = null;
var usrFirstName = null;
var usrLastName = null;
var usrEmailAddress = null;
var usrUPN = null;
var usrLogon = null;
var usrSymantecVIPCredentialID = null;
var PhoneNumbers = null;
var usrLanguagePreference = null;
var usrOktaVerify = null;
var usrUserStatus = null;
var UserNameAttribute = null;
var jsonObj = {};
var result = {};
var createUserSuccess = false;
var userInputmail = {};

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


if(nodeState.get("userInputmail") && nodeState.get("userInputmail")!=null){
    userInputmail = nodeState.get("userInputmail");     
}  else {
     missingInputs.push(nodeConfig.missingDomain);
}

if(nodeState.get("domain") && nodeState.get("domain")!=null){
    domain = nodeState.get("domain").toLowerCase();     
}  else {
     missingInputs.push(nodeConfig.missingDomain);
}

if(nodeState.get("mail") != null && typeof nodeState.get("mail") != "undefined") {
    email = nodeState.get("mail").toLowerCase();      
}  else {
     missingInputs.push(nodeConfig.missingEmail);
}

if (nodeState.get("KOGID") != null) {
    usrKOGID = nodeState.get("KOGID");
} else {
    missingInputs.push(nodeConfig.missingKOGID);
}

if (nodeState.get("FirstName") != null) {
    usrFirstName = nodeState.get("FirstName");
} else {
    missingInputs.push(nodeConfig.missingFirstName);
}

if (nodeState.get("LastName") != null) {
    usrLastName = nodeState.get("LastName");
} else {
    missingInputs.push(nodeConfig.missingLastName);
}

if (nodeState.get("EmailAddress") != null) {
    usrEmailAddress = nodeState.get("EmailAddress");
} else {
    missingInputs.push(nodeConfig.missingEmailAddress);
}

if (nodeState.get("UPN") != null) {
    usrUPN = nodeState.get("UPN");
} else {
    missingInputs.push(nodeConfig.missingUPN);
}

if (nodeState.get("Logon") != null) {
    usrLogon = nodeState.get("Logon");
} else {
    missingInputs.push(nodeConfig.missingLogon);
}

if (nodeState.get("SymantecVIPCredentialID") != null) {
    usrSymantecVIPCredentialID = nodeState.get("SymantecVIPCredentialID");
}

if (nodeState.get("PhoneNumbers") != null) {
    PhoneNumbers = nodeState.get("PhoneNumbers");
}

if (nodeState.get("LanguagePreference") != null) {
    usrLanguagePreference = nodeState.get("LanguagePreference");
} else {
    missingInputs.push(nodeConfig.missingLanguagePreference);
}

if (nodeState.get("OktaVerify") != null) {
    usrOktaVerify = nodeState.get("OktaVerify");
} else {
    missingInputs.push(nodeConfig.missingOktaVerify);
}

if (nodeState.get("UserStatus") != null) {
    usrUserStatus = nodeState.get("UserStatus");
} else {
    missingInputs.push(nodeConfig.missingUserStatus);
}

if (systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain") != null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();
} else {
    missingInputs.push(nodeConfig.missingExternalDomain);
}

if(systemEnv.getProperty("esv.kyid.ext.connector.attr") && systemEnv.getProperty("esv.kyid.ext.connector.attr")!=null) {
    UserNameAttribute = systemEnv.getProperty("esv.kyid.ext.connector.attr");   
}  else {
     missingInputs.push(nodeConfig.missingConnectorAttrs);
}

if(extDomain.localeCompare(domain)==0){
    usrType = "External";
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.extUser);  
    if(systemEnv.getProperty("esv.kyid.ext.connector") && systemEnv.getProperty("esv.kyid.ext.connector")!=null) {
        ConnectorName = systemEnv.getProperty("esv.kyid.ext.connector").toLowerCase();    
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }  else {
         missingInputs.push(nodeConfig.missingConnectorInfo);
    }
} else {
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser);
    if(domain && domain!=null){
        ConnectorName = domain.replace(/\./g, '');
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}


// Checks if mandatory input params are missing
if (missingInputs.length > 0) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);

} else {
    result = queryLDAP(ConnectorName,"userPrincipalName",usrUPN.toLowerCase());

    if(result.records===0){
        result = queryLDAP(ConnectorName,UserNameAttribute,email);
    }    

    if(result.records>0) {
        var ldapUser = result.data;
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapConnSuccess
            + "::" + nodeConfig.userFound);
        sAMAccountName = ldapUser.sAMAccountName;

    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.ldapConnSuccess
            + "::" + nodeConfig.userNotFound);
        action.goTo(nodeOutcome.ERROR);
    }

    jsonObj['frIndexedString5'] = userInputmail;
    jsonObj['givenName'] = usrFirstName;
    jsonObj['sn'] = usrLastName;
    jsonObj['mail'] = usrEmailAddress;
    jsonObj['frIndexedString1'] = usrUPN;
    jsonObj['frIndexedString2'] = usrLogon;
    jsonObj['frIndexedString3'] = sAMAccountName;
    jsonObj['userName'] = usrKOGID;
    if (nodeState.get("PhoneNumbers") != null && typeof nodeState.get("PhoneNumbers") != "undefined") {
        jsonObj['frUnindexedMultivalued1'] = PhoneNumbers;
    }
    jsonObj['frUnindexedString3'] = usrLanguagePreference;
    jsonObj['frUnindexedString1'] = usrType;
    if (nodeState.get("SymantecVIPCredentialID") != null && typeof nodeState.get("SymantecVIPCredentialID") != "undefined") {
        jsonObj['frIndexedString4'] = usrSymantecVIPCredentialID;
    }
    jsonObj['frUnindexedString2'] = domain;
    jsonObj['frIndexedInteger1'] = usrOktaVerify;

    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(jsonObj));

    try {
        //An exception is thrown if the object could not be created.
        var createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
        createdId = createUserResponse._id;
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createUsrProfileIDM_Success);
        createUserSuccess=true;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmCreateOperationFailed + "::" + error);
        action.goTo(nodeOutcome.ERROR);
    }


    try {
        if (createUserSuccess) {
            //logger.error("Creating user with following MFA details: " + usrEmailAddress + "|" + usrMobilePhoneNumber + "|" + usrSymantecVIPCredentialID);
            if (usrEmailAddress != null && typeof usrEmailAddress != "undefined") {
                if (!lookupInMFAObject(usrKOGID, usrEmailAddress)) {
                    nodeLogger.debug("Creating MFA Email factor");
                    createMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE");
                }
            }
            if (PhoneNumbers != null && typeof PhoneNumbers != "undefined") {
                  //logger.error("Length of Array is ---" +PhoneNumbers.length )
                  var j= 0;
                    for (j=0; j < PhoneNumbers.length; j++) {
                    //logger.error("Inside For Loop-------" + PhoneNumbers[j])
                    var usrMobilePhoneNumber = PhoneNumbers[j];
                    if (!lookupInMFAObject(usrKOGID, usrMobilePhoneNumber)) {
                        nodeLogger.debug("Creating MFA SMSVOICE factor");
                        createMFAObject(usrKOGID, "SMSVOICE", usrMobilePhoneNumber, "ACTIVE");
                        //logger.error("created" +usrMobilePhoneNumber);
                    }  else {
                        nodeLogger.debug("Not creating MFA SMSVOICE factor")
                    }
                }
                }
            
            if (usrSymantecVIPCredentialID != null && typeof usrSymantecVIPCredentialID != "undefined") {
                if (!lookupInMFAObject(usrKOGID, usrSymantecVIPCredentialID)) {
                    nodeLogger.debug("Creating MFA SYMANTEC factor");
                    createMFAObject(usrKOGID, "SYMANTEC", usrSymantecVIPCredentialID, "ACTIVE");
                }
            }
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmPatchOperationFailed + "::" + error);
        action.goTo(nodeOutcome.ERROR);
    }

    action.goTo(nodeOutcome.SUCCESS);

}


function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    //logger.error("MFA Method is being registered for " + usrKOGID + " and the method is "+method+" and value is "+usrMfaValue);
    var mfajsonObj = {};
    mfajsonObj['KOGId'] = usrKOGID;
    mfajsonObj['MFAMethod'] = method;
    mfajsonObj['MFAValue'] = usrMfaValue;
    mfajsonObj['MFAStatus'] = status;
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(mfajsonObj));
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}


function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                return true;
            }
        }
    }
    return false;
}


function queryLDAP(ConnectorName,UserNameAttribute,UserNameAttributeValue){

    var records = 0;
    var result = {};
    result['records']=records;
    result['data']="No Record Found";
    var query = {_queryFilter: UserNameAttribute+` eq "`+UserNameAttributeValue+ `"`,}
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQuery+"::"+JSON.stringify(query));
    
    try{
        // Query to check if user exists in AD
         var ldapUserQuery = openidm.query(`system/`+ConnectorName+`/User`,query);
         records = ldapUserQuery.result.length;
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryTotalRecords+"::"+records);
         nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ldapQueryPrintRecords+"::"+JSON.stringify(ldapUserQuery.result));
         result['records']=records;
         result['data']=ldapUserQuery.result[0];
        
     } catch(error) {
         nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
     }

    nodeLogger.debug("LDAP Query result length: "+result.records);
    nodeLogger.debug("LDAP Query user data: "+result.data);
    return result;
}

