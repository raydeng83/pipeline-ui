/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var auditLib = require("KYID.2B1.Library.AuditLogger")
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

var identityResource = "managed/alpha_user/" + nodeState.get("_id");
var newpassword = nodeState.get("newPassword");
var auditDetails = require("KYID.2B1.Library.AuditDetails")
var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
logger.error("KYID auditDetail " + JSON.stringify(auditData))
if (newpassword) {
    var patchOperation = [
        {
            "operation": "replace",
            "field": "/password",
            "value": newpassword
        },
        {
            "operation": "replace",
            "field": "/description",
            "value": "updated_user"
        }
    ];
    try {
     //   var patchResult = openidm.patch(identityResource, null, patchOperation);
      //  logger.debug("Patch Operation Successfull:" + JSON.stringify(patchResult));
        nodeState.putShared("validationErrorCode", "password_updated_successfully");
        action.goTo("success")
    } catch (e) {
        logger.error("Error Patching Password: " + e)
        auditLib.auditLogger("PWD004", sessionDetails, "Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        action.goTo("fail")
    }
} else {
    logger.error("Password is missing");
    auditLib.auditLogger("PWD004", sessionDetails, "Password Reset Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    action.goTo("fail");
}



