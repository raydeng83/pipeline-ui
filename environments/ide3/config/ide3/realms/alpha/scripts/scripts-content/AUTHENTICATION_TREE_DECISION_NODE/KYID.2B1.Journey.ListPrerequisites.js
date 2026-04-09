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
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "List Prerequisites",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ListPrerequisites",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
};


// Node outcomes
var nodeOutcome = {
    NEXT: "next",
    ERROR: "error",
    DONE: "done",
    VIEW_PENDING_APPROVAL: "View pending approval"
};


/*
    Description: This function is used to obtain list of prerequisite types corresponding to prerequisite type IDs.
    Input: arrPreReqTypeIDs <Array> (Array of Prerequisites IDs)
    Output: listOfPrereqTypes <Array> (Returns an array of Prerequisite Types)
*/
function getListOfPrereqTypes(txid,nodeLogger,ops,arrPreReqTypeIDs){

  //Function Name
    nodeConfig.functionName = "getListOfPrereqTypes()";

  //Local Variables  
  var id = null;
  var parsePrereqTypeNames = {};
  var listOfPrereqTypes = [];
  var listOfPrereqTypeNames = [];
  var falgOutput = [];
  var flagJSONData = {};
  var prereqJSONObj = {};  
  var recordPrereqTypes = null;
  var jsonPrereqTypeData = null;
  var typeofprerequisite = null;
    
    
  try { 
        for(var j=0;j<arrPreReqTypeIDs.length;j++){
          jsonPrereqTypesData = {};
          prereqJSONObj = {};  
          id = arrPreReqTypeIDs[j];
          recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "name", "description", "sequence","typeofprerequisite,enrollmentactions,prereqtypename"]);
         logger.debug("Successfully retrieved alpha_kyid_prerequisite custom managed object attributes :: "+JSON.stringify(recordPrereqTypes.result));
          jsonPrereqTypeData =JSON.parse(JSON.stringify(recordPrereqTypes.result[0]));
          flagJSONData ={
                  "prereqtypename":recordPrereqTypes.result[0].prereqtypename,
                  "enrollmentactions":recordPrereqTypes.result[0].enrollmentactions,
              }
              falgOutput.push(JSON.stringify(flagJSONData))
              
          prereqJSONObj["name"]= jsonPrereqTypeData["name"];
          prereqJSONObj["description"]= jsonPrereqTypeData["description"];  
          prereqJSONObj["sequence"]= jsonPrereqTypeData["sequence"];
          listOfPrereqTypes.push(prereqJSONObj);
          logger.debug("prereqJSONObj is: "+ JSON.stringify(prereqJSONObj));
          parsePrereqTypeNames = JSON.parse(JSON.stringify(jsonPrereqTypeData["name"]));
        }
         listOfPrereqTypes.sort((a,b) => a.sequence-b.sequence);
         listOfPrereqTypes.forEach(item => listOfPrereqTypeNames.push(item.name.en));
         //logger.debug("List of PrerequisiteTypes :: "+JSON.stringify(listOfPrereqTypes));
         //logger.debug("listOfPrereqTypeNames - "+JSON.stringify(listOfPrereqTypeNames));
         nodeState.putShared("arrPreReqTypes",listOfPrereqTypeNames);
         nodeState.putShared("flagJSONData",falgOutput);
        
        
  } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite custom object attributes, Error -'+ error);
  }

    nodeState.putShared("prerequisites",listOfPrereqTypes);
    return listOfPrereqTypes;
}


function getPrereqType(txid,nodeLogger,ops,prereqname){

  //Function Name
    nodeConfig.functionName = "getPrereqType()";

  //Local Variables  
  var recordPrereqTypes = null;
    
  try { 
      logger.debug("prereqname is "+prereqname);
          recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter" : '/prereqtypename eq "'+prereqname+'"'}, ["typeofprerequisite"]);
          //logger.debug("Successfully retrieved alpha_kyid_prerequisite custom managed object attributes :: "+JSON.stringify(recordPrereqTypes.result));
        logger.debug("recordPrereqTypes.result[0].typeofprerequisite - "+recordPrereqTypes.result[0].typeofprerequisite)
          if(recordPrereqTypes.result[0].typeofprerequisite === "workflow"){
              nodeState.putShared("typeofprerequisite","workflow");
          } else {
              nodeState.putShared("typeofprerequisite","");
          }
        
        
  } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite custom object attributes, Error -'+ error);
  }

}



