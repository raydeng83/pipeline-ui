/**
 * Script: KYID.2B1.Journey.VerifiedPrerequisites.SoftDelete
 * Description: This script is used to soft delete prerequisites. 
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
    nodeName: "Script Soft Delete",
    script: "Script",
    scriptName: "KYID.2B1.Journey.VerifiedPrerequisites.SoftDelete",
    begin: "Begin Function Execution", 
    input: "Enter your response",
    function: "Function", 
    end: "Function Execution Completed",
    error: "error"
};


// Node outcomes
var nodeOutcome = {
    NEXT: "next",
    ERROR: "error"
};

function queryPrerequisiteRequest(userId, roleID, value) {
  logger.debug("Inside queryPrerequisiteRequestContexID");
  var recordRequest = null;
  var recordRequestJSONObj = {};
  var contextID =  null;
  var type = [];

  try {
    recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND approleid eq "' + roleID + '"',},["contextid", "type"]);
    logger.debug("Successfully queried record in alpha_kyid_request managed object :: " +JSON.stringify(recordRequest));
    recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
    logger.debug("recordRequestJSONObj" + JSON.stringify(recordRequest.result));
    contextID= recordRequest.result[0].contextid;
      logger.debug("contextID is in "+ contextID)
    recordRequestJSONObj.forEach(element => {
        type.push(element.type);
    });
    if(value ===  "contextID"){
        return contextID;
    }else if(value ===  "type"){
        return type
    }
  } catch (error) {
    logger.error("failure in " + error);
  }
}


function queryPrerequisiteType(uuid, type, roleID, contextID) {
  logger.debug("Inside queryPrerequisiteRequestContexID");
  var recordRequest = null;
  var recordRequestJSONObj = {};
  var prereqRemove =  [];
  var prerequisiteAction = require("KYID.2B1.Library.Actions");
  try {
        if(Array.isArray(type)){
                type.forEach(value=>{
                        recordRequest = openidm.query("managed/alpha_kyid_prerequisite",{_queryFilter:'prereqtypename eq "' + value +'"',},["disenrollmentactions"]);
                        logger.debug("recordRequest is in "+ JSON.stringify(recordRequest))
                        if(recordRequest!==null && recordRequest){
                                if(recordRequest.result[0].disenrollmentactions!==null && recordRequest.result[0].disenrollmentactions.removeprereq === true){
                                        prereqRemove.push(value);
                                }
                        }
                })
        }
      logger.debug("prereqRemove is "+ prereqRemove)
        prerequisiteAction.softDeletePrereq(uuid,contextID , prereqRemove);

  } catch (error) {
    logger.error("failure in " + error);
  }
}

//Main
function main(){
    var uuid =  nodeState.get("userIDinSession");
    var contextID = null;
    var type = null;
    var deleteStatus = null;
    var prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
    var prerequisiteAction = require("KYID.2B1.Library.Actions");
    //var nodeLogger = require("KYID.2B1.Library.Loggers");
    var txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId")); 
    var roleId = nodeState.get("roleId");
    var removedRole= null;
    var prereqListArray = nodeState.get("prereqListArray");
    var preqtypeArray = nodeState.get("preqtypeArray");
    var softDeleteResult = null;
    var roleInfo = null;

    try {
        logger.debug("RLogs::Inside KYID.2B1.Journey.VerifiedPrerequisites.SoftDelete script main method");
        //nodeLogger.log("error", nodeConfig, "begin", txid);
        logger.debug("role for user is" + roleId)
        logger.debug("uuid for user is" + uuid)
        contextID = queryPrerequisiteRequest(uuid, roleId, "contextID")
        type = queryPrerequisiteRequest(uuid, roleId, "type")
        if(type!==null && type){
            logger.debug("Inside Remove role")
            if(roleId!==null && roleId){
                // roleInfo = openidm.query("managed/alpha_user/" + userId + "/roles", { "_queryFilter": '/_refResourceId/ eq "' + roleId + '"' }, ["_id"]);
                // logger.error("roleInfo is "+ JSON.stringify(roleInfo))
                // if(roleInfo.result[0]._id !== null && roleInfo.result[0]._id ){
                    logger.debug("to RemovedRole is ");
                    removedRole = prerequisiteAction.removeRole(uuid,roleId);
                    logger.debug("removedRole is" + removedRole);
                    logger.debug("type is" + type);
                    var queryPrerequisiteType1 = queryPrerequisiteType(uuid, type, roleId , contextID);
            //      }else{
            //         var queryPrerequisiteType1 = queryPrerequisiteType(uuid, type, roleId , contextID);
            // }
                type.forEach(value =>{
                    var extIdsList = prerequisiteAction.getExtIds(uuid,value,null,false);
                    prerequisiteAction.deleteExistingFormDataFromIDNObj(extIdsList); 
                })
            action.goTo(nodeOutcome.NEXT)
            }else{
                //nodeLogger.log("error", nodeConfig, "end", txid); 
                //errMsg = nodeLogger.readErrorMessage("KYID100"); 
                nodeState.putShared("readErrMsgFromCode",errMsg);
                //nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg)); 
                action.goTo(nodeOutcome.ERROR);
            } 
        }
    }catch(error){
        //nodeLogger.log("error", nodeConfig, "end", txid, "Error in try is "+error);
        //errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",error);
        action.goTo(nodeOutcome.ERROR);   
    }
}


//Invoke Main Function
main();