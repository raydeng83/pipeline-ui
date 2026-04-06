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
  nodeName: "List Prerequisites",
  script: "Script",
  scriptName: "KYID.2B1.Journey.ListVerifiedPrerequisites",
  begin: "Begin Function Execution",
  function: "Function",
  functionName: "",
  end: "Function Execution Completed",
};

// Node outcomes
var nodeOutcome = {
  ERROR: "error",
  RETRY: "retry",
  REVERIFY: "reverify",
  VIEWPREQUISITEDATA: "viewpreqdata",
  SOFTDELETE: "softdelete",
  BACK : "back"
};

// To get the contextID from request managed object
function queryPrerequisiteRequestContexID(userId, name) {
  logger.debug("Inside queryPrerequisiteRequestContexID");
  var recordRequest = null;
  var recordRequestJSONObj = {};

  try {
    recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND type eq "' + name + '"',},["contextid"]);
    logger.debug("Successfully queried record in alpha_kyid_request to retrieve contextid managed object in ListVerifiedPrerequisites :: " +JSON.stringify(recordRequest));
    recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
    logger.debug("recordRequestJSONObj" + JSON.stringify(recordRequest.result));
    return recordRequestJSONObj;
  } catch (error) {
    logger.error('Failed to retrieve alpha_kyid_request to retrieve contextid in ListVerifiedPrerequisites , Exception: {}', error);
  }
}


// To get list of all the form pages data as per status.
function getSubmittedPrereqPagesDetails(uuid, type) {
  var source = "Portal";
  var recordSubmittedPreqreqPage = null;
  var recordSubmittedPreqreqPageArray = null;
  var extIDNResponse = null;
  var selectedOutcome= null;

  logger.debug("uuid is "+uuid +" type is "+ type);
  try {
    if (uuid != null) {
      recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity",{_queryFilter: 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'source eq "' + source + '"'},["attributeName", "attributeValue", "prereqType", "pageNumber"]);
    } else {
      recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity",{_queryFilter: 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"'});
    }
    logger.debug("Successfully queried record in alpha_kyid_extendedIdentity to retrieve extendedIdentity managed object attributes in ListVerifiedPrerequisites :: " +JSON.stringify(recordSubmittedPreqreqPage.result));
    return recordSubmittedPreqreqPage.result;     
  } catch (error) {
    logger.error('Failed to retrieve alpha_kyid_extendedIdentity to retrieve extendedIdentity managed object attributes in ListVerifiedPrerequisites , Exception: {}', error);
  }
}


// Get prerequisitetype type names
function getPrerequisiteName(id, enteredFormName, value) {
  var recordPrereqTypes = null;
  var prereqName = null;
  var flagJSONData = {};
  var flagOutput = [];
  var sequence = null;
    
    try { 
        recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter" : '_id eq "'+id+'"'}, ["_id", "name", "description", "sequence","typeofprerequisite,enrollmentactions,prereqtypename"]);
        logger.debug("RLogs::Successfully retrieved prereqtypename from alpha_kyid_prerequisite in ListVerifiedPrerequisites "+JSON.stringify(recordPrereqTypes.result[0]));
        prereqName = recordPrereqTypes.result[0]["prereqtypename"];
        sequence = recordPrereqTypes.result[0]["sequence"]
        logger.debug("prereqName is  "+prereqName);
        if(prereqName === enteredFormName){
            flagJSONData ={
              "prereqtypename":recordPrereqTypes.result[0].prereqtypename,
              "enrollmentactions":recordPrereqTypes.result[0].enrollmentactions,
          }
        logger.debug("flagJSONData is "+ JSON.stringify(flagJSONData));
        flagOutput.push(JSON.stringify(flagJSONData));
        nodeState.putShared("flagJSONData",flagOutput);
        }
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite custom object attributes in ListVerifiedPrerequisites , Exception: {}', error);
    }

    if(value == "name"){
        return prereqName;
    }else if(value == "sequence"){
         return sequence;
    }
    
}

