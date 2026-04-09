//https://<PingHostURL>/openidm/endpoint/access

/**
 * @name [@endpointname]
 * @description [@description]
 * 
 * @param {request} request - This is the request object contains the following
 * resourceName - The name of the resource, without the endpoint/ prefix.
 * newResourceId - The identifier of the new object, available as the results of a create request.
 * revision - The revision of the object.
 * parameters - Any additional parameters provided in the request. The sample code returns request parameters from an HTTP GET with ?param=x, as "parameters":{"param":"x"}.
 * content - Content based on the latest revision of the object, using getObject.
 * context - The context of the request, including headers and security. For more information, refer to Request context chain.
 * Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. For more information refer to Page Query Results.
 * Query parameters - The queryId and queryFilter parameters are specific to query methods. For more information refer to Construct Queries.
 *
 * @date  [@date]
 * @author {<authorname>@deloitte.com}
 */
/**
 * action - create:{
 *      payload:{
 *          requestedUserAccountId:"1",
 *          enrollmentRequestId:""
 *      },
 *      action:0
 * }
 */

var UUID = java.util.UUID;

(function(){
    
    const requestAction = request.content.action
    const payLoad = request.content.payload
     
    try{

        if(request.method == "create"){       /* This is HTTP POST operation. */        // {requestedUserAccountId="", action="0-Search | X - customAction (e.g 9-getActiveEnrollments) "}
            if(requestAction =="1"){
                return provisionAccess(payLoad);
            } else if (requestAction == "2"){
                return deprovisionAccess(payLoad);
            } else if (requestAction == "4"){
                return getAccess(payLoad);
            } else {
                throw { code : 500, message : "Unsupported requestAction."};
            }
            
        }else if(request.method == "update"){ /* This is HTTP PUT operation. */
            //Throw unsupported operation error.
            throw { code : 500, message : "Unsupported operation: " + request.method };
        }else if(request.method == "patch"){  /* This is HTTP PATCH operation. */
            //Throw unsupported operation error.
            throw { code : 500, message : "Unsupported operation: " + request.method };
        }else if(request.method == "delete"){ /* This is HTTP DELETE operation. */
            //Throw unsupported operation error.
            throw { code : 500, message : "Unsupported operation: " + request.method };
        }else if(request.method == "read"){   /* This is HTTP GET operation. */
            //Throw unsupported operation error.
            throw { code : 500, message : "Unsupported operation: " + request.method };
        }

    }catch(error){
        /* Returns error response. */
        // return {
        //     "code": "", 
        //     "message": "",
        //     "params" : [""]
        // }
      return error;
    }
})()

/**
 * @name <getFunctionName>
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
// function getAccess(paramJSON){
//     try {
//         if(!paramJSON.userId || paramJSON.userId === null) {
//             throw { code : 500, message : "userId is required for search request."};
//         }
//         let queryFilter = "/userIdentifier eq \"" + paramJSON.userId + "\"";

//         if(paramJSON.roleId && paramJSON.roleId !== null && paramJSON.roleId !== "") {
//             queryFilter += " and /roleIdentifier eq \"" + paramJSON.roleId + "\"";
//         }
//         if(paramJSON.appId && paramJSON.appId !== null && paramJSON.appId !== "") {
//             queryFilter += " and /appIdentifier eq \"" + paramJSON.appId + "\"";
//         }
//         if(paramJSON.currentDelegatorId && paramJSON.currentDelegatorId !== null && paramJSON.currentDelegatorId !== "") {
//             queryFilter += " and /currentDelegatorIdentifier eq \"" + paramJSON.currentDelegatorId + "\"";
//         }
//         if(paramJSON.originalDelegatorId && paramJSON.originalDelegatorId !== null && paramJSON.originalDelegatorId !== "") {
//             queryFilter += " and /originalDelegatorIdentifier eq \"" + paramJSON.originalDelegatorId + "\"";
//         }
//         if(paramJSON.orgType && paramJSON.orgType !== null && paramJSON.orgType !== "") {
//             queryFilter += " and /orgType eq \"" + paramJSON.orgType + "\"";
//         }
//         if(paramJSON.orgId && paramJSON.orgId !== null && paramJSON.orgId !== "") {
//             queryFilter += " and /orgId eq \"" + paramJSON.orgId + "\"";
//         }

//         var result = openidm.query("managed/alpha_kyid_access", { "_queryFilter": queryFilter}, ["*", "app/*", "role/*", "user/*", "currentDelegator/*", "originalDelegator/*"]).result;

//     } catch(error) {
//         return error;
//     }
//     return {
//         "result": result
//     };
// }

function getAccess(paramJSON){
    try {
        if(!paramJSON.userId || paramJSON.userId === null) {
            throw { code : 500, message : "userId is required for search request."};
        }
        let queryFilter = "/userIdentifier eq \"" + paramJSON.userId + "\"";
 
        if(paramJSON.roleId && paramJSON.roleId !== null && paramJSON.roleId !== "") {
            queryFilter += " and /roleIdentifier eq \"" + paramJSON.roleId + "\"";
        }
        if(paramJSON.appId && paramJSON.appId !== null && paramJSON.appId !== "") {
            queryFilter += " and /appIdentifier eq \"" + paramJSON.appId + "\"";
        }
        if(paramJSON.currentDelegatorId && paramJSON.currentDelegatorId !== null && paramJSON.currentDelegatorId !== "") {
            queryFilter += " and /currentDelegatorIdentifier eq \"" + paramJSON.currentDelegatorId + "\"";
        }
        if(paramJSON.originalDelegatorId && paramJSON.originalDelegatorId !== null && paramJSON.originalDelegatorId !== "") {
            queryFilter += " and /originalDelegatorIdentifier eq \"" + paramJSON.originalDelegatorId + "\"";
        }
        if(paramJSON.kogOrgBusinessKeyId && paramJSON.kogOrgBusinessKeyId !== null && paramJSON.kogOrgBusinessKeyId !== "") {
            queryFilter += " and /kogOrgBusinessKeyId eq \"" + paramJSON.kogOrgBusinessKeyId + "\"";
        }
        if(paramJSON.orgId && paramJSON.orgId !== null && paramJSON.orgId !== "") {
            queryFilter += " and /orgId eq \"" + paramJSON.orgId + "\"";
        }
 
        var result = openidm.query("managed/alpha_kyid_access", { "_queryFilter": queryFilter}, ["*", "app/*", "role/*", "user/*", "currentDelegator/*", "originalDelegator/*"]).result;
 
    } catch(error) {
        return error;
    }
    return {
        "result": result
    };
}

/**
 * @name validateRequest
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
function validateRequest(paramJSON){
    // Read enrollment request and its associated role(s)
        // Check if the enrollment request is expiry date → If “expired”→ update enrollment request status as “expired” and throw error
        // Check if the “user pre-requisite” has pre-requisites associated with enrollment request in not “completed” status → If YES → Throw error

    //validate requesterId from enrollment request to security context
        // do read on requesterId after validation for displayId

    try {
        if(paramJSON.requestedUserAccountId && paramJSON.requestedUserAccountId !== null) {
            var userResponse = openidm.read("managed/alpha_user/" + paramJSON.requestedUserAccountId, null, ["*", "roles"])
            if (!userResponse || userResponse === null) {
                throw { code : 500, message : "User account not found." };
            }
            if(userResponse.accountStatus !== "active") {
                throw { code : 500, message : "User account is inactive." };
            }
        } else {
            throw { code : 500, message : "requestedUserAccountId not present." };
        }
        if(paramJSON.enrollmentRequestId && paramJSON.enrollmentRequestId !== null) {
            var requestResponse = openidm.read("managed/alpha_kyid_enrollment_request/" + paramJSON.enrollmentRequestId, null, ["*"])
            if (!requestResponse || requestResponse === null) {
                throw { code : 500, message : "Enrollment Request not found." };
            }
            if(requestResponse.expiryDateEpoch < Date.now()) {
                //openidm.patch("managed/alpha_kyid_enrollment_request/" + requestResponse._id, null, [{"operation": "replace", "field": "expiryDateEpoch", "value": "EXPIRED"}]);
                throw { code : 500, message : "Enrollment Request is expired." };
            }
           /* if(requestResponse.requesterId && requestResponse.requesterId !== context.security.authorization.id) {
                //throw { code : 500, message : "Requester ID does not match Authorization ID." };
            }
            else {
                var requesterUser = openidm.read("managed/alpha_user/" + requestResponse.requesterId, null, ["*"]);
            }*/

            //dharjani begin - adding enrollment context in the part of the response
            var enrollmentContextId = null;
            var enrollmentContextResponse = null;
            if (requestResponse && requestResponse.hasOwnProperty('enrollmentContextId') && requestResponse.enrollmentContextId !== null && requestResponse.enrollmentContextId !== undefined && requestResponse.enrollmentContextId.toString().trim() !== "") {
                enrollmentContextId = requestResponse.enrollmentContextId;
                enrollmentContextResponse = openidm.read("managed/alpha_kyid_enrollment_contextId/" + enrollmentContextId, null, ["*"]);
                requestResponse.enrollmentContext = enrollmentContextResponse
                logger.error("enrollmentContextResponse: " + JSON.stringify(enrollmentContextResponse));
                logger.error("Updated requestResponse: " + JSON.stringify(requestResponse));
            }
            //dharjani end


           var requesterUser = openidm.read("managed/alpha_user/" + requestResponse.requesterId, null, ["*"]);
        } else {
            throw { code : 500, message : "enrollmentRequestId not present." };
        }
        

    } catch(error) {
        throw { code : 500, message : error.message };
    }
    return {
        "userResponse": userResponse,
        "requestResponse": requestResponse,
        "requesterUser": requesterUser
    };
}


