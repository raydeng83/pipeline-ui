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

// var dateTime = new Date().toISOString();
// var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
// var ops = require("KYID.Library.IDMobjCRUDops");

// // Node Config
// var nodeConfig = {
//     begin: "Begining Node Execution",
//     node: "Node",
//     nodeName: "Dashboard RemoveRople",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.RemoveRolesDisplayMessage",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     CONFIRM: "confirm",
//     BACK: "back"
// };

// // Logging utility
// var nodeLogger = {
//     debug: function (message) {
//         logger.debug(message);
//     },
//     error: function (message) {
//         logger.debug(message);
//     },
//     info: function (message) {
//         logger.info(message);
//     }
// };

// try {
//     // === Handle roleIds from nodeState ===
//     var rawRoleIds = nodeState.get("roleIds");
//     var roleID;

//     if (typeof rawRoleIds === 'object') {
//         roleID = JSON.parse(JSON.stringify(rawRoleIds)); // Deep clone
//     } else {
//         roleID = rawRoleIds;
//     }

//     logger.debug("RoleID type is " + typeof roleID);

//     // Normalize into array
//     if (typeof roleID === "string") {
//         try {
//             roleID = JSON.parse(roleID);
//             if (!Array.isArray(roleID)) {
//                 roleID = [roleID];
//             }
//         } catch (e) {
//             roleID = [roleID];
//         }
//     } else if (!Array.isArray(roleID)) {
//         roleID = [roleID];
//     }

//     logger.debug("Final roleID array: " + JSON.stringify(roleID));

//     var userId = nodeState.get("_id");
//     logger.debug("userId is " + userId);

//     if (callbacks.isEmpty()) {
//         var roleNamesList = getAppDetails(roleID);
//         requestCallbacks(roleNamesList);
//     } else {
//         handleUserResponses();
//     }

// } catch (error) {
//     nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
//         nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
//         "::" + nodeConfig.begin + ":: Error in main execution: " + error.message);
//     action.goTo(NodeOutcome.ERROR);
// }

// // ========================== FUNCTIONS ========================== //

// function requestCallbacks(roleNamesList) {
//     nodeLogger.error("inside requestCallbacks");

//     try {
//         callbacksBuilder.textOutputCallback(1, "3_removerole");
//         callbacksBuilder.textOutputCallback(0, "Are you sure you want to remove the access for the following role(s)?");

//         var jsonOutput = JSON.stringify(roleNamesList);
//         callbacksBuilder.textOutputCallback(0, jsonOutput);
//         callbacksBuilder.confirmationCallback(0, ["Yes, Remove Access", "No, Go Back"], 1);

//     } catch (error) {
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
//             nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
//             "::" + nodeConfig.begin + ":: Error in requestCallbacks: " + error.message);
//     }
// }

// function handleUserResponses() {
//     try {
//         var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

//         if (selectedOutcome === 1) {
//             action.goTo(NodeOutcome.BACK);
//         } else if (selectedOutcome === 0) {
//             action.goTo(NodeOutcome.CONFIRM);
//         } else {
//             logger.debug("Unexpected confirmation outcome: " + selectedOutcome);
//         }

//     } catch (error) {
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
//             nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
//             "::" + nodeConfig.begin + ":: Error in handleUserResponses: " + error.message);
//     }
// }

// function getAppDetails(roleIds) {
//     try {
//         var roleNames = [];

//         if (!Array.isArray(roleIds)) {
//             roleIds = [roleIds];
//         }

//         roleIds.forEach(function (roleId) {
//             var params = {
//                 key: "_id",
//                 ops: "eq",
//                 value: roleId
//             };

//             var kyidResponse = ops.crudOps("query", "alpha_role", null, params, null, null);

//             if (kyidResponse && kyidResponse.resultCount > 0) {
//                 kyidResponse.result.forEach(function (roleObj) {
//                     if (roleObj.name) {
//                         logger.debug("Printing role name: " + roleObj.name);
//                         roleNames.push({ name: roleObj.name });
//                     }
//                 });
//             }

//             logger.debug("Response for roleId " + roleId + ": " + JSON.stringify(kyidResponse));
//         });

//         return roleNames;

//     } catch (error) {
//         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
//             nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
//             "::" + nodeConfig.begin + ":: Error in getAppDetails: " + error.message);
//         return [];
//     }
// }