function checkifWorkflowExist(userId, roleId, type, status){
  var recordRequest = null;
    try{
        //recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND type eq "' + type + '" AND approleid eq "' + roleId + '" AND status eq "' + status + '"'},["type", "status"]);
        recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND type eq "' + type + '" AND approleid eq "' + roleId + '" !(AND status eq "' + status + '")'},["type", "status"]);
        logger.debug("Successfully queried record in alpha_kyid_request managed object to retrieve workflow details in ListVerifiedPrerequisites :: " +JSON.stringify(recordRequest));
        logger.debug("recordRequest is in "+ recordRequest.result.length );
        if( recordRequest.result.length>0){
            nodeState.putShared("workflowExist",true);
            logger.debug("_ID of workflow is in "+ recordRequest.result[0]._id)
            nodeState.putShared("_idWorkflow",recordRequest.result[0]._id);
        }else{
            logger.debug("inside else")
            nodeState.putShared("workflowExist",false);
        }
        numberofRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND approleid eq "' + roleId +'"'},["type", "status"]);
        logger.debug("Successfully queried record in alpha_kyid_request managed object to retrieve number of requests in ListVerifiedPrerequisites :: " +JSON.stringify(numberofRequest));
        logger.debug("number of request is "+ numberofRequest.result.length);
        if( nodeState.get("workflowExist")== true){
            nodeState.putShared("numberofRequest", numberofRequest.result.length)
        }else if(nodeState.get("workflowExist")== false) {
            nodeState.putShared("numberofRequest", numberofRequest.result.length+1)
        }
        

    }catch(error){
        
    }
}

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
        content["sequence"] = sequence+1;
        content["requestId"] = "";
        content["approleid"] = roleID;
        recordRequest = ops.crudOps("create", "alpha_kyid_request", content, null, null, null);
        requestJSONObj = JSON.parse(JSON.stringify(recordRequest));
        prereqID = requestJSONObj["_id"];
        logger.debug("_ID is in "+ prereqID)
        nodeState.putShared("_idWorkflow",prereqID);
        //populateRequestStepsObject(txid,nodeLogger,ops,prereqID,type,status);
        
    } catch(error) {
        logger.error('Failed to create alpha_kyid_request custom object attributes. Error -'+ error);
    }

  return recordRequest;
}


//  To get list of all prerequisitetype
function getListPrerequisite(_id, enteredFormName) {
  var prereqList = [];
  var recordPrereqTypes = null;
  var id = null;
  //var name = null;
  var obj = {};
    
    try { 
        recordPrereqTypes = openidm.query("managed/alpha_kyid_policy", {"_queryFilter": '_id eq "' + _id + '"'});
        logger.debug("RLogs::Successfully retrieved prerequisitetype from alpha_kyid_policy in ListVerifiedPrerequisites "+JSON.stringify(recordPrereqTypes));
        recordPrereqTypes.result[0].prerequisite.forEach(item => {
            id = item._refResourceId;
            prereqList.push(getPrerequisiteName(id, enteredFormName, "name"))
            obj["name"]=getPrerequisiteName(id, enteredFormName, "name");
            obj["sequence"]= getPrerequisiteName(id, enteredFormName, "sequence");
        });  
    } catch(error) {
        logger.error('Failed to retrieve prerequisitetype from  alpha_kyid_policy in ListVerifiedPrerequisites, Exception: {}', error);
    }
    logger.error("OBJ is in "+ JSON.stringify(obj))
    return prereqList;
}

function parseCompletionDate(date) {
  if (!date) return "N/A";
  var completionDate = new Date(date);
  return completionDate.toISOString().split('T')[0].replace(/-/g, '/');
}

function parseExpiredDate(date) {
  if (!date) {
    logger.error("Invalid date format:", date);
    return "N/A";
  }
  const dateString = date.toString();
  if (dateString.length !== 8) {
    logger.error("Invalid date length:", dateString);
    return "N/A";
  }
  return `${dateString.slice(0, 4)}/${dateString.slice(4, 6)}/${dateString.slice(6, 8)}`;
}


