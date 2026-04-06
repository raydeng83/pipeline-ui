var dateTime = new Date().toISOString();
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch NewEmail in UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Patch.ManageProfile.Organ.Donor",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false",
    ERROR: "error"
  };

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


function auditLog(code, message){
    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                
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
                // var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log update Personal info updated "+ error)
         action.goTo(NodeOutcome.SUCCESS);
    }
    
}




function regOrganDonor() {
    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
    
try {
     var kogTokenApi;
     var registerDonorAPIURL;
     var sihcertforapi;
    //  var getadditionalflagsinfoScope;
     var missingInputs = [];
     var sihcertforapi;
     var kogID = nodeState.get("kogID");
    
     logger.debug("kogID from user profile : "+ kogID)

    // registerDonorAPIURL = "https://dev.sih.ngateway.ky.gov/dev2/kog/external/RegisterDonor"   esv.kyid.kogapi.registerdonorapiurl
    if (systemEnv.getProperty("esv.kyid.kogapi.registerdonorapiurl") && systemEnv.getProperty("esv.kyid.kogapi.registerdonorapiurl") != null) {
        registerDonorAPIURL = systemEnv.getProperty("esv.kyid.kogapi.registerdonorapiurl");
        logger.debug("registerDonorAPIURL:: "+ registerDonorAPIURL)
    } else {
        missingInputs.push("registerDonorAPIURL");
    }
   
   
    if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
        kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
        missingInputs.push("kogTokenApi");
    }
    
    // if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi") != null) {
    //     getadditionalflagsinfoScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi");
    //     logger.debug("getadditionalflagsinfoScope is :: "+ getadditionalflagsinfoScope)
    // } else {
    //     missingInputs.push("addRemoveAlternateEmailScope");
    // }

    if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") != null) {
        updateuserprofileScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile");
        logger.debug("updateuserprofileScope is :: "+ updateuserprofileScope)
    } else {
        missingInputs.push("updateuserprofileScope");
    }

    
    if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
        sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
    } else {
        missingInputs.push("sihcertforapi");
    }

    if (missingInputs.length > 0) {
        logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
        //auditLog("PRO007", "Organ Donor Registration Failure");
        action.goTo(NodeOutcome.ERROR);
    } else {

        
        var payload = {
                firstName: nodeState.get("givenName"),
                lastName: nodeState.get("sn"),
                address1: nodeState.get("postalAddress"),
                city: nodeState.get("city"),
                county: nodeState.get("county"),
                zip: nodeState.get("postalCode"),
                birthdate: nodeState.get("custom_dateofBirth"),
                driversLicense: nodeState.get("driversLicense"),
                gender: nodeState.get("custom_gender")
            }

            if(nodeState.get("stateProvince")!=null && nodeState.get("stateProvince")){
                     payload.state = nodeState.get("stateProvince");
            }
        
            if(nodeState.get("custom_middleName")!=null && nodeState.get("custom_middleName")){
                 payload.middleName = nodeState.get("custom_middleName");
            }else{
                 payload.middleName = ""
            }

            
            if(nodeState.get("custom_postalAddress2")!=null && nodeState.get("custom_postalAddress2")){
                 payload.address2 = nodeState.get("custom_postalAddress2");
            }else{
                 payload.address2 = ""
            }
        
            if(nodeState.get("ssn")!=null && nodeState.get("ssn")){
                 payload.socialSecurityNumber = nodeState.get("ssn");
            }

            if(nodeState.get("mail")!=null && nodeState.get("mail")){
                 payload.email = nodeState.get("mail");
            }

        // var payload = {
        // KogID: nodeState.get("KOGID"),
        // RequestorKOGID: nodeState.get("KOGID"),
        // FirstName: nodeState.get("givenName"),
        // MiddleName: nodeState.get("custom_middleName"),
        // LastName: nodeState.get("sn"),
        // Address1: nodeState.get("postalAddress"),
        // Address2: nodeState.get("custom_postalAddress2"),
        // City: nodeState.get("city"),
        // County: nodeState.get("county"),
        // Zip: nodeState.get("zipExtension"),
        // Birthdate: nodeState.get("custom_dateofBirth"),
        // DriversLicense: nodeState.get("driversLicense"),
        // Gender: nodeState.get("custom_gender"),
        // //OrganDonorStatus: true
        // };

    logger.debug("Payload prepared for regOrganDonor: " + JSON.stringify(payload));

    var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
    nodeLogger.debug("regOrganDonor: Ran the access token lib script ")
    var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, updateuserprofileScope);
    nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));

    if (kogAPITokenResponse.status === 200) {
        logger.debug("access token status is 200" )
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

        var res = httpClient.send(registerDonorAPIURL, requestOptions).get();
        logger.debug("response status of registerDonorAPIURL from Donor API " + res.status);
        logger.error("response of registerDonorAPIURL from Donor API " + JSON.stringify(JSON.parse(res.text())));
        logger.debug("response traceId of registerDonorAPIURL from Donor API " + res.traceId);

        action.withHeader(`Response code: ${res.status}`);

        
        if (res.status === 200) {
            var data = JSON.parse(res.text());
            logger.debug("data.Message is :: "+ data.Message)
            if (data.Message == "Donor registration succeeded.") {
                logger.debug("data is :: => " + JSON.stringify(data));
                nodeState.putShared("userData", data)
                return "Success"
                //nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Alternate email removed/added sucessfully ::Email::" + alternateEmailAddress);
                //action.goTo(NodeOutcome.SUCCESS);
            } else {
                // ResponseStatus not 0, error details present
                var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                    data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                    "Unknown error";
                logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                nodeState.putShared("apireturnederror", msg)
                //auditLog("PRO007", "Organ Donor Registration Failure");
                action.goTo(NodeOutcome.FAILED);
            }

        } else {
            logger.debug("Non-200 HTTP response: " + res.status);
            //auditLog("PRO007", "Organ Donor Registration Failure");
            //nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::Email::" + alternateEmailAddress);
            action.goTo(NodeOutcome.FAILED);
        }
    } else {
        logger.debug("kogAPITokenResponse is not 200 ");
        auditLog("PRO007", "Organ Donor Registration Failure");
        //nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: Email ::" + alternateEmailAddress);
        action.goTo(NodeOutcome.FAILED);
    }
}
} catch (error) {
     logger.error("Error in catch is  "+ error);
    //nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::Email::" + alternateEmailAddress);
    //auditLog("PRO007", "Organ Donor Registration Failure");
    action.goTo(NodeOutcome.FAILED);
}
}


