var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Failed Verification",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Failed.Verification",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};


function main(){
    try{
         if (callbacks.isEmpty()) {
             if(nodeState.get("IDVerificationStatus")==="failed"){
                 callbacksBuilder.textOutputCallback(0,"Failed Verification");
                 callbacksBuilder.textOutputCallback(0,"We are unable to verify your identity based on the information provided");
                 callbacksBuilder.confirmationCallback(0, ["Try with a different method"],0);
            }
         }else{
             var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
             logger.debug("selectedOutcome is :: => "+ selectedOutcome)
             if(selectedOutcome === 0){
                 action.goTo(NodeOutcome.NEXT);
             }
         }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::Error Occurred in main Function::" + error);
    }
    
}

main();