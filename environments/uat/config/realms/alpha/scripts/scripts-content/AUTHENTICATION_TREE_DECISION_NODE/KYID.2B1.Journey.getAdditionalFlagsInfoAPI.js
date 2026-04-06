var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "GetAdditionalFlagsInfo",
    script: "Script",
    scriptName: "KYID.2B1.Journey.getAdditionalFlagsInfoAPI",
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

    // Transaction ID
    var transactionID;
    if (requestHeaders.get("x-forgerock-transactionid") != null) {
        var tempTransactionID = requestHeaders.get("x-forgerock-transactionid")[0];
        transactionID = tempTransactionID.substring(0, 36);
    } else {
        missingInputs.push("transactionID");
    }

   // var getadditionalflagsinfoAPIURL = "https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/getadditionalflagsinfo" ;
    if (systemEnv.getProperty("esv.kyid.kogapi.getadditionalflagsinfoapiurl") && systemEnv.getProperty("esv.kyid.kogapi.getadditionalflagsinfoapiurl") != null) {
       var getadditionalflagsinfoAPIURL = systemEnv.getProperty("esv.kyid.kogapi.getadditionalflagsinfoapiurl");
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
    //if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
    if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
        kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
    } else {
        missingInputs.push("kogTokenApi");
    }

   // var getadditionalflagsinfoScope = "kogkyidapi.getadditionalflagsinfo";
    if (systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi") && systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi") != null) {
       var getadditionalflagsinfoScope = systemEnv.getProperty("esv.kyid.kogapi.token.scope.getadditionalflagsinfoapi");
        logger.debug("getadditionalflagsinfoScope is :: "+ getadditionalflagsinfoScope)
    } else {
        missingInputs.push("addRemoveAlternateEmailScope");
    }

    if (missingInputs.length > 0) {
        logger.debug("DEBUG::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
      
        action.goTo(nodeOutcome.ERROR);
    } else {
        var payload = {
            KOGID: kogID,
            // AlternateEmailAddress: alternateEmailAddress,
            // ActionFlag: actionFlag,
            // TransactionID: transactionID,
            // RequestorKOGID: kogID

        };

        logger.debug("Payload prepared: " + JSON.stringify(payload));

        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        logger.debug("ran the access token lib script for email")
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, getadditionalflagsinfoScope);
        nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse) + "for email");

        if (kogAPITokenResponse.status === 200) {
            logger.debug("access token status is 200" + kogAPITokenResponse + "for email")
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
            var res = httpClient.send(getadditionalflagsinfoAPIURL, requestOptions).get();
            var endTime = new Date();
            var duration = endTime - startTime;  
            var durationInSeconds = duration / 1000;
            logger.debug("KYID.2B1.Journey.getAdditionalFlagsInfoAPI call duration in seconds : " + durationInSeconds );
            logger.debug("response status of getAdditionalFlagsInfo from KOG AD " + res.status);

            logger.debug("response of getAdditionalFlagsInfo from KOG AD " + JSON.stringify(JSON.parse(res.text())));

            action.withHeader(`Response code: ${res.status}`);


            if (res.status === 200) {
                var data = JSON.parse(res.text());
                if (data.ResponseStatus === 0) {
                    logger.debug("data is :: => " + JSON.stringify(data));
                    nodeState.putShared("userData", data)
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
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            logger.debug("kogAPITokenResponse is not 200 ");
            action.goTo(nodeOutcome.FAIL);
        }
    }
} catch (error) {
     logger.error("Error in catch is  "+ error);
    action.goTo(nodeOutcome.ERROR);
}