function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function regOrganDonorStatusinKOG() {
    
    var payload = {}
    var kogID = null;
    var languagePreference = 1;
    var logOn = null;
    var upn = null;
    var firstName = null;
    var middleName = null;
    var lastName = null;
    var postalAddressOne = null;
    var postalAddressTwo = null;
    var city = null;
    var state = null;
    var postalCode = null;
    var countyCode = null;
    var transactionID = null;
    var organDonorStatus = false;
    var languagePreference = 1;
    

    try {
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var transactionID = generateGUID()
        
      
        if (nodeState.get("KOGID") != null) {
            kogID = nodeState.get("KOGID");
        } else {
            missingInputs.push("kogID");
        }

        if (nodeState.get("orig_logOn") != null) {
            logOn = nodeState.get("orig_logOn");
        } else {
            missingInputs.push("logOn");
        }

        if (nodeState.get("orig_upn") != null) {
            upn = nodeState.get("orig_upn");
        } else {
            missingInputs.push("upn");
        }

        if (nodeState.get("givenName") != null) {
            firstName = nodeState.get("givenName");
        } else {
            missingInputs.push("firstName");
        }

        if (nodeState.get("custom_middleName") != null) {
            middleName = nodeState.get("custom_middleName");
        }

        if (nodeState.get("sn") != null) {
            lastName = nodeState.get("sn");
        } else {
            missingInputs.push("lastName");
        }

        if (nodeState.get("frUnindexedString3") != null) {
            languagePreference = nodeState.get("frUnindexedString3");
        } else {
            languagePreference = "1";
        }

    var organDonorStatus = true

    if (nodeState.get("custom_postalAddress2") != null) {
        postalAddressTwo = nodeState.get("custom_postalAddress2");
    } 

    if (nodeState.get("city") != null) {
        city = nodeState.get("city");
    } 

    if (nodeState.get("stateProvince") != null) {
        state = nodeState.get("stateProvince");
    }


    if (nodeState.get("postalCode") != null) {
        postalCode = nodeState.get("postalCode");
    }


   if (nodeState.get("custom_county") != null) {
        countyCode = nodeState.get("custom_county");
    } 


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

        if(organDonorStatus ){
            payload["OrganDonorStatus"] = true;
        }

        if(kogID){
            payload["RequestorKOGID"] = kogID;
        }
        

        logger.debug("Payload prepared in KYID.2B1.Journey.Patch.ManageProfile.Organ.Donor: " + JSON.stringify(payload));

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

        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        logger.debug("Ran the access token lib script for Organ donor update in Kog:: " + kogID)
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, updateUserProfileScope);
        nodeLogger.debug("kogAPITokenResponse for Organ donor update in Kog :: " + JSON.stringify(kogAPITokenResponse) + "for KYID" + kogID);

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

            logger.debug("Payload prepared for user email update in KOG AD: " + JSON.stringify(payload) + "for KYID" + kogID);
            var startTime = new Date();
            var res = httpClient.send(updateUserProfileAPIURL, requestOptions).get();
        	var endTime = new Date();
        	var duration = endTime - startTime;  
        	var durationInSeconds = duration / 1000;
        	logger.debug("KYID.2B1.Journey.UpdateUserProfileSIHAPI call duration in seconds : " + durationInSeconds );

            
            logger.debug("response of organ donor update in KOG  " + res.status);
            logger.debug("response of organ donor update in KOG " + JSON.stringify(JSON.parse(res.text())));
            action.withHeader(`Response code: ${res.status}`);
        }


        if (res.status === 200) {
                var data = JSON.parse(res.text());
                if (data.ResponseStatus === 0 && data.TransactionID) {
                    var fetchedTransactionID = data.TransactionID;

                    logger.debug("the successful transcation id  is " + fetchedTransactionID);
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: user profile updated sucess ::KYID::" + kogID);
                    return "KOGSuccess"

                } else {
                    // ResponseStatus not 0, error details present
                    var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                        data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                        "Unknown error";
                    logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                    nodeState.putShared("apireturnederror", msg)
                    //auditLog("PRO007", "Organ Donor Registration Failure in KOG");
                    return "KOGFailed"
                }

            } else {
                logger.debug("Non-200 HTTP response: " + res.status);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::KYID::" + kogID);
                //auditLog("PRO007", "Organ Donor Registration Failure in KOG");
                return "KOGFailed";
            }





    } catch (error) {
        logger.error("Error in catch is  "+ error);
        //auditLog("PRO007", "Organ Donor Registration Failure in KOG");
        action.goTo(NodeOutcome.FAILED);
    }

}


