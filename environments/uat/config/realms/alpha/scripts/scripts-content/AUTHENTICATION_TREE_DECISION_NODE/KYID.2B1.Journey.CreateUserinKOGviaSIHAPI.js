var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger");
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
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};

var userId = nodeState.get("userId") || null
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var browser=null;
if(requestHeaders.get("user-agent"))
{
    browser = requestHeaders.get("user-agent")[0]; 
}

var os=null;
if(requestHeaders.get("sec-ch-ua-platform")){
    os = requestHeaders.get("sec-ch-ua-platform"); 
}


var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("verifiedPrimaryEmail") || nodeState.get("mail") || "";
var sessionDetails = null
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

// Declare Global Variables
var missingInputs = [];

logger.debug("start script")
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

var postalAddressOne;
if (nodeState.get("postalAddress") != null) {
    postalAddressOne = nodeState.get("postalAddress");
}

var postalAddressTwo;
if (nodeState.get("custom_postalAddress2") != null) {
    postalAddressTwo = nodeState.get("custom_postalAddress2");
}

var city;
if (nodeState.get("city") != null) {
    city = nodeState.get("city");
}

var state;
if (nodeState.get("stateProvince") != null) {
    state = nodeState.get("stateProvince");
}

var postalCode;
if (nodeState.get("postalCode") != null) {
    postalCode = nodeState.get("postalCode");
}

var countyCode;
if (nodeState.get("custom_county") != null) {
    countyCode = nodeState.get("custom_county");
} 

if (nodeState.get("frUnindexedString3") != null) {
        languagePreference = nodeState.get("frUnindexedString3");
} else {
    languagePreference = "1";
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
    logger.debug(" Request Parameters 1 :"+requestParameters.get("contextID"))
    logger.debug(" Request Parameters 2 :"+requestParameters.get("contextId"))
    logger.debug(" Request Parameters 3 :"+requestParameters);
     logger.debug(" Request Parameters from Nodestate :"+nodeState.get("contextid"))
if (requestParameters.get("contextID") && requestParameters.get("contextID")[0]) {
    logger.debug(" Request Parameters 2 :"+requestParameters.get("contextID"))
    contextID = requestParameters.get("contextID")[0];
} else if (nodeState.get("contextid")) {
     logger.debug(" Request Parameters 3 :"+nodeState.get("contextid"))
    contextID = nodeState.get("contextid")
} else {
    missingInputs.push("contextID");
}


var createAccountAPIURL;
if (systemEnv.getProperty("esv.kyid.kogapi.createaccount") && systemEnv.getProperty("esv.kyid.kogapi.createaccount") != null) {
    createAccountAPIURL = systemEnv.getProperty("esv.kyid.kogapi.createaccount");
    //createAccountAPIURL= "https://createAccountKOGAPI";
} else {
    missingInputs.push("createAccountAPIURL");
}

var sihcertforapi;
if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
    missingInputs.push("sihcertforapi");
}

var kogTokenApi;
if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
    kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
    missingInputs.push("kogTokenApi");
}

if (missingInputs.length > 0) {
    logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script +
        "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure" ,eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, null, requestHeaders)
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
    
        if(postalAddressOne){
            payload["Address1"] = postalAddressOne;
        }

        if(postalAddressTwo){
            payload["Address2"] = postalAddressTwo;
        }

        if(city){
            payload["City"] = city;
        }

        if(state){
            payload["State"] = state;
        }


        if(postalCode && postalCode != undefined && postalCode != null){
            payload["Zipcode"] = postalCode ;
        }

        if(countyCode){
            //payload["CountyName"] = countyCode;
            payload["CountyCame"] = countyCode;
        }

        if(languagePreference){
            payload["LanguagePreference"] = languagePreference;
        }
    
    logger.debug("Payload prepared: " + JSON.stringify(payload));

    var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
    logger.debug("ran the access token lib script for email" + verifiedPrimaryEmail)
  
    var kogAPITokenResponse = apiTokenRequest.getAccessTokenCreateAccount(kogTokenApi);


    nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse) + "for email" + verifiedPrimaryEmail);

