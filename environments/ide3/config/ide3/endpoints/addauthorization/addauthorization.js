  (function () {

    const validateEndptRequestBody = {
        "payload": context,
        "action": 0
    }
  
    try {
        let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
        logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
        if(res.status === 200){
          logger.error("Continue executing endpoint...")
        } else {
          return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }
    
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
    
    const ENDPOINT_NAME = 'addauthorization'
    const INVITATION_ENDPOINT_NAME = 'endpoint/invitation_draftV3'
    
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

    try{
       switch (request.method) {

           case REQUEST_POST:
           
                let authRequests = []
                //let authRequest = {}
                let accessSearchQuery = ""
                /* Get request content */
                const requestContent = request.content
                
                
                try{
                    
                    if( requestContent.userIdentifier && 
                        requestContent.requestorUserIdentifier && 
                        requestContent.authorizations
                    ){
                        const requestInput = {
                            transactionId:requestContent.transactionId,
                            userIdentifier:requestContent.userIdentifier,
                            requestorUserIdentifier:requestContent.requestorUserIdentifier,
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
                           
                            requestedUserResponse?accessSearchQuery = accessSearchQuery.concat(`userIdentifier eq '${requestedUserResponse._id}'`):''
                            
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
                        for (let auth of requestInput.authorizations){
                           let authRequest = {}
                          let isInternalRole = false; 
                            authRequest.businessAppIdAttribute = "name"
                            authRequest.businessAppIdAttributeValue = auth.applicationName
                            
                            businessApplicationResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_APPLICATION,authRequest.businessAppIdAttribute, authRequest.businessAppIdAttributeValue)
                            logger.error("the businessApplicationResponse"+ businessApplicationResponse._id)
                            businessApplicationResponse?accessSearchQuery = accessSearchQuery.concat(` AND appIdentifier eq '${businessApplicationResponse._id}'`):''
                            
                            if(!businessApplicationResponse){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:1,
                                    messageResponses:[{
                                        messageCode:"-140",
                                        messageDescription:`Application '${authRequest.businessAppIdAttribute}' is not valid`
                                    }]
                                }
                            }
                            
                            authRequest.roleIdAttribute = "name"
                            authRequest.roleIdAttributeValue = auth.roleName
                            
                          //appRoleResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_ROLE,authRequest.roleIdAttributeName, authRequest.roleAttributeValue)
                          //let query = `${value.roleIdAttribute} eq "${value.roleIdAttributeValue}" and businessAppId/_refResourceId eq "${businessInfo._id}"`;
                          let query = 'name eq "' + auth.roleName + '" and businessAppId/_refResourceId eq "' + businessApplicationResponse._id + '"';
                          let appRoleResponse = searchObjectByQuery(input, "managed/alpha_role", query)
                          logger.error("the appRoleResponse"+ appRoleResponse._id)
                            appRoleResponse?accessSearchQuery = accessSearchQuery.concat(` AND roleIdentifier eq '${appRoleResponse._id}'`):''
                            
                            if(!appRoleResponse){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:1,
                                    messageResponses:[{
                                        messageCode:"-150",
                                        messageDescription:`Role '${authRequest.businessApplicationIdAttributeName}' is not valid`
                                    }]
                                }
                            }

                          //check the user requests for internal role i.e enrollment requesteeType === 2
                           if (appRoleResponse.accessPolicy && appRoleResponse.accessPolicy._refResourceId) {
                            let accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + appRoleResponse.accessPolicy._refResourceId);
                        
                            if (accessPolicy && accessPolicy.enrollmentRequestSetting && Array.isArray(accessPolicy.enrollmentRequestSetting)) {
                                for (let enrollmentSetting of accessPolicy.enrollmentRequestSetting) {
                                    if (enrollmentSetting.allowedRequesteeType === '2') {
                                        logger.error(`Skipping role '${auth.roleName}' because allowedRequesteeType is 2 (internal)`);
                                        isInternalRole = true; // mark role as internal
                                        break; // stop checking settings
                                    }
                                }
                            }
                        }


                          
                            if(auth.originalDelegatorUserIdentifier){
                              logger.error("the originalDelegatorUserIdentifier")
                          
                                if(auth.originalDelegatorUserIdentifier.kyidUniqueId){
                                    authRequest.originalDelegatorUserIdAttributeName = "_id"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.kyidUniqueId
                                }else if(auth.originalDelegatorUserIdentifier.kogId){
                                    authRequest.originalDelegatorUserIdAttributeName = "userName"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.kogId
                                }else if(auth.originalDelegatorUserIdentifier.upn){
                                    authRequest.originalDelegatorUserIdAttributeName = "frindexstring1"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.upn
                                }else if (auth.originalDelegatorUserIdentifier.emailAddress){
                                    authRequest.originalDelegatorUserIdAttributeName = "mail"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.emailAddress
                                }else if (auth.originalDelegatorUserIdentifier.logon){
                                    authRequest.originalDelegatorUserIdAttributeName = "frindexstring1"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.logon
                                }else if (auth.originalDelegatorUserIdentifier.employeeId){
                                    //authRequest.originalDelegatorUserIdAttributeName = "mail"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.employeeId
                                }else if (auth.originalDelegatorUserIdentifier.windowsAccountName){
                                    authRequest.originalDelegatorUserIdAttributeName = "custom_windowsAccountName"
                                    authRequest.originalDelegatorUserAttributeValue = auth.originalDelegatorUserIdentifier.windowsAccountName
                                }
                              
                                
                                originalDelegatorUserResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_USER,authRequest.originalDelegatorUserIdAttributeName, authRequest.originalDelegatorUserAttributeValue)
                                originalDelegatorUserResponse?accessSearchQuery = accessSearchQuery.concat(` AND originalDelegatorIdentifier eq '${originalDelegatorUserResponse._id}'`):''
                               
                                if(!originalDelegatorUserResponse){
                                    return {
                                        transactionId:requestInput.transactionId,
                                        responseStatus:1,
                                        messageResponses:[{
                                            messageCode:"-160",
                                            messageDescription:`Original delegator user '${authRequest.originalDelegatorUserIdAttributeName}' is not valid`
                                        }]
                                    }
                                }
                            }
                            
                            /* Check if the current delegator identifier */
                            if(auth.currentDelegatorUserIdentifier){
                                if(auth.currentDelegatorUserIdentifier.kyidUniqueId){
                                    authRequest.currentDelegatorUserIdentifier = "_id"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.kyidUniqueId
                                }else if(auth.currentDelegatorUserIdentifier.kogId){
                                    authRequest.currentDelegatorUserIdentifier = "userName"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.kogId
                                }else if(auth.currentDelegatorUserIdentifier.upn){
                                    authRequest.currentDelegatorUserIdentifier = "frindexstring1"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.upn
                                }else if (auth.currentDelegatorUserIdentifier.emailAddress){
                                    authRequest.currentDelegatorUserIdentifier = "mail"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.emailAddress
                                }else if (auth.currentDelegatorUserIdentifier.logon){
                                    authRequest.currentDelegatorUserIdentifier = "frindexstring1"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.logon
                                }else if (auth.currentDelegatorUserIdentifier.employeeId){
                                    //authRequest.currentDelegatorUserIdentifier = "mail"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.employeeId
                                }else if (auth.currentDelegatorUserIdentifier.windowsAccountName){
                                    authRequest.currentDelegatorUserIdentifier = "custom_windowsAccountName"
                                    authRequest.currentDelegatorUserAttributeValue = auth.currentDelegatorUserIdentifier.windowsAccountName
                                }
                                
                                currentDelegatorUserResponse =  searchObjectByIdAttributeValue(requestInput.transactionId,ENDPOINT_NAME,_MO_USER,authRequest.currentDelegatorUserIdentifier, authRequest.currentDelegatorUserAttributeValue)
                                currentDelegatorUserResponse?accessSearchQuery = accessSearchQuery.concat(` AND currentDelegatorIdentifier eq '${currentDelegatorUserResponse[0]._id}'`):'' 
                                
                                if(!currentDelegatorUserResponse){
                                    return {
                                        transactionId:requestInput.transactionId,
                                        responseStatus:1,
                                        messageResponses:[{
                                            messageCode:"-170",
                                            messageDescription:`Current delegator user '${authRequest.currentDelegatorUserIdentifier}' is not valid`
                                        }]
                                    }
                                }
                            }
                           

                            auth.expirationDateTime?authRequest.expiryDate = auth.expirationDateTime:null
                           
                            auth.isForwardDelegable?authRequest.isForwardDelegable = auth.isForwardDelegable:null
                            if(auth.isForwardDelegable && (currentDelegatorUserResponse.result.length == 0 || (originalDelegatorUserResponse.result.length == 0))){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:1,
                                    messageResponses:[{
                                        messageCode:"-171",
                                        messageDescription:`Original and/or current delegator user information is missing for the forwardward delegable response.`
                                    }]
                                }
                            }
                            //auth.KOGOrgID?authRequest.KOGOrgId = auth.KOGOrgID:null
                            auth.orgName?authRequest.orgName = auth.orgName:null
                            auth.orgTypeName?authRequest.orgType = auth.orgTypeName:null
                            auth.orgSourceUniqueId?authRequest.sourceUniqueId = auth.orgSourceUniqueId:null
                            auth.businessKeyType?authRequest.businessKeyTypeName = auth.businessKeyType:null
                            auth.businessKeyId?authRequest.businessKeyName = auth.businessKeyId:null
                            auth.businessKeyValue?authRequest.businessKeyValue = auth.businessKeyValue:null
                            auth.businessKeyDescription?authRequest.businessKeyDescription = auth.BusinessKeyDescription:null

                            auth.orgName?accessSearchQuery = accessSearchQuery.concat(` AND orgName eq '${authRequest.orgName}'`):'' 
                            auth.businessKeyId?accessSearchQuery = accessSearchQuery.concat(`AND businessKeyName eq '${businessKeyId}'`):''
                            if(auth.businessKeyId && !(auth.orgName)){
                                    return {
                                        transactionId:requestInput.transactionId,
                                        responseStatus:1,
                                        messageResponses:[{
                                            messageCode:"-180",
                                            messageDescription:`Organization information is missing for business key id '${auth.businessKeyId }'`
                                        }]
                                    }
                            }
                           
                            //authRequests.push(authRequest)
                          if (!isInternalRole) {
                            authRequests.push(authRequest)
                        } else {
                            logger.error(`Role '${auth.roleName}' is internal. Not adding to access request.`);
                        }

                        }

                        /* Create Request */
                       const createRequest = {
                                payload: {
                                    requestedUser: {
                                        "_id": requestedUserResponse._id,
                                        "firstName": requestedUserResponse.givenName,
                                        "lastName": requestedUserResponse.sn,
                                        "email": requestedUserResponse.mail
                                    },
                                    requesterAccountId: requesterUserResponse._id,
                                    access: authRequests
                                },
                                action: 1

                        };
                        logger.error("addauthorization endpoint - createRequest built successfully. AuthRequests count: " + authRequests.length);
                        logger.error("addauthorization endpoint - requestedUser ID: " + requestedUserResponse._id);
                        logger.error("addauthorization endpoint - requesterAccountId: " + requesterUserResponse._id);
                        try{

                          if (authRequests.length === 0) {
                            logger.error("addauthorization endpoint - ERROR: authRequests.length is 0, returning Role Provisioning Failed");
                                return {
                                    transactionId: requestInput.transactionId,
                                    responseStatus: 1,
                                    messageResponses: [{
                                        messageCode: "KYID-EUE",
                                        messageDescription: "Role Provisioning Failed"
                                    }]
                                }
                            }

                          //Check if any requested role already exists
                           for (let authReq of authRequests) {
                            // Fetch business application for each authReq
                            let businessApp = searchObjectByIdAttributeValue(requestInput.transactionId, ENDPOINT_NAME, _MO_APPLICATION, "name", authReq.businessAppIdAttributeValue);
                            // Fetch role for each authReq
                            let roleQuery = 'name eq "' + authReq.roleIdAttributeValue + '" and businessAppId/_refResourceId eq "' + businessApp._id + '"';
                            let roleObj = searchObjectByQuery(input, "managed/alpha_role", roleQuery);
                        
                            let queryFilter =
                                'userIdentifier eq "' + requestedUserResponse._id + '" and ' +
                                'appIdentifier eq "' + businessApp._id + '" and ' +
                                'roleIdentifier eq "' + roleObj._id + '" and ' +
                                '(recordState eq "0" or recordState eq "ACTIVE")';
                        
                            let existingAccess = openidm.query("managed/alpha_kyid_access", { "_queryFilter": queryFilter }, ["_id"]);
                        
                            if (existingAccess && existingAccess.result.length > 0) {
                                logger.error(
                                    "addauthorization endpoint - Access MO already exists, skipping creation for user access " +
                                    requestedUserResponse._id +
                                    ", app " + authReq.businessAppIdAttributeValue +
                                    ", role " + authReq.roleIdAttributeValue +
                                    " | access id: " + existingAccess.result[0]._id
                                );
                        
                                return {
                                    transactionId: requestInput.transactionId,
                                    responseStatus: 1,
                                    messageResponses: [{
                                        messageCode: "KYID-EUE",
                                        messageDescription: "User already has one or more of the requested roles."
                                    }]
                                };
                            }
                        }
                            //logger.error("addauthorization endpoint - About to call invitation_draftV3 with payload: " + JSON.stringify(createRequest));
                            logger.error("addauthorization endpoint - Raw response from invitation_draftV3: " + JSON.stringify(response));
                            logger.error("the response in addauthorization endpoint::"+response)
                            /* call access endpoint to create access request. */
                            const response =  openidm.create(INVITATION_ENDPOINT_NAME, null, createRequest)

                          logger.error("the response in addauthorization endpoint::"+response)
                           
                            if(response && response.responseCode == "0"){
                                return {
                                    transactionId:requestInput.transactionId,
                                    responseStatus:0,
                                    messageResponses:[{
                                        messageCode:"000",
                                        messageDescription:"Success"
                                    }]
                                }
                            } else if (response && response.message && response.message.content === "Role Provisioning Failed") {
                              return {
                                transactionId: requestInput.transactionId,
                                responseStatus: 1,
                                messageResponses: [{
                                    messageCode: "KYID-EUE",
                                    messageDescription: "Role Provisioning Failed"
                                }]
                            };
                            } else if (response && response.message && response.message.content === "Roles conflict - mutually exclusive roles cannot be requested together") {
                            return {
                                transactionId: requestInput.transactionId,
                                responseStatus: 1,
                                messageResponses: [{
                                    messageCode: "KYID-EUE",
                                    messageDescription: "Roles conflict - mutually exclusive roles cannot be requested together"
                                }]
                            };
                            }
                            else{
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
                            logger.error("addauthorization endpoint - EXCEPTION caught in invitation_draftV3 call: " + JSON.stringify(error));
                            logger.error("addauthorization endpoint - Error message: " + (error.message || error));
                            logger.error("addauthorization endpoint - Error stack: " + (error.stack || "No stack trace"));
                            return {
                                transactionId:requestInput.transactionId,
                                responseStatus:1,
                                messageResponses:[{
                                    messageCode:error.message.code?error.message.code:"999",
                                    messageDescription:error.message.content?error.message.content:"An Unknown error has occurred. Please try again later."
                                }]
                            }
                        }
                    }else{
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
            } else if (response.result.length == 0){
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request contains id attribute which is NOT returning any entries. Id Attribute : ${attribute}`
            invalidRequestException.timestamp = new Date().toISOString()
        
            throwException(invalidRequestException)
          }  else{
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