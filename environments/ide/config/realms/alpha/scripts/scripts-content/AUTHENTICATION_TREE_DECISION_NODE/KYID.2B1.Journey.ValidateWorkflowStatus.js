/**
* Script: KYID.2B1.Journey.ValidateWorkflowStatus
* Description: This script is used to obtain the latest status of workflow and to update the prerequisite request status to complete, after it's approved by the approvers.
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Validate Workflow Status",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ValidateWorkflowStatus",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "Next",
     ERROR: "Error"
 };

 function main(){
     
     //Function Name
     nodeConfig.functionName = "main()";

     //Local Variables
     var roleRequestId =null;
     var status = null;
     var decision = null;
     var decisionResponse = null;
     var prereqtype= null;
     var contextID = null;
     var roleId = null;
     var userId = null;

     if(nodeState.get("prereqtype")!=null && nodeState.get("prereqtype")){
        prereqtype = nodeState.get("prereqtype").toLowerCase();
     } else {
        action.goTo(nodeOutcome.ERROR);
     }
    
     if(nodeState.get("roleIDinSession")!=null && nodeState.get("roleIDinSession")){
        roleId = nodeState.get("roleIDinSession");
     } else {
        action.goTo(nodeOutcome.ERROR);
     }

     if(nodeState.get("userIDinSession")!=null && nodeState.get("userIDinSession")){
        userId = nodeState.get("userIDinSession");
     } else {
        action.goTo(nodeOutcome.ERROR);
     }

     if(nodeState.get("prereqContextID")!=null && nodeState.get("prereqContextID")){
        contextID = nodeState.get("prereqContextID");
     } else {
        action.goTo(nodeOutcome.ERROR);
     }
     
     logger.debug("prereqtype ::  "+prereqtype+ "|"+"roleId ::  "+roleId+ "|"+"userId :: "+userId+ "|" +"contextID :: "+contextID )
    
     if (nodeState.get("roleRequestId") != null){
        roleRequestId = nodeState.get("roleRequestId");
     }
     else{
         if(nodeState.get("_idWorkflow")!==null){
        roleRequestId=  getRequestId(contextID, type, uuid, nodeState.get("_idWorkflow"))
                }else{
        roleRequestId = getRequestId(contextID,prereqtype,userId)
         }
     }
     
     logger.debug("Request Id ValidateWorkflowStatus "+roleRequestId );
     decisionResponse = JSON.parse(getRequestStatus(roleRequestId));
     status = decisionResponse.status;
     decision = decisionResponse.decision;
     
     logger.debug("Status of request is ::"+status);
     if(status === "in-progress" && decision === "approved" ){
       patchPrerequisiteRequestStatus(contextID,userId,prereqtype,nodeState.get("_idWorkflow") );
       action.goTo(nodeOutcome.SUCCESS);
     
     } else if(status === "in-progress" && decision === null){
        action.goTo(nodeOutcome.SUCCESS); 
     }
         
    else{
        action.goTo(nodeOutcome.SUCCESS); 
    }
 }
 


function getRequestStatus(requestId) {
    
    try {
        var response = openidm.action('endpoint/roleRequestInfo', 'POST', { requestId: requestId });
        if (response.code == -1){
            return false;
         } else{
            logger.debug("Resposne is +"+ response)
            return response.response.decision;
         } 
    } catch (error) {
        return false;   
    }
}


function getRequestId(id,type,userID) {
    
    try {
        
        if(nodeState.get("_idWorkflow")!==null){
            var record = openidm.query("managed/alpha_kyid_request", {"_queryFilter": '_id eq "' + workflowId + '"'}, ["requestId"]);    
        }else{
            var record = openidm.query("managed/alpha_kyid_request", {
                "_queryFilter": 'contextid eq "' + id + '"'
                    + 'and type eq "' + type + '"'
                    + 'and requester eq "' + userID + '"'
            }, ["requestId"]);
        }
        if(response != null){
            return (JSON.parse(JSON.stringify(response.result[0]))["requestId"]);
        } else{
            return "-1"
        }
     } catch (error) {
        logger.error("Error occurred "+ error);
        return "-1"   
    }
}


function patchPrerequisiteRequestStatus(id,userID,type, workflowId){
    logger.debug("Inside patchPrerequisiteRequestStatus")
    var status = "COMPLETED";
    var recordRequest = null; 
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");
    try{
         if(nodeState.get("_idWorkflow")!==null){
             recordRequest = openidm.query("managed/alpha_kyid_request", {"_queryFilter": '_id eq "' + workflowId + '"'}, ["contextid", "type", "requester", "status"]);   
         }else{
             recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+userID+'"'}, ["contextid", "type", "requester", "status"]);
         }
        
        logger.debug("Successfully queried record in alpha_kyid_request managed object :: "+JSON.stringify(recordRequest));
        recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
        logger.debug("Resource ID - "+recordRequestJSONObj["_id"]);
        contentArray.push({
           "operation" : "replace",
           "field" : "status",
            "value" : status
        }) ;

        contentArray.push({
           "operation" : "replace",
            "field" : "updatedate",
            "value" : new Date().toISOString()
        }) ;
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"]);
        
    } catch(error){
         logger.error( "::" + error);
    }  
}


//Invoke Main Function
main();


