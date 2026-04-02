var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var expiryDateJSON = null;
var value = null;
var expiryDate = null;
var expiryDateEpoch = null
var option = null;

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: PatchUserPrereqAppEnroll",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Patch.UserPrereq.AppEnroll.v3",
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


function main(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main of KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll");
    try {
        getTransactionId();
        var proofingMethod = null;
        var patchResponse = null;
        nodeLogger.debug("Executing KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll ")

        if (nodeState.get("context") === "appEnroll") {
            nodeState.putShared("context", "appEnroll")
            nodeLogger.debug("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll Inside App enroll and " + nodeState.get("prereqStatus"))
            if (nodeState.get("prereqStatus") === "COMPLETED") {
                if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                    if(!nodeState.get("refId")){
                            refId= generateGUID()
                            nodeState.putShared("refId",refId)   
                    }
                }
               
                nodeLogger.debug("inside prereqStatus COMPLETED")
                if (nodeState.get("dueDateType") && nodeState.get("dueDateType") !== null) {
                    option = nodeState.get("dueDateType")
                    if (nodeState.get("dueDateValue")) {
                        value = nodeState.get("dueDateValue")
                    }
                    expiryDateJSON = getExpiryDate(option, value)
                    if (expiryDateJSON !== null) {
                        expiryDate = expiryDateJSON.expiryDate
                        expiryDateEpoch = expiryDateJSON.expiryEpochMillis

                    }
                }

                nodeLogger.debug("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  Inside prereqStatus COMPLETED ")
                // proofingMethod = "2";
                patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"), expiryDate, expiryDateEpoch);
                nodeLogger.debug("Allow Reuse Flag is "+ nodeState.get("allowReuse"))
                var allowReuse = nodeState.get("allowReuse") || false
                var allowReuseIfDaysOld = (nodeState.get("allowReuseIfDaysOld"))
                if((allowReuse === true) && (allowReuseIfDaysOld == "0" || allowReuseIfDaysOld =="-1")){
                nodeLogger.debug("Inside Allow Reuse Condtion")
                var pendingUserPrereqIds = getUserPrerequisites()
                    if(pendingUserPrereqIds.length>0){
                        nodeLogger.debug("Pending User Prereq are "+ pendingUserPrereqIds)
                        pendingUserPrereqIds.forEach(val=>{
                            updatePrereqStatus(val, expiryDate, expiryDateEpoch);
                        })
                    }
                }
                nodeLogger.debug("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  patchResponse is" + patchResponse)
                nodeLogger.debug("appEnrollRIDPMethod methiod is :: " + nodeState.get("appEnrollRIDPMethod"))
                if (nodeState.get("appEnrollRIDPMethod") === "LexisNexis") {
                    nodeLogger.debug("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  LexisNexis ")
                    proofingMethod = "4"
                } else {
                    nodeLogger.debug("KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll  CMS ")
                    proofingMethod = "2"
                }
                // if (nodeState.get("patchUserId")) {
                //     patchUserIdentity(proofingMethod)
                // } else {
                //     createUser(proofingMethod)
                // }

                if (nodeState.get("transaction_Id") !== null && nodeState.get("transaction_Id")) {
                    patchTransaction("0", expiryDate, expiryDateEpoch)
                } else {
                    createTransaction("0", null, expiryDate, expiryDateEpoch)
                }


            } else if (nodeState.get("prereqStatus") === "REVERIFY") {
                nodeLogger.debug("inside prereqStatus REVERIFY")
                nodeLogger.debug("inside prereqStatus REVERIFY and patchPrereq status " + nodeState.get("patchPrereq"))
                nodeState.putShared("prereqStatus1", "REVERIFY")
                //proofingMethod = "2";
                if(!nodeState.get("patchPrereq")){
                    patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"), null, null);
                }
                

                if (nodeState.get("appEnrollRIDPMethod") === "LexisNexis") {
                    proofingMethod = "4"
                } else {
                    proofingMethod = "2"
                }
                var refId = nodeState.get("refId");
                if (nodeState.get("appEnrollRIDPMethod") === "LexisNexis") {
                    refId = nodeState.get("refId")
                }
                
                if(!nodeState.get("patchPrereq")){
                    if (nodeState.get("transaction_Id") !== null && nodeState.get("transaction_Id") !== null) {
                        if (nodeState.get("patchUserId")) {
                            patchTransaction("1", null, null)
                        } else {
                            createUser(proofingMethod)
                        }
    
                    } else {
                        createTransaction("1", refId, null, null)
                    }
                }

            } else if (nodeState.get("prereqStatus") === "PENDING") {
                nodeLogger.debug("Inside Prere Status PENDING")
                 if(!nodeState.get("patchPrereq")){
                    patchTransaction("1", null, null)
                    patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"), null, null)
                 }
            } else if (nodeState.get("prereqStatus") === "NOT_COMPLETED") {
                nodeLogger.debug("Inside Prere Status NOT_COMPLETED")
                patchResponse = updatePrereqStatus(nodeState.get("userPrereqId"), null, null)
            }



            if (patchResponse || (nodeState.get("patchPrereq") && nodeState.get("patchPrereq") === "false")) {
                if (nodeState.get("prereqStatus") === "REVERIFY") {
                    nodeState.putShared("FARS", "1")
                    auditLog("RIDP006","Going to FARS1");
                    if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis" && nodeState.get("flow")==="helpdesk"){
                       nodeState.putShared("lexisHelpdeskFARS", "true")
                    }
                    nodeState.putShared("farsContinue","true")
                    action.goTo("FARS")
                } else if (nodeState.get("prereqStatus") === "PENDING") {
                    if (nodeState.get("LexisNexisFARS") === "true") {
                        nodeState.putShared("displayFARS2", "true")
                    }
                    auditLog("RIDP006","Going to FARS1");
                    nodeState.putShared("lexisHelpdeskFARS", "true")
                    action.goTo("displayFARS2")
                } else {
                    action.goTo("appEnrollMessage")
                }

            } else {
                nodeLogger.debug("error")
            }

        } else {
            action.goTo("Next")
        }
    } catch (error) {
        logger.error("Error Occurred KYID.2B1.Journey.IDProofing.PatchUserPrereqAppEnroll " + error)
    }
}

