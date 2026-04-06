var dateTime = new Date().toISOString();
var auditLib = require("KYID.2B1.Library.AuditLogger")

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch user status in UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.UpdateUserStatus",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
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

try {
    //var userId = nodeState.get("_id");
    //var userId= "6d037ebf-358f-4822-a332-e01dc3b94bb3"
    var kogID = nodeState.get("_id") || null
    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined." + kogID);
    nodeState.putShared("_id", kogID);
    if (!kogID) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
        action.goTo(NodeOutcome.FAILED);
    }
    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    var patchArray = [];
    var jsonObj = {}
    var currentTimeinEpoch = Date.now();
    var currentDate = new Date().toISOString();
    var emailOld = null 
    var emailNew = null
    
    if(nodeState.get("mail")!=null && nodeState.get("mail")){
        emailOld = nodeState.get("mail")
        logger.error("Email before update is => "+emailOld)
        var now = new Date();
        var year = now.getUTCFullYear();
        var march = new Date(Date.UTC(year, 2, 1));
        var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7;
        var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0));
        var november = new Date(Date.UTC(year, 10, 1));
        var novDay = (7 - november.getUTCDay()) % 7;
        var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0));
        var eastern = new Date(now.getTime() + ((now >= dstStart && now < dstEnd) ? -4 : -5) * 3600000);
        function pad2(n) { return (n < 10 ? '0' : '') + n; }
        var timestampPrefix = String(eastern.getUTCFullYear()).slice(-2)
            + pad2(eastern.getUTCMonth() + 1)
            + pad2(eastern.getUTCDate())
            + pad2(eastern.getUTCHours())
            + pad2(eastern.getUTCMinutes());
        emailNew = "IA_" + timestampPrefix + "_" + emailOld;
        nodeState.putShared("newEmailKOG",emailNew)
        logger.error("Email after update is => "+emailNew)
     }
    
        jsonObj = {
            "operation": "replace",
            "field": "accountStatus",
            "value": "Terminated"
        }
        patchArray.push(jsonObj)
    
        jsonObj = {
            "operation": "replace",
            "field": "/custom_updatedDateEpoch",
            "value": auditData.updatedDateEpoch
        }
        if(jsonObj.value!=null){
           patchArray.push(jsonObj) 
        }     
    
        jsonObj = {
            "operation": "replace",
            "field": "/custom_updatedByID",
            "value": auditData.updatedByID
        }
        if(jsonObj.value!=null){
           patchArray.push(jsonObj) 
        }     
    
        jsonObj = {
            "operation": "replace",
            "field": "/custom_updatedDateISO",
            "value": auditData.updatedDate
        }
        if(jsonObj.value!=null){
           patchArray.push(jsonObj) 
        }  
    
        jsonObj = {
            "operation": "replace",
            "field": "/custom_updatedBy",
            "value": auditData.updatedBy
        }
        if(jsonObj.value!=null){
           patchArray.push(jsonObj) 
        }  
    
        jsonObj = {
            "operation": "replace",
            "field": "/mail",
            "value": emailNew
        }
        if(jsonObj.value!=null){
           patchArray.push(jsonObj) 
        }  
    
        jsonObj = {
            "operation": "add",
            "field": "/custom_audit/",
            "value": {
                "action": "Terminate",
                "reason": "Client requested account termination on Self Service Portal",
                "comment": "",
                "requesterUserId": kogID
            }
        }
      if(jsonObj.value.requesterUserId!=null){
           patchArray.push(jsonObj) 
        }  
      logger.error("Patch Array value - "+JSON.stringify(patchArray))

    var result = openidm.patch("managed/alpha_user/" + kogID, null, patchArray);
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Patched user status: " + JSON.stringify(patchArray));
    var userId = nodeState.get("userId") || null
    var headerName = "X-Real-IP";
    var headerValues = requestHeaders.get(headerName);
    var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
    var browser = requestHeaders.get("user-agent");
    var os = requestHeaders.get("sec-ch-ua-platform");


    var eventDetails = {};
    eventDetails["IP"] = ipAdress;
    eventDetails["Browser"] = browser;
    eventDetails["OS"] = os;
    eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
    var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

    var sessionDetails = {}
    var sessionDetail = null
    if (nodeState.get("sessionRefId")) {
        sessionDetail = nodeState.get("sessionRefId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else if (typeof existingSession != 'undefined') {
        sessionDetail = existingSession.get("UserId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else {
        sessionDetails = { "sessionRefId": "" }
    }

    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
    auditLib.auditLogger("ACM001", sessionDetails, "Account Termination Success", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)

    action.goTo(NodeOutcome.SUCCESS);
} catch (error) {
    var userId = nodeState.get("userId") || null
    var headerName = "X-Real-IP";
    var headerValues = requestHeaders.get(headerName);
    var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
    var browser = requestHeaders.get("user-agent");
    var os = requestHeaders.get("sec-ch-ua-platform");

    var eventDetails = {};
    eventDetails["IP"] = ipAdress;
    eventDetails["Browser"] = browser;
    eventDetails["OS"] = os;
    eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
    var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

    var sessionDetails = {}
    var sessionDetail = null
    if (nodeState.get("sessionRefId")) {
        sessionDetail = nodeState.get("sessionRefId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else if (typeof existingSession != 'undefined') {
        sessionDetail = existingSession.get("UserId")
        sessionDetails["sessionRefId"] = sessionDetail
    } else {
        sessionDetails = { "sessionRefId": "" }
    }

    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
    auditLib.auditLogger("ACM002", sessionDetails, "Account Termination Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error in patch execution: " + error.message);
    action.goTo(NodeOutcome.FAILED);
}