function getPrerequisitePolicy(id) {
  var policyId

    try { 
         recordPrereqTypes = openidm.query("managed/alpha_role/", { "_queryFilter" : '_id eq "'+id+'"'}, ["_id", "name", "_policy"]);
         logger.debug("RLogs::Successfully queried record in alpha_role custom object to retrieve policy in ListVerifiedPrerequisites :: "+JSON.stringify(recordPrereqTypes.result[0]));
         policyId = recordPrereqTypes.result[0]._policy._refResourceId
         logger.debug("policyId "+policyId);
        nodeState.putShared("policy",policyId);
}catch(error){
        logger.error('Failed to retrieve alpha_role custom object attributes in ListVerifiedPrerequisites , Exception: {}', error);
}
}

// To populate the list prereq
function getPrerequisitData(name, value) {
  var recordPrereqTypes = null;
  var nameObj = null;
  var descriptionObj = {};
  var typeofprerequisite = null;
    
    try { 
        recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter" : 'prereqtypename eq "'+name+'"'}, ["_id", "name", "description", "typeofprerequisite"]);
        logger.debug("RLogs::Successfully queried record in alpha_kyid_prerequisite custom object to retrieve typeofprerequisite in ListVerifiedPrerequisites :: "+JSON.stringify(recordPrereqTypes.result[0]));
        nameObj = recordPrereqTypes.result[0]["name"];
        descriptionObj = recordPrereqTypes.result[0]["description"];
        typeofprerequisite = recordPrereqTypes.result[0]["typeofprerequisite"];
    } catch(error) {
        logger.error('Failed to queried record in alpha_kyid_prerequisite custom object attributes  in ListVerifiedPrerequisites , Exception: {}', error);
    }
    if(value === "name"){
        return nameObj;
    }else if(value === "description"){
        return descriptionObj;
    }else if(value === "typeofprerequisite"){
        return typeofprerequisite;
    }
}


function queryPrerequisiteRequestRole(userId, type) {
  logger.debug("Inside queryPrerequisiteRequestRole");
  var recordRequest = null;
  var recordRequestJSONObj = {};

  try {
    recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND type eq "' + type + '"'},["type", "status", "contextid", "prereqenrollsaveinput", "enddate", "expirydate", "approleid", "expiryaction"]);
    logger.debug("Successfully queried record in alpha_kyid_request managed object to retrieve roleId in ListVerifiedPrerequisites :: " +JSON.stringify(recordRequest));
    logger.debug("roleId is "+ recordRequest.result[0].approleid )
    logger.debug("prereqenrollsaveinput is "+ recordRequest.result[0].prereqenrollsaveinput )
    logger.debug("prereqenrollsaveinput is "+ recordRequest.result[0].expiryaction)
      if(recordRequest.result[0].prereqenrollsaveinput!=null || recordRequest.result[0].prereqenrollsaveinput!=undefined){
          nodeState.putShared("prereqenrollsaveinput",recordRequest.result[0].prereqenrollsaveinput) 
      }else{
          nodeState.putShared("prereqenrollsaveinput","false") 
      }
      if(recordRequest.result[0].expiryaction!=null || recordRequest.result[0].expiryaction!=undefined){
          nodeState.putShared("expiryaction",recordRequest.result[0].expiryaction) 
      }
      // else{
      //     nodeState.putShared("expiryaction","false") 
      // }
    nodeState.putShared("roleId",recordRequest.result[0].approleid)
    nodeState.putShared("roleIDinSession",recordRequest.result[0].approleid)
      
  } catch (error) {
    logger.error('Failed to retrieve alpha_kyid_request custom object attributes in ListVerifiedPrerequisites ::, Exception: {}', error);
  }
}

