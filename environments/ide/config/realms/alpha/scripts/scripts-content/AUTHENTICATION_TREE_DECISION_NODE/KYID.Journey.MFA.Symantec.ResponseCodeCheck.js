/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Symantec ResponseCode Check",
    script: "Script",
    scriptName: "KYID.Journey.MFA.Symantec.ResponseCodeCheck",
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
    }
};

function patchCredID() {
    try {
        var credID = nodeState.get("credId");
        var userId = nodeState.get("_id");

        // Check if credId and userId are null or undefined
        if (!credID) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: credId is null or undefined.");
            return false;
        }

        if (!userId) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error: userId is null or undefined.");
            return false;
        }

        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the cred ID inside the patchCredID :: " + nodeState.get("credId"))
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID inside the patchCredID ::::: ************" + nodeState.get("_id"))
        //var userData = openidm.read("managed/alpha_user/" + userId);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "credID for the patch object  ***" + credID);

        var result = openidm.patch("managed/alpha_user/" + userId, null, [{ "operation": "add", "field": "frIndexedString4", "value": credID }]);
        if (result) {
            return true
        } else {
            logger.error("PATCH FAILED");
            return false
        }
    } catch (e) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the patching cred ID function :::: ******* " + e)
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
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error extracting tag value: " + error.message);
        return null;
    }
}

// Function to log errors
function logError(message) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + message);
}


// Main execution
try {

    //Printing the response code and response body
    var responsecode = nodeState.get("responsecode");
    var responsebody = nodeState.get("responsebody");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsecode :: " + responsecode)
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Responsebody :: " + responsebody)

    //var otpFromNodeState = getOTPFromNodeState();
    if (extractTagValue(responsebody, "ReasonCode") === "0000") {
        if (patchCredID()) {
            action.goTo(NodeOutcome.SUCCESS);
        }
    } else {
        action.goTo(NodeOutcome.FAILED);
    }
} catch (e) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in the main execution of reason code check " + e)
}

