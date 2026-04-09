var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var lib = require("KYID.2B1.Library.GenericUtils");
var auditLib = require("KYID.2B1.Library.AuditLogger")
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId")


var mfaMethod = nodeState.get("removeMfaMethod");
var usrKOGID = nodeState.get("KOGID");
var mfaValue = nodeState.get("removeMFAValue")
var userId = null;
var bearerToken = nodeState.get("amAccessToken");
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
var userEmail = nodeState.get("mail") || "";
var userQueryResult = null;
var requesteduserId = null;
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName);
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);


logger.error("selctedMFAtoRemove is+++ " + nodeState.get("selctedMFAtoRemove"));


if (nodeState.get("UserId") !== null && nodeState.get("UserId")) {
    userId = nodeState.get("UserId");
} else if (existingSession.get("UserId")) {
    userId = existingSession.get("UserId");
}

// if(existingSession.get("UserId")){
//      userId = existingSession.get("UserId");
// }
// else{
//     userId = nodeState.get("userId")
// }
logger.error("mfaMethod is -- " + mfaMethod);
logger.error("usrKOGID is -- " + usrKOGID);
logger.error("mfaValue is -- " + mfaValue);
// logger.error("bearerToken is -- "+ bearerToken);
logger.error("userId is -- " + userId);


try {
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    logger.error("KYID auditDetail " + JSON.stringify(auditData))
    var mfaRemoveResponse = lib.removeMfaFactors(mfaMethod, usrKOGID, mfaValue, bearerToken, userId, auditData);
    logger.error("mfaRemoveResponse " + mfaRemoveResponse);
    if (mfaRemoveResponse == true) {
        logger.error("Method: " + mfaMethod + "Successfully for user :" + userId);
        //auditLib.auditLogger("MFA001",sessionDetails,"MFA Method Removal Success", eventDetails, requesterUserId, userId, transactionid);
        // auditLib.auditLogger("MFA001", sessionDetails, "MFA Method Removal Success", eventDetails, userId, requesteduserId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
        auditLog("MFA001", "MFA Method Removal Success");
        errMsg["code"] = "INF-MFA-REM-001";
        errMsg["message"] = libError.readErrorMessage("INF-MFA-REM-001");
        errMsg["MFAMethod"] = nodeState.get("selctedMFAtoRemove");
        nodeState.putShared("validationErrorCode", JSON.stringify(errMsg));

        if (mfaMethod === "SMSVOICE") {
            nodeState.putShared("actionFlag", "2");
            nodeState.putShared("mobileNumber", mfaValue);
            action.goTo("sms");
        } else if (mfaMethod === "SECONDARY_EMAIL") {
            nodeState.putShared("actionFlag", "2");
            nodeState.putShared("emailId", mfaValue);
            action.goTo("email");
        } else {
            action.goTo("true");
        }

    } else {
        logger.error("Error Occurred while Removing MFA" + mfaRemoveResponse);
        errMsg["code"] = "ERR-SMW-TEC-000";
        errMsg["message"] = libError.readErrorMessage("ERR-SMW-TEC-000");
        errMsg["MFAMethod"] =  nodeState.get("selctedMFAtoRemove");
        nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
        //auditLib.auditLogger("MFA002",sessionDetails,"MFA Method Removal Failure", eventDetails, userId, requesteduserId, transactionid, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
        auditLog("MFA002", "MFA Method Removal Failure");
        action.goTo("false");
    }

} catch (error) {
    logger.error("Error Occurred while Removing MFA" + error);
    errMsg["code"] = "ERR-SMW-TEC-000";
    errMsg["message"] = libError.readErrorMessage("ERR-SMW-TEC-000");
    errMsg["MFAMethod"] =  nodeState.get("selctedMFAtoRemove");
    nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
    //   auditLib.auditLogger("MFA002",sessionDetails,"MFA Method Removal Failure", eventDetails, userId, requesteduserId, transactionid, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
    auditLog("MFA002", "MFA Method Removal Failure");
    action.goTo("false");
}




