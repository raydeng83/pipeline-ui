/**
 * Script: KYID.2B1.Journey.ListVerifiedPrerequisites
 * Description: This script is used to obtain list of verified prerequisites.
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
  timestamp: dateTime,
  serviceType: "Journey",
  serviceName: "kyid_2B1_VerifiedPrerequisites",
  node: "Node",
  nodeName: "Script - Retry",
  script: "Script",
  scriptName: "KYID.2B1.Journey.Retry",
  begin: "Begin Function Execution",
  function: "Function",
  functionName: "",
  end: "Function Execution Completed",
};

// Node outcomes
var nodeOutcome = {
    RETRY: "retry",
    ERROR: "error"
};

//Main function
function main() {
    var errorMesage = null;
    try{
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
        nodeLogger.log("error", nodeConfig, "begin", txid);
        if(nodeState.get("retry")!= null && nodeState.get("retry") === true){
            if(callbacks.isEmpty()){
            errorMesage = nodeState.get("readErrMsgFromCode");
            callbacksBuilder.textOutputCallback(0,errorMesage);
            callbacksBuilder.confirmationCallback(0, ["Retry"], 0); 
            }else{
                selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
                if(selectedOutcome === 0){
                    action.goTo(nodeOutcome.RETRY);
                }
            }
        }else{
            action.goTo(nodeOutcome.ERROR);
        }
        
    }catch(error){
      nodeLogger.log("error", nodeConfig, "end", txid, "Error in try: " + error);
      action.goTo(nodeOutcome.ERROR);    
    }
}


// Invoking main function
main();

