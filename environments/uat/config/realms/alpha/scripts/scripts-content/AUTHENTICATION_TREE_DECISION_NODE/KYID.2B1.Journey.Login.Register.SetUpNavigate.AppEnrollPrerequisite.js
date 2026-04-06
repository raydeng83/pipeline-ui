
var currentTimeinEpoch = Date.now();
var currentDate = new Date().toISOString();
var auditLib = require("KYID.2B1.Library.AuditLogger")
// var dateTime = new Date().toISOString();
try {
    logger.debug("KYID.2B1.Journey.Login.Register.SetUpNavigate.AppEnrollPrerequisite  currentTimeinEpoch" + "::" + currentTimeinEpoch + "::" + "currentDate::" + currentDate)

    var userId = nodeState.get("userId") || nodeState.get("_id") || null
    var headerName = "X-Real-IP";
    var headerValues = requestHeaders.get(headerName);
    var eventDetails = {};
    eventDetails["IP"] = String(headerValues.toArray()[0].split(",")[0]) || ""
    eventDetails["Browser"] = nodeState.get("browser") || ""
    eventDetails["OS"] = nodeState.get("os") || ""
    eventDetails["applicationName"] = nodeState.get("appName") || ""
    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""

    var userEmail = nodeState.get("mail") || "";
    var sessionDetails = {}
    var sessionDetail = null
    if (nodeState.get("sessionRefId")) {
        sessionDetail = nodeState.get("sessionRefId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else if (typeof existingSession != 'undefined') {
        sessionDetail = nodeState.get("sessionRefId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else {
        sessionDetails = { "sessionRefId": "" }
    }

    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

    if (nodeState.get("context") === "appEnroll") {

        if (callbacks.isEmpty()) {

            logger.debug("Inside Callback is Empty")
            // if(updatePrereqStatus(nodeState.get("userPrereqId")),ipAdress,browser,os){
            if (updatePrereqStatus(nodeState.get("userPrereqId"))) {
                logger.error("After User Prereq Patch")
                var header = { "pageHeader": "MFA_PreRequisite_Enrollment_Successful" }
                logger.debug("Header is --> " + JSON.stringify(header))
                callbacksBuilder.textOutputCallback(0, JSON.stringify(header));
                callbacksBuilder.textOutputCallback(0, "Context=appEnrollment");
                callbacksBuilder.textOutputCallback(0, nodeState.get("MFAMethodRegisterd"));

                callbacksBuilder.confirmationCallback(0, ["Next"], 0);
            }

        } else {
            logger.debug("Inside Else part of Callback")
            var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
            logger.error("selectedOutcome is " + selectedOutcome)
            if (selectedOutcome === 0) {
                logger.debug("Select Outcome is 0")
                action.goTo("true")
            }
        }


    }
    else {
        if (nodeState.get("SelectPhonAuthNode") === "back") {
            nodeState.putShared("SelectPhonAuthNode", null);
            outcome = "back";
        }
        else if (nodeState.get("Go_back") == "true") {
            nodeState.putShared("Go_back", null);
            outcome = "back";
        }
        // else if(nodeState.get("BackTOTP")== "true"){
        //     nodeState.putShared("BackTOTP",null);
        //     outcome = "back";

        // }
        // else if(nodeState.get("BackPUSH")== "true"){
        //     nodeState.putShared("BackPUSH",null);
        //     outcome = "FRback";

        // }
        // else if(nodeState.get("phoneBack") == "true"){
        //     nodeState.putShared("phoneBack",null);
        //     outcome = "phoneBack";
        // }

        else {
          // auditLib.auditLogger("PRO005", sessionDetails, "Add Additonal Account Recovery Method", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
          // auditLog("PRO005", "Add Additonal Account Recovery Method");
                outcome = "next";
        }


    }

} catch (error) {
    logger.error("Error Occurred in MAin" + error)
}



function updatePrereqStatus(userPrereqId) {
    try {
        var jsonArray = []
        var jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": "COMPLETED"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "completionDateEpoch",
            "value": currentTimeinEpoch
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "completionDate",
            "value": currentDate
        }
        jsonArray.push(jsonObj)
        try {
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)

            jsonObj = {
                "operation": "replace",
                "field": "/updatedDateEpoch",
                "value": auditData.updatedDateEpoch
            }
            jsonArray.push(jsonObj)
            jsonObj = {
                "operation": "replace",
                "field": "/updatedByID",
                "value": auditData.updatedByID
            }
            jsonArray.push(jsonObj)
            jsonObj = {
                "operation": "replace",
                "field": "/updatedBy",
                "value": auditData.updatedBy
            }
            jsonArray.push(jsonObj)
            jsonObj = {
                "operation": "replace",
                "field": "/updateDate",
                "value": auditData.updatedDate
            }
            jsonArray.push(jsonObj)

            logger.error("auditDetail " + JSON.stringify(auditData))
        } catch (error) {
            logger.error("Error Occured : Couldnot find audit details" + error)

        }

        logger.debug("endpoint/UserPrerequisiteAPI jsonArray --> " + jsonArray)

        var response = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqId, null, jsonArray);
        logger.debug("updatePrereqStatus -- response --> " + response)
        if (response) {
           /* var headerName = "X-Real-IP";
            var headerValues = requestHeaders.get(headerName);

            var eventDetails = {};
            eventDetails["IP"] = String(headerValues.toArray()[0].split(",")[0]) || ""
            eventDetails["Browser"] = nodeState.get("browser") || ""
            eventDetails["OS"] = nodeState.get("os") || ""
            eventDetails["applicationName"] = nodeState.get("prereqAppName") || ""
            eventDetails["applicationId"] = nodeState.get("prereqAppId") || ""
            eventDetails["roleName"] = nodeState.get("prereqRoleName") || ""
            eventDetails["roleId"] = nodeState.get("prereqRoleId") || ""
            var userEmail = nodeState.get("mail") || nodeState.get("email") || "";

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
            */
            try {
             //  auditLib.auditLogger("PRE004", sessionDetails, "Completed Pre-requisite", eventDetails, nodeState.get("_id"), nodeState.get("_id"), transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
               auditLog("PRE004", "Completed Pre-requisite");
            } catch (error) {
                logger.error("Execption Occurred In Audit Logger")

            }

            return response
        }


        else {
            return false
        }



    } catch (error) {
        logger.error("Error Occurred while updatePrereqStatus User Prerequsites" + error)

    }

}


function auditLog(code, message){
     var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
                var requesterId = null;
                
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || "";
                eventDetails["roleName"] = nodeState.get("prereqRoleName") || "";
                eventDetails["roleId"] = nodeState.get("prereqRoleId") || "";
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
                var userEmail = nodeState.get("mail") || nodeState.get("email") || "";
                if(typeof existingSession != 'undefined'){
                 requesterId = existingSession.get("UserId")
                }
                if(nodeState.get("_id")){
                   var userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
}


