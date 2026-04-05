/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check In Person ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RIDP.Check.In.Person",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    MISSING_MANDATORY: "divert",
    EXIT: "exit",
    changeLog: "changeLog"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

function patchSIH(Id) {
    var missingInputs = [];
    try {

        //RequestorKOGID
        var kogID;
        if (nodeState.get("KOGID") != null) {
            kogID = nodeState.get("KOGID");
        } else {
            missingInputs.push("kogID");
        }

        // Transaction ID
        var transactionID = generateGUID();

        // logger.debug("logOn is :: => "+ nodeState.get("orig_logOn"))
        // logger.debug("orig_upn is :: => "+ nodeState.get("orig_upn"))
        // logger.debug("KOGID is :: => "+ nodeState.get("KOGID"))
        // logger.debug("organDonorStatus is :: => "+ nodeState.get("organDonorStatus"))

        // Logon
        var logOn;
        if (nodeState.get("orig_logOn") != null) {
            logOn = nodeState.get("orig_logOn");
        } else {
            missingInputs.push("logOn");
        }

        // UPN
        var upn;
        if (nodeState.get("orig_upn") != null) {
            upn = nodeState.get("orig_upn");
        } else {
            missingInputs.push("upn");
        }

        // First Name
        var firstName;
        if (nodeState.get("givenName") != null) {
            firstName = nodeState.get("givenName");
        } else {
            missingInputs.push("firstName");
        }

        // Middle Name
        var middleName;
        if (nodeState.get("custom_middleName") != null) {
            middleName = nodeState.get("custom_middleName");
        }

        // Last Name
        var lastName;
        if (nodeState.get("sn") != null) {
            lastName = nodeState.get("sn");
        } else {
            missingInputs.push("lastName");
        }

        // Address1
        var postalAddressOne;
        if (nodeState.get("postalAddress") != null) {
            postalAddressOne = nodeState.get("postalAddress");
        }

        // Address2
        var postalAddressTwo;
        if (nodeState.get("custom_postalAddress2") != null) {
            postalAddressTwo = nodeState.get("custom_postalAddress2");
        }

        // City
        var city;
        if (nodeState.get("city") != null) {
            city = nodeState.get("city");
        }

        // State
        var state;
        if (nodeState.get("stateProvince") != null) {
            state = nodeState.get("stateProvince");
        }


        // Postal Code
        var postalCode;
        if (nodeState.get("postalCode") != null) {
            postalCode = nodeState.get("postalCode");
        }


        // County Code
        var countyCode;
        if (nodeState.get("custom_county") != null) {
            countyCode = nodeState.get("custom_county");
        }

        // Language Preference
        var languagePreference;
        if (nodeState.get("frUnindexedString3") != null || nodeState.get("frUnindexedString3") != undefined || nodeState.get("languagePreference") != null || nodeState.get("languagePreference") != undefined) {
            languagePreference = nodeState.get("frUnindexedString3");
        } else {
            languagePreference = "1";
        }


        // var organDonorStatus ;
        // if (nodeState.get("orig_organDonorRegistrationStatus") != null ) {
        //     organDonorStatus = nodeState.get("orig_organDonorRegistrationStatus");
        // } else {
        //     organDonorStatus = false;
        //     missingInputs.push("organDonorStatus");
        // }
        //logger.debug("organDonorStatus is :: "+ organDonorStatus)


        var updateUserProfileAPIURL;
        if (systemEnv.getProperty("esv.kyid.kogapi.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.updateuserprofile") != null) {
            updateUserProfileAPIURL = systemEnv.getProperty("esv.kyid.kogapi.updateuserprofile");
        } else {
            missingInputs.push("updateUserProfileAPIURL");
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

        var updateUserProfileScope;
        if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") != null) {
            updateUserProfileScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile");
        } else {
            missingInputs.push("updateUserProfileScope");
        }

        if (missingInputs.length > 0) {
            logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
            action.goTo(nodeOutcome.ERROR);
        } else {
            var payload = {}

            if(transactionID){
                payload["TransactionID"] = transactionID;
            }

            if(logOn){
                payload["Logon"] = logOn;       

            }
            if(upn){
                payload["UPN"] = upn;
            }
            
            if(kogID){
                payload["KOGID"] = kogID;
            }

            if(firstName){
                payload["FirstName"] = firstName;
            }
            
            //if(middleName){
                payload["MiddleName"] = middleName || "";
            //}

            if(lastName){
                payload["LastName"] = lastName;
            }

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
                payload["CountyCode"] = countyCode;
            }

            if(languagePreference){
                payload["LanguagePreference"] = languagePreference;
            }

            // if(nodeState.get("organDonorStatus") == true || organDonorStatus){
            //     payload["OrganDonorStatus"] = organDonorStatus;
            // }

            if(kogID){
                payload["RequestorKOGID"] = kogID;
            }
            

            logger.debug("Payload prepared: " + JSON.stringify(payload));

            var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
            logger.debug("ran the access token lib script for email" + kogID)
            var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, updateUserProfileScope);
            nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse) + "for KYID" + kogID);

            if (kogAPITokenResponse.status === 200) {
                logger.debug("access token status is 200" + kogAPITokenResponse + "for KYID" + kogID)
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
                var res = httpClient.send(updateUserProfileAPIURL, requestOptions).get();
                var endTime = new Date();
                var duration = endTime - startTime;  
                var durationInSeconds = duration / 1000;
                logger.debug("KYID.2B1.Journey.UpdateUserProfileSIHAPI call duration in seconds : " + durationInSeconds );     
                logger.debug("response status of user email update in KOG AD " + res.status);
                logger.debug("response of user email in KOG AD " + JSON.stringify(JSON.parse(res.text())));
                action.withHeader(`Response code: ${res.status}`);


                if (res.status === 200) {
                    var data = JSON.parse(res.text());
                    if (data.ResponseStatus === 0 && data.TransactionID) {
                        var fetchedTransactionID = data.TransactionID;
                        logger.debug("the successful transcation id  is " + fetchedTransactionID);
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: user profile updated sucess ::KYID::" + kogID);
                        return true
                    } else {
                        // ResponseStatus not 0, error details present
                        var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                            data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                            "Unknown error";
                        logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                        nodeState.putShared("apireturnederror", msg)
                        auditLog("PRO004", "Personal Information update Failure");
                        return false
                    }
                } else {
                    logger.debug("Non-200 HTTP response: " + res.status);
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::KYID::" + kogID);
                    auditLog("PRO004", "Personal Information update Failure");
                    return false
                }
            } else {
                logger.debug("kogAPITokenResponse is not 200 ");
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: KYID ::" + kogID);
                auditLog("PRO004", "Personal Information update Failure");
                return false
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
        auditLog("PRO004", "Personal Information update Failure");
        return false
    }
}

