var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Update User Profile for MFA",
    script: "Script",
    scriptName: "KYID.2B1.UpdateMFAMethod",
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

/**
 * Retrieves the user ID from nodeState.
 * @returns {string|null} - The user ID or null if not found.
 */
function getUserId() {
    try {
        var userId = nodeState.get("_id");

        // var userId = "ace845e3-d921-44cc-8b4e-13ba26a39065";
        if (!userId) {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User Id not Found" + usrEmailAddress);
            action.goTo(NodeOutcome.FAILED);
        }
        return userId;
    } catch (error) {
        logger.error("In Catch Block" + error.message)
        //        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error occurred while getting user from Nodestate"+"::"+error +"::"+usrEmailAddress);
        action.goTo(NodeOutcome.FAILED);
    }
}

function fetchUserData(userId) {
    try {
        nodeLogger.debug("Reading User Data from profile for user " + userId);
        var userData = openidm.read("managed/alpha_user/" + userId);
        nodeLogger.debug("User Data from profile: " + userData);
        return userData;
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM:" + "::" + error.message + "::" + usrEmailAddress);
        action.goTo(NodeOutcome.FAILED);
    }
}


function getMFAMethod() {
    try {
        return nodeState.get("MFAMethod");
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving MFA method from nodeState:" + "::" + error.message + "::" + usrEmailAddress);
        action.goTo(NodeOutcome.FAILED);
    }
}

function updateMFAObjects(mfamethod, usrKOGID, usrEmailAddress, oldMFAEmailValue) {
    if (mfamethod === "EMAIL") {
        var MFA_ID = lookupInMFAObject(usrKOGID, oldMFAEmailValue);
        if (MFA_ID) {
            logger.debug("inside updateMFAObjects " + MFA_ID)
            updateMFAObject(MFA_ID, usrEmailAddress);
        } else {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA record not found for the original email::" + usrEmailAddress);
        }
    }
}

function updateMFAObject(MFA_ID, usrEmailAddress) {
    logger.debug("Inside updateMFAObject");
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Method is being registered for " + MFA_ID + " and the new email is " + usrEmailAddress);

    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
    logger.debug("auditData " + JSON.stringify(auditData))

    var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
    var risk = nodeState.get("mailRisk") || "" ;
    var requestStatus = nodeState.get("requestStatus") || "" ;
    var riskReasonId = nodeState.get("riskReasonId") || "" ;
    var riskReason = nodeState.get("riskReason") || "" ;
    var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
    var riskBand = nodeState.get("riskBand") || "" ;
    var failureReason = nodeState.get("failureReason") || "" ;

  var emailPhoneRiskIndicator = []
  if(nodeState.get("phoneFinderRiskIndicator")){
      emailPhoneRiskIndicator = nodeState.get("phoneFinderRiskIndicator") ? JSON.parse(nodeState.get("phoneFinderRiskIndicator")) : [] ;
  }else if(nodeState.get("alternateEmailRiskIndicator")){
      emailPhoneRiskIndicator = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
  }else{
      emailPhoneRiskIndicator = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : [] ;
  }
    logger.debug("emailPhoneRiskIndicator is :: " + JSON.stringify(emailPhoneRiskIndicator))

    // Perform the patch operation to update MFA object with the new email
    // openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, [
    //     {
    //         "operation": "replace",
    //         "field": "MFAValue",
    //         "value": usrEmailAddress
    //     }
    // ]);
       openidm.patch("managed/alpha_kyid_mfa_methods/" + MFA_ID, null, [
            {
                "operation": "replace",
                "field": "MFAValue",
                "value": usrEmailAddress
            },
            {
                "operation": "replace",
                "field": "updatedBy",
                "value": auditData.updatedBy
            },
            {
                "operation": "replace",
                "field": "updateDate",
                "value": auditData.updatedDate
            },
            {
                "operation": "replace",
                "field": "updateDateEpoch",
                "value": auditData.updatedDateEpoch
            }
            , {
                "operation": "replace",
                "field": "updatedByID",
                "value": auditData.updatedByID
            },
            {
                "operation": "replace",
                "field": "transactionId",
                "value": transactionIdLN
            },
            {
                "operation": "replace",
                "field": "risk",
                "value": risk
            },
            {
                "operation": "replace",
                "field": "requestStatus",
                "value": requestStatus
            },
            {
                "operation": "replace",
                "field": "riskReasonId",
                "value": riskReasonId
            },
            {
                "operation": "replace",
                "field": "riskReason",
                "value": riskReason
            },
            {
                "operation": "replace",
                "field": "riskReasonDescription",
                "value": riskReasonDescription
            },
            {
                "operation": "replace",
                "field": "riskBand",
                "value": riskBand
            },
            {
                "operation": "replace",
                "field": "failureReason",
                "value": failureReason
            },
           {
                "operation": "replace",
                "field": "riskIndicator",
                "value": emailPhoneRiskIndicator.riskIndicator || []
            }
        ]);
    logger.debug("Post Patch");
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "MFA Method is being registered for " + MFA_ID + " and the new email is " + usrEmailAddress);
}

