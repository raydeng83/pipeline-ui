var differentemailretrylimit = nodeState.get("differentemailretrylimit");
logger.debug("differentemailretrylimit : "+differentemailretrylimit);
var emailretrylimit = nodeState.get("emailretrylimit");
logger.debug("emailretrylimit : "+emailretrylimit);
var anotherfactor = nodeState.get("anotherFactor");
logger.debug("anotherfactor : "+anotherfactor);
var changeEmailCount = nodeState.get("changeEmailCount");
logger.debug("changeEmailCount : "+changeEmailCount);

if (nodeState.get("addtionalEmailFlag") != null){
    nodeState.putShared("addtionalEmailFlag","false");
}

if(nodeState.get("anotherFactor") != null){
    var anotherFactor=nodeState.get("anotherFactor");
    action.goTo("back");
    
}
 //added else if in this block to resolve alternate email 'different email' redirection issue
else if(differentemailretrylimit === "true"){        
 action.goTo("next");
 }
else if(nodeState.get("errorMessage") != null){
    action.goTo("back"); 
}
else if(nodeState.get("Alternate_Email_Verification")=="back"){
    logger.debug("Alternate_Email_Verification value is back")
    action.goTo("next");
}
else if(nodeState.get("skipEmail")=="true"){
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("skipEmail",null)
    nodeState.putShared("postadditionalemail","true");
    nodeState.putShared("verifiedAlternateEmail",null);
    action.goTo("next");
}
    else if (nodeState.get("Retry_another_method")){
        action.goTo("next");
    }
    else if(nodeState.get("Try_different_verification_method")){
        action.goTo("next");
    }
else{
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("verifiedAlternateEmail",nodeState.get("alternateEmail"))
    nodeState.putShared("postadditionalemail","true");
    
    logger.debug("Going to Next node")
    action.goTo("next");
}



function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        logger.debug("nodeState" + nodeState.get("browser"));
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = nodeState.get("browser") || "";
        eventDetails["OS"] = nodeState.get("os") || "";
        eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFAMethod"] = nodeState.get("MFAmethod") || null;
        var sessionDetails = {}
        var sessionDetail = null;
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = {
                "sessionRefId": ""
            }
        }


        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var userEmail = nodeState.get("mail") || "";
        if (typeof existingSession != 'undefined') {
            userId = existingSession.get("UserId")
        } else if (nodeState.get("_id")) {
            userId = nodeState.get("_id")
        }
        auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log additonal recovery method" + error)
        //action.goTo(NodeOutcome.SUCCESS);
    }

}


