/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var mail = nodeState.get("mail");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Symantec ResponseCode Check",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Login.Register.Symantec.ResponseCodeCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
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


function patchCredID() {
    try {
        var credID = nodeState.get("credId");
        var userId = nodeState.get("_id");

        // Check if credId and userId are null or undefined
        if (!credID) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: credId is null or undefined." + "::" + mail);
            return false;
        }

        if (!userId) {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: userId is null or undefined." + "::" + mail);
            return false;
        }

        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cred ID inside the patchCredID :: " + nodeState.get("credId") + "::" + mail)
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID inside the patchCredID" + nodeState.get("_id"))
        //var userData = openidm.read("managed/alpha_user/" + userId);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "credID for the patch object  ***" + credID + "::" + mail);

        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails(existingSession, "UPDATE", nodeState)
        logger.debug("auditDetail " + auditData)
        var result = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "frIndexedString4", "value": credID },
        { operation: "replace", field: "/custom_updatedDateEpoch", value: auditData.updatedDateEpoch },
        { operation: "replace", field: "/custom_updatedByID", value: auditData.updatedByID },
        { operation: "replace", field: "/custom_updatedDateISO", value: auditData.updatedDate },
        { operation: "replace", field: "/custom_updatedBy", value: auditData.updatedBy }
        ]);
        if (result) {
            return true
        } else {
            logger.debug("PATCH FAILED");
            return false
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the patching cred ID function" + error + "::" + mail)
    }
}


function extractTagValue(xml, tagName) {
    try {
        var tagPattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
        var match = tagPattern.exec(xml);
        if (match && match[1]) {
            return match[1].trim();
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error extracting tag value: " + error.message + "::" + mail);
        return null;
    }
}


// Main execution
try {

    //Printing the response code and response body
    var responsecode = nodeState.get("responsecode");
    var responsebody = nodeState.get("responsebody");
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode :: " + responsecode + "::" + mail);
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsebody :: " + responsebody + "::" + mail);

    //var otpFromNodeState = getOTPFromNodeState();
    if (extractTagValue(responsebody, "ReasonCode") === "0000") {
        // if (patchCredID()) {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is validated successfully :: " + "::" + mail);
        action.goTo(NodeOutcome.SUCCESS);
        // }
    } else {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Entered security code is invalid :: " + "::" + mail);
        nodeState.putShared("SymantecErrorMessage", "verification_failed");
        action.goTo(NodeOutcome.FAILED);
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the main execution of reason code check " + error + "::" + mail)
}

