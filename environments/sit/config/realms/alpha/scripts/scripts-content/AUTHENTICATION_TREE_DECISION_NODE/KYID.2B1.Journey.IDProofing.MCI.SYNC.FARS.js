function requestCallbacks() {
logger.error("inside requestCallbacks")
    try{
        if(nodeState.get("context") === "appEnroll" ){
            
            var kogId= nodeState.get("KOGID") || nodeState.get("userName") || "";

            var userInfo = nodeState.get("userInfoJSON") || {};
            userInfo.kogId = kogId;

            var obj = {
                        "apiCalls":[
                        {
                        "method":"MCI",
                        "action":"sync"
                        }
                    ],
                    "message":"appEnroll_ID_MCI_SYNC",
                    "status":"COMPLETED",
                    "collectedUserInfo": userInfo
                    }
        
            if (nodeState.get("validationMessage") != null) {
                var errorMessage = nodeState.get("validationMessage");
                callbacksBuilder.textOutputCallback(0, errorMessage);
            }
            var pageHeader= {"pageHeader": "FARS_RIDP_MCI_SYNC"};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            callbacksBuilder.textOutputCallback(0, JSON.stringify(obj));
            callbacksBuilder.textInputCallback("MCI SYNC");
            callbacksBuilder.confirmationCallback(0, ["next"], 0);
        }
    }catch(error){
       logger.error("Error in catch of requestCallbacks in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

function handleUserResponses() {

    try{
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var kbaStatus = callbacks.getTextInputCallbacks().get(0)

            if (typeof kbaStatus === "string") {
                try {
                    kbaStatus = JSON.parse(kbaStatus);
                    if (!kbaStatus || typeof kbaStatus !== "object" || typeof kbaStatus.status !== "string") {
                        logger.debug("Invalid kbaStatus object or missing status property");
                        nodeState.putShared("validationMessage", "invalid_input");
                        action.goTo("errorMessage");
                    }

                    // Only check refId if status is "failure"
                    else if (kbaStatus.status.toLowerCase() === "failure") {
                        if (!(kbaStatus.refId === null || typeof kbaStatus.refId === "string")) {
                            logger.debug("Invalid refId in kbaStatus (must be null or string) when status is failure");
                            nodeState.putShared("validationMessage", "invalid_input");
                            action.goTo("errorMessage");
                        }else{
                            nodeState.putShared("refId",kbaStatus.refId)
                        }
                    }

                } catch (e) {
                    nodeLogger.error("Error parsing kbaStatus or invalid status: " + e);
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("errorMessage");
                }
            }
        if (selectedOutcome === 0) {
                    //nodeState.putShared("KBABack", "true");
                    // nodeState.putShared("IDProofingAnotherMethod","true")
                    nodeState.putShared("validationMessage",null);
                    if(nodeState.get("displayUser") === "true"){
                         auditLog("VER009", "Remote Identity Verification Failure");
                         action.goTo("displayUser");
                    }else{
                         auditLog("VER008", "Remote Identity Verification Success");
                         action.goTo("true");
                    }
                   
        }
    }catch(error){
        auditLog("VER009", "Remote Identity Verification Failure");
        logger.error("Error in catch of handleUserResponses in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}

function auditLog(code, message){
    try{
    logger.debug("starting auditLog")
     var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                var userId = null;
                var helpdeskUserId = null; 
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


                if(nodeState.get("_id")){
                   userId = nodeState.get("_id") || null;
                }
                 if(nodeState.get("flow")==="helpdesk"){
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                 helpdeskUserId = existingSession.get("UserId")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
                }
                else{
                if (nodeState.get("mail")){
                  var userQueryResult = openidm.query("managed/alpha_user", {
                         _queryFilter: 'mail eq "' + nodeState.get("mail") + '"'
                     }, ["_id"]);
                  userId = userQueryResult.result[0]._id;
                    }
                  var requesterUserId = null;
                   if (typeof existingSession != 'undefined') {
                  requesterUserId = existingSession.get("UserId")
                    }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
                }
    }catch(e){
        logger.error("Error in catch of KYID.2B1.Journey.IDProofing.MCI.SYNC audit log:: " + e)
    }
}


function main(){
   try{
       if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }
   } catch(error){
       logger.error("Error in catch of KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

main();