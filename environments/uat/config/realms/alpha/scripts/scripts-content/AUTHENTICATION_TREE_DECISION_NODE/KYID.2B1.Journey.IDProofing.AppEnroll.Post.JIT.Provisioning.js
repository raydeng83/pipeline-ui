var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Post JIT Provisioning",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.AppEnroll.Post.JIT.Provisioning",
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
    var createdIDArray = null;
    try{
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
        logger.debug("createdIDArray is :: "+ nodeState.get("createdIDArray"))
        logger.debug("counter is :: "+ nodeState.get("counter"))
        createdIDArray = [];
        if(nodeState.get("createdIDArray")){
            createdIDArray = JSON.parse(nodeState.get("createdIDArray"))
        }
        if(nodeState.get("counter")!==null){
            var counter = Number(nodeState.get("counter"));
            counter = counter + 1;
            logger.debug("counter is :: "+ counter);
            logger.debug("createdIDArray before push is :: "+ nodeState.get("usrcreatedId"));
            logger.debug("createdUserMail before push is :: "+ nodeState.get("createdUserMail"));
            logger.debug("createdMailArray before push is :: "+ nodeState.get("createdMailArray"));
            var usrcreatedId = nodeState.get("usrcreatedId");
            var createdUserMail = nodeState.get("createdUserMail");
            var createdMailArray = nodeState.get("createdMailArray") || []
            if(usrcreatedId && usrcreatedId!=null && usrcreatedId!=""){
                createdIDArray.push(usrcreatedId);
                nodeState.putShared("createdIDArray", JSON.stringify(createdIDArray));
            }
            if(createdUserMail && createdUserMail!=null && createdUserMail!=""){
                createdMailArray.push(createdUserMail);
                nodeState.putShared("createdMailArray", JSON.stringify(createdMailArray));
            }
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Counter Retrieved from Shared State: " + counter);
            if(nodeState.get("totalJITRecords") && nodeState.get("totalJITRecords")!=null){
                var totalJITRecords = Number(nodeState.get("totalJITRecords"))
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Total JIT Records Retrieved from State: " + totalJITRecords);
                if(counter == totalJITRecords){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " All JIT Provisioning Completed ");
                    action.goTo("allJITCompleted");
                }else if(counter < totalJITRecords){
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Proceeding with JIT Provisioning for record number: " + (counter+1));
                    nodeState.putShared("counter", counter);
                    action.goTo("proceedJITProvisioning");
                }else{
                    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Counter exceeded total JIT Records, going to error state");
                    action.goTo("error");
                }
            }
        }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error in Main Function: " + error);
        action.goTo("error");
    }
}
main()