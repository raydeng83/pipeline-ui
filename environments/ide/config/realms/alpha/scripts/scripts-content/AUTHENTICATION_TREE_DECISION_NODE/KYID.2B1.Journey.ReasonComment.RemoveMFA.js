var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ReasonComment.RemoveMFA",
    errorLastName: "lastName_validation_failed",
    errorFirstName: "firstName_validation_failed",
    errorFirstNameLastName: "firstName_lastName_validation_failed",
    errorEmail: "email validation failed",
    errorId_lastNameValidation: "errorID::KYID005",
    errorId_firstNameValidation: "errorID:KYID006",
    errorId_emaileValidation: "errorID:KYID007",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    ERROR: "error",
    BACK: "back"
};

// Logging wrapper
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

// Function to handle callback requests
function requestCallbacks() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
        nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
        "::" + nodeConfig.begin + ":: Invoking requestCallback Function");

    try {
        var requesterUserId = nodeState.get("requesterUserId");

        callbacksBuilder.textInputCallback("Reason");
        callbacksBuilder.textInputCallback("Comment");

        // Confirmation callback: 0 = Next, 1 = Back
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);

        if (getFaqTopicId != null) {
            callbacksBuilder.textOutputCallback(0, "" + getFaqTopicId + "");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node +
            "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" +
            nodeConfig.scriptName + ":: Error in requestCallbacks :: " + error);
    }
}

// Function to handle user responses
function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node +
            "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            ":: Invoking handleUserResponses Function");

        var reasoninput = callbacks.getTextInputCallbacks().get(0).trim();
        var commentinput = callbacks.getTextInputCallbacks().get(1).trim();
        var selectedIndex = callbacks.getConfirmationCallbacks().get(0);
        var requesterUserId = nodeState.get("requesterUserId");
        //var id = nodeState.get("contextId"); // <-- Ensure contextId exists

        nodeLogger.debug("Print Outcome Selected (Index) ::: " + selectedIndex);
       var mfaidremoval = nodeState.get("mfaidremoval")
        if (selectedIndex === 0) {
            // NEXT selected
            var jsonArray = [];
            jsonArray.push({
                "operation": "replace",
                "field": "/audit",
                "value": {
                    action: "remove",
                    reason: reasoninput,
                    comment: commentinput,
                    requesterUserId: requesterUserId || null
                }
            });

            nodeLogger.error("the jsonArray in cancel invitation is: " + JSON.stringify(jsonArray));

            try {
                openidm.patch("managed/alpha_kyid_mfa_methods/" + mfaidremoval, null, jsonArray);
                nodeLogger.error("Audit fields patched successfully for contextId: " + mfaidremoval);
            } catch (patchErr) {
                nodeLogger.error("Graceful handling: Failed to patch audit fields. Still proceeding. Error: " + patchErr);
                // Don’t throw — continue to NEXT
            }

            action.goTo(NodeOutcome.NEXT);

        } else if (selectedIndex === 1) {
            // BACK selected
            action.goTo(NodeOutcome.BACK);
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node +
            "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            ":: Error Occurred in handleUserResponses :: " + error);
        nodeState.putShared("scriptfailed", "scriptfailed");
        action.goTo(NodeOutcome.ERROR);
    }
}

// Main execution
try {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node +
        "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
        "::" + nodeConfig.begin + ":: Invoking main Function");

    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName +
        "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
        ":: Error in main execution: " + error);
    nodeState.putShared("scriptfailed", "scriptfailed");
    action.goTo(NodeOutcome.ERROR);
}