var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Pre JIT Provisioning",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AppEnroll.Pre.JIT.Provisioning",
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
    var jitArray = [];
    var parsedJITArray = null;
    var counter = Number(nodeState.get("counter")) || 0;
    try {
        logger.debug("jitArray is :: "+ nodeState.get("jitArray"))
        if(nodeState.get("jitArray") && nodeState.get("jitArray")!=null){
            jitArray = nodeState.get("jitArray")
            logger.debug("parsedJITArray is :: "+ Array.isArray(jitArray))
            logger.debug("counter :: "+ typeof counter)
            nodeState.putShared("counter", counter);
            nodeState.putShared("totalJITRecords", jitArray.length);
            nodeState.putShared("kogUserProfileAPIResponse", jitArray[counter])
            action.goTo("jitProvisioning");
        }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error);
        action.goTo("error");
    }
}

main()