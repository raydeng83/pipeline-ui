
const requestDetail = ()=>{
  let detail = {}
  detail.timestamp = context.requestAudit.receivedTime 
  detail.transactionId = context.transactionId.id
  detail.endpoint = context.parent.matchedUri
  return detail
}

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

    const apiRequestPayload = request.content.payload
    const apiRequestAction = request.content.action
    logger.error("apiRequestPayload is - "+JSON.stringify(apiRequestPayload))
    logger.error("apiRequestAction is - "+apiRequestAction)
    
    if (request.method === 'create') {
      // POST
      if(apiRequestAction === 1){   
        try{
          return invokeAssignRoleToUserAPI(apiRequestPayload)
        } catch(error){
          logger.error("Exception is - "+getException(error))
          throw error
        }
      
      }  else {
        throw { code: 500, message: 'Unknown_Action' }
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
    throw { code: 500, message: 'Unknown error' };
  }());


/**
* @name <invokeAssignRoleToUserAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeAssignRoleToUserAPI(payload){
  logger.error("Inside invokeAssignRoleToUserAPI")
  let funcName = "invokeAssignRoleToUserAPI"
  let responseAssignRoleToUserAPI = null
  let requestBody = {
    //url:"https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/assignrolestouser",
    url:identityServer.getProperty("esv.assignrolestouser.api"),
    //scope:"kogkyidapi.assignrolestouser",
    scope:identityServer.getProperty("esv.assignrolestouser.api.scope"),
    method:"POST",
    payload:payload
  }
  let apiResult = {
    code:null,
    ResponseStatus:null,
    message:null
  }
  
  try{
    logger.error("Request Body for invokeAssignRoleToUserAPI is - "+JSON.stringify(requestBody))
     var startTime = new Date();
    responseAssignRoleToUserAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    var endTime = new Date();
    var duration = endTime - startTime;
    var durationInSeconds = duration / 1000;
    logger.error("Performance time: " + durationInSeconds);
    logger.error("responseAssignRoleToUserAPI in invokeAssignRoleToUserAPI is - "+JSON.stringify(responseAssignRoleToUserAPI))
    if(responseAssignRoleToUserAPI!=null && responseAssignRoleToUserAPI){
      if(responseAssignRoleToUserAPI.response.ResponseStatus==0){
        apiResult.ResponseStatus = responseAssignRoleToUserAPI.response.ResponseStatus
        apiResult.code = responseAssignRoleToUserAPI.status
        logger.error("apiResult in invokeAssignRoleToUserAPI is - "+JSON.stringify(apiResult))
        return apiResult
        
      } else {
        apiResult.ResponseStatus = responseAssignRoleToUserAPI.response.ResponseStatus
        apiResult.message = responseAssignRoleToUserAPI.response.MessageResponses
        apiResult.code = responseAssignRoleToUserAPI.status
        logger.error("apiResult in invokeAssignRoleToUserAPI is - "+JSON.stringify(apiResult))
        throw apiResult
      }
    }
    //logger.error("apiResult in invokeAssignRoleToUserAPI is - "+JSON.stringify(apiResult))
    //return apiResult
    
  } catch(error){
    logger.error("Exception in endpoint kogapis/"+funcName+" is - " + getException(error))
    let detail = requestDetail()
    detail.functionName = funcName
    detail.exception = getException(error)
    throw { code: 500, message: 'Exception in endpoint kogapis/'+funcName, detail: detail}
  }
}



/**
* @name <getException>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
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