main();

function generateGUID() {
    const firstName = nodeState.get("givenName") ||"A"
    const firstLetter = firstName.charAt(0).toUpperCase();
    const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000; // 10 digits
    return `${firstLetter}${randomNumber}`;
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


// Audit Log Function
function auditLog(code, message) {
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
        if(nodeState.get("flow") === "helpdesk"){
            eventDetails["applicationName"] = systemEnv.getProperty("esv.helpdesk.name");
        }else{
            eventDetails["applicationName"] = systemEnv.getProperty("esv.kyid.portal.name");
        }

        eventDetails["requestedApplication"] = nodeState.get("appName") || "";
        eventDetails["requestedRole"] = nodeState.get("roleName") || "";
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}


function updatePrereqStatus(userPrereqId, expiryDate, expiryDateEpoch) {
    try {
        var jsonArray = []
        var prereqValues = []
        var userInfoJSON = nodeState.get("userInfoJSON")

        nodeLogger.debug("prereqValues are --> " + JSON.stringify(prereqValues))


        var jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": nodeState.get("prereqStatus")
        }
        jsonArray.push(jsonObj)

        jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": currentTimeEpoch
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": dateTime
        }

        jsonArray.push(jsonObj)
        if (nodeState.get("prereqStatus") === "COMPLETED") {
            jsonObj = {
                "operation": "replace",
                "field": "completionDateEpoch",
                "value": currentTimeEpoch
            }
            jsonArray.push(jsonObj)

        }

        if (nodeState.get("prereqStatus") === "COMPLETED") {
            jsonObj = {
                "operation": "replace",
                "field": "completionDate",
                "value": dateTime
            }
            jsonArray.push(jsonObj)

        }

        if (expiryDate !== null) {
            jsonObj = {
                "operation": "replace",
                "field": "expiryDate",
                "value": expiryDate
            }
            jsonArray.push(jsonObj)

        }


        if (expiryDateEpoch !== null) {
            jsonObj = {
                "operation": "replace",
                "field": "expiryDateEpoch",
                "value": expiryDateEpoch
            }
            jsonArray.push(jsonObj)

        }




        jsonObj = {
            "operation": "replace",
            "field": "updatedBy",
            "value": nodeState.get("UserId")
        }
        jsonArray.push(jsonObj)

        if (prereqValues.length > 0) {
            jsonObj = {
                "operation": "replace",
                "field": "prerequisiteValues",
                "value": prereqValues
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
            jsonArray.push(jsonObj)
            nodeLogger.debug("auditDetail " + JSON.stringify(auditData))
        } catch (error) {
            logger.error("Error Occured : Couldnot find audit details" + error)

        }
        nodeLogger.debug("endpoint/UserPrerequisiteAPI jsonArray --> " + JSON.stringify(jsonArray))

        var response = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqId, null, jsonArray);
        nodeLogger.debug("updatePrereqStatus -- response --> " + response)
        if (response) {
            return response
        } else {
            return null
        }



    } catch (error) {
        logger.error("Error Occurred while updatePrereqStatus User Prerequsites" + error)
        action.goTo("error")

    }

}