/**
 * @name kogAddRolesToUser
 * @description <function description>
 *
 * @param {JSON} paramJSON
 * @returns {JSON} Response JSON.
 */
// function kogAddRolesToUser(roles, requestedUser, requesterUser){
//     //Request body
//     let userAuths = []
//     roles.forEach(role => {
       
//         userAuths.push({
//             "ApplicationName":role.businessAppId.name,
//             "RoleName":role.name
//         })
//     });
//    /* const kogRequest = {
//         "KOGID": requestedUser._id,
//         "RequestorKOGID": requesterUser._id,
//         "TransactionID": "244C0D25-EAAB-49B8-8A7B-AC61DE5F98C1",
//         "KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
//         "UserAuth":userAuths
//     }*/
//     const kogRequest = {
//       payload: {
//         "KOGID": requestedUser.userName,
//         "RequestorKOGID": requesterUser.userName,
//         "TransactionID": UUID.randomUUID().toString(),
//         // "KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
//         "UserAuths":userAuths
//       },
//         action:1
//     }
 
//     //Call KOG API endpoint.
//   try{
//     /*let assignRoleToUserResponse = openidm.create("endpoint/kogapis", null, kogRequest)
//     return assignRoleToUserResponse*/
//     openidm.create("endpoint/kogapis", null, kogRequest)
//   } catch(error){
//     logger.error("access: " + JSON.stringify(error));
//     throw { code: 500, message: 'Exception Occurred', detail: error, action: "retry"}
//   }
    
//     return true;
// }

function kogAddRolesToUser(kogUserAuthPayload, requestedUser, requesterUser){
    //Request body
    let userAuths = []
    let shouldRetryForKOGAPI = true
    let retryCountForKOGAPI = 0
    /*roleContext.forEach(role => {
       
        userAuths.push({
            "ApplicationName":role.businessAppId.name,
            "RoleName":role.name
        })
    });*/
   /* const kogRequest = {
        "KOGID": requestedUser._id,
        "RequestorKOGID": requesterUser._id,
        "TransactionID": "244C0D25-EAAB-49B8-8A7B-AC61DE5F98C1",
        "KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
        "UserAuth":userAuths
    }*/
    const kogRequest = {
      payload: {
        "KOGID": requestedUser.userName,
        "RequestorKOGID": requesterUser.userName,
        "TransactionID": UUID.randomUUID().toString(),
        // "KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
        "UserAuths":kogUserAuthPayload
      },
        action:1
    }
    
    while(retryCountForKOGAPI < 3) {
        //Call KOG API endpoint.
        try{
            /*let assignRoleToUserResponse = openidm.create("endpoint/kogapis", null, kogRequest)
            return assignRoleToUserResponse*/
            let assignRoleToUserResponse = openidm.create("endpoint/kogapis", null, kogRequest)
            logger.error("KOG API Response Assign Roles To User: " + JSON.stringify(assignRoleToUserResponse))
            return true;
        } catch(error){
            logger.error("access: " + JSON.stringify(error));
            //throw { code: 500, message: 'Exception Occurred', detail: getException(error), action: "retry"}
            if(shouldRetryForKOGAPI) {
                retryCountForKOGAPI++
                logger.error("Retry count of kogAddRolesToUser is: " + retryCountForKOGAPI);
                if(retryCountForKOGAPI == 3 ){
                    throw { code: 500, message: 'Exception Occurred', detail: getException(error), action: "retry"}
                }
            } else {
                throw { code: 500, message: 'Exception Occurred', detail: getException(error), action: "retry"}
            }
        }
        //return true;
    }
}
 

/**
 * @name kogRemoveRolesFromUser
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
function kogRemoveRolesFromUser(roles, requestedUser, requesterUser){
     //Request body
    let userAuths = []
    roles.forEach(role => {
       
        userAuths.push({
            "ApplicationName":role.businessAppId.name,
            "RoleName":role.name
        })
    });
   /* const kogRequest = {
        "KOGID": requestedUser._id,
        "RequestorKOGID": requesterUser._id,
        "TransactionID": "244C0D25-EAAB-49B8-8A7B-AC61DE5F98C1",
        "KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
        "UserAuth":userAuths
    }*/
    const kogRequest = {
      payload: {
        "KOGID": requestedUser.userName,
        "RequestorKOGID": requesterUser.userName,
        "TransactionID": UUID.randomUUID().toString(),
        //"KYIDContextID": "36DC8D35-242C-40F0-939D-224C799325EB",
        "UserAuths":userAuths
      },
        action:1
    }

    
 
    //Call KOG API endpoint.
  try{
    /*let assignRoleToUserResponse = openidm.create("endpoint/kogapis", null, kogRequest)
    return assignRoleToUserResponse*/
    return openidm.create("endpoint/kogapis", null, kogRequest)
  } catch(error){
    throw { code: 500, message: 'Exception Occurred', detail:  getException(error), action: "retry"}
  }
    
    //return kogRequest;
}

