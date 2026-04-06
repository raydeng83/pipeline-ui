/**
 * Script: KYID.Journey.ReadUserKOGProfileInfo
 * Description: This script is used to invoke KOG userProfileAPI.
 * Date: 26th July 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get KOG User Profile",
    script: "Script",
    scriptName: "KYID.Journey.ReadUserKOGProfileInfo",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingEmail: "Missing email",
    emailInfoInSession: "emailaddress value in session",
    missingKogUsrProfileAPIInfo: "Missing KOG UserProfile API details",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke profile api as required parameters are missing.",
    apiRequest_KOG_USR_PROFILE: "KOG_USR_PROFILE",
    apiRespParam_FirstName: "FirstName",
    apiRespParam_LastName: "LastName",
    apiRespParam_EmailAddress: "EmailAddress",
    apiRespParam_UPN: "UPN",
    apiRespParam_Logon: "Logon",
    apiRespParam_KOGID: "KOGID",
    apiRespParam_LanguagePreference: "LanguagePreference",
    apiRespParam_PhoneNumbers: "PhoneNumbers",
    apiRespParam_SymantecVIPCredentialID: "SymantecVIPCredentialID",
    apiRespParam_OktaVerify: "OktaVerify",
    apiRespParam_UserStatus: "UserStatus",
    apiResponse_KOG_TOKEN: "KOG_TOKEN_API_RESPONSE",
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE",
    apiResponseStatus: "Status",
    apiResponsePass: "API_RESULT_SUCCESS",
    apiResponseFail: "API_RESULT_FAILURE",
    apiRespFailMsgCode: "MessageCode",
    apiRespFailMsg_114: "-114",
    idmQueryFail: "IDM Query Operation Failed",
    usrRecord: "User Record",
    registeredMFAMethods: "Registered MFA methods",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    FAIL: "Failed",
    PROFILE_NOT_FOUND: "NotFound",
    INVALID_USR: "Invalid",
    STUB_ACCOUNT: "StubAccount"
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
var FirstName = null;
var LastName = null;
var EmailAddress = null;
var UPN = null;
var Logon = null;
var KOGID = null;
var LanguagePreference = null;
var MobilePhoneNumber = null;
var PhoneNumbers = null;
var SymantecVIPCredentialID = null;
var OktaVerify = null;
var UserStatus = null;
var mail = null;

nodeLogger.error("le-deng-log: start of KOG");

userProfileString = '{"FirstName":"Teganb","LastName":"Teganbb","EmailAddress":"SIT_KYAUG10_I_48@mailinator.com","UPN":"SIT_KYAUG10_I_48@kytest.dev.ky.gov","Logon":"SIT_KYAUG10_I_48@kytest.dev.ky.gov","KOGID":"21cca5cf-0f93-4c83-b4ca-b3c93bd5bf78","LanguagePreference":"1","MobilePhoneNumber":null,"PhoneNumbers":null,"SymantecVIPCredentialID":null,"OktaVerify":0,"UserStatus":1}';

nodeState.putShared("kogUserProfileAPIResponse", userProfileString);
nodeLogger.error("le-deng-log:  " + userProfileString);
var response = JSON.parse(userProfileString);
nodeLogger.error("le-deng-log: response: " + userProfileString);

for (var key in response) {
    var keyData = key.toLowerCase();
    nodeLogger.error("le-deng-log: key: " + key);

    if (keyData.localeCompare(nodeConfig.apiRespParam_FirstName.toLowerCase()) == 0) {
        FirstName = response[key];
        nodeState.putShared("FirstName", FirstName);
        nodeLogger.error("le-deng-log: start of KOG: " + FirstName);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_LastName.toLowerCase()) == 0) {
        LastName = response[key];
        nodeState.putShared("LastName", LastName);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_EmailAddress.toLowerCase()) == 0) {
        EmailAddress = response[key];
        nodeState.putShared("EmailAddress", EmailAddress);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_UPN.toLowerCase()) == 0) {
        UPN = response[key];
        nodeState.putShared("UPN", UPN);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_Logon.toLowerCase()) == 0) {
        Logon = response[key];
        nodeState.putShared("Logon", Logon);
        var domain = Logon.split("@");
        nodeState.putShared("domain", domain[1]);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_LanguagePreference.toLowerCase()) == 0) {
        LanguagePreference = response[key];
        nodeState.putShared("LanguagePreference", LanguagePreference);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_PhoneNumbers.toLowerCase()) == 0) {
        PhoneNumbers = response[key];
        nodeState.putShared("PhoneNumbers", PhoneNumbers);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_KOGID.toLowerCase()) == 0) {
        KOGID = response[key];
        nodeState.putShared("KOGID", KOGID);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_SymantecVIPCredentialID.toLowerCase()) == 0) {
        SymantecVIPCredentialID = response[key];
        nodeState.putShared("SymantecVIPCredentialID", SymantecVIPCredentialID);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_OktaVerify.toLowerCase()) == 0) {
        OktaVerify = response[key];
        nodeState.putShared("OktaVerify", OktaVerify);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_UserStatus.toLowerCase()) == 0) {
        UserStatus = response[key];
        nodeState.putShared("UserStatus", UserStatus);
    }

}

if (UserStatus == 2 || UserStatus == 3) {
    action.goTo(nodeOutcome.INVALID_USR);
} else if (UserStatus == -1) {
    action.goTo(nodeOutcome.STUB_ACCOUNT);
} else if (UserStatus == 1) {
    action.goTo(nodeOutcome.SUCCESS).putSessionProperty('domain', domain[1])
        .putSessionProperty("upn", UPN)
        .putSessionProperty("KOGID", KOGID);
} else {
    action.goTo(nodeOutcome.FAIL);
}