function getUserPrerequisites() {
    try {
        nodeLogger.debug("Executing getUserPrerequisites Function")
        var userPrereqIds=[]
        var query = `requestedUserAccountId eq '${nodeState.get("_id")}' AND preRequisiteId/_refResourceId eq '${nodeState.get("prereqId")}' AND (status eq '0' OR status eq 'NOT_STARTED' OR status eq '1' OR status eq 'PENDING_APPROVAL' OR status eq 'REVERIFY' OR status eq '8' OR status eq '7' OR status eq 'PENDING') AND (recordState eq '0' OR recordState eq 'ACTIVE')`
        var userQueryResult = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
            _queryFilter:query
        }, ["*"]);
        if(userQueryResult && userQueryResult.resultCount>0){
            nodeLogger.debug("getUserPrerequisites :  Found User Prereq ")
            userQueryResult.result.forEach(userPrereq=>{
                if(userPrereq._id){
                    userPrereqIds.push(userPrereq._id)
                }
            })
        }
        return userPrereqIds
    } catch (error) {
        logger.error("getUserPrerequisites :  Error Occurred While Getting User Prerequisites"+ error)
        return []
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

        // if(nodeState.get("appEnrollRIDPMethod") === "Experian"){
        //     nodeState.putShared("proofingMethod","2")
        // }else if (nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
        //     nodeState.putShared("proofingMethod","4")
        // }

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

function getBusinessApp(prereqID) {
    try {
        var userPrereq = openidm.read("managed/alpha_kyid_enrollment_user_prerequisites/" + prereqID, null, ["*"]);

        if (userPrereq) {
            var roleId = userPrereq.associatedRoleIds;
            nodeLogger.debug("Role IDs = " + roleId);
        }
        var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
            _queryFilter: 'roleAppId/_refResourceId eq "' + roleId + '"'
        }, ["*"]);

        if (businessAppResponse.resultCount > 0) {
            var businessApp = businessAppResponse.result[0].name;
            nodeLogger.debug("Business App = " + businessApp);
            return businessApp;
        }
    } catch (error) {
        logger.error("Errror Occurred While fetching business App in function getBusinessApp is --> " + error)
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


        //  if (nodeState.get("userInfoJSON")) {
        //     jsonArray["userRequest"] = JSON.stringify(nodeState.get("userInfoJSON"))
        // }
        
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

function getExpiryDate(option, value) {
    logger.debug("inside getExpiryDate function")
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now() // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString() // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate) // Convert the ISO string into a Date object

        var expiryDate;

        switch (option) {
            case 0: // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000) // Add one day (24 hours) to the current time
                break;
            case 1: // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000) // Add one week (7 days)
                break;
            case 2: // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1) // Add one month to the current date
                break;
            case 3: // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3) // Add 3 months to the current date
                break;
            case 4: // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6) // Add 6 months to the current date
                break;
            case 5: // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // Add 1 year to the current date
                break;
            case 6: // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day) // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // If the date is already passed this year, set it to the next year
                }
                break;
            case 7: // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000) // Add 'value' days in milliseconds
                break;
            case 8: // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value); // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return null
        }

        const expiryEpochMillis = new Date(expiryDate).getTime() // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return {
            "expiryEpochMillis": expiryEpochMillis,
            "expiryDate": expiryDate
        };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        return null

    }

}

