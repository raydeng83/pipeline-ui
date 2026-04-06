var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.MCIApiCall",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

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
    },
    info: function (message) {
        logger.info(message);
    }
}

// Main Execution
try {
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = nodeState.get("userInfoJSON");
   
    var displayCallBackJSON = {
            "apiCalls":[{
               	"method" :"MCI",
            	"action" : "search"
                
            }],

            "collectedUserInfo": nodeState.get("userInfoJSON")
    };
   
   
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }

        // var pageHeader= "2_add_methods";
         var pageHeader= {"pageHeader": "3_RIDP_MCI_Search"};


        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
       
        callbacksBuilder.textInputCallback("Response")
   

        callbacksBuilder.confirmationCallback(0, ["Next"], 0);



    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}



function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var MCISearchApiCall = callbacks.getTextInputCallbacks()[0];
        // Validate MCISearchApiCall input
        try {
            var parsedInput = JSON.parse(MCISearchApiCall);
            var allowedStatuses = ["noMatch", "partialMatch", "fullMatch"];
            var isValid = false;
            if (typeof parsedInput === "object") {
                var status = parsedInput.status || parsedInput[""] || null;
                if (allowedStatuses.includes(status)) {
                    parsedInput.status = status;
                    isValid = true;
                    if (parsedInput.status === "fullMatch") {
                        isValid = isValid &&
                            Array.isArray(parsedInput.MCIResponse) &&
                            parsedInput.MCIResponse.length > 0 &&
                            parsedInput.MCIResponse[0].KOGID &&
                            parsedInput.MCIResponse[0].email;
                    } else {
                        isValid = isValid &&
                            Array.isArray(parsedInput.MCIResponse) &&
                            parsedInput.MCIResponse.length === 0;
                    }
                }
            }
            if (!isValid) {
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("error");
                return;
            }
        } catch (e) {
            logger.error("MCISearchApiCall validation failed: " + e.message);
            nodeState.putShared("validationMessage", "invalid_input");
            action.goTo("error");
            return;
        }
        MCISearchApiCall = JSON.parse(MCISearchApiCall);
        logger.debug("MCISearchApiCall response is --> " + JSON.stringify(MCISearchApiCall));
        // MCISyncApiCall = JSON.parse(lexisNexisUsers)

        if (selectedOutcome === 0) {
           nodeState.putShared("validationErrorCode", null);
            if(MCISearchApiCall.status === "fullMatch"){
                logger.debug("Inside Full Macth error")
                if(MCISearchApiCall.MCIResponse.length>0){
                    logger.debug("MCISearchApiCall.MCIResponse.length"+MCISearchApiCall.MCIResponse.length)
                    var searchUserInKOGResponse = null;
                    var searchUserInKOGArray = []
                    var searchEmailArray = []
                    var validUser = false
                    for (var i = 0; i < MCISearchApiCall.MCIResponse.length; i++) {
                        logger.debug("Inside for loop")
                        if(MCISearchApiCall.MCIResponse[i].KOGID === nodeState.get("KOGID")){
                           validUser = true
                            break;
                        }
                        searchUserInKOGResponse = searchUserInKOG(MCISearchApiCall.MCIResponse[i].KOGID);
                        logger.debug("searchUserInKOGResponse is --> "+searchUserInKOGResponse)
    
                        if(searchUserInKOGResponse){
                            if(searchUserInKOGResponse.UserDetails.EmailAddress){
                                searchEmailArray.push(searchUserInKOGResponse.UserDetails.EmailAddress)
                            }
                                                   
                            searchUserInKOGArray.push(searchUserInKOGResponse)
                            nodeState.putShared("searchUserInKOGArray",searchUserInKOGArray)
                            nodeState.putShared("searchEmailArray",searchEmailArray)
                        }

                        
                    }

                    
                }
                if(validUser===true){
              // Create User Identity Object
                    var proofingMethod = "1";
                    // if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    //     proofingMethod = "1";
                    // }
                    // else{
                    //     proofingMethod = "2";
                    // }
                    var lexId = null
                    logger.debug("NodeState.get --> LexId is "+nodeState.get("lexId"))
                    if(nodeState.get("lexId")){
                        lexId = nodeState.get("lexId")
                    }
                    if(searchUserIdentity()){
                        var searchResponse = searchUserIdentity();
                        patchUserIdentity(searchResponse._id,lexId)
                        
                        
                    }
                    else{
                        createUser(userInfoJSON,proofingMethod,lexId)
                    }
                     nodeState.putShared("validationMessage", null);
                   if(nodeState.get("appEnrollRIDPMethod") === "Experian"){
                        nodeState.putShared("prereqStatus","COMPLETED")
                        action.goTo("SyncExp")
                    }else{
                        nodeState.putShared("validationMessage", null);
                        action.goTo("MCISYNC")
                    }
                     
                    
                }
                if(searchUserInKOGResponse && searchUserInKOGResponse !== null && searchUserInKOGResponse !== false){
                    nodeState.putShared("searchUserInKOGResponse",searchUserInKOGResponse)
                    if(nodeState.get("context")==="appEnroll"){
                        nodeState.putShared("prereqStatus","NOT_COMPLETED")
                        action.goTo("appEnrollRIDPmsg")
                    }
                    else{
                        if(nodeState.get("firsttimeloginjourney") == "true"){
                            action.goTo("firstTimeLogin")  
                        }else{
                            nodeState.putShared("validationMessage", null);
                            action.goTo("displayUser")  
                        }

                    }
                    
                }
                else if(searchUserInKOGResponse === false && searchUserInKOGResponse !== null && nodeState.get("context") === "appEnroll"){
                    //CreateUserin UserIdentity
                    var proofingMethod = "1";
                    // if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    //     proofingMethod = "1";
                    // }
                    // else{
                    //     proofingMethod = "2";
                    // }
                    var lexId = null
                    logger.error("NodeState.get --> LexId is "+nodeState.get("lexId"))
                    if(nodeState.get("lexId")){
                        lexId = nodeState.get("lexId")
                    }
                    if(searchUserIdentity()){
                        var searchResponse = searchUserIdentity();
                        patchUserIdentity(searchResponse._id,lexId,proofingMethod)
                        
                        
                    }
                    else{
                        createUser(userInfoJSON,proofingMethod,lexId)
                    }

                    nodeState.putShared("validationMessage", null);
                    if(nodeState.get("appEnrollRIDPMethod") === "Experian"){
                        nodeState.putShared("prereqStatus","COMPLETED")
                        action.goTo("SyncExp")
                    }else{
                        action.goTo("MCISYNC")
                    }
                    
                }
                else if(searchUserInKOGResponse === false && searchUserInKOGResponse !== null){
                    nodeState.putShared("validationMessage", null);
                    if(nodeState.get("firsttimeloginjourney") == "true"){
                            action.goTo("firstTimeLogin")  
                    }else{
                    nodeState.putShared("validationMessage", null);
                    action.goTo("createAccount")
                    }
                }
            }
            else if(MCISearchApiCall.status === "partialMatch"){
                if(nodeState.get("context") === "appEnroll"){
                    // Create User Identity Object
                    var proofingMethod = "1";
                    // if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    //     proofingMethod = "1";
                    // }
                    // else{
                    //     proofingMethod = "2";
                    // }
                    var lexId = null
                    logger.debug("NodeState.get --> LexId is "+nodeState.get("lexId"))
                    if(nodeState.get("lexId")){
                        lexId = nodeState.get("lexId")
                    }
                    if(searchUserIdentity()){
                        var searchResponse = searchUserIdentity();
                        patchUserIdentity(searchResponse._id,lexId)
                        
                        
                    }
                    else{
                        createUser(userInfoJSON,proofingMethod,lexId)
                    }
                     nodeState.putShared("validationMessage", null);
                    if(nodeState.get("appEnrollRIDPMethod") === "Experian"){
                        nodeState.putShared("prereqStatus","COMPLETED")
                        action.goTo("SyncExp")
                    }else{
                        action.goTo("MCISYNC")
                    }
                }
                else{
                     nodeState.putShared("validationMessage", null);
                    if(nodeState.get("firsttimeloginjourney") == "true"){
                            action.goTo("firstTimeLogin")  
                    }else{
                    if(nodeState.get("LexIdMachFound") == true){
                        nodeState.putShared("createProofingMethod","1")
                    }else{
                        nodeState.putShared("createProofingMethod","-1")
                    }
                    
                    nodeState.putShared("validationMessage", null);
                    action.goTo("createAccount")
                    }
                }
               
                
            }
            else if(MCISearchApiCall.status === "noMatch"){
                if(nodeState.get("context") === "appEnroll"){
                    // Create User Identity Object
                    var proofingMethod = "1";
                    // if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    //     proofingMethod = "1";
                    // }
                    // else{
                    //     proofingMethod = "2";
                    // }
                    var lexId = null
                    if(nodeState.get("lexId")){
                        lexId = nodeState.get("lexId")
                    }
                    if(searchUserIdentity()){
                        var searchResponse = searchUserIdentity();
                        patchUserIdentity(searchResponse._id,lexId,proofingMethod)
                        
                    }
                    else{
                        createUser(userInfoJSON,proofingMethod,lexId)
                    }
                    nodeState.putShared("validationMessage", null);
                    if(nodeState.get("appEnrollRIDPMethod") === "Experian"){
                        nodeState.putShared("prereqStatus","COMPLETED")
                        action.goTo("SyncExp")
                    }else{
                        action.goTo("MCISYNC")
                    }
                }
                else{
                    if(nodeState.get("firsttimeloginjourney") == "true"){
                            action.goTo("firstTimeLogin")  
                    }else{
                    nodeState.putShared("validationMessage", null);
                    if(nodeState.get("LexIdMachFound") == true){
                        nodeState.putShared("createProofingMethod","1")
                    }else{
                        nodeState.putShared("createProofingMethod","-1")
                    }
                    action.goTo("createAccount")
                    }
                }
                
                
            }
            else{
                nodeState.putShared("validationMessage", null);
                action.goTo("false")
            }
    

        }
        
    } catch (error) {
        logger.error(
            (typeof transactionid !== "undefined" ? transactionid : "") + "::" +
            (nodeConfig && nodeConfig.timestamp ? nodeConfig.timestamp : "") + "::" +
            (nodeConfig && nodeConfig.node ? nodeConfig.node : "") + "::" +
            (nodeConfig && nodeConfig.nodeName ? nodeConfig.nodeName : "") + "::" +
            (nodeConfig && nodeConfig.script ? nodeConfig.script : "") + "::" +
            (nodeConfig && nodeConfig.scriptName ? nodeConfig.scriptName : "") + "::" +
            (nodeConfig && nodeConfig.begin ? nodeConfig.begin : "") + "::" +
            "error occurred in handleUserResponses function ::" + error +
            (typeof mail !== "undefined" ? mail : "")
        );
        nodeState.putShared("validationMessage", "invalid_input");
        action.goTo("error");

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
            logger.debug("KYID.2B1.Journey.IDProofing.MCISearchApiCall call duration in seconds : " + durationInSeconds );
            if (kogUserProfileAPIResponse.status === 200) {
                var apiResponse = JSON.parse(kogUserProfileAPIResponse.text());
                logger.debug("kogUserProfileAPIResponse apiResponse is --> "+ JSON.stringify(apiResponse))
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
        logger.error("Error Occurred while searchUserInKOG "+ error)
        
    }
}

