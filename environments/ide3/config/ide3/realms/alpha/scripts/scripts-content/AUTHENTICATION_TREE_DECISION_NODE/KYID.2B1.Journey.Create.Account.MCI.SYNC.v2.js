/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI SYNC",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Create.Account.MCI.SYNC",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime
}

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



function updateAuditEvents(){
    var sessionRefId = null;
    var auditEvents = null;
    try {
        logger.debug("Updating audit events with userId");
        sessionRefId = JSON.parse(nodeState.get("sessionRefId")) || ""
        sessionRefId = sessionRefId ? sessionRefId.sessionRefId : ""
        if(sessionRefId){
            auditEvents = openidm.query("managed/alpha_kyid_audit_logger", { "_queryFilter": 'sessionId eq "' + sessionRefId + '"' }, ["*"]);
            logger.debug("Audit Events fetched for sessionRefId is --> " + JSON.stringify(auditEvents))
            if(auditEvents && auditEvents.result && auditEvents.result.length > 0){
                auditEvents.result.forEach(function(event){
                    var id= event._id;
                    var jsonArray = []
                    var jsonObj1 = {
                        "operation": "replace",
                        "field": "requesterUserId",
                        "value": nodeState.get("createdUserId") || ""
                    }
                    var jsonObj2 = {
                        "operation": "replace",
                        "field": "requestedUserId",
                        "value": nodeState.get("createdUserId") || ""
                    }

                    var jsonObj3 = {
                        "operation": "replace",
                        "field": "emailId",
                        "value": nodeState.get("verifiedPrimaryEmail") || nodeState.get("EmailAddress") || ""
                    }
                    jsonArray.push(jsonObj1)
                    jsonArray.push(jsonObj2)
                    jsonArray.push(jsonObj3)
                    var response = openidm.patch("managed/alpha_kyid_audit_logger/" + id, null, jsonArray);
                    logger.debug("Audit Event updated with userId response is --> " + response)
                });
            }
        }else{
            logger.error("Session Ref Id is not present in the node state, cannot update audit events with userId");
        }
    }catch (error) {
        logger.error("Errror Occurred While updating audit events with userId is --> " + error)
    }
}


// Audit Log Function
function auditLog(code, message, helpdeskVisibility , transactionId, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason, UpdatedCollectedUserInfo, title, sspVisibility) {
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
        //eventDetails["transactionid"] = transactionId || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || {};
        eventDetails["userIdentityRecord"] = UpdatedCollectedUserInfo || "";
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || "";
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
        var sspVisibility = sspVisibility || false;
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
            UpdatedCollectedUserInfo["mail"] = attrMap["mail"] || collectedUserInfo.mail || "";
            UpdatedCollectedUserInfo["ssn"] = attrMap["ssn"] || collectedUserInfo.ssn || "";
            UpdatedCollectedUserInfo["DriversLicense"] = attrMap["driverslicense"] || collectedUserInfo.driversLicenseNumber || "";
            UpdatedCollectedUserInfo["kogId"] = collectedUserInfo.kogId || "";
            UpdatedCollectedUserInfo["lexId"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            UpdatedCollectedUserInfo["isLNKbaRequired"] = nodeState.get("isLNKbaRequired") || nodeState.get("isLNKbaRequired") || "";
        }
        nodeState.putShared("UpdatedCollectedUserInfo",UpdatedCollectedUserInfo)
        return UpdatedCollectedUserInfo;
    }catch(error){
        logger.error("Error in catch of updateUserInfo in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}

function patchMCIStatus(){
    try{
        var userIdentity = nodeState.get("patchUserId");
        if(userIdentity && userIdentity != null && userIdentity != ""){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "In Function patchMCIStatus");
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
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Identity is null or empty in Function patchMCIStatus");
            nodeState.putShared("validationMessage", "User Identity is null or empty in Function patchMCIStatus");
            action.goTo("errorMessage");
        }
    }catch(error){
         nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function patchMCIStatus:: " + error);
         action.goTo("error");
    }
}


function emptyhandleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.emptyhandleResponse);
    var kogID = null;
    try{
        
        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage");
            callbacksBuilder.textOutputCallback(0, errorMessage);
        }
        
        var pageHeader = { "pageHeader": "RIDP_Created_Account_MCI_SYNC" };
        callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));

        if(nodeState.get("fetchedKOGID")){
            var kogID = nodeState.get("fetchedKOGID")
        }
        var userInfo = nodeState.get("userInfoJSON") || {};
        userInfo.kogId = kogID;
        var displayJSON = {
            "apiCalls": [
            { "method": "MCI", "action": "sync" }
            ],
            "collectedUserInfo": userInfo
        };
        displayJSON["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        displayJSON["UpdatedCollectedUserInfo"] = updateUserInfo(userInfo, displayJSON["userAttributes"]) || ""
        displayJSON["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
        callbacksBuilder.textOutputCallback(0, JSON.stringify(displayJSON));
        callbacksBuilder.textInputCallback("Response");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function emptyHandleResponse:: " + error);
    }
}


function handleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse);
    // var flowName = nodeState.get("flowName");
    var flowName = "Create Account"
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var parameters = {};
    parameters["transactionid"] = transactionid;
    parameters["Use_case"] = flowName;
    parameters["Use_case_Input"] = mail;

    try{ 
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var apiResponse = callbacks.getTextInputCallbacks().get(0);
        if (typeof apiResponse === "string") {
            try {
            apiResponse = JSON.parse(apiResponse);

            // Validate that apiResponse is an object and has a "status" property of type string
            if (!apiResponse || typeof apiResponse !== "object" || typeof apiResponse.status !== "string") {
                logger.debug("Invalid apiResponse object or missing status property");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }

            // If status is "success", no further checks needed
            if (apiResponse.status.toLowerCase() === "success") {            
                // All good, continue
            } else if (apiResponse.status.toLowerCase() === "failed") {
                // For failure, refId must be present and a string (including empty string)
                if (!(typeof apiResponse.refId === "string" && apiResponse.refId.length > 0)) {
                logger.debug("refId must be present and a non-empty string when status is failure");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
                }
            } else {
                logger.debug("Unknown status value in apiResponse");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }

            } catch (e) {
            nodeLogger.debug("Error parsing apiResponse or invalid status: " + e);
            nodeState.putShared("validationMessage", "invalid_input");
            action.goTo("errorMessage");
            return;
            }
        }

        if (selectedOutcome === 0) {
            nodeState.putShared("validationErrorCode", null);
            logger.debug("KYID.2B1.Journey.Create.Account.MCI.SYNC --> " + apiResponse.status);
            var userInfo = nodeState.get("userInfoJSON")
            var mail = nodeState.get("mail") || nodeState.get("EmailAddress") || nodeState.get("collectedPrimaryEmail") || "";
            var lexisnexisResponse = nodeState.get("lexisnexisResponse");
            var flowName = "Create Account" || nodeState.get("flowName");
            var highRiskFlag = nodeState.get("highRiskFlag");
            if (apiResponse.status &&  typeof apiResponse.status === "string" && apiResponse.status.toLowerCase() === "success") {
                nodeState.putShared("validationMessage", null);
                var patchMCIStatusResponse = patchMCIStatus();
                if(patchMCIStatusResponse && patchMCIStatusResponse != null){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MCI Link Status patched successfully in Function handleResponse");
                     var reason = "The user personal verified and/or corrected information details provided by LexisNexis.";
                     var UpdatedCollectedUserInfo = JSON.parse(nodeState.get("UpdatedCollectedUserInfo"));
                     var title = "Verified and/or corrected user identity record has been updated in MCI."
                     auditLog("MCI-000", "Create Account - MCI record has been updated", true , transactionid, flowName, mail, null, null, reason, UpdatedCollectedUserInfo, title);
                     var verificationStatus = nodeState.get("verificationStatus")
                     if(verificationStatus && verificationStatus.toLowerCase() !== "notverified"){
                        var reason1 = "The user personal information provided to LexisNexis is verified"
                        var title = "User identity verification is successful."
                        auditLog("KYID-LN-007", "Create Account - Identity Proofing is successful", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason1, null, title);
                        auditLog("KYID-LN-007", `${flowName} - Identity Proofing is successful`,  false, transactionid, flowName, mail, null, null, null, null, null, true);
                         
                     }else if(verificationStatus && verificationStatus.toLowerCase() == "notverified"){
                        var reason1 = "The user personal information provided to LexisNexis is NOT verified"
                        var title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis."
                        auditLog("KYID-LN-005", "Create Account - Individual is not verified", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason1, null, title);
                        auditLog("KYID-LN-005", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, null, true);
                     }else{
                         logger.debug("Unknown verification status")
                     }
                     updateAuditEvents();

                    if(((nodeState.get("riskIndicator") && nodeState.get("riskIndicator").toLowerCase() === "high") || (nodeState.get("risk") && nodeState.get("risk").toLowerCase() === "high") || (nodeState.get("mailRisk") && nodeState.get("mailRisk").toLowerCase() === "high") || (nodeState.get("phoneRisk") && nodeState.get("phoneRisk").toLowerCase() === "high") || (nodeState.get("alternateEmailRisk") && nodeState.get("alternateEmailRisk").toLowerCase() === "high")) && (highRiskFlag && highRiskFlag == true)){
                        nodeState.putShared("errorMessage","KYID-LN-000")
                        action.goTo("highRisk")
                    }else{
                        action.goTo("success");
                    }
                    
                }
            } else if (apiResponse.status && typeof apiResponse.status === "string" && apiResponse.status.toLowerCase() === "failed") {
                    nodeState.putShared("refId",apiResponse.refId)
                    nodeState.putShared("validationMessage", null);
                    action.goTo("failed");
            } else {
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
            }
        }
        
     }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function handleResponse:: " + error);
    }
}