function patchAlphaUser(Id) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchAlphaUser function");
    try {
        logger.debug("_patchAlphaUser id is --> "+Id)
        var jsonArray = []

        //First Name
        if(nodeState.get("givenName")){
        var jsonObj = {
            "operation": "replace",
            "field": "givenName",
            "value": nodeState.get("givenName")
            }
            jsonArray.push(jsonObj)
        }

        //Last Name
        if(nodeState.get("sn")){
        var jsonObj = {
            "operation": "replace",
            "field": "sn",
            "value": nodeState.get("sn")
            }
            jsonArray.push(jsonObj) 
        }

        //Middle Name
        if(nodeState.get("custom_middleName")){
        var jsonObj = {
            "operation": "replace",
            "field": "custom_middleName",
            "value": nodeState.get("custom_middleName")
            }
            jsonArray.push(jsonObj) 
        }

        if(jsonArray.length>0){
            var response = openidm.patch("managed/alpha_user/" + Id, null, jsonArray);
            logger.debug("Patch Response -->"+response)
            if(response){
                return true
            }
        }else{
            return false
        }  

    } catch (error) {
        logger.error("Error Occurred While patchAlphaUser "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchAlphaUser Function" + error.message);
    }
}

function patchUserIdentity(Id,proofingMethod) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    try {
        logger.debug("_patchUserIdentity id is --> "+Id)
        var jsonArray = []

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
        }else{
        var jsonObj = {
            "operation": "replace",
            "field": "middleName",
            "value": ""
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
        logger.debug("proofingMethod is :: "+ proofingMethod)
        if(proofingMethod!== null && proofingMethod){
        var jsonObj = {
            "operation": "replace",
            "field": "proofingMethod",
            "value": proofingMethod
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "suffix",
            "value": ""
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
            "field": "isHomeless",
            "value": JSON.parse(nodeState.get("isHomeless"))
            }
            jsonArray.push(jsonObj)  
        }
        else{
            var jsonObj = {
            "operation": "replace",
            "field": "isHomeless",
            "value": false
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "addressLine1",
            "value": ""
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "addressLine2",
            "value": ""
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "city",
            "value": ""
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "zip",
            "value": ""
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
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "zipExtension",
            "value": ""
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
        else{
            var jsonObj = {
            "operation": "replace",
            "field": "stateCode",
            "value": ""
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
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "countyCode",
            "value": ""
            }
            jsonArray.push(jsonObj)   
            
        }
        
        //Country Code
        if(nodeState.get("orig_custom_country") || nodeState.get("country")){
        var jsonObj = {
            "operation": "replace",
            "field": "countryCode",
            "value": nodeState.get("orig_custom_country") || nodeState.get("country")
            }
            jsonArray.push(jsonObj)   
        }
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "countryCode",
            "value": ""
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
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "title",
            "value": ""
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
        if(nodeState.get("uuid") && nodeState.get("uuid")!==null && typeof nodeState.get("uuid")!== 'undefined'){
        var jsonObj = {
            "operation": "replace",
            "field": "uuid",
            "value": nodeState.get("uuid")
            }
            jsonArray.push(jsonObj)   
        }

        //verificationMismatch
        if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!==null && nodeState.get("verificationMismatch") === true){
        var jsonObj = {
            "operation": "replace",
            "field": "verificationMismatch",
            "value": nodeState.get("verificationMismatch")
            }
            jsonArray.push(jsonObj)   
        }else{
             var jsonObj = {
            "operation": "replace",
            "field": "verificationMismatch",
            "value": false
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

         //verificationStatus
        var jsonObj = {
            "operation": "replace",
            "field": "verificationStatus",
            "value": "verified"
            }
            jsonArray.push(jsonObj)   

        //assuranceLevel
        var jsonObj = {
            "operation": "replace",
            "field": "assuranceLevel",
            "value": "1"
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

        //corrected_givenName
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_givenName",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //status_givenName
        var jsonObj = {
            "operation": "replace",
            "field": "status_givenName",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_sn
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_sn",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //status_sn
        var jsonObj = {
            "operation": "replace",
            "field": "status_sn",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_middleName
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_middleName",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //status_middleName
        var jsonObj = {
            "operation": "replace",
            "field": "status_middleName",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_dob
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_dob",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //status_dob
        var jsonObj = {
            "operation": "replace",
            "field": "status_dob",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_addressLine1
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_addressLine1",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_addressLine2
        var jsonObj = {
            "operation": "replace",
            "field": "corrected_addressLine2",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_city
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_city",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_stateCode
        var jsonObj = {
            "operation": "replace",
            "field": "corrected_stateCode",
            "value": ""
            }
            jsonArray.push(jsonObj)


        //corrected_zip
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_zip",
            "value": ""
            }
            jsonArray.push(jsonObj)


        //corrected_countryCode
        var jsonObj = {
            "operation": "replace",
            "field": "corrected_countryCode",
            "value": ""
            }
            jsonArray.push(jsonObj)

        //corrected_zipExtension
        var jsonObj = { 
            "operation": "replace",
            "field": "corrected_zipExtension",
            "value": ""
            }
            jsonArray.push(jsonObj)

        // //updatedBy
        // if(nodeState.get("_id") || nodeState.get("id")){
        // var jsonObj = {
        //     "operation": "replace",
        //     "field": "updatedBy",
        //     "value": nodeState.get('_id') || nodeState.get('id')
        //     }
        //     jsonArray.push(jsonObj)
        // }

        if(jsonArray.length>0){
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
            logger.debug("Patch Response -->"+response)
            if(response){
                return true
            }
        }else{
            return false
        }  
    } catch (error) {
        logger.error("Error Occurred While patchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
    }    
}


function updatePrereqStatus(userPrereqId, expiryDate, expiryDateEpoch, userInfoJSON) {
  try {
    var jsonArray = [];
    var prereqValues = [];
    var userInfoJSON = nodeState.get("userInfoJSON");
    logger.debug("prereqValues are --> " + JSON.stringify(prereqValues));

    var jsonObj = {
      operation: "replace",
      field: "status",
      value: "COMPLETED",
    };
    jsonArray.push(jsonObj);

    jsonObj = {
      operation: "replace",
      field: "updateDateEpoch",
      value: currentTimeEpoch,
    };
    jsonArray.push(jsonObj);

    jsonObj = {
      operation: "replace",
      field: "updateDate",
      value: dateTime,
    };
    jsonArray.push(jsonObj);

    if (nodeState.get("prereqStatus") === "COMPLETED") {
      jsonObj = {
        operation: "replace",
        field: "completionDateEpoch",
        value: currentTimeEpoch,
      };
      jsonArray.push(jsonObj);
    }

    if (nodeState.get("prereqStatus") === "COMPLETED") {
      jsonObj = {
        operation: "replace",
        field: "completionDate",
        value: dateTime,
      };
      jsonArray.push(jsonObj);
    }

    if (expiryDate !== null) {
      jsonObj = {
        operation: "replace",
        field: "expiryDate",
        value: expiryDate,
      };
      jsonArray.push(jsonObj);
    }

    if (expiryDateEpoch !== null) {
      jsonObj = {
        operation: "replace",
        field: "expiryDateEpoch",
        value: expiryDateEpoch,
      };
      jsonArray.push(jsonObj);
    }

    jsonObj = {
      operation: "replace",
      field: "updatedBy",
      value: nodeState.get("UserId"),
    };
    jsonArray.push(jsonObj);

    if (prereqValues.length > 0) {
      jsonObj = {
        operation: "replace",
        field: "prerequisiteValues",
        value: prereqValues,
      };
      jsonArray.push(jsonObj);
    }

    logger.debug(
      "endpoint/UserPrerequisiteAPI jsonArray --> " + JSON.stringify(jsonArray)
    );

    var response = openidm.patch(
      "managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqId,
      null,
      jsonArray
    );
    logger.debug("updatePrereqStatus -- response --> " + response);
    if (response) {
      return response;
    } else {
      return null;
    }
  } catch (error) {
    logger.error(
      "Error Occurred while updatePrereqStatus User Prerequsites" + error
    );
    action.goTo("error");
  }
}


function getBusinessApp(prereqID){
    try{
       var userPrereq = openidm.read("managed/alpha_kyid_enrollment_user_prerequisites/" + prereqID, null, ["*"]);

        if (userPrereq) {
            var roleId = userPrereq.associatedRoleIds;
            logger.debug("Role IDs = "+roleId);
        }
        var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/",{_queryFilter: 'roleAppId/_refResourceId eq "' + roleId + '"'},["*"]); 
        
        if (businessAppResponse.resultCount > 0) {
            var businessApp = businessAppResponse.result[0].name;
            logger.debug("Business App = "+businessApp);
            return businessApp;
        }
    }
catch(error){
     logger.error("Errror Occurred While fetching business App in function getBusinessApp is --> "+ error)
}
    
}

function patchTransaction(status, expiryDate, expiryDateEpoch) {
  try {
    logger.debug("Starting user patchTransaction creation for ID: ");
    logger.debug("status is --> " + status);
    logger.debug("expiryDate is --> " + expiryDate);
    logger.debug("expiryDateEpoch is --> " + expiryDateEpoch);
    logger.debug("currentTimeEpoch is --> " + currentTimeEpoch);
    logger.debug("dateTime is --> " + dateTime);
    logger.debug("user Id  is --> " + nodeState.get("UserId"));
    logger.debug("user prereq Id  is --> " + nodeState.get("userPrereqId"));

    var jsonArray = [];

    logger.debug("user prereq ID = " + nodeState.get("userPrereqId"));
    var businessApp = getBusinessApp(nodeState.get("userPrereqId"));
    logger.debug("Business App = " + businessApp);

    if (status) {
      var jsonObj = {
        operation: "replace",
        field: "status",
        value: "0",
      };
      jsonArray.push(jsonObj);
    }

    if (dateTime) {
      var jsonObj = {
        operation: "replace",
        field: "updateDate",
        value: dateTime,
      };
      jsonArray.push(jsonObj);
    }

    if (currentTimeEpoch) {
      var jsonObj = {
        operation: "replace",
        field: "updateDateEpoch",
        value: currentTimeEpoch,
      };
      jsonArray.push(jsonObj);
    }

    if (nodeState.get("UserId")) {
      var jsonObj = {
        operation: "replace",
        field: "updatedBy",
        value: nodeState.get("UserId"),
      };
      jsonArray.push(jsonObj);
    }

    if (expiryDate) {
      var jsonObj = {
        operation: "replace",
        field: "expiryDate",
        value: expiryDate,
      };
      jsonArray.push(jsonObj);
    }

    if (expiryDateEpoch) {
      var jsonObj = {
        operation: "replace",
        field: "expiryDateEpoch",
        value: expiryDateEpoch,
      };
      jsonArray.push(jsonObj);
    }

    if (businessApp) {
      var jsonObj = {
        operation: "replace",
        field: "businessAppName",
        value: businessApp,
      };
      jsonArray.push(jsonObj);
    }

    if(nodeState.get("userInfoJSON")) {
        var jsonObj = {
        "operation": "replace",
        "field": "userRequest",
        "value": JSON.stringify(nodeState.get("userInfoJSON"))
        }
        jsonArray.push(jsonObj)

        }

    if (jsonArray.length > 0) {
      var response = openidm.patch(
        "managed/alpha_kyid_remote_identity_proofing_request/" +
          nodeState.get("transaction_Id"),
        null,
        jsonArray
      );
      logger.debug(
        "patch response alpha_kyid_remote_identity_proofing_request --> " +
          response
      );
      if (response) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    logger.error("Errror Occurred While patchTransaction is --> " + error);
  }
}



function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now()  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString()  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate)  // Convert the ISO string into a Date object

        var expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000)  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000)  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3)  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6)  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day)  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000)  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return null
        }

        const expiryEpochMillis = new Date(expiryDate).getTime()  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { "expiryEpochMillis":expiryEpochMillis, "expiryDate":expiryDate };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        return null
        
    }

}


