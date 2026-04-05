logger.debug("**********start sessionAssuranceLevelforMFA****************")
var dateTime = new Date().toISOString();
var auditLib = require("KYID.2B1.Library.AuditLogger")

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFA Authentication sessionAssuranceLevelforMFA Email",
    script: "Script",
    scriptName: "KYID.2B1.Journey.sessionAssuranceLevelforMFA.Email",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true"
};
var userId = nodeState.get("userId") || null
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
var eventDetails = {
    applicationId : nodeState.get("appName") || "",
    MFAMethod : "EMAIL"
    };
var sessionDetails = null
nodeState.putShared("MFAMethod","EMAIL")
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
// auditLib.auditLogger("MFA009",sessionDetails,"MFA Authentication Success", eventDetails, userId, userId, transactionId)
action.goTo(NodeOutcome.SUCCESS).putSessionProperty('sessionAssuranceLevelforMFA', "3");
logger.debug("**********end sessionAssuranceLevelforMFA****************")
