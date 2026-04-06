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
            var userInfoJSON = nodeState.get("userInfoJSON");
            var displayCallBackJSON = {
                    "apiCalls":[{
                       	"method" :"MCI",
                    	"action" : "search"
                        
                    }],
        
                    "collectedUserInfo": nodeState.get("userInfoJSON")
            };
            
            requestCallbacks(displayCallBackJSON);
        } else {
            handleUserResponses();
        }  
    }catch(error){
         nodelogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
    }
}

main();

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
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length > 0 && parsedInput.MCIResponse[0].KOGID!=null;
                    nodelogger.debug("isValid is ::: => " + isValid)
                    return isValid;
                } else {
                    isValid = isValid && Array.isArray(parsedInput.MCIResponse) && parsedInput.MCIResponse.length === 0;
                    nodelogger.debug("isValid is ::: => " + isValid)
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

function searchUserInKOG(KOGID) {
    try {
        var kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
        var kogUsrProfileApi = systemEnv.getProperty("esv.kyid.2b.kogapi.userprofile");
        var sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
        var apiTokenRequest = require("KYID.2B1.Library.AccessToken");
        var kogAPITokenResponse = apiTokenRequest.getAccessToken(kogTokenApi);
        if (kogAPITokenResponse.status === 200) {
            var payload = {
                "KOGID": KOGID,
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
            var startTime = new Date();
            var kogUserProfileAPIResponse = httpClient.send(kogUsrProfileApi, requestOptions).get();
            var endTime = new Date();
            var duration = endTime - startTime;  
            var durationInSeconds = duration / 1000;
            nodelogger.debug("KYID.2B1.Journey.IDProofing.responseresponseMCISearchApiCall call duration in seconds : " + durationInSeconds );
            if (kogUserProfileAPIResponse.status === 200) {
                var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
                nodelogger.debug("kogUserProfileAPIResponse apiResponse is --> "+ JSON.stringify(apiResponse))
                if (apiResponse.ResponseStatus === 0) {
                return apiResponse
                }
                else if (apiResponse.ResponseStatus === 1) {
                    return false
                }       
            }
            else{
                return null
            }
        }
        else{
            return null
        } 
    } catch (error) {
        nodelogger.error("Error Occurred while searchUserInKOG "+ error) 
    }
}

function searchUserIdentity() {
try {
    nodelogger.debug("User Id -->"+  nodeState.get("UserId"))
    var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'account/_refResourceId eq "' +  nodeState.get("UserId") + '"' }, ["*"]);
    nodelogger.debug("userIdentityResponse --> "+userIdentityResponse)
    
    if(userIdentityResponse && userIdentityResponse.resultCount>0){
        
        return userIdentityResponse.result[0]
    }
    else{
        return null
    }
    
} catch (error) {
    nodelogger.error("Error Occurred While searchUserIdentity "+ error)
    
}    
}


