/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var context = null; 
var userPrereqId = null; 
var requiredMFACode = "0"; 
var userId = nodeState.get("UserId")

function getExpiryDate(userPrereqResponse) {
    try {
        if(userPrereqResponse.result[0].preRequisiteId !=null && userPrereqResponse.result[0].preRequisiteId.expiry!=null && (userPrereqResponse.result[0].preRequisiteId.expiry.dueDateType!=null || userPrereqResponse.result[0].preRequisiteId.expiry.dueDateValue!=null )){
            var dueDateType = userPrereqResponse.result[0].preRequisiteId.expiry.dueDateType;
            var dueDateValue =  userPrereqResponse.result[0].preRequisiteId.expiry.dueDateValue;              
            nodeState.putShared("dueDateType",dueDateType)
            nodeState.putShared("dueDateValue",dueDateValue)
            if(userPrereqResponse.result[0].preRequisiteTypeId != null && userPrereqResponse.result[0].preRequisiteTypeId._refResourceId!=null){
                var preRequisiteTypeId = userPrereqResponse.result[0].preRequisiteTypeId._refResourceId;
                nodeState.putShared("preRequisiteTypeId",preRequisiteTypeId)
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getExpiryDate "+ error + "userPrerqId: "+userPrereqId + "userId: "+ userId)
        action.goTo("False");
    }
}

function getuserDetails() {
    try {
        var userIdentity = openidm.query("managed/alpha_user", { "_queryFilter": "/_id eq \"" + userId + "\"" }, ["userName", "_id", "frIndexedString1", "frIndexedString2", "custom_userType", "accountStatus", "custom_createDateISO", "custom_updatedDateISO", "passwordLastChangedTime", "passwordExpirationTime", "mail"]);
        if (userIdentity.result && userIdentity.result.length > 0) {
            nodeState.putShared("mail",userIdentity.result[0].mail)
            var user = userIdentity.result[0];
            return user
        } else {
            return null;
        }
    } catch (error) {
        nodeLogger.error("Error getUserDetails: " + error.message);
        return null;
    }
}

try {
    logger.debug("KYID.2B1.Journey.Manage.Profile.GetContext")
    logger.debug("Request Params are --> "+ requestParameters)
    getuserDetails()
    if (requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")){
        logger.debug("Request Params are --> "+ requestParameters)
            if(requestParameters.get("context")[0] && requestParameters.get("context")[0] === "loginPrereq" && requestParameters.get("userPrereqId")[0]){
                logger.debug("inside loginPrereq")
                nodeState.putShared("journeyName","loginPrereq")
                context = requestParameters.get("context")[0]
                userPrereqId = requestParameters.get("userPrereqId")[0]  
                nodeState.putShared("context",context)
                nodeState.putShared("userPrereqId",userPrereqId)   
                logger.debug("context: "+ context +"::"+"userPrereqId:"+userPrereqId)

                if(getUserPrereqDetails(userPrereqId)){
                    userPrereqResponse = getUserPrereqDetails(userPrereqId)
                    if(userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="7"){
                            nodeState.putShared("prereqtype","manageprofile")
                            if(userPrereqResponse.result[0].preRequisiteId != null && userPrereqResponse.result[0].preRequisiteTypeId._refResourceId!=null){
                                var preRequisiteId = userPrereqResponse.result[0].preRequisiteId._refResourceId;
                                nodeState.putShared("preRequisiteId",preRequisiteId)
                            }
                            if(!(userPrereqResponse.result[0].expiryDate!==null || userPrereqResponse.result[0].expiryDateEpoch!==null)){
                                getExpiryDate(userPrereqResponse)
                            }

                            if(userPrereqResponse.result[0].requestedUserAccountId === userId){
                                nodeState.putShared("requestedUserAccountId",userId)
                                action.goTo("True");
                            }else{
                                message = "User ID is not matcing with user PrereqId"
                                displayCallback(message)
                            }
                    }else if(userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="2"){
                            nodeState.putShared("prereqtype","organdonor")
                            if(userPrereqResponse.result[0].preRequisiteId != null && userPrereqResponse.result[0].preRequisiteTypeId._refResourceId!=null){
                                var preRequisiteId = userPrereqResponse.result[0].preRequisiteId._refResourceId;
                                nodeState.putShared("preRequisiteId",preRequisiteId)
                            }
                            if(!(userPrereqResponse.result[0].expiryDate!==null || userPrereqResponse.result[0].expiryDateEpoch!==null)){
                                getExpiryDate(userPrereqResponse)
                            }

                            if(userPrereqResponse.result[0].requestedUserAccountId === userId){
                                nodeState.putShared("requestedUserAccountId",userId)
                                action.goTo("True");
                            }else{
                                message = "User ID is not matcing with user PrereqId"
                                displayCallback(message)
                            }
                    }
                }else{
                    message = "UserPrereqsite is not in NO_STARTED state"
                    displayCallback(message)
                }
            }else{
                action.goTo("True");
            }  
      }
      else{
            action.goTo("True");
      }
    
} catch (error) {
    logger.error("Error In KYID.2B1.Journey.Login.Register.MFA.GetContext "+error)
    action.goTo("False");
}

function getUserPrereqDetails(userPrereqId) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/",{"_queryFilter":'/_id/ eq "' + userPrereqId + '"' + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'+ ' AND (status eq "NOT_STARTED" OR status eq "0" OR status eq "COMPLETED" OR status eq "2")'}, ["preRequisiteTypeId/*","preRequisiteId/*","*"])
       // const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'+' AND status eq "'+"NOT_STARTED"+ 'OR status eq'+ "0" +'"'}, ["preRequisiteTypeId/*","preRequisiteId/*","*"])
        logger.debug("KYID.2B1.Journey.Login.Register.MFA.GetContext -- getUserPrereqDetails response is --> "+response)
        if(response && response.resultCount>0){
            return response
        }
        else{
            return null
        }
   
     
    } catch (error) {
        logger.error("Error Occurred while getUserPrereqDetails "+ error + "userPrerqId: "+userPrereqId + "userId: "+ userId)
        action.goTo("False");
    
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

