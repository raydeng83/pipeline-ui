/**
* @name [@endpointname]
* @description [@description]
*
* @param {request} request - This is the request object contains the following
* resourceName - The name of the resource, without the endpoint/ prefix.
* newResourceId - The identifier of the new object, available as the results of a create request.
* revision - The revision of the object.
* parameters - Any additional parameters provided in the request. 
* content - Content based on the latest revision of the object, using getobject.
* context - The context of the request, including headers and security. For more information, refer to Request context chain.
* Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. 
* Query parameters - The queryId and queryFilter parameters are specific to query methods. 
*
* @date [@date]
* @author {<authorname>@deloitte.com}
*/


const _ = require('lib/lodash')
const isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")

function getException(e) {
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message
  } else if (_.has(e, 'message')) {
    return e.message
  } else {
    return e
  }
}

function logErrorDetails(code,message,detail){
  
  let errorJSONResponse = {}
  errorJSONResponse["code"] = code
  errorJSONResponse["message"] = message
  errorJSONResponse["detail"] = detail

  return errorJSONResponse;
}


(function () {

  try{
    if(isEndpointExecutionAllowed === "true"){
      if (request.method === 'create') {
         // POST    
         let response = {}
         const payload = request.content.payload;
         const action = request.content.action
         if(action === 2){  //Get
            return getUserProfile(payload)
         }
       
        } else if (request.method === 'read') {
          // GET
          return {};
        } else if (request.method === 'update') {
          // PUT
          return {};
        } else if (request.method === 'patch') {
          return {};
        } else if (request.method === 'delete') {
          return {};
        }
        throw logErrorDetails(500,'Unknown_Exception_Occurred')
    
      } else {
        logger.error("Endpoint LIB-UserProfileAPI execution is not allowed")
        return logErrorDetails(-1,'Endpoint_Execution_Not_Allowed','')
      }
    
    } catch(error){
      //Return error response
       return logErrorDetails(500,'Unknown_Exception_Occurred',error)
    }
  }());



function getUserProfile(apiRequestPayload) {
  
  let userProfileResponse = null
  let userAuthenticators = null
  
  try {
      /**
        status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
        recordState(State of Record) | ACTIVE, DELETED
      */
      // userProfileResponse = openidm.query("managed/alpha_user/", { "_queryFilter": '/_id/ eq "' + apiRequestPayload.requestedUserAccountId + '"'},["*"])
      let response = {
        user:null,
        authenticators:null
      }
      logger.error("getUserProfile payload is "+ JSON.stringify(apiRequestPayload));
      userProfileResponse = openidm.query("managed/alpha_user/", { "_queryFilter": '/_id/ eq "' + apiRequestPayload.requestedUserAccountId + '"' + ' AND accountStatus eq "' + "active" + '"' }, ["*"])
      logger.error("userProfileResponse is --> "+ userProfileResponse)
      if(userProfileResponse && userProfileResponse.resultCount>0){
        response.user = userProfileResponse
        if(userProfileResponse.result[0].userName && userProfileResponse.result[0].userName !== null){
          userAuthenticators = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": '/KOGId/ eq "' + userProfileResponse.result[0].userName + '"' + ' AND MFAStatus eq "' + "ACTIVE" + '"' }, ["*"])
          if(userAuthenticators && userAuthenticators.resultCount>0){
            response.authenticators = userAuthenticators
          }
        }
     return response
      }
    else {
      return response
    }
    
      

  } catch (error) {
     return logErrorDetails(500,'Unknown_Exception_Occurred',error)
  }
  
}


