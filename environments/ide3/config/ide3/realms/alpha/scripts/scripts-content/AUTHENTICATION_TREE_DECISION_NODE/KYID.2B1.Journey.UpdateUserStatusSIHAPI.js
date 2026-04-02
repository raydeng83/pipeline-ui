var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UpdateUserStatusSIHAPI",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UpdateUserStatusSIHAPI",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke API as required parameters are missing.",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful",
    FAIL: "Failed",
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


function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
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
        var userEmail = nodeState.get("mail") || "";
        if (typeof existingSession != 'undefined') {
            userId = existingSession.get("UserId")
        } else if (nodeState.get("_id")) {
            userId = nodeState.get("_id")
        }
        auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log update status information updated" + error)
        action.goTo(nodeOutcome.SUCCESS);
    }

}


// Declare Global Variables
var missingInputs = [];
var updateUserPrimaryEmailAPI = null

nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: script started ");
try {
    if (nodeState.get("KOGID") != null) {
        kogID = nodeState.get("KOGID");
    } else {
        missingInputs.push("kogID");
    }

    // Transaction ID
    var transactionID = generateGUID();
    var updateUserStatusAPIURL = null;
    
    if (systemEnv.getProperty("esv.kyid.usr.updateuserstatus") && systemEnv.getProperty("esv.kyid.usr.updateuserstatus") != null) {
        updateUserStatusAPIURL = systemEnv.getProperty("esv.kyid.usr.updateuserstatus");
    } else {
        missingInputs.push("updateUserStatusAPIURL");
    }

    if (systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail") && systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail") != null) {
        updateUserPrimaryEmailAPI = systemEnv.getProperty("esv.kyid.kogapi.updateprimaryemail");
    } else {
        missingInputs.push("updateUserPrimaryEmailAPI");
    }

    var sihcertforapi;
    if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
        sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
    } else {
        missingInputs.push("sihcertforapi");
    }

    var kogTokenApi;
    if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
        kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
        missingInputs.push("kogTokenApi");
    }

    var updateUserProfileScope;
    if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") != null) {
        updateUserProfileScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile");
        logger.debug("profile scope" + updateUserProfileScope);
    } else {
        missingInputs.push("updateUserProfileScope");
    }


    if (missingInputs.length > 0) {
        logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
        action.goTo(nodeOutcome.ERROR);
    } else {
        var payload = {}
        var userStatusValue = "3";
        var terminationDate = new Date();
        terminationDate = getCurrentEasternTimeFormatted();
        logger.debug("termination Date" +terminationDate);
        var payload = {
            KOGID: kogID,
            TransactionID: transactionID,
            UserStatus: userStatusValue,
            TerminationReason: "Client requested account termination on Self Service Portal",
            TerminationDate: terminationDate,
            RequestorKOGID: kogID
        }

        logger.debug("Payload to terminate user account is :: => "+ JSON.stringify(payload))
        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, updateUserProfileScope);
        logger.debug("kogAPITokenResponse value => "+JSON.stringify(kogAPITokenResponse))
        logger.debug("kogAPITokenResponse: " + JSON.stringify(kogAPITokenResponse) + "for KYID" + kogID);

        if (kogAPITokenResponse.status === 200) {
            logger.debug("access token status is 200" + kogAPITokenResponse + "for KYID" + kogID)
            var bearerToken = kogAPITokenResponse.response;
            var requestOptions = {
                "clientName": sihcertforapi,
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "token": bearerToken,
                "body": payload
            };

            logger.debug("calling the update user status API" + updateUserStatusAPIURL);
            var startTime = new Date();
            var res = httpClient.send(updateUserStatusAPIURL, requestOptions).get();
            logger.debug("result of the updatestatus API" + JSON.stringify(res));
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.debug("KYID.2B1.Journey.UpdateUser status SIH API call duration in seconds : " + durationInSeconds);
            logger.debug("response of user email in KOG AD " + JSON.stringify(JSON.parse(res.text())));
            action.withHeader(`Response code: ${res.status}`);
            
            if (res.status === 200) {
                var data = JSON.parse(res.text());
                if (data.ResponseStatus === 0 && data.TransactionID) {
                    var fetchedTransactionID = data.TransactionID;
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::user status update in KOG successful::KYID::" + kogID);
                    var kogAPIResponse = invokeUsrEmailUpdateKOGAPI(kogID,updateUserPrimaryEmailAPI,sihcertforapi,bearerToken,fetchedTransactionID);
                    logger.debug("kogAPIResponse after invokeUsrEmailUpdateKOGAPI =>"+JSON.stringify(kogAPIResponse))
                    auditLog("ACM001", "Account Termination Success");
                    if(kogAPIResponse!=null && kogAPIResponse.ResponseStatus==0){
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Terminated user primary email update in KOG successful::KYID::" + kogID);
                        auditLog("ACM003", "Terminated KOG Account Email Update Success");
                        action.goTo(nodeOutcome.SUCCESS);
                    } else {
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Terminated user primary email update in KOG fail::KYID::" + kogID);
                        auditLog("ACM004", "Terminated KOG Account Email Update Failure");
                        action.goTo(nodeOutcome.ERROR);
                    }
                    
                } else {
                    // ResponseStatus not 0, error details present
                    var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                        data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                        "Unknown error";
                    logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                    nodeState.putShared("apireturnederror", msg)
                    auditLog("ACM002", "Account Termination Failure");
                    action.goTo(nodeOutcome.ERROR);
                }

            } else {
                logger.debug("Non-200 HTTP response: " + res.status);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::KYID::" + kogID);
                auditLog("ACM002", "Account Termination Failure");
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            logger.debug("kogAPITokenResponse is not 200 ");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: KYID ::" + kogID);
            auditLog("ACM002", "Account Termination Failure");
            action.goTo(nodeOutcome.FAIL);
        }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
    auditLog("ACM002", "Account Termination Failure");
    action.goTo(nodeOutcome.ERROR);
}


