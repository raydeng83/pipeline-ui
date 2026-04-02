var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Unable To Verify",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.App.Enroll.UnableToVerify",
    timestamp: dateTime,
    end: "Node Execution Completed"
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


function main(){
    var ridpReferenceID = null;
    var jsonobj = {};
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside main function");
        var pageHeader = {"pageHeader":"Unable to Verify Identity"};
        callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
        jsonobj["Flow"]=nodeState.get("flowName");
        jsonobj["ErrorMsg"] ="We are unable to verify your identity based on the submitted information. Please contact KYID Help desk with the following reference code for further assistance."
        jsonobj["HelpDeskContactId"] ="b93154a8-a55f-4e4e-8769-bdad375eb852";
        jsonobj["TransactionId:"] = ridpReferenceID;
        jsonobj["TransactionDateTime"]=dateTime;
        jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress");
        jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
        jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
        var refernceObj = {"referenceId": ridpReferenceID}
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error in main Function" + error.message);
    }
}

main()