/**
 * @name addRolesToUser
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
// function addRolesToUser(roles, user, requesterUser){
//     try {
//         kogAddRolesToUser(roles, user, requesterUser);
//         let patchArray = [];

//         roles.forEach(function (role) {
//             let patchOperation = {
//                 "operation": "add",
//                 "field": "/roles/-",
//                 "value": {"_ref" : "managed/alpha_role/" + role._id}
//             }
//             patchArray.push(patchOperation);
//         });

//       logger.error("patch array in access endpoint"+ JSON.stringify(patchArray))
//       logger.error("user id in access endpoint"+ user._id)
//         openidm.patch("managed/alpha_user/" + user._id, null, patchArray);
        
//     } catch (error) {
//         if(!error.detail) {
//             throw { code: 500, message: 'Exception Occurred', detail: getException(error)}
//         } else
//             throw error;
//     }
//     return true;
// }

function addRolesToUser(roles,kogUserAuthPayload, user, requesterUser){
 
    try {
        kogAddRolesToUser(kogUserAuthPayload, user, requesterUser);
        let patchArray = [];
 
        roles.forEach(function (role) {
            let patchOperation = {
                "operation": "add",
                "field": "/roles/-",
                "value": {"_ref" : "managed/alpha_role/" + role._id}
            }
            patchArray.push(patchOperation);
        });
 
      logger.error("patch array in access endpoint"+ JSON.stringify(patchArray))
      logger.error("user id in access endpoint"+ user._id)
      openidm.patch("managed/alpha_user/" + user._id, null, patchArray);
       
    } catch (error) {
        if(!error.detail) {
            throw { code: 500, message: 'Exception Occurred', detail: getException(error)}
        } else
            throw error;
    }
    return true;
	}


/**
 * @name removeRolesFromUser
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
function removeRolesFromUser(roles, user, requesterUser){
    try {
        //kogRemoveRolesFromUser(roles, user, requesterUser);

        roles.forEach(function (role) {
            let roleToRemove = user.roles.find(item => item._ref === "managed/alpha_role/" + role._id);
            if(roleToRemove && roleToRemove !== null) {
                openidm.delete("managed/alpha_user/" + user._id + "/roles/" + roleToRemove._refProperties._id, null);
            }
            
        });
        
    } catch (error) {
        throw { code : 500, message : "Role deprovisioning failed: " + error };
    }
    return true;
}


/**
* @name <getUserProfile>
* @description <It returns the ACTIVE user profile from the system>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserProfile(userID){

  let apiRequestPayload = {
    "requestedUserAccountId": null
  }
  let requestBody = {
    "payload":null,
    "action":2
  }
  
  if(userID!=null && userID){
      apiRequestPayload.requestedUserAccountId = userID
      requestBody.payload = apiRequestPayload
      
      try {
          return getUserAccount(requestBody) 
        
      } catch(error){
          logger.error("Exception in getUserProfile is encountered while retrieving user account details - " + getException(error))
          return {code: 400, message: error}
      }
   } else {
     return {code: 400, message: 'Account_NotExist'}
   }
}


/**
* @name <getUserAccount>
* @description <It returns the ACTIVE user profile from the system>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserAccount(requestBody){
  logger.error("Inside getUserAccount")
  let funcName = "getUserAccount"
  let userProfileResponse = null
  
  try{
    userProfileResponse = openidm.create("endpoint/LIB-UserProfileAPI", null, requestBody)
    
    if(userProfileResponse.user!=null && userProfileResponse){
     //logger.error("userProfileResponse in getUserAccount is - "+JSON.stringify(userProfileResponse))
      userProfileResponse = userProfileResponse.user.result[0]
      return userProfileResponse
      
    } else {
      logger.error("Account_InActive")
      return {code: 400, message: 'Account_InActive'}
    }
    
  } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      return {code: 400, message: error}
  }
}

/**
* @name <sendEmail>
* @description <This function sents email to user>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function sendEmail(mail){
  let funcName = "sendEmail"
  try {
    var body = {
      subject: "Prerequisite Expiry Notification" ,
      to: mail,
      templateName: "kyid2B1UsrprereqExpiryNotification",
      object: {}
    }
    logger.error("Sending email to "+mail)
    openidm.action("external/email", "sendTemplate", body)
    logger.error("Email successfully get delivered to "+mail)
  }
  catch (error) {
    logger.error("Email failed to get delivered to "+mail+" | Exception: "+error);
    return logDebug(funcName,"Email failed to get delivered to "+mail+" | Exception: "+error,error)
  }
}

/*function sendMail(mail, givenName, sn, roleId, application, status) {
    try {
        var params = new Object();
        if (status === "success") {
            params.templateName = nodeConfig.templateIDForSuccess;

        } else if (status === "failure") {
            params.templateName = nodeConfig.templateIDForFailure;
        }

        params.to = mail;
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "application" : application,
            "role" : roleId,
            "timestamp":dateTime
        };
        openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script 
                        + "::" + nodeConfig.scriptName + "::" + "Email Notification sent successfully to " + "::" + mail);
        action.goTo(NodeOutcome.PASS);
    }
    catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script 
                         + "::" + nodeConfig.scriptName + " ::" + "Error occurred while sending email notification. Error - " + "::" + error);
        action.goTo(NodeOutcome.FAIL);
    }
}*/


/**
 * @name disablePreReqs
 * @description <function description>
 * 
 * @param {JSON} paramJSON 
 * @returns {JSON} Response JSON.
 */
function disablePreReqs(roles, user, request){
    try {
        let queryFilter = "/enrollmentRequestId eq " + request._id + " AND /requestedUserAccountId eq " + user._id;
        queryFilter += " AND ("
        roles.forEach(function (role) {
            if(queryFilter.slice(-1) !== "(") {
                queryFilter += " OR ";
            }
            queryFilter += "/associatedRoleIds eq \"";
            queryFilter += role._id
            queryFilter += "\""
        });
        queryFilter += ")";

        let queryResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites",
            {
                "_queryFilter": filterCondition
            }                   
        ).result;

        queryResponse.forEach(function (preReq) {
            let patchResponse = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + preReq._id, null, [{"operation": "replace", "field": "recordState", "value": "REMOVED"}]);
            logger.error("Access: patch response: " + JSON.stringify(patchResponse));
        });
    } catch (error) {
        throw { code : 500, message : "Role deprovisioning failed: " +  getException(error) };
    }
    return true;
}


