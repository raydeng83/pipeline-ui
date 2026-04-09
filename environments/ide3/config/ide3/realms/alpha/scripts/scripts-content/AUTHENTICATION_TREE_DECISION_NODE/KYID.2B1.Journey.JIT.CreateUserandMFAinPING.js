/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
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
  missingUserStatus: "Missing UserStatus for KOG User",
  missingConnectorInfo: "Missing connector details",
  missingConnectorAttrs: "Missing connector attributes",
  missingUserId: "Missing userId",
  missingTelephoneNumber: "Missing telephoneNumber",
  missingDisplayName: "Missing displayName",
  missingPostalCode: "Missing postalCode",
  missingCountryCode: "Missing countryCode",
  missingGivenName: "Missing givenName",
  missingCn: "Missing cn",
  missingSn: "Missing sn",
  missingObjectGUID: "Missing objectGUID",
  missingPwdLastSet: "Missing pwdLastSet",
  missingUserType: "Missing userType",
  missingSAMAccountName: "Missing sAMAccountName",
  missingConnectorName: "Missing connector name",
  missingOrganDonorStatus: " Missing OrganDonorStatus",
  missingAddress2:" Missing Address2",
  missingAddress1:" Missing Address1",
  missingAccountTypeCode:" Missing AccountTypeCode",
  missingBase64EncodedKOGID:"Missing Base64EncodedKOGID",
  missingAULevel1Code:"Missing AULevel1Code",
  missingAULevel2Code:"Missing Missing AULevel2Code",
  missingAULevel3Code:"Missing AULevel3Code",
  missingAULevel4Code:"Missing AULevel4Code",
  missingAULevel5Code:"Missing AULevel5Code",
  missingWindowsAccName:" Missing missingWindowsAccName",
  ldapConnSuccess: "Connected to AD successfully",
  userFound: "User Found in AD",
  userNotFound: "User Not Found in AD",
  idmCreateOperationFailed: "IDM Create Operation Failed",
  idmPatchOperationFailed: "IDM Patch Operation Failed",
  createUsrProfileIDM_Success:
    "User profile created successfully in Forgerock AIC",
  ConnectorName: "ConnectorName",
  missingDomain: "Missing user domain",
  missingEmail: "Missing email",
  missingKOGID:"Missing KOGID",
  missingLanguagePreference: "Missing Language Preference",

  end: "Node Execution Completed",
};

// Node outcomes
var nodeOutcome = {
  SUCCESS: "True",
  ERROR: "False",
};

// Declare Global Variables
var createdId = null;
var ConnectorName = null;
//var usrType = "Internal";
var email = null;
var missingInputs = [];
var sAMAccountName = "";
var usrFirstName = null;
var usrLastName = null;
var usrEmailAddress = null;
var PhoneNumbers = "";
var usrUserStatus = null;
var UserNameAttribute = null;
var jsonObj = {};
var result = {};
var createUserSuccess = false;
var userInputmail = {};
var usrType="Internal";
var auLevel1Code="";
var auLevel2Code="";
var address1 ="";
var address2 ="";
var usrKOGID="";
var OrganDonorStatus= null;
var userId="";
var countryCode="";
var postalCode="";
var middleName="";
var city="";
var state="";
var symantecVIPCredentialID="";
var OKTAVerify="";
//var userStatus="";
var passwordLastModifiedDate="";
var sAMAccountName="";


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
  },
};

if (nodeState.get("userId") && nodeState.get("userId") != null) {
   userId = nodeState.get("userId");
} 
else {
  missingInputs.push(nodeConfig.missingUserId);
}

if (
  nodeState.get("telephoneNumber") &&
  nodeState.get("telephoneNumber") != null
) {
  var telephoneNumber = nodeState.get("telephoneNumber");
} 

if (nodeState.get("EmailAddress") && nodeState.get("EmailAddress") != null) {
  var userMail = nodeState.get("EmailAddress");
} else {
  missingInputs.push(nodeConfig.missingEmailAddress);
}

if (nodeState.get("postalCode") && nodeState.get("postalCode") != null) {
   postalCode = nodeState.get("postalCode");
} 

if (nodeState.get("countryCode") && nodeState.get("countryCode") != null) {
   countryCode = nodeState.get("countryCode");
}  

