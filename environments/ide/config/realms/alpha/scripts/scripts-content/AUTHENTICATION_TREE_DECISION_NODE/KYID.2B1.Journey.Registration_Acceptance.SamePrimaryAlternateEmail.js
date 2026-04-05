/**
 * Script: KYID.2B1.Journey.SamePrimaryandSecondaryEmail
 * Description: This script checks if the primary email is used as the secondary email and prompts the user to try again with a different email.
 * Node Outcome:
 * - Try Again: "try again"
 */
var dateTime = new Date().toISOString();
var libError = require("KYID.2B1.Library.Loggers");
var errMsg = {};
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "PrimaryAlternateEmailSame",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance.SamePrimaryAlternateEmail",
    script: "Script",
    timestamp: dateTime,
    exceptionErrMsg: "Error during execution: ",
    end: "Node Execution Completed"
};

// Node Outcomes
var nodeOutcome = {
    TRY_AGAIN: "tryAgain"
};

// Logging Function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

try {
    var mail = null;
    var firstTimeLoginJourney = null;
    if(nodeState.get("collectedPrimaryEmail") != null){
        mail = nodeState.get("collectedPrimaryEmail")
    }
     if(nodeState.get("primaryEmail") != null){
        mail = nodeState.get("primaryEmail")
    }
    logger.debug("firstTimeLoginJourney" +nodeState.get("firsttimeloginjourney"));
    firstTimeLoginJourney =  nodeState.get("firsttimeloginjourney");
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Primary email: " + mail);
    if(firstTimeLoginJourney === "true"){
         logger.debug("inside first time login journey if");
		 errMsg["code"] = "WRN-REG-EML-001";
         errMsg["message"] = libError.readErrorMessage("WRN-REG-EML-001"); 
         nodeState.putShared("errorMessage", JSON.stringify(errMsg));
         action.goTo(nodeOutcome.TRY_AGAIN);
    }
    else{
    if (callbacks.isEmpty()) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "displaying primary email prompt");

        callbacksBuilder.textOutputCallback(0, "primary_mail_ " + mail.bold() + "_same_as_secondary_mail");
        callbacksBuilder.confirmationCallback(0, ["Try with different email"], 0);
    } else {
        var option = callbacks.getConfirmationCallbacks()[0];

        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User response option: " + option);

        if (option === 0) {

            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User chose to try with a different email. Proceeding to TRY_AGAIN outcome");

            action.goTo(nodeOutcome.TRY_AGAIN);
        }
    }
    }
} catch (error) {
    nodeLogger.error(nodeConfig.exceptionErrMsg + error);
    action.goTo(nodeOutcome.TRY_AGAIN);
}