function auditLog(code, message){
     var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
                var helpdeskUserId = null; 
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
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                 helpdeskUserId = existingSession.get("UserId")
                }
                if(nodeState.get("_id")){
                   userId = nodeState.get("_id") || null;
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
}


function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, 
            value = c == 'x' ? r : (r & 0x3 | 0x8);
        return value.toString(16);
    });
}

var auditLib = require("KYID.2B1.Library.UserActivityAuditLogger");

function emptyhandleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.emptyhandleResponse);
    try{
        var displayName = {
            "requiredDocuments": []
        };
        var response = openidm.query("managed/alpha_kyid_identity_verification_documents/", {"_queryFilter": "true"},["*"])
        logger.debug("response of alpha_kyid_identity_verification_documents is :: " + JSON.stringify(response) )
        if (response.resultCount > 0) {
            response.result.forEach(value => {
                logger.debug("value is " + JSON.stringify(value));
                displayName.requiredDocuments.push(value.displayName);
            });
        }
       var jsonobj = {"pageHeader": "2_Collect_Verification_Documents"};
       callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
       callbacksBuilder.textOutputCallback(0,JSON.stringify(displayName));
       callbacksBuilder.textInputCallback("guuid");
       callbacksBuilder.confirmationCallback(0, ["next", "back"], 0);
        
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Error " + error);
    }
}


function handleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse);
    try{ 
         var kogID = null;
         var id = null;
         var userIdentityID = null;
         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
         var userInput = callbacks.getTextInputCallbacks()[0];
         
         logger.debug("userInput are :: "+ JSON.parse(userInput))
         userInput = JSON.parse(userInput)
            if(selectedOutcome === 1){
                action.goTo("back");
            }else{
                if (nodeState.get("KOGID") != null) {
                    kogID = nodeState.get("KOGID");
                }
                if(kogID){
                   var patchinSIH = patchSIH(kogID);
                    if(patchinSIH || !patchinSIH){
                        if(nodeState.get("_id") || nodeState.get("UserId") || nodeState.get("requestedUserAccountId")){
                            id = nodeState.get("requestedUserAccountId") || nodeState.get("_id") || nodeState.get("UserId");
                            if(nodeState.get("userIdentity")){
                                userIdentityID = nodeState.get("userIdentity");
                                logger.debug("userIdentityID is :: "+userIdentityID)
                                var patchInUserIdentity = patchUserIdentity(userIdentityID,"3");    
                                if(patchInUserIdentity){
                                    var patchInAlphaUser = patchAlphaUser(id);
                                    if(patchInAlphaUser){
                                        var existingDocsArray =  []
                                        var array= []
                                        var exisitingDocuments = openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": '_id eq "' + userIdentityID + '"' }, ["personalVerificationDetails"]);

                                        var requiredDocuments = userInput.documents || [];
                                        logger.debug("requiredDocuments are :: "+ JSON.stringify(requiredDocuments))
                                        if(requiredDocuments.length>0){
                                            requiredDocuments.forEach(doc => {
                                                var documents = {
                                                    "operation": "add",
                                                    "field": "/personalVerificationDetails/-",
                                                    "value": {
                                                        "applicationID": nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name"),
                                                        "documentID": doc.id,
                                                        "documentType": doc.type,
                                                        "requesterID": id,
                                                        "uploadDate": dateTime
                                                    }
                                                }   
                                                array.push(documents)                                            
                                            })
                                        }
     
                                        
                                        logger.debug("documents are :: "+ JSON.stringify(array))
                                        var patchdocuments = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentityID, null, array);
                                        logger.debug("patchdocuments response is :: "+ JSON.stringify(patchdocuments));
                                        logger.debug("userPrereqId :: " + nodeState.get("userPrereqId"))
                                        if(patchdocuments){
                                            if(nodeState.get("userPrereqId")!==null && nodeState.get("userPrereqId")){
                                                logger.debug("inside userPrereqIdHelpdesk if condition")
                                                var expiryDate = null
                                                var expiryDateEpoch = null
                                                var option = null
                                                var value = null
                                                var expiryDateJSON = null
                                                 if(nodeState.get("dueDateType") && nodeState.get("dueDateType") !== null ){
                                                   option = nodeState.get("dueDateType")
                                                   logger.debug("option is :: "+ option)
                                                    if(nodeState.get("dueDateValue")){
                                                        value = nodeState.get("dueDateValue")
                                                    }
                                                    expiryDateJSON = getExpiryDate(option, value)
                                                    logger.debug("expiryDateJSON is :: "+ JSON.stringify(expiryDateJSON))
                                                    if(expiryDateJSON !== null){
                                                    expiryDate = expiryDateJSON.expiryDate
                                                    expiryDateEpoch =expiryDateJSON.expiryEpochMillis                                              
                                                    }
                                                } 
                                                patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"),expiryDate,expiryDateEpoch);
                                                if(nodeState.get("transaction_Id")!== null && nodeState.get("transaction_Id")){
                                                    var patchTransactionResponse = patchTransaction("0",expiryDate,expiryDateEpoch);
                                                    logger.debug("patchTransactionResponse is :: "+ patchTransactionResponse)
                                                    action.goTo("in_person"); 
                                                }
                                            }else{
                                                //auditLib.auditLog("VER010", "In-person Verification Success",nodeState, requestHeader);
                                                 auditLog("VER010", "In-person Verification Success");
                                                 action.goTo("in_person"); 
                                            }
                                       }else{
                                          auditLog("VER010", "In-person Verification Success");
                                          action.goTo("in_person"); 
                                       }
                                    }else{
                                        //auditLib.auditLog("VER010", "In-person Verification Success",nodeState, requestHeader);
                                        auditLog("VER010", "In-person Verification Success");
                                        action.goTo("in_person");
                                    }
                                    //action.goTo("in_person");
                                }
                            }   
                        }
                    }
                }
            }
    }catch(error){
        auditLog("VER011", "In-person Verification Failure");
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Error " + error);
    }
}


function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
        if(nodeState.get("journeyContext")== "inperson"){
            if (callbacks.isEmpty()) {
                emptyhandleResponse()
            } else {   
                handleResponse()
            }
        }else{
             action.goTo("true")
        }

    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + error);
    }
}


main();