// Query record in alpha_kyid_request managed object as per status
function queryPrerequisiteRequestStatus(userId, status1, status2, status3, action) {
  logger.debug("Inside queryPrerequisiteRequestStatus");
  var recordRequest = null;
  var recordRequestJSONObj = {};

  try {
    //recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND status eq "' + status1 + '"'},["type", "status", "contextid", "prereqenrollsaveinput", "enddate", "expirydate", "approleid"]);
      if(nodeState.get("journeyName")==="loginPrerequisite"){
          recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter: 'requester eq "' + userId + '" AND (status eq "' + status1 + '" OR status eq "' + status2 + '" OR status eq "' + status3 + '") AND (expiryaction eq "' + action + '")'}, ["type", "status", "contextid", "prereqenrollsaveinput", "enddate", "expirydate", "approleid", "expiryaction"]);
      }else{
          recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter: 'requester eq "' + userId + '" AND (status eq "' + status1 + '" OR status eq "' + status2 + '" OR status eq "' + status3 + '")'}, ["type", "status", "contextid", "prereqenrollsaveinput", "enddate", "expirydate", "approleid", "expiryaction"]);
      }
    
    logger.debug("Successfully queried record in alpha_kyid_request managed object in ListVerifiedPrerequisites :: " +JSON.stringify(recordRequest));
    //nodeState.putShared("roleId",recordRequest.result[0].approleid)
    recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
    return recordRequestJSONObj;
  } catch (error) {
    logger.error('Failed to retrieve alpha_kyid_request custom object attributes in ListVerifiedPrerequisites ::, Exception: {}', error);
  }
}