function requestCallbacks(displayCallBackJSON) {
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
                        var applicationList = systemEnv.getProperty("esv.ridp.experian.application");
                        var roleName = systemEnv.getProperty("esv.ridp.experian.role");
                        var skip  = true;
                        var roleMatch = false;
                        var emailWithMatchedRole = []

                        for (var i = 0; i < responseMCISearchApiCall.MCIResponse.length; i++) {
                            nodelogger.debug("Inside for loop")
                            searchUserInKOGResponse = searchUserInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID);
                            nodelogger.debug("searchUserInKOGResponse is --> "+searchUserInKOGResponse)
                            
                            
                            //For EXPERIAN
                            if(nodeState.get("appEnrollRIDPMethod") === "Experian"){    
                                // roleName and appName should come from ESV
                                //nodeState.putShared("appName","Kyid Portal")
                                //nodeState.putShared("roleName","Citizen")
                                 nodelogger.debug("applicationList in esv is : => "+ applicationList)
                                 nodelogger.debug("roleName in esv is : => "+ roleName)
                                 
                                if(applicationList.includes(nodeState.get("appName")) && roleName.includes(nodeState.get("roleName"))){  
                                    roleMatch = true;
                                    var roleInKOG = checkRoleInKOG(responseMCISearchApiCall.MCIResponse[i].KOGID, applicationList, roleName);
                                    nodelogger.debug("roleInKOG is --> "+roleInKOG)  
                                    if(roleInKOG && roleInKOG === true ){ 
                                        if(searchUserInKOGResponse &&  searchUserInKOGResponse.UserDetails && searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                            emailWithMatchedRole.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                        }
                                    }
                                }
                            }
                            nodelogger.debug("searchUserInKOGResponse KOGID is --> "+responseMCISearchApiCall.MCIResponse[i].KOGID)
                            nodelogger.debug("KOGID in nodeState is --> "+nodeState.get("KOGID"))
                            if(responseMCISearchApiCall.MCIResponse[i].KOGID === nodeState.get("KOGID") && roleMatch==false){
                                validUser = true;   
                                break;
                            }
        
                            if(searchUserInKOGResponse && roleMatch==false){
                                 nodelogger.debug("Getting User Emails")
                                //if(searchUserInKOGResponse.UserDetails.EmailAddress && searchUserInKOGResponse.UserDetails.UserStatus == 1){
                                if(searchUserInKOGResponse.UserDetails.EmailAddress){
                                    searchEmailArray.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                                }
                                                    
                                searchUserInKOGArray.push(searchUserInKOGResponse)
                            }
                        } 
                        nodeState.putShared("searchUserInKOGArray",searchUserInKOGArray)
                        nodeState.putShared("searchEmailArray",searchEmailArray)

                        if(roleInKOG){
                            nodeState.putShared("searchEmailArray",emailWithMatchedRole)
                        }
                        
                        if(searchUserInKOGArray.length>0){
                            searchUserInKOGResponse = true
                        }
                       
                    }
                    if(searchUserInKOGResponse && searchUserInKOGResponse !== null && searchUserInKOGResponse !== false){
                        nodelogger.debug("###1111####")
                        nodeState.putShared("searchUserInKOGResponse",searchUserInKOGResponse)
                        if(emailWithMatchedRole.length>0){
                            var searchResponse = searchUserIdentity();
                            nodeState.putShared("proofingMethod","-1")
                            patchUserIdentity(searchResponse._id,null, "-1")
                            nodeState.putShared("prereqStatus","REVERIFY")
                            nodeState.putShared("displayUser", "true")
                            action.goTo("displayUser") 
                        }else{
                            var searchResponse = searchUserIdentity();
                            nodeState.putShared("proofingMethod","2")
                            patchUserIdentity(searchResponse._id,null, "2")
                            nodeState.putShared("prereqStatus","COMPLETED")
                            action.goTo("MCISYNC") 
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

function patchUserIdentity(Id,lexId,proofingMethod) {
    nodelogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    try {
        nodelogger.debug("_patchUserIdentity id is --> "+Id)
        var jsonArray = []
        var verificationStatus = "notverified"
        if(proofingMethod != "-1"){
            verificationStatus = "verified"
        }
        if(verificationStatus){
        var jsonObj = {
            "operation": "replace",
            "field": "verificationStatus",
            "value": verificationStatus
            }
            jsonArray.push(jsonObj)
        }

        //KOGID
        if(nodeState.get("KOGID") ){
        var jsonObj = {
            "operation": "replace",
            "field": "KOGID",
            "value": nodeState.get("KOGID")
            }
            jsonArray.push(jsonObj)
        }

        //Given Name
        if(nodeState.get("givenName")){
        var jsonObj = {
            "operation": "replace",
            "field": "givenName",
            "value": nodeState.get("givenName")
            }
            jsonArray.push(jsonObj)
        }

        //Middle Name
        if(nodeState.get("custom_middleName") && nodeState.get("custom_middleName")!==null){
        var jsonObj = {
            "operation": "replace",
            "field": "middleName",
            "value": nodeState.get("custom_middleName")
            }
            jsonArray.push(jsonObj) 
        }

        //SN
        if(nodeState.get("sn")){
        var jsonObj = {
            "operation": "replace",
            "field": "sn",
            "value": nodeState.get("sn")
            }
            jsonArray.push(jsonObj) 
        }

        //Proofing Method
        nodelogger.debug("proofingMethod is :: "+ nodeState.get("proofingMethod"))
        if(nodeState.get("proofingMethod")!== null && nodeState.get("proofingMethod")){
        var jsonObj = {
            "operation": "replace",
            "field": "proofingMethod",
            "value": nodeState.get("proofingMethod")
            }
            jsonArray.push(jsonObj) 
        }


        //Suffix
        if(nodeState.get("custom_suffix")){
        var jsonObj = {
            "operation": "replace",
            "field": "suffix",
            "value": nodeState.get("custom_suffix")
            }
            jsonArray.push(jsonObj)
        }
        


        //Gender
        if(nodeState.get("custom_gender")){
        var jsonObj = {
            "operation": "replace",
            "field": "gender",
            "value": nodeState.get("custom_gender")
            }
            jsonArray.push(jsonObj)
        }

        //DOB
        if(nodeState.get("custom_dateofBirth")){
        var jsonObj = {
            "operation": "replace",
            "field": "dob",
            "value": nodeState.get("custom_dateofBirth")
            }
            jsonArray.push(jsonObj) 
        }
        //isHomeless
        if(nodeState.get("isHomeless")){
        var jsonObj = {
            "operation": "replace",
            "field": "isHomeLess",
            "value": JSON.parse(nodeState.get("isHomeless"))
            }
            jsonArray.push(jsonObj) 
        }

        //Address Line1
        if(nodeState.get("postalAddress")){
        var jsonObj = {
            "operation": "replace",
            "field": "addressLine1",
            "value": nodeState.get("postalAddress")
            }
            jsonArray.push(jsonObj)  
        }

        //Address Line2
        if(nodeState.get("custom_postalAddress2")){
        var jsonObj = {
            "operation": "replace",
            "field": "addressLine2",
            "value": nodeState.get("custom_postalAddress2")
            }
            jsonArray.push(jsonObj)
        }

        //City
        if(nodeState.get("city")){
        var jsonObj = {
            "operation": "replace",
            "field": "city",
            "value": nodeState.get("city")
            }
            jsonArray.push(jsonObj) 
        }

        //Postal Code
        if(nodeState.get("postalCode")){
        var jsonObj = {
            "operation": "replace",
            "field": "zip",
            "value": nodeState.get("postalCode")
            }
            jsonArray.push(jsonObj)   
        }

        //Postal Extension
        if(nodeState.get("zipExtension")){
        var jsonObj = {
            "operation": "replace",
            "field": "zipExtension",
            "value": nodeState.get("zipExtension")
            }
            jsonArray.push(jsonObj)  
        }


        //Country Code
        if(nodeState.get("stateProvince")){
        var jsonObj = {
            "operation": "replace",
            "field": "stateCode",
            "value": nodeState.get("stateProvince")
            }
            jsonArray.push(jsonObj)  
        }

        //County Code
        if(nodeState.get("custom_county")){
        var jsonObj = {
            "operation": "replace",
            "field": "countyCode",
            "value": nodeState.get("custom_county")
            }
            jsonArray.push(jsonObj)   
        }

        //County Code
        if(nodeState.get("custom_title")){
        var jsonObj = {
            "operation": "replace",
            "field": "title",
            "value": nodeState.get("custom_title")
            }
            jsonArray.push(jsonObj)   
        }

        //LanguagePreference
        if(nodeState.get("languagePreference")){
        var jsonObj = {
            "operation": "replace",
            "field": "languagePreference",
            "value": nodeState.get("languagePreference")
            }
            jsonArray.push(jsonObj)   
        }

        //uuid
        nodelogger.debug("LEXID is :: => "+ nodeState.get("lexId"))
        if(nodeState.get("lexId") && nodeState.get("lexId")!==null){
        var jsonObj = {
            "operation": "replace",
            "field": "uuid",
            "value": nodeState.get("lexId")
            }
            jsonArray.push(jsonObj)   
        }

        //lastVerificationDate
        var jsonObj = {
            "operation": "replace",
            "field": "lastVerificationDate",
            "value": dateTime
            }
            jsonArray.push(jsonObj)   

        //updateDate
        var jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": dateTime
            }
            jsonArray.push(jsonObj)

        //updateDateEpoch
        var jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": currentTimeEpoch
            }
            jsonArray.push(jsonObj)

        if(jsonArray.length>0){
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
            nodelogger.debug("Patch Response -->"+response)
            if(response){
                return true
            }
        }else{
            return false
        }  
    } catch (error) {
        nodelogger.error("Error Occurred While patchUserIdentity "+ error)
        nodelogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
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