if (nodeState.get("MiddleName") && nodeState.get("MiddleName") != null) {
   middleName = nodeState.get("MiddleName");
}  

if (nodeState.get("City") && nodeState.get("City") != null) {
   city = nodeState.get("City");
} 

if (nodeState.get("State") && nodeState.get("State") != null) {
   state = nodeState.get("State");
} 

if(nodeState.get("UPN") && nodeState.get("UPN")!= null) {
     usrUPN = nodeState.get("UPN");   
}  else {
     missingInputs.push(nodeConfig.missingUPN);
}

/*if (nodeState.get("objectGUID") && nodeState.get("objectGUID") != null) {
  var objectGUID = nodeState.get("objectGUID");
} else {
  missingInputs.push(nodeConfig.missingObjectGUID);
}*/
if(systemEnv.getProperty("esv.kyid.ext.ad.domain") && systemEnv.getProperty("esv.kyid.ext.ad.domain")!=null) {
    extDomain = systemEnv.getProperty("esv.kyid.ext.ad.domain").toLowerCase();  
}  else {
     missingInputs.push(nodeConfig.missingExternalDomain);
}

if (nodeState.get("LastName") && nodeState.get("LastName") != null) {
  var sn = nodeState.get("LastName");
} else {
  missingInputs.push(nodeConfig.missingSn);
}

if (nodeState.get("FirstName") && nodeState.get("FirstName") != null) {
  var givenName = nodeState.get("FirstName");
} else {
  missingInputs.push(nodeConfig.missingGivenName);
}

if (nodeState.get("pwdLastSet") && nodeState.get("pwdLastSet") != null) {
  var pwdLastSet = nodeState.get("pwdLastSet");
} else {
  missingInputs.push(nodeConfig.missingPwdLastSet);
}

if (nodeState.get("AULevel1Name") && nodeState.get("AULevel1Name") != null) {
   auLevel1Code = nodeState.get("AULevel1Name");
} 
if (nodeState.get("AULevel2Name") && nodeState.get("AULevel2Name") != null) {
  auLevel2Code = nodeState.get("AULevel2Name");
} 
if (nodeState.get("AULevel3Code") && nodeState.get("AULevel3Code") != null) {
  var auLevel3Code = nodeState.get("AULevel3Code");
} else {
  missingInputs.push(nodeConfig.missingAULevel3Code);
}
if (nodeState.get("AULevel4Code") && nodeState.get("AULevel4Code") != null) {
  var auLevel4Code = nodeState.get("AULevel4Code");
} else {
  missingInputs.push(nodeConfig.missingAULevel4Code);
}
if (nodeState.get("AULevel5Code") && nodeState.get("AULevel5Code") != null) {
  var auLevel5Code = nodeState.get("AULevel5Code");
} else {
  missingInputs.push(nodeConfig.missingAULevel5Code);
}
if (nodeState.get("Base64EncodedKOGID") && nodeState.get("Base64EncodedKOGID") != null) {
  var base64EncodedKOGID = nodeState.get("Base64EncodedKOGID");
} else {
  missingInputs.push(nodeConfig.missingBase64EncodedKOGID);
}
if (nodeState.get("AccountTypeCode") && nodeState.get("AccountTypeCode") != null) {
  var accountTypeCode = nodeState.get("AccountTypeCode");
} else {
  missingInputs.push(nodeConfig.missingAccountTypeCode);
}
if (nodeState.get("Address1") && nodeState.get("Address1") != null) {
address1 = nodeState.get("Address1");
} 
if (nodeState.get("Address2") && nodeState.get("Address2") != null) {
   address2 = nodeState.get("Address2");
} 
if (nodeState.get("OrganDonorStatus")) {
   OrganDonorStatus = nodeState.get("OrganDonorStatus"); 
} 

if (nodeState.get("KOGID") != null) {
   var usrKOGID = nodeState.get("KOGID");
} else {
    missingInputs.push(nodeConfig.missingKOGID);
}

if( nodeState.get("Logon") && nodeState.get("Logon")!=null) {
     var usrLogon = nodeState.get("Logon"); 
}  else {
     missingInputs.push(nodeConfig.missingLogon);
}

if(nodeState.get("PhoneNumbers") && nodeState.get("PhoneNumbers")!=null) {
     PhoneNumbers = nodeState.get("PhoneNumbers"); 
} 