function createUser(userInfoJSON,proofingMethod,lexId) {
    try {
         var auditDetails = require("KYID.2B1.Library.AuditDetails")
                            var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.debug("Starting user identity creation for ID: " );

        // const fieldMap = {
        //     "givenName": "givenName",
        //     "middleName": "middleName",
        //     "sn": "sn",
        //     "custom_gender": "gender",
        //     "custom_suffix": "suffix",
        //     "custom_dateofBirth": "dob",
        //     "postalAddress": "addressLine1",
        //     "custom_postalAddress2": "addressLine2",
        //     "stateProvince": "stateCode",
        //     "postalCode": "zip",
        //     "custom_county": "countyCode",
        //     "telephoneNumber": "telephoneNumber"
        // };

        // const jsonArray = [];

        // Object.keys(fieldMap).forEach(field =>
        //     {
        //         const value = nodeState.get(field);
        //         if (value) {
        //             jsonArray.push({
        //                 operation: "add",
        //                 field: fieldMap[field],
        //                 value: value
        //             });
        //         }
        //     }
        // );
        

        var userData={
            "proofingMethod":proofingMethod,
            "lastVerificationDate":dateTime,
            "uuid":lexId,
            "createDate":dateTime,
            "updateDate":dateTime,
            "createDateEpoch":currentTimeEpoch,
            "updateDateEpoch":currentTimeEpoch,
            "recordState":"0",
            "recordSource":"KYID-System",
            "createDate": auditData.createdDate,
                                "createdBy": auditData.createdBy,
                                "createdByID": auditData.createdByID,
                                "createDateEpoch": auditData.createdDateEpoch,
                                "updateDate": auditData.updatedDate,
                                "updateDateEpoch": auditData.updatedDateEpoch,
                                "updatedBy": auditData.updatedBy,
                                "updatedByID": auditData.updatedByID,
            account:[]
                                    
        }
        if(nodeState.get("UserId")){
            userData.account.push({ "_ref": "managed/alpha_user/" + nodeState.get("UserId"), "_refProperties": {} })
        }
        if(userInfoJSON.suffix){
            userData["suffix"]=userInfoJSON.suffix
        }
        if(userInfoJSON.middleName){
            userData["middleName"]=userInfoJSON.middleName
        }
        if(userInfoJSON.stateProvince){
            userData["stateCode"]=userInfoJSON.stateProvince
        }
        if(userInfoJSON.sn){
            userData["sn"]=userInfoJSON.sn
        }
        if(userInfoJSON.gender){
            userData["gender"]=userInfoJSON.gender
        }
        if(userInfoJSON.dob){
            userData["dob"]=userInfoJSON.dob
        }
        if(userInfoJSON.postalAddress){
            userData["addressLine1"]=userInfoJSON.postalAddress
        }
        if(userInfoJSON.postalAddress2){
            userData["addressLine2"]=userInfoJSON.postalAddress2
        }
        if(userInfoJSON.givenName){
            userData["givenName"]=userInfoJSON.givenName
        }
        if(userInfoJSON.city){
            userData["city"]=userInfoJSON.city
        }
        if(userInfoJSON.postalCode){
            userData["zip"]=userInfoJSON.postalCode
        }
        if(userInfoJSON.postalExtension){
            userData["postalExtension"]=userInfoJSON.postalExtension
        }
        if(userInfoJSON.county){
            userData["countyCode"]=userInfoJSON.county
        }
            var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
            nodeState.putShared("patchUserId",response._id)
        logger.debug("response is --> "+ response)


    } catch (error) {
        logger.error("Errror Occurred While creating userIdentity is --> "+ error)
        
    }
    
}


