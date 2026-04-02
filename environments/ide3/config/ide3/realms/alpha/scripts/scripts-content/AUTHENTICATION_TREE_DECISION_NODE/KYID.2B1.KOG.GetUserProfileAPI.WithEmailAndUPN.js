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
  apiRespParam_OktaVerify: "OKTAVerify",
  apiRespParam_UserStatus: "UserStatus",
  apiRespParam_AULevel5Code: "AULevel5Code",
  apiRespParam_AULevel4Code: "AULevel4Code",
  apiRespParam_AULevel3Code: "AULevel3Code",
  apiRespParam_AULevel2Code: "AULevel2Name",
  apiRespParam_AULevel1Code: "AULevel1Name",
  apiRespParam_Base64EncodedKOGID: "Base64EncodedKOGID",
  apiRespParam_AccountTypeCode: "AccountTypeCode",
  apiRespParam_Address1: "Address1",
  apiRespParam_Address2: "Address2",
  apiRespParam_OrganDonorStatus: "OrganDonorStatus",
  apiRespParam_ZipCode: "ZipCode",
  apiRespParam_MiddleName: "MiddleName",
  apiRespParam_City: "City",
  apiRespParam_State: "State",
  apiRespParam_sAMAccountName: "MIMSAMAccountName",
  apiRespParam_PasswordLastModifiedDate: "PasswordLastModifiedDate", 
  apiResponse_KOG_TOKEN: "KOG_TOKEN_API_RESPONSE",
  apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE",
  apiResponse_Status: "Status",
  apiResponsePass: "API_RESULT_SUCCESS",
  apiResponseFail: "API_RESULT_FAILURE",
  apiRespFailMsgCode: "MessageCode",
  apiRespFailMsg_114: "-114",
  apiRespFailMsg_115: "-115",
  idmQueryFail: "IDM Query Operation Failed",
  usrRecord: "User Record",
  registeredMFAMethods: "Registered MFA methods",
  end: "Node Execution Completed",
  apiResponseStatus: "Status",
};

// Node outcomes
var nodeOutcome = {
  SUCCESS: "Successful",
  FAIL: "Failed",
  INVALID_USR: "Invalid",
  STUB_ACCOUNT: "StubAccount"
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
  },
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
var ZipCode= null;
var MiddleName=null;
var City=null;
var State=null;
var PasswordLastModifiedDate= null;
var sAMAccountName=null;