function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        logger.error("nodeState" + nodeState.get("browser"));
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = nodeState.get("browser") || "";
        eventDetails["OS"] = nodeState.get("os") || "";
        eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFAMethod"] = nodeState.get("removeMfaMethod") || null;
        eventDetails["MFAValue"] = nodeState.get("removeMFAValue") || null;

        logger.error("the KYID.2B1.Journey.Remove.MFA removeMfaMethod::"+nodeState.get("removeMfaMethod"))
         logger.error("the KYID.2B1.Journey.Remove.MFA removeMFAValue::"+nodeState.get("removeMFAValue"))
         //defect 203344 Correct the MFA Type value
        if(nodeState.get("removeMfaMethod").toLowerCase() === "smsvoice"){
            eventDetails["MFATYPE"] = "Phone"
        }else if(nodeState.get("removeMfaMethod").toLowerCase() === "symantec"){
            eventDetails["MFATYPE"] = "SymantecVIP"
        }else if(nodeState.get("removeMFAValue").toLowerCase() === "microsoft"){
            eventDetails["MFATYPE"] = "MicrosoftAuthenticator"
        }else if(nodeState.get("removeMFAValue").toLowerCase() === "google"){
            eventDetails["MFATYPE"] = "GoogleAuthenticator"
        }else if(nodeState.get("removeMFAValue").toLowerCase() === "forgerock"){
            eventDetails["MFATYPE"] = "ForgeRockAuthenticator"
        }else {
            eventDetails["MFATYPE"] = "EMAIL"
        }

        //MFA Reporting 
         var purpose = "";
            var journeyName = nodeState.get("journeyName");
            var alternateJourneyName = nodeState.get("journeyNameReporting");
            var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
            var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
            logger.error("the journey name in KYID.2B1.Journey.VerifyPrimaryEmailOTP:: "+nodeState.get("journeyName"))
            if (journeyName) {
                logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[journeyName])
               
                if (parsedjourneyPurposeMapping) {
                    if (parsedjourneyPurposeMapping.hasOwnProperty(journeyName)) {
                        logger.error("Journey Name: " + journeyName + ", Purpose: " + parsedjourneyPurposeMapping[journeyName]);
                        purpose = parsedjourneyPurposeMapping[journeyName];
                    } else {
                        logger.error("No purpose mapping found for Journey Name: " + journeyName);
                        if (alternateJourneyName && parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Trying alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        }
                        }
                    }
                } else if (alternateJourneyName) {
                    logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                    logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[alternateJourneyName])
                    if (parsedjourneyPurposeMapping) {
                        if (parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        } else {
                            logger.error("No purpose mapping found for Alternate Journey Name: " + alternateJourneyName);
                        }
                    }
                }
                    
                
                eventDetails["purpose"] = purpose || "" //MFA Reporting
                eventDetails["action"] = "Remove"       //MFA Reporting

              if(nodeState.get("removeMfaMethod").toLowerCase() === "smsvoice"){   //MFA Reporting
            eventDetails["mfatype"] = "Mobile Phone OTP SMS"
        }else if(nodeState.get("removeMfaMethod").toLowerCase() === "symantec"){
            eventDetails["mfatype"] = "Symantec Mobile Soft Token"
        }else if(nodeState.get("removeMFAValue").toLowerCase() === "microsoft"){
            eventDetails["mfatype"] = "Microsoft TOTP"
        }else if(nodeState.get("removeMFAValue").toLowerCase() === "google"){
            eventDetails["mfatype"] = "Google TOTP"
        }else if(nodeState.get("removeMfaMethod").toLowerCase() === "push"){
            eventDetails["mfatype"] = "ForgeRock Push"
        } else if(nodeState.get("removeMFAValue").toLowerCase() === "FORGEROCK" && nodeState.get("removeMfaMethod").toLowerCase() === "TOTP" ){
            eventDetails["mfatype"] = "ForgeRock TOTP"
        }else if(nodeState.get("removeMfaMethod").toLowerCase() === "secondary_email"){
            eventDetails["mfatype"] = "Alternate Email OTP"
        } else {
            eventDetails["mfatype"] = "Primary Email OTP"
        }

                
              if(message === "MFA Method Removal Failure"){  //MFA Reporting
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }
        
        var sessionDetails = {}
        var sessionDetail = null;
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = {
                "sessionRefId": ""
            }
        }

        userQueryResult = openidm.query("managed/alpha_user", {
            _queryFilter: 'userName eq "' + usrKOGID + '"'
        }, ["_id"]);
        requesteduserId = userQueryResult.result[0]._id;
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var userEmail = nodeState.get("mail") || "";
        if (typeof existingSession != 'undefined') {
            userId = existingSession.get("UserId")
        } else if (nodeState.get("_id")) {
            userId = nodeState.get("_id")
        }
        auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requesteduserId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log MFA method removal " + error)
        //action.goTo(NodeOutcome.SUCCESS);
    }

}