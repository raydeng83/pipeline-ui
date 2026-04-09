var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "IDProofing Popup",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Popup",
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

nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.start);
function main(){
    try{
     var lib = require("KYID.Library.FAQPages");
     var process ="IDProofing";
     var pageHeader= "1_IDProofing_Popup";
     var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
         logger.debug("getFaqTopicId : "+getFaqTopicId);
            if (callbacks.isEmpty()) {
              callbacksBuilder.textOutputCallback(1, '{"pageHeader":"1_IDProofing_Popup"}'); 
            if (getFaqTopicId != null) {
            callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
           }
        }else{
          action.goTo(NodeOutcome.NEXT);  
        }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::Error Occurred in handleUserResponses Function::" + error);
    }

}

main()