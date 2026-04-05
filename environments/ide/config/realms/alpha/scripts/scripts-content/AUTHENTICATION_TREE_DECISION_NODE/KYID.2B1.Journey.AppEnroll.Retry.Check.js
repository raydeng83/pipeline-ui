var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: AppEnroll Retry Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.AppEnroll.Retry.Check",
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

function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    var verificationAttempt = Number(nodeState.get("verificationAttempt")) || 0;
    nodeLogger.debug("Current Verification Attempt: " + verificationAttempt);
    var helpDeskInfo = null;
    var outcome = {}
        
    try{
        var expiryDate = null;
        var expiryDateEpoch = null;
        var option = null;
        var value = null;
        var expiryDateJSON = null;
        var response = null;
        var retryLimit = null;
        var refreshLimit = null
        var version = null;
        
        response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.error("response from query :: " + JSON.stringify(response))

        version = response.result[0].ridp_app_enroll_version || "v2"
        logger.debug("version from query :: " + version)
        
        retryLimit = response.result[0].ridp_app_enroll_retry_limit ;
        logger.debug("retryLimit from query :: " + retryLimit)
        
        refreshLimit = response.result[0].ridp_app_enroll_refresh_limit
        logger.debug("refreshLimit from query :: " + refreshLimit)
        
        if(nodeState.get("appEnrollRIDPMethod") && nodeState.get("appEnrollRIDPMethod") == "LexisNexis"){
            if(version && version === "v2"){
                if(nodeState.get("orig_proofingMethod") && (nodeState.get("orig_proofingMethod") == "4" || nodeState.get("orig_proofingMethod") == "-1" || nodeState.get("orig_proofingMethod") == "2")){
                    if(retryLimit){
                        if(verificationAttempt >= retryLimit){
                            diffInDays = diffInDays();
                            if(refreshLimit){
                                logger.debug("refreshLimit in KYID.2B1.Journey.AppEnroll.Retry.Check :: " + refreshLimit)
                                if(Number(diffInDays) < Number(refreshLimit)){

                                    nodeLogger.debug("Max Retry Attempt Reached. Current Attempt: " + verificationAttempt);
                                    callbacksBuilder.textOutputCallback(1, '{"pageHeader":"Retry_Limit_Reached"}');
                                    //callbacksBuilder.textOutputCallback(0,"Unable to verify your identity");
                                    // callbacksBuilder.textOutputCallback(0,"We are unable to verify your identity based on the submitted information");
                                    // callbacksBuilder.textOutputCallback(0,"Your reference number for further assistance: " + nodeState.get("ridpReferenceID"));
                                    // callbacksBuilder.textOutputCallback(0,"Please go through the below option for further assistance");
                                    helpDeskInfo = helpDesk();  
                                    if(helpDeskInfo != null){
                                        outcome["helpDeskContactInfo"] = helpDeskInfo;
                                    }else{
                                        outcome["helpDeskContactInfo"] = "";
                                    }
                                    outcome["Flow"] = "appenroll";
                                     outcome["referenceId"] = nodeState.get("ridpReferenceID");
                                    callbacksBuilder.textOutputCallback(0,JSON.stringify(outcome));
                                    //callbacksBuilder.textOutputCallback(0,`Please provide the reference number including the dashes: ${nodeState.get("referenceId")}.Once you have verified your identity with [@helpdesk name], please click on the “Continue” button below`)
                                }else{
                                    nodeLogger.debug("Retry Attempt Allowed After Date Check. Current Attempt: " + verificationAttempt);
                                    nodeState.putShared("nextDayRetry", "true");
                                    action.goTo("true")
                                }
                            }else{
                                nodeLogger.debug("Retry Refresh Allowed. Current Attempt: " + verificationAttempt);
                                action.goTo("true")
                            }
                        }else{
                            nodeLogger.debug("Retry Attempt Allowed. Current Attempt: " + verificationAttempt);
                            action.goTo("true")
                        }
                    }else{
                        nodeLogger.error("No retry limit set in esv");
                        action.goTo("true")
                    }
                }else{
                    nodeLogger.error("Proofind Method is 1, no KBA needed");
                    action.goTo("true")
                }
            }else{
                nodeLogger.error("going to v1");
                action.goTo("true")
            }
        }else{
                nodeLogger.error("Not a LexisNexis proofing method, no retry needed");
                action.goTo("true")
            }
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main function " + error);
    }
}

main();


