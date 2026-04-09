var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: MCI SYnc",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.MCI.SYNC.v2",
    timestamp: dateTime,
    end: "Node Execution Completed"
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

// Audit Log Function
function auditLog(code, message, helpdeskVisibility , transactionId, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason, UpdatedCollectedUserInfo) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        var browser = requestHeaders.get("user-agent");
        var os = requestHeaders.get("sec-ch-ua-platform");
        var userId = null;
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = browser;
        eventDetails["OS"] = os;
        eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        // eventDetails["transactionid"] = transactionId || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["reason"] = reason || "";
        eventDetails["userIdentityRecord"] = UpdatedCollectedUserInfo || {};
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
        }
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = false;
        var helpdeskVisibility = helpdeskVisibility || false;
        
        if (userEmail) {
            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: 'mail eq "' + userEmail + '"'
            }, ["_id"]);
            userId = userQueryResult.result[0]._id;
        }
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}

function updateUserInfo(collectedUserInfo, userAttributes) {
    // Create a lookup map for userAttributes by (lowercased) attributeName
    try{
        var collectedUserInfo = collectedUserInfo || {};
        var userAttributes = userAttributes || [];
        var UpdatedCollectedUserInfo = {};
        var UpdatedCollectedUserInfoNoSSN = {}

        if(userAttributes.length>0){
            var attrMap = {};
            for (var i = 0; i < userAttributes.length; i++) {
                attrMap[userAttributes[i].attributeName.toLowerCase()] = userAttributes[i].correctedValue;
            }
            
            UpdatedCollectedUserInfo["givenName"] = attrMap["firstname"] || collectedUserInfo.givenName || "";
            UpdatedCollectedUserInfo["middleName"] = attrMap["middlename"] || collectedUserInfo.middleName || "";
            UpdatedCollectedUserInfo["sn"] = attrMap["lastname"] || collectedUserInfo.sn || "";
            UpdatedCollectedUserInfo["suffix"] = attrMap["suffix"] || collectedUserInfo.suffix || "";
            UpdatedCollectedUserInfo["gender"] = attrMap["gender"] || collectedUserInfo.gender || "";
            UpdatedCollectedUserInfo["dob"] = attrMap["dob"] || collectedUserInfo.dob || "";
            UpdatedCollectedUserInfo["isHomeless"] = attrMap["ishomeless"] || collectedUserInfo.isHomeless || "";
            UpdatedCollectedUserInfo["postalAddress"] = attrMap["addressline1"] || collectedUserInfo.postalAddress || "";
            UpdatedCollectedUserInfo["postalAddress2"] = attrMap["addressline2"] || collectedUserInfo.postalAddress2 || "";
            UpdatedCollectedUserInfo["city"] = attrMap["city"] || collectedUserInfo.city || "";
            UpdatedCollectedUserInfo["stateProvince"] = attrMap["state"] || collectedUserInfo.stateProvince || "";
            UpdatedCollectedUserInfo["postalCode"] = attrMap["zipcode"] || collectedUserInfo.postalCode || "";
            UpdatedCollectedUserInfo["postalExtension"] = attrMap["postalextension"] || collectedUserInfo.postalExtension || "";
            UpdatedCollectedUserInfo["county"] = attrMap["county"] || collectedUserInfo.county || "";
            UpdatedCollectedUserInfo["country"] = attrMap["country"] || collectedUserInfo.country || "";
            UpdatedCollectedUserInfo["title"] = attrMap["title"] || collectedUserInfo.title || "";
            UpdatedCollectedUserInfo["telephoneNumber"] = attrMap["telephonenumber"] || collectedUserInfo.telephoneNumber || "";
            UpdatedCollectedUserInfo["mail"] = attrMap["mail"] || collectedUserInfo.mail || nodeState.get("mail") || nodeState.get("EmailAddress") || ""
            UpdatedCollectedUserInfo["ssn"] = attrMap["ssn"] || collectedUserInfo.ssn || nodeState.get("ssn") || "";
            UpdatedCollectedUserInfo["DriversLicense"] = attrMap["driverslicense"] || collectedUserInfo.driversLicenseNumber || "";
            UpdatedCollectedUserInfo["kogId"] = collectedUserInfo.kogId || "";
            UpdatedCollectedUserInfo["lexId"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            UpdatedCollectedUserInfo["isLNKbaRequired"] = nodeState.get("isLNKbaRequired") || nodeState.get("isLNKbaRequired") || "";

            UpdatedCollectedUserInfoNoSSN["givenName"] = attrMap["firstname"] || collectedUserInfo.givenName || "";
            UpdatedCollectedUserInfoNoSSN["middleName"] = attrMap["middlename"] || collectedUserInfo.middleName || "";
            UpdatedCollectedUserInfoNoSSN["sn"] = attrMap["lastname"] || collectedUserInfo.sn || "";
            UpdatedCollectedUserInfoNoSSN["suffix"] = attrMap["suffix"] || collectedUserInfo.suffix || "";
            UpdatedCollectedUserInfoNoSSN["gender"] = attrMap["gender"] || collectedUserInfo.gender || "";
            UpdatedCollectedUserInfoNoSSN["dob"] = attrMap["dob"] || collectedUserInfo.dob || "";
            UpdatedCollectedUserInfoNoSSN["isHomeless"] = attrMap["ishomeless"] || collectedUserInfo.isHomeless || "";
            UpdatedCollectedUserInfoNoSSN["postalAddress"] = attrMap["addressline1"] || collectedUserInfo.postalAddress || "";
            UpdatedCollectedUserInfoNoSSN["postalAddress2"] = attrMap["addressline2"] || collectedUserInfo.postalAddress2 || "";
            UpdatedCollectedUserInfoNoSSN["city"] = attrMap["city"] || collectedUserInfo.city || "";
            UpdatedCollectedUserInfoNoSSN["stateProvince"] = attrMap["state"] || collectedUserInfo.stateProvince || "";
            UpdatedCollectedUserInfoNoSSN["postalCode"] = attrMap["zipcode"] || collectedUserInfo.postalCode || "";
            UpdatedCollectedUserInfoNoSSN["postalExtension"] = attrMap["postalextension"] || collectedUserInfo.postalExtension || "";
            UpdatedCollectedUserInfoNoSSN["county"] = attrMap["county"] || collectedUserInfo.county || "";
            UpdatedCollectedUserInfoNoSSN["country"] = attrMap["country"] || collectedUserInfo.country || "";
            UpdatedCollectedUserInfoNoSSN["title"] = attrMap["title"] || collectedUserInfo.title || "";
            UpdatedCollectedUserInfoNoSSN["telephoneNumber"] = attrMap["telephonenumber"] || collectedUserInfo.telephoneNumber || "";
            UpdatedCollectedUserInfoNoSSN["mail"] = attrMap["mail"] || collectedUserInfo.mail || nodeState.get("mail") || nodeState.get("EmailAddress") || ""
            UpdatedCollectedUserInfoNoSSN["DriversLicense"] = attrMap["driverslicense"] || collectedUserInfo.driversLicenseNumber || "";
            UpdatedCollectedUserInfoNoSSN["kogId"] = collectedUserInfo.kogId || "";
            UpdatedCollectedUserInfoNoSSN["lexId"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            UpdatedCollectedUserInfoNoSSN["isLNKbaRequired"] = nodeState.get("isLNKbaRequired") || nodeState.get("isLNKbaRequired") || "";
        }else{
            UpdatedCollectedUserInfo = collectedUserInfo;
        }
        nodeState.putShared("UpdatedCollectedUserInfo",UpdatedCollectedUserInfo);
        nodeState.putShared("UpdatedCollectedUserInfoNoSSN",UpdatedCollectedUserInfoNoSSN);
        return UpdatedCollectedUserInfo;
    }catch(error){
        logger.error("Error in catch of updateUserInfo in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}


function requestCallbacks() {
logger.debug("inside requestCallbacks")
    try{
        //if(nodeState.get("context") === "appEnroll" ){
            
            var kogId= nodeState.get("KOGID") || nodeState.get("userName") || "";

            var userInfo = nodeState.get("userInfoJSON") || {};
            userInfo.kogId = kogId;

            var obj = {
                    "apiCalls":[ { "method": "MCI", "action": "sync" }],
                    "collectedUserInfo": userInfo
                };
            obj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
            obj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            obj["UpdatedCollectedUserInfo"] = updateUserInfo(userInfo, obj["userAttributes"]);
            // var obj = {
            //     "MCI": { "method": "MCI", "action": "sync" },
            //     "collectedUserInfo": nodeState.get("userInfoJSON")
            // };
            if (nodeState.get("validationMessage") != null) {
                var errorMessage = nodeState.get("validationMessage");
                callbacksBuilder.textOutputCallback(0, errorMessage);
            }
            var pageHeader= {"pageHeader": "5_RIDP_MCI_SYNC"};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            callbacksBuilder.textOutputCallback(0, JSON.stringify(obj));

             // logger.debug("userAttributesForTransaction to sync is " + JSON.stringify( nodeState.get("userAttributesForTransaction")))
              logger.debug("obj to sync is " + JSON.stringify(obj))
            callbacksBuilder.textInputCallback("MCI SYNC");
            callbacksBuilder.confirmationCallback(0, ["next"], 0);
        //}
    }catch(error){
       logger.error("Error in catch of requestCallbacks in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

function handleUserResponses() {
    logger.debug("Starting handleUserResponses KYID.2B1.Journey.IDProofing.MCI.SYNC")
    var userInfo = nodeState.get("userInfoJSON")
    var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse");
    var flowName = nodeState.get("flowName");
    
    try{
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var kbaStatus = callbacks.getTextInputCallbacks().get(0)
            logger.debug("kbaStatus response is :: "+ JSON.stringify(kbaStatus));
            if (typeof kbaStatus === "string") {
                try {
                    kbaStatus = JSON.parse(kbaStatus);
                    if (!kbaStatus || typeof kbaStatus !== "object" || typeof kbaStatus.status !== "string") {
                        logger.debug("Invalid kbaStatus object or missing status property");
                        nodeState.putShared("validationMessage", "invalid_input");
                        action.goTo("true");
                        return;
                    }

                    // Only check refId if status is "failure"
                    if (kbaStatus.status.toLowerCase() === "failure") {
                        if (!(kbaStatus.refId === null || typeof kbaStatus.refId === "string")) {
                            logger.debug("Invalid refId in kbaStatus (must be null or string) when status is failure");
                            nodeState.putShared("validationMessage", "invalid_input");
                            action.goTo("true");
                            return;
                        }else{
                            nodeState.putShared("refId",kbaStatus.refId)
                        }
                    }

                } catch (e) {
                    logger.error("Error parsing kbaStatus or invalid status: " + e);
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("true");
                    return;
                }
            }
        if (selectedOutcome === 0) {
                    //nodeState.putShared("KBABack", "true");
                    // nodeState.putShared("IDProofingAnotherMethod","true")
                    nodeState.putShared("validationMessage",null);
                    var patchMCIStatusResponse = patchMCIStatus();
                    if(patchMCIStatusResponse && patchMCIStatusResponse != null){
                        logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MCI Link Status patched successfully in Function handleResponse");
                        if(nodeState.get("appEnrollRIDPMethod")==="CMS"){
                            var reason = "The user personal verified information details provided by Experian.";
                        }else{
                            var reason = "The user personal verified and/or corrected information details provided by LexisNexis.";
                        }
                        
                        var UpdatedCollectedUserInfoNoSSN = JSON.parse(nodeState.get("UpdatedCollectedUserInfoNoSSN"));
                        auditLog("MCI-000", "Verified and/or corrected user identity record has been updated in MCI.", true , transactionid, flowName, mail, null, null, reason, UpdatedCollectedUserInfoNoSSN);
                        //nodeState.putShared("userInfoJSON", null);
                        nodeState.putShared("userAttributesForTransaction", null);
                        nodeState.putShared("UpdatedCollectedUserInfo", null);
                        action.goTo("true");
                    }
                    //action.goTo("true");
        }
    }catch(error){
        logger.error("Error in catch of handleUserResponses in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}

function patchMCIStatus(){
    logger.debug("starting MCI Patch Status ")
    try{
        var userIdentity = nodeState.get("patchUserId") || nodeState.get("userIdentity");
        if(userIdentity && userIdentity != null && userIdentity != ""){
            logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "In Function patchMCIStatus");
            var jsonArray = []
            var jsonObj = {
                "operation": "replace",
                "field": "mciLinkStatus",
                "value": true
            }
            jsonArray.push(jsonObj)
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, jsonArray);
            return response;
        }else{
            logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Identity is null or empty in Function patchMCIStatus");
            nodeState.putShared("validationMessage", "User Identity is null or empty in Function patchMCIStatus");
            action.goTo("true");
        }
    }catch(error){
         logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function patchMCIStatus:: " + error);
         action.goTo("true");
    }
}


function main(){
   try{
       logger.debug("Starting MCI Sync main function")
       if(nodeState.get("MCISYNC") === "false"){
           action.goTo("noSync")    
       }else{
           if (callbacks.isEmpty()) {
            requestCallbacks();
            } else {
                handleUserResponses();
            } 
       }
   } catch(error){
       logger.error("Error in catch of KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

main();