function main(){
    try {
        var userId = nodeState.get("_id");
        if (!userId) {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
            //auditLog("PRO007", "Organ Donor Registration Failure");
            action.goTo(NodeOutcome.FAILED);
        }

        var patchArray = [];
        var neworganDonor = nodeState.get("organDonor") || "";
        var regOrganDonorStatus =  regOrganDonor();
    
        if (neworganDonor && regOrganDonorStatus == "Success") {
            var regOrganDonorStatusinKOGResult = regOrganDonorStatusinKOG();
            
            if(regOrganDonorStatusinKOGResult == "KOGSuccess" || regOrganDonorStatusinKOGResult == "KOGFailed"){
                patchArray.push({
                    operation: "replace",
                    field: "/custom_organdonor",
                    value: true
                });

                try {
                    var auditDetails = require("KYID.2B1.Library.AuditDetails")
                    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                    patchArray.push({operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch},
                    {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID},
                    {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate},
                    {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy});
                    //jsonArray.push(jsonObj)
                    logger.debug("auditDetail " + JSON.stringify(auditData))
                } catch (error) {
                    logger.error("Error Occured : Couldnot find audit details" + error)

                }

                openidm.patch("managed/alpha_user/" + userId, null, patchArray);
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: Patched organ donor: " + JSON.stringify(patchArray));
                
                //TFS ticket 203070, Organ Donor registration status not synced on helpdesk portal
                var identityObject = ""
                identityObject = openidm.read("managed/alpha_user/" + userId, null, ["custom_userIdentity"])
 
                nodeLogger.debug("xiaohan AUDIT 0::" + nodeConfig.timestamp + ":: identityObject: " + JSON.stringify(identityObject)); 
                if(identityObject.custom_userIdentity._refResourceId){
                    
                    var patchObject = [{
                        operation: "replace",
                        field: "/organDonorRegistrationStatus",
                        value: "Yes"
                    }]

                     try {
                        var auditDetails = require("KYID.2B1.Library.AuditDetails")
                        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                        patchObject.push({operation: "replace",field: "/updatedDateEpoch",value: auditData.updatedDateEpoch});
                        //jsonArray.push(jsonObj)
                        patchObject.push({operation: "replace",field: "/updatedByID",value: auditData.updatedByID});
                        //jsonArray.push(jsonObj)
                        patchObject.push({operation: "replace",field: "/updateDate",value: auditData.updatedDate});
                        //jsonArray.push(jsonObj)
                        patchObject.push({operation: "replace",field: "/updatedBy",value: auditData.updatedBy});
                        //jsonArray.push(jsonObj)
                        logger.debug("auditDetail " + JSON.stringify(auditData))
                    } catch (error) {
                        logger.error("Error Occured : Couldnot find audit details"+ error)
                    }
                    nodeLogger.debug("xiaohan AUDIT 1::" + nodeConfig.timestamp + ":: patchObject: " + JSON.stringify(patchObject)); 
                    var responseTest = openidm.patch("managed/alpha_kyid_user_identity/" + identityObject.custom_userIdentity._refResourceId, null, patchObject);
                    nodeLogger.debug("xiaohan AUDIT 2::" + nodeConfig.timestamp + ":: responseTest: " + JSON.stringify(responseTest)); 
                }

                //TFS ticket 203070 udpate end
                auditLog("PRO006", "Organ Donor Registration");
                action.goTo(NodeOutcome.SUCCESS);
            }else{
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: Organ Donor Registration failed in KOG.");
                //auditLog("PRO007", "Organ Donor Registration Failure in KOG");
                action.goTo(NodeOutcome.FAILED);
            } 
        }else {
            nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: No attribute changes detected, skipping patch.");
            action.goTo(NodeOutcome.FAILED);
        }

        

    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error in patch execution: " + error.message);
        //auditLog("PRO007", "Organ Donor Registration Failure");
        action.goTo(NodeOutcome.FAILED);
    }
}

main();