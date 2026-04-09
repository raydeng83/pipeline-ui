var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UpdateUserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UpdateUserProfileSIHAPI",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke API as required parameters are missing.",
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


function auditLog(code, message){
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
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                var requestedUserId = nodeState.get("_id") || null;
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


// Declare Global Variables
var missingInputs = [];


logger.debug("start script")
nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: script started ");
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
    // if (requestHeaders.get("x-forgerock-transactionid") != null) {
    //     var tempTransactionID = requestHeaders.get("x-forgerock-transactionid")[0];
    //     transactionID = tempTransactionID.substring(0, 36);
    // } else {
    //     missingInputs.push("transactionID");
    // }

    logger.debug("logOn is :: => "+ nodeState.get("orig_logOn"))
    logger.debug("orig_upn is :: => "+ nodeState.get("orig_upn"))
    logger.debug("KOGID is :: => "+ nodeState.get("KOGID"))
    logger.debug("organDonorStatus is :: => "+ nodeState.get("organDonorStatus"))
    var logOn;
    if (nodeState.get("orig_logOn") != null) {
        logOn = nodeState.get("orig_logOn");
    } else {
        missingInputs.push("logOn");
    }

    var upn;
    if (nodeState.get("orig_upn") != null) {
        upn = nodeState.get("orig_upn");
    } else {
        missingInputs.push("upn");
    }

    var firstName;
    if (nodeState.get("givenName") != null) {
        firstName = nodeState.get("givenName");
    } else {
        missingInputs.push("firstName");
    }

    var middleName;
    if (nodeState.get("custom_middleName") != null) {
        middleName = nodeState.get("custom_middleName");
    } /*else {
        missingInputs.push("middleName");
    }*/

    var lastName;
    if (nodeState.get("sn") != null) {
        lastName = nodeState.get("sn");
    } else {
        missingInputs.push("lastName");
    }

    // var middleName;
    // if (nodeState.get("orig_custom_middleName") != null) {
    //     middleName = nodeState.get("orig_custom_middleName");
    // } else {
    //     missingInputs.push("middleName");
    // }

    // var lastName;
    // if (nodeState.get("orig_sn") != null) {
    //     lastName = nodeState.get("orig_sn");
    // } else {
    //     missingInputs.push("lastName");
    // }


    // var postalAddressOne;
    // if (nodeState.get("orig_postalAddress") != null) {
    //     postalAddressOne = nodeState.get("orig_postalAddress");
    // } else {
    //     missingInputs.push("postalAddressOne");
    // }

     var postalAddressOne;
    if (nodeState.get("postalAddress") != null) {
        postalAddressOne = nodeState.get("postalAddress");
    } /*else {
        missingInputs.push("postalAddressOne");
    }*/

    // var postalAddressTwo;
    // if (nodeState.get("orig_custom_postalAddress2") != null) {
    //     postalAddressTwo = nodeState.get("orig_custom_postalAddress2");
    // } else {
    //     missingInputs.push("postalAddressTwo");
    // }

        var postalAddressTwo;
    if (nodeState.get("custom_postalAddress2") != null) {
        postalAddressTwo = nodeState.get("custom_postalAddress2");
    } /*else {
        missingInputs.push("postalAddressTwo");
    }*/

   var city;
    if (nodeState.get("city") != null) {
        city = nodeState.get("city");
    } /*else {
        missingInputs.push("city");
    }*/

    var state;
    if (nodeState.get("stateProvince") != null) {
        state = nodeState.get("stateProvince");
    } /*else {
        missingInputs.push("state");
    }*/


      var postalCode;
    if (nodeState.get("postalCode") != null) {
        postalCode = nodeState.get("postalCode");
    } /*else {
        missingInputs.push("postalCode");
    }*/


    var countyCode;
    // if (nodeState.get("orig_country") != null) {
    //     countyCode = nodeState.get("orig_country");
    // } else {
    //     missingInputs.push("countyCode");
    // }
   if (nodeState.get("custom_county") != null) {
        countyCode = nodeState.get("custom_county");
    } /*else {
        missingInputs.push("countyCode");
    }*/


    var languagePreference ;
    // if (nodeState.get("orig_frUnindexedString3") != null) {
    //     languagePreference = nodeState.get("orig_frUnindexedString3");
    // } else {
    //     languagePreference = 1;
    //     missingInputs.push("languagePreference");
    // }
    if (nodeState.get("frUnindexedString3") != null) {
        languagePreference = nodeState.get("frUnindexedString3");
        // if (languagePreference.toLowerCase() === "english") {
        //     languagePreference = "1";
        // } else if (languagePreference.toLowerCase() === "spanish") {
        //     languagePreference = "2";
        // } else {
        //     languagePreference = "1";
        // }
    } else {
        languagePreference = "1";
        //missingInputs.push("languagePreference");
    }


    var organDonorStatus ;
    if (nodeState.get("orig_organDonorRegistrationStatus") != null && nodeState.get("orig_organDonorRegistrationStatus")!=undefined) {
        organDonorStatus = nodeState.get("orig_organDonorRegistrationStatus");
    } else {
        organDonorStatus = false;
       // missingInputs.push("organDonorStatus");
    }

    logger.debug("organDonorStatus is :: "+ organDonorStatus)
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
        logger.debug("#### line155")
        action.goTo(nodeOutcome.ERROR);
    } else {
        var payload = {}
        // var payload = {
        //     KOGID: kogID,
        //     TransactionID: transactionID,
        //     Logon: logOn,
        //     UPN: upn,
        //     FirstName: firstName,
        //     MiddleName: middleName,
        //     LastName: lastName,
        //     Address1: postalAddressOne,
        //     Address2: postalAddressTwo,
        //     City: city,
        //     State: state,
        //     Zipcode: postalCode,
        //     CountyCode: countyCode,
        //     LanguagePreference: languagePreference ,
        //     OrganDonorStatus: organDonorStatus ,
        //     RequestorKOGID: kogID
        // };

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

        // if(postalCode){
        //     payload["Zipcode"] = postalCode;
        // }

        if(postalCode && postalCode != undefined && postalCode != null){
            payload["Zipcode"] = postalCode ;
        }

        if(countyCode){
            payload["CountyCode"] = countyCode;
        }

        if(languagePreference){
            payload["LanguagePreference"] = languagePreference;
        }

        if(nodeState.get("organDonorStatus") == true || nodeState.get("organDonorStatus") == "true"){
            payload["OrganDonorStatus"] = organDonorStatus;
        }

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
                    patchUserUPNAndLogon(data);
                    action.goTo(nodeOutcome.SUCCESS);
                    

                } else {
                    // ResponseStatus not 0, error details present
                    var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                        data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                        "Unknown error";
                    logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                    nodeState.putShared("apireturnederror", msg)
                    nodeState.putShared("unableToVerify","true");
                    action.goTo(nodeOutcome.ERROR);
                }

            } else {
                logger.debug("Non-200 HTTP response: " + res.status);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::KYID::" + kogID);
                auditLog("PRO004", "Personal Information update Failure");
                nodeState.putShared("unableToVerify","true");
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            logger.debug("kogAPITokenResponse is not 200 ");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: KYID ::" + kogID);
            auditLog("PRO004", "Personal Information update Failure");
            nodeState.putShared("unableToVerify","true");
            action.goTo(nodeOutcome.FAIL);
        }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
    auditLog("PRO004", "Personal Information update Failure");
    action.goTo(nodeOutcome.ERROR);
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

//Function that will sync the updated Logon and UPN from KOG to KYID
function patchUserUPNAndLogon(data) {
    try {
        var Logon = data.Logon || null;
        var UPN = data.UPN || null;
        var id = nodeState.get("_id") || nodeState.get("alphaUserId");

        if (!id) {
            logger.debug("User id not found in nodeState, skipping patch for UPN/Logon");
            return;
        }

        var patchOps = [];

        if (UPN) {
            patchOps.push({
                operation: "replace",
                field: "frIndexedString1",
                value: UPN
            });
        }

        if (Logon) {
            patchOps.push({
                operation: "replace",
                field: "frIndexedString2",
                value: Logon
            });
        }

        if (patchOps.length > 0) {
            logger.debug("the patchOps in manageProfile::"+JSON.stringify(patchOps))
            openidm.patch("managed/alpha_user/" + id, null, patchOps);
            logger.debug("Successfully patched values for userId=" + id + " frString1=" + (UPN || "null") + " frString2=" + (Logon || "null"));
        } else {
            logger.debug("No UPN or Logon available to patch for userId=" + id);
        }
    } catch (patchError) {
        logger.error("Failed to patch frString1/frString2 for user: " + patchError);
    }
}