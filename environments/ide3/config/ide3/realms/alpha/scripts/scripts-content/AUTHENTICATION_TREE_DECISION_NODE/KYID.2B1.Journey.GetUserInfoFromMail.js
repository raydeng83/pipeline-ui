var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Verify User in Ping",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetUserInfoFromMail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    FOUND: "User Found",
    NOT_FOUND: "User Not Found",
    ERROR: "Error"
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

function queryUserByMail(mail) {
    try {
        logger.debug("mail in Get User Script" + mail);
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + mail + '"'
        }, ["_id", "userName", "mail", "frIndexedString2", "frIndexedString1", "accountStatus", "custom_selfEnrollMFA", "frUnindexedString1","custom_userIdentity/*"]);
        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            if(userQueryResult.result[0].custom_userIdentity && userQueryResult.result[0].custom_userIdentity.languagePreference){
                nodeState.putShared("languagePreference", userQueryResult.result[0].custom_userIdentity.languagePreference)
            }else{
                nodeState.putShared("languagePreference", "1")
            }

            if(userQueryResult.result[0].custom_userIdentity && userQueryResult.result[0].custom_userIdentity.riskIndicatorDetails){
                nodeState.putShared("exisitingRiskIndicatorDetails", JSON.stringify(userQueryResult.result[0].custom_userIdentity.riskIndicatorDetails))
            }

            if(userQueryResult.result[0].custom_userIdentity && userQueryResult.result[0].custom_userIdentity.highRiskOverrideDate){
                nodeState.putShared("exisitingHighRiskOverrideDate", userQueryResult.result[0].custom_userIdentity.highRiskOverrideDate)
            }
            
            if(userQueryResult.result[0].custom_userIdentity && userQueryResult.result[0].custom_userIdentity.riskIndicator){
                nodeState.putShared("exisitingRiskIndicator", userQueryResult.result[0].custom_userIdentity.riskIndicator)
            }

            logger.debug("userQueryResult")
            if(userQueryResult.result[0].accountStatus && userQueryResult.result[0].accountStatus.toLowerCase() === "active"){
                nodeState.putShared("accountStatus","active")
            }else if(userQueryResult.result[0].accountStatus && userQueryResult.result[0].accountStatus.toLowerCase() === "terminated"){
                nodeState.putShared("accountStatus","terminated")
            }else{
                nodeState.putShared("accountStatus","inactive")
            }
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for mail: " + mail);
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by mail: " + error.message);
        return null;
    }
}

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
                var sessionDetail = null;
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
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
    }catch(error){
        logger.error("Failed to log MFA method removal "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

// Main execution
try {
    var mail = nodeState.get("mail");
    logger.debug("the mail in KYID.2B1.Journey.GetUserInfoFromMail" + mail);
    if (mail) {
        var user = queryUserByMail(mail);
        if (user && user._id) {
            nodeState.putShared("_id", user._id);
            nodeState.putShared("userId", user._id);
            nodeState.putShared("mail", user.mail);
            nodeState.putShared("EmailAddress", user.mail);
            nodeState.putShared("searchAttribute", "mail");

            nodeState.putShared("audit_KOGID", user.userName)
            nodeState.putShared("audit_LOGON", user.frIndexedString2)
            nodeState.putShared("audit_ID", user._id)
            if (user.frIndexedString1) {
                nodeState.putShared("UPN", user.frIndexedString1)
            }

            if (user.frIndexedString2 && user.frIndexedString2.indexOf("@") !== -1) {
                var Logon = user.frIndexedString2;
                var domain = Logon.split("@");
                if (domain.length > 1) {
                    var domainParts = domain[1].split(".");
                    if (domainParts.length > 0) {
                        var prefix = domainParts[0];
                        nodeState.putShared("domain", domain[1]);
                    }
                }
            }

            if (user.frUnindexedString1) {
                logger.debug("the frUnindexedString1"+user.frUnindexedString1)
               nodeState.putShared("usrtype", user.frUnindexedString1)
            }

            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Session valid for user " + user.mail);
            action.goTo(NodeOutcome.FOUND);
        } else {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data is incomplete or user not found.");
            auditLog("LOG004", "Invalid User");
            action.goTo(NodeOutcome.NOT_FOUND);

        }
    } else {
        action.goTo(NodeOutcome.ERROR);
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " An error occurred: " + error.message);
    action.goTo(NodeOutcome.ERROR);
}