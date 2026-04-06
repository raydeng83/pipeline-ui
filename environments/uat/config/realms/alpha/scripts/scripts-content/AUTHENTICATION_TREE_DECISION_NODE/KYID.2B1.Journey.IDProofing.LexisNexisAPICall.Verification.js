var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select LexisNexisAPICall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexisAPICall.Verification",
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

function main() {
    var userInfoJSON = nodeState.get("userInfoJSON")
    var userInfoJSON1 = nodeState.get("userInfoJSON1")
    
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
        logger.debug("userInfoJSON in KYID.2B1.Journey.IDProofing.LexisNexisAPICall.Verification"+ JSON.stringify(userInfoJSON1))
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var context = null;
        var AppEnrollIDVerificationMethod = null;
        var isLNKbaRequired = null
        if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
           isLNKbaRequired = "false";
        }else if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
           isLNKbaRequired = "true";
        }
    
        var displayCallBackJSON = {
            "apiCalls":[
                {
                    "method" :"LexisNexis",
                    "action" : "IdVerification",
                            
                }
            ],
            "collectedUserInfo": nodeState.get("userInfoJSON"),
            "userID": usrKOGID,
            "userMail": mail,
            "action": "IdVerification",
            "isLNKbaRequired": isLNKbaRequired
        }
    
        if (callbacks.isEmpty()) {
            requestCallbacks(displayCallBackJSON);
        } else {
            handleUserResponses();
        }

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
    }
}

main();

function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallback Function");
    try {
        if (nodeState.get("validationMessage") != null) {
            logger.debug("validationMessage"+nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        var pageHeader= {"pageHeader": "2_RIDP_lexisNexis_Verification"};
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}


function handleUserResponses() {
    var selectedOutcome = null;
    var response = null;
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses function");
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        nodeLogger.debug("journeyContext :: "+nodeState.get("journeyContext"));
        response = callbacks.getTextInputCallbacks().get(0);

        if (!validateResponse(response)) {
            nodeState.putShared("validationMessage", "invalid_response");
            action.goTo("error");
        }
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Response: " + response);
        
        //var parsedResponse = JSON.parse(response);
        nodeState.putShared("Response", response);
        nodeState.putShared("userAttributesForTransaction", response)
        action.goTo("success");

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error handleUserResponses Function" + error.message);
    }
}


function validateResponse(responseStr) {
    try {
        // Check if response is a valid JSON string
        var parsedResponse = JSON.parse(responseStr);
        
        // Check if required keys exist
        if (!parsedResponse.hasOwnProperty('lexId')) {
            nodeLogger.error("Missing required key: lexId");
            return false;
        }
        if (!parsedResponse.hasOwnProperty('riskIndicator')) {
            nodeLogger.error("Missing required key: riskIndicator");
            return false;
        }
        if (!parsedResponse.hasOwnProperty('verificationStatus')) {
            nodeLogger.error("Missing required key: verificationStatus");
            return false;
        }
        
        return true;
    } catch (error) {
        nodeLogger.error("Invalid JSON response: " + error.message);
        return false;
    }
}