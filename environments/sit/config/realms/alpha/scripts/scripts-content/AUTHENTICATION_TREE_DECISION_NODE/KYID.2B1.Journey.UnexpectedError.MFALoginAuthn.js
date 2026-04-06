var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
//var auditLib = require("KYID.2B1.Library.UserActivityAuditLogger");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication PushLoginSuccess",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UnexpectedError.MFALoginAuthn",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true"
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
};

function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
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
                if (userEmail){
                var userQueryResult = openidm.query("managed/alpha_user", {
                 _queryFilter: 'mail eq "' + userEmail + '"'
                  }, ["_id"]);
                  userId = userQueryResult.result[0]._id;
                }
                var requesterUserId = null;
           if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
              }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log user activity "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}


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
if(nodeState.get("sessionRefId")){
    sessionDetail = nodeState.get("sessionRefId") 
    sessionDetails["sessionRefId"] = sessionDetail
}else if(typeof existingSession != 'undefined'){
    sessionDetail = existingSession.get("sessionRefId")
    sessionDetails["sessionRefId"] = sessionDetail
}else{
     sessionDetails = {"sessionRefId": ""}
}




var mail = nodeState.get("mail") || "";
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
//var sessionDetails = null
var userId = nodeState.get("userId") || null
// var eventDetails = {
//     applicationId : nodeState.get("appName") || "",
//     MFAMethod :nodeState.get("MFAmethod") || null,
//     emailaddress : mail
//     };
//auditLib.auditLogger("MFA009",sessionDetails,"MFA Authentication Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId )
auditLog("MFA010", "MFA Authentication Failure");
 //auditLib.auditLog("MFA010", "MFA Authentication Failure",nodeState, requestHeaders);
nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "An unexpected error occurred while performing "+mail);
outcome = NodeOutcome.TRUE;