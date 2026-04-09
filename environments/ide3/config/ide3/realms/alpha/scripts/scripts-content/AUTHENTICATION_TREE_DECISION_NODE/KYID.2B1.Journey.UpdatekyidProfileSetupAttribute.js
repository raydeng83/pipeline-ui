var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Update User Profile",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UpdatekyidProfileSetupAttribute",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingUsrIdIDM: "Missing ID of IDM user in sharedState",
    idmPatchOperationFailed: "IDM Patch/Update Operation Failed",
    usrCreateOrUpdateFails: "User profile can neither be created nor be updated in the system.",
    usrExistIDM: "User profile exist in Forgerock AIC",
    usrNotExistIDM: "User profile doesn't exist in Forgerock AIC",
    updateUsrProfileIDM_Success: "User profile updated successfully in Forgerock AIC",
    ConnectorName: "ConnectorName",
    missingDomain: "Missing user domain",
    missingEmail: "Missing email",
    ldapQuery: "ldapQuery",
    idmQueryFail: "IDM query operation failed",
    ldapQueryTotalRecords: "Total Records",
    ldapQueryPrintRecords: "List of Records",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
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
try {
    nodeLogger.debug("Script Started");

    var jsonArray = [];
    var UserId;

    // Try to retrieve UserId
    if (nodeState.get("usrcreatedId")) {
        UserId = nodeState.get("usrcreatedId");
    }

    if (UserId) {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
        logger.debug("KYID auditDetail " + JSON.stringify(auditData))
        nodeLogger.debug("UserId found: " + UserId);

        var jsonObj = {
            operation: "replace",
            field: "custom_kyidProfileSetup",
            value: true
        };
        jsonArray.push(jsonObj);

        var jsonObj = {
            operation: "replace",
            field: "custom_updatedDateEpoch",
            value: auditData.updatedDateEpoch
        };
        jsonArray.push(jsonObj);
        var jsonObj = {
            operation: "replace",
            field: "custom_updatedByID",
            value: auditData.updatedByID
        };
        jsonArray.push(jsonObj);
        var jsonObj = {
            operation: "replace",
            field: "custom_updatedDateISO",
            value: auditData.updatedDate
        };
        jsonArray.push(jsonObj);
        var jsonObj = {
            operation: "replace",
            field: "custom_updatedBy",
            value: auditData.updatedBy
        };
        jsonArray.push(jsonObj);

        openidm.patch("managed/alpha_user/" + UserId, null, jsonArray);

        //nodeState.putShared("profileInfoAdded", "back");
        nodeLogger.debug("User updated successfully.");
        action.goTo(nodeOutcome.SUCCESS);

    } else {
        // If UserId is not available in nodeState
        nodeLogger.error("UserId is missing from nodeState.");
        // nodeState.putShared("errorMessage", "UserId not found in node state.");
        action.goTo(nodeOutcome.ERROR);
    }

} catch (error) {
    nodeLogger.error("Exception occurred: " + error);
    // nodeState.putShared("errorMessage", "Error occurred while saving user release status");
    action.goTo(nodeOutcome.ERROR);
}