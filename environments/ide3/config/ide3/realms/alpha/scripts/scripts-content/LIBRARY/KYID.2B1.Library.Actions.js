function removeRole(userId, role) {
    logger.error("inside removeRole libarary")
    var deletedRoleResult = null;
    var roleID = null;
    var roleInfo = null;
    
  if (userId !== null && role !== null && userId && role) {
    logger.error("user" + userId);
    logger.error("role" + role);
    roleInfo = openidm.query("managed/alpha_user/" + userId + "/roles", { "_queryFilter": '/_refResourceId/ eq "' + role + '"' }, ["_id"]);
    logger.error("roleInfo is " +JSON.stringify(roleInfo));
    roleID = roleInfo.result[0]._id;
    deletedRoleResult = openidm.delete("managed/alpha_user/" + userId + "/roles/" + roleID , null);
    logger.error("deletedResult" +deletedRoleResult._id);
    if(deletedRoleResult._id!==null){
        logger.error("Inside after deletedResult")
      // nodeState.putShared("roleRemoved", "true");
         logger.error("Inside after deletedResult2")
        return true;       
    }else{
    logger.error("Inside after deletedResult")
      nodeState.putShared("roleRemoved", "false");
        return false;
    }  
  }
}


// function softDeletePrereq(userId, prereqListArray, preqtypeArray, contextID){
//   var prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
//   var patchedArray = [];
//   var result = null;
//   try{
//       logger.error("Inside softDeletePrereq")
//     if(prereqListArray!==null && prereqListArray.length>0 && preqtypeArray!== null && preqtypeArray.length>0){
//         logger.error("Inside softDeletePrereq function try")
//           prereqListArray.forEach(type => {
//               logger.error("inside type is "+ type)
//             preqtypeArray.forEach(item =>{
//                 logger.error("inside item is "+ item)
//                 if(item!== "workflow"){
//                   var timestamp = new Date().toISOString();
//                   var dataObj = {
//                       "status": "DELETED",
//                       "enddate": timestamp
//                   };
//                   patchedArray.push(prerequisiterecord.patchRequest(contextID,userId,type,dataObj)) ;
//                 }
//             })
//         });
//         logger.error("patchedArray is "+ JSON.stringify(patchedArray));
//         if(patchedArray.length === prereqListArray.length){
//             return true;
//         }else{
//             return false;
//         }
//     }
//   }catch(error){
//     logger.error("Error in catch is "+ error)
//   }
// }

function softDeletePrereq(userId,contextID, prereqRemove ){
  var prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
  var patchedArray = [];
  var result = null;
  try{
    logger.error("Inside softDeletePrereq")
    if(prereqRemove!==null && prereqRemove.length>0){
        logger.error("Inside softDeletePrereq function try")
            prereqRemove.forEach(item =>{
                logger.error("inside item is "+ item)
                  var timestamp = new Date().toISOString();
                  var dataObj = {
                      "status": "DELETED",
                      "enddate": timestamp
                  };
                  patchedArray.push(prerequisiterecord.patchRequest(contextID,userId,item,dataObj)) ;
        });
        logger.error("patchedArray is "+ JSON.stringify(patchedArray));
        if(patchedArray.length === prereqListArray.length){
            return true;
        }else{
            return false;
        }
    }
  }catch(error){
    logger.error("Error in catch is "+ error)
  }
}


function getExtIds(uuid,type,pageNumber,saveinput){
logger.error("Inside getExtIds ")
var recordSubmittedPreqreqPage = null;
var extIds =[];
try{
if(saveinput === false && pageNumber === null){
    recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter": 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"'}, ["pageNumber","verificationCompleted"]);
    logger.error("recordSubmittedPreqreqPage1 is "+ JSON.stringify(recordSubmittedPreqreqPage));
    if(recordSubmittedPreqreqPage.result.length>0){
        for(var i=0 ; i<recordSubmittedPreqreqPage.result.length ;i++){
            extIds.push(recordSubmittedPreqreqPage.result[i]._id)  
        }
        logger.error("extIds is in "+ extIds)
        return extIds;
    }         
}
}catch(error){
    logger.error('Failed to retrieve alpha_kyid_extendedIdentity custom object attributes, Exception: '+error);
}
}

