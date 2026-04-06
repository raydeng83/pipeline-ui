/**
 * Script: KYID.2B1.Journey.PrerequisiteRoleRequestStatus
 * Description: This script is used to obtain the role request workflow status.
 * Author: Deloitte
 */


//Global Variables
var dateTime = new Date().toISOString();   // Compute current system timestamp
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");    // Journey Transaction ID


// Node Config
var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Prerequisite Role Request Workflow Status",
    script: "Script",
    scriptName: "KYID.2B1.Journey.PrerequisiteRoleRequestStatus",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
};


// Node outcomes
var NodeOutcome = {
    BACK:"Back",
    ERROR: "Error"
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


function requestCallbacks() {

    logger.debug("inside requestCallbacks");
    var prereqtype = null;
    var contextID = null;
    var userId = null;
    var requestId = null;
    var response = null;
    
    try {
        prereqtype = nodeState.get("prereqtype").toLowerCase();
        contextID = nodeState.get("prereqContextID");
        userId = nodeState.get("userIDinSession");
        requestId = getRequestId(contextID,prereqtype,userId);
        logger.debug("requestId in KYID.2B1.Journey.get_request_status - "+requestId)
        callbacksBuilder.textOutputCallback(1, "get_request_status");
        //callbacksBuilder.textOutputCallback(0, response )
        response = getRequestStatus(requestId);
        
        if(response == false){
            callbacksBuilder.textOutputCallback(0, "unexpected_error_occured" )  
        }
        else {
            callbacksBuilder.textOutputCallback(0, response )
        }
        
        callbacksBuilder.confirmationCallback(0, ["Back"], 0); 
        
    } catch(error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName 
                         +"::"+"Error requestCallback Function - " +error.message);
        action.goTo(NodeOutcome.ERROR);        
    }
    
}


function handleUserResponses() {

    var selectedOutcome = null;
    
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            action.goTo(NodeOutcome.BACK);
        }
                
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName 
                         + "::" +"error occurred in handleUserResponses function - "+ error);
        action.goTo(NodeOutcome.ERROR);        
    }
    
}


function getRequestStatus(requestId) {

    var response = null;
    
    try {
         response = openidm.action('endpoint/roleRequestInfo', 'POST', { requestId: requestId });
         if (response.code == -1){
             return false;
         }
         else{
             return response;
         }

    } catch (error) {
        return false;   
        action.goTo(NodeOutcome.ERROR);        
    }
}


function getRequestId(id,type,userID) {

    var response = null;
    
    try {
        if(nodeState.get("_idWorkflow")!==null){
             response = openidm.query("managed/alpha_kyid_request", {"_queryFilter": '_id eq "' + nodeState.get("_idWorkflow") + '"'}, ["requestId"]);    
        }else{
             response = openidm.query("managed/alpha_kyid_request", {
                "_queryFilter": 'contextid eq "' + id + '"'
                    + 'and type eq "' + type + '"'
                    + 'and requester eq "' + userID + '"'
            }, ["requestId"]);
        }
        
        // response = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
        //     + 'and type eq "'+type+'"' 
        //     + 'and requester eq "'+userID+'"'}, ["requestId"]);
        
        if(response != null){
            return (JSON.parse(JSON.stringify(response.result[0]))["requestId"]);
        } else{
            return "-1"
        }
     } catch (error) {
        logger.error("Error occurred - "+ error);
        return "-1";   
        action.goTo(NodeOutcome.ERROR);        
    }
}


function main(){

  try { 
     if(callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch(error) {
       nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName 
                        + "::" + nodeConfig.end +"::"+"Error in main execution - " +error.message );
       action.goTo(NodeOutcome.ERROR);
  }
}


//Invoke Main Function
main();