/**
 * Invoke KOG UpdatePrimaryEmail API
 */
function invokeUsrEmailUpdateKOGAPI(kogID,updateUserPrimaryEmailAPI,sihcertforapi,bearerToken,txID){
    var emailNew = null
    var res = null

    if(kogID==null || updateUserPrimaryEmailAPI==null || sihcertforapi==null || bearerToken==null || txID==null){
        logger.debug("Missing mandatory Params for invokeUsrEmailUpdateKOGAPI()")
        return res
    }
    
    if(nodeState.get("newEmailKOG")!=null && nodeState.get("newEmailKOG")){
        logger.debug("newEmailKOG in KYID.2B1.Journey.UpdateUserStatusSIHAPI => "+nodeState.get("newEmailKOG"))
        emailNew = nodeState.get("newEmailKOG")
    } else {
        return res
    }
    
    var requestOptions = {
        "clientName": sihcertforapi,
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "token": bearerToken,
        "body": {
            "KOGID": kogID,
            "EmailAddress": emailNew,
            "TransactionID": txID,
            "RequestorKOGID": kogID
        }
    };

    logger.debug("requestOptions in invokeUsrEmailUpdateKOGAPI() =>"+JSON.stringify(requestOptions))
     
    if(updateUserPrimaryEmailAPI!=null && requestOptions!=null){
        try{
            res = httpClient.send(updateUserPrimaryEmailAPI, requestOptions).get();
            logger.debug("Result of the updateUserPrimaryEmail API =>" + res.text());
            return JSON.parse(res.text())
        } catch(error){
             nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::KYID::" + kogID);
             return res;
        }
    } else {
        return res;
    }
}



/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getAdjustedCurrentUTC() {
    var now = new Date(); // Current time
    now.setSeconds(now.getSeconds() - 50); // Subtract seconds
    return now;
}


function getCurrentEasternTimeFormatted() {
    const now = new Date();

    // Get current year
    const year = now.getUTCFullYear();

    // Calculate DST start: Second Sunday in March at 2am local (7am UTC)
    const march = new Date(Date.UTC(year, 2, 1));
    const marchDay = (7 - march.getUTCDay() + 7) % 7 + 7; // 2nd Sunday
    const dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0)); // 7am UTC

    // Calculate DST end: First Sunday in November at 2am local (6am UTC)
    const november = new Date(Date.UTC(year, 10, 1));
    const novDay = (7 - november.getUTCDay()) % 7; // 1st Sunday
    const dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0)); // 6am UTC

    // Determine if now is in DST
    var offset;
    if (now >= dstStart && now < dstEnd) {
        offset = -4; // EDT
    } else {
        offset = -5; // EST
    }

    // Convert UTC to Eastern time
    const easternDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours() + offset,
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
    ));

        easternDate.setUTCSeconds(easternDate.getUTCSeconds() - 50);
    // Format components
    const formatted = [
        easternDate.getUTCFullYear(),
        String(easternDate.getUTCMonth() + 1).padStart(2, '0'),
        String(easternDate.getUTCDate()).padStart(2, '0')
    ].join('-') + ' ' +
    [
        String(easternDate.getUTCHours()).padStart(2, '0'),
        String(easternDate.getUTCMinutes()).padStart(2, '0'),
        String(easternDate.getUTCSeconds()).padStart(2, '0')
    ].join(':') + '.' +
    String(easternDate.getUTCMilliseconds()).padStart(3, '0');

    return formatted;
}