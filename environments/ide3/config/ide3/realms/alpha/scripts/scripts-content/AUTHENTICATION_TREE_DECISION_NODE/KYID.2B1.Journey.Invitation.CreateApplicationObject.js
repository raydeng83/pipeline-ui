var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Create User in AIC",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Invitation.CreateApplicationObject",
    timestamp: dateTime,
    idmCreateOperationFailed: "IDM Create Operation Failed",
    mfaCreateOperationFailed: "MFA Create Operation Failed",
    exceptionErrMsg: "Error during user creation: ",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

nodeLogger.debug(nodeConfig.begin);

var jsonObj = {};
var createApplicationRequestObjectResponse = "";
var transactionid = "";
try {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    var usrKOGID = nodeState.get("usrKOGID");
    var usrroleID = nodeState.get("roleid");

    // Check if the request is already present and is not expired
    function isRequestPresentAlready() {
        logger.debug("inside isRequestPresentAlready");
        var isRequestPresent = openidm.query("managed/alpha_kyid_applicationrequest", { 
            "_queryFilter": 'kogID eq "' + usrKOGID + '" and roleId eq "' + usrroleID + '"' 
        }, ["_id", "requestTime", "expiryTime"]);

        logger.debug("printing isRequestPresent" + isRequestPresent);

        if (isRequestPresent.result.length > 0) {
            logger.debug("Request exists");
            var request = isRequestPresent.result[0];
            var requestid = request._id;
            var requestTime = request.requestTime; 
            var expiryTime = request.expiryTime;

            if (checkRequestExpiry(requestTime, expiryTime)) {
                logger.debug("Request has expired create new ");
                return false;
            } else {
                logger.debug("Request is valid and not expired dont create.");
                // return requestid;
                // return true;
                return { exists: true, requestid: requestid };
            }
        } else {
            logger.debug("create new request")
            return false;
        }

    }


    function checkRequestExpiry(requestTime, ExpiryTime) {
        var ExpiryTimeinMillisec = ExpiryTime * 60 * 60 * 1000; 
        var requestExpiredTime = parseInt(requestTime) + ExpiryTimeinMillisec;
        var currentTime = Date.now();
        if (currentTime > requestExpiredTime) {
            logger.debug("Request has expired at: " + new Date(requestExpiredTime));
            return true; 
        } else {
            return false; 
        }
        
    }

    // Set request time and requester ID
    var requestTimeinMilliSeconds = Date.now();
    var usrrequestTime = requestTimeinMilliSeconds.toString();
    var usrrequesterId;

    if (nodeState.get("inviteothers")) {
        var inviteothers = nodeState.get("inviteothers");
        if (inviteothers === "true") {
            logger.debug("its invited")
            var usrisNameEditable = nodeState.get("usrisNameEditable");
            var usrisEmailEditable = nodeState.get("usrisEmailEditable");
            var usrisPhoneEditable = nodeState.get("usrisPhoneEditable");

            if (existingSession.get("KOGID")) {
                usrrequesterId = existingSession.get("KOGID");
            }
        }
         else {
        logger.debug("its appcreated")
        usrrequesterId = "";
        var usrisNameEditable = "true";
        var usrisEmailEditable = "true";
        var usrisPhoneEditable = "true";
    }
    }

    // Create the JSON object for user application request creation
    jsonObj = {
        kogID: usrKOGID,
        roleId: usrroleID,
        requestTime: usrrequestTime,
        requesterId: usrrequesterId,
        expiryTime: "2", 
        isNameEditable: usrisNameEditable,
        isEmailEditable: usrisEmailEditable,
        isPhoneEditable: usrisPhoneEditable
    };

    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " application request Data: " + JSON.stringify(jsonObj));

    // Attempt user creation
    nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " begin creating the application request");

    var requestid = null;

    if (isRequestPresentAlready()) {
        //requestid = isRequestPresent.result[0]._id;
        //var request = isRequestPresent.result[0];
        //var requestid = request._id;
        var requestId = isRequestPresentAlready().requestid;
        logger.debug("requestId is" +requestId )
        nodeState.putShared("applicationRequestID", requestId);
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " application request already exists.");
    } else {
        // Request already exists, use the existing request ID
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " application request is new.");
        createApplicationRequestObjectResponse = openidm.create("managed/alpha_kyid_applicationrequest", null, jsonObj);
    }

    if (createApplicationRequestObjectResponse) {
        nodeLogger.debug(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " application request Created Successfully: " + JSON.stringify(createApplicationRequestObjectResponse));

        var applicationRequestID = createApplicationRequestObjectResponse._id;
        nodeState.putShared("applicationRequestID", applicationRequestID);
    }

    nodeLogger.debug(nodeConfig.end);
    action.goTo(nodeOutcome.SUCCESS);

} catch (error) {
    var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
    nodeLogger.error(transactionid+ "::" + nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.ERROR);
}


