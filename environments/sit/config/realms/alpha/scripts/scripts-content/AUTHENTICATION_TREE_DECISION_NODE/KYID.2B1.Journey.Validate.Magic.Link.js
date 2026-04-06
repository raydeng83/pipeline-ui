var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
//var auditLib = require("KYID.2B1.Library.AuditLogger")

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Collect Basic Information ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Validate.Magic.Link",
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
try {
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
    var sessionDetail = null

    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.Validate.Magic.Link script:: " + error);
}

var nodeLogger = {
    debug: function(message) {
        logger.debug(message);
    },
    error: function(message) {
        logger.error(message);
    },
    info: function(message) {
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

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log password reset initiation "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    var orig_id = null;
     var new_id = null;
    try {
        if (requestParameters.get("_id")) {
            logger.debug("new_id is => :: " + requestParameters.get("_id")[0])
            new_id = requestParameters.get("_id")[0];
            logger.debug("orig_id is => :: " + nodeState.get("_id"))
            if (nodeState.get("_id")) {
                orig_id = nodeState.get("_id")
            }
           //  new_id = "1234";
            if (new_id == orig_id) {
                //auditLib.auditLogger("PWD001", sessionDetail, "Password Reset Initiated", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetail)
                action.goTo("true")
            } else {
                //auditLib.auditLogger("PWD002", sessionDetails, "Password Reset Intitation Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetail)
                auditLog("PWD002", "Password Reset Intitation Failure");
                action.goTo("false")
            }
        }
    } catch (error) {
        //auditLib.auditLogger("PWD002", sessionDetails, "Password Reset Intitation Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetail)
        auditLog("PWD002", "Password Reset Intitation Failure");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.Validate.Magic.Link script:: " + error);
    }
}

main();