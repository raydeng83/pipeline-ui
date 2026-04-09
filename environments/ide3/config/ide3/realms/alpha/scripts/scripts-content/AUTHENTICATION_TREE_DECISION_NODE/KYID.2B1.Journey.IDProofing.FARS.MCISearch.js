var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.MCISearch",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

  };

/**
   * Logging function
   * @type {Function}
   */
var nodelogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
}


function main(){
    try{
        if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }  
    }catch(error){
         nodelogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
    }
}

function isResponseValid(input) {
    try {
        var parsedInput = JSON.parse(input);
        var allowedStatuses = ["noMatch", "partialMatch", "fullMatch"];
        var isValid = false;
        if (typeof parsedInput === "object") {
            var status = parsedInput.status || parsedInput[""] || null;
            if (allowedStatuses.includes(status)) {
                parsedInput.status = status;
                isValid = true;
                if (parsedInput.status === "fullMatch") {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null && parsedInput.MCIResponse[0].email!=null;
                    logger.debug("isValid is ::: => " + isValid)
                    return isValid;
                } else {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
                    logger.debug("isValid is ::: => " + isValid)
                    return isValid;
                }
            }
        }
        if (!isValid) {
            nodeState.putShared("validationMessage", "invalid_input");
            return false;
        }
    } catch (e) {
        nodelogger.error("isResponseValid " + e.message);
        nodeState.putShared("validationMessage", "invalid_input");
        return false;
    }
}   


function requestCallbacks() {
    nodelogger.debug("Inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }

        var pageHeader= {"pageHeader": "3_RIDP_MCI_Search"};
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}



function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var responseMCISearchApiCall = callbacks.getTextInputCallbacks()[0];
    
        // Validate responseMCISearchApiCall input
        isResponseValidResult = isResponseValid(responseMCISearchApiCall) 
        nodelogger.debug("isResponseValidResult is ::: => " + isResponseValidResult)
        responseMCISearchApiCall = JSON.parse(responseMCISearchApiCall);
        nodelogger.debug("responseMCISearchApiCall response is --> " + JSON.stringify(responseMCISearchApiCall));

        
        if(!isResponseValidResult){
            nodelogger.debug("Inside error")
            action.goTo("error")
        }else{
            if (selectedOutcome === 0) {
            nodelogger.debug("Inside Success")
            nodeState.putShared("validationErrorCode", null);
                if(responseMCISearchApiCall.status === "fullMatch"){
                    nodelogger.debug("Inside Full Match")
                    if(responseMCISearchApiCall.MCIResponse.length>0){
                        nodelogger.debug("responseMCISearchApiCall.MCIResponse.length"+responseMCISearchApiCall.MCIResponse.length)
                        var searchUserInKOGResponse = null;
                        var searchUserInKOGArray = []
                        var searchEmailArray = []
                        var validUser = false
                        var applicationList = ["Account Management"];
                        var roleName = "EditSecurityQuestion";
                        var skip  = true;
                        var roleMatch = false;
                        var emailWithMatchedRole = []

                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodelogger.debug("Inside for loop") 
                            // rolename and appname should come from ESV
                            nodeState.putShared("appName","Account Management")
                            nodeState.putShared("roleName","EditSecurityQuestion")
                            
                            searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                            logger.debug("searchUserInKOGResponse is --> "+searchUserInKOGResponse)
                            
                            if(applicationList.includes(nodeState.get("appName")) && roleName == nodeState.get("roleName")){  
                                roleMatch = true;
                                var roleInKOG = checkRoleInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID, applicationList, roleName);
                                nodelogger.debug("roleInKOG is --> "+roleInKOG)  
                                if(roleInKOG && roleInKOG === true ){ 
                                    if(searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                        emailWithMatchedRole.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                    }
                                }
                            }
                            
                            if(searchUserInKOGResponse){
                                if(searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                    searchEmailArray.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                }
                                                    
                                searchUserInKOGArray.push(searchUserInKOGResponse)
                            }
                        } 
                        nodeState.putShared("searchUserInKOGArray",searchUserInKOGArray)
                        nodeState.putShared("searchEmailArray",searchEmailArray)
                       
                    }
                    if(searchUserInKOGResponse && searchUserInKOGResponse !== null && searchUserInKOGResponse !== false){
                        nodelogger.debug("###1111####")
                        nodeState.putShared("searchUserInKOGResponse",searchUserInKOGResponse)
                        if(nodeState.get("appEnrollRIDPMethod")==="Experian" || nodeState.get("appEnrollRIDPMethod")==="SSA"){
                            if(emailWithMatchedRole.length>0){
                                var searchResponse = searchUserIdentity();
                                nodeState.putShared("proofingMethod","-1")
                                patchUserIdentity(searchResponse._id,null, "-1")
                                nodeState.putShared("prereqStatus","NOT_STARTED")
                                action.goTo("appEnrollRIDPmsg") 
                            }else{
                                var searchResponse = searchUserIdentity();
                                nodeState.putShared("proofingMethod","2")
                                patchUserIdentity(searchResponse._id,null, "2")
                                nodeState.putShared("prereqStatus","COMPLETED")
                                action.goTo("MCISYNC") 
                            }
                        }
                     } 
                }else if(responseMCISearchApiCall.status === "partialMatch" || responseMCISearchApiCall.status === "noMatch"){
                    nodelogger.debug("inside partial or no match")  
                    nodeState.putShared("validationMessage", null);
                    var searchResponse = searchUserIdentity();
                    nodeState.putShared("proofingMethod","2")
                    nodeState.putShared("lexId", null)
                    patchUserIdentity(searchResponse._id) 
                    nodeState.putShared("prereqStatus","COMPLETED")
                    action.goTo("MCISYNC")
                }
            }
        }
    }catch (error) {
        nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error handleUserResponses Function" + error.message);
        action.goTo("error")
    }
}