/*
    Description: This function is used to obtain prerequisite IDs corresponding to policy.
    Input: id <String> (ID of Policy)
    Output: arrPreReqTypeIDs <Array> (Returns an array of Prerequisite Type IDs)
*/
function getPolicyDetails(txid,nodeLogger,ops,id){

   //Function Name
    nodeConfig.functionName = "getPolicyDetails()";

  //Local Variables  
   var recordPolicy = null;
   var arrPreReqTypeIDs = [];
   var params = {};
   var paramFields = [];
    
   try { 
        params["key"] = "_id";
        params["ops"] = "eq";
        params["value"] = id;
        paramFields.push("_id");
        paramFields.push("policyName");
        paramFields.push("prerequisite");
        //recordPolicy = openidm.query("managed/alpha_kyid_policy", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "policyName", "_prereqtypes"]);
        recordPolicy = ops.crudOps("query", "alpha_kyid_policy", null, params, paramFields , null);
        logger.debug("Successfully retrieved alpha_kyid_policy custom managed object attributes :: "+JSON.stringify(recordPolicy.result[0]));
        var jsonPolicyData =  JSON.stringify(recordPolicy.result[0]);
        var jsonPolicyParsedData = JSON.parse(jsonPolicyData);
        var jsonPrerequisiteTypeData = jsonPolicyParsedData["prerequisite"]; //To fetch prereqtypes id details
        for(var i=0; i<jsonPrerequisiteTypeData.length;i++){
          var tmpPrerequisiteTypeData = jsonPrerequisiteTypeData[i];
          //logger.debug("PrerequisiteTypeData "+i+" :: "+JSON.stringify(tmpPrerequisiteTypeData));
          var jsonPrerequisiteTypeParsedData = JSON.parse(JSON.stringify(tmpPrerequisiteTypeData));
          //logger.debug("PrerequisiteTypeID :: "+jsonPrerequisiteTypeParsedData["_refResourceId"]);
          arrPreReqTypeIDs.push(jsonPrerequisiteTypeParsedData["_refResourceId"]);
        }
        //logger.debug("PrerequisiteTypeIDs ArrayList  :: "+arrPreReqTypeIDs);
     
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_policy custom object attributes. Error -'+ error);
    }

   return arrPreReqTypeIDs;
}


/*
    Description: This function is used to obtain policy information mapped to role.
    Input: id <String> (ID of Role)
    Output: policyID <String> (Returns ID of policy)
*/
function getRoleDetails(txid,nodeLogger,ops,id){

   //Function Name
    nodeConfig.functionName = "getRoleDetails()";

  //Local Variables  
   var recordRole = null;
   var policyID = null;
   var funcResult = {};
   var params = {};
   var paramFields = [];
    
   try { 
        params["key"] = "_id";
        params["ops"] = "eq";
        params["value"] = id;
        paramFields.push("_id");
        paramFields.push("name");
        paramFields.push("_policy");
        //recordRole = openidm.query("managed/alpha_role", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "name", "_policy"]);
        recordRole = ops.crudOps("query", "alpha_role", null, params, paramFields , null);
        logger.debug("Successfully retrieved alpha_role managed object attributes :: "+JSON.stringify(recordRole.result[0]));

        nodeState.putShared("sendAccessGrantAttr_rolename",recordRole.result[0].name);
        var jsonRoleData =  JSON.stringify(recordRole.result[0]);
        var jsonRoleParsedData = JSON.parse(jsonRoleData);
        var jsonPolicyData = jsonRoleParsedData["_policy"]; //To fetch policy id details
        //logger.debug("Policy Details :: "+JSON.stringify(jsonPolicyData));
        var jsonPolicyParsedData = JSON.parse(JSON.stringify(jsonPolicyData));
        policyID = jsonPolicyParsedData["_refResourceId"];
        //logger.debug("PolicyID :: "+policyID);
        
    } catch(error) {
        logger.error('Failed to retrieve alpha_role custom object attributes. Error -'+ error);
    }

  return policyID;
}