function provisionAccess(paramJSON){
 
    try {
        let objects = validateRequest(paramJSON);
        if(objects.userResponse && objects.requestResponse) {
            let userResponse = objects.userResponse;
            let requestResponse = objects.requestResponse;
            let requesterUser = objects.requesterUser;
            if(!requestResponse.roleIds) {
                throw { code : 500, message : "No application roles to provision access to." };
            }
 
            let roleArray = [];
            var responseShowConfirmationPage = "true";
            var enrolledApps = [];
            var accessArray = [];
 
            let current = Date.now();
            let iso = new Date(current).toISOString();
 
            let requester = null;
 
            if(requesterUser && requesterUser.userName) {
                requester = requesterUser.userName;
            }
            else {
                requester = requestResponse.requesterId;
            }
 
            let entryTemplate = {
                "isForwardDelegable": false,
                "assignmentDate": iso,
                "assignmentDateEpoch": current,
                "recordState": "0",
                "recordSource": "0",
                "createDate": iso,
                "createDateEpoch": current,
                "updateDate": iso,
                "updateDateEpoch": current,
                "createdBy": requester,
                "updatedBy": requester,
                "appIdentifier": null,
                "roleIdentifier": null,
                "userIdentifier": null,
                "originalDelegatorIdentifier": null,
                "currentDelegatorIdentifier": null,
                "app": null,
                "user": null,
                "role": null,
                "currentDelegator": null,
                "originalDelegator": null
            }
            let kogUserAuthPayload = []

            logger.error("ACCESS endpoint - before iterative loop requestResponse: " + JSON.stringify(requestResponse));
           
            requestResponse.roleContext.forEach(function (roleContext) {
              entryTemplate = {
                "isForwardDelegable": false,
                "assignmentDate": iso,
                "assignmentDateEpoch": current,
                "recordState": "0",
                "recordSource": "0",
                "createDate": iso,
                "createDateEpoch": current,
                "updateDate": iso,
                "updateDateEpoch": current,
                "createdBy": requester,
                "updatedBy": requester,
                "appIdentifier": null,
                "roleIdentifier": null,
                "userIdentifier": null,
                "originalDelegatorIdentifier": null,
                "currentDelegatorIdentifier": null,
                "app": null,
                "user": null,
                "role": null,
                "currentDelegator": null,
                "originalDelegator": null
            }
               
                let tempRole = openidm.read(`managed/alpha_role/${roleContext.roleId}`, null, ["*", "businessAppId/*"]);
                if(tempRole && tempRole.recordState && tempRole.recordState.toLowerCase() !== "active") {
                    throw { code : 500, message : "Requested role is inactive: " + tempRole.name };
                }
                //if(tempRole.isDelegable) {
                    // if(!requestResponse.roleContext || requestResponse.roleContext.length == 0) {
                    //     throw { code : 500, message : "Delegable role present, role context not present." };
                    // }
                    //let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);
 
                    if(roleContext && roleContext !== null) {
                       // if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
                            // add to accessArray
                        let entry = entryTemplate;
                      logger.error("Printing the entry in provisionAccess::: "+JSON.stringify(entry))
                        entry.appIdentifier = tempRole.businessAppId._id;
                        entry.roleIdentifier = tempRole._id;
                        entry.userIdentifier = userResponse._id;
                       
                        // entry.originalDelegatorIdentifier = roleContext.orginalDelegatorId?roleContext.orginalDelegatorId:null;
                        // entry.currentDelegatorIdentifier = roleContext.currentDelegatorId?roleContext.currentDelegatorId:null;
                        // entry.isForwardDelegable = roleContext.isForwardDelegable?true:false
                        // entry.expiryDate = roleContext.delegationEndDate?roleContext.delegationEndDate:null

                        roleContext.orginalDelegatorId?entry.originalDelegatorIdentifier = roleContext.orginalDelegatorId:null;
                        roleContext.currentDelegatorId?entry.currentDelegatorIdentifier = roleContext.currentDelegatorId:null;
                        roleContext.isForwardDelegable?entry.isForwardDelegable = true:false
                        roleContext.delegationEndDate?entry.expiryDate = roleContext.delegationEndDate:null
                       
                        entry.orgId = roleContext.orgId?roleContext.orgId:null;
                        entry.orgType = roleContext.orgType?roleContext.orgType:null;
                        entry.orgName = roleContext.orgName?roleContext.orgName:null
                       
                        entry.kogOrgBusinessKeyId = roleContext.kogOrgBusinessKeyId?roleContext.kogOrgBusinessKeyId:null
                        entry.businessKeyTypeName = roleContext.businessKeyTypeName?roleContext.businessKeyTypeName:null
                        entry.businessKeyName = roleContext.businessKeyId?roleContext.businessKeyId:null
                        entry.businessKeyValue = roleContext.businessKeyName?roleContext.businessKeyName:null
                        entry.businessKeyDescription = roleContext.businessKeyDescription?roleContext.businessKeyDescription:null
 
                        entry.app = {
                            "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
                        };
                        entry.user = {
                            "_ref": "managed/alpha_user/" + userResponse._id
                        };
                        entry.role = {
                            "_ref": "managed/alpha_role/" + tempRole._id
                        };
                        roleContext.currentDelegatorId?entry.currentDelegator = {
                            "_ref": "managed/alpha_user/" + roleContext.currentDelegatorId
                        }:null
                        roleContext.orginalDelegatorId?entry.originalDelegator = {
                            "_ref": "managed/alpha_user/" + roleContext.orginalDelegatorId
                        }:null
 
                        let originalDelegator
                        if(roleContext.orginalDelegatorId){ 
                            originalDelegator = openidm.read(`managed/alpha_user/${roleContext.orginalDelegatorId}`, null, ["*"]);
                        }
                        let currentDelegator
                        // if(currentDelegator.originalDelegatorId){
                        //     originalDelegator = openidm.read(`managed/alpha_user/${roleContext.currentDelegatorId}`, null, ["*"]);
                        // }
                      if(roleContext.currentDelegatorId){
                            currentDelegator = openidm.read(`managed/alpha_user/${roleContext.currentDelegatorId}`, null, ["*"]);
                        }
                       
                        accessArray.push(entry);
                        kogUserAuthPayload.push({
                            ApplicationName:tempRole.businessAppId.name,
                            RoleName:tempRole.name,
                            OrginalDelegatorKOGID:originalDelegator?originalDelegator.userName:null,
                            CurrentDelegatorKOGID:currentDelegator?currentDelegator.userName:null,
                            KOGOrgID:entry.orgId,
                            OrgBusinessKeyID:entry.kogOrgBusinessKeyId
                        })
                       
                    }else {
                         throw { code : 500, message : "Role context not present for role: " + tempRole.name };
                    // add to accessArray
                        /*let entry = entryTemplate;
   
                        entry.appIdentifier = tempRole.businessAppId._id;
                        entry.roleIdentifier = tempRole._id;
                        entry.userIdentifier = userResponse._id;
                        entry.originalDelegatorIdentifier = null;
                        entry.currentDelegatorIdentifier = null;
                        entry.app = {
                            "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
                        };
                        entry.user = {
                            "_ref": "managed/alpha_user/" + userResponse._id
                        };
                        entry.role = {
                            "_ref": "managed/alpha_role/" + tempRole._id
                        };
                        entry.currentDelegator = null;
                        entry.originalDelegator = null;
   
                        accessArray.push(entry);
                    }*/
                    }
               
                    roleArray.push(tempRole);
                    logger.error(`Business Application ${tempRole.businessAppId} for role ${tempRole.name}`) //Added log
               
                    if(tempRole.businessAppId && enrolledApps.find(item => item.kogAppId === tempRole.businessAppId.kogAppId) === undefined) {
 
                        //dharjani begin - need to check if returnURL exists in the enrollment context record and find associated app name and redirect URL
                        var contextReturnURL = null;
                        var contextBasedApp = null;
                        var showConfirmationPage = true;
                        if (requestResponse && requestResponse.enrollmentContext && requestResponse.enrollmentContext.hasOwnProperty('returnURL') && requestResponse.enrollmentContext.returnURL !== null && requestResponse.enrollmentContext.returnURL !== undefined && requestResponse.enrollmentContext.returnURL.toString().trim() !== "") {
                            contextReturnURL = requestResponse.enrollmentContext.returnURL;
                        }

                        if (requestResponse && requestResponse.enrollmentContext && requestResponse.enrollmentContext.hasOwnProperty('showConfirmationPage') && requestResponse.enrollmentContext.showConfirmationPage !== null && requestResponse.enrollmentContext.showConfirmationPage !== undefined && requestResponse.enrollmentContext.showConfirmationPage.toString().trim() !== "") {
                            
                            //Identifying showConfirmationPage as it is stored on the enrollment context
                            scp = requestResponse.enrollmentContext.showConfirmationPage;
                            if (typeof scp === "boolean") {
                                showConfirmationPage = scp;
                            } else if (typeof scp === "string") {
                                // Accept "true"/"false" (case-insensitive)
                                var scpLower = scp.trim().toLowerCase();
                                if (scpLower === "true") {
                                    showConfirmationPage = true;
                                } else if (scpLower === "false") {
                                    showConfirmationPage = false;
                                } else {
                                    logger.error("showConfirmationPage string value not recognized: " + scp + ". Defaulting to true.");
                                    showConfirmationPage = true;
                                }
                            } else {
                                logger.error("showConfirmationPage is not boolean or string. Defaulting to true.");
                                showConfirmationPage = true;
                            }
                        }
 
                        if (contextReturnURL && tempRole.businessAppId.kogParentAppName && tempRole.businessAppId.kogParentAppName.toString().trim() !== "") {
                            var queryFilter = '/kogAppId eq "' + tempRole.businessAppId.kogAppId + '" and kogParentAppName eq "' + tempRole.businessAppId.kogParentAppName + '"';
                            var childBusinessAppRecords = openidm.query("managed/alpha_kyid_businessapplication",{"_queryFilter": queryFilter},["*"]);
                            logger.error("Child BusinessAppRecords: " + JSON.stringify(childBusinessAppRecords));
 
                            var matchedBusinessApp = null;
                            if (childBusinessAppRecords && childBusinessAppRecords.result && Array.isArray(childBusinessAppRecords.result)) {
                                // Exact matches
                                var filteredApps = childBusinessAppRecords.result.filter(function(item) {
                                    return item.forgerockAppId === contextReturnURL;
                                });
 
                                if (filteredApps.length > 0) {
                                    matchedBusinessApp = filteredApps[0]; // Select the first matching item if multiple exist. This should ideally not happen
                                } else {
                                    // If no exact match, check for startsWith logic
                                    var startsWithApps = childBusinessAppRecords.result.filter(function(item) {
                                        return (
                                            item.forgerockAppId &&
                                            contextReturnURL &&
                                            contextReturnURL.startsWith(item.forgerockAppId)
                                        );
                                    });
 
                                    if (startsWithApps.length > 0) {
                                        matchedBusinessApp = startsWithApps[0]; // Select the first startsWith match
                                    }
                                }
                                contextBasedApp = matchedBusinessApp;
                                logger.error("Matching Child BusinessAppRecord: " + JSON.stringify(contextBasedApp));
                            }
                        }
                        logger.error("Matching ReturnURL Outside Loop: " + JSON.stringify(contextReturnURL));
                        logger.error("Matching BusinessAppRecord Outside Loop: " + JSON.stringify(contextBasedApp));
                       
                        let appIdForRedirection;
                        if (contextBasedApp && contextBasedApp.kogAppId) {
                            appIdForRedirection = contextBasedApp.kogAppId
                        } else {
                            appIdForRedirection = tempRole.businessAppId.kogAppId;
                        }
                        let softSignOutURLForRedirection;
                        if (contextBasedApp && contextBasedApp.softLogoutURL) {
                            softSignOutURLForRedirection = `${contextBasedApp.softLogoutURL}?ReturnURL=${contextReturnURL || contextBasedApp.applicationURL}`;
                        } else if (tempRole.businessAppId && tempRole.businessAppId.softLogoutURL) {
                            softSignOutURLForRedirection = tempRole.businessAppId.applicationURL
                                ? `${tempRole.businessAppId.softLogoutURL}?ReturnURL=${tempRole.businessAppId.applicationURL}`
                                : tempRole.businessAppId.softLogoutURL;
                        } else {
                            softSignOutURLForRedirection = undefined;
                        }
 
                        logger.error("Redirection ReturnURL Outside Loop: " + appIdForRedirection);
                        logger.error("Redirection BusinessAppRecord Outside Loop: " + softSignOutURLForRedirection);
 
                        // enrolledApps.push({
                        //     "appId": contextBasedApp && contextBasedApp.kogAppId ? contextBasedApp.kogAppId : tempRole.businessAppId.kogAppId,
                        //     "softSignOutURL": contextBasedApp && contextBasedApp.softLogoutURL ? contextReturnURL ? `${contextBasedApp.softLogoutURL}?ReturnURL=${contextReturnURL}` : `${contextBasedApp.softLogoutURL}?ReturnURL=${contextBasedApp.applicationURL}`
                        //                         : tempRole.businessAppId.softLogoutURL && tempRole.businessAppId.applicationURL
                        //                             ? `${tempRole.businessAppId.softLogoutURL}?ReturnURL=${tempRole.businessAppId.applicationURL}`
                        //                             : tempRole.businessAppId.softLogoutURL
                        // })
 
                        enrolledApps.push({
                            "appId": appIdForRedirection,
                            "softSignOutURL": softSignOutURLForRedirection,
                            "showConfirmationPage": showConfirmationPage
                        })
                        responseShowConfirmationPage = !showConfirmationPage ? "false" : responseShowConfirmationPage
                        
                        //dharjani end
                    }
                    if(tempRole.accessPolicy && tempRole.accessPolicy._ref) {
                        let policy = openidm.read(tempRole.accessPolicy._ref, null, ["*", "dependentRole/*"]);
                       
                        policy.dependentRole.forEach(function (depRole) {
                            let tempDepRole = openidm.read(depRole._ref, null, ["*", "businessAppId/*"]);
                            if(tempDepRole.recordState && tempDepRole.recordState.toLowerCase() !== "active") {
                                throw { code : 500, message : "Requested role is inactive: " + tempDepRole.name };
                            }
                            if(tempDepRole.isDelegable) {
                                let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);
 
                                if(roleContext && roleContext !== null) {
                                    if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
                                        // Use parent role context to add to accessArray
                                        let entry = entryTemplate;
 
                                        entry.orgId = roleContext.orgId;
                                        entry.orgType = roleContext.orgType;
                                        entry.appIdentifier = tempDepRole.businessAppId._id;
                                        entry.roleIdentifier = tempDepRole._id;
                                        entry.userIdentifier = userResponse._id;
                                        entry.originalDelegatorIdentifier = roleContext.orginalDelegatorId;
                                        entry.currentDelegatorIdentifier = roleContext.currentDelegatorId;
                                        entry.app = {
                                            "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
                                        };
                                        entry.user = {
                                            "_ref": "managed/alpha_user/" + userResponse._id
                                        };
                                        entry.role = {
                                            "_ref": "managed/alpha_role/" + tempDepRole._id
                                        };
                                        entry.currentDelegator = {
                                            "_ref": "managed/alpha_user/" + roleContext.currentDelegatorId
                                        };
                                        entry.originalDelegator = {
                                            "_ref": "managed/alpha_user/" + roleContext.orginalDelegatorId
                                        };
 
                                        accessArray.push(entry);
                                    }
                                    else {
                                        // add to accessArray
                                        let entry = entryTemplate;
 
                                        entry.appIdentifier = tempDepRole.businessAppId._id;
                                        entry.roleIdentifier = tempDepRole._id;
                                        entry.userIdentifier = userResponse._id;
                                        entry.originalDelegatorIdentifier = null;
                                        entry.currentDelegatorIdentifier = null;
                                        entry.app = {
                                            "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
                                        };
                                        entry.user = {
                                            "_ref": "managed/alpha_user/" + userResponse._id
                                        };
                                        entry.role = {
                                            "_ref": "managed/alpha_role/" + tempDepRole._id
                                        };
                                        entry.currentDelegator = null;
                                        entry.originalDelegator = null;
 
                                        accessArray.push(entry);
                                    }
                                }
                                else {
                                    // add to accessArray
                                    let entry = entryTemplate;
 
                                    entry.appIdentifier = tempDepRole.businessAppId._id;
                                    entry.roleIdentifier = tempDepRole._id;
                                    entry.userIdentifier = userResponse._id;
                                    entry.originalDelegatorIdentifier = null;
                                    entry.currentDelegatorIdentifier = null;
                                    entry.app = {
                                        "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
                                    };
                                    entry.user = {
                                        "_ref": "managed/alpha_user/" + userResponse._id
                                    };
                                    entry.role = {
                                        "_ref": "managed/alpha_role/" + tempDepRole._id
                                    };
                                    entry.currentDelegator = null;
                                    entry.originalDelegator = null;
 
                                    accessArray.push(entry);
                                }
                            }
                            else {
                                // add to accessArray
                                let entry = entryTemplate;
 
                                entry.appIdentifier = tempDepRole.businessAppId._id;
                                entry.roleIdentifier = tempDepRole._id;
                                entry.userIdentifier = userResponse._id;
                                entry.originalDelegatorIdentifier = null;
                                entry.currentDelegatorIdentifier = null;
                                entry.app = {
                                    "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
                                };
                                entry.user = {
                                    "_ref": "managed/alpha_user/" + userResponse._id
                                };
                                entry.role = {
                                    "_ref": "managed/alpha_role/" + tempDepRole._id
                                };
                                entry.currentDelegator = null;
                                entry.originalDelegator = null;
 
                                accessArray.push(entry);
                            }
                            roleArray.push(tempDepRole);
                        });
                    }
            })
 
            //kogAddRolesToUser(roleArray, userResponse);
           // const kogResponse = kogAddRolesToUser(roleArray, userResponse, requesterUser);
           
            logger.error("ACCESS endpoint - before calling Add Roles To User funciton - roleArray: " + JSON.stringify(roleArray));
            logger.error("ACCESS endpoint - before calling Add Roles To User funciton - kogUserAuthPayload: " + JSON.stringify(kogUserAuthPayload));
            logger.error("ACCESS endpoint - before calling Add Roles To User funciton - userResponse: " + JSON.stringify(userResponse));
            logger.error("ACCESS endpoint - before calling Add Roles To User funciton - requesterUser: " + requesterUser);

            addRolesToUser(roleArray, kogUserAuthPayload, userResponse, requesterUser);
 
            try {
                // loop through accessArray and openidm.create
              logger.error("the entry in accessArray is -- "+ JSON.stringify(accessArray))
              
                accessArray.forEach(function (entry) {
                  logger.error("the entry in accessArray entry"+ JSON.stringify(entry))
                var resultAccessMO = openidm.create("managed/alpha_kyid_access", null, entry);
                  logger.error("access MO created::"+JSON.stringify(resultAccessMO))
                });
            } catch(error){
                logger.error("error when patching access: " + JSON.stringify(error));
            }
            logger.error("access: SUCCESS - updating enrollment request status to COMPLETED for ID: " + requestResponse._id);
            let patchResponse = openidm.patch("managed/alpha_kyid_enrollment_request/" + requestResponse._id, null, [{"operation": "replace", "field": "status", "value": "COMPLETED"}]);
            logger.error("access: " + JSON.stringify(patchResponse));
        }
    } catch (error) {
        throw { code : 500, message : getException(error) };
    }
    /*return {
        "status":"success",
        "enrolledApps": enrolledApps,
        "message":"Access has been provisioned successfully."
    };*/
    return {
        "status":"success",
        "showConfirmationPage": responseShowConfirmationPage,
        "enrolledApps": enrolledApps,
        "message":"Access has been provisioned successfully."
    };
}


