(function () {
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-UNR",
        content:"An unexpected error occured while processing the request."
    }

    const EXCEPTION_UNSUPPORTED_OPERATION = {
        code:"KYID-USO",
        content:""
    }
  
    const RESPONSE_CODE_ERROR = "2"
    
    const REQUEST_POST = "create"
    const REQUEST_GET = "read"
    const REQUEST_UPDATE = "update"
    const REQUEST_PATCH = "patch"
    const REQUEST_DELETE = "delete"
    
    const ENDPOINT_NAME = 'removeauthorization'
    const ACCESS_ENDPOINT_NAME = 'endpoint/access_v2B'
    
    const _MO_USER = "managed/alpha_user/"
    const _MO_APPLICATION = "managed/alpha_kyid_businessapplication/"
    const _MO_ROLE = "managed/alpha_role/"
    
    let requestedUserResponse
    let requesterUserResponse 
    let businessApplicationResponse
    let appRoleResponse
    let originalDelegatorUserResponse
    let currentDelegatorUserResponse
    let input  =  {
      transactionId:context.transactionId.id
    }
    var UUID = java.util.UUID;
    let roleRemovalTransactionid = UUID.randomUUID().toString();
    let roleRemovalEndpointName = "ExternalRoleRemoval";

    try{
       switch (request.method) {

           case REQUEST_POST:
           
                let authRequests = []
                let authRequest = {}
           
                let accessSearchQuery = ""
                /* Get request content */
                const requestContent = request.content
                if(requestContent && requestContent.transactionId) {
                    roleRemovalTransactionid = requestContent.transactionId
                }
                logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"RoleRemoval","ExternalRoleRemoval: Inside Role Removal Endpoint: " + JSON.stringify(requestContent))
                
                try{
                    
                    if( requestContent.userIdentifier && 
                        //requestContent.requestorUserIdentifier && 
                        requestContent.authorizations
                    ){
                        const requestInput = {
                            transactionId:requestContent.transactionId,
                            userIdentifier:requestContent.userIdentifier,
                            //requestorUserIdentifier:requestContent.requestorUserIdentifier,
                            authorizations:requestContent.authorizations   
                        }
                      
                        
                        let requestedUser = {}
                        let requesterUser = {}
                      
                        /* Validate user identifier */
                        if(requestInput.userIdentifier){

                            if(requestInput.userIdentifier.kyidUniqueId){
                                requestedUser.userIdAttributeName = "_id"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.kyidUniqueId
                            }else if(requestInput.userIdentifier.kogId){
                                requestedUser.userIdAttributeName = "userName"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.kogId
                            }else if(requestInput.userIdentifier.upn){
                                requestedUser.userIdAttributeName = "frindexstring1"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.upn
                            }else if (requestInput.userIdentifier.emailAddress){
                                requestedUser.userIdAttributeName = "mail"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.emailAddress
                            }else if (requestInput.userIdentifier.logon){
                                requestedUser.userIdAttributeName = "frindexstring1"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.logon
                            }else if (requestInput.userIdentifier.employeeId){
                                //requestedUser.userIdAttributeName = "mail"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.employeeId
                            }else if (requestInput.userIdentifier.windowsAccountName){
                                requestedUser.userIdAttributeName = "custom_windowsAccountName"
                                requestedUser.userIdAttributeValue = requestInput.userIdentifier.windowsAccountName
                            }
                                
                            requestedUserResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_USER,requestedUser.userIdAttributeName, requestedUser.userIdAttributeValue)
                           
                          //  requestedUserResponse?accessSearchQuery = accessSearchQuery.concat(`userIdentifier eq '${requestedUserResponse._id}'`):''
                            
                            // if(!requestedUserResponse){
                            //     return {
                            //         transactionId:requestInput.transactionId,
                            //         responseStatus:1,
                            //         messageResponses:[{
                            //             messageCode:"-100",
                            //             messageDescription:`Requested user '${requestedUser.userIdAttributeName}' is not valid`
                            //         }]
                            //     }
                            // }

                          if (requestedUserResponse) {
                           // accessSearchQuery = accessSearchQuery.concat(`userIdentifier eq '${requestedUserResponse._id}'`);

                              //Check if user is internal using frUnindexString1 (case-insensitive)
                              if (
                              requestedUserResponse.frUnindexedString1 &&
                              requestedUserResponse.frUnindexedString1.toLowerCase().localeCompare("internal") === 0
                               )  {
                                  return {
                                      transactionId: requestInput.transactionId,
                                      responseStatus: 1,
                                      messageResponses: [{
                                          messageCode: "-101",
                                          messageDescription: "Requested user is internal user."
                                      }]
                                  };
                              }
                          } else {
                              return {
                                  transactionId: requestInput.transactionId,
                                  responseStatus: 1,
                                  messageResponses: [{
                                      messageCode: "-100",
                                      messageDescription: `Requested user '${requestedUser.userIdAttributeName}' is not valid`
                                  }]
                              };
                          }
                            
                        }
                            
                        if(requestInput.requestorUserIdentifier){

                            if(requestInput.requestorUserIdentifier.kyidUniqueId){
                                requesterUser.userIdAttributeName = "_id"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.kyidUniqueId
                            }else if(requestInput.requestorUserIdentifier.kogId){
                                requesterUser.userIdAttributeName = "userName"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.kogId
                            }else if(requestInput.requestorUserIdentifier.upn){
                                requesterUser.userIdAttributeName = "frindexstring1"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.upn
                            }else if (requestInput.requestorUserIdentifier.emailAddress){
                                requesterUser.userIdAttributeName = "mail"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.emailAddress
                            }else if (requestInput.requestorUserIdentifier.logon){
                                requesterUser.userIdAttributeName = "frindexstring1"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.logon
                            }else if (requestInput.requestorUserIdentifier.employeeId){
                                //requesterUser.userIdAttributeName = "mail"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.employeeId
                            }else if (requestInput.requestorUserIdentifier.windowsAccountName){
                                requesterUser.userIdAttributeName = "custom_windowsAccountName"
                                requesterUser.userIdAttributeValue = requestInput.requestorUserIdentifier.windowsAccountName
                            }
                            requesterUserResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_USER,requesterUser.userIdAttributeName, requesterUser.userIdAttributeValue)
                            if(!requesterUserResponse){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:1,
                                    messageResponses:[{
                                        messageCode:"-190",
                                        messageDescription:`Requester user '${requestedUser.userIdAttributeName}' is not valid`
                                    }]
                                }
                            }
                           
                            
                        }
                        
                        
                        /* Iterate through each authorization entry */
                        logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"RoleRemoval","the authorizations in removeauthorization"+requestInput.authorizations)
                        

                          let queries = [];
                          authRequests = [];
                          for (let auth of requestInput.authorizations) {
                              let authAlphaRoleId = null;
                              let authAlphaRoleAccessPolicy = null;
                              let singleQuery = "";
                              let authReq = {};
                      
                              authReq.businessApplicationIdAttributeName = "name";
                              authReq.businessApplicationAttributeValue = auth.applicationName;
                          
                              if (requestedUserResponse && requestedUserResponse._id) {
                                  singleQuery += `(userIdentifier eq '${requestedUserResponse._id}'`;
                              }
                          
                              if (authReq.businessApplicationIdAttributeName && authReq.businessApplicationAttributeValue) {
                                  businessApplicationResponse = searchObjectByIdAttributeValue(
                                      requestInput.transactionId,
                                      ENDPOINT_NAME,
                                      _MO_APPLICATION,
                                      authReq.businessApplicationIdAttributeName,
                                      authReq.businessApplicationAttributeValue
                                  );
                          
                                  if (!businessApplicationResponse) {
                                      return {
                                          transactionId: requestInput.transactionId,
                                          responseStatus: 1,
                                          messageResponses: [{
                                              messageCode: "-140",
                                              messageDescription: `Application '${authReq.businessApplicationAttributeValue}' is not valid`
                                          }]
                                      };
                                  }
                          
                                  singleQuery += ` AND appIdentifier eq '${businessApplicationResponse._id}'`;
                              } else {
                                  return {
                                      transactionId: requestInput.transactionId,
                                      responseStatus: 1,
                                      messageResponses: [{
                                          messageCode: "-140",
                                          messageDescription: `Application '${authReq.businessApplicationAttributeValue}' is not valid`
                                      }]
                                  };
                              }
                          
                              authReq.roleIdAttributeName = "name";
                              authReq.roleAttributeValue = auth.roleName;
                          
                              let roleQuery = 'name eq "' + auth.roleName + '" and businessAppId/_refResourceId eq "' + businessApplicationResponse._id + '"';
                              appRoleResponse = searchObjectByQuery(input, "managed/alpha_role", roleQuery);
                          
                              if (!appRoleResponse) {
                                  return {
                                      transactionId: requestInput.transactionId,
                                      responseStatus: 1,
                                      messageResponses: [{
                                          messageCode: "-150",
                                          messageDescription: `Role '${auth.roleName}' is not valid`
                                      }]
                                  };
                              }
                          
                              singleQuery += ` AND roleIdentifier eq '${appRoleResponse._id}'`;
                              logger.error("ExternalRoleRemoval: Alpha Role Response: " + JSON.stringify(appRoleResponse))
                              if(appRoleResponse) {
                                authAlphaRoleId = appRoleResponse._id;
                                if(appRoleResponse.accessPolicy) {
                                    authAlphaRoleAccessPolicy = appRoleResponse.accessPolicy._refResourceId;
                                }
                              }
                              
                            if (auth.originalDelegatorUserIdentifier) {
                                  if (auth.originalDelegatorUserIdentifier.kyidUniqueId) {
                                      authRequest.originalDelegatorUserIdAttributeName = "_id";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.kyidUniqueId;
                                  } else if (auth.originalDelegatorUserIdentifier.kogId) {
                                      authRequest.originalDelegatorUserIdAttributeName = "userName";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.kogId;
                                  } else if (auth.originalDelegatorUserIdentifier.upn) {
                                      authRequest.originalDelegatorUserIdAttributeName = "frindexstring1";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.upn;
                                  } else if (auth.originalDelegatorUserIdentifier.emailAddress) {
                                      authRequest.originalDelegatorUserIdAttributeName = "mail";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.emailAddress;
                                  } else if (auth.originalDelegatorUserIdentifier.logon) {
                                      authRequest.originalDelegatorUserIdAttributeName = "frindexstring1";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.logon;
                                  } else if (auth.originalDelegatorUserIdentifier.employeeId) {
                                     // authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.employeeId;
                                  } else if (auth.originalDelegatorUserIdentifier.windowsAccountName) {
                                      authRequest.originalDelegatorUserIdAttributeName = "custom_windowsAccountName";
                                      authRequest.originalDelegatorUserAttributeValue  = auth.originalDelegatorUserIdentifier.windowsAccountName;
                                  }
                          
                                  if (authRequest.originalDelegatorUserIdAttributeName && authRequest.originalDelegatorUserAttributeValue) {
                                      originalDelegatorUserResponse = searchObjectByIdAttributeValue(
                                          requestInput.transactionId,
                                          ENDPOINT_NAME,
                                          _MO_USER,
                                          authRequest.originalDelegatorUserIdAttributeName,
                                          authRequest.originalDelegatorUserAttributeValue
                                      );
                                      if (originalDelegatorUserResponse) {
                                          singleQuery += ` AND originalDelegatorIdentifier eq '${originalDelegatorUserResponse._id}'`;
                                      }
                                  }
                              }
                          
                              if (auth.currentDelegatorUserIdentifier) {
                                  if (auth.currentDelegatorUserIdentifier.kyidUniqueId) {
                                      authRequest.currentDelegatorUserIdAttributeName = "_id";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.kyidUniqueId;
                                  } else if (auth.currentDelegatorUserIdentifier.kogId) {
                                      authRequest.currentDelegatorUserIdAttributeName = "userName";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.kogId;
                                  } else if (auth.currentDelegatorUserIdentifier.upn) {
                                      authRequest.currentDelegatorUserIdAttributeName = "frindexstring1";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.upn;
                                  } else if (auth.currentDelegatorUserIdentifier.emailAddress) {
                                      authRequest.currentDelegatorUserIdAttributeName = "mail";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.emailAddress;
                                  } else if (auth.currentDelegatorUserIdentifier.logon) {
                                      authRequest.currentDelegatorUserIdAttributeName = "frindexstring1";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.logon;
                                  } else if (auth.currentDelegatorUserIdentifier.employeeId) {
                                      //authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.employeeId;
                                  } else if (auth.currentDelegatorUserIdentifier.windowsAccountName) {
                                      authRequest.currentDelegatorUserIdAttributeName = "custom_windowsAccountName";
                                      authRequest.currentDelegatorUserAttributeValue  = auth.currentDelegatorUserIdentifier.windowsAccountName;
                                  }
                          
                                  if (authRequest.currentDelegatorUserIdAttributeName && authRequest.currentDelegatorUserAttributeValue) {
                                      currentDelegatorUserResponse = searchObjectByIdAttributeValue(
                                          requestInput.transactionId,
                                          ENDPOINT_NAME,
                                          _MO_USER,
                                          authRequest.currentDelegatorUserIdAttributeName,
                                          authRequest.currentDelegatorUserAttributeValue
                                      );
                                      if (currentDelegatorUserResponse) {
                                          singleQuery += ` AND currentDelegatorIdentifier eq '${currentDelegatorUserResponse._id}'`;
                                      }
                                  }
                              }
                          
                              if (auth.orgName) {
                                  authRequest.orgName = auth.orgName;
                                  singleQuery += ` AND orgName eq '${auth.orgName}'`;
                              }
                              if (auth.businessKeyId) {
                                  authRequest.businessKeyId = auth.businessKeyId;
                                  singleQuery += ` AND businessKeyName eq '${auth.businessKeyId}'`;
                              }
                              if (auth.orgName && auth.businessKeyId === undefined) {
                                  return {
                                      transactionId: requestInput.transactionId,
                                      responseStatus: 1,
                                      messageResponses: [{
                                          messageCode: "-180",
                                          messageDescription: `Organization information is missing for business key id '${auth.businessKeyId}'`
                                      }]
                                  };
                              }
                          
                             
                              if (auth.expirationDateTime) { authRequest.expiryDate = auth.expirationDateTime; }
                              if (auth.isForwardDelegable) { authRequest.isForwardDelegable = auth.isForwardDelegable; }
                              if (auth.orgTypeName)       { authRequest.orgType = auth.orgTypeName; }
                              if (auth.orgSourceUniqueId) { authRequest.sourceUniqueId = auth.orgSourceUniqueId; }
                              if (auth.businessKeyType)   { authRequest.businessKeyTypeName = auth.businessKeyType; }
                              if (auth.businessKeyValue)  { authRequest.businessKeyValue = auth.businessKeyValue; }
                              if (auth.businessKeyDescription) { authRequest.businessKeyDescription = auth.businessKeyDescription; }
                          
                              singleQuery += `)`;  // close the opening parenthesis
                              queries.push(singleQuery);

                              //check if role has dependent role(s), if yes, add those in this query too
                              logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"CheckDependentRoles","ExternalRoleRemoval: Checking Dependent Roles for: " + appRoleResponse._id)
                              if(authAlphaRoleId && authAlphaRoleAccessPolicy) {
                                //fetch access policy
                                let accessPolicyQuery = '_id eq "' + authAlphaRoleAccessPolicy + '"';
                                var accessPolicyResponse = searchObjectByQuery(input, "managed/alpha_kyid_enrollment_access_policy", accessPolicyQuery);
                                //logger.error("ExternalRoleRemoval: Access Policy Response: " + JSON.stringify(accessPolicyResponse))
                                logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"CheckDependentRoles","ExternalRoleRemoval: Access Policy Response: " + JSON.stringify(accessPolicyResponse))

                                if(accessPolicyResponse && accessPolicyResponse.dependentRole) {
                                    const dependentRoleIds = Array.isArray(accessPolicyResponse.dependentRole) ? accessPolicyResponse.dependentRole.map(role => role._refResourceId).filter(Boolean) : [];
                                    const roleIdentifierRegex = /(roleIdentifier\s*eq\s*'\s*)([a-fA-F0-9-]+)(\s*')/;
                                    dependentRoleIds.forEach(dependentRoleId => {
                                        var newQuery = singleQuery.replace(roleIdentifierRegex, `$1${dependentRoleId}$3`);

                                        let roleBusAppQuery = '_id eq "' + dependentRoleId + '"';
                                        roleBusAppQueryResponse = searchObjectByQuery(input, "managed/alpha_role", roleBusAppQuery);
                                        logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"CheckDependentRoles","ExternalRoleRemoval: Dependent Role Alpha Role Business App Response: " + JSON.stringify(roleBusAppQueryResponse))
                                        //logger.error("ExternalRoleRemoval: Dependent Role Alpha Role Business App Response: " + JSON.stringify(roleBusAppQueryResponse))
                                        const dependentRoleBusinessAppId = roleBusAppQueryResponse.businessAppId._refResourceId;
                                        const appIdentifierRegex = /(appIdentifier\s*eq\s*'\s*)([a-fA-F0-9-]+)(\s*')/;
                                        newQuery = newQuery.replace(appIdentifierRegex, `$1${dependentRoleBusinessAppId}$3`);
                                        logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"CheckDependentRoles","ExternalRoleRemoval: Dependent Role Alpha Role Business App Id: " + dependentRoleBusinessAppId)
                                        //logger.error("ExternalRoleRemoval: Dependent Role Alpha Role Business App Id: " + dependentRoleBusinessAppId)
                                        logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"CheckDependentRoles","ExternalRoleRemoval: Dependent Role Additional Query: " + JSON.stringify(newQuery))
                                        //logger.error("ExternalRoleRemoval: Dependent Role Additional Query: " + JSON.stringify(newQuery))
                                        queries.push(newQuery);
                                    });
                                }

                              }

                          }
                          logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"DeleteRequest","ExternalRoleRemoval: Before Delete Request Sent - Requested User: " + JSON.stringify(requestedUserResponse))
                          //logger.error("ExternalRoleRemoval: Before Delete Request Sent - Requested User: " + JSON.stringify(requestedUserResponse))
                          logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"DeleteRequest","ExternalRoleRemoval: Before Delete Request Sent - Requestor User: " + JSON.stringify(requestedUserResponse))
                          //logger.error("ExternalRoleRemoval: Before Delete Request Sent - Requestor User: " + JSON.stringify(requestedUserResponse))
                          //delete payload
                          const deleteRequest = {
                              payload: {
                                  queryFilter: `(${queries.join(" OR ")}) AND recordState eq '0'`,
                                  //id: requesterUserResponse._id,
                                  id: requestedUserResponse._id,
                                  requesterId: requesterUserResponse ? requesterUserResponse._id : null,
                                  requestedId: requestedUserResponse._id,
                                  confirmation: {
                                      reason: (requestContent.confirmation && requestContent.confirmation.reason)
                                              ? requestContent.confirmation.reason
                                              : "apprequest",
                                      comment: (requestContent.confirmation && requestContent.confirmation.comment)
                                              ? requestContent.confirmation.comment
                                              : "This access is deleted as per the application requestInput."
                                  },
                                  originalRequestPayload: requestContent
                              },
                              action: 6 //dharjani - updating to 6 (simple delete function) from 3 (generic delete function)
                          };     
                          logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"DeleteRequest","ExternalRoleRemoval: Delete Request Payload:" + JSON.stringify(deleteRequest))
                          //logger.error("ExternalRoleRemoval: Delete Request Payload:" + JSON.stringify(deleteRequest))
                           
                        try{
                            /* call access endpoint to create access request. */
                            //logger.error("the the deleteRequest::"+JSON.stringify(deleteRequest))
                            logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"DeleteRequest","the the deleteRequest::"+JSON.stringify(deleteRequest))
                            const response =  openidm.create(ACCESS_ENDPOINT_NAME, null, deleteRequest)
                            logDebug(roleRemovalTransactionid,roleRemovalEndpointName,"DeleteRequest","the the deleteResponse::"+JSON.stringify(response))

                            //logger.error("the the deleteResponse::"+JSON.stringify(response))
                            if(response && response.responseCode == "0"){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:0,
                                    messageResponses:[{
                                        messageCode:"000",
                                        messageDescription:"Success"
                                    }]
                                }
                            }else{
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:1,
                                    messageResponses:[{
                                        messageCode:"999",
                                        messageDescription:"An Unknown error has occurred. Please try again later."
                                    }]
                                }
                            }
                        }catch(error){
                            return {
                                transactionId:requestInput.transactionId,
                                responseStatus:1,
                                messageResponses:[{
                                    messageCode:error.message.code?error.message.code:"999",
                                    messageDescription:error.message.content?error.message.content:"An Unknown error has occurred. Please try again later."
                                }]
                            }
                        }
                    } else{
                        logger.error("ExternalRoleRemoval: Missing Parameters")
                        return {
                            transactionId:requestInput.transactionId,
                            responseStatus:1,
                            messageResponses:[{
                                messageCode:error.message.code?error.message.code:"999",
                                messageDescription:error.message.content?error.message.content:"An Unknown error has occurred. Please try again later."
                            }]
                        }
                    }
                }catch(error){
                    logger.error("ExternalRoleRemoval: Role Removal Failure: " + JSON.stringify(error))
                    return {
                        transactionId:requestInput.transactionId,
                        responseStatus:1,
                        messageResponses:[{
                            messageCode:error.message.code?error.message.code:"999",
                            messageDescription:error.message.content?error.message.content:error.message
                        }]
                    }
                }
           
           case REQUEST_GET:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                break
           
            case REQUEST_UPDATE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break
            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break
            case REQUEST_DELETE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break
        
       }
    }catch(error){
        /* Log exception */
        logException(input.transactionId,error)
        /* Check if the error is caught exception */
        if(error && JSON.parse(error.message).code == "2"){
            /* generate error response */
            return generateResponse(error.type,input.transactionId, error.message)
        }else{
            return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
    }
   
  }())