// TO DELETE THE DATA FROM EXTENDED IDENTITY 
function deleteExistingFormDataFromIDNObj(listOfIDs){
    logger.error("Inside deleteExistingFormDataFromIDNObj ");
    var removeExtIdentityDataResponse = null;
    try{
        for(var i=0; i<listOfIDs.length; i++){
            removeExtIdentityDataResponse = openidm.delete("managed/alpha_kyid_extendedIdentity/"+listOfIDs[i], null);
             if(removeExtIdentityDataResponse!=null && removeExtIdentityDataResponse){
                // logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                            // + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.removeExtIdentityDataResponse);
                  logger.error("removeExtIdentityDataResponse is"+ removeExtIdentityDataResponse);
             } 
        }

    } catch (error){
        logger.error("error in deleteExistingFormDataFromIDNObj" + error);
    }
}

    // Function to get context IDs from enrolment context
function getContextIds(uuid, roleID) {
    logger.error("Inside getContextIds");
    var contextIds = [];
    try {
        var queryFilter = 'userID eq "' + uuid + '" and roleId eq "' + roleID + '"';
        var existingContextResult = openidm.query("managed/alpha_kyid_enrolmentcontext", {
            "_queryFilter": queryFilter
        });

        logger.error("existingContextResult is: " + JSON.stringify(existingContextResult));
        if (existingContextResult && existingContextResult.result.length > 0) {
            for (var i = 0; i < existingContextResult.result.length; i++) {
                contextIds.push(existingContextResult.result[i]._id);
            }
            logger.error("contextIds found: " + contextIds);
        }
    } catch (error) {
        logger.error('Failed to retrieve alpha_kyid_enrolmentcontext records. Exception: ' + error);
    }
    return contextIds;  // Always return the array, even if empty
}


// Function to delete data from enrolment context  based on role
function deleteExistingContextIdsObj(listcontextIDs) {
    logger.error("Inside deleteExistingContextIdsObj");
    try {
        for (var i = 0; i < listcontextIDs.length; i++) {
            var deleteResponse = openidm.delete("managed/alpha_kyid_enrolmentcontext/" + listcontextIDs[i], null);
            if (deleteResponse !== null && deleteResponse !== undefined) {
                logger.error("Successfully deleted context ID: " + listcontextIDs[i]);
            } else {
                logger.error("No data found to delete for context ID: " + listcontextIDs[i]);
            }
        }
    } catch (error) {
        logger.error("Error in deleteExistingContextIdsObj: " + error);
    }
}

//Function to add mutliple role for a user
function addRole(roleIDArray, uuid) {
    logger.error("Inside addRole with roleID array: " + roleIDArray + " and UUID: " + uuid);
    var response = null;
    try {
        // Fetch current roles once
        response = openidm.query("managed/alpha_user/" + uuid + "/roles", { "_queryFilter": "true" }, ["_refResourceId"]);
        logger.error("Response in addRole is -- " + JSON.stringify(response));
        
        if (response && response.resultCount > 0) {
            // adding current roles to a currentRoles obj for lookup
            var currentRoles = {};
            for (var i = 0; i < response.resultCount; i++) {
                currentRoles[response.result[i]._refResourceId] = true;
            }

            // Looping through each roleID
            for (var j = 0; j < roleIDArray.length; j++) {
                var roleID = roleIDArray[j];
                if (currentRoles[roleID]) {
                    // Role is already present for the user
                    logger.info("Role " + roleID + " already assigned to user " + uuid);
                } else {
                    // If Role not present, add it
                    var patch = [
                        {
                            "operation": "add",
                            "field": "roles/-",
                            "value": {
                                "_ref": "managed/alpha_role/" + roleID,
                                //"_refProperties": {}
                            }
                        }
                    ];
                    var resourcePath = "managed/alpha_user/" + uuid;
                    var addRoleResult = openidm.patch(resourcePath, null, patch);
                    logger.error("addRole result is :: " + JSON.stringify(addRoleResult));
                }
            }
        } else {
            logger.error("No roles found for user or response invalid");
        }
    } catch (error) {
        logger.error("Failed to add role: " + error);
    }
}

exports.removeRole = removeRole;
exports.softDeletePrereq = softDeletePrereq;
exports.getExtIds = getExtIds;
exports.deleteExistingFormDataFromIDNObj = deleteExistingFormDataFromIDNObj;
exports.deleteExistingContextIdsObj = deleteExistingContextIdsObj;
exports.getContextIds = getContextIds;
exports.addRole = addRole;

