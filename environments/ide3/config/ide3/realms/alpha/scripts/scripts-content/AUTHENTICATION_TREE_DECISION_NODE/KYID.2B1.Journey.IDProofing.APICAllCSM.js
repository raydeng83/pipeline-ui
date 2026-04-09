var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.MCIApiCall",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {

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

// Main Execution
try {
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = nodeState.get("userInfoJSON");
    var displayJSON = {};

    if (callbacks.isEmpty()) {
        requestCallbacks(userInfoJSON, displayJSON);
    } else {
        handleUserResponses(mail);
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution " + mail);
}

function requestCallbacks(userInfoJSON, displayJSON) {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");

        // var pageHeader= "2_add_methods";
        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage");
            callbacksBuilder.textOutputCallback(0, errorMessage);
        }

        if (nodeState.get("appEnrollRIDPMethod") === "SSA") {
            var pageHeader = { "pageHeader": "2_RIDP_CMS_SSA_Verify" };

            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            displayJSON = {
                // "method": "CMS_SSA",
                // "action": "verify",
                // "collectedUserInfo": userInfoJSON
                 "apiCalls":[
                    {
                        "method": "CMS_SSA",
                        "action": "verify"
                        
                    }
                ],

                "collectedUserInfo": userInfoJSON
            };

            callbacksBuilder.textOutputCallback(0, JSON.stringify(displayJSON));
        }
        else if (nodeState.get("appEnrollRIDPMethod") === "Experian") {

            //var pageHeader = { "pageHeader": "2_RIDP_CMS_Experian_Verify" };
            var pageHeader = { "pageHeader": "4_RIDP_KBA_CMS_EXPERIAN" };

            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            // displayJSON = {
            //     // "method": "CMS_Experian",
            //     // "action": "verify",
            //     // "collectedUserInfo": userInfoJSON
            //     "apiCalls":[
            //         {
            //         "method": "CMS_Experian",
            //         "action": "verify"
                        
            //         }
            //     ],

            //     "collectedUserInfo": userInfoJSON
            // };
            displayJSON = {
                    "apiCalls":[ { "method": "CMS_Experian", "action": "verify" }],
                    "collectedUserInfo": nodeState.get("userInfoJSON")
            };

            callbacksBuilder.textOutputCallback(0, JSON.stringify(displayJSON));
        }

        callbacksBuilder.textInputCallback("Response");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses(mail) {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var apiResponse = callbacks.getTextInputCallbacks().get(0);
        logger.debug("validateObject(apiResponse):: " + typeof apiResponse);
        logger.debug("validateObject(apiResponse):: " + validateObject(apiResponse));
        nodeState.putShared("proofingMethod", "2")

        // if (typeof apiResponse === "string") {
        //     try {
        //         apiResponse = JSON.parse(apiResponse);
        //     } catch (e) {
        //         logger.debug("Error parsing apiResponse: " + e);
        //         nodeState.putShared("validationMessage", "invalid_input");
        //         action.goTo("errorMessage");
        //         return;
        //     }
        // }

        // if (typeof apiResponse === "string") {
        //     try {
        //         apiResponse = JSON.parse(apiResponse);

        //         // Validate that apiResponse is an object and has a "status" property of type string
        //         if (!apiResponse || typeof apiResponse !== "object" || typeof apiResponse.status !== "string") {
        //             logger.debug("Invalid apiResponse object or missing status property");
        //             nodeState.putShared("validationMessage", "invalid_input");
        //             action.goTo("errorMessage");
        //         }

        //         // Validate refId: can be null or string (including empty string), but not other types
        //         if (!(apiResponse.refId === null || typeof apiResponse.refId === "string")) {
        //             logger.debug("Invalid refId in apiResponse (must be null or string)");
        //             nodeState.putShared("validationMessage", "invalid_input");
        //             action.goTo("errorMessage");
        //         }

        //     } catch (e) {
        //         nodeLogger.error("Error parsing apiResponse or invalid status: " + e);
        //         nodeState.putShared("validationMessage", "invalid_input");
        //         action.goTo("errorMessage");
        //     }
        // }

        if (typeof apiResponse === "string") {
            try {
            apiResponse = JSON.parse(apiResponse);

            // Validate that apiResponse is an object and has a "status" property of type string
            if (!apiResponse || typeof apiResponse !== "object" || typeof apiResponse.status !== "string") {
                logger.debug("Invalid apiResponse object or missing status property");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }

            // If status is "success", no further checks needed
            if (apiResponse.status.toLowerCase() === "success") {
                // All good, continue
            } else if (apiResponse.status.toLowerCase() === "failed") {
                // For failure, refId must be present and a string (including empty string)
                if (!(typeof apiResponse.refId === "string" && apiResponse.refId.length > 0)) {
                logger.debug("refId must be present and a non-empty string when status is failure");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
                }
            } else {
                logger.debug("Unknown status value in apiResponse");
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
                return;
            }

            } catch (e) {
            nodeLogger.error("Error parsing apiResponse or invalid status: " + e);
            nodeState.putShared("validationMessage", "invalid_input");
            action.goTo("errorMessage");
            return;
            }
        }
        
       
        logger.debug("KYID.2B1.Journey.IDProofing.APICAllCSM response is --> " + JSON.stringify(apiResponse));
        if (selectedOutcome === 0) {
            nodeState.putShared("validationErrorCode", null);
            logger.debug("KYID.2B1.Journey.IDProofing.API CAllCSM response is --> " + apiResponse.status);
            if (
                apiResponse.status &&
                typeof apiResponse.status === "string" &&
                apiResponse.status.toLowerCase() === "success"
            ) {
                nodeState.putShared("validationMessage", null);
                if (nodeState.get("appEnrollRIDPMethod") === "SSA") {
                    nodeState.putShared("status_givenName","verified")
                    nodeState.putShared("status_middleName","verified")
                    nodeState.putShared("status_dob","verified")
                    nodeState.putShared("status_ssn","verified")
                }
                action.goTo("MCISearch");
            } else if (
                apiResponse.status &&
                typeof apiResponse.status === "string" &&
                apiResponse.status.toLowerCase() === "failed"
            ) {
                if (nodeState.get("context") === "appEnroll") {
                    logger.debug("Insdie Failed Scenario")
                    nodeState.putShared("refId",apiResponse.refId)
                    nodeState.putShared("appEnrollUnableToVerify", "true");
                    nodeState.putShared("prereqStatus", "REVERIFY");
                    nodeState.putShared("validationMessage", null);
                    action.goTo("notVerified");
                }
            } else {
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("errorMessage");
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }
}

function validateObject(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return true;
        }
    }

    return true;
}