if(nodeState.get("LanguagePreference")&& nodeState.get("LanguagePreference")!=null) {
     usrLanguagePreference = nodeState.get("LanguagePreference");   
}  else {
     missingInputs.push(nodeConfig.missingLanguagePreference);
}

if(nodeState.get("domain") && nodeState.get("domain")!=null){
    domain = nodeState.get("domain").toLowerCase();     
}

if(nodeState.get("SymantecVIPCredentialID") && nodeState.get("SymantecVIPCredentialID")!=null){
    symantecVIPCredentialID = nodeState.get("SymantecVIPCredentialID").toLowerCase();     
}
if(nodeState.get("passwordLastModifiedDate") && nodeState.get("passwordLastModifiedDate")!=null){
    passwordLastModifiedDate = nodeState.get("passwordLastModifiedDate").toLowerCase();     
}
if(nodeState.get("sAMAccountName") && nodeState.get("sAMAccountName")!=null){
    sAMAccountName = nodeState.get("sAMAccountName").toLowerCase();     
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
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.intUser)
    usrType="Internal";
    if(domain && domain!=null){
       // ConnectorName = domain.replace(/\./g, '');
         ConnectorName = systemEnv.getProperty("esv.kyid.internal.connector").toLowerCase()
       // ConnectorName = "kyinternalgov"
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.ConnectorName+"::"+ConnectorName);
    }
}


/*if (nodeState.get("userType") && nodeState.get("userType") != null) {
  var userType = nodeState.get("userType");
} else {
  missingInputs.push(nodeConfig.missingUserType);
}*/
if (nodeState.get("windowsAccName") && nodeState.get("windowsAccName") != null) {
  var windowsAccName = nodeState.get("windowsAccName");
} else {
  missingInputs.push(nodeConfig.missingWindowsAccName);
}
/*if (
  nodeState.get("sAMAccountName") &&
  nodeState.get("sAMAccountName") != null
) {
   sAMAccountName = nodeState.get("sAMAccountName");
} */

//if user created failed from self registration journey earlier, this flag will be changed to true from false upon JIT
// var jsonObj = {};
// jsonObj["operation"] = "replace";
// jsonObj["field"] = "custom_ADFlag";
// jsonObj["value"] = true;
// jsonArray.push(jsonObj);


if (nodeState.get("ConnectorName") && nodeState.get("ConnectorName") != null) {
  var connectorName = nodeState.get("ConnectorName");
} else {
  missingInputs.push(nodeConfig.missingConnectorName);
}

var newpassword = nodeState.get("password");

if(missingInputs.length>0){
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
    action.goTo(nodeOutcome.ERROR);
}
else{
logger.debug("CreatingUserInAIC");
 jsonObj["mail"] = userMail;
jsonObj["postalCode"] = postalCode;
jsonObj["country"] = countryCode;
jsonObj["userName"] = usrKOGID;
jsonObj["sn"] = sn;
jsonObj["givenName"] = givenName;
jsonObj["passwordLastChangedTime"] = pwdLastSet;
//jsonObj["passwordLastChangedTime"] = passwordLastModifiedDate;    
jsonObj["frUnindexedString1"] =  usrType
jsonObj["frIndexedString3"] = sAMAccountName;
jsonObj["frUnindexedString2"] = connectorName;
jsonObj["custom_organdonor"] = OrganDonorStatus;
jsonObj["custom_postalAddress2"] = address2;
if(address1.length>0){
    jsonObj["postalAddress"] = address1;
}
jsonObj["custom_kogAccountType"] = accountTypeCode;
jsonObj["custom_base64KOGId"] = base64EncodedKOGID;
jsonObj["custom_approvalUnit5Code"] = auLevel5Code;
jsonObj["custom_approvalUnit4Code"] = auLevel4Code;
jsonObj["custom_approvalUnit3Code"] = auLevel3Code;
jsonObj["custom_approvalUnit2Code"] = auLevel2Code;
jsonObj["custom_approvalUnit1Code"] = auLevel1Code;
jsonObj["custom_windowsAccountName"] = windowsAccName;
jsonObj["frIndexedString1"] = usrUPN;
jsonObj["accountStatus"] = "active";
jsonObj["custom_ADFlag"] = true;
jsonObj["frIndexedString2"] = usrLogon;
if(PhoneNumbers.length>0){
    jsonObj["frUnindexedMultivalued1"] = PhoneNumbers;
}
jsonObj["frUnindexedString3"] = "en";
if(symantecVIPCredentialID){
    jsonObj['frIndexedString4'] = symantecVIPCredentialID;
    logger.eror("inside symantecVIPCredentialID "+ symantecVIPCredentialID)
}
//jsonObj['frIndexedString4'] = symantecVIPCredentialID;
/*jsonObj["custom_middleName"] = middleName;
jsonObj["city"] = city;
jsonObj["stateProvince"] = state;
jsonObj["frIndexedString4"] = symantecVIPCredentialID;*/

    
nodeLogger.error(
  nodeConfig.timestamp +
    "::" +
    nodeConfig.node +
    "::" +
    nodeConfig.nodeName +
    "::" +
    nodeConfig.script +
    "::" +
    nodeConfig.scriptName +
    "::" +
    JSON.stringify(jsonObj)
);
}

