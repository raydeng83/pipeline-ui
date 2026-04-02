

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Add MFA Methods",
    script: "Script",
    scriptName: "KYID.2B1.Journey.FirstTimeLogin.AddMFAMethods",
    timestamp: dateTime,
    exceptionErrMsg: "Error during user creation: ",
    errorId_AccountCreationFailed: "errorID::KYID002",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
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
    var userData = {};
    var availableMFAMethods = [];


    var primaryEmail = null;
    if (nodeState.get("userMail") != null) {
        primaryEmail = nodeState.get("userMail").toLowerCase();
        availableMFAMethods.push("EMAIL");
    }

    var telephoneNumber;
    if (nodeState.get("verifiedTelephoneNumber") != null) {
        telephoneNumber = nodeState.get("verifiedTelephoneNumber").toLowerCase();
        availableMFAMethods.push("SMSVOICE");
    }
    var verifiedAlternateEmail = null;
    if (nodeState.get("verifiedAlternateEmail") != null) {
        verifiedAlternateEmail = nodeState.get("verifiedAlternateEmail").toLowerCase();
        availableMFAMethods.push("SECONDARY_EMAIL");
    }

    var usrKOGID;
    if (nodeState.get("KOGID") != null) {
        usrKOGID = nodeState.get("KOGID");
    }

    logger.debug("usrKOGID " + usrKOGID);
    logger.debug("verifiedAlternateEmail " + verifiedAlternateEmail);
    logger.debug("primaryEmail " + primaryEmail);
    logger.debug("availableMFAMethods " + availableMFAMethods);

    // if(availableMFAMethods.includes("EMAIL")){
    //     var mfaMethod = "EMAIL";
    //     createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
    //     logger.debug("EMAIL MFADONE");
    // }
    if (availableMFAMethods.includes("SMSVOICE")) {
        var mfaMethod = "SMSVOICE";
        logger.debug("going inside SMSVOICE MFA")
        createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber);
        logger.debug("SMSVOICE MFADONE");
    }
    // if(availableMFAMethods.includes("SECONDARY_EMAIL")){
    //     var mfaMethod = "SECONDARY_EMAIL";
    //     createMFAObjects(mfaMethod,usrKOGID, verifiedAlternateEmail, primaryEmail,telephoneNumber);
    //     logger.debug("SMSVOICE MFADONE");
    // }

    if (availableMFAMethods.includes("SECONDARY_EMAIL")) {
        logger.debug("going inside SECONDARY_EMAIL MFA")
        createOrUpdateSecondaryEmailMFA(usrKOGID, verifiedAlternateEmail);
    }


    nodeState.putShared("recoveryMethodsAdded", true);
    action.goTo(nodeOutcome.SUCCESS)


} catch (error) {
    nodeState.putShared("validationErrorCode", "Error occured while saving account recovery methods");
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error in main execution" + "::" + error);
    action.goTo(nodeOutcome.SUCCESS);
}

function createMFAObjects(mfaMethod, usrKOGID, verifiedAlternateEmail, primaryEmail, telephoneNumber) {
    try {
        if ((mfaMethod === "SMSVOICE" && telephoneNumber != null)) {
            if (!lookupInMFAObject(usrKOGID, telephoneNumber)) {
                createMFAObject(usrKOGID, "SMSVOICE", telephoneNumber, "ACTIVE", true);
            }
        }


        if (mfaMethod === "SECONDARY_EMAIL" && verifiedAlternateEmail != null) {
            logger.debug("mfaMethod: " + mfaMethod)
            createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true);
        }

    } catch (error) {
        nodeState.putShared("validationErrorCode", "Error occured while saving account recovery methods");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in add recovery methods" + "::" + error);
    }

}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);


    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
    logger.debug("KYID auditDetail " + auditData)
  var mfajsonObj = {
        'KOGId': usrKOGID,
        'MFAMethod': method,
        'MFAValue': usrMfaValue,
        'MFAStatus': status,
        'isRecoveryOnly': isRecoveryOnly,
        'createDate': auditData.createdDate,
        'createDateEpoch': auditData.createdDateEpoch,
        'createdBy': auditData.createdBy,
        'createdByID': auditData.createdByID,
        'updateDate': auditData.updatedDate,
        'updateDateEpoch': auditData.updatedDateEpoch,
        'updatedBy': auditData.updatedBy,
        'updatedByID': auditData.updatedByID
    };

    // var mfajsonObj = {
    //    'KOGId': usrKOGID,
    //    'MFAMethod': method,
    //    'MFAValue': usrMfaValue,
    //    'MFAStatus': status,
    //    'isRecoveryOnly': isRecoveryOnly
    // };
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is " + usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function createOrUpdateSecondaryEmailMFA(usrKOGID, verifiedAlternateEmail) {
    try {
        logger.debug("Checking existing SECONDARY_EMAIL MFA for KOGID: " + usrKOGID);

        var queryResp = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "SECONDARY_EMAIL"'
        }, ["*"]);

        var foundActive = false;

        if (queryResp && queryResp.result.length > 0) {
            for (var i = 0; i < queryResp.result.length; i++) {
                var existingMFA = queryResp.result[i];
                logger.debug("Inspecting existing SECONDARY_EMAIL MFA: " + JSON.stringify(existingMFA));
                var auditDetails = require("KYID.2B1.Library.AuditDetails")
                var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                logger.debug("KYID auditDetail " + JSON.stringify(auditData))
                if (existingMFA.MFAStatus === "ACTIVE") {
                    foundActive = true;
                    if (existingMFA.MFAValue !== verifiedAlternateEmail) {
                        var patchObj = [{
                            "operation": "replace",
                            "field": "/MFAValue",
                            "value": verifiedAlternateEmail
                        },
                        {
                            operation: "replace",
                            field: "/updateDateEpoch",
                            value: auditData.updatedDateEpoch
                        },
                        {
                            operation: "replace",
                            field: "/updatedByID",
                            value: auditData.updatedByID
                        },
                        {
                            operation: "replace",
                            field: "/updateDate",
                            value: auditData.updatedDate
                        },
                        {
                            operation: "replace",
                            field: "/updatedBy",
                            value: auditData.updatedBy
                        },];
                        openidm.patch("managed/alpha_kyid_mfa_methods/" + existingMFA._id, null, patchObj);
                        logger.debug("Patched existing ACTIVE SECONDARY_EMAIL MFA with new value");
                    } else {
                        logger.debug("ACTIVE SECONDARY_EMAIL MFA already has the correct value, no update needed");
                    }
                    // Exit loop after updating the first ACTIVE record
                    break;
                }
            }

            if (!foundActive) {
                logger.debug("No ACTIVE SECONDARY_EMAIL MFA found, creating a new one");
                createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true);
            }
        } else {
            logger.debug("No existing SECONDARY_EMAIL MFA found, creating new one");
            createMFAObject(usrKOGID, "SECONDARY_EMAIL", verifiedAlternateEmail, "ACTIVE", true);
        }
    } catch (error) {
        nodeState.putShared("validationErrorCode", "Error occurred while saving SECONDARY_EMAIL recovery method");
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::error in SECONDARY_EMAIL MFA handling::" + error);
    }
}