/*if (typeof existingSession !== 'undefined')
{
  mail = existingSession.get("emailaddress");
  nodeState.putShared("mail",mail);
  nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                 +"::"+nodeConfig.scriptName+"::"+nodeConfig.emailInfoInSession+"::"+mail);  
    
} else{
    if(nodeState.get("mail")) {
     mail = nodeState.get("mail");
    }  else {
     missingInputs.push(nodeConfig.missingEmail);
    }
}
*/
function fetchKOGUserData(apiResponse) {
  nodeState.putShared(
    "kogUserProfileAPIResponse",
    JSON.stringify(apiResponse.UserDetails),
  );
  logger.debug(
    "NewkogUserProfileAPIResponse" + JSON.stringify(apiResponse.UserDetails),
  );
  var response = JSON.parse(JSON.stringify(apiResponse.UserDetails));
  logger.debug("ResponseValue2:" + response);
  for (var key in response) {
    var keyData = key.toLowerCase();

    if (
      keyData.localeCompare(nodeConfig.apiRespParam_FirstName.toLowerCase()) ==
      0
    ) {
      FirstName = response[key];
      nodeState.putShared("FirstName", FirstName);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_LastName.toLowerCase()) == 0
    ) {
      LastName = response[key];
      nodeState.putShared("LastName", LastName);
    }
      if (
      keyData.localeCompare(nodeConfig.apiRespParam_ZipCode.toLowerCase()) == 0
    ) {
      ZipCode = response[key];
      nodeState.putShared("postalCode", ZipCode);
    } 
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_EmailAddress.toLowerCase(),
      ) == 0
    ) {
      EmailAddress = response[key];
      nodeState.putShared("EmailAddress", EmailAddress);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_UPN.toLowerCase()) == 0) {
      UPN = response[key];
      nodeState.putShared("UPN", UPN);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_Logon.toLowerCase()) == 0
    ) {
      Logon = response[key];
      nodeState.putShared("Logon", Logon);
      var domain = Logon.split("@");
      var domainValue = domain[1].split(".");
      var prefix = domainValue[0];
      nodeState.putShared("domain", domain[1]);
      nodeState.putShared("windowsAccName", prefix + "\\" + domain[0]);
    }

    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_LanguagePreference.toLowerCase(),
      ) == 0
    ) {
      LanguagePreference = response[key];
      nodeState.putShared("LanguagePreference", LanguagePreference);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_PhoneNumbers.toLowerCase(),
      ) == 0
    ) {
      PhoneNumbers = response[key];
      nodeState.putShared("PhoneNumbers", PhoneNumbers);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_KOGID.toLowerCase()) == 0
    ) {
      KOGID = response[key];
      nodeState.putShared("KOGID", KOGID);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_KOGID.toLowerCase()) == 0
    ) {
      KOGID = response[key];
      nodeState.putShared("KOGID", KOGID);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_SymantecVIPCredentialID.toLowerCase(),
      ) == 0
    ) {
      SymantecVIPCredentialID = response[key];
      nodeState.putShared("SymantecVIPCredentialID", SymantecVIPCredentialID);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_OktaVerify.toLowerCase()) ==
      0
    ) {
      OktaVerify = response[key];
      nodeState.putShared("OKTAVerify", OktaVerify);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_UserStatus.toLowerCase()) ==
      0
    ) {
      UserStatus = response[key];
      nodeState.putShared("UserStatus", UserStatus);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AULevel1Code.toLowerCase(),
      ) == 0
    ) {
      AULevel1Name = response[key];
      nodeState.putShared("AULevel1Name", AULevel1Name);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AULevel2Code.toLowerCase(),
      ) == 0
    ) {
      AULevel2Name = response[key];
      nodeState.putShared("AULevel2Name", AULevel2Name);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AULevel3Code.toLowerCase(),
      ) == 0
    ) {
      AULevel3Code = response[key];
      nodeState.putShared("AULevel3Code", AULevel3Code);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AULevel4Code.toLowerCase(),
      ) == 0
    ) {
      AULevel4Code = response[key];
      nodeState.putShared("AULevel4Code", AULevel4Code);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AULevel5Code.toLowerCase(),
      ) == 0
    ) {
      AULevel5Code = response[key];
      nodeState.putShared("AULevel5Code", AULevel5Code);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_Base64EncodedKOGID.toLowerCase(),
      ) == 0
    ) {
      Base64EncodedKOGID = response[key];
      nodeState.putShared("Base64EncodedKOGID", Base64EncodedKOGID);
    }
    if (
      keyData.localeCompare(
        nodeConfig.apiRespParam_AccountTypeCode.toLowerCase(),
      ) == 0
    ) {
      AccountTypeCode = response[key];
      nodeState.putShared("AccountTypeCode", AccountTypeCode);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_Address1.toLowerCase()) == 0
    ) {
      Address1 = response[key];
      nodeState.putShared("Address1", Address1);
    }
    if (
      keyData.localeCompare(nodeConfig.apiRespParam_Address2.toLowerCase()) == 0
    ) {
      Address2 = response[key];
      nodeState.putShared("Address2", Address2);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_OrganDonorStatus.toLowerCase())==0) {
      OrganDonorStatus = response[key];
      nodeState.putShared("OrganDonorStatus", OrganDonorStatus);
    }

    if (keyData.localeCompare(nodeConfig.apiRespParam_MiddleName.toLowerCase())==0) {
      MiddleName = response[key];
      nodeState.putShared("MiddleName", MiddleName);
    }

    if (keyData.localeCompare(nodeConfig.apiRespParam_City.toLowerCase())==0) {
      City = response[key];
      nodeState.putShared("City", City);
    }

    if (keyData.localeCompare(nodeConfig.apiRespParam_State.toLowerCase())==0) {
      State = response[key];
      nodeState.putShared("State", State);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_sAMAccountName.toLowerCase())==0) {
      sAMAccountName = response[key];
      nodeState.putShared("sAMAccountName", sAMAccountName);
    }
    if (keyData.localeCompare(nodeConfig.apiRespParam_PasswordLastModifiedDate.toLowerCase())==0) {
      PasswordLastModifiedDate = response[key];
      nodeState.putShared("passwordLastModifiedDate", PasswordLastModifiedDate);
    }
      
  }
  if (UserStatus == 2 || UserStatus == 3) {
    logger.debug("InsideInvalidUser");
    action.goTo(nodeOutcome.INVALID_USR);
  } else if (UserStatus == -1) {
    logger.debug("InsideStubUser");
    action.goTo(nodeOutcome.STUB_ACCOUNT);
  } else if (UserStatus == 1) {
    logger.debug("InsideSuccessUser");
    action
      .goTo(nodeOutcome.SUCCESS)
      .putSessionProperty("domain", domain[1])
      .putSessionProperty("upn", UPN)
      .putSessionProperty("KOGID", KOGID);
  } else {
    action.goTo(nodeOutcome.FAIL);
  }
}

if (nodeState.get("mail")) {
  mail = nodeState.get("mail");
} else {
  missingInputs.push(nodeConfig.missingEmail);
}

// Transaction ID
var transactionID;
if (requestHeaders.get("X-ForgeRock-TransactionId") != null) {
  transactionID = requestHeaders.get("X-ForgeRock-TransactionId")[0];
} else {
  missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}

// Context ID
/*var contextID;
if (requestParameters.get("contextID") && requestParameters.get("contextID")[0]) {
    contextID = requestParameters.get("contextID")[0];
} else {
    missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}*/

//KYID
// var kyid;
// if (nodeState.get("KYID") != null) {
//     kyid = nodeState.get("KYID");
// } else {
//     missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
// }

var kogUsrProfileApi;
if (
  systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile") &&
  systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile") != null
) {
  var kogUsrProfileApi = systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile");
} else {
  missingInputs.push(nodeConfig.missingKogUsrProfileAPIInfo);
}

