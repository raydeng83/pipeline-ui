/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var context = null; 
var userPrereqId = null; 

try {
    var userId = nodeState.get("userID")
    logger.debug("KYID.2B1.Journey.RIDP.GetContext  User Id is --> "+userId )
    logger.debug("Executing KKYID.2B1.Journey.RIDP.GetContextt ")
    logger.debug("Request Params are --> "+ requestParameters)
    logger.debug("existingSession :: "+ typeof existingSession)
    nodeState.putShared("flow","helpdesk")
    if(!nodeState.get(ridpReferenceID)){
      var ridpReferenceID = generateGUID();
      nodeState.putShared("ridpReferenceID", ridpReferenceID)  
      nodeState.putShared("refId",ridpReferenceID)
    }
    if(typeof existingSession != 'undefined'){
        userId= existingSession.get("UserId")
        logger.debug("KYID.2B1.Journey.RIDP.GetContext  User Id is --> "+userId )
        //logger.debug("Request Params are --> "+ requestParameters.get("context")[0])
        //if (requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")){
        if ((nodeState.get("context") === "appEnroll" && nodeState.get("userPrereqId")) || ((requestParameters && requestParameters.get("context") && requestParameters.get("context") && requestParameters.get("userPrereqId")))){
             nodeState.putShared("Context","appEnroll")
            logger.debug("Request Params are --> "+ requestParameters)
            //if(requestParameters.get("context")[0] && requestParameters.get("context")[0] === "appEnroll" && requestParameters.get("userPrereqId")[0]){
            if((nodeState.get("context") === "appEnroll" && nodeState.get("userPrereqId")) || (requestParameters.get("context")[0] && requestParameters.get("context")[0] === "appEnroll" && requestParameters.get("userPrereqId")[0])){
            context = nodeState.get("context") || requestParameters.get("context")[0]
            userPrereqId = nodeState.get("userPrereqId") || requestParameters.get("userPrereqId")[0]
            nodeState.putShared("context",context)
            nodeState.putShared("userPrereqId",userPrereqId)
            nodeState.putShared("flowName","appenroll")
            nodeState.putShared("flowState","resumeappenrollment")
            logger.debug("context: "+ context +"::"+"userPrereqId:"+userPrereqId)
            if(getUserPrereqDetails(userPrereqId)){
                userPrereqResponse = getUserPrereqDetails(userPrereqId)
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
            } else{
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
        }//else if(requestParameters && requestParameters.get("id") && requestParameters.get("context")){
        else if(requestParameters && requestParameters.get("context")){
            userId= existingSession.get("UserId")
            nodeState.putShared("userId",userId)
            if(requestParameters.get("context")[0] === "manageprofile"){
                logger.debug("Inside manageprofile ::");
                var id = requestParameters.get("id")[0];
                if(id){
                    nodeState.putShared("journeyName","updateprofile");
                    nodeState.putShared("ishelpdesk","true")
                    nodeState.putShared("_id",id);
                    nodeState.putShared("Context","manageprofile")
                    action.goTo("helpdesk_manageprofile");
                }else{
                    message = "Invalid_Request"
                    displayCallback(message)
                }
            }else if(requestParameters.get("context")[0] === "id_verification"){
                logger.debug("Inside id_verification ::");
                var id = requestParameters.get("id")[0];
                if(id){
                    nodeState.putShared("journeyName","forgotpassword");
                    nodeState.putShared("flowName","forgotpassword");
                    nodeState.putShared("ishelpdesk","true")
                    nodeState.putShared("_id",id);
                    nodeState.putShared("Context","id_verification")
                    //nodeState.putShared("flowName","helpdeskuserverification")
                    action.goTo("helpdesk_verification");
                }else{
                    message = "Invalid_Request"
                    displayCallback(message)
                }
            }else if(requestParameters.get("context")[0] === "inperson"){
                logger.debug("Inside inperson ::");
                if(requestParameters.get("id")){
                    var id = requestParameters.get("id")[0];
                    var appId=requestParameters.get("id")[0];
                }
                
                if(!id){
                    if(requestParameters.get("userPrereqIdHelpdesk") && requestParameters.get("userPrereqIdHelpdesk")[0]!=null){
                    var userPrereqId = requestParameters.get("userPrereqIdHelpdesk")[0];
                    nodeState.putShared("userPrereqId",userPrereqId);
                    logger.debug("userPrereqId :: " + userPrereqId)
                        if(getUserPrereqDetails(userPrereqId)){
                        userPrereqResponse = getUserPrereqDetails(userPrereqId)
                            //if(userPrereqResponse && userPrereqResponse.requestedUserAccountId === userId){
                                transcationRecord =  getRefrencedId(userPrereqId)
                                if( userPrereqResponse.preRequisiteTypeId.typeName ==="0"){
                                    logger.debug("KYID.2B1.Journey.RIDP.GetContext --> userPrereqId "+userPrereqId)
                                    nodeState.putShared("appEnrollRIDPMethod","LexisNexis")
                                    action.goTo("in_person");
                                }else if(userPrereqResponse.preRequisiteTypeId.typeName ==="1" || userPrereqResponse.preRequisiteTypeId.typeName ==="RIDP"){
                                    logger.debug("KYID.2B1.Journey.RIDP.GetContext --> userPrereqId "+userPrereqId)
                                    nodeState.putShared("appEnrollRIDPMethod","CMS")
                                    action.goTo("in_person");   
                                }     
                            // }else{
                            //     message = "User ID is not matching with user PrereqId"
                            //     displayCallback(message)
                            // }
                        } else{
                            message = "UserPrereqsite is Invalid"
                            displayCallback(message)
                        }
                    }
                    if(requestParameters.get("transaction_Id")){
                        var transactionId = requestParameters.get("transaction_Id")[0];
                        nodeState.putShared("transaction_Id", transactionId)
                    }
                    nodeState.putShared("journeyContext","inperson");
                    nodeState.putShared("journeyName","updateprofile");
                    nodeState.putShared("ishelpdesk","true")
                    nodeState.putShared("appId",appId)
                    nodeState.putShared("_id",id);
                    action.goTo("in_person");
                // }else{
                //     message = "Invalid_Request"
                //     displayCallback(message)
                // }
                
            }else{
                    if(requestParameters.get("userPrereqIdHelpdesk") && requestParameters.get("userPrereqIdHelpdesk")[0]){
                        userPrereqId = requestParameters.get("userPrereqIdHelpdesk")[0]
                    }
                    else if(requestParameters.get("userPrereqId") && requestParameters.get("userPrereqId")[0]){
                        userPrereqId = requestParameters.get("userPrereqId")[0]
                    }
                    else{
                       userPrereqId =  nodeState.get("userPrereqId")
                    }
                    if(userPrereqId){
                        transcationRecord =  getRefrencedId(userPrereqId)
                    }
                    // userPrereqId = nodeState.get("userPrereqId") || requestParameters.get("userPrereqId")[0]
                    nodeState.putShared("userPrereqId",userPrereqId)
                    
                    nodeState.putShared("journeyContext","inperson");
                    nodeState.putShared("journeyName","updateprofile");
                    nodeState.putShared("ishelpdesk","true")
                    nodeState.putShared("appId",appId)
                    nodeState.putShared("_id",id);
                    action.goTo("in_person");
            }
        }else if(requestParameters && requestParameters.get("context")){
            if(requestParameters.get("context")[0] === "ridp"){
                nodeState.putShared("journeyContext","ridp");
                nodeState.putShared("journeyName","accountRecovery");
                nodeState.putShared("ishelpdesk","true")
                nodeState.putShared("Context","ridp")
                nodeState.putShared("flowName","standaloneRIDP")
                action.goTo("helpdesk_ridp");
            }else{
                    message = "Invalid_Request"
                    displayCallback(message)
            }
        }else{
            if(nodeState.get("journeyName")!== null && nodeState.get("journeyName")){
                action.goTo("True");
            }
            else{
                message = "Invalid_Request"
                displayCallback(message)  
            }
        } 
    }else{
        if(nodeState.get("journeyName")!== null && nodeState.get("journeyName")){
            action.goTo("True");
        }
        else{
            message = "Session_Not_Found"
            displayCallback(message)
        }
    }   
    }
} catch (error) {
    logger.error("Error In KYID.2B1.Journey.Login.Register.MFA.GetContext "+error)
}

function getUserPrereqDetails(userPrereqId) {
    try {
        // var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'+' AND status eq "'+"NOT_STARTED"+'"'},["preRequisiteTypeId/*","preRequisiteId/*","*"])
        // var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'},["preRequisiteTypeId/*","preRequisiteId/*","*"])

        var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/_id/ eq "' + userPrereqId + '"'+
                                  ' AND (recordState eq "ACTIVE" or recordState eq "0") AND (status eq "2" or status eq "NOT_STARTED" or status eq "REVERIFY" or status eq "8" or status eq "PENDING" or status eq "7")'},
                                   ["preRequisiteTypeId/*","preRequisiteId/*","*"]) 
        logger.debug("KYID.2B1.Journey.RIDP.GetContext -- getUserPrereqDetails response is --> "+response)
        if(response && response.resultCount>0){
            logger.debug("userPrereqStatus"+response.result[0].status)
            logger.debug("userPrereqRoleId"+response.result[0].associatedRoleIds)
            nodeState.putShared("requestedUserAccountId",response.result[0].requestedUserAccountId)
            nodeState.putShared("_id",response.result[0].requestedUserAccountId);
            nodeState.putShared("userPrereqStatus",response.result[0].status)
            nodeState.putShared("userPrereqRoleId",response.result[0].associatedRoleIds)
            if(response.result[0].roleContext[0] && response.result[0].roleContext[0].applicationId && response.result[0].roleContext[0].roleId){
                nodeState.putShared("appId",response.result[0].roleContext[0].applicationId)
                var roleName = getRoleNameFromRoleId(response.result[0].roleContext[0].roleId)
                var applicationName = getApplicationNameFromAppId(response.result[0].roleContext[0].applicationId)
            }
            if(response.result[0].expiry){
                nodeState.putShared("dueDateType",response.result[0].expiry.dueDateType)
                nodeState.putShared("dueDateValue",response.result[0].expiry.dueDateValue)
            }
            var allowReuse = response.result[0].preRequisiteId.enrollmentActionSettings.allowReuse || false
            nodeState.putShared("allowReuse",allowReuse)
            var allowReuseIfDaysOld = response.result[0].preRequisiteId.enrollmentActionSettings.allowReuseIfDaysOld || "0"
            nodeState.putShared("allowReuseIfDaysOld",allowReuseIfDaysOld)
            if(response.result[0].preRequisiteId && response.result[0].preRequisiteId.displayName && response.result[0].preRequisiteId.displayName.en){
               nodeState.putShared("prereqName",response.result[0].preRequisiteId.displayName.en)
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


function getRefrencedId(userPrereqId) {
    try {
        //KYID Remote Identity Proofing Request
        
        // var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrerequisiteId/_refResourceId eq "' + userPrereqId + '"' }, ["*"]);
        var response =  openidm.query("managed/alpha_kyid_remote_identity_proofing_request/", { "_queryFilter": 'userPrerequisite eq "' + userPrereqId + '"' }, ["*"]);
        logger.debug("alpha_kyid_remote_identity_proofing_request  getRefrencedId --> "+response )
        if(response.resultCount>0){
            nodeState.putShared("transaction_Id",response.result[0]._id)
            nodeState.putShared("refId",response.result[0].referenceId)
            var userInfoJSON = null
            if(response.result[0].userRequest){
                userInfoJSON = JSON.parse(response.result[0].userRequest)
                nodeState.putShared("userInfoJSON",userInfoJSON)
                
                if (userInfoJSON.givenName) {
                    userInfoJSON["givenName"]=userInfoJSON.givenName
                    nodeState.putShared("orig_givenName", userInfoJSON.givenName);
                }
                if (userInfoJSON.middileName) {
                    userInfoJSON["middleName"]=userInfoJSON.middleName
                    nodeState.putShared("orig_custom_middleName", userInfoJSON.middileName);
                }
                if (userInfoJSON.sn) {
                    userInfoJSON["sn"]=userInfoJSON.sn
                    nodeState.putShared("orig_sn", userInfoJSON.sn);
                }
                if (userInfoJSON.suffix) {
                    userInfoJSON["suffix"]=userInfoJSON.suffix
                    nodeState.putShared("orig_custom_suffix", userInfoJSON.suffix);
                }
                if (userInfoJSON.gender) {
                    userInfoJSON["gender"]=userInfoJSON.gender
                    nodeState.putShared("orig_custom_gender", userInfoJSON.gender);
                }
                if (userInfoJSON.dob) {
                    userInfoJSON["dob"]=userInfoJSON.dob
                    nodeState.putShared("orig_custom_dateofBirth", userInfoJSON.dob);
                }
                if (userInfoJSON.addressLine1) {
                    userInfoJSON["postalAddress"]=userInfoJSON.addressLine1
                    nodeState.putShared("orig_postalAddress", userInfoJSON.addressLine1);
                }
                if (userInfoJSON.addressLine2) {
                    userInfoJSON["postalAddress2"]=userInfoJSON.addressLine2
                    nodeState.putShared("orig_custom_postalAddress2", userInfoJSON.addressLine2);
                }
                if (userInfoJSON.city) {
                    userInfoJSON["city"]=userInfoJSON.city
                    nodeState.putShared("orig_city", userInfoJSON.city);
                }
                if (userInfoJSON.stateCode) {
                    userInfoJSON["stateProvince"]=userInfoJSON.stateCode
                    nodeState.putShared("orig_stateProvince", userInfoJSON.stateCode);
                }
                if (userInfoJSON.zip) {
                    userInfoJSON["postalCode"]=userInfoJSON.zip
                    nodeState.putShared("orig_postalCode", userInfoJSON.zip);
                }
                if (userInfoJSON.postalExtension) {
                    userInfoJSON["postalExtension"]=userInfoJSON.postalExtension
                    nodeState.putShared("postalExtension", userInfoJSON.postalExtension);
                }
                if (userInfoJSON.countyCode) {
                    userInfoJSON["county"]=userInfoJSON.countyCode
                    nodeState.putShared("orig_custom_county", userInfoJSON.countyCode);
                }

                if(userInfoJSON.orig_telephoneNumber){
                userInfoJSON["telephoneNumber"]=userInfoJSON.orig_telephoneNumber
                nodeState.putShared("orig_telephoneNumber",userInfoJSON.orig_telephoneNumber)
                }

            }
            return response.result[0]
        }
        return null
        
    } catch (error) {
        logger.error("Error Occurred while executing getRefrencedId function"+ error)
    }
}

// function getRoleNameFromRoleId(roleId){
//     try {
//         var roleResponse = openidm.read("managed/alpha_role/"+roleId, null, null)
//         logger.debug("Role Response is --> "+ roleResponse)
//         if(roleResponse && roleResponse.name){
//             nodeState.putShared("roleName",roleResponse.name)
//             return roleResponse.name
//         }else{
//             return null
//         }
//     } catch (error) {
//         logger.error("Error Occurred while getRRoleNameFromRoleId "+ error + "roleId: "+roleId) 
//     }
// }

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


// function getApplicationNameFromAppId(appId){
//     try {
//         //applicationSystemName
//         var appResponse = openidm.read("managed/alpha_kyid_businessapplication/"+appId, null, null)
//         nodeState.putShared("appName","")
//         nodeState.putShared("appSystemName","")
//         nodeState.putShared("appKOGParentName","")
//         logger.debug("Application Response is --> "+ appResponse)
//         if(appResponse && appResponse.name ){
//             nodeState.putShared("appName",appResponse.name)
//             if(appResponse.applicationSystemName){
//                 nodeState.putShared("appSystemName",appResponse.applicationSystemName)
//             }
//             if(appResponse.kogParentAppName){
//                nodeState.putShared("appKOGParentName",appResponse.kogParentAppName) 
//             }
            
//             return appResponse.name
//         }else{
//             return null
//         }
//     } catch (error) {
//         logger.error("Error Occurred while getApplicationNameFromAppId "+ error + "appId: "+appId) 
//     }
// }

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
