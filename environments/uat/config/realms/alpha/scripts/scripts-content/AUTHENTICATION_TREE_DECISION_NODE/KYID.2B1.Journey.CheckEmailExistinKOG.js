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
    scriptName: "KYID.2B1.Journey.CheckEmailExistinKOG",
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
    apiResponse_KOG_TOKEN:  "KOG_TOKEN_API_RESPONSE",  
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE", 
    apiResponse_Status: "Status", 
    apiResponsePass: "API_RESULT_SUCCESS",   
    apiResponseFail: "API_RESULT_FAILURE",  
    apiRespFailMsgCode:  "MessageCode",
    apiRespFailMsg_114: "-114",
    apiRespFailMsg_115: "-115",
    idmQueryFail: "IDM Query Operation Failed",
    usrRecord: "User Record",
    registeredMFAMethods: "Registered MFA methods",
    end: "Node Execution Completed",
    apiResponseStatus: "Status"
 };

 // Node outcomes
 var nodeOutcome = {
     USER_EXIST: "userexist",
     USER_DONOT_EXIST: "userdonotexist",
     FAIL: "failed" 
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
 var mail = null;
//var collectedPrimaryEmail=nodeState.get("collectedPrimaryEmail").toLowerCase();
    if(nodeState.get("collectedPrimaryEmail")) {
     mail = nodeState.get("collectedPrimaryEmail");
    }  else {
     missingInputs.push(nodeConfig.missingEmail);
    }

// Transaction ID
var transactionID;
if (requestHeaders.get("X-ForgeRock-TransactionId") != null) {
    transactionID = requestHeaders.get("X-ForgeRock-TransactionId")[0];
} else {
    missingInputs.push(nodeConfig.missingKogTokenAPIInfo);
}

var kogUsrProfileApi;
if(systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile") && systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile")!=null) { 
 var kogUsrProfileApi = systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile");   
}  else {
 missingInputs.push(nodeConfig.missingKogUsrProfileAPIInfo);
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



if (missingInputs.length > 0) {
    logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.FAIL);
} else {
try{
var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);


        if (kogAPITokenResponse.status === 200) {
            logger.debug("Access token status is 200: " + JSON.stringify(kogAPITokenResponse));

            var payload = {
                EmailAddress: mail
            };
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
            var kogUserProfileAPIResponse = httpClient.send(kogUsrProfileApi, requestOptions).get();
            var endTime = new Date();
            var duration = endTime - startTime;  
            var durationInSeconds = duration / 1000;
            logger.debug("KYID.2B1.Journey.CheckEmailExistinKOG call duration in seconds : " + durationInSeconds );
            logger.debug("Response Status: " + kogUserProfileAPIResponse.status);

            var parsedResponse = JSON.parse(kogUserProfileAPIResponse.text());
            logger.debug("Response from user get profile in KOG API: " + JSON.stringify(parsedResponse));

            if (kogUserProfileAPIResponse.status === 200) {
                nodeLogger.debug(
                    nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
                    nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.apiResponse_KOG_USR_PROFILE + "::" +
                    nodeConfig.apiResponseStatus + "::" + kogUserProfileAPIResponse.status + "::Email::" + mail
                );

                if (parsedResponse.ResponseStatus === 0) {
                    
                    logger.debug("the primary email entered by user is already existing in KOG")
                    
                    nodeState.putShared("validationError","{\"code\":\"ERR-CHN-EML-004\",\"message\":{\"es\":\"El correo electrónico principal ingresado por el usuario ya existe en KOG\",\"en\":\"The primary email entered by user is already existing in KOG\"}}")
                    //"{\"code\":\"ERR-CHN-EML-004\",\"message\":{\"es\":\"El correo electrónico principal ingresado por el usuario ya existe en KOG\",\"en\":\"The primary email entered by user is already existing in KOG\"}}"
                
                    action.goTo(nodeOutcome.USER_EXIST);
                } else {
                    logger.debug("the primary email entered by user is does not exist in KOG")
                    action.goTo(nodeOutcome.USER_DONOT_EXIST);
                }

            } else {
                nodeLogger.debug(
                    nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
                    nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.apiResponse_KOG_USR_PROFILE + "::" +
                    nodeConfig.apiResponseStatus + "::" + kogUserProfileAPIResponse.status + "::" +
                    kogUserProfileAPIResponse.error + "::Email::" + mail
                );
                auditLog("PRO002", "Primary Email Update Failure");
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            nodeLogger.debug(
                nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
                nodeConfig.script + "::" + nodeConfig.scriptName + "::Access token fetch failed::Status::" +
                kogAPITokenResponse.status + "::Email::" + mail
            );
            auditLog("PRO002", "Primary Email Update Failure");
            action.goTo(nodeOutcome.FAIL);
        }

    } catch (error) {
        nodeLogger.error(
            nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
            nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::Email::" + mail
        );
        auditLog("PRO002", "Primary Email Update Failure");
        action.goTo(nodeOutcome.FAIL);
    }
}



function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userQueryResult = null;
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var requestedUserId = nodeState.get("_id") || null
				/* userQueryResult = openidm.query("managed/alpha_user", {
            _queryFilter: 'userName eq "' + usrKOGID + '"'
                }, ["_id"]);
                  requesteduserId = userQueryResult.result[0]._id;
                  */
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requestedUserId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log update Personal info updated "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}