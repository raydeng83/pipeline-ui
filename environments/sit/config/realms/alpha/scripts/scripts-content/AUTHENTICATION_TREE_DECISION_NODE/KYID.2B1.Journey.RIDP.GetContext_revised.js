/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var context = null; 
var userPrereqId = null; 
var userId = nodeState.get("userID")
logger.debug("KYID.2B1.Journey.RIDP.GetContext  User Id is --> "+userId )
logger.debug("JOURNEY IS "+ nodeState.get("journeyName"))
try {
    logger.debug("Executing KKYID.2B1.Journey.RIDP.GetContextt ")
    logger.debug("Request Params are --> "+ requestParameters)
    if(typeof existingSession != 'undefined'){
       userId= existingSession.get("UserId")
    logger.debug("KYID.2B1.Journey.RIDP.GetContext  User Id is --> "+userId )
    if (requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")){
        logger.debug("Request Params are --> "+ requestParameters)
        if(requestParameters.get("context")[0] && requestParameters.get("context")[0] === "appEnroll" && requestParameters.get("userPrereqId")[0]){
        context = requestParameters.get("context")[0]
        userPrereqId = requestParameters.get("userPrereqId")[0]
        nodeState.putShared("context",context)
        nodeState.putShared("userPrereqId",userPrereqId)
       
        logger.debug("context: "+ context +"::"+"userPrereqId:"+userPrereqId)
        if(getUserPrereqDetails(userPrereqId)){
            userPrereqResponse = getUserPrereqDetails(userPrereqId)
            if(userPrereqResponse && userPrereqResponse.requestedUserAccountId === userId){
            if( userPrereqResponse.preRequisiteTypeId.typeName ==="0"){
                logger.debug("KYID.2B1.Journey.RIDP.GetContext --> Context "+context)
                logger.debug("KYID.2B1.Journey.RIDP.GetContext --> userPrereqId "+userPrereqId)
                nodeState.putShared("appEnrollRIDPMethod","LexisNexis")
                action.goTo("appEnrollRIDP");
            }
            else if(userPrereqResponse.preRequisiteTypeId.typeName ==="1" || userPrereqResponse.preRequisiteTypeId.typeName ==="RIDP"){
                logger.debug("KYID.2B1.Journey.RIDP.GetContext --> Context "+context)
                logger.debug("KYID.2B1.Journey.RIDP.GetContext --> userPrereqId "+userPrereqId)
                 nodeState.putShared("appEnrollRIDPMethod","CMS")
                action.goTo("appEnrollRIDP");
                
            }
                
            }
            else{
                    message = "User ID is not matching with user PrereqId"
                    displayCallback(message)
            }


        }
        else{
            message = "UserPrereqsite is Invalid"
            displayCallback(message)
        }
            
        }else if(requestParameters.get("context")[0] === "loginPrereq" && requestParameters.get("userPrereqId") && nodeState.get("journeyName")!=null){
            action.goTo("True");
        }
        else{
            message = "Invalid_Request"
            displayCallback(message)
        }
        
   
}
else{
    if(nodeState.get("journeyName")!== null && nodeState.get("journeyName")){
        action.goTo("True");
    }
    else{
            message = "Invalid_Request"
            displayCallback(message)
        
    }

   
}
        
    }

else{
    if(nodeState.get("journeyName")!== null && nodeState.get("journeyName")){
        if(nodeState.get("firsttimeloginjourney") == "true"){
             action.goTo("firsttime");
        }else{
             action.goTo("True");
        }
       
    }
    else{
            message = "Session_Not_Found"
            displayCallback(message)
        
    }
   
}
    
} catch (error) {
    logger.error("Error In KYID.2B1.Journey.Login.Register.MFA.GetContext "+error)
}

function getUserPrereqDetails(userPrereqId) {
    try {
        // const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'+' AND status eq "'+"NOT_STARTED"+'"'},
        //                            ["preRequisiteTypeId/*","preRequisiteId/*","*"])
        
        // const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'},
        //                            ["preRequisiteTypeId/*","preRequisiteId/*","*"])
      const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+
                                  ' AND (recordState eq "ACTIVE" or recordState eq "0") AND (status eq "0" or status eq "NOT_STARTED" or status eq "5" or status eq "EXPIRED" or status eq "2" or status eq "COMPLETED" or status eq "REVERIFY" or status eq "8" or status eq "PENDING" or status eq "7")'},
                                   ["preRequisiteTypeId/*","preRequisiteId/*","*"])
        logger.debug("KYID.2B1.Journey.RIDP.GetContext -- getUserPrereqDetails response is --> "+response)
        if(response && response.resultCount>0){
            logger.debug("userPrereqStatus"+response.result[0].status)
            logger.debug("userPrereqRoleId"+response.result[0].associatedRoleIds)
            nodeState.putShared("userPrereqStatus",response.result[0].status)
            nodeState.putShared("userPrereqRoleId",response.result[0].associatedRoleIds)
            if(response.result[0].expiry){
                nodeState.putShared("dueDateType",response.result[0].expiry.dueDateType)
                nodeState.putShared("dueDateValue",response.result[0].expiry.dueDateValue)
            }
            
            
            return response.result[0]
        }
        else{
            return null
        }
   
     
    } catch (error) {
        logger.error("Error Occurred while getUserPrereqDetails "+ error + "userPrerqId: "+userPrereqId + "userId: "+ userId)
    
}

}


function displayCallback(message) {
    try {
    if (callbacks.isEmpty()) {
        callbacksBuilder.textOutputCallback(0,message);
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } else {
        if(selectedOutcome === 0) {
            action.goTo("false");
         }
        
    }
    } catch (error) {
        logger.error("Error Occurred in displayCallback function")
        
    }
    
}

