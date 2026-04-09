/**
 * Script: KYID.2B1.Journey.VerifiedPrerequisites.DisplayExistingData
 * Description: This script is used to show list of verified prerequisites.
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
  nodeName: "Script - Display Verified Prerequisites",
  script: "Script",
  scriptName: "KYID.2B1.Journey.VerifiedPrerequisites.DisplayExistingData",
  begin: "Begin Function Execution",
  function: "Function",
  functionName: "",
  end: "Function Execution Completed"
};

// Node outcomes
var nodeOutcome = {
  BACK: "back",
  ERROR: "error"
};

//Main function
function main() {
  var preqData = null;
  var selectedOutcome = null;
  var parsedData = null;
    try{
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
        nodeLogger.log("error", nodeConfig, "begin", txid)

        if(nodeState.get("viewPreqData")!=null && nodeState.get("viewPreqData")){
         preqData = nodeState.get("viewPreqData");
         parsedData = JSON.parse(preqData);
         
            if(callbacks.isEmpty()){
                callbacksBuilder.textOutputCallback(0, preqData);
                callbacksBuilder.confirmationCallback(0, ["Back"], 0);     
            } else {
                selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
                if(selectedOutcome === 0){
                    outcome = "back";
                }
            }
        }else{
            nodeLogger.log("error", nodeConfig, "end", txid); 
            errMsg = nodeLogger.readErrorMessage("KYID100"); 
            nodeState.putShared("readErrMsgFromCode",errMsg);
            nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg)); 
            action.goTo(nodeOutcome.ERROR);  
        }   
    }  catch(error){
      nodeLogger.log("error", nodeConfig, "end", txid, "Error in try: " + error);
      //errMsg = nodeLogger.readErrorMessage("KYID100"); 
      nodeState.putShared("readErrMsgFromCode",error);
      action.goTo(nodeOutcome.ERROR);
    }
}

// Invoking main function
main();