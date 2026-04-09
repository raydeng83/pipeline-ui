/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var context = null; 
var userPrereqId = null; 
var requiredMFACode = "0"; 
var userId = nodeState.get("userID")

try {
    logger.error("Executing KYID.2B1.Journey.Login.Register.MFA.GetContext ")
    logger.error("Request Params are --> "+ requestParameters)
    getuserDetails()
    if (requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")){
        logger.error("Request Params are --> "+ requestParameters)
            if(requestParameters.get("context")[0] && requestParameters.get("context")[0] === "appEnroll" && requestParameters.get("userPrereqId")[0]){
            context = requestParameters.get("context")[0]
            userPrereqId = requestParameters.get("userPrereqId")[0]
            nodeState.putShared("context",context)
            nodeState.putShared("userPrereqId",userPrereqId)
            nodeState.putShared("journeyNameReporting","ApplicationEnrollment") //MFA Reporting
            logger.error("context: "+ context +"::"+"userPrereqId:"+userPrereqId)

                  if(getUserPrereqDetails(userPrereqId)){
                        userPrereqResponse = getUserPrereqDetails(userPrereqId)
                        if(userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="MFA" || userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="4"){
                              logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext --> userPrereqResponse:"+userPrereqResponse)
                              logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext --> User ID is --> "+userId)
                              if(userPrereqResponse.result[0].requestedUserAccountId === userId){
                              logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext --> Inside Userid == requestedUserAccountId")
                                    if(getRequiredMFACode(userPrereqResponse.result[0].associatedRoleIds)){    
                                          requiredMFACode = getRequiredMFACode(userPrereqResponse.result[0].associatedRoleIds)
                                          logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext --> getRequiredMFACode:"+requiredMFACode)
                                          nodeState.putShared("requiredMFACode",requiredMFACode)
                                          action.goTo("False");
                                    }else{
                                          message = "Role ID is not Preresent in UserPrereq"
                                          displayCallback(message)
                                          
                                    }
                              
                              }else{
                                    message = "User ID is not matcing with user PrereqId"
                                    displayCallback(message)
                              
                              }
                        }else{
                              message = "Invalid Prerequisite Type"
                              displayCallback(message)
                        }
                  }
                  else{
                        message = "UserPrereqsite is not in NO_STARTED state"
                        displayCallback(message)
                  }
                  
            }else if(requestParameters.get("context")[0] && requestParameters.get("context")[0] === "loginPrereq" && requestParameters.get("userPrereqId")[0]){
                logger.error("inside loginPrereq")
                nodeState.putShared("journeyName","loginPrereq")
                context = requestParameters.get("context")[0]
                userPrereqId = requestParameters.get("userPrereqId")[0]  
                nodeState.putShared("context",context)
                nodeState.putShared("userPrereqId",userPrereqId)   
                nodeState.putShared("journeyNameReporting","loginPrerequisite") //MFA Reporting
                logger.error("context: "+ context +"::"+"userPrereqId:"+userPrereqId)

                if(getUserPrereqDetails(userPrereqId)){
                    userPrereqResponse = getUserPrereqDetails(userPrereqId)
                    if(userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="5"){
                            nodeState.putShared("prereqtype","selfenroll")
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
                    }else if(userPrereqResponse.result[0].preRequisiteTypeId.typeName ==="3"){
                        nodeState.putShared("prereqtype","accountreview")  
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
                    }else{
                            message = "Invalid Prerequisite Type"
                            displayCallback(message)
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
}

function getUserPrereqDetails(userPrereqId) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/",{"_queryFilter":'/_id/ eq "' + userPrereqId + '"' + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'+ ' AND (status eq "NOT_STARTED" OR status eq "0" OR status eq "COMPLETED" OR status eq "2" OR status eq "EXPIRED" OR status eq "5")'}, ["preRequisiteTypeId/*","preRequisiteId/*","*"])
       // const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'+' AND status eq "'+"NOT_STARTED"+ 'OR status eq'+ "0" +'"'}, ["preRequisiteTypeId/*","preRequisiteId/*","*"])
        logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext -- getUserPrereqDetails response is --> "+response)
        if(response && response.resultCount>0){
            nodeState.putShared("preRequisiteId",response.result[0].preRequisiteId._id)
            if(response.result[0].preRequisiteId && response.result[0].preRequisiteId.displayName && response.result[0].preRequisiteId.displayName.en){
               nodeState.putShared("prereqName",response.result[0].preRequisiteId.displayName.en)
            }
            if( response.result[0].roleContext && response.result[0].roleContext.length>0 && response.result[0].roleContext[0] && response.result[0].roleContext[0].applicationId && response.result[0].roleContext[0].roleId){
                var roleName = getRoleNameFromRoleId(response.result[0].roleContext[0].roleId)
                var applicationName = getApplicationNameFromAppId(response.result[0].roleContext[0].applicationId)
            }
            return response
        }
        else{
            return null
        }
   
     
    } catch (error) {
        logger.error("Error Occurred while getUserPrereqDetails "+ error + "userPrerqId: "+userPrereqId + "userId: "+ userId)
    
    }

}

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
    }
}

function getRoleNameFromRoleId(roleId){
    try {
        var roleResponse = openidm.read("managed/alpha_role/"+roleId, null, null)
        logger.error("Role Response is --> "+ roleResponse)
        if(roleResponse && roleResponse.name){
            nodeState.putShared("roleName",roleResponse.name)
            return roleResponse.name
        }else{
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while getRRoleNameFromRoleId "+ error + "roleId: "+roleId) 
    }
}

function getApplicationNameFromAppId(appId){
    try {
        //applicationSystemName
        var appResponse = openidm.read("managed/alpha_kyid_businessapplication/"+appId, null, null)
        nodeState.putShared("appName","")
        nodeState.putShared("appSystemName","")
        nodeState.putShared("appKOGParentName","")
        logger.error("Application Response is --> "+ appResponse)
        if(appResponse && appResponse.name ){
            nodeState.putShared("appName",appResponse.name)
            if(appResponse.applicationSystemName){
                nodeState.putShared("appSystemName",appResponse.applicationSystemName)
            }
            if(appResponse.kogParentAppName){
               nodeState.putShared("appKOGParentName",appResponse.kogParentAppName) 
            }
            
            return appResponse.name
        }else{
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while getApplicationNameFromAppId "+ error + "appId: "+appId) 
    }
}

function getRequiredMFACode(roleId) {
    try {
        
         const response = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id/ eq "' + roleId + '"'+' AND recordState eq "'+"ACTIVE"+'"'}, ["businessAppId/*","*"]);
       logger.error("KYID.2B1.Journey.Login.Register.MFA.GetContext getRequiredMFACode is-->  "+response )
        if(response && response.resultCount>0 && response.result[0].requiredMFAMethod){
            if(response.result[0].name){
                nodeState.putShared("prereqRoleName",response.result[0].name)
                nodeState.putShared("prereqRoleId",response.result[0]._id)
                if(response.result[0].businessAppId && response.result[0].businessAppId.name){
                    nodeState.putShared("prereqAppName",response.result[0].businessAppId.name)
                    nodeState.putShared("prereqAppId",response.result[0].businessAppId._id) 
                }

            }
            return response.result[0].requiredMFAMethod
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