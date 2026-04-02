/**
* Script: KYID.2B1.Journey.ReadMFAIDInfo
* Description: This script is used to read userID information from existing session.        
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_RemoveMFAMethods_Helpdesk",
    node: "Node",
    nodeName: "Fetch mfa id from query param",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ReadMFAIDInfo",
    begin: "Begin Function Execution",
    function: "Function",
    functionName: "",
    end: "Function Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Success",
    ERROR: "Error"
};

/**
 * Fetch MFA Method record from managed object
 */
function fetchMFAIDFromMO(id) {
    try {
        var mfaQueryResult = openidm.query(
            "managed/alpha_kyid_mfa_methods",
            { _queryFilter: '_id eq "' + id + '"' },
            ["*"]
        );

        if (mfaQueryResult.result && mfaQueryResult.result.length > 0) {
            var record = mfaQueryResult.result[0];
            var KOGID = record.KOGId || null;
            var MFAMethod = record.MFAMethod || null;
            var MFAValue = record.MFAValue || null;

            nodeState.putShared("removeMfaMethod", MFAMethod);
            nodeState.putShared("KOGID", KOGID);
            nodeState.putShared("removeMFAValue", MFAValue);

            return record;
        } else {
            logger.debug("fetchMFAIDFromMO: No MFA record found for id=" + id);
            return null;
        }
    } catch (error) {
        logger.error("Error in fetchMFAIDFromMO: " + error);
        return null;
    }
}

function fetchEndUserDetails(KOGID) {
    try {
        var userQueryResult = openidm.query(
            "managed/alpha_user",
            { _queryFilter: 'userName eq "' + KOGID + '"' },
            ["mail", "sn", "givenName"]
        );

        if (userQueryResult.result && userQueryResult.result.length > 0) {
            var user = userQueryResult.result[0];
            nodeState.putShared("mail", user.mail);
            nodeState.putShared("givenName", user.givenName);
            nodeState.putShared("sn", user.sn);

            logger.debug("fetchEndUserDetails: Found user for KOGID=" + KOGID);
            return user;
        } else {
            logger.debug("fetchEndUserDetails: No user found for KOGID=" + KOGID);
            return null;
        }
    } catch (error) {
        logger.error("Error in fetchEndUserDetails: " + error);
        return null;
    }
}


/**
 * Main execution
 */
function main() {
    nodeConfig.functionName = "main()";
    var txid = null;
    var nodeLogger = null;

    try {
        // DO NOT CHANGE THESE LINES
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
        nodeLogger = require("KYID.2B1.Library.Loggers");
        nodeLogger.log("debug", nodeConfig, "begin", txid);

        if (requestParameters.get("mfaid")) {
            var mfaId = requestParameters.get("mfaid")[0];
            nodeState.putShared("mfaidremoval",mfaId)
            var MFAIDInfo = fetchMFAIDFromMO(mfaId);

            logger.debug("MFAIDInfo: " + JSON.stringify(MFAIDInfo));
            logger.debug("Param Value: " + mfaId);

            if (MFAIDInfo && MFAIDInfo.KOGId) {
                fetchEndUserDetails(MFAIDInfo.KOGId);
            }
            
            action.goTo(nodeOutcome.SUCCESS);
        } else {
            logger.debug("No mfaid parameter found in request");
            action.goTo(nodeOutcome.ERROR);
        }

    } catch (error) {
        var errMsg = nodeLogger.readErrorMessage("KYID100");
        nodeState.putShared("readErrMsgFromCode", errMsg);

        nodeLogger.log("error", nodeConfig, "mid", txid, error);
        nodeLogger.log("error", nodeConfig, "end", txid);

        action.goTo(nodeOutcome.ERROR);
    }
}

// Invoke Main
main();