function searchUserIdentity() {
try {
    logger.debug("User Id -->"+  nodeState.get("UserId"))
    var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'account/_refResourceId eq "' +  nodeState.get("UserId") + '"' }, ["*"]);
    logger.debug("userIdentityResponse --> "+userIdentityResponse)
    
    if(userIdentityResponse && userIdentityResponse.resultCount>0){
        
        return userIdentityResponse.result[0]
    }
    else{
        return null
    }
    // return {
    //    "resultCount":1,
    //     "result":[{
    //           "mail": "narendratest@yopmail.com"
    //     }
          
    //     ]
    // }
    
    // return {resultCount:0}
    
} catch (error) {
    logger.error("Error Occurred While searchUserIdentity "+ error)
    
}    
}

function patchUserIdentity(Id,lexId,proofingMethod) {
try {
    logger.debug("_patchUserIdentity id is --> "+Id+"Lexid::"+lexId)
    var jsonArray = []

    if(lexId !== null && lexId){
    var jsonObj = {
        "operation": "replace",
        "field": "uuid",
        "value": lexId
        }
        jsonArray.push(jsonObj)
  
        
    }
    if(proofingMethod !== null && proofingMethod){
    var jsonObj = {
        "operation": "replace",
        "field": "proofingMethod",
        "value": proofingMethod
        }
        jsonArray.push(jsonObj)
  
        
    }

    if(nodeState.get("orig_givenName")){
    var jsonObj = {
        "operation": "replace",
        "field": "givenName",
        "value": nodeState.get("orig_givenName")
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_sn")){
    var jsonObj = {
        "operation": "replace",
        "field": "sn",
        "value": nodeState.get("orig_sn")
        }
        jsonArray.push(jsonObj)
        
        
    }
    
    if(nodeState.get("orig_custom_middleName")){
    var jsonObj = {
        "operation": "replace",
        "field": "middleName",
        "value": nodeState.get("orig_custom_middleName")
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_custom_gender")){
    var jsonObj = {
        "operation": "replace",
        "field": "gender",
        "value": nodeState.get("orig_custom_gender")
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_custom_dateofBirth")){
    var jsonObj = {
        "operation": "replace",
        "field": "dob",
        "value": nodeState.get("orig_custom_dateofBirth")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_postalAddress")){
    var jsonObj = {
        "operation": "replace",
        "field": "addressLine1",
        "value": nodeState.get("orig_postalAddress")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_custom_postalAddress2")){
    var jsonObj = {
        "operation": "replace",
        "field": "addressLine2",
        "value": nodeState.get("orig_custom_postalAddress2")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_city")){
    var jsonObj = {
        "operation": "replace",
        "field": "city",
        "value": nodeState.get("orig_city")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_postalCode")){
    var jsonObj = {
        "operation": "replace",
        "field": "zip",
        "value": nodeState.get("orig_postalCode")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_stateProvince")){
    var jsonObj = {
        "operation": "replace",
        "field": "stateCode",
        "value": nodeState.get("orig_stateProvince")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_custom_county")){
    var jsonObj = {
        "operation": "replace",
        "field": "countyCode",
        "value": nodeState.get("orig_custom_county")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("postalExtension")){
    var jsonObj = {
        "operation": "replace",
        "field": "postalExtension",
        "value": nodeState.get("postalExtension")
        }
        jsonArray.push(jsonObj)
        
        
    }

    try {
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    jsonObj = { operation: "replace", field: "/updatedDateEpoch", value: auditData.updatedDateEpoch }
    jsonArray.push(jsonObj)
    jsonObj = { operation: "replace", field: "/updatedByID", value: auditData.updatedByID }
    jsonArray.push(jsonObj)
    jsonObj = { operation: "replace", field: "/updateDate", value: auditData.updatedDate }
    jsonArray.push(jsonObj)
    jsonObj = { operation: "replace", field: "/updatedBy", value: auditData.updatedBy }
    jsonArray.push(jsonObj)
    logger.debug("auditDetail " + JSON.stringify(auditData))
} catch (error) {
    logger.error("Error Occured : Couldnot find audit details" + error)

}

    logger.debug("KYID.2B1.Journey.IDProofing.MCISearchApiCall jsonArray Length is --> "+jsonArray.length )

    if(jsonArray.length>0){
         var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
         nodeState.putShared("patchUserId",response._id)
        logger.debug("Patch Response -->"+response)
         
    if(response){
        return true
    }
    }
    else{
        return false
    }




    
} catch (error) {
    logger.error("Error Occurred While patchUserIdentity "+ error)
    
}    
}