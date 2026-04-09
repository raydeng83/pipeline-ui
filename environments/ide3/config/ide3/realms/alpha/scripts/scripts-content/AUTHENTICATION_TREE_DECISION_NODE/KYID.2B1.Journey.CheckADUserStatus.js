var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "IsUserAuthorized",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckADUserStatus",
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
    apiResponseStatus: "Status",
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
logger.debug("start script")
// givenName
var usrKOGID;
if (nodeState.get("fetchedKOGID") != null) {
    usrKOGID = nodeState.get("fetchedKOGID");
} 
else if(nodeState.get("KOGID")!=null)
{
    usrKOGID = nodeState.get("KOGID");
}
else {
    missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}


var sihcertforapi;
if(systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client")!=null){
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

var kogTokenApi;
if(systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token")!=null){
    kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

var doesusrexistinADAPIURL;
if(systemEnv.getProperty("esv.kyid.kogapi.doesusrexistinad") && systemEnv.getProperty("esv.kyid.kogapi.doesusrexistinad")!=null){
    doesusrexistinADAPIURL = systemEnv.getProperty("esv.kyid.kogapi.doesusrexistinad");
} else {
     missingInputs.push(nodeConfig.missingInputParams);
}

if (missingInputs.length > 0) {
    logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.ERROR);
} else {
    var payload = {
        kogid: usrKOGID
    };

var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
var kogAPITokenResponse = apiTokenRequest.getAccessTokenCreateAccount(kogTokenApi);
nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));
 
if (kogAPITokenResponse.status === 200) {
    logger.debug("access token status is 200"+kogAPITokenResponse)
    var bearerToken = kogAPITokenResponse.response;

    var requestOptions = {
    "clientName": sihcertforapi,
    "method": "POST",
    "headers": {
        "Content-Type": "application/json"
      },
    "token": bearerToken,
    "body": payload
 }
//var doesusrexistinADAPIURL = "https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/doesaccountexistinad"
logger.debug("TimeStamp Before Creating Account in AD::"+ new Date().toISOString());
 var res = httpClient.send(doesusrexistinADAPIURL,requestOptions).get(); 

logger.debug("Payload prepared: " + JSON.stringify(payload));

logger.debug("the response for does account exist in AD "+JSON.stringify(JSON.parse(res.text())))

if(res.status === 200){
     var data =JSON.parse(res.text());
  var doesaccountExistsInAD = data.AccountExistsInAD;
nodeState.putShared("doesaccountExistsInAD", doesaccountExistsInAD)
    if (doesaccountExistsInAD === true) {
nodeLogger.debug("User successfully created in AD");
logger.debug("TimeStamp After Creating Account in AD::"+ new Date().toISOString());
action.goTo(nodeOutcome.SUCCESS);    
} else {
nodeLogger.error("User creation failed in AD: ");
action.goTo(nodeOutcome.FAIL);
            }
        }
    else {
        nodeLogger.error("User creation failed in AD");
    }
} else {
    logger.debug("access token not generated")
    action.goTo(nodeOutcome.FAIL);
}
}
//     var requestOptions = {
//     "clientName": "kyidHttpClient",
//     "method": "POST",
//     "headers": {
//         "Content-Type": "application/json"
//       },
//         "body": payload
//  };
// var doesusrexistinADAPIURL = "https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/doesaccountexistinad"
//  var res = httpClient.send(doesusrexistinADAPIURL,requestOptions).get(); 

//     logger.debug("Payload prepared: " + JSON.stringify(payload));
// //var doesusrexistinADAPIURL = "https://apim-test-chai-01.azure-api.net/Mock/doesaccountexistinad"
// logger.debug("the response for does account exist in AD "+JSON.stringify(JSON.parse(res.text())))
// // var apiKOGCreateUserRequest = require("KYID.2B1.Library.ProcessKOGAPIRequest");
// // var response = apiKOGCreateUserRequest.processHttpRequestwithCert(null, doesusrexistinADAPIURL, "POST", payload, null, "kyidHttpClient");
// if(res.status === 200){
//      var data =JSON.parse(res.text());
//   var doesaccountExistsInAD = data.AccountExistsInAD;
//     if (doesaccountExistsInAD === true) {
// nodeLogger.error("User successfully created in AD");
// action.goTo(nodeOutcome.SUCCESS);    
// } else {
// nodeLogger.error("User creation failed in AD: ");
// action.goTo(nodeOutcome.FAIL);
//             }
//         }
//     else {
//         nodeLogger.error("User creation failed in AD");
//     }
// }