function helpDesk(){
    try{
        var helpDeskName = null;
        var query = null;
        var helpDeskInfo = null;
        if (systemEnv.getProperty("esv.helpdesk.name")) {
            var helpDeskName = systemEnv.getProperty("esv.helpdesk.name");
            var query = openidm.query("managed/alpha_kyid_helpdeskcontact", { "_queryFilter": '/name eq "' + helpDeskName + '"' }, ["*"]);
            if (query.result.length > 0) {
                var helpDeskInfo = query.result[0];
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Help Desk Info::" + JSON.stringify(helpDeskInfo));
                return helpDeskInfo;
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in helpDesk function " + error);
        return null;
    }
}

function diffInDays(){
    var isNextDay = false;
    var lastVerificationDate = null;
    var dateTime = new Date().toISOString();
    try{
        lastVerificationDate = nodeState.get("lastVerificationDate");
        logger.debug("isNextDay in KYID.2B1.Journey.AppEnroll.Retry.Check :: " + isNextDay)

        // Convert to Date objects
        var date1 = new Date(lastVerificationDate);
        var date2 = new Date(dateTime);
        date1.setHours(0, 0, 0, 0); 
        date2.setHours(0, 0, 0, 0);
        var diffInMs = date2 - date1;

        // Check if today is strictly after the last verification date's day
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        logger.debug("diffInDays in KYID.2B1.Journey.AppEnroll.Retry.Check :: " + diffInDays)

        return diffInDays;
    }catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in checkDate function " + error);
        return false;
    }
}


function getTransactionId() {
    try {
        nodeLogger.debug("userPrereqId :: " + nodeState.get("userPrereqId"))
        // var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrereqId/_refResourceId eq "' + nodeState.get("userPrereqId") + '"' }, ["*"]);
        var response = openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", {
            "_queryFilter": 'userPrerequisite/ eq "' + nodeState.get("userPrereqId") + '"'
        }, ["*"]);
        nodeLogger.debug("getTransactionId is --> " + response)
        if (response) {
            if (response.resultCount > 0) {
                nodeState.putShared("transaction_Id", response.result[0]._id)
                return response.result[0]
            } else {
                return null
            }

        } else {
            return null
        }
    } catch (error) {
        logger.error("Errror Occurred While getTransactionId is --> " + error)

    }
}


function createTransaction(status, refId, expiryDate, expiryDateEpoch) {
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        nodeLogger.debug("Starting user createTransaction creation for ID: ");
        nodeLogger.debug("status is --> " + status)
        nodeLogger.debug("refId is --> " + refId)
        nodeLogger.debug("expiryDate is --> " + expiryDate)
        nodeLogger.debug("expiryDateEpoch is --> " + expiryDateEpoch)
        nodeLogger.debug("currentTimeEpoch is --> " + currentTimeEpoch)
        logger.debug("dateTime is --> " + dateTime)
        logger.debug("user Id  is --> " + nodeState.get("UserId"))
        logger.debug("user prereq Id  is --> " + nodeState.get("userPrereqId"))

        var userInfoJSON = nodeState.get("userInfoJSON")
        if (userInfoJSON && userInfoJSON.ssn != null) {
            logger.debug("SSN before nulling --> " + userInfoJSON.ssn);
            userInfoJSON.ssn = null;
            logger.debug("SSN after nulling --> " + userInfoJSON.ssn);
        }
        var newUserInfoJSON = userInfoJSON
        nodeState.putShared("userInfoJSON", newUserInfoJSON)

        var businessApp = getBusinessApp(nodeState.get("userPrereqId"));
        nodeLogger.debug("Business App = " + businessApp);
        var requestBody = {
            "createDate": auditData.createdDate,
            "createdBy": auditData.createdBy,
            "createdByID": auditData.createdByID,
            "createDateEpoch": auditData.createdDateEpoch,
            "updateDate": auditData.updatedDate,
            "updateDateEpoch": auditData.updatedDateEpoch,
            "updatedBy": auditData.updatedBy,
            "updatedByID": auditData.updatedByID,
            "requestedUserId": nodeState.get("UserId"),
            "requesterUserId": nodeState.get("UserId"),
            "recordState": "0",
            "recordSource": "KYID-System",
            "businessAppName": businessApp
        }
        if (nodeState.get("userPrereqId")) {
            requestBody["userPrerequisiteId"] = {
                "_ref": "managed/alpha_kyid_enrollment_user_prerequisites/" + nodeState.get("userPrereqId"),
                "_refProperties": {}
            }
            requestBody["userPrerequisite"] = nodeState.get("userPrereqId")
        }

        if (nodeState.get("userInfoJSON")) {
            requestBody["userRequest"] = JSON.stringify(nodeState.get("userInfoJSON"))
        }

        if (status) {
            requestBody["status"] = status
        }
        if (expiryDate) {
            requestBody["expiryDate"] = expiryDate
        }
        if (expiryDateEpoch) {
            requestBody["expiryDateEpoch"] = expiryDateEpoch
        }
        if (refId) {
            requestBody["referenceId"] = refId
        }
        if (businessApp) {
            requestBody["businessAppName"] = businessApp
        }

        if (nodeState.get("proofingMethod")) {
            requestBody["proofingMethod"] = nodeState.get("proofingMethod")
        }

        nodeLogger.debug("requestBody is :: => " + JSON.stringify(requestBody))
        var response = openidm.create("managed/alpha_kyid_remote_identity_proofing_request", null, requestBody);
        nodeLogger.debug("response is --> " + response)
        if(nodeState.get("userIdentity")){
            nodeState.putShared("patchUserId",nodeState.get("userIdentity"))
        }
        


    } catch (error) {
        logger.error("Errror Occurred While createTransaction is --> " + error)

    }

}


