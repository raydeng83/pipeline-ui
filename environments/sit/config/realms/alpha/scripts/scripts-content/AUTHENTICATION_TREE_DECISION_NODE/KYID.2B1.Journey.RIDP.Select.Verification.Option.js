var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select Option ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RIDP.Select.Verification.Option",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    MISSING_MANDATORY: "divert",
    EXIT: "exit",
    changeLog: "changeLog"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

function emptyhandleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.emptyhandleResponse);
    try{
         if((requestParameters.get("context")[0] && requestParameters.get("context")[0] === "manageProfile") || nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyContext") === "ridp"){
              var jsonobj = {"pageHeader": "Select_Verification_Options"};
              callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
              var prompt =  "Select an option to re-verify identity"
              var val1 = "Knowledge Based Questions";
              var val2 = "In-person Verification";
              callbacksBuilder.choiceCallback(`${prompt}`, [val1, val2], 0 ,false) 
              callbacksBuilder.confirmationCallback(0, ["next", "back"], 0);

             //FAQ topic
             var lib = require("KYID.Library.FAQPages");
            var process ="RIDP";
            var pageHeader= "Select_Verification_Options";
            var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

      if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
             
         }else{
             action.goTo("pass");
         }
     }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::KYID.2B1.Journey.RIDP.Select.Verification.Optionn script function emptyHandleResponse:: " + error);
    }
}

function handleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse);
    try{ 
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 1){
            action.goTo("back");
        }else{
             var choice = callbacks.getChoiceCallbacks().get(0)[0];
             if(choice === 0){
                 action.goTo("questions");
             }else if(choice === 1){
                 nodeState.putShared("journeyContext" ,"inperson")
                 action.goTo("in-person");
             }
        }

         }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.RIDP.Select.Verification.Option script function handleResponse:: " + error);
    }
}

function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
        if (callbacks.isEmpty()) {
            emptyhandleResponse()
        } else {   
            handleResponse()
        }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.RIDP.Select.Verification.Option script:: " + error);
    }
}

main();