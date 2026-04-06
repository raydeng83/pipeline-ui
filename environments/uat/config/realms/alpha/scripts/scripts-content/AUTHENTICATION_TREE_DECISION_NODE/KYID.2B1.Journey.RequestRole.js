/**
* Script: KYID.2B1.Journey.RequestRole
* Description: This script is used to create request for role to get access to business application.
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Create Role Request",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RequestRole",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     TRUE: "True",
     FALSE: "False"
 };


function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var roleId = null;
    var userId = null;
    var prereqtype = null;
    //var prereqtype= "kyid_prerequisite_workflow";
    var contextID = null;

    if(nodeState.get("prereqtype")!=null && nodeState.get("prereqtype")){
         prereqtype = nodeState.get("prereqtype").toLowerCase();
    } else {
        action.goTo(nodeOutcome.FALSE);
    }
    
    if(nodeState.get("roleIDinSession")!=null && nodeState.get("roleIDinSession")){
        roleId = nodeState.get("roleIDinSession");
    } else {
        action.goTo(nodeOutcome.FALSE);
    }

    if(nodeState.get("userIDinSession")!=null && nodeState.get("userIDinSession")){
        userId = nodeState.get("userIDinSession");
    } else {
        action.goTo(nodeOutcome.FALSE);
    }

    if(nodeState.get("prereqContextID")!=null && nodeState.get("prereqContextID")){
        contextID = nodeState.get("prereqContextID");
    } else {
        action.goTo(nodeOutcome.FALSE);
    }
    
    // var userId = "656245b9-01e1-4b88-8039-8f9260889fd5";
    // var roleId = "368b0a98-cb82-4f8e-9fb6-5af5ab28bc27";
    logger.debug("Invoking Role Request");
    logger.debug("prereqtype ::  "+prereqtype+ "|"+"roleId ::  "+roleId+ "|"+"userId :: "+userId+ "|" +"contextID :: "+contextID )
    nodeState.putShared("roleId",roleId)
    nodeState.putShared("userId",userId)
    action.goTo(roleRequest(userId,roleId,contextID,prereqtype)); //Calling Function for Requesting Role
}


// Role Request Function
function roleRequest (userId,roleId,contextID,prereqtype) {
 
    var Response = null;   
    var roleRequestId = null;
    var prerequisiterecord = null;
    
    try {
        logger.debug("User ID is" + userId+ "Role ID is "+ roleId);  
        prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
        var body = {
          "common": {
            "userId": userId,
            "roleId": roleId,
            "justification":"Creating Role Request from Journey",
            "context": {
                  "type":"journey"
                }
          }     
        };
        logger.debug("Body is "+ JSON.stringify(body));
    Response = openidm.action("iga/governance/requests/roleGrant", "POST", body,{});
    logger.debug("Role Request Response Is ::" + Response);
    roleRequestId = Response.id;
    
    if(roleRequestId){
        var timestamp = new Date().toISOString();
        var dataObj = {
            "status": "PENDING_APPROVAL",
            "requestId": roleRequestId,
            "updatedate":timestamp   
        };     
        if(nodeState.get("_idWorkflow")!==null){
           patchPrerequisiteRequestStatus(roleRequestId,contextID,userId,prereqtype);
        }else{
            prerequisiterecord.patchRequest(contextID,userId,prereqtype,dataObj)
        }
        
        //patchPrerequisiteRequestStatus(roleRequestId,contextID,userId,prereqtype);
        nodeState.putShared("roleRequestId",roleRequestId);
        nodeState.putShared("roleRequestResponse",Response);
        //return ("True"); 
        return nodeOutcome.TRUE;
    } else {
        //return ("False");
        return nodeOutcome.FALSE;
    }
        
        //return (Response);
        
    } catch(error) {
        logger.error("Error Occurred ::" + error)
        return ("False");
    }
}


function patchPrerequisiteRequestStatus(roleRequestId,id,userID,type){
    
    logger.debug("Inside patchPrerequisiteRequestStatus")
    var status = "PENDING_APPROVAL";
    var recordRequest = null; 
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");
    
    try{
        recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+userID+'"'}, ["contextid", "type", "requester", "status"]);
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
           "field" : "requestId",
            "value" : roleRequestId
        }) ;
 
        contentArray.push({
           "operation" : "replace",
            "field" : "updatedate",
            "value" : new Date().toISOString()
        }) ;
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null,nodeState.get("_idWorkflow"));
        
    } catch(error){
         logger.error( "::" + error);
    }  
}


//Invoke Main Function
main();