// Query using username to get _id
function getIdFromUsername(username) {
  try {
    var userQueryResult = openidm.query("managed/alpha_user",{_queryFilter: 'userName eq "' + username + '"',},["_id"]);
    logger.debug("userQueryResult is" + JSON.stringify(userQueryResult));
    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var id = userQueryResult.result[0]._id || null;
      nodeState.putShared("userIDinSession",id);
      return id;
    } else {
      logger.error("userName not found");
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}

// Query using username to get user attributes for sending email
function fetchKOGIDFromUserStore(id) {
  try {
    var userQueryResult = openidm.query("managed/alpha_user",{_queryFilter: '_id eq "' + id + '"',},["userName","mail","sn","givenName"]);
    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var userName = userQueryResult.result[0].userName || null;
      logger.debug("userName found - " + userName);
      var mail = userQueryResult.result[0].mail || null;  
      var sn = userQueryResult.result[0].sn || null;  
      var givenName = userQueryResult.result[0].givenName || null;
      logger.debug("mail - " + mail+" | sn - "+sn+" | givenName - "+givenName);  
      nodeState.putShared("sendAccessGrantAttr_MAIL",mail);
      nodeState.putShared("sendAccessGrantAttr_SN",sn);
      nodeState.putShared("sendAccessGrantAttr_GIVENNAME",givenName);
      return userName; 
    } else {
      logger.error("userName not found");
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}


// MAIN
function main() {
  var userId = null;
  var txid = null;
  var prereq_KOGID = null;
  var verifiedRequests = null;
  var allRequests = null;
  var username = null;
  var verifiedRequestsJSONOutput = null;
  var entry = null;
  var enteredForm = null;
  var entryHasValidKeys = false;
  var entryHasValidName = false;
  var enteredFormName = null;
  var userDetailsFromExtIdenitity = null;
  var selectedOutcome = null;
  var contextID = null;
  var typeofprerequisite = null;
  var requestType = null;
  var prerequisiteToShow = [];
  var prereqListArray = [];
  var policy = null;
  var preqtypeArray = [];
  var viewFlag = null;
  var ops = null;
  var viewFlag = null;

  try {
  nodeLogger = require("KYID.2B1.Library.Loggers");
  username = nodeState.get("username");
  txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
  nodeLogger.log("error", nodeConfig, "begin", txid)
  ops = require("KYID.2B1.Library.IDMobjCRUDops");
      
    if (username!= null && username) {
        userId = getIdFromUsername(username);
        prereq_KOGID = fetchKOGIDFromUserStore(userId);
        if(nodeState.get("journeyName")==="loginPrerequisite"){
            verifiedRequests = queryPrerequisiteRequestStatus(userId, "EXPIRED", "EXPIRED_INPROGRESS", "", "login.reVerify");
        }else{
            verifiedRequests = queryPrerequisiteRequestStatus(userId, "COMPLETED", "EXPIRED", "EXPIRED_INPROGRESS");
        }
        
        nodeLogger.log("error", nodeConfig, "mid", txid, "verifiedRequests is - " + JSON.stringify(verifiedRequests));
    } else {
        nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid username"); 
        errMsg = nodeLogger.readErrorMessage("KYID101"); 
        nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
        nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg)); 
        action.goTo(nodeOutcome.ERROR);  
    }
        if (callbacks.isEmpty()) {
            if(verifiedRequests.length>0){
              nodeState.putShared("isverifiedprerequisites",true);
              nodeState.putShared("journeyName","reverifyPrerequisite");
              var itemsArray = verifiedRequests.map((item) => ({
              Name: getPrerequisitData(item.type, "name"),
              Description: getPrerequisitData(item.type, "description"),
              Type: getPrerequisitData(item.type, "typeofprerequisite"),
              Status: item.status,
              View: item.prereqenrollsaveinput ? item.prereqenrollsaveinput: "false",
              Ellipsis: [
                  {"action": "reverify"},
                  {"action":"delete"} 
                ],
              completeDate: parseCompletionDate(item.enddate),
              expiryDate: parseExpiredDate(item.expirydate)
              }));

             verifiedRequestsJSONOutput = {result: itemsArray};
             callbacksBuilder.textOutputCallback(0, JSON.stringify(verifiedRequestsJSONOutput));
             callbacksBuilder.textInputCallback("Enter the form type to view");
             if(nodeState.get("journeyName")==="loginPrerequisite"){
                 callbacksBuilder.confirmationCallback(0, ["Submit", "Back"], 0);
             }else{
                callbacksBuilder.confirmationCallback(0, ["Submit"], 0);
             }  
            }else{
                   callbacksBuilder.textOutputCallback(0, "No pre-requisites to show");
                   // nodeState.putShared("retry",true);
                   //errMsg = nodeLogger.readErrorMessage("KYID111"); 
                   //nodeState.putShared("readErrMsgFromCode","No pre-requisites to show");
                   //action.goTo(nodeOutcome.RETRY);
           }
          }else {
            selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if(selectedOutcome === 0){
                enteredForm = JSON.parse(callbacks.getTextInputCallbacks().get(0));
                nodeState.putShared("enteredForm", enteredForm);
                if(enteredForm!== null && enteredForm && Array.isArray(enteredForm) ){
                    nodeLogger.log("error", nodeConfig, "mid", txid, "enteredForm is - "+JSON.stringify(enteredForm));
                    //entry = Array.isArray(enteredForm) && enteredForm.length === 1 ? enteredForm[0] : nodeLogger.log("error", nodeConfig, "mid", txid, "enteredForm is not a valid Array");
                    entry = enteredForm[0];
                    nodeLogger.log("error", nodeConfig, "mid", txid, "entry is - " +entry["Name"]);
                    entryHasValidKeys = Object.keys(entry).length === 2 && entry.hasOwnProperty("Name") && entry.hasOwnProperty("action");
                    entryHasValidName = verifiedRequests.some((item) => item.type == entry["Name"]);
                    nodeLogger.log("error", nodeConfig, "mid", txid, "hasValidKeys is - " + entryHasValidKeys+" nameExists is - " + entryHasValidName);
                    enteredFormName = entry["Name"];
                    nodeState.putShared("prereqtype", enteredFormName)
                    if(enteredFormName!==null && enteredFormName){
                        queryPrerequisiteRequestRole(userId,enteredFormName )
                        policy = getPrerequisitePolicy(nodeState.get("roleId"));
                        viewFlag =  nodeState.get("prereqenrollsaveinput")
                        logger.debug("viewFlag is "+ viewFlag)
                        contextID = queryPrerequisiteRequestContexID(userId,enteredFormName)
                        nodeState.putShared("prereqContextID", contextID[0].contextid)
                        nodeState.putShared("prereqtype",enteredFormName)
                        if(nodeState.get("policy")!== null && nodeState.get("policy")){
                                    logger.debug( " policy is is "+ nodeState.get("policy"))
                                    prereqListArray = getListPrerequisite(nodeState.get("policy"),enteredFormName );
                                    prereqListArray.push("kyid_prerequisite_workflow")
                                    checkifWorkflowExist(userId,nodeState.get("roleId"),"kyid_prerequisite_workflow", "TODO");
                                    if(nodeState.get("workflowExist")==false && (nodeState.get("expiryaction") !== "login.reVerify")){
                                        populateRequestObject(txid,nodeConfig,ops,nodeState.get("prereqContextID"),"kyid_prerequisite_workflow",userId,"TODO",dateTime,"","",nodeState.get("numberofRequest"));  
                                    }
                                    logger.debug("prereqListArray is " + prereqListArray)
                                    nodeState.putShared("prereqListArray",prereqListArray)
                        }else{
                            nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid data entered"); 
                            nodeState.putShared("retry",true);
                            errMsg = nodeLogger.readErrorMessage("KYID112"); 
                            nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
                            nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                            action.goTo(nodeOutcome.RETRY);
                        }
                        if(prereqListArray!==null && prereqListArray){
                            prereqListArray.forEach(item => {
                                preqtypeArray.push(getPrerequisiteType(item))
                            })
                            preqtypeArray.push("workflow");
                          logger.debug("preqtypeArray is "+ preqtypeArray)
                          nodeState.putShared("preqtypeArray",preqtypeArray)
                      }
                        }else{
                            nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid form Name entered"); 
                            nodeState.putShared("retry",true);
                            errMsg = nodeLogger.readErrorMessage("KYID101"); 
                            nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
                            nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                            action.goTo(nodeOutcome.RETRY);
                        }
                    }else{
                            nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid form entered");
                            nodeState.putShared("retry",true);
                            nodeState.putShared("readErrMsgFromCode","Invalid form entered");
                            action.goTo(nodeOutcome.RETRY);
                    }

                if (entryHasValidKeys && entryHasValidName && entry.action.toLowerCase() === "view" ) {
                    if(viewFlag === true){
                      userDetailsFromExtIdenitity = getSubmittedPrereqPagesDetails(userId,enteredFormName);
                      nodeState.putShared("viewPreqData",JSON.stringify(userDetailsFromExtIdenitity));
                      action.goTo(nodeOutcome.VIEWPREQUISITEDATA);
                    }else{
                    nodeLogger.log("error", nodeConfig, "mid", txid, "You cannot view this Prerequisite"); 
                    nodeState.putShared("retry",true);
                    errMsg = nodeLogger.readErrorMessage("KYID113"); 
                    nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
                    action.goTo(nodeOutcome.RETRY);
                    }
                 } else if(entryHasValidKeys && entryHasValidName && entry.action.toLowerCase() === "reverify"){
                          userDetailsFromExtIdenitity = getSubmittedPrereqPagesDetails(userId,enteredFormName);
                          nodeState.putShared("viewPreqData",JSON.stringify(userDetailsFromExtIdenitity));
                          action.goTo(nodeOutcome.REVERIFY)
                 } else if(entryHasValidKeys && entryHasValidName && entry.action.toLowerCase() === "delete"){

                      action.goTo(nodeOutcome.SOFTDELETE)
                } else {
                    nodeLogger.log("error", nodeConfig, "mid", txid, "Invalid data entered"); 
                    nodeState.putShared("retry",true);
                    errMsg = nodeLogger.readErrorMessage("KYID112"); 
                    nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
                    action.goTo(nodeOutcome.RETRY); 
                 }
             }else if(selectedOutcome === 1){
                 action.goTo(nodeOutcome.BACK);
             }   
          }
    } catch (error) {
        nodeLogger.log("error", nodeConfig, "mid", txid, "Error in try is "+error); 
        nodeState.putShared("retry",true);
        errMsg = nodeLogger.readErrorMessage("KYID111"); 
        nodeState.putShared("readErrMsgFromCode",JSON.stringify(errMsg));
        action.goTo(nodeOutcome.RETRY);
    }
}

// Invoke Main Function
main();