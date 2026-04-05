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
          // POST
         let response = {}
         const payload = request.content.payload;
         const action = request.content.action
         if(action === 2){  //Get
            response = getPrereqType(payload)
         }
       
         return response
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
        logger.error("Endpoint LIB-PrerequisiteTypeAPI execution is not allowed")
        return logErrorDetails(-1,'Endpoint_Execution_Not_Allowed','')
      }
    
    } catch(error){
      //Return error response
       return logErrorDetails(500,'Unknown_Exception_Occurred',error)
    }
  }());



function getPrereqType(apiRequestPayload) {
  
  let prereqTypeResponse = null
  let response = null
  let found = false
  const status = "ACTIVE"
  
  try {
      /**
        status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
        recordState(State of Record) | ACTIVE, DELETED
      */
      logger.error("apiRequestPayload in getPrereqType is - "+JSON.stringify(apiRequestPayload))
      prereqTypeResponse = openidm.query("managed/alpha_kyid_enrollment_prerequisite_type/", { "_queryFilter": '/_id/ eq "' + apiRequestPayload.preReqTypeId + '"'
        +' AND recordState eq "'+status+'"'},["*"])
      logger.error("Prereq Type Response is - "+JSON.stringify(prereqTypeResponse))
    
      if(prereqTypeResponse && prereqTypeResponse !== null  && prereqTypeResponse.resultCount>0){
          logger.error("prereqTypeResponse.result.length is - "+prereqTypeResponse.result.length)
          logger.error("prereqTypeResponse.result is - "+prereqTypeResponse.result[0])
          let pagesArray = prereqTypeResponse.result[0].pages
          logger.error("pagesArray length is - "+pagesArray.length)
        
          for(let i=0; i<pagesArray.length; i++){
            response = null
            response = pagesArray[i]
            logger.error("page "+(i+1)+ " is - "+JSON.stringify(response))
            logger.error("response.pageNumber  "+i+ " is - "+response.pageNumber)
            
            if(response.pageNumber == Number(apiRequestPayload.pageNumber)){
              logger.error("Found page")
              found = true
              break
            }           
          }  
      }
        
      if(found === true)  {
        return response
      } else {
        return logErrorDetails(-5,'Page_Not_Found','')
      }

  } catch (error) {
     return logErrorDetails(500,'Unknown_Exception_Occurred',error)
  }
  
}


