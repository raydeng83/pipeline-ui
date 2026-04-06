var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check Existing Phone Number",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Registration_Acceptance_PhoneRegistration.CheckExistingPhoneNumber",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
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
    },
    info: function (message) {
        logger.info(message);
    }
}

function lookupInPhone(telephoneNumber) {
    var mfaMethodResponses = openidm.query("managed/alpha_user", { "_queryFilter": '/telephoneNumber eq "' + telephoneNumber + '"' });
    var mfaMethodResponsesLength = mfaMethodResponses.result.length;
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "mfaMethodResponsesLength is ::" +mfaMethodResponsesLength );
    if(mfaMethodResponsesLength > 1 ){
        return true;  
    }
    else if(mfaMethodResponsesLength > 0){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Collected Primary Email is ::" +nodeState.get("collectedPrimaryEmail") );
       if(mfaMethodResponses.result[0].mail == nodeState.get("collectedPrimaryEmail")){
           return false;
       }
        else{
            return true;
        }
    }
    else{
        return false;
    }
    
}

try {
    // Main Execution
var isPhoneEditable = null;
var telephoneNumber = nodeState.get("telephoneNumber");
if(nodeState.get("isPhoneEditable") != null){
    isPhoneEditable = nodeState.get("isPhoneEditable");
}
logger.debug("isPhoneEditable value is ::" + isPhoneEditable)
if(isPhoneEditable == "false"){
    action.goTo(NodeOutcome.FALSE);
}
else{
    var isPhoneResgistered = lookupInPhone(telephoneNumber);
    logger.debug("isPhoneResgistered is :: " +isPhoneResgistered )
    if (isPhoneResgistered == true){
        nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "phone number is already registered" );
        action.goTo(NodeOutcome.TRUE);
    }
    else{
       action.goTo(NodeOutcome.FALSE); 
    }
    
}
    
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "error in main execution"+error);
    action.goTo(NodeOutcome.ERROR);
}