// function provisionAccess(paramJSON){

//     try {
//         let objects = validateRequest(paramJSON);
//         if(objects.userResponse && objects.requestResponse) {
//             let userResponse = objects.userResponse;
//             let requestResponse = objects.requestResponse;
//             let requesterUser = objects.requesterUser;
//             if(!requestResponse.roleIds) {
//                 throw { code : 500, message : "No application roles to provision access to." };
//             }

//             let roleArray = [];
//             var enrolledApps = [];
//             var accessArray = [];

//             let current = Date.now();
//             let iso = new Date(current).toISOString();

//             let requester = null;

//             if(requesterUser && requesterUser.userName) {
//                 requester = requesterUser.userName;
//             }
//             else {
//                 requester = requestResponse.requesterId;
//             }

//             let entryTemplate = {
//                 "isForwardDelegable": false,
//                 "assignmentDate": iso,
//                 "assignmentDateEpoch": current,
//                 "recordState": "0",
//                 "recordSource": "0",
//                 "createDate": iso,
//                 "createDateEpoch": current,
//                 "updateDate": iso,
//                 "updateDateEpoch": current,
//                 "createdBy": requester,
//                 "updatedBy": requester,
//                 "appIdentifier": null,
//                 "roleIdentifier": null,
//                 "userIdentifier": null,
//                 "originalDelegatorIdentifier": null,
//                 "currentDelegatorIdentifier": null,
//                 "app": null,
//                 "user": null,
//                 "role": null,
//                 "currentDelegator": null,
//                 "originalDelegator": null
//             }
            