try {
  //An exception is thrown if the object could not be created.
  var createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
  createdId = createUserResponse._id;
    nodeState.putShared("usrcreatedId",createdId)
  nodeLogger.debug(
    nodeConfig.timestamp +
      "::" +
      nodeConfig.node +
      "::" +
      nodeConfig.nodeName +
      "::" +
      nodeConfig.script +
      "::" +
      nodeConfig.scriptName +
      "::" +
      nodeConfig.createUsrProfileIDM_Success
  );
  createUserSuccess = true;

//Adding this logic to create the MFA object for new users
    try {
        if (createUserSuccess) {
            logger.debug("Creating user with following MFA details: " + userMail + "|" + PhoneNumbers + "|" + symantecVIPCredentialID);
            if (userMail != null && typeof userMail != "undefined") {
                if (!lookupInMFAObject(usrKOGID, userMail)) {
                    nodeLogger.debug("Creating MFA Email factor");
                    createMFAObject(usrKOGID, "EMAIL", userMail, "ACTIVE", true);
                }
            }
            if (PhoneNumbers != null && typeof PhoneNumbers != "undefined") {
                  logger.debug("Length of Array is ---" +PhoneNumbers.length )
                  var j= 0;
                    for (j=0; j < PhoneNumbers.length; j++) {
                    logger.debug("Inside For Loop" + PhoneNumbers[j])
                    var usrMobilePhoneNumber = PhoneNumbers[j];
                    if (!lookupInMFAObject(usrKOGID, usrMobilePhoneNumber)) {
                        nodeLogger.debug("Creating MFA SMSVOICE factor");
                        createMFAObject(usrKOGID, "SMSVOICE", usrMobilePhoneNumber, "ACTIVE",false);
                        logger.debug("created" +usrMobilePhoneNumber);
                    }  else {
                        nodeLogger.debug("Not creating MFA SMSVOICE factor")
                    }
                }
                }
            
            //if (symantecVIPCredentialID != null && typeof symantecVIPCredentialID != "undefined") {
            if (symantecVIPCredentialID && typeof symantecVIPCredentialID === "string" && symantecVIPCredentialID.trim() !== "") {
                logger.debug("inside symantecVIPCredentialID mfa")
                if (!lookupInMFAObject(usrKOGID, symantecVIPCredentialID)) {
                    nodeLogger.debug("Creating MFA SYMANTEC factor");
                    createMFAObject(usrKOGID, "SYMANTEC", symantecVIPCredentialID, "ACTIVE",true);
                }
            }
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmPatchOperationFailed + "::" + error);
        action.goTo(nodeOutcome.ERROR);
    }
  action.goTo(nodeOutcome.SUCCESS);
} catch (error) {
  nodeLogger.error(
    nodeConfig.timestamp +
      "::" +
      nodeConfig.node +
      "::" +
      nodeConfig.nodeName +
      "::" +
      nodeConfig.script +
      "::" +
      nodeConfig.scriptName +
      "::" +
      nodeConfig.idmCreateOperationFailed +
      "::" +
      error
  );
  action.goTo(nodeOutcome.ERROR);
}

function createMFAObject(usrKOGID, method, usrMfaValue, status,isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);
    var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status,
        'isRecoveryOnly':isRecoveryOnly
    };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}


function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
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
