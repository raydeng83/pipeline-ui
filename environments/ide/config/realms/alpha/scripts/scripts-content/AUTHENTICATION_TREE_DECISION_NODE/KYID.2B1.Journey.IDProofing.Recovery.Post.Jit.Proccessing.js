var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Post JIT Processing",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Recovery.Post.Jit.Proccessing",
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

/// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    try {
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = nodeState.get("userInfoJSON");
    var jitStatus = nodeState.get("JITStatus");
    var jitArray = nodeState.get("jitArray");
    var lib = require("KYID.2B1.Library.RIDP.Generic.Utils");
    var verifiedLexId = nodeState.get("verifiedLexId");
    var loggedInUserId = nodeState.get("_id") || nodeState.get("UserId");
    var loggedInUsermail = nodeState.get("mail") || nodeState.get("EmailAddress");
    var loggedInUserKogId = nodeState.get("userName")
    var loggedInUserCustomId = nodeState.get("userIdentity")
    var usrKOGID = nodeState.get("KOGID");


    if(jitStatus.toLowerCase() === "completed"){
        if(jitArray.length>0){
            nodeLogger.debug("Length of MCIResponse" + jitArray.length)
            var searchUserInPingResponse = null;
            var searchUserInKOGResponse = null;
            var searchUserInKOGArray = []
            var searchEmailArray = []
            var isHighRisk = false;
            var associatedAccounts = []
            var associatedAccountKOGID = [];
            var searchKOG = false;
            var validUser = false;
            var isAccountActive = true;
            var terminatedArray = [];
            var jitArray = [];
            var pingAccounts = []
            var pingMailId = []
            var matchedWithLoggedUser = []
            var jitMailID = [];
            var lexIdMismatch = [];
            var inputNoMatch = [];
            var idNotFoundInPing =[]
            

            for (var i = 0; i < jitArray.length; i++) {
                nodeLogger.debug("For Loop Iteration: " + i)
                searchUserInPingResponse = lib.searchUserInPingResponse(jitArray[i], verifiedLexId);
                nodeLogger.debug("searchUserInPingResponse is --> "+searchUserInPingResponse)


                if(searchUserInPingResponse && searchUserInPingResponse.accountStatus && searchUserInPingResponse.accountStatus =="terminated" && searchUserInPingResponse.riskLevel && searchUserInPingResponse.riskLevel == "high" ){
                    auditLog("RIDP005", "KYID-LN-000: High Risk Transaction");
                    isHighRisk = true;
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-000: High Risk Transaction:: " +    jitArray[i]);
                    break;
                }else if(searchUserInPingResponse && searchUserInPingResponse._id && searchUserInPingResponse.mail && searchUserInPingResponse.accountStatus){
                    if(searchUserInPingResponse.mail.toLowerCase() == loggedInUsermail.toLowerCase() && searchUserInPingResponse.kogID == usrKOGID && searchUserInPingResponse._id == loggedInUserId){
                        if((searchUserInPingResponse.accountStatus =="active")){
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Exact Match Found with logged in user and user status is active in Ping Identity:: " + jitArray[i]);
                            auditLog("RIDP005", "KYID-LN-002 - Exact Match Found with logged in user in Ping Identity");
                                matchedWithLoggedUser.push(searchUserInPingResponse.mail)
                        }else{
                            auditLog("RIDP005", "KYID-LN-001 - Input is associated with terminated/susupended account");
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Input is associated with terminated/susupended account with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Input is associated with terminated/susupended account");
                        }
                    }else{
                        auditLog("RIDP005", "KYID-LN-001 - Input user account does NOT match with search result account/verified identity");
                        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Input user account does NOT match with search result account with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Inputuser account does NOT match with search result account");
                        inputNoMatch.push(searchUserInPingResponse.mail);
                    }
                }else if(searchUserInPingResponse && searchUserInPingResponse.error && searchUserInPingResponse.error === "lexid_mismatch" && searchUserInPingResponse._id){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID Mismatch Found in Ping Identity, Searching in KOG:: " + jitArray[i]);
                    lexIdMismatch.push(searchUserInPingResponse._id) 
                }else if(searchUserInPingResponse == null || !searchUserInPingResponse){  
                    // Record not found scenario in Ping Identity after JIT
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " No Record Found in Ping Identity with KOGID after JIT, going to error " + jitArray[i]);
                    idNotFoundInPing.push(jitArray[i]);
                }
            } 

            if(isHighRisk){
                nodeState.putShared("highRiskTransaction", true);
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to FARS");
                auditLog("RIDP005", "KYID-LN-000: High Risk Transaction");
                nodeState.putShared("errorMessage","KYID-LN-000")
                action.goTo("highRiskTransaction");
            }else if(idNotFoundInPing.length>0){
                nodeState.putShared("jitArray", jitArray);
                nodeState.putShared("pingAccounts",JSON.stringify(pingAccounts));
                nodeState.putShared("pingMailId",JSON.stringify(pingMailId))
                nodeState.putShared("jitMailID",JSON.stringify(jitMailID));     
                nodeState.putShared("searchEmailArray",JSON.stringify(associatedAccounts));
                nodeState.putShared("associatedAccountKOGID",JSON.stringify(associatedAccountKOGID));
                action.goTo("errorInPingSearch");
            }else if(matchedWithLoggedUser.length == 0 || inputNoMatch.length>0){
                // Account exist in ping does not match with logged in user error out
                auditLog("RIDP005", "KYID-LN-001 - Input NOT matching verified identity");
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " LexID not matched with logged in user with KOGID "+ usrKOGID + "::" + "KYID-LN-001 - Input NOT matching verified identity");                           
                nodeState.putShared("verifiedLexId","")
                nodeState.putShared("proofingMethod","-1")
                nodeState.putShared("MCISYNC","false")
                nodeState.putShared("errorMessage","KYID-LN-001")
                action.goTo("inputNotMatchingVerifiedIdentity");
            }else if(terminatedArray.length>0){
                nodeState.putShared("verifiedLexId","")
                nodeState.putShared("proofingMethod","-1")
                nodeState.putShared("MCISYNC","false")
                action.goTo("inputLink2TerminatedAccount")
            }else if(lexIdMismatch.length>0){
                auditLog("RIDP005", "KYID-LN-001 - Search result user identity does not match with verified identity");
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " KYID-LN-001 - Search result user identity does not match with verified identity");
                nodeState.putShared("errorMessage","KYID-LN-001")
                action.goTo("lexIdMismatch");
            }else if(matchedWithLoggedUser.length == 1){
                action.goTo("exactMatch");
            }
        }
    }

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error.message);
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
                