var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger")

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch Context ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RIDP.Patch.Context",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    MISSING_MANDATORY: "divert",
    EXIT: "exit",
    changeLog: "changeLog"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};




function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
            var patchPreReq = require("KYID.2B1.Library.GenericUtils");

            var userId = ""
                    if(nodeState.get("UserId")){
                    userId = nodeState.get("UserId");
                    } else if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                    } 
                    var eventDetails = {
                        emailAddress : nodeState.get("mail") || ""
                        };
                    
                    var sessionDetails = null
        
            // if (requestParameters.get("context") && requestParameters.get("userPrereqId")){
               if (nodeState.get("context") && nodeState.get("userPrereqId")){
                    // if(requestParameters.get("context")[0] === "loginPrereq" && requestParameters.get("userPrereqId")[0]){
                    if(nodeState.get("context") === "loginPrereq" && nodeState.get("userPrereqId")!== null){
                    if(nodeState.get("prereqtype") === "manageprofile"){
                    // var userPrereqId = requestParameters.get("userPrereqId")[0];
                    var userPrereqId = nodeState.get("userPrereqId")
                    var preRequisiteId = nodeState.get("preRequisiteId")
                    var requestedUserAccountId = nodeState.get("UserId")
                    logger.debug("userPrereqId :: "+ userPrereqId)
                    logger.debug("preRequisiteId :: "+ preRequisiteId)
                    logger.debug("requestedUserAccountId :: "+ requestedUserAccountId)
                    var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                     logger.debug("isPatched :: "+ JSON.stringify(isPatched))
                        if(isPatched.length>0){
                        //auditLib.auditLogger("PRO006",sessionDetails,"Organ Donor Registration", eventDetails, userId, userId, transactionid)
                      //  auditLog("PRO006", "Organ Donor Registration");
                        action.goTo("loginPrereq");
                        }
                        else{
                           // auditLog("PRO007", "Organ Donor Registration Failure");
                             action.goTo("false");
                        }
                    
                        
                    }
                    else if(nodeState.get("prereqtype") === "organdonor"){
                    // var userPrereqId = requestParameters.get("userPrereqId")[0];
                    var userPrereqId = nodeState.get("userPrereqId")
                    var preRequisiteId = nodeState.get("preRequisiteId")
                    var requestedUserAccountId = nodeState.get("UserId")
                    logger.debug("userPrereqId :: "+ userPrereqId)
                    logger.debug("preRequisiteId :: "+ preRequisiteId)
                    logger.debug("requestedUserAccountId :: "+ requestedUserAccountId)
                    var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                     logger.debug("isPatched :: "+ JSON.stringify(isPatched))
                        if(isPatched.length>0){
                        //auditLib.auditLogger("PRO006",sessionDetails,"Organ Donor Registration", eventDetails, userId, userId, transactionid)
                        //auditLog("PRO006", "Organ Donor Registration");
                        action.goTo("loginPrereq");
                        }
                        else{
                           // auditLib.auditLogger("PRO007",sessionDetails,"Organ Donor Registration Failure", eventDetails, userId, userId, transactionid)
                            // auditLog("PRO007", "Organ Donor Registration Failure");
                             action.goTo("false");
                        }
                        
                    }
                    else{
                    // var userPrereqId = requestParameters.get("userPrereqId")[0];
                    var userPrereqId = nodeState.get("userPrereqId")
                    var preRequisiteId = nodeState.get("preRequisiteId")
                    var requestedUserAccountId = nodeState.get("UserId")
                    logger.debug("userPrereqId :: "+ userPrereqId)
                    logger.debug("preRequisiteId :: "+ preRequisiteId)
                    logger.debug("requestedUserAccountId :: "+ requestedUserAccountId)
                    var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                     logger.debug("isPatched :: "+ JSON.stringify(isPatched))
                        if(isPatched.length>0){
                       // auditLib.auditLogger("PRO006",sessionDetails,"Organ Donor Registration", eventDetails, userId, userId, transactionid)
                       // auditLog("PRO006", "Organ Donor Registration");
                        action.goTo("true");
                        }
                        else{
                           // auditLib.auditLogger("PRO007",sessionDetails,"Organ Donor Registration Failure", eventDetails, userId, userId, transactionid)
                              //auditLog("PRO007", "Organ Donor Registration Failure");
                             //action.goTo("false");
                            action.goTo("true");
                        }
                        
                    }
                    // var userPrereqId = requestParameters.get("userPrereqId")[0];
                    // var preRequisiteId = nodeState.get("preRequisiteId")
                    // var requestedUserAccountId = nodeState.get("UserId")
                    // var isPatched = patchPreReq.patchPreReq(preRequisiteId, requestedUserAccountId);
                    // if(isPatched.length>0){
                    //     action.goTo("loginPrereq");
                    // }else{
                    //     action.goTo("false");
                    // }
                }
                  //action.goTo("true");
            }else{
               // auditLog("PRO006", "Organ Donor Registration");
                //auditLib.auditLogger("PRO006",sessionDetails,"Organ Donor Registration", eventDetails, userId, userId, transactionid)
                action.goTo("true");
            }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.RIDP.Patch.Context script:: " + error);
    }
}


function auditLog(code, message){
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
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                 helpdeskUserId = existingSession.get("UserId")
                }
                if(nodeState.get("_id")){
                   userId = nodeState.get("_id") || null;
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
}

main();