//             requestResponse.roleIds.forEach(function (role) {
//                 let tempRole = openidm.read(role._ref, null, ["*", "businessAppId/*"]);
//                 if(tempRole.recordState && tempRole.recordState.toLowerCase() !== "active") {
//                     throw { code : 500, message : "Requested role is inactive: " + tempRole.name };
//                 }
//                 if(tempRole.isDelegable) {
//                     // if(!requestResponse.roleContext || requestResponse.roleContext.length == 0) {
//                     //     throw { code : 500, message : "Delegable role present, role context not present." };
//                     // }
//                     let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);

//                     if(roleContext && roleContext !== null) {
//                         if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
//                             // add to accessArray
//                             let entry = entryTemplate;

//                             entry.orgId = roleContext.orgId;
//                             entry.orgType = roleContext.orgType;
//                             entry.appIdentifier = tempRole.businessAppId._id;
//                             entry.roleIdentifier = tempRole._id;
//                             entry.userIdentifier = userResponse._id;
//                             entry.originalDelegatorIdentifier = roleContext.orginalDelegatorId;
//                             entry.currentDelegatorIdentifier = roleContext.currentDelegatorId;
//                             entry.app = {
//                                 "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
//                             };
//                             entry.user = {
//                                 "_ref": "managed/alpha_user/" + userResponse._id
//                             };
//                             entry.role = {
//                                 "_ref": "managed/alpha_role/" + tempRole._id
//                             };
//                             entry.currentDelegator = {
//                                 "_ref": "managed/alpha_user/" + roleContext.currentDelegatorId
//                             };
//                             entry.originalDelegator = {
//                                 "_ref": "managed/alpha_user/" + roleContext.orginalDelegatorId
//                             };

//                             accessArray.push(entry);
//                         }
//                         else {
//                             // throw { code : 500, message : "Delegator Id not present for delegable role: " + tempRole.name };
//                             let entry = entryTemplate;
        
//                             entry.appIdentifier = tempRole.businessAppId._id;
//                             entry.roleIdentifier = tempRole._id;
//                             entry.userIdentifier = userResponse._id;
//                             entry.originalDelegatorIdentifier = null;
//                             entry.currentDelegatorIdentifier = null;
//                             entry.app = {
//                                 "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
//                             };
//                             entry.user = {
//                                 "_ref": "managed/alpha_user/" + userResponse._id
//                             };
//                             entry.role = {
//                                 "_ref": "managed/alpha_role/" + tempRole._id
//                             };
//                             entry.currentDelegator = null;
//                             entry.originalDelegator = null;
        
//                             accessArray.push(entry);
//                         }
//                     }
//                     else {
//                         // throw { code : 500, message : "Role context not present for role: " + tempRole.name };
//                     // add to accessArray
//                         let entry = entryTemplate;
    
//                         entry.appIdentifier = tempRole.businessAppId._id;
//                         entry.roleIdentifier = tempRole._id;
//                         entry.userIdentifier = userResponse._id;
//                         entry.originalDelegatorIdentifier = null;
//                         entry.currentDelegatorIdentifier = null;
//                         entry.app = {
//                             "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
//                         };
//                         entry.user = {
//                             "_ref": "managed/alpha_user/" + userResponse._id
//                         };
//                         entry.role = {
//                             "_ref": "managed/alpha_role/" + tempRole._id
//                         };
//                         entry.currentDelegator = null;
//                         entry.originalDelegator = null;
    
//                         accessArray.push(entry);
//                     }
//                 }
//                 else {
//                     // add to accessArray
//                     let entry = entryTemplate;

//                     entry.appIdentifier = tempRole.businessAppId._id;
//                     entry.roleIdentifier = tempRole._id;
//                     entry.userIdentifier = userResponse._id;
//                     entry.originalDelegatorIdentifier = null;
//                     entry.currentDelegatorIdentifier = null;
//                     entry.app = {
//                         "_ref": "managed/alpha_kyid_businessapplication/" + tempRole.businessAppId._id
//                     };
//                     entry.user = {
//                         "_ref": "managed/alpha_user/" + userResponse._id
//                     };
//                     entry.role = {
//                         "_ref": "managed/alpha_role/" + tempRole._id
//                     };
//                     entry.currentDelegator = null;
//                     entry.originalDelegator = null;

