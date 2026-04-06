var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "AddRemoveAlternateEmail",
    script: "Script",
    scriptName: "KYID.2B1.Journey.AddRemoveAlternateEmailSIHAPI",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke API as required parameters are missing.",
    apiRequest_isAuthorized: "KOG_isAuthorized",
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
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};


// Declare Global Variables
var missingInputs = [];


logger.debug("#### start script")
nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: script started ");
try {

    //RequestorKOGID
    var kogID;
    if (nodeState.get("KOGID") != null) {
        kogID = nodeState.get("KOGID");
    } else {
        missingInputs.push("kogID");
    }

    // verifiedPrimaryEmail
    var alternateEmailAddress;
    if (nodeState.get("emailId") != null) {
        alternateEmailAddress = nodeState.get("emailId");
    } else {
        missingInputs.push("emailId");
    }

    // verifiedPrimaryEmail
    var actionFlag;
    if (nodeState.get("actionFlag") != null) {
        var actionFlag = nodeState.get("actionFlag");
    } else {
        missingInputs.push("actionFlag");
    }

    // Transaction ID
    // var transactionID;
    // if (requestHeaders.get("x-forgerock-transactionid") != null) {
    //     var tempTransactionID = requestHeaders.get("x-forgerock-transactionid")[0];
    //     transactionID = tempTransactionID.substring(0, 36);
    // } else {
    //     missingInputs.push("transactionID");
    // }

    var addRemoveAlternateEmailAPIURL;
    if (systemEnv.getProperty("esv.kyid.kogapi.addremovealternateemail") && systemEnv.getProperty("esv.kyid.kogapi.addremovealternateemail") != null) {
        addRemoveAlternateEmailAPIURL = systemEnv.getProperty("esv.kyid.kogapi.addremovealternateemail");
    } else {
        missingInputs.push("addRemoveAlternateEmailAPIURL");
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

    var addRemoveAlternateEmailScope;
    if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile") != null) {
        addRemoveAlternateEmailScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.updateuserprofile");
    } else {
        missingInputs.push("addRemoveAlternateEmailScope");
    }

    if (missingInputs.length > 0) {
        logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);

        action.goTo(nodeOutcome.ERROR);
    } else {
        transactionID = generateGUID();
        var payload = {
            KOGID: kogID,
            AlternateEmailAddress: alternateEmailAddress,
            ActionFlag: actionFlag,
            TransactionID: transactionID,
            RequestorKOGID: kogID

        };

        logger.debug("Payload prepared: " + JSON.stringify(payload));

        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        logger.debug("ran the access token lib script for email" + alternateEmailAddress)
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, addRemoveAlternateEmailScope);
        nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse) + "for email" + alternateEmailAddress);

        if (kogAPITokenResponse.status === 200) {
            logger.debug("access token status is 200" + kogAPITokenResponse + "for email" + alternateEmailAddress)
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

            var startTime = new Date();
            var res = httpClient.send(addRemoveAlternateEmailAPIURL, requestOptions).get();
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.debug("KYID.2B1.Journey.AddRemoveAlternateEmailSIHAPI call duration in seconds : " + durationInSeconds );
            logger.debug("response status of user email update in KOG AD " + res.status);

            logger.debug("response of user email in KOG AD " + JSON.stringify(JSON.parse(res.text())));

            action.withHeader(`Response code: ${res.status}`);


            if (res.status === 200) {
                var data = JSON.parse(res.text());
                if (data.ResponseStatus === 0 && data.TransactionID) {
                    var fetchedTransactionID = data.TransactionID;

                    logger.debug("the successful transcation id  is " + fetchedTransactionID);
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Alternate email removed/added sucessfully ::Email::" + alternateEmailAddress);
                    action.goTo(nodeOutcome.SUCCESS);

                } else {
                    // ResponseStatus not 0, error details present
                    var msg = data.MessageResponses && data.MessageResponses.length > 0 ?
                        data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ") :
                        "Unknown error";
                    logger.debug("API returned an error ResponseStatus=" + data.ResponseStatus + " Details: " + msg);
                    nodeState.putShared("apireturnederror", msg)
                    action.goTo(nodeOutcome.FAIL);
                }

            } else {
                logger.debug("Non-200 HTTP response: " + res.status);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: HTTP response ::" + res.status + "::Email::" + alternateEmailAddress);
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            logger.debug("kogAPITokenResponse is not 200 ");
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogAPITokenResponse is not 200 :: Email ::" + alternateEmailAddress);
            action.goTo(nodeOutcome.FAIL);
        }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::Exception::" + error + "::Email::" + alternateEmailAddress);
    action.goTo(nodeOutcome.ERROR);
}

//Generate unique GUID.
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}