/*
    Description: This function is used to obtain role information and list of prerequisite types based on enrolment contextID.
    Input: id <String> (ContextID)
    Output: response <Object> (prereqtypes)
*/
function getEnrolmentPrerequisiteTypes(txid,nodeLogger,ops,id){

    //Function Name
    nodeConfig.functionName = "getEnrolmentPrerequisiteTypes()";

    //Local Variables 
    var roleID = null;
    var policyID = null;
    var arrPreReqTypeIDs = [];
    var arrPreReqType = [];
    var params = {};
    var paramFields = [];
    var response = {};
    var funcResult = {};
    var recordEnrolmentContext = null;
  
    try { 
        params["key"] = "_id";
        params["ops"] = "eq";
        params["value"] = id;
        // paramFields.push("contextID");
        paramFields.push("roleId");
        recordEnrolmentContext = ops.crudOps("query", "alpha_kyid_enrolmentcontext", null, params, paramFields , null);
        logger.debug("Successfully retrieved alpha_kyid_enrolmentcontext custom object attributes :: "+JSON.stringify(recordEnrolmentContext.result[0]));
        // var jsonEnrolmentContextData =  JSON.stringify(recordEnrolmentContext.result[0]);
        // var jsonEnrolmentContextParsedData = JSON.parse(jsonEnrolmentContextData);
        // var jsonRoleData = jsonEnrolmentContextParsedData["role"]; //To fetch role id details
        //logger.debug("Role Details :: "+JSON.stringify(jsonRoleData));
        // var jsonRoleParsedData = JSON.parse(JSON.stringify(jsonRoleData));
        roleID = recordEnrolmentContext.result[0].roleId[0];
        nodeState.putShared("roleIDinSession",roleID);
        //logger.debug("RoleID :: "+roleID);
      } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_enrolmentcontext custom object attributes, Error -'+ error);
      }
        if(roleID!=null && roleID){
          policyID = getRoleDetails(txid,nodeLogger,ops,roleID);
          
          if(policyID!=null && policyID){
             arrPreReqTypeIDs = getPolicyDetails(txid,nodeLogger,ops,policyID);
             logger.debug("arrPreReqTypeIDs is: "+JSON.stringify(arrPreReqTypeIDs));
             if(arrPreReqTypeIDs.length>0){
              arrPreReqType = getListOfPrereqTypes(txid,nodeLogger,ops,arrPreReqTypeIDs);
              response["prereqtypes"] = arrPreReqType;
            }
          }
        }

    return response;
}


/*
    Description: This function is used to prepopulate data into IDM request managed object.
    Input: ops <Object> 
           id <String> (ContextID)
           type <String> 
           requesterID <String>
           status <String>
           startdate <String>
           updatedate <String>
           enddate <String>
    Output: Returns success or failure with detailed message
*/
function populateRequestObject(txid,nodeLogger,ops,id,type,requesterID,status,startdate,updatedate,enddate,sequence){

   //Function Name
    nodeConfig.functionName = "populateRequestObject()";

  //Local Variables  
   var roleID =  nodeState.get("roleIDinSession"); 
   var prereqID = null;
   var content = {};
   var recordRequest = null; 
   var requestJSONObj = {};
   try { 
        content["contextid"] = id;
        content["type"] = type;
        content["requester"] = requesterID;
        content["status"] = status;
        content["startdate"] = startdate;
        content["enddate"] = enddate;
        content["createdate"] = "";
        content["updatedate"] = updatedate;
        content["sequence"] = sequence;
        content["requestId"] = "";
        content["approleid"] = roleID;
        recordRequest = ops.crudOps("create", "alpha_kyid_request", content, null, null, null);
        //logger.debug("Successfully created record in alpha_kyid_request managed object :: "+JSON.stringify(recordRequest));
        requestJSONObj = JSON.parse(JSON.stringify(recordRequest));
        prereqID = requestJSONObj["_id"];
        //populateRequestStepsObject(txid,nodeLogger,ops,prereqID,type,status);
        
    } catch(error) {
        logger.error('Failed to create alpha_kyid_request custom object attributes. Error -'+ error);
    }

  return recordRequest;
}


function populateRequestStepsObject(txid,nodeLogger,ops,id,type,status,createdate,updatedate){

   //Function Name
    nodeConfig.functionName = "populateRequestStepsObject()";

  //Local Variables  
   var prereqID = null;
   var content = {};
   var recordRequestSteps = null; 
   var requestJSONObj = {};
    
   try { 
        content["id"] = id;
        content["type"] = type;
        content["status"] = "NOT_STARTED";
        content["createdate"] = new Date().toISOString();
        content["updatedate"] = new Date().toISOString();
        content["reason"] = "";
        content["reference"] = "";
        content["createdby"] = "";
        content["updatedby"] = "";
        recordRequestSteps = ops.crudOps("create", "alpha_kyid_request_steps", content, null, null, null);
        //logger.debug("Successfully created record in alpha_kyid_request_steps managed object :: "+JSON.stringify(recordRequestSteps));

    } catch(error) {
        logger.error('Failed to create alpha_kyid_request_steps custom object attributes. Error -'+ error);
    }
 
  return recordRequestSteps;
}