//                     accessArray.push(entry);
//                 }

//                 roleArray.push(tempRole);
//                 logger.error(`Business Application ${tempRole.businessAppId} for role ${tempRole.name}`) //Added log
              
//                 if(tempRole.businessAppId && enrolledApps.find(item => item.kogAppId === tempRole.businessAppId.kogAppId) === undefined) {

//                     //dharjani begin - need to check if returnURL exists in the enrollment context record and find associated app name and redirect URL
//                     var contextReturnURL = null;
//                     var contextBasedApp = null;
//                     if (requestResponse && requestResponse.enrollmentContext && requestResponse.enrollmentContext.hasOwnProperty('returnURL') && requestResponse.enrollmentContext.returnURL !== null && requestResponse.enrollmentContext.returnURL !== undefined && requestResponse.enrollmentContext.returnURL.toString().trim() !== "") {
//                         contextReturnURL = requestResponse.enrollmentContext.returnURL;
//                     }

//                     if (contextReturnURL && tempRole.businessAppId.kogParentAppName && tempRole.businessAppId.kogParentAppName.toString().trim() !== "") {
//                         var queryFilter = '/kogAppId eq "' + tempRole.businessAppId.kogAppId + '" and kogParentAppName eq "' + tempRole.businessAppId.kogParentAppName + '"';
//                         var childBusinessAppRecords = openidm.query("managed/alpha_kyid_businessapplication",{"_queryFilter": queryFilter},["*"]);
//                         logger.error("Child BusinessAppRecords: " + JSON.stringify(childBusinessAppRecords));

//                         var matchedBusinessApp = null;
//                         if (childBusinessAppRecords && childBusinessAppRecords.result && Array.isArray(childBusinessAppRecords.result)) {
//                             // Exact matches
//                             var filteredApps = childBusinessAppRecords.result.filter(function(item) {
//                                 return item.forgerockAppId === contextReturnURL;
//                             });

//                             if (filteredApps.length > 0) {
//                                 matchedBusinessApp = filteredApps[0]; // Select the first matching item if multiple exist. This should ideally not happen
//                             } else {
//                                 // If no exact match, check for startsWith logic
//                                 var startsWithApps = childBusinessAppRecords.result.filter(function(item) {
//                                     return (
//                                         item.forgerockAppId &&
//                                         contextReturnURL &&
//                                         contextReturnURL.startsWith(item.forgerockAppId)
//                                     );
//                                 });

//                                 if (startsWithApps.length > 0) {
//                                     matchedBusinessApp = startsWithApps[0]; // Select the first startsWith match
//                                 }
//                             }
//                             contextBasedApp = matchedBusinessApp;
//                             logger.error("Matching Child BusinessAppRecord: " + JSON.stringify(contextBasedApp));
//                         }
//                     }
//                     logger.error("Matching ReturnURL Outside Loop: " + JSON.stringify(contextReturnURL));
//                     logger.error("Matching BusinessAppRecord Outside Loop: " + JSON.stringify(contextBasedApp));
                    
//                     let appIdForRedirection;
//                     if (contextBasedApp && contextBasedApp.kogAppId) {
//                         appIdForRedirection = contextBasedApp.kogAppId 
//                     } else {
//                         appIdForRedirection = tempRole.businessAppId.kogAppId;
//                     }
//                     let softSignOutURLForRedirection;
//                     if (contextBasedApp && contextBasedApp.softLogoutURL) {
//                         softSignOutURLForRedirection = `${contextBasedApp.softLogoutURL}?ReturnURL=${contextReturnURL || contextBasedApp.applicationURL}`;
//                     } else if (tempRole.businessAppId && tempRole.businessAppId.softLogoutURL) {
//                         softSignOutURLForRedirection = tempRole.businessAppId.applicationURL
//                             ? `${tempRole.businessAppId.softLogoutURL}?ReturnURL=${tempRole.businessAppId.applicationURL}`
//                             : tempRole.businessAppId.softLogoutURL;
//                     } else {
//                         softSignOutURLForRedirection = undefined;
//                     }

//                     logger.error("Redirection ReturnURL Outside Loop: " + appIdForRedirection);
//                     logger.error("Redirection BusinessAppRecord Outside Loop: " + softSignOutURLForRedirection);

//                     // enrolledApps.push({
//                     //     "appId": contextBasedApp && contextBasedApp.kogAppId ? contextBasedApp.kogAppId : tempRole.businessAppId.kogAppId,
//                     //     "softSignOutURL": contextBasedApp && contextBasedApp.softLogoutURL ? contextReturnURL ? `${contextBasedApp.softLogoutURL}?ReturnURL=${contextReturnURL}` : `${contextBasedApp.softLogoutURL}?ReturnURL=${contextBasedApp.applicationURL}`
//                     //                         : tempRole.businessAppId.softLogoutURL && tempRole.businessAppId.applicationURL
//                     //                             ? `${tempRole.businessAppId.softLogoutURL}?ReturnURL=${tempRole.businessAppId.applicationURL}`
//                     //                             : tempRole.businessAppId.softLogoutURL
//                     // })

//                     enrolledApps.push({
//                         "appId": appIdForRedirection,
//                         "softSignOutURL": softSignOutURLForRedirection
//                     })
//                     //dharjani end
//                 }
//                 if(tempRole.accessPolicy && tempRole.accessPolicy._ref) {
//                     let policy = openidm.read(tempRole.accessPolicy._ref, null, ["*", "dependentRole/*"]);
                    
//                     policy.dependentRole.forEach(function (depRole) {
//                         let tempDepRole = openidm.read(depRole._ref, null, ["*", "businessAppId/*"]);
//                         if(tempDepRole.recordState && tempDepRole.recordState.toLowerCase() !== "active") {
//                             throw { code : 500, message : "Requested role is inactive: " + tempDepRole.name };
//                         }
//                         if(tempDepRole.isDelegable) {
//                             let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);

//                             if(roleContext && roleContext !== null) {
//                                 if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
//                                     // Use parent role context to add to accessArray
//                                     let entry = entryTemplate;

//                                     entry.orgId = roleContext.orgId;
//                                     entry.orgType = roleContext.orgType;
//                                     entry.appIdentifier = tempDepRole.businessAppId._id;
//                                     entry.roleIdentifier = tempDepRole._id;
//                                     entry.userIdentifier = userResponse._id;
//                                     entry.originalDelegatorIdentifier = roleContext.orginalDelegatorId;
//                                     entry.currentDelegatorIdentifier = roleContext.currentDelegatorId;
//                                     entry.app = {
//                                         "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
//                                     };
//                                     entry.user = {
//                                         "_ref": "managed/alpha_user/" + userResponse._id
//                                     };
//                                     entry.role = {
//                                         "_ref": "managed/alpha_role/" + tempDepRole._id
//                                     };
//                                     entry.currentDelegator = {
//                                         "_ref": "managed/alpha_user/" + roleContext.currentDelegatorId
//                                     };
//                                     entry.originalDelegator = {
//                                         "_ref": "managed/alpha_user/" + roleContext.orginalDelegatorId
//                                     };

//                                     accessArray.push(entry);
//                                 }
//                                 else {
//                                     // add to accessArray
//                                     let entry = entryTemplate;

//                                     entry.appIdentifier = tempDepRole.businessAppId._id;
//                                     entry.roleIdentifier = tempDepRole._id;
//                                     entry.userIdentifier = userResponse._id;
//                                     entry.originalDelegatorIdentifier = null;
//                                     entry.currentDelegatorIdentifier = null;
//                                     entry.app = {
//                                         "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
//                                     };
//                                     entry.user = {
//                                         "_ref": "managed/alpha_user/" + userResponse._id
//                                     };
//                                     entry.role = {
//                                         "_ref": "managed/alpha_role/" + tempDepRole._id
//                                     };
//                                     entry.currentDelegator = null;
//                                     entry.originalDelegator = null;

