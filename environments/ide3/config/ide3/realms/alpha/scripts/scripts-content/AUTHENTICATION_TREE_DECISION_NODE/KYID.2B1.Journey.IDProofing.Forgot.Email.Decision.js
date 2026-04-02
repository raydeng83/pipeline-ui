var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Forgot Email Decision",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Forgot.Email.Decision",
    timestamp: dateTime,
    end: "Node Execution Completed"
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
}

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    var lib = require("KYID.2B1.Library.RIDP.Generic.Utils")
    var verifiedLexId = null;
    var flowName = null;
    var riskIndicator = null;
    var verificationStatus = null;
    var userAttributes = null;
    var searchUserWithLexID = [];
    var emailsWithVerifiedLexID = [];
    try {
        verifiedLexId = nodeState.get("verifiedLexId");
        flowName = nodeState.get("flowName");
        riskIndicator = nodeState.get("riskIndicator");
        verificationStatus = nodeState.get("verificationStatus");
        userAttributes = nodeState.get("userAttributes");


        if(riskIndicator && riskIndicator.toLowerCase() === "high") {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            //auditLog("KYID-LN-000", "Forgot Email - High Risk Transaction");
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-000")
            action.goTo("highRisk");
        }else if(verificationStatus.toLowerCase() == "notverified"){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-005: Verification Status is Not Verified, Going to Not Verified Node");
            //auditLog("KYID-LN-005", "Forgot Email - - Verification Status is Not Verified");
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-005")
            action.goTo("notVerified");
        }else if(nodeState.get("kbaVerificationStatus") === "failed"){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-005: KBA Verification Failed");
            //auditLog("KYID-LN-005", "Forgot Email - - Verification Status is Not Verified");
            nodeState.putShared("verifiedLexId","")
            nodeState.putShared("proofingMethod","-1")
            nodeState.putShared("verificationStatus","notverified")
            nodeState.putShared("MCISYNC","false")
            nodeState.putShared("errorMessage","KYID-LN-005")
            action.goTo("kbaFailed");
        }else if((riskIndicator.toLowerCase() === "moderate" || riskIndicator.toLowerCase() === "low" || riskIndicator.toLowerCase() === "norisk") && (verificationStatus.toLowerCase() === "fullyverified" || verificationStatus.toLowerCase() === "partiallyverified") && (verifiedLexId!==null && verifiedLexId!=="")){ 
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Risk Indicator is Moderate/Low/noRisk and Verification Status is Fully/Partially Verified ");
            searchUserWithLexID = lib.queryPingByLexiID(verifiedLexId, nodeConfig, transactionid);
            isHighRisk = lib.isHighRiskAccount(searchUserWithLexID, nodeConfig, transactionid);

            if(isHighRisk && isHighRisk.length > 0){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "KYID-LN-000: High Risk Account found in Ping for verified LexID, Going to soft delete MCI Node");
                reason = "The LexID associated account(s) in Ping Identity is marked as High Risk";
                title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity"
                // auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                // auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null);
                nodeState.putShared("errorMessage","KYID-LN-000")
                action.goTo("highRisk");
            }else{
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "No High Risk/Terminated accounts found in Ping for verified LexID "+ verifiedLexId );
                searchUserWithLexID.forEach(searchUserWithLexIDMail => {
                    if(searchUserWithLexIDMail.mail){
                        //nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName   + ":: " + " matches with "+ searchUserWithLexIDMail.mail + "::" + "Going to check user is active or not Node");
                        if(searchUserWithLexIDMail.accountStatus.toLowerCase() === "active"){
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Account is Active with lexId " + ":: " + " Going to lexMatchUpdateProfile Node");
                            emailsWithVerifiedLexID.push(searchUserWithLexIDMail.mail);
                        }else{
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Input is associated with terminated/suspended account for user " + searchUserWithLexIDMail.mail + ":: " + " Going to error Node");                                        
                            //noLexTerminatedUserFoundInPing.push(searchUserWithLexIDMail.mail)
                            //action.goTo("noLexTerminatedUserFoundInPing");
                        }
                    }else{
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "when searched with lexID found an account with no mail id" );
                        //InputUserNoMatchWSearchUser.push(searchUserWithLexIDMail.mail)
                        //action.goTo("InputUserNoMatchWSearchUser");
                    }
                });
            nodeState.putShared("emailsWithVerifiedLexID",JSON.stringify(emailsWithVerifiedLexID));
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Going to MCI Search Node");
            //auditLog("RIDP003", "KYID-LN-001: Forgot Email - Proceeding to MCI Search");
            action.goTo("mciSearch");
            }
        }else{
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Either Risk Indicator is Unknown or Verification Status is Unverified/Failed/Unknown or verifiedLexId is null/empty "+ "::" + " Going to Error Node");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "Error in Main Execution "+ error);
        action.goTo("error");
    }
}

main();


// Audit Log Function
function auditLog(code, message) {
    try {
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
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
        }
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = false;
        if (userEmail) {
            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: 'mail eq "' + userEmail + '"'
            }, ["_id"]);
            userId = userQueryResult.result[0]._id;
        }
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}