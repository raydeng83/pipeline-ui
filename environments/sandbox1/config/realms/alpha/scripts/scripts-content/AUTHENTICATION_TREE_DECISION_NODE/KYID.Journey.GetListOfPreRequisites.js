/**
 * Script: KYID.Journey.GetListOfPreRequisites
 * Description: This script is used to obtain list of prerequisites.
 * Date: 03rd Mar 2025
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get List of Prerequisites",
    script: "Script",
    scriptName: "KYID.Journey.GetListOfPreRequisites",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    EXIST: "Yes",
    NOT_EXIST: "No"
};

// Declare Global Variables


function getEnrolmentPrerequisiteTypes(id) {

    var roleID = null;
    var policyID = null;
    var arrPreReqTypeIDs = [];
    var arrPreReqType = [];
    var response = {};
    var recordEnrolmentContext = null;
  
    try { 
        recordEnrolmentContext = openidm.query("managed/Alpha_Kyid_EnrolmentContext", { "_queryFilter" : '/contextID eq "'+id+'"'}, ["contextID", "role"]);
        //logger.error("Successfully retrieved Alpha_Kyid_EnrolmentContext custom object attributes :: "+JSON.stringify(recordEnrolmentContext.result[0]));
        var jsonEnrolmentContextData =  JSON.stringify(recordEnrolmentContext.result[0]);
        var jsonEnrolmentContextParsedData = JSON.parse(jsonEnrolmentContextData);
        var jsonRoleData = jsonEnrolmentContextParsedData["role"]; //To fetch role id details
        //logger.error("Role Details :: "+JSON.stringify(jsonRoleData));
        var jsonRoleParsedData = JSON.parse(JSON.stringify(jsonRoleData));
        roleID = jsonRoleParsedData["_refResourceId"];
        //logger.error("RoleID :: "+roleID);
        if(roleID!=null && roleID){
          policyID = getRoleDetails(roleID);
          
          if(policyID!=null && policyID){
             arrPreReqTypeIDs = getPolicyDetails(policyID);
             if(arrPreReqTypeIDs.length>0){
              //response["_prereqtypes"] = arrPreReqTypeIDs;
              arrPreReqType = getListOfPrereqTypes(arrPreReqTypeIDs);
              response["_prereqtypes"] = arrPreReqType;
            }
          }
        }
        
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_EnrolmentContext custom object attributes, Exception: {}', exceptionMessage);
    }
 
    return response;
}


function getRoleDetails(id) {
  
   var recordRole = null;
   var policyID = null;
   try { 
        recordRole = openidm.query("managed/alpha_role", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "name", "_policy"]);
        //logger.error("Successfully retrieved alpha_role managed object attributes :: "+JSON.stringify(recordRole.result[0]));
        var jsonRoleData =  JSON.stringify(recordRole.result[0]);
        var jsonRoleParsedData = JSON.parse(jsonRoleData);
        var jsonPolicyData = jsonRoleParsedData["_policy"]; //To fetch policy id details
        //logger.error("Policy Details :: "+JSON.stringify(jsonPolicyData));
        var jsonPolicyParsedData = JSON.parse(JSON.stringify(jsonPolicyData));
        policyID = jsonPolicyParsedData["_refResourceId"];
        //logger.error("PolicyID :: "+policyID);
        
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve alpha_role custom object attributes, Exception: {}', exceptionMessage);
    }

  return policyID;
}


function getPolicyDetails(id) {
  
   var recordPolicy = null;
   var arrPreReqType = [];
   try { 
        recordPolicy = openidm.query("managed/Alpha_Kyid_Policy", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "policyName", "_prereqtypes"]);
        //logger.error("Successfully retrieved Alpha_Kyid_Policy custom managed object attributes :: "+JSON.stringify(recordPolicy.result[0]));
        var jsonPolicyData =  JSON.stringify(recordPolicy.result[0]);
        var jsonPolicyParsedData = JSON.parse(jsonPolicyData);
        var jsonPrerequisiteTypeData = jsonPolicyParsedData["_prereqtypes"]; //To fetch prereqtypes id details
        //logger.error("PrerequisiteTypeData Details :: "+JSON.stringify(jsonPrerequisiteTypeData)+" | Length of PrerequisiteTypeData :: "+jsonPrerequisiteTypeData.length);
        for(var i=0; i<jsonPrerequisiteTypeData.length;i++){
          var tmpPrerequisiteTypeData = jsonPrerequisiteTypeData[i];
          //logger.error("PrerequisiteTypeData "+i+" :: "+JSON.stringify(tmpPrerequisiteTypeData));
          var jsonPrerequisiteTypeParsedData = JSON.parse(JSON.stringify(tmpPrerequisiteTypeData));
          //logger.error("PrerequisiteTypeID :: "+jsonPrerequisiteTypeParsedData["_refResourceId"]);
          arrPreReqType.push(jsonPrerequisiteTypeParsedData["_refResourceId"]);
        }
        //logger.error("PrerequisiteTypeIDs ArrayList  :: "+arrPreReqType);
     
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_Policy custom object attributes, Exception: {}', exceptionMessage);
    }

   return arrPreReqType;
}


function getListOfPrereqTypes(arrPreReqTypeIDs){

  var listOfPrereqTypes = [];
  var recordPrereqTypes = null;
  try { 
        for(var j=0;j<arrPreReqTypeIDs.length;j++){
          var id = null;
          id = arrPreReqTypeIDs[j];
          recordPrereqTypes = openidm.query("managed/Alpha_Kyid_PrerequisiteType", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "name", "isSave"]);
          //logger.error("Successfully retrieved Alpha_Kyid_PrerequisiteType custom managed object attributes :: "+JSON.stringify(recordPrereqTypes.result[0]));
          var jsonPrereqTypesData =  JSON.stringify(recordPrereqTypes.result[0]);
          var jsonPrereqTypesParsedData = JSON.parse(jsonPrereqTypesData);
          listOfPrereqTypes.push(jsonPrereqTypesParsedData["name"]);
        }
        //logger.error("List of PrerequisiteTypes :: "+listOfPrereqTypes);
        
  } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_PrerequisiteType custom object attributes, Exception: {}', exceptionMessage);
  }

    return listOfPrereqTypes;
}


function main(){

    var response = {};
    try {
        logger.error("RLogs::Inside KYID.Journey.GetListOfPreRequisites script main method");
       // var contextID = nodeState.get("contextID")[0];
        var contextID ="abcde12345";
        logger.error("RLogs::ContextID: "+contextID);
        if(contextID!=null && contextID){
           response=getEnrolmentPrerequisiteTypes(contextID);
           nodeState.putShared("prereqtypesList",JSON.parse(JSON.stringify(response._prereqtypes)));
           if (callbacks.isEmpty()) {
                //var typeOfPrequisitesArray = JSON.parse(JSON.stringify(response._prereqtypes));
                callbacksBuilder.textOutputCallback(0,`<div class='success-message'>You will be required to do the following<br><br>`+JSON.stringify(response)+`<br><br></div>`);
            } else {
               action.goTo(nodeOutcome.EXIST); 
            }
           
        } else {
            response["code"] = "ERR00100";
            response["reason"] = "Bad Request";
            response["errorMessage"] = "contextID is a mandatory attribute";
            if (callbacks.isEmpty()) {
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+JSON.stringify(response)+`</div>`);        
            } else {
               action.goTo(nodeOutcome.NOT_EXIST);
            }        
        }
    } catch(error) {
        response["code"] = "ERR00101";
        response["reason"] = "Exception";
        response["errorMessage"] = "There was an error processing the request";
        logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
        if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+JSON.stringify(response)+`</div>`);    
        } else {
           action.goTo(nodeOutcome.NOT_EXIST);
        }
     }
    
}

//Invoke Main Function
main();