//                                     accessArray.push(entry);
//                                 }
//                             }
//                             else {
//                                 // add to accessArray
//                                 let entry = entryTemplate;

//                                 entry.appIdentifier = tempDepRole.businessAppId._id;
//                                 entry.roleIdentifier = tempDepRole._id;
//                                 entry.userIdentifier = userResponse._id;
//                                 entry.originalDelegatorIdentifier = null;
//                                 entry.currentDelegatorIdentifier = null;
//                                 entry.app = {
//                                     "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
//                                 };
//                                 entry.user = {
//                                     "_ref": "managed/alpha_user/" + userResponse._id
//                                 };
//                                 entry.role = {
//                                     "_ref": "managed/alpha_role/" + tempDepRole._id
//                                 };
//                                 entry.currentDelegator = null;
//                                 entry.originalDelegator = null;

//                                 accessArray.push(entry);
//                             }
//                         }
//                         else {
//                             // add to accessArray
//                             let entry = entryTemplate;

//                             entry.appIdentifier = tempDepRole.businessAppId._id;
//                             entry.roleIdentifier = tempDepRole._id;
//                             entry.userIdentifier = userResponse._id;
//                             entry.originalDelegatorIdentifier = null;
//                             entry.currentDelegatorIdentifier = null;
//                             entry.app = {
//                                 "_ref": "managed/alpha_kyid_businessapplication/" + tempDepRole.businessAppId._id
//                             };
//                             entry.user = {
//                                 "_ref": "managed/alpha_user/" + userResponse._id
//                             };
//                             entry.role = {
//                                 "_ref": "managed/alpha_role/" + tempDepRole._id
//                             };
//                             entry.currentDelegator = null;
//                             entry.originalDelegator = null;

//                             accessArray.push(entry);
//                         }
//                         roleArray.push(tempDepRole);
//                     });
//                 }
//             });

//             //kogAddRolesToUser(roleArray, userResponse);
//            // const kogResponse = kogAddRolesToUser(roleArray, userResponse, requesterUser);
//             logger.error("Role Context Before Add Roles To User Function: " + JSON.stringify(requestResponse));
//             logger.error("Input to Add Roles To User Function: " + JSON.stringify(roleArray));
//             addRolesToUser(roleArray, userResponse, requesterUser);

//             // loop through accessArray and openidm.create
//             accessArray.forEach(function (entry) {
//                 openidm.create("managed/alpha_kyid_access", null, entry);
//             });

//             logger.error("access: SUCCESS - updating enrollment request status to COMPLETED for ID: " + requestResponse._id);
//             let patchResponse = openidm.patch("managed/alpha_kyid_enrollment_request/" + requestResponse._id, null, [{"operation": "replace", "field": "status", "value": "COMPLETED"}]);
//             logger.error("access: " + JSON.stringify(patchResponse));
//         }
//     } catch (error) {
//         throw { code : 500, message : getException(error) };
//     }
//     /*return {
//         "status":"success",
//         "enrolledApps": enrolledApps,
//         "message":"Access has been provisioned successfully."
//     };*/
//     return {
//         "status":"success",
//         "enrolledApps": enrolledApps,
//         "message":"Access has been provisioned successfully."
//     };
// }

function deprovisionAccess(paramJSON){

    try {
        let objects = validateRequest(paramJSON);
        if(objects.userResponse && objects.requestResponse) {
            let userResponse = objects.userResponse;
            let requestResponse = objects.requestResponse;
            let requesterUser = objects.requesterUser;
            if(!requestResponse.roleIds) {
                throw { code : 500, message : "No application roles to provision access to." };
            }

            let roleArray = [];
            var removedApps = [];
            var accessArray = [];

            let current = Date.now();
            let iso = new Date(current).toISOString();

            let requester = null;
            if(requesterUser && requesterUser.userName) {
                requester = requesterUser.userName;
            }
            else {
                requester = requestResponse.requesterId;
            }
            
            requestResponse.roleIds.forEach(function (role) {
                let tempRole = openidm.read(role._ref, null, ["*", "businessAppId/*"]);
                if(tempRole.recordState && tempRole.recordState.toLowerCase() !== "active") {
                    throw { code : 500, message : "Requested role is inactive: " + tempRole.name };
                }
                if(tempRole.isDelegable) {
                    if(!requestResponse.roleContext || requestResponse.roleContext.length == 0) {
                        throw { code : 500, message : "Delegable role present, role context not present." };
                    }
                    let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);

                    if(roleContext && roleContext !== null) {
                        if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
                            //has delegators, remove role from delegate if present
                            try {
                                let delegate = openidm.read("managed/alpha_user/" + currentDelegatorId, null, ["*", "roles/*"]);
                                removeRolesFromUser([tempRole], delegate, null);
                            } catch(error) {
                                logger.error("access: Removing role from delegate failed.")
                            }
                        }
                        else {
                            throw { code : 500, message : "Delegator Id not present for delegable role: " + tempRole.name };
                        }
                    }
                    else {
                        throw { code : 500, message : "Role context not present for role: " + tempRole.name };
                    }
                }

                roleArray.push(tempRole);

                if(tempRole.businessAppId && removedApps.find(item => item.kogAppId === tempRole.businessAppId.kogAppId) === undefined) {
                    removedApps.push({
                        "kogAppId": tempRole.businessAppId.kogAppId,
                        "softLogoutUrl": tempRole.businessAppId.softLogoutURL
                    })
                }
                if(tempRole.accessPolicy && tempRole.accessPolicy._ref) {
                    let policy = openidm.read(tempRole.accessPolicy._ref, null, ["*", "dependentRole/*"]);
                    policy.dependentRole.forEach(function (depRole) {
                        let tempDepRole = openidm.read(depRole._ref, null, ["*", "businessAppId/*"]);
                        if(tempDepRole.recordState && tempDepRole.recordState.toLowerCase() !== "active") {
                            throw { code : 500, message : "Requested role is inactive: " + tempDepRole.name };
                        }
                        if(tempDepRole.isDelegable) {
                            let roleContext = requestResponse.roleContext.find(item => item.roleName === tempRole.name);

                            if(roleContext && roleContext !== null) {
                                if(roleContext.orginalDelegatorId && roleContext.orginalDelegatorId !== null && roleContext.currentDelegatorId && roleContext.currentDelegatorId !== null) {
                                     //has delegators, remove role from delegate if present
                                    try {
                                        let delegate = openidm.read("managed/alpha_user/" + currentDelegatorId, null, ["*", "roles/*"]);
                                        removeRolesFromUser([tempDepRole], delegate, null);
                                    } catch(error) {
                                        logger.error("access: Removing role from delegate failed.")
                                    }
                                }
                            }
                            else {
                                //no role context 
                                throw { code : 500, message : "Role context not present for role: " + tempDepRole.name };
                            }
                        }

                        roleArray.push(tempDepRole);
                    });
                }
            });

            disablePreReqs(roleArray, userResponse, requestResponse);

            removeRolesFromUser(roleArray, userResponse, requesterUser);
        }
    } catch (error) {
        throw { code : 500, message : error.message };
    }
    return {
        "status":"success",
        "removedRoles": removedApps,
        "message":"Access has been deprovisioned successfully."
    };
}


/**
* @name getException
* @description Get exception details
*
* @param {JSON} exception
* @returns {JSON} exception.
*/
function getException(e) {
    let _ = require('lib/lodash');
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

function currentDate() {
    let currentDate = Date.now();
    return new Date(current).toISOString();

}