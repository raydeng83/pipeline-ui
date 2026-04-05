var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// var lib = require("KYID.Library.FAQPages");
// var process ="AccountRecovery";
// var pageHeader= "3_account_recovery";
// //var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

//Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Account Recovery Forgot Email",
    script: "Script",
    scriptName: "kyid.2B1.Journey.ForgotEmail.CheckSelectedMFAOption",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    EMAIL:"email",
    PHONE:"phone",
    IDENTITY_PROOFING:"identity_proofing",
    HELPDESK:"helpdesk",
    ERROR:"error"
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

try
{
    var selectedMFAOption=nodeState.get("selectedMethod");
    logger.debug("selectedMFAOption is :: " + selectedMFAOption)
    nodeState.putShared("journeyName","accountRecovery")
    if(selectedMFAOption=="email"){
    nodeState.putShared("method", "alternatemail")
    action.goTo(NodeOutcome.EMAIL);
    }else if(selectedMFAOption=="phone"){
    action.goTo(NodeOutcome.PHONE);
    }else if(selectedMFAOption=="identity_proofing") {
     nodeState.putShared("journeyName","forgotemail")
     action.goTo(NodeOutcome.IDENTITY_PROOFING);
    }else if (selectedMFAOption=="helpdesk"){
    action.goTo(NodeOutcome.HELPDESK);
    }else{
    action.goTo(NodeOutcome.ERROR);
    }
}

catch(e){
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Main script error: " + e);
    action.goTo(NodeOutcome.ERROR);
    
}


