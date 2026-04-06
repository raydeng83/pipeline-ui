var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "CheckuserReleaseStatus",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckuserHasMobileNumberRegistered",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    YES: "Yes",
    NO: "No",
    ERROR: "Error"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    debug: function(message) {
        logger.debug(message);
    },
    error: function(message) {
        logger.error(message);
    }
};


try {
    var KOGID = nodeState.get("KOGID");

    if (KOGID) {
        var mfaResponse = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": 'KOGId eq "' + KOGID + '"'
        });

        if (mfaResponse.result && mfaResponse.result.length > 0) {
            var hasMobile = false;
            var hasSecondaryEmail = false;

            for (var i = 0; i < mfaResponse.result.length; i++) {
                var mfaMethod = mfaResponse.result[i];
                nodeLogger.debug("MFA Method found: " + JSON.stringify(mfaMethod));

                if (mfaMethod.MFAMethod === "SMSVOICE" && mfaMethod.MFAStatus === "ACTIVE") {
                    hasMobile = true;
                }

                if (mfaMethod.MFAMethod === "SECONDARY_EMAIL" && mfaMethod.MFAStatus === "ACTIVE") {
                    hasSecondaryEmail = true;
                }
            }

            //Set nodeState flags
            if (hasMobile) {
                nodeState.putShared("hasMobileregistered", "true");
                nodeState.putShared("phoneStatus", "true"); //this nodestate is used in the alternate email screen for skip button
                logger.debug("mobile registered: " + KOGID);
            } else {
                nodeState.putShared("phoneStatus", null);
                logger.debug("mobile not registered: " + KOGID);
            }

            if (hasSecondaryEmail) {
                nodeState.putShared("hasSecondaryEmailRegistered", "true");
                logger.debug("secondary email registered: " + KOGID);
            }

            //Final outcome
            if (hasMobile) {
                action.goTo(nodeOutcome.YES);
            } else {
                action.goTo(nodeOutcome.NO);
            }

        } else {
            logger.debug("No MFA methods found for KOGID: " + KOGID);
            nodeState.putShared("phoneStatus", null); //this nodestate is used in the alternate email screen for skip button
            action.goTo(nodeOutcome.NO);
        }

    } else {
        nodeLogger.error("KOGID is missing.");
        action.goTo(nodeOutcome.ERROR);
    }

} catch (error) {
    nodeLogger.error("Exception occurred: " + error.message);
    action.goTo(nodeOutcome.ERROR);
}