function statusExistAllPrerequisiteInRequest(txid,nodeLogger,ops,id,requesterID,totPrereqCount,status){

   //Function Name
   nodeConfig.functionName = "statusExistAllPrerequisiteInRequest()";

  //Local Variables  
   var result = false; 
   var completecount=0; 
   var cancelcount=0; 
   var recordRequest = null; 
   var recordRequestJSONObj = {};
    
   try { 
        if(status==="CANCELLED"){
            if(nodeState.get("completecount")!=null && nodeState.get("completecount")){
                completecount = nodeState.get("completecount");
                //logger.debug("completecount value is - "+completecount);
            }
            recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and requester eq "'+requesterID+'"'
            + 'and status eq "'+status+'"'}, ["contextid", "type", "requester", "status"]);
    
            //logger.debug("Successfully queried record with CANCELLED status in alpha_kyid_request managed object in statusExistAllPrerequisiteInRequest:: "+JSON.stringify(recordRequest));
            cancelcount = recordRequest["resultCount"];
            //logger.debug("cancelcount value is - "+cancelcount);

            if(cancelcount+completecount===totPrereqCount && completecount<totPrereqCount){
                //logger.debug("All prereqs are cancelled");
                result = true;
            }
        }

       if(status==="COMPLETED"){
           // recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
           //  + 'and requester eq "'+requesterID+'"'
           //  + 'and status eq "'+status+'"'}, ["contextid", "type", "requester", "status"]);
           recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' + 'and requester eq "'+requesterID+'"' + 'and (status eq "'+status+'" or status eq "SKIPPED")'}, ["contextid", "type", "requester", "status"]);
            
           //logger.debug("Successfully queried record with COMPLETED/SKIPPED in alpha_kyid_request managed object in statusExistAllPrerequisiteInRequest:: "+JSON.stringify(recordRequest));
           nodeState.putShared("completecount",recordRequest["resultCount"]);
           if(recordRequest["resultCount"]===totPrereqCount){
                //logger.debug("All prereqs are completed");
                result = true;
            } else {
                logger.debug("All prereqs are not completed");
            }
        }
        
    } catch(error) {
        logger.error('Failed to query alpha_kyid_request custom object attributes. Error -'+ error);
    }

    return result;
}


/*
    Description: This function is used to query IDM request managed object and obtain prerequsite progress status.
    Input: ops <Object> 
           id <String> (ContextID)
           type <String> 
           requesterID <String>       
    Output: status <String>
*/
function statusExistInRequest(txid,nodeLogger,ops,id,type,requesterID){

   //Function Name
   nodeConfig.functionName = "statusExistInRequest()";

  //Local Variables  
   var status = null;
   var recordRequest = null; 
   var params = {};
   var paramFields = [];
   var recordRequestJSONObj = {};
    
   try { 
       /* params["key"] = "contextID";
        params["ops"] = "eq";
        params["value"] = id;
        paramFields.push("contextID");
        paramFields.push("role");
        recordRequest = ops.crudOps("query", "alpha_kyid_request", null, params, paramFields , null);*/
        recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+requesterID+'"'}, ["contextid", "type", "requester", "status","requestId"]);
        
        //logger.debug("Successfully queried record in alpha_kyid_request managed object :: "+JSON.stringify(recordRequest));
        if(JSON.stringify(recordRequest.result).length>2){
            recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
            status = recordRequestJSONObj["status"]; 
            if(recordRequest.result[0].requestId){
                var requestId =recordRequest.result[0].requestId;
                nodeState.putShared("PreqRoleRequestId",requestId)
            }
        }
     
        
    } catch(error) {
        logger.error('Failed to query alpha_kyid_request custom object attributes. Error -'+ error);
    }

    return status;
}