function checkRoleInKOG(userKOGID, applicationList, roleList) {
    var kogTokenApi; 
    var foundRole = false;
    if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
        kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }


    var kogUsrAuthorizationApiURL;
    if (systemEnv.getProperty("esv.kyid.usr.authorization") && systemEnv.getProperty("esv.kyid.usr.authorization") != null) {
        kogUsrAuthorizationApiURL = systemEnv.getProperty("esv.kyid.usr.authorization");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }

    var sihcertforapi;
    if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
        sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
    } else {
        missingInputs.push(nodeConfig.missingInputParams);
    }

    try {
            var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
            var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
            nodelogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));
            
            //If the Access token is 200
            if (kogAPITokenResponse.status === 200) {
                var bearerToken = kogAPITokenResponse.response;

                var payload = {
                    KOGID: userKOGID
                }
                nodelogger.debug("payload in ReadUserAuthz " + JSON.stringify(payload));
                var requestOptions = {
                    "clientName": sihcertforapi,
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "token": bearerToken,
                    "body": payload
                };

                var res = httpClient.send(kogUsrAuthorizationApiURL, requestOptions).get();

                nodelogger.debug("KOG API Status: " + res.status);
                action.withHeader(`Response code: ${res.status}`);


                if (res.status === 200) {
                    var data = JSON.parse(res.text());
                    nodelogger.debug("KOG API Response: " + JSON.stringify(data));

                    if (data.ResponseStatus === 0 && data.UserAuthorizations) {
                        data.UserAuthorizations.forEach(function(auth) {
                            nodelogger.debug("appName decision "+ applicationList.includes(nodeState.get("appName")))
                            nodelogger.debug("roleList decision "+ auth.RoleName.localeCompare(roleList))
                            if (auth.ApplicationName && auth.RoleName && applicationList.includes(nodeState.get("appName")) && auth.RoleName.localeCompare(roleList) == 0) {  
                                foundRole =  true;
                            }
                        })
                        return foundRole;
                    }
                }
            }
        }catch (e) {
            nodelogger.error("Exception in KYID KOG API call: " + e.message);
        }
}