var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var flowName = nodeState.get("flowName")

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Navigate",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Navigate",
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


if(nodeState.get("FARS")==="1"){
    nodeState.putShared("FARS",null) 
    action.goTo("FARS")
}else if(nodeState.get("displayFARS2")==="true"){
    action.goTo("FARS")
}else if(nodeState.get("KBABack")==="true"){
    nodeState.putShared("KBABack",null)
    action.goTo("KBABack")
}else if(nodeState.get("journeyName") === "updateprofile"){
    nodeState.putShared("unableToVerify",null)
    action.goTo("Next")  
}else if(flowName.toLowerCase() === "mfarecovery" || (flowName.toLowerCase() === "firsttimelogin" && nodeState.get("isMFARecovery") == "true")) {
    action.goTo("Next")
}else if(nodeState.get("unableToVerify")==="true"){
    nodeState.putShared("unableToVerify",null)
    nodeState.putShared("IDProofingAnotherMethod","true")
    action.goTo("anotherMethod")
}else if(nodeState.get("journeyName") === "accountRecovery" || nodeState.get("flowName") === "forgotemail"){
    //Retry is used but it means different method, for code reusability
       if(nodeState.get("userSelection")=="retry"){
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User selected to different method the Verification Method, Going to different method");
            //nodeState.putShared("userSelection",null)
            action.goTo("anotherMethod")
       }else{
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " User Verification completed successfully, Going to message node");
            action.goTo("Next")
        }
}else{
    action.goTo("Next")
}
