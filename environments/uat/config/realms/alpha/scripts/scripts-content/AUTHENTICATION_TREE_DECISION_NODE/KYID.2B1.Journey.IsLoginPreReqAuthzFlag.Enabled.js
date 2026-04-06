var auditLib = require("KYID.2B1.Library.AuditLogger")
var eventDetails = nodeState.get("eventDetails") || {} ;
// if(!eventDetails.applicationName){
//     eventDetails["applicationName"] = nodeState.get("appName") || ""
// }

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
//var sessionDetails = {"sessionRefId" : nodeState.get("sessionRefId")};
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

var userId = ""

if(nodeState.get("usrcreatedId")){
userId = nodeState.get("usrcreatedId");
}
else if(typeof existingSession != 'undefined'){
 userId = existingSession.get("UserId")
}
var sessionDetails = {}
var sessionDetail = null
if(nodeState.get("sessionRefId")){
    sessionDetail = nodeState.get("sessionRefId") 
    sessionDetails["sessionRefId"] = sessionDetail
}else if(typeof existingSession != 'undefined'){
    sessionDetail = existingSession.get("UserId")
    sessionDetails["sessionRefId"] = sessionDetail
}else{
     sessionDetails = {"sessionRefId": ""}
}
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];


var loginAuthzFlagEnabled = systemEnv.getProperty("esv.kyid.loginpreq.authz.enabled")
logger.debug("the esv for enforcing the loginprereq and authz login experience::"+loginAuthzFlagEnabled)

if(loginAuthzFlagEnabled == false || loginAuthzFlagEnabled === false || loginAuthzFlagEnabled === "false"){
logger.debug("Login Pre Requisite and Authorization Flag is OFF. Skipping Login Pre Requisite and Authorization Journey")
// auditLib.auditLogger("MFA009",sessionDetails,"MFA Authentication Success", eventDetails, userId, userId, transactionId)
auditLib.auditLogger("LOG001",sessionDetails,"Successful Login", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    action.goTo("skipLoginprereqauthz")
} else {
logger.debug("Login Pre Requisite and Authorization Flag is ON. Value: "+loginAuthzFlagEnabled)
action.goTo("loginprereqauthz")
}