var sihcertforapi;
if (
  systemEnv.getProperty("esv.kyid.cert.client") &&
  systemEnv.getProperty("esv.kyid.cert.client") != null
) {
  sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
  missingInputs.push(nodeConfig.missingInputParams);
}

var kogTokenApi;
if (
  systemEnv.getProperty("esv.kyid.2b.kogapi.token") &&
  systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null
) {
  kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
  missingInputs.push(nodeConfig.missingInputParams);
}

if (missingInputs.length > 0) {
  logger.debug(
    "DEBUG::" +
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
      nodeConfig.missingInputParams +
      "::" +
      missingInputs,
  );
  action.goTo(nodeOutcome.ERROR);
} else {
  try {
    var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
    var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);

    if (kogAPITokenResponse.status === 200) {
      //logger.error("access token status is 200"+kogAPITokenResponse)
      var payload = {
        EmailAddress: mail,
      };
      var bearerToken = kogAPITokenResponse.response;
      var requestOptions = {
        clientName: sihcertforapi,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        token: bearerToken,
        body: payload,
      };

      var kogUserProfileAPIResponse = httpClient
        .send(kogUsrProfileApi, requestOptions)
        .get();
      logger.debug("responseStatus: " + kogUserProfileAPIResponse.status);

      logger.debug(
        "response of user get profile in KOG API " +
          JSON.stringify(JSON.parse(kogUserProfileAPIResponse.text())),
      );
      if (kogUserProfileAPIResponse.status === 200) {
        nodeLogger.debug(nodeConfig.timestamp +"::" +nodeConfig.node +"::" +nodeConfig.nodeName +"::" +nodeConfig.script +"::" +nodeConfig.scriptName +"::" +nodeConfig.apiResponse_KOG_USR_PROFILE +"::" +nodeConfig.apiResponseStatus +"::" +kogUserProfileAPIResponse.status +"::Email::" +mail);
        var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
        if (apiResponse.ResponseStatus === 0) {
          fetchKOGUserData(apiResponse);
        } else if (apiResponse.ResponseStatus === 1) {
          logger.debug("Inside -1 User Status");
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
              nodeConfig.apiResponse_KOG_USR_PROFILE +
              "::" +
              nodeConfig.apiResponseFail +
              "::" +
              kogUserProfileAPIResponse.apiresponsestatus +
              "::" +
              JSON.stringify(kogUserProfileAPIResponse.response) +
              "::Email::" +
              mail,
          );
        logger.debug("Inside UPN call")
          var payload = {
            UPN: mail,
          };
          var bearerToken = kogAPITokenResponse.response;
          var requestOptions = {
            clientName: sihcertforapi,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            token: bearerToken,
            body: payload,
          };

          var kogUserProfileAPIResponse = httpClient
            .send(kogUsrProfileApi, requestOptions)
            .get();
          logger.debug("responseStatus: " + kogUserProfileAPIResponse.status);
          logger.debug(
            "response of user get profile in KOG API " +
              JSON.stringify(JSON.parse(kogUserProfileAPIResponse.text())),
          );
          if (kogUserProfileAPIResponse.status === 200) {
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
                nodeConfig.apiResponse_KOG_USR_PROFILE +
                "::" +
                nodeConfig.apiResponseStatus +
                "::" +
                kogUserProfileAPIResponse.status +
                "::Email::" +
                mail,
            );
            logger.debug("KOGCALL2:200")
            var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
            if (apiResponse.ResponseStatus === 0) {
              //Call function
                logger.debug("ResponseStaus2is0")
              fetchKOGUserData(apiResponse);
            } else if (apiResponse.ResponseStatus === 1) {
                
              var msg =
                apiResponse.MessageResponses &&
                apiResponse.MessageResponses.length > 0
                  ? apiResponse.MessageResponses.map(
                      (m) => `[${m.MessageCode}] ${m.MessageDescription}`,
                    ).join(" | ")
                  : "Unknown error";
              logger.debug(
                "API returned an error ResponseStatus=" +
                  apiResponse.ResponseStatus +
                  " Details: " +
                  msg,
              );
              nodeState.putShared("apireturnederror", msg);
                logger.debug("the apireturnederror is" + msg)
              action.goTo(nodeOutcome.FAIL);

            }
          }
        }
      } else {
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
            nodeConfig.apiResponse_KOG_USR_PROFILE +
            "::" +
            nodeConfig.apiResponseStatus +
            "::" +
            kogUserProfileAPIResponse.status +
            "::" +
            kogUserProfileAPIResponse.error +
            "::Email::" +
            mail,
        );
        action.goTo(nodeOutcome.FAIL);
      }
    } else {
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
          nodeConfig.apiResponse_KOG_TOKEN +
          "::" +
          kogAPITokenResponse.status +
          "::" +
          kogAPITokenResponse.error +
          "::Email::" +
          mail,
      );
      action.goTo(nodeOutcome.FAIL);
    }
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
        error +
        "::Email::" +
        mail,
    );
    action.goTo(nodeOutcome.FAIL);
  }
}
