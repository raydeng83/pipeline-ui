var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Dashboard RemoveRople",
    script: "Script",
    scriptName: "KYID.2B1.Journey.DisplayMessageRemoveRoles",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CONFIRM: "confirm",
    BACK: "back",
    ERROR: "error"
};

// Logging utility
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};

try {
    // === Handle roleIds from nodeState ===
    var rawRoleIds = nodeState.get("roleIds");
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
        nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
        "::" + nodeConfig.begin + ":: Error in main execution: " + error.message);
    // callbacksBuilder.textOutputCallback(0, "some_unexpected_error_occured");
    action.goTo(NodeOutcome.ERROR);
}

// ========================== FUNCTIONS ========================== //

function requestCallbacks() {
    nodeLogger.debug("inside requestCallbacks");

    try {
        callbacksBuilder.textOutputCallback(1, "3_removerole");
        callbacksBuilder.textOutputCallback(0, "Are you sure you want to remove the access for the following role(s)?");

        //var jsonOutput = JSON.stringify(roleNamesList);
        var jsonOutput = nodeState.get("roleNames");
        callbacksBuilder.textOutputCallback(0, jsonOutput);
        callbacksBuilder.confirmationCallback(0, ["Yes, Remove Access", "No, Go Back"], 1);

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
            nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            "::" + nodeConfig.begin + ":: Error in requestCallbacks: " + error.message);
    }
}

function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if (selectedOutcome === 1) {
            action.goTo(NodeOutcome.BACK);
        } else if (selectedOutcome === 0) {
            action.goTo(NodeOutcome.CONFIRM);
        } else {
            logger.debug("Unexpected confirmation outcome: " + selectedOutcome);
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
            nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            "::" + nodeConfig.begin + ":: Error in handleUserResponses: " + error.message);
    }
}