/**
 * @name {generateResponse}
 * @description Method generates response.
 * 
 * @param {String} responseCode 
 * @param {JSON} message 
 * @param {JSON} payload 
 * @returns 
 */
function generateResponse(responseCode,transactionId, message,payload){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"UNERROR",
        message:"An unexpected error occured while processing the request."
    }
        
    if(payload){
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:message,
            payload:payload
        }
    }else if(message){
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:message
        }
    }else{
        return {
            responseCode:responseCode,
            transactionId:transactionId,
            message:{
                code:"KYID-IRE",
                message:EXCEPTION_UNEXPECTED_ERROR.content
            }
        }
    }
    
}
/**
 * @name logException
 * This function logs exception.
 *
 * @param {JSON} exception
 */
function logException(transactionId, exception) {

    logger.error(JSON.stringify({
        transactionId:transactionId,
        kyidException:exception
    }))

}
/**
 * @name searchObjectByIdAttributeValue
 * @description Method searches object based on the Id attribute and value.
 * 
 * @param {JSON} input 
 * @param {String} resource 
 * @param {String} attribute 
 * @param {String} value 
 * @returns 
 */
function searchObjectByIdAttributeValue(transactionId,_ENDPOINT_NAME,resource,attribute,value){
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": "KYID-EUE",
            "content":""
        },
        "logger":`${_ENDPOINT_NAME}/searchObjectByIdAttributeValue`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": "KYID-IRE",
            "content":""
        },
        "logger":`${_ENDPOINT_NAME}/searchObjectByIdAttributeValue`,
        "timestamp":""
    }
    try{

        logDebug(transactionId,_ENDPOINT_NAME,"searchObjectByAttributeValue",`Input parameter: Resource: ${resource}, Attribute: ${attribute} Value:${value}`)
        const filter = {
            _queryFilter:`${attribute} eq '${value}'`
        }
        const response =  openidm.query(resource,filter,["*"])     
        
        if(response && response.result){
            if(response.result.length == 1){
                const objectRecord = response.result[0]
                return objectRecord
            } else if(response.result.length == 0){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request contains id attribute which is NOT returning any entries. Id Attribute : ${attribute}`
                invalidRequestException.timestamp = new Date().toISOString()
        
             throwException(invalidRequestException)
            } else{
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request contains id attribute which is returning multiple entries. Id Attribute : ${attribute}`
                invalidRequestException.timestamp = new Date().toISOString()
            
               throwException(invalidRequestException)
            }

        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request contains id attribute which is NOT returning any entries. Id Attribute : ${attribute}`
            invalidRequestException.timestamp = new Date().toISOString()
        
             throwException(invalidRequestException)
        }
    }catch(error){
        
        if(error && error.code == "2"){
            throwException(error.message)
        }else{
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

             throwException(unexpectedException)
        }
    }
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
/**
 * @name throwException
 * @description Method throws exception.
 * 
 * @param {JSON} exception 
 * @throws {Exception} Throws exception
 */
function throwException(exception){
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"UNERROR",
        message:"An unexpected error occured while processing the request."
    };
    if(exception){
        throw {code:400, message: exception}
    }else{
        throw {code:400, message: JSON.stringify(EXCEPTION_UNEXPECTED_ERROR)}
    }
}

function searchObjectByQuery(input, objectName, queryFilter) {
    try {
        if (!queryFilter) {
            logger.error("searchObjectByQuery :: Missing queryFilter");
            return null;
        }

        
        let result = openidm.query(objectName, { "_queryFilter": queryFilter });

        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            logger.error("searchObjectByQuery :: No object found in " + objectName +
                         " where " + queryFilter);
            return null;
        }
    } catch (e) {
        logger.error("searchObjectByQuery :: Exception - " + e);
        return null;
    }
}

/**
 * @name logDebug
 * This function logs information.
 *
 * @param {string} transactionId
 * @param {string} endpointName
 * @param {string} functionName
 * @param {JSON} exception
 */
function logDebug(transactionId,endpointName,functionName,message) {
    logger.error(JSON.stringify({
        "transactionId":transactionId,
        "endpointName":endpointName,
        "functionName":functionName,
        "message":message
    }))
}

function searchObjectByQuery(input, objectName, queryFilter) {
    try {
        if (!queryFilter) {
            logger.error("searchObjectByQuery :: Missing queryFilter");
            return null;
        }

        
        let result = openidm.query(objectName, { "_queryFilter": queryFilter });

        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            logger.error("searchObjectByQuery :: No object found in " + objectName +
                         " where " + queryFilter);
            return null;
        }
    } catch (e) {
        logger.error("searchObjectByQuery :: Exception - " + e);
        return null;
    }
}