function createUser(proofingMethod) {
    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        var userInfoJSON = nodeState.get("userInfoJSON")
        var lexId = null
        logger.debug("Starting user identity creation for ID: ");
        if (nodeState.get("lexId")) {
            lexId = nodeState.get("lexId")
        }

        var verificationMismatch = false
        if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!=null && nodeState.get("verificationMismatch") === true){
            verificationMismatch = true
        }


        var userData = {
            "proofingMethod": proofingMethod,
            "lastVerificationDate": dateTime,
           "createDate": auditData.createdDate,
            "createdBy": auditData.createdBy,
            "createdByID": auditData.createdByID,
            "createDateEpoch": auditData.createdDateEpoch,
            "updateDate": auditData.updatedDate,
            "updateDateEpoch": auditData.updatedDateEpoch,
            "updatedBy": auditData.updatedBy,
            "updatedByID": auditData.updatedByID,
            "verificationMismatch": verificationMismatch,
            "recordState": "0",
            "recordSource": "KYID-System",
            account: []

        }
        if(lexId && lexId !==null){
            userData["uuid"] = lexId
        }
        if (nodeState.get("UserId")) {
            userData.account.push({
                "_ref": "managed/alpha_user/" + nodeState.get("UserId"),
                "_refProperties": {}
            })
        }
        if (userInfoJSON.suffix) {
            userData["suffix"] = userInfoJSON.suffix
        }
        if (userInfoJSON.middleName) {
            userData["middleName"] = userInfoJSON.middleName
        }
        if (userInfoJSON.stateProvince) {
            userData["stateCode"] = userInfoJSON.stateProvince
        }
        if (userInfoJSON.sn) {
            userData["sn"] = userInfoJSON.sn
        }
        if (userInfoJSON.gender) {
            userData["gender"] = userInfoJSON.gender
        }
        if (userInfoJSON.dob) {
            userData["dob"] = userInfoJSON.dob
        }
        if (userInfoJSON.isHomeless) {
            userData["isHomeless"] = userInfoJSON.isHomeless
        }
        if (userInfoJSON.postalAddress) {
            userData["addressLine1"] = userInfoJSON.postalAddress
        }
        if (userInfoJSON.postalAddress2) {
            userData["addressLine2"] = userInfoJSON.postalAddress2
        }
        if (userInfoJSON.givenName) {
            userData["givenName"] = userInfoJSON.givenName
        }
        if (userInfoJSON.city) {
            userData["city"] = userInfoJSON.city
        }
        if (userInfoJSON.postalCode) {
            userData["zip"] = userInfoJSON.postalCode
        }
        if (userInfoJSON.postalExtension) {
            userData["postalExtension"] = userInfoJSON.postalExtension
        }
        if (userInfoJSON.county) {
            userData["countyCode"] = userInfoJSON.county
        }
        var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
        nodeState.putShared("patchUserId", response._id)
        logger.debug("response is --> " + response)


    } catch (error) {
        logger.error("Errror Occurred While creating userIdentity is --> " + error)

    }

}