try{
    if (kogAPITokenResponse.status === 200) {
        logger.debug("access token status is 200" + kogAPITokenResponse + "for email" + verifiedPrimaryEmail)
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
        var startTime = new Date();
        logger.debug("TimeStamp Before Creating Account in KOG::"+ new Date().toISOString());
        var res = httpClient.send(createAccountAPIURL, requestOptions).get();
        var endTime = new Date();
        var duration = endTime - startTime;
        var durationInSeconds = duration / 1000;
        logger.debug("Duration in seconds : " + durationInSeconds);
        
        logger.debug("response status of user creating in KOG API " + res.status);

        logger.debug("response of user creating in KOG API " + JSON.stringify(JSON.parse(res.text())));

        action.withHeader(`Response code: ${res.status}`);

        if (res.status === 200) {
            var data = JSON.parse(res.text());
            if (data.ResponseStatus === 0 && data.AccountDetails && data.AccountDetails.KOGID) {
                var successfulKOGID = data.AccountDetails.KOGID;
                var successfulUPN = data.AccountDetails.UPN;
                var successfulLogon = data.AccountDetails.Logon;
                logger.debug("the successful kogid is " + successfulKOGID);
                logger.debug("the parsed data" + JSON.stringify(data))
                nodeState.putShared("fetchedKOGID", successfulKOGID);

                nodeState.putShared("fetchedUPN", successfulUPN.toLowerCase());
                nodeState.putShared("fetchedLogon", successfulLogon.toLowerCase());
                nodeState.putShared("audit_LOGON",successfulLogon)
                logger.debug("TimeStamp After Creating Account in KOG::"+ new Date().toISOString());
                action.goTo("Successful")

            } else {

                var userId = ""
                if(nodeState.get("verifiedPrimaryEmail")){
                userId = nodeState.get("verifiedPrimaryEmail");
                } else {
                userId = ""
                }
                var eventDetails = {
                emailAddress : nodeState.get("verifiedPrimaryEmail") || ""
                };
            
                //var sessionDetails = null
            
              //  auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure", eventDetails, userId, userId, transactionid)
                auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure" ,eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, null, requestHeaders)
                // ResponseStatus not 0, error details present
                var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                    data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                    "Unknown error";
                logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                nodeState.putShared("apireturnederror", msg)
                action.goTo("Failed");
            }

        } else {

            var userId = ""
            if(nodeState.get("verifiedPrimaryEmail")){
            userId = nodeState.get("verifiedPrimaryEmail");
            } else {
                userId = ""
            }
            var eventDetails = {
                emailAddress : nodeState.get("verifiedPrimaryEmail") || ""
                };
            
            var sessionDetails = null
            
            auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure" ,eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, null, requestHeaders)
            logger.debug("Non-200 HTTP response: " + res.status);
            action.goTo("Failed");
        }
    } else {
        var userId = ""
            if(nodeState.get("verifiedPrimaryEmail")){
            userId = nodeState.get("verifiedPrimaryEmail");
            } else {
                userId = ""
            }
            var eventDetails = {
                emailAddress : nodeState.get("verifiedPrimaryEmail") || ""
                };
            
            var sessionDetails = null
            
            auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure" ,eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, null, requestHeaders)
            logger.error("kogAPITokenResponse is not 200 ");
            action.goTo("Error");
    }
}
catch(e){
            var userId = ""
            if(nodeState.get("verifiedPrimaryEmail")){
            userId = nodeState.get("verifiedPrimaryEmail");
            } else {
                userId = ""
            }
            var eventDetails = {
                emailAddress : nodeState.get("verifiedPrimaryEmail") || ""
                };
            
            var sessionDetails = null
            
            auditLib.auditLogger("ACC002",sessionDetails,"Account Creation Failure" ,eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, null, requestHeaders)
            logger.error("kogAPITokenResponse is not 200 ");
            action.goTo("Failed");
 }
}
/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}