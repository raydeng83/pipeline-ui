logger.error("Executing KYID.2B1.Library.UserActivityAuditLogger Script");

function auditLogger(eventCode,sessionDetails,eventName, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, apllicationId, sessionRefId) {
try{
    logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();
    
    var logPayload = {
        eventCode:eventCode,
        eventName: eventName,
        eventDetails: JSON.stringify(eventDetails),
        requesterUserId: requesterUserId,
        requestedUserId: requestedUserId,
        transactionId: transactionId,
        sessionDetails:sessionDetails?JSON.stringify(sessionDetails):null,
        createdDate: createdDate,
        createdTimeinEpoch: currentTimeinEpoch,
        emailId: emailId || "",
        applicationName: apllicationId || "",
        sessionId: sessionRefId || ""
    };
logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
     const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
    logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
   } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }
   
}


function auditLog(code, message, nodeState, requestHeaders){
    try{
         logger.error("inside auditLog Function new");
         logger.error("nodestate : "+nodeState.get("teststring"));
         logger.error("nodestate : "+nodeState.teststring);
        logger.error("audit log browser : "+nodeState.get("browser"));
         logger.error("audit log OS: "+nodeState.get("os"));
        logger.error("audit log appName : "+nodeState.get("appName"));
        logger.error("audit log appLogo "+nodeState.get("appLogo"));
        logger.error("audit log sessionRefId : "+nodeState.get("sessionRefId"));
        logger.error("audit log mail "+nodeState.get("mail"));
        logger.error("audit log _id"+nodeState.get("_id"));
        logger.error("audit log headers "+JSON.stringify(requestHeaders));
         //var auditLib = require("KYID.2B1.Library.AuditLogger")
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
                    logger.error("inside first if");
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    logger.error("inside second if");
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                    logger.error("inside third if");
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                //auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
                auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId);
    }catch(error){
        logger.error("Failed to log event audit logger "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}


exports.auditLog=auditLog;