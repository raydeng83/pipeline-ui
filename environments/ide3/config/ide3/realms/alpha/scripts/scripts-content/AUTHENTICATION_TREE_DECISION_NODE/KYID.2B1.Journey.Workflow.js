/**
 * Script: KYID.2B1.Journey.ListPrerequisites
 * Description: This script is used to obtain list of prerequisites.
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config

var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2b1_VerifiedPrerequisites",
    node: "Node",
    nodeName: "List Prerequisites",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Workflow",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
};

var nodeOutcome = {
    NEXT: "next",
    ERROR: "error",
    DONE: "done",
    VIEW_PENDING_APPROVAL: "View pending approval"
};



function getPrereqType(txid,nodeLogger,ops,prereqname){

    //Function Name
      nodeConfig.functionName = "getPrereqType()";
  
    //Local Variables  
    var recordPrereqTypes = null;
      
    try { 
        logger.debug("prereqname is "+prereqname);
            recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisitetype", { "_queryFilter" : '/prereqtypename eq "'+prereqname+'"'}, ["typeofprerequisite"]);
            //logger.debug("Successfully retrieved alpha_kyid_prerequisitetype custom managed object attributes :: "+JSON.stringify(recordPrereqTypes.result));
          logger.debug("recordPrereqTypes.result[0].typeofprerequisite - "+recordPrereqTypes.result[0].typeofprerequisite)
            if(recordPrereqTypes.result[0].typeofprerequisite === "workflow"){
                nodeState.putShared("typeofprerequisite","workflow");
            } else {
                nodeState.putShared("typeofprerequisite","");
            }
          
          
    } catch(error) {
          logger.error('Failed to retrieve alpha_kyid_prerequisitetype custom object attributes, Error -'+ error);
    }
  
}


function patchPrerequisiteCancelRequestStatus(ops,txid,nodeLogger,id,userID,arrPreReqTypes,status){

    //Function Name
    nodeConfig.functionName = "patchPrerequisiteCancelRequestStatus()";

    //Local Variables 
    var type = null;
    var recordRequest = null; 
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    var timestamp = new Date().toISOString();

    try{
        for(var i=0;i<arrPreReqTypes.length;i++){
            type = arrPreReqTypes[i];
             recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+userID+'"'}, ["contextid", "type", "requester", "status"]);
            logger.debug("Successfully queried record in alpha_kyid_request managed object for patch operation:: "+JSON.stringify(recordRequest));
            recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
            logger.debug("Resource ID - "+recordRequestJSONObj["_id"]);
            if(!(recordRequestJSONObj["status"]==="COMPLETED" || recordRequestJSONObj["status"]==="REJECTED")){
                
                contentArray.push({
                   "operation" : "replace",
                   "field" : "status",
                    "value" : status
                }) ;
        
                contentArray.push({
                   "operation" : "replace",
                    "field" : "updatedate",
                    "value" : timestamp
                }) ;

                contentArray.push({
                   "operation" : "replace",
                    "field" : "enddate",
                    "value" : timestamp
                }) ;
                
                ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"]);
            } 
            //patchPrerequisiteStepsCancelRequestStatus(ops,txid,nodeLogger,recordRequestJSONObj["_id"],status);
        } 
        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
    
}




function main(){
    if (callbacks.isEmpty()) {
    getPrereqType(txid,nodeLogger,ops,type.toLowerCase());
            if(nodeState.get("typeofprerequisite") !== null){
            typeofprerequisite= nodeState.get("typeofprerequisite");
            }
        logger.debug("Type of Prereq is - "+typeofprerequisite)
        if(typeofprerequisite === "workflow"){
            if(status === "REJECTED"){
                patchPrerequisiteCancelRequestStatus(ops,txid,nodeLogger,contextID,uuid,arrPreReqTypes,"CANCELLED"); 
                //callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
                    callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
                    callbacksBuilder.confirmationCallback(0, ["Completed"], 0);                     
            }
            else if(status === "PENDING_APPROVAL" ){
                callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
                callbacksBuilder.confirmationCallback(0, ["Start","Cancel","View workflow status"], 0);                     
            } else {
                callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
                callbacksBuilder.confirmationCallback(0, ["Start","Cancel"], 0);
            }
        
        } else{
            logger.debug("Not workflow");
            logger.debug("Response ********* - "+JSON.stringify(response));
            callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            callbacksBuilder.confirmationCallback(0, ["Start","Cancel"], 0);
        }
                        
    } else {
        selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        if(selectedOutcome === 0){
            if(status === "REJECTED"){
            action.goTo(nodeOutcome.DONE); 
            } else if(isAllPrereqStatusCompleted){
            nodeLogger.log("error", nodeConfig, "end", txid);
            action.goTo(nodeOutcome.DONE);     
            } else if(isAllPrereqStatusCancelled){
            nodeLogger.log("error", nodeConfig, "end", txid);
            action.goTo(nodeOutcome.DONE); 
            } else {
            nodeLogger.log("error", nodeConfig, "end", txid);
            action.goTo(nodeOutcome.NEXT);    
            }
        } else if(selectedOutcome === 1){
            if(arrPreReqTypes.length>0){
                if(nodeState.get("PreqRoleRequestId")){
                    logger.debug("Request Id is ----"+nodeState.get("PreqRoleRequestId"))
                    cancelWorkflowRoleRequest(nodeState.get("PreqRoleRequestId"))
                }
                patchPrerequisiteCancelRequestStatus(ops,txid,nodeLogger,contextID,uuid,arrPreReqTypes,"CANCELLED"); 
                isAllPrereqStatusCancelled = statusExistAllPrerequisiteInRequest(txid,nodeLogger,ops,contextID,uuid,arrPreReqTypes.length,"CANCELLED");
                logger.debug("isAllPrereqStatusCancelled return value - "+isAllPrereqStatusCancelled); 
                if(isAllPrereqStatusCancelled){
                    callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
                    callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
                }
                nodeState.putShared("PreqRoleRequestId",null)
                action.goTo(nodeOutcome.DONE); 
            } else {
                errMsg = nodeLogger.readErrorMessage("KYID101"); 
                nodeState.putShared("readErrMsgFromCode",errMsg); 
                nodeLogger.log("error", nodeConfig, "mid", txid, errMsg); 
                nodeLogger.log("error", nodeConfig, "end", txid); 
                action.goTo(nodeOutcome.ERROR);
            }
        }
        else if(selectedOutcome === 2){
            nodeLogger.log("error", nodeConfig, "end", txid);
            action.goTo(nodeOutcome.VIEW_PENDING_APPROVAL); 
        }
    }  
}

//Invoke Main Function
main();