function lookupInMFAObject(usrKOGID, oldMFAEmailValue) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Looking up MFA Method for KOGID: " + usrKOGID + " with original email: " + oldMFAEmailValue);
    logger.debug("usrKOGID--" + usrKOGID)
    logger.debug("oldMFAEmailValue--" + oldMFAEmailValue)
    // Query to find MFA records for the given user (usrKOGID) and original email
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
        "_queryFilter": '/KOGId eq "' + usrKOGID + '" and /MFAValue eq "' + oldMFAEmailValue + '"'
    });
    logger.debug(mfaMethodResponses + "mfaMethodResponses");
    if (mfaMethodResponses.result.length > 0) {
        for (var i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            var MFA_ID = mfaMethodResponse._id;

            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                nodeLogger.debug("MFA found with ID: " + MFA_ID);
                return MFA_ID;
            }
        }
    }
    return null;
}

// Main execution
try {
    var userId = getUserId();
    logger.debug("printing userId" + userId);
    var userData = fetchUserData(userId);
    logger.debug("printing userData" + userData);
    var usrKOGID = userData.userName;
    nodeState.putShared("usrKOGID", usrKOGID);
    var usrEmailAddress = nodeState.get("newemail1");
    logger.debug("printing usrEmailAddress" + usrEmailAddress);
    var oldMFAEmailValue = nodeState.get("mail");
    logger.debug("printing oldMFAEmailValue" + oldMFAEmailValue);
    if (!userData) {
        // nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data not found for user ID: " + userId);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " User data not found for user ID: " + usrEmailAddress);
        action.goTo(NodeOutcome.FAILED);
    }


    // Validate that email is available
    if (!usrEmailAddress) {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error: Email address is null or undefined.");
        action.goTo(NodeOutcome.FAILED);
    }

    // Get MFA method and validate
    var mfamethod = getMFAMethod();
    logger.debug("printing mfamethod" + mfamethod);
    if (!mfamethod) {
        nodeLogger.debug(+transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Invalid MFA Method: " + mfamethod);
        action.goTo(NodeOutcome.FAILED);
    }

    // Update the MFA objects based on the selected method
    logger.debug("Before");
    logger.debug("mfamethod" + mfamethod);
    logger.debug("usrKOGID" + usrKOGID);
    logger.debug("usrEmailAddress" + usrEmailAddress);
    logger.debug("oldMFAEmailValue" + oldMFAEmailValue);
    updateMFAObjects(mfamethod, usrKOGID, usrEmailAddress, oldMFAEmailValue);

    // Successfully updated MFA, proceed
    action.goTo(NodeOutcome.SUCCESS);

} catch (e) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error in main execution: " + e.message + "::" + usrEmailAddress);
    action.goTo(NodeOutcome.FAILED);
}