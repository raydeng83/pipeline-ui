var _ = require('lib/lodash');
function getException(e) {
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message;
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message;
  } else if (_.has(e, 'message')) {
    return e.message;
  } else {
    return e;
  }
}

(function () {
    if (request.method === 'create') {
      // POST
      logger.error("Enrolment contextID param value is: "+request.content.contextID);
      var contextID = request.content.contextID;
      return getEnrolmentPrerequisiteTypes(contextID);
      //return {};
    } else if (request.method === 'read') {
      // GET
      //return getEnrolmentPrerequisites("abcde12345");
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());


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


