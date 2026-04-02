var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Show Changelog",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Changelog",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.start);
function main(){
    try{
        if (callbacks.isEmpty()) {

         
          if(nodeState.get("changeLog")!==null && nodeState.get("changeLog")){
              var changeLog = nodeState.get("changeLog")
              callbacksBuilder.textOutputCallback(0, "Your personal information has been modified. Do you want to save it?"); 
              callbacksBuilder.textOutputCallback(0, "Y0u have edited the following items"); 
              callbacksBuilder.textOutputCallback(0, JSON.stringify(changeLog)); 
          }
          callbacksBuilder.confirmationCallback(0, ["Yes, save", "No, go back"], 0);
        }else{
          var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
            if(selectedOutcome === 0){
               action.goTo(NodeOutcome.NEXT)
            }else if(selectedOutcome === 1){
               action.goTo(NodeOutcome.BACK);     
            }
        }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::Error Occurred in handleUserResponses Function::" + error);
    }

}

main()