/*
    Description: This function is used to find prerequsite type to progress with enrolment process.
    Input:  prereqtypes <Object> (Prerequiste JSON Object)
            arrPreReqTypesName <Array> (Name of Prerequiste Types)
    Output: type <String>
*/
function findPrereqtypeForNavigation(txid,nodeLogger,prereqtypes,arrPreReqTypesName){

    //Function Name
    nodeConfig.functionName = "findPrereqtypeForNavigation()";

   //Local Variables 
    var minStatus = 10000;
    var type = null;
    var prereqtypesJSONObject = {};

    try{
        logger.debug("Print Pereqs - "+JSON.stringify(prereqtypes));
        for(var i=0; i<prereqtypes.length; i++){
            prereqtypesJSONObject = {};
            prereqtypesJSONObject = JSON.parse(JSON.stringify(prereqtypes[i]));
            if(minStatus>prereqtypesJSONObject["sequence"] && (prereqtypesJSONObject["status"]!="COMPLETED" && prereqtypesJSONObject["status"]!="SKIPPED")){
                minStatus = prereqtypesJSONObject["sequence"];
                type = arrPreReqTypesName[i];
            }    
        }
    } catch(error){
       logger.error('RLogs::Exception occured in findPrereqtypeForNavigation function. Error -'+ error); 
    }
    
    logger.debug("RLogs::prereqtype value for navigation is - "+type);
    return type;
}


/*
    Description: This function is used to update the status of prerequsite type in IDM request managed object.
    Input:  id <String>
            userID <String>
            arrPreReqTypes <Array>
            status <String>
    Output: void
*/
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


function patchPrerequisiteStepsCancelRequestStatus(ops,txid,nodeLogger,id,status){
    
    //Function Name
    nodeConfig.functionName = "patchPrerequisiteStepsCancelRequestStatus()";

    //Local Variables 
    var recordRequestSteps = null; 
    var recordRequestStepsJSONObj = {};
    var content = {};
    var contentArray = [];
    var timestamp = new Date().toISOString();
    
    
    try{
        recordRequestSteps = openidm.query("managed/alpha_kyid_request_steps", { "_queryFilter" : 'id eq "'+id+'"'}, ["type", "status"]);
        //logger.debug("Successfully queried record in alpha_kyid_request_steps managed object :: "+JSON.stringify(recordRequestSteps));
        recordRequestStepsJSONObj = JSON.parse(JSON.stringify(recordRequestSteps.result[0]));
        //logger.debug("Resource ID - "+recordRequestStepsJSONObj["_id"]);
        if(!(recordRequestStepsJSONObj["status"]==="COMPLETED")){
            
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
            ops.crudOps("patch", "alpha_kyid_request_steps", contentArray, null, null, recordRequestStepsJSONObj["_id"]);
        } 
        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
    
}


function patchPrerequisiteRequestStatus(ops,txid,nodeLogger,id,userID,type,status){

    //Function Name
    nodeConfig.functionName = "patchPrerequisiteRequestStatus()";

    //Local Variables 
    var recordRequest = null; 
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    
    try{
        //logger.debug("Inside patchPrerequisiteRequestStatus type -  "+type)
        recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
        + 'and type eq "'+type+'"' 
        + 'and requester eq "'+userID+'"'}, ["contextid", "type", "requester", "status"]);
        //logger.debug("Successfully received record from alpha_kyid_request managed object in patchPrerequisiteRequestStatus :: "+JSON.stringify(recordRequest));
        recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
        //logger.debug("Resource ID in patchPrerequisiteRequestStatus - "+recordRequestJSONObj["_id"]);
        if(!(recordRequestJSONObj["status"]==="COMPLETED" || recordRequestJSONObj["status"]==="SKIPPED") ){
            content["operation"] = "replace";
            content["field"] = "status";
            content["value"] = status ;
            contentArray.push(content);
            ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"])
        } 

        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
    
}

function cancelWorkflowRoleRequest(requestId) {
    try {
        logger.debug("Request Id is ----"+requestId)
 
        var response = openidm.action('endpoint/cancelPrerequisiteWorkflow', 'POST', { requestId: requestId });
        if (response.code == -1){
            return false;
        }
        else{
            return true;
        }
    } catch (error) {
        logger.error("Error Occured while cancelling the Role request ::"+error )
        return false;
    }
    
}


