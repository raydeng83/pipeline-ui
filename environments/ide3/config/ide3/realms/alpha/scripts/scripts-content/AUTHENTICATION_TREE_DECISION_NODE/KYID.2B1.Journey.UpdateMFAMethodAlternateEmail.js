var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Update MFA Method",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFA.UpdateMFAMethodAlternateEmail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};


var NodeOutcome = {
    SUCCESS: "True",
    FAILED: "False",
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


// Main Execution
var errMsg = {};
var libError = null;
var msg = null;
var outcome = NodeOutcome.FAILED;
libError = require("KYID.2B1.Library.Loggers");
var mfaMethod = nodeState.get("MFAmethod");
var usrKOGID = nodeState.get("KOGID");
var mail = nodeState.get("mail");
logger.debug("mfaMethod " + mfaMethod);


if (mfaMethod) {
    if (mfaMethod == "SECONDARY_EMAIL") {
        var secondaryEmail = nodeState.get("alternateEmail");
        var result = registerMFAMethod(mfaMethod, usrKOGID, secondaryEmail);
        if (result) {
            errMsg["code"] = "INF-PRE-SYS-001";
            errMsg["message"] = libError.readErrorMessage("INF-PRE-SYS-001");
            errMsg["MFAMethod"] = "SECONDARY_EMAIL";
            nodeState.putShared("MFAMethodRegisterd", JSON.stringify(errMsg));
            nodeState.putShared("limit", null);
            nodeState.putShared("emailId", secondaryEmail);
            nodeState.putShared("actionFlag", "2");
            auditLog("PRO005", "Add Additional Account Recovery Method");
            outcome = NodeOutcome.SUCCESS;
        }
        else {
            action.goTo(outcome);
        }
    }
    else {
        logger.debug("Outcome is " + outcome);
        action.goTo(outcome);
    }
}
else {
    action.goTo(outcome);
}



// Functions
function registerMFAMethod(mfaMethod, usrKOGID, secondaryEmail) {
    try {
        logger.debug("inside try");
        if (mfaMethod === "SECONDARY_EMAIL" && secondaryEmail != null) {
            logger.debug("inside if");
            if (!lookupInMFAObject(usrKOGID, secondaryEmail, mfaMethod)) {
                var createResult = createMFAObject(usrKOGID, "SECONDARY_EMAIL", secondaryEmail, "ACTIVE", true);
                logger.debug("createResult" + JSON.stringify(createResult));
                if (createResult._id) {
                    return true;
                }
                else {
                    return false;
                }

            }
            else {
                errMsg["code"] = "ERR-MFA-MAIL-002";
                errMsg["message"] = libError.readErrorMessage("ERR-MFA-MAIL-002");
                nodeState.putShared("errorMessage", JSON.stringify(errMsg));
                return false;
            }
        }
        else {
            return false;
        }


    } catch (error) {
        // logger.error("Error Occured"+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "error ocuured in createMFAObjects" + "::" + error);
    }



}

function createMFAObject(usrKOGID, method, usrMfaValue, status, isRecoveryOnly) {
    logger.debug("MFA Method is being registered for " + usrKOGID + " and the method is " + method + " and value is " + usrMfaValue);

    var auditDetails = require("KYID.2B1.Library.AuditDetails")
    var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
    logger.debug("KYID auditDetail " + auditData)

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

        logger.error("emailPhoneRiskIndicator :: " + JSON.stringify(emailPhoneRiskIndicator))
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
        'updatedByID': auditData.updatedByID,
        'transactionId': transactionIdLN || "",
        'risk': risk || "",
        'requestStatus': requestStatus || "",
        'riskReason': riskReason || "",
        'riskReasonID': riskReasonId || "",
        'riskReasonDescription': riskReasonDescription || "",
        'riskBand,': riskBand || "",
        'failureReason': failureReason || "",
        'riskIndicator': emailPhoneRiskIndicator.riskIndicator || []
    };
    // var mfajsonObj = {
    //     'KOGId': usrKOGID,
    //     'MFAMethod': method,
    //     'MFAValue': usrMfaValue,
    //     'MFAStatus': status,
    //     'isRecoveryOnly': isRecoveryOnly

    // };

    logger.debug("mfajsonObj is :: " + JSON.stringify(mfajsonObj))
    var result = openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
    logger.debug("result of the openidm create" + JSON.stringify(result));
    return result;
}

function lookupInMFAObject(usrKOGID, usrMfaValue, mfaMethod) {
    logger.debug("MFA Method is being looked up for " + usrKOGID + " and value is " + usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
    logger.debug("mfaMethodResponses" + mfaMethodResponses);
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0 && mfaMethodResponse["MFAMethod"].localeCompare(mfaMethod) === 0) {
                return true;
            }
        }
    }
    return false;
}

function auditLog(code, message) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        logger.debug("nodeState" + nodeState.get("browser"));
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = nodeState.get("browser") || "";
        eventDetails["OS"] = nodeState.get("os") || "";
        eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFAMethod"] = nodeState.get("MFAmethod") || null;
        eventDetails["MFATYPE"] = "Email"
        var sessionDetails = {}
        var sessionDetail = null;
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = {
                "sessionRefId": ""
            }
        }

        userQueryResult = openidm.query("managed/alpha_user", {
            _queryFilter: 'userName eq "' + usrKOGID + '"'
        }, ["_id"]);
        requesteduserId = userQueryResult.result[0]._id;
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var userEmail = nodeState.get("mail") || "";
        if (typeof existingSession != 'undefined') {
            userId = existingSession.get("UserId")
        } else if (nodeState.get("_id")) {
            userId = nodeState.get("_id")
        }
        auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, requesteduserId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log additonal recovery method" + error)
        //action.goTo(NodeOutcome.SUCCESS);
    }

}
