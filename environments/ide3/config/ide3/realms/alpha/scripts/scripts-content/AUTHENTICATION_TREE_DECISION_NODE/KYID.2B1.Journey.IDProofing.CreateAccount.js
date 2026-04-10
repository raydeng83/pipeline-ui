var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: CreateAccount",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.CreateAccount",
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
    var usrKOGID = null;
    var mail = null;
    var searchAccountArray = null;
    var highRiskAccountArray = null
    var associatedAccounts = [];
    var noRiskAccountArray = [];
    var parameters = {};
    var user = null;
    var userInfo = null;
    var response = null
    var title = null;
    var reason = null;
    var highRisk = false;
    var emailsWithVerifiedLexID = [];
    
    try {
        verifiedLexId = nodeState.get("verifiedLexId");
        flowName = "Create Account";
        riskIndicator = nodeState.get("riskIndicator");
        verificationStatus = nodeState.get("verificationStatus");
        userAttributes = nodeState.get("userAttributes");
        usrKOGID = nodeState.get("KOGID");
        userInfo = nodeState.get("userInfoJSON1")
        mail = nodeState.get("mail") || nodeState.get("EmailAddress") ||  nodeState.get("collectedPrimaryEmail");
        lexisnexisResponse = nodeState.get("lexisnexisResponse")
        response = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
        logger.error("response from query :: " + JSON.stringify(response))
        highRisk = response.result[0].ridp_create_account_high_risk;
        logger.debug("Create Account highRisk flag from query :: " + highRisk)
        nodeState.putShared("highRisk", highRisk)
        nodeState.putShared("highRiskFlag", highRisk)
        
        // if(riskIndicator && riskIndicator.toLowerCase() === "high" && highRisk && highRisk == true) {
         if(((nodeState.get("riskIndicator") && nodeState.get("riskIndicator").toLowerCase() === "high") || (nodeState.get("risk") && nodeState.get("risk").toLowerCase() === "high") || (nodeState.get("mailRisk") && nodeState.get("mailRisk").toLowerCase() === "high") || (nodeState.get("phoneRisk") && nodeState.get("phoneRisk").toLowerCase() === "high") || (nodeState.get("alternateEmailRisk") && nodeState.get("alternateEmailRisk").toLowerCase() === "high")) && (highRisk && highRisk == true)){
            // High Risk Transaction, Go to High Risk Node
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-000: High Risk Transaction, Going to High Risk Node");
            reason = "The LexisNexis response contains high risk indicators";
            title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
            auditLog("KYID-LN-000", "Create Account - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            nodeState.putShared("errorMessage","KYID-LN-000")
            nodeState.putShared("MCISync","true")
            action.goTo("highRisk");
        }else if((riskIndicator.toLowerCase() === "moderate" || riskIndicator.toLowerCase() === "low" || riskIndicator.toLowerCase() === "norisk" || !highRisk) && (verificationStatus.toLowerCase() === "fullyverified" || verificationStatus.toLowerCase() === "partiallyverified") && (verifiedLexId!==null && verifiedLexId!=="")){ 
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "Risk Indicator is Moderate/Low/noRisk and Verification Status is Fully/Partially Verified ");
            // Search Ping Identity for Accounts with verifiedLexId
            searchAccountArray = lib.queryPingByLexiID(verifiedLexId, nodeConfig, transactionid);
            logger.error("searchAccountArray in KYID.2B1.Journey.IDProofing.CreateAccount :: " + JSON.stringify(searchAccountArray))
            if(searchAccountArray.length > 0){
                highRiskAccountArray = lib.isHighRiskAccount(searchAccountArray, nodeConfig, transactionid);
                // Check for High Risk Accounts
                if(highRiskAccountArray.length > 0){
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName  + "::" + "High Risk Account Found in Ping Identity when querying with verifiedLexId");
                    reason = "The LexID associated account(s) in Ping Identity is marked as High Risk.";
                    title = "User identity verification transaction failed due to a high risk transaction has been detected while verifying user's identity.";
                    auditLog("KYID-LN-000", "Create Account - High Risk Transaction", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    nodeState.putShared("errorMessage","KYID-LN-000")
                    action.goTo("highRiskMCIDelete");
                }else if(highRiskAccountArray.error && highRiskAccountArray.error !== null){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "Error while checking high risk accounts in Ping Identity: " + highRiskAccountArray.error);
                    action.goTo("error");
                }else{
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No High Risk Account Found in Ping Identity, Proceeding Further for active or suspended account check");
                    nodeLogger.error("searchAccountArray is :: "+ JSON.stringify(searchAccountArray))
                    // Check for Active or Suspended Accounts
                    searchAccountArray.forEach(value => {
                        if(value.accountStatus.toLowerCase() === "active" || value.accountStatus.toLowerCase() === "suspended"){
                            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Active or Suspended Account Found in Ping Identity " + value.mail);
                            associatedAccounts.push(value.mail);
                        }else{
                            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Risk Account Found in Ping Identity " + value.mail);
                            noRiskAccountArray.push(value.mail);
                        }
                        emailsWithVerifiedLexID.push(searchAccountArray.mail);
                    });

                    nodeState.putShared("emailsWithVerifiedLexID",JSON.stringify(emailsWithVerifiedLexID));
                    // Decision Making based if associated Accounts found or not
                    if(associatedAccounts.length > 0){
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "KYID-LN-003 - User already has active account(s): " + associatedAccounts.toString());
                        nodeState.putShared("associatedAccounts", associatedAccounts);
                        reason ="The following active account(s) has been identified for the input and personal information provided." + JSON.stringify(associatedAccounts);
                        title = "One or more active account(s) are identified for the input and personal information provided."
                        auditLog("KYID-LN-003", "Create Account - User already has active account(s)", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                        nodeState.putShared("MCISync","true")
                        nodeState.putShared("errorMessage","KYID-LN-002")
                        action.goTo("associatedAccounts");
                    }else if(noRiskAccountArray.length > 0){
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Associated Active/Suspended Accounts Found, but No Risk Accounts Found: " + noRiskAccountArray.toString());
                        //auditLog("RIDP003", "No Risk Accounts found in Ping Identity , proceeding to create account", true);
                        nodeState.putShared("MCISync","true")
                        action.goTo("noRiskCreateAccount");
                    }else{
                        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Associated Accounts Found in Ping Identity, Proceeding to Create Account");
                        //auditLog("RIDP003", "No Associated Accounts found in Ping Identity, proceeding to create account", true);
                        nodeState.putShared("MCISync","true")
                        action.goTo("createAccount");
                    } 
                }
            }else if(searchAccountArray.error && searchAccountArray.error !== null){
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error while searching accounts in Ping Identity: " + searchAccountArray.error);
                action.goTo("verifiedMCISearch");
            }else{
                // No Accounts Found with verifiedLexId, Proceed to MCI Search
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No High Risk Account Found in Ping Identity, Proceeding Further for MCI Search");
                reason = "KYID or LexID does not match with the response provided LexisNexis LexID";
                title = "User identity verification transaction failed as there is no identity present within the KYID platform based on the verified information provided"
                auditLog("KYID-LN-004", "Create Account - Not able to find the individual based on verified information", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                nodeState.putShared("MCISync","true")
                action.goTo("verifiedMCISearch");
            }
        }else{
            // not verified account, Proceed to MCI Search
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Verification Status is not_verified");
            nodeState.putShared("verifiedLexId", null);
            // var reason = "The user personal information provided to LexisNexis is NOT verified";
            // title = "User identity verification transaction failed as identity information couldn’t be verified with LexisNexis."
            // auditLog("KYID-LN-005", "Create Account - Individual is not verified", true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
            nodeState.putShared("MCISync","false")
            action.goTo("notVerifiedMCISearch");
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "Error in Main Execution "+ error);
        action.goTo("error");
    }
}

main();


// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title) {
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
        //eventDetails["transactionid"] = transactionid || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || "";
        
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || nodeState.get("collectedPrimaryEmail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        logger.error("sessionRefId in KYID.2B1.Journey.IDProofing.CreateAccount " + nodeState.get("sessionRefId"))
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
        var helpdeskVisibility = helpdeskVisibility || false;
        
        // if (userEmail) {
        //     var userQueryResult = openidm.query("managed/alpha_user", {
        //         _queryFilter: 'mail eq "' + userEmail + '"'
        //     }, ["_id"]);
        //     userId = userQueryResult.result[0]._id ;
        // }
        
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}