function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    var userInfo = nodeState.get("userInfoJSON")
    var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
    var lexisnexisResponse = nodeState.get("lexisnexisResponse");
    var flowName = nodeState.get("flowName");
    var verificationStatus = nodeState.get("verificationStatus");
    var highRiskFlag = nodeState.get("highRiskFlag");
    try{
        // Check if MCI Sync is required
        if(nodeState.get("MCISync") && nodeState.get("MCISync") === "true"){
            if (callbacks.isEmpty()) {
                emptyhandleResponse()
            } else {   
                handleResponse()
            }
        } else if(((nodeState.get("riskIndicator") && nodeState.get("riskIndicator").toLowerCase() === "high") || (nodeState.get("risk") && nodeState.get("risk").toLowerCase() === "high") || (nodeState.get("mailRisk") && nodeState.get("mailRisk").toLowerCase() === "high") || (nodeState.get("phoneRisk") && nodeState.get("phoneRisk").toLowerCase() === "high") || (nodeState.get("alternateEmailRisk") && nodeState.get("alternateEmailRisk").toLowerCase() === "high")) && (highRiskFlag && highRiskFlag == true)){
            nodeState.putShared("errorMessage","KYID-LN-000")
            updateAuditEvents();
            action.goTo("highRisk")
        }else{
            if(verificationStatus && verificationStatus.toLowerCase() !== "notverified"){
                auditLog("KYID-LN-007", `User identity successful as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, null);
             }else if(verificationStatus && verificationStatus.toLowerCase() == "notverified"){
                auditLog("KYID-LN-005", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, null);
             }else{
                 logger.debug("Unknown verification status")
             }
            updateAuditEvents();
            action.goTo("noSync")
        }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script:: " + error);
    }
}

main();