function patchTransaction(status, expiryDate, expiryDateEpoch) {
    try {

        nodeLogger.debug("Starting user patchTransaction creation for ID: ");
        nodeLogger.debug("status is --> " + status)
        logger.debug("expiryDate is --> " + expiryDate)
        logger.debug("expiryDateEpoch is --> " + expiryDateEpoch)
        logger.debug("currentTimeEpoch is --> " + currentTimeEpoch)
        logger.debug("dateTime is --> " + dateTime)
        logger.debug("user Id  is --> " + nodeState.get("UserId"))
        logger.debug("user prereq Id  is --> " + nodeState.get("userPrereqId"))

        var jsonArray = []

        logger.debug("user prereq ID = " + nodeState.get("userPrereqId"));
        var businessApp = getBusinessApp(nodeState.get("userPrereqId"));
        logger.debug("Business App = " + businessApp);

        if (status) {
            var jsonObj = {
                "operation": "replace",
                "field": "status",
                "value": status
            }
            jsonArray.push(jsonObj)

        }

        if (dateTime) {
            var jsonObj = {
                "operation": "replace",
                "field": "updateDate",
                "value": dateTime
            }
            jsonArray.push(jsonObj)

        }

        if (currentTimeEpoch) {
            var jsonObj = {
                "operation": "replace",
                "field": "updateDateEpoch",
                "value": currentTimeEpoch
            }
            jsonArray.push(jsonObj)

        }

        if (nodeState.get("UserId")) {
            var jsonObj = {
                "operation": "replace",
                "field": "updatedBy",
                "value": nodeState.get("UserId")
            }
            jsonArray.push(jsonObj)

        }
        if (expiryDate) {
            var jsonObj = {
                "operation": "replace",
                "field": "expiryDate",
                "value": expiryDate
            }
            jsonArray.push(jsonObj)

        }
        if (expiryDateEpoch) {
            var jsonObj = {
                "operation": "replace",
                "field": "expiryDateEpoch",
                "value": expiryDateEpoch
            }
            jsonArray.push(jsonObj)

        }

        if (businessApp) {
            var jsonObj = {
                "operation": "replace",
                "field": "businessAppName",
                "value": businessApp
            }
            jsonArray.push(jsonObj)

        }
        
        try {
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
            var jsonObj = {
                operation: "replace",
                field: "/updateDateEpoch",
                value: auditData.updatedDateEpoch
            }
            jsonArray.push(jsonObj)
            var jsonObj = {
                operation: "replace",
                field: "/updatedByID",
                value: auditData.updatedByID
            }
            jsonArray.push(jsonObj)
            var jsonObj = {
                operation: "replace",
                field: "/updateDate",
                value: auditData.updatedDate
            }
            jsonArray.push(jsonObj)
            var jsonObj = {
                operation: "replace",
                field: "/updatedBy",
                value: auditData.updatedBy
            }

            if (nodeState.get("userInfoJSON")) {
            var jsonObj = {
                operation: "replace",
                field: "/userRequest",
                value: JSON.stringify(nodeState.get("userInfoJSON"))
            }
            jsonArray.push(jsonObj)
            }

            jsonArray.push(jsonObj)
            logger.debug("auditDetail " + JSON.stringify(auditData))
            logger.debug("jsonArray in patchTransaction " + JSON.stringify(jsonArray))

        } catch (error) {
            logger.error("Error Occured : Could not find audit details" + error)

        }

        if (jsonArray.length > 0) {
            var response = openidm.patch("managed/alpha_kyid_remote_identity_proofing_request/" + nodeState.get("transaction_Id"), null, jsonArray);
            logger.debug("patch response alpha_kyid_remote_identity_proofing_request --> " + response)
            if (response) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }

    } catch (error) {
        logger.error("Errror Occurred While patchTransaction is --> " + error)

    }
}