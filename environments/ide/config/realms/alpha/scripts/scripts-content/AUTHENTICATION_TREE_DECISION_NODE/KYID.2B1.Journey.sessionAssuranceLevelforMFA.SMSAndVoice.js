logger.debug("**********start sessionAssuranceLevelforMFA****************")
var auditLib = require("KYID.2B1.Library.AuditLogger")
var dateTime = new Date().toISOString();


// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication sessionAssuranceLevelforMFA SMS and Voice",
    script: "Script",
    scriptName: "KYID.2B1.Journey.sessionAssuranceLevelforMFA.SMSAndVoice",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
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
    }
};
/* if(nodeState.get("userId")){
userId = nodeState.get("userId");
}
else if(typeof existingSession != 'undefined'){
 userId = existingSession.get("UserId")
}
*/

var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);

var browser = requestHeaders.get("user-agent"); 
var os = requestHeaders.get("sec-ch-ua-platform"); 
var userId = null;
var eventDetails = {};
var requesteduserId = null;
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
eventDetails["OTPDeliveryMethod"] = nodeState.get("otpDeliveryMethod") || "";
eventDetails["MFATYPE"] = "Phone";
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
nodeState.putShared("nextStep",null)
nodeState.putShared("nextStep","Phone");

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
logger.debug("sessionRefId is " +JSON.stringify(sessionDetails));
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
auditLib.auditLogger("VER004",sessionDetails,"Mobile OTP Validation", eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders);

 if(nodeState.get("isMasterLogin") === "true"){
    nodeState.putShared("MFAMethod","MOBILE")
    logger.debug("**********end sessionAssuranceLevelforMFA Mobile****************")
    action.goTo(NodeOutcome.SUCCESS).putSessionProperty("sessionAssuranceLevelforMFA", "4");
 } else {
    action.goTo(NodeOutcome.SUCCESS)
 }

