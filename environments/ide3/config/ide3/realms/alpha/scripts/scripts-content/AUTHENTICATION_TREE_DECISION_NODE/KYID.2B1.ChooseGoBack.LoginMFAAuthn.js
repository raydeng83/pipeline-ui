var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger")

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication GoBackorProceed",
    script: "Script",
    scriptName: "KYID.2B1.ChooseGoBack.LoginMFAAuthn",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false"
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


var mail = nodeState.get("mail") || "";
if(nodeState.get("anotherFactor") === "anotherFactor"){
    logger.debug("Inside another factor in authentication tree")
   nodeState.putShared("anotherFactor", null);
    nodeState.putShared("BackPUSH",null) // NR - Added this to nullify the nodeState 
    outcome = "true";
 
}else{
    nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "User is authenticated successfully "+mail);
//var userId = nodeState.get("userId") || null
//var userId = nodeState.get("_id") || (typeof existingSession !== 'undefined' && existingSession.get("UserId")) ||"";


/* var headerName = "X-Real-IP";
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
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
var sessionDetails = {}
var sessionDetail = null
var KOGID = nodeState.get("KOGID");
if(nodeState.get("sessionRefId")){
    sessionDetail = nodeState.get("sessionRefId") 
    sessionDetails["sessionRefId"] = sessionDetail
}else if(typeof existingSession != 'undefined'){
    sessionDetail = existingSession.get("sessionRefId")
    sessionDetails["sessionRefId"] = sessionDetail
}else{
     sessionDetails = {"sessionRefId": ""}
}
//var helpdeskUserId = existingSession.get("UserId") || null;
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
 
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
//auditLib.auditLogger("MFA009",sessionDetails,"MFA Authentication Success", eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId) */
var logUserActivity = nodeState.get("logUserActivity");
    logger.debug("loguseractivity" +logUserActivity);
if (logUserActivity === false) {
    logger.debug("inside loguseractivuty false");
    nodeState.putShared("logUserActivity",null);
    outcome = "false";
}
else{
  auditLog("MFA009", "MFA Authentication Success");
  outcome = "false";
    }
}

// if(nodeState.get("anotherFactor") === "anotherFactor"){
//     logger.debug("Inside another factor in authentication tree")
//     outcome = "true";
 
// }else{
//     logger.debug("gotosuccess")
//     outcome = "false";
// }



function auditLog(code, message){
    try{
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
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

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

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA Authentication success "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}