// Main Function
function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var errMsg = null;
    var typeofprerequisite = null;
    var ops = null;
    var uuid = null;
    var prerequisiterecord= null;
    var txid = null;
    var nodeLogger = null;
    var contextID = null;
    var appElementsJSON = {};
    var appElementsSubJSON = {};
    var appElementsOpHrsLocaleContent = {};
    var responseJSONObj = {};
    var responseJSONArray = [];
    var responseArray = [];
    var prereqList = [];
    var prereqListJSONObj = null;
    var arrPreReqTypes = null;
    var status = null;
    var existingstatus = null;
    var isAllPrereqStatusCompleted = false;
    var isAllPrereqStatusCancelled = false;
    var selectedOutcome = null;
    var timestamp = null;
    var lib = null
    var process ="kyid_2B1_PrerequisitesEnrolment";
    var pageHeader= "KYIDPID100000";
    var getFaqTopicId = null;
    var getFaqTopicIdValue = null;
    var totprereqcompleted = null;
    var messageContextID = "contextID value is not present";
    var response = {};
    var data = null;
    var allowreuseFlag = false;
    var prereqcompeletedJSONObj = {};
    var FlagResponse = null;
    
    try {
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId")); 
        nodeLogger.log("error", nodeConfig, "begin", txid);
        lib = require("KYID.Library.FAQPages");
        getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        getFaqTopicIdValue = JSON.parse(getFaqTopicId);
        uuid = nodeState.get("userIDinSession");     
        FlagResponse = nodeState.get("flagJSONData");
        ops = require("KYID.2B1.Library.IDMobjCRUDops");
        prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils"); 

        if(nodeState.get("prereqContextID")!=null && nodeState.get("prereqContextID")){
            contextID = nodeState.get("prereqContextID");
        } 
        
        if(contextID!=null && contextID){
           response = getEnrolmentPrerequisiteTypes(txid,nodeConfig,ops,contextID);
           responseJSONArray = response["prereqtypes"];
        
            
           logger.debug("getEnrolmentPrerequisiteTypes response: "+ JSON.stringify(response));
           nodeLogger.log("debug", nodeConfig, "mid", txid, "getEnrolmentPrerequisiteTypes function response is- "+JSON.stringify(response));
           prereqList = JSON.parse(JSON.stringify(response.prereqtypes));
           arrPreReqTypes = nodeState.get("arrPreReqTypes");
           nodeLogger.log("debug", nodeConfig, "mid", txid, "arrPreReqTypes length is- "+arrPreReqTypes.length);
        
           for(var i=0; i<prereqList.length ;i++){
                prereqListJSONObj = {};
                responseJSONObj = {};
                prereqListJSONObj = JSON.parse(JSON.stringify(prereqList[i]));
                status = statusExistInRequest(txid,nodeConfig,ops,contextID,arrPreReqTypes[i],uuid);
                nodeLogger.log("debug", nodeConfig, "mid", txid, "statusExistInRequest is- "+status);
                responseJSONObj = responseJSONArray[i];
                logger.debug("arrPreReqTypes sequence is:"+prereqListJSONObj["sequence"] +" - "+ arrPreReqTypes[i]);

                //Computes TODO status of prerequisite
               data = nodeState.get("flagJSONData")
               for (var k = 0; k < data.length; k++) {
                   alwaysFlagResponse = JSON.parse(data[k]);
                   if (alwaysFlagResponse.prereqtypename === arrPreReqTypes[i]) {
                       allowreuseFlag =alwaysFlagResponse.enrollmentactions.allowreuse;
                       break;
                   }
               }
                if(status===null){
                    timestamp = new Date().toISOString();
                    if(i==0){

                        populateRequestObject(txid,nodeConfig,ops,contextID,arrPreReqTypes[i],uuid,"TODO",timestamp,"","",prereqListJSONObj["sequence"]);  
                        responseJSONObj["status"] = "TODO"; 
                        // }
                    } else {
                        populateRequestObject(txid,nodeConfig,ops,contextID,arrPreReqTypes[i],uuid,"NOT_STARTED",timestamp,"","",prereqListJSONObj["sequence"]);  
                        responseJSONObj["status"] = "NOT_STARTED"; 
                    }       
                } else {
                    if(i==0){
                        responseJSONObj["status"] = status;
                    } else if(i>0) {
                         if(status==="NOT_STARTED"){
                             existingstatus = statusExistInRequest(txid,nodeConfig,ops,contextID,arrPreReqTypes[i-1],uuid);
                             logger.debug("Existing prereq status - "+existingstatus)
                             if((existingstatus==="COMPLETED" || existingstatus==="SKIPPED" ) && existingstatus!=="TODO" && existingstatus!=="NOT_STARTED" && existingstatus!=="IN_PROGRESS"){
                                logger.debug("existing status");
                                var dataObj = {
                                    "status": "TODO"
                                };
                                prerequisiterecord.patchRequest(contextID,uuid,arrPreReqTypes[i],dataObj);                                 
                                //patchPrerequisiteRequestStatus(ops,txid,nodeConfig,contextID,uuid,arrPreReqTypes[i],"TODO");  
                                responseJSONObj["status"] = "TODO"; 
                             } else {
                                responseJSONObj["status"] = status; 
                             }
                         } else {
                            responseJSONObj["status"] = status; 
                         }  
                    
                        
                    }
 
                }       
               logger.debug("responseJSONObj - "+JSON.stringify(responseJSONObj));
               responseArray.push(responseJSONObj);       
           } 

            //*******Hard-coded Values*******
            appElementsSubJSON["logo"] = "kynect.png";
            appElementsSubJSON["name"] = "Kynect";
            appElementsSubJSON["role"] = "kyid_prereq_dynamicform_role";
            appElementsSubJSON["phone"] = "000-000-0000";
            appElementsSubJSON["mail"] = "help@kynect.com";
            appElementsSubJSON["url"] = "https://www.kynect.com";
            appElementsOpHrsLocaleContent["en"] = "Monday through Friday, 9 AM - 5 PM EST";
            appElementsOpHrsLocaleContent["es"] = "De lunes a viernes, de 9 a. m. - 5 p. m. EST";
            appElementsSubJSON["operatingHours"] = appElementsOpHrsLocaleContent;
            response["application"] = appElementsSubJSON;
            //*******Hard-coded Values*******
            prereqcompeletedJSONObj["application"] = appElementsSubJSON;
            prereqcompeletedJSONObj["status"] = "Pre-requisites enrolment request is completed";
            
            response["faqTopicId"] = getFaqTopicIdValue["faqTopicId"];
            response["prereqtypes"] = responseArray;
            response["totalcount"] = prereqList.length;
            
            type = findPrereqtypeForNavigation(txid,nodeConfig,responseArray,arrPreReqTypes);
            nodeState.putShared("prereqtype",type);
            isAllPrereqStatusCompleted = statusExistAllPrerequisiteInRequest(txid,nodeLogger,ops,contextID,uuid,arrPreReqTypes.length,"COMPLETED");
            logger.debug("isAllPrereqStatusCompleted return value - "+isAllPrereqStatusCompleted);
            isAllPrereqStatusCancelled = statusExistAllPrerequisiteInRequest(txid,nodeLogger,ops,contextID,uuid,arrPreReqTypes.length,"CANCELLED");
            logger.debug("isAllPrereqStatusCancelled return value - "+isAllPrereqStatusCancelled);
            if(isAllPrereqStatusCompleted){
            nodeState.putShared("prereqcompeletedJSONObj",JSON.stringify(prereqcompeletedJSONObj));
            action.goTo(nodeOutcome.DONE); 

            }
            else{

                if (callbacks.isEmpty()) {
                // if(isAllPrereqStatusCompleted){
                //     nodeState.putShared("prereqcompeletedJSONObj",JSON.stringify(prereqcompeletedJSONObj));
                //     // callbacksBuilder.textOutputCallback(0,JSON.stringify(prereqcompeletedJSONObj));
                //     // callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
                    
                // } 
                    if(isAllPrereqStatusCancelled){
                    callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
                    callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
                    
                } else{
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
                    
                }   
                     
            } else {
               selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
               if(selectedOutcome === 0){
                   if(status === "REJECTED"){
                      action.goTo(nodeOutcome.DONE); 
                   } 
                    
                   // else if(isAllPrereqStatusCompleted){
                   //    nodeLogger.log("debug", nodeConfig, "end", txid);
                   //    action.goTo(nodeOutcome.DONE);     
                   // } 
               else if(isAllPrereqStatusCancelled){
                      nodeLogger.log("debug", nodeConfig, "end", txid);
                      action.goTo(nodeOutcome.DONE); 
                   } else {
                      nodeLogger.log("debug", nodeConfig, "end", txid);
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
                        nodeLogger.log("debug", nodeConfig, "mid", txid, errMsg); 
                        nodeLogger.log("debug", nodeConfig, "end", txid); 
                        action.goTo(nodeOutcome.ERROR);
                    }
               }
               else if(selectedOutcome === 2){
                    nodeLogger.log("debug", nodeConfig, "end", txid);
                    action.goTo(nodeOutcome.VIEW_PENDING_APPROVAL); 
               }
            } 


                
            }
            // if (callbacks.isEmpty()) {
            //     if(isAllPrereqStatusCompleted){
            //         nodeState.putShared("prereqcompeletedJSONObj",JSON.stringify(prereqcompeletedJSONObj));
            //         // callbacksBuilder.textOutputCallback(0,JSON.stringify(prereqcompeletedJSONObj));
            //         // callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
                    
            //     } else if(isAllPrereqStatusCancelled){
            //         callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
            //         callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
                    
            //     } else{
            //          getPrereqType(txid,nodeLogger,ops,type.toLowerCase());
            //          if(nodeState.get("typeofprerequisite") !== null){
            //             typeofprerequisite= nodeState.get("typeofprerequisite");
            //          }
            //         logger.debug("Type of Prereq is - "+typeofprerequisite)
            //         if(typeofprerequisite === "workflow"){
            //             if(status === "REJECTED"){
            //                 patchPrerequisiteCancelRequestStatus(ops,txid,nodeLogger,contextID,uuid,arrPreReqTypes,"CANCELLED"); 
            //                 //callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            //                  callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
            //                  callbacksBuilder.confirmationCallback(0, ["Completed"], 0);                     
            //             }
            //             else if(status === "PENDING_APPROVAL" ){
            //                 callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            //                 callbacksBuilder.confirmationCallback(0, ["Start","Cancel","View workflow status"], 0);                     
            //             } else {
            //                 callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            //                 callbacksBuilder.confirmationCallback(0, ["Start","Cancel"], 0);
            //             }
                    
            //         } else{
            //             logger.debug("Not workflow");
            //             logger.debug("Response ********* - "+JSON.stringify(response));
            //             callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            //             callbacksBuilder.confirmationCallback(0, ["Start","Cancel"], 0);
            //         }
                    
            //     }   
                     
            // } else {
            //    selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            //    if(selectedOutcome === 0){
            //        if(status === "REJECTED"){
            //           action.goTo(nodeOutcome.DONE); 
            //        } 
                    
            //        // else if(isAllPrereqStatusCompleted){
            //        //    nodeLogger.log("debug", nodeConfig, "end", txid);
            //        //    action.goTo(nodeOutcome.DONE);     
            //        // } 
            //    else if(isAllPrereqStatusCancelled){
            //           nodeLogger.log("debug", nodeConfig, "end", txid);
            //           action.goTo(nodeOutcome.DONE); 
            //        } else {
            //           nodeLogger.log("debug", nodeConfig, "end", txid);
            //           action.goTo(nodeOutcome.NEXT);    
            //        }
            //    } else if(selectedOutcome === 1){
            //         if(arrPreReqTypes.length>0){
            //            if(nodeState.get("PreqRoleRequestId")){
            //                logger.debug("Request Id is ----"+nodeState.get("PreqRoleRequestId"))
            //                cancelWorkflowRoleRequest(nodeState.get("PreqRoleRequestId"))
            //            }
            //            patchPrerequisiteCancelRequestStatus(ops,txid,nodeLogger,contextID,uuid,arrPreReqTypes,"CANCELLED"); 
            //            isAllPrereqStatusCancelled = statusExistAllPrerequisiteInRequest(txid,nodeLogger,ops,contextID,uuid,arrPreReqTypes.length,"CANCELLED");
            //            logger.debug("isAllPrereqStatusCancelled return value - "+isAllPrereqStatusCancelled); 
            //            if(isAllPrereqStatusCancelled){
            //                 callbacksBuilder.textOutputCallback(0,JSON.stringify({"status":"Pre-requisites enrolment request is cancelled"}));
            //                 callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
            //             }
            //             nodeState.putShared("PreqRoleRequestId",null)
            //             action.goTo(nodeOutcome.DONE); 
            //         } else {
            //             errMsg = nodeLogger.readErrorMessage("KYID101"); 
            //             nodeState.putShared("readErrMsgFromCode",errMsg); 
            //             nodeLogger.log("debug", nodeConfig, "mid", txid, errMsg); 
            //             nodeLogger.log("debug", nodeConfig, "end", txid); 
            //             action.goTo(nodeOutcome.ERROR);
            //         }
            //    }
            //    else if(selectedOutcome === 2){
            //         nodeLogger.log("debug", nodeConfig, "end", txid);
            //         action.goTo(nodeOutcome.VIEW_PENDING_APPROVAL); 
            //    }
            // }   
        } 
        
    } catch(error) {
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
     }
    
}

//Invoke Main Function
main();

