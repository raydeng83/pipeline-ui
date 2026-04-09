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
    if(!nodeState.get(ridpReferenceID)){
      var ridpReferenceID = generateGUID();
      nodeState.putShared("ridpReferenceID", ridpReferenceID)  
      nodeState.putShared("refId",ridpReferenceID)
    }
    logger.debug("Executing KKYID.2B1.Journey.RIDP.GetContextt ")
    logger.debug("Request Params are --> "+ requestParameters)
    if(typeof existingSession != 'undefined'){
       userId= existingSession.get("UserId")
    logger.debug("KYID.2B1.Journey.RIDP.GetContext  User Id is --> "+userId )
    if ((nodeState.get("context") === "appEnroll" && nodeState.get("userPrereqId")) || ((requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")))){
        logger.debug("Request Params are --> "+ requestParameters)
        if((nodeState.get("context") === "appEnroll" && nodeState.get("userPrereqId")) || (requestParameters.get("context")[0] && requestParameters.get("context")[0] === "appEnroll" && requestParameters.get("userPrereqId")[0])){
        context = nodeState.get("context") || requestParameters.get("context")[0]
        userPrereqId = nodeState.get("userPrereqId") || requestParameters.get("userPrereqId")[0]
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
      const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+
                                  ' AND (recordState eq "ACTIVE" or recordState eq "0") AND (status eq "0" or status eq "NOT_STARTED" or status eq "5" or status eq "EXPIRED" or status eq "2" or status eq "COMPLETED" or status eq "REVERIFY" or status eq "8" or status eq "PENDING" or status eq "7")'},
                                   ["preRequisiteTypeId/*","preRequisiteId/*","*"])
        logger.debug("KYID.2B1.Journey.RIDP.GetContext -- getUserPrereqDetails response is --> "+response)
        if(response && response.resultCount>0){
            logger.debug("userPrereqStatus"+response.result[0].status)
            logger.debug("userPrereqRoleId"+response.result[0].associatedRoleIds)
            nodeState.putShared("userPrereqStatus",response.result[0].status)
            nodeState.putShared("userPrereqRoleId",response.result[0].associatedRoleIds)
            nodeState.putShared("appId",response.result[0].roleContext[0].applicationId)
            nodeState.putShared("roleId",response.result[0].roleContext[0].roleId)
            nodeState.putShared("enrollmentRequestID",response.result[0].enrollmentRequestId)
            if(response.result[0].roleContext[0] && response.result[0].roleContext[0].applicationId && response.result[0].roleContext[0].roleId){
                var roleName = getRoleNameFromRoleId(response.result[0].roleContext[0].roleId)
                var applicationName = getApplicationNameFromAppId(response.result[0].roleContext[0].applicationId)
            }
            if(response.result[0].preRequisiteId && response.result[0].preRequisiteId.expiry){
                nodeState.putShared("prereqId",response.result[0].preRequisiteId._id)
                nodeState.putShared("dueDateType",response.result[0].preRequisiteId.expiry.dueDateType)
                nodeState.putShared("dueDateValue",response.result[0].preRequisiteId.expiry.dueDateValue)
            }
            if(response.result[0].preRequisiteId && response.result[0].preRequisiteId.enrollmentActionSettings){
                var allowReuse = response.result[0].preRequisiteId.enrollmentActionSettings.allowReuse || false
                nodeState.putShared("allowReuse",allowReuse)
                var allowReuseIfDaysOld = response.result[0].preRequisiteId.enrollmentActionSettings.allowReuseIfDaysOld || "0"
                nodeState.putShared("allowReuseIfDaysOld",allowReuseIfDaysOld)            
            }
            if(response.result[0].preRequisiteId && response.result[0].preRequisiteId.displayName && response.result[0].preRequisiteId.displayName.en){
               nodeState.putShared("prereqName",response.result[0].preRequisiteId.displayName.en)
            }
            return response.result[0]
        }else{
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

function getRoleNameFromRoleId(roleId){
    try {
        var roleResponse = openidm.read("managed/alpha_role/"+roleId, null, null)
        logger.debug("Role Response is --> "+ roleResponse)
        if(roleResponse && roleResponse.content[0] && roleResponse.content[0].name){
            nodeState.putShared("roleTitle",roleResponse.content[0].name)
        }
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
        
        logger.debug("Application Response is --> "+ appResponse)
        if(appResponse && appResponse.content && appResponse.content[0] && appResponse.content[0].title){
            nodeState.putShared("appTitle", appResponse.content[0].title)
            nodeState.putShared("businessAppId",appResponse._id)
        }
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



function generateGUID() {     
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';     
    var result = '';   
    var length = 8;  
    for (var i = 0; i < length; i++) {         
        result += chars.charAt(Math.floor(Math.random() * chars.length)); 
    } return result; 
}
