var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var auditLib = require("KYID.2B1.Library.AuditLogger")

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Account Recovery Phone Authentication",
    script: "Script",
    scriptName: "kyid.2B1.Journey.AccountRecovery.FetchPrimaryEmailViaPhoneNumber",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: true
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};

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
    sessionDetails = {
        "sessionRefId": ""
    }
}

var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
// Main Execution
main();


function fecthPrimaryEmail() {
    var querResult = null;
    nodeState.putShared("PrimaryEmailFlag", false);

    if (nodeState.get("telephoneNumber")) {

        var telephoneNumber = nodeState.get("telephoneNumber");
        var emailList = [];
        var queryFilter = 'MFAMethod eq "SMSVOICE" and MFAValue eq "' + telephoneNumber + '"';

        var querKOGIdResult = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": queryFilter,
            "_fields": "KOGId"
        });

        logger.debug("querKOGIdResult:" + querKOGIdResult.result);


        if (querKOGIdResult && querKOGIdResult.result && querKOGIdResult.result.length > 0) {
            //logger.error("Inside_second_query");
            nodeState.putShared("PrimaryEmailFlag", true);
            for (var i = 0; i < querKOGIdResult.result.length; i++) {

                var queryEmailResult = openidm.query("managed/alpha_user", {
                    "_queryFilter": 'userName eq "' + querKOGIdResult.result[i].KOGId + '"',
                    "_fields": "mail"
                });
                logger.debug("queryEmailResult:" + queryEmailResult.result);

                if (queryEmailResult.result.length === 0) {
                    logger.debug("queryEmailResult is empty, skipping value retrieval.");
                } else {
                    emailList.push(queryEmailResult.result[0].mail)

                }

            }
            if (emailList.length === 1) {
                userEmail = emailList[0];
                var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
                userId = userQueryResult.result[0]._id;
                auditLib.auditLogger("ACR001", sessionDetails, "Primary Email Address Recovery", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
            } 
            if (emailList.length > 0) {
                nodeState.putShared("ListOfPrimaryEmails", emailList);
               // auditLib.auditLogger("ACR001", sessionDetails, "Primary Email Address Recovery", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId)
            } else {
                nodeState.putShared("PrimaryEmailFlag", false);
                nodeState.putShared("ListOfPrimaryEmails", null);
                auditLib.auditLogger("ACR002", sessionDetails, "Account Recovery Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
            }

        }
        logger.debug("ListOfPrimaryEmails:" + JSON.stringify(emailList));


        for (var i = 0; i < emailList.length; i++) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "List_of_PrimaryEmails:" + emailList[i]);
        }

    }



    /*var telephoneNumber=nodeState.get("telephoneNumber");
    
        // query idm to fetch the list of all the primary emails
        querResult= openidm.query("managed/alpha_user",{
        "_queryFilter":'telephoneNumber eq "'+telephoneNumber+'"',
        "_fields": "mail"
        });
    }
    

    var emailList=[]; 
    
    if(querResult && querResult.result && querResult.result.length>0){
    nodeState.putShared("PrimaryEmailFlag",true);
    for (var i=0; i< querResult.result.length; i++){
        var user = querResult.result[i];
        if(user.mail){
            emailList.push(user.mail);
            logger.error(user.mail);
        }
     }
    nodeState.putShared("ListOfPrimaryEmails",emailList);
        
    for (var i=0; i< emailList.length; i++){
    nodeLogger.info(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "List_of_PrimaryEmails:" +emailList[i] );
     }
    }*/
    else {
        nodeLogger.info(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "No Primary Email associated with the provided alt email");
        auditLib.auditLogger("ACR002", sessionDetails, "Account Recovery Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        nodeState.putShared("PrimaryEmailFlag", false);
    }
    action.goTo(NodeOutcome.TRUE);
}


function main() {

    try {
        fecthPrimaryEmail();
        action.goTo(NodeOutcome.TRUE);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution" + error);
        auditLib.auditLogger("ACR002", sessionDetails, "Account Recovery Failure", eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
        action.goTo(NodeOutcome.TRUE);

    }

}