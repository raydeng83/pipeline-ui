var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Flow Decision Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Flow.Decision.Node",
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

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    var flowName = null;
    try {
        flowName = nodeState.get("flowName");
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Flow Name Retrieved: " + flowName);
        if(flowName && flowName !==null && flowName !==""){ 
            if(flowName.toLowerCase() === "createaccount") {
                action.goTo("createAccount");
            }else if(flowName.toLowerCase() === "firsttimelogin" && !nodeState.get("isMFARecovery")) {
                action.goTo("firstTimeLogin");
            }else if(flowName.toLowerCase() === "forgotemail") {
                action.goTo("forgotEmail");
            }else if(flowName.toLowerCase() === "forgotpassword") {
                action.goTo("forgotPassword");
            }else if(flowName.toLowerCase() === "mfarecovery" || (flowName.toLowerCase() === "firsttimelogin" && nodeState.get("isMFARecovery") == "true")) {
                nodeState.putShared("flowName","mfarecovery")
                action.goTo("mfarecovery");
            }else if(flowName.toLowerCase() === "updateprofile") {
                action.goTo("updateprofile");
            }else if(flowName.toLowerCase() === "organdonor") {
                action.goTo("organdonor");
            }else if(flowName.toLowerCase() === "appenroll"){
                action.goTo("appenroll");
            }else if (flowName.toLowerCase() === "userverification"){
                action.goTo("userVerification");
            }else if (flowName.toLowerCase() === "standaloneridp"){
                action.goTo("standaloneRIDP");
            }else{
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "No Matching Flow Name Found");
                action.goTo("error");
            }
        }else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Flow Name is Null or Undefined");
            action.goTo("error");
        }
    }catch (error) {
            nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error);
            action.goTo("error");
        }
    }

main();