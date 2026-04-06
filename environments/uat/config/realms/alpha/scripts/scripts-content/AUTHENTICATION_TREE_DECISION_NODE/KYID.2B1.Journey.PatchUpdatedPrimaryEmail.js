var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
//var auditLib = require("KYID.2B1.Library.UserActivityAuditLogger");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch NewEmail in UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Journey.PatchUpdatedPrimaryEmail",
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
    },
    info: function (message) {
        logger.info(message);
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
                var requestedUserId = nodeState.get("_id") || null
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requestedUserId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log update Personal info updated "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

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

try {
    // Retrieve user ID and check if it's valid
    var userId = nodeState.get("_id");
    //var userId = "ace845e3-d921-44cc-8b4e-13ba26a39065";
    if (!userId) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User ID not Found");
        action.goTo(NodeOutcome.FAILED);
    }

    // Retrieve telephone number and check if it's valid
    var newemail1 = nodeState.get("newemail1");
    if (newemail1 === null || newemail1 === undefined) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Email ID not Found");
        action.goTo(NodeOutcome.FAILED);
    }

    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    logger.error("auditDetail " + auditData)

    // Perform the patch operation to update the user's telephone number
    var result = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "mail", "value": newemail1 },
    {
        operation: "replace",
        field: "/custom_updatedDateEpoch",
        value: auditData.updatedDateEpoch
    },
    {
        operation: "replace",
        field: "/custom_updatedByID",
        value: auditData.updatedByID
    },
    {
        operation: "replace",
        field: "/custom_updatedDateISO",
        value: auditData.updatedDate
    },
    {
        operation: "replace",
        field: "/custom_updatedBy",
        value: auditData.updatedBy
    },
    ]);

    // Check if the patch operation was successful
    if (result) {
        nodeState.putShared("MFAMethod", "EMAIL");
        nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Prinary email is updated successfully" + "::" + newemail1);
        //auditLib.auditLog("PRO001","Primary  Email Updated",nodeState, requestHeaders);
        auditLog("PRO001", "Primary Email Updated");
        action.goTo(NodeOutcome.SUCCESS);
    } else {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error Occurred while updating email " + "::" + newemail1);
        //auditLib.auditLogger("PRO002",sessionDetails,"Primary Email Update Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
        //auditLib.auditLog("PRO002", "Primary Email Update Failure",nodeState, requestHeaders);
        auditLog("PRO002", "Primary Email Update Failure");
        action.goTo(NodeOutcome.FAILED);
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error Occurred while updating email " + "::" + error + "::" + newemail1);
    //auditLib.auditLog("PRO002", sessionDetails, "Primary Email Update Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
    //auditLib.auditLog("PRO002", "Primary Email Update Failure",nodeState, requestHeaders);
    auditLog("PRO002", "Primary Email Update Failure");
    action.goTo(NodeOutcome.FAILED);
}
