/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script : Check Prereq Status",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.Check.Prereq.Status",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

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


function main(){
   try{
        nodeLogger.error("STarting script " + nodeConfig.scriptName);
        if(nodeState.get("userPrereqId")){
            var isPrereqCompleted = getPrereqStatus(nodeState.get("userPrereqId"))
            if(isPrereqCompleted && isPrereqCompleted == true ){
                   if (callbacks.isEmpty()) {
                        requestCallbacks();
                    } else {
                        handleUserResponses();
                    }
            }
       else if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
            action.goTo("lexisNexisRetry")
       }else{
                action.goTo("CMSFARS")
            }
        }
else if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                action.goTo("lexisNexisRetry")
            }else{
                action.goTo("CMSFARS")
            } 

   } catch(error){
       logger.error("Error in catch of KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

main()

function requestCallbacks (){
    try{

                var response = {
                    "message":"appEnroll_ID_Proofing_Completed",
                            "status":"COMPLETED"
                }
                callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
                callbacksBuilder.confirmationCallback(0, ["Next"], 0);
 

    }catch(error){
        nodeLogger.error("Error Occurred in script "+ nodeConfig.scriptName + " : " + error);   
    }
}

function handleUserResponses(){
    try{
       var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
       if(selectedOutcome === 0){

                action.goTo("PrereqCompleted")

       }
    }catch(error){ 
        nodeLogger.error("Error while parsing user response in "+ nodeConfig.scriptName + " : " + error);
    }
}

function getPrereqStatus(userPrereqId){
    try {
        var prereqResponse = openidm.read("managed/alpha_kyid_enrollment_user_prerequisites/"+userPrereqId, null, null)
        nodeLogger.debug("prereqResponse :"+JSON.stringify(prereqResponse))
        if(prereqResponse && prereqResponse.status && prereqResponse.status && (prereqResponse.status === "COMPLETED" || prereqResponse.status === "2" || prereqResponse.status === "ALREADY_COMPLETED" )){
            return true
        }else{
            return false
        }
    } catch (error) {
        nodeLogger.error("Error Occurred while getPrereqStatus "+ error + "userPrereqId: "+userPrereqId) 
        return false
    }
} 