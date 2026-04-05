var dateTime = new Date().toISOString();
//Adding a comment here
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "IsUserAuthorized",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CreateUserinKOGviaSIHAPI",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke API as required parameters are missing.",
    apiRequest_isAuthorized: "KOG_isAuthorized",
    apiRespParam_FirstName: "FirstName",
    apiRespParam_LastName: "LastName",
    apiRespParam_EmailAddress: "EmailAddress",
    apiRespParam_UPN: "UPN",
    apiRespParam_Logon: "Logon",
    apiRespParam_KOGID: "KOGID",
    apiResponse_KOG_TOKEN: "KOG_TOKEN_API_RESPONSE",
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE",
    apiResponseStatus: "status",
    apiResponsePass: "true",
    apiResponseFail: "false",
    apiRespFailMsgCode: "MessageCode",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    FAIL: "Failed",
    ERROR: "Error"
};

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


// Declare Global Variables
var missingInputs = [];

logger.error("start script")
// givenName
var givenName;
if (nodeState.get("givenName") != null) {
    givenName = nodeState.get("givenName");
} else {
    missingInputs.push("givenName");
}

// lastName
var lastName;
if (nodeState.get("lastName") != null) {
    lastName = nodeState.get("lastName");
} else {
    missingInputs.push("lastName");
}

// verifiedPrimaryEmail
var verifiedPrimaryEmail;
if (nodeState.get("verifiedPrimaryEmail") != null) {
    verifiedPrimaryEmail = nodeState.get("verifiedPrimaryEmail");
} else {
    missingInputs.push("verifiedPrimaryEmail");
}

// password
var password;
if (nodeState.get("password") != null) {
    password = nodeState.get("password");
} else {
    missingInputs.push("password");
}

// verifiedAlternateEmail (optional)
var verifiedAlternateEmail = nodeState.get("verifiedAlternateEmail") || "";

var verifiedTelephoneNumber = "";
if (nodeState.get("verifiedTelephoneNumber") != null) {
    verifiedTelephoneNumber = nodeState.get("verifiedTelephoneNumber").replace(/^\+/, "");
}


// Transaction ID generate random 36 chars guid
var transactionID = generateGUID();
// if (requestHeaders.get("X-ForgeRock-TransactionId") != null) {
//     transactionID = requestHeaders.get("X-ForgeRock-TransactionId")[0];
// } else {
//     missingInputs.push("transactionID");
// }

// Context ID
var contextID;
if (requestParameters.get("contextID") && requestParameters.get("contextID")[0]) {
    contextID = requestParameters.get("contextID")[0];
} else if(nodeState.get("contextid")) {
    contextID = nodeState.get("contextid")
}
 else {
    missingInputs.push("contextID");
}


var createAccountAPIURL;
if(systemEnv.getProperty("esv.kyid.kogapi.createaccount") && systemEnv.getProperty("esv.kyid.kogapi.createaccount")!=null){
    createAccountAPIURL = systemEnv.getProperty("esv.kyid.kogapi.createaccount");
} else {
     missingInputs.push("createAccountAPIURL");
}
 
var sihcertforapi;
if(systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client")!=null){
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
     missingInputs.push("sihcertforapi");
}

var kogTokenApi;
if(systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token")!=null){
    kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
     missingInputs.push("kogTokenApi");
}

if (missingInputs.length > 0) {
    logger.error("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);
} else {
    var payload = {
        LegalFirstName: givenName,
        LegalLastName: lastName,
        EmailAddress: verifiedPrimaryEmail,
        Password: password,
        AlternateEmailAddress: verifiedAlternateEmail,
        MobilePhone: verifiedTelephoneNumber,
        KYID: "34567890",
        TransactionID: transactionID,
        ContextID: contextID
    };

    logger.error("Payload prepared: " + JSON.stringify(payload));

var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
logger.error("ran the access token lib script for email" +verifiedPrimaryEmail)
var kogAPITokenResponse = apiTokenRequest.getAccessTokenCreateAccount(kogTokenApi);
nodeLogger.error("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse) + "for email" +verifiedPrimaryEmail);


if (kogAPITokenResponse.status === 200) {
    logger.error("access token status is 200"+kogAPITokenResponse + "for email" +verifiedPrimaryEmail)
    var bearerToken = kogAPITokenResponse.response;
    var requestOptions = {
        "clientName": sihcertforapi,
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
          },
        "token": bearerToken,
        "body": payload
     };

var res = httpClient.send(createAccountAPIURL,requestOptions).get(); 
logger.error("response status of user creating in KOG API "+res.status);

logger.error("response of user creating in KOG API "+JSON.stringify(JSON.parse(res.text())));

action.withHeader(`Response code: ${res.status}`);

    if (res.status === 200) {
    var data = JSON.parse(res.text());
    if (data.ResponseStatus === 0 && data.AccountDetails && data.AccountDetails.KOGID) {
      var successfulKOGID = data.AccountDetails.KOGID;
        var successfulUPN = data.AccountDetails.UPN;
      var successfulLogon = data.AccountDetails.Logon;
      logger.error("the successful kogid is " + successfulKOGID);
    logger.error("the parsed data" +JSON.stringify(data))
      nodeState.putShared("fetchedKOGID", successfulKOGID);

      nodeState.putShared("fetchedUPN", successfulUPN);
     nodeState.putShared("fetchedLogon", successfulLogon);
      action.goTo("Successful")

    } else {
      // ResponseStatus not 0, error details present
      var msg = data.MessageResponses && data.MessageResponses.length > 0
        ? data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ")
        : "Unknown error";
      logger.error("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
      nodeState.putShared("apireturnederror",msg)
      action.goTo("Failed");
    }

  } else {
    logger.error("Non-200 HTTP response: " + res.status);
    action.goTo("Failed");
  }
}
else {
    logger.error("kogAPITokenResponse is not 200 ");
    action.goTo("Failed");
  }
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