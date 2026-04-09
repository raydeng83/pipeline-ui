var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Remove MFA",
    script: "Script",
    scriptName: "KYID.Journey.MFAMethodRemoveFromUser",
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


// Retrieve the user ID from nodeState
var user = nodeState.get("_id");

// Initialize flag for deletion
var deletedAny = false;

// Define the array of possible MFAMethod values
var mfamethods = ["sms", "swk", "voice", "symantec", "otp", "Token de Software"];
//var mfamethod = nodeState.get("selectedMFAOption");

var mfamethod = nodeState.get("methodToRemove");

// Log the selected MFA method
nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing---- " + mfamethod);

// Check if user ID is valid
if (!user) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID (_id) is null or undefined.");
    // Set the outcome to false and exit
    action.goTo(NodeOutcome.FAILED);
} else {
    // Check if mfamethod is one of the allowed values
    if (mfamethods.includes(mfamethod)) {
        // Query to find the MFA method context
        var mfamethodQuery = openidm.query("managed/MFAContextObject", {
            "_queryFilter": "/MFAMethods eq \"" + mfamethod + "\""
        }, ["_id"]);

        if (mfamethodQuery.resultCount > 0) {
            var mfamethodId = mfamethodQuery.result[0]._id;
            var vUserHasMFAOption = openidm.query("managed/MFAContextObject/" + mfamethodId + "/members", {
                "_queryFilter": "/_refResourceId eq \"" + user + "\""
            }, ["_id"]);

            if (vUserHasMFAOption.resultCount > 0) {
                var memberIdToDelete = vUserHasMFAOption.result[0]._id;
                openidm.delete("managed/MFAContextObject/" + mfamethodId + "/members/" + memberIdToDelete, null);
                logger.error("Removed member from MFAOption with MFAId: " + mfamethodId + ", member relation id: " + memberIdToDelete);
                deletedAny = true; // Set flag to true if any deletion occurs
            }
        }
    } else {
        logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "mfamethod is not one of the allowed values: " + mfamethod);
    }

    // Determine the outcome based on whether any deletions were made
    outcome = deletedAny ? NodeOutcome.SUCCESS : NodeOutcome.FAILED;
}

