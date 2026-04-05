
const requestDetail = ()=>{
  let detail = {}
  detail.timestamp = context.requestAudit.receivedTime 
  detail.transactionId = context.transactionId.id
  detail.endpoint = context.parent.matchedUri
  return detail
}

(function () {

    const apiRequestPayload = request.content
    //const apiRequestAction = request.content.action
 // logger.error("PA--request is - "+request.content)
    logger.error("PA--apiRequestPayload is - "+JSON.stringify(apiRequestPayload))
    //logger.error("apiRequestAction is - "+apiRequestAction)
    
    if (request.method === 'create') {
      // POST
 
        try{
          return invokeSendAuditLogstoDB(apiRequestPayload)
        } catch(error){
          logger.error("PA--Exception is - "+getException(error))
          throw error
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
function invokeSendAuditLogstoDB(payload){
  logger.error("PA--Inside invokeSendAuditLogstoDB")
  let funcName = "invokeSendAuditLogstoDB"
  let responseSendAuditLogstoDB = null
  // let requestBody = {
  //   url:identityServer.getProperty("esv.kyid.sih.auditlogsdb"),
  //   method:"POST",
  //   payload:payload
  // }
  let requestBody = {
    url:identityServer.getProperty("esv.kyid.sih.auditlogsdb"),
    method:"POST",
    payload:payload
  }
  let apiResult = {
    code:null,
    ResponseStatus:null,
    message:null
  }

  
  try{
    logger.error("Request Body for invokeSendAuditLogstoDB is - "+JSON.stringify(requestBody))
     var startTime = new Date();
   // responseSendAuditLogstoDB = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    responseSendAuditLogstoDB = openidm.create("endpoint/invokeCertAPILogs", null, requestBody)
    var endTime = new Date();
    var duration = endTime - startTime;
    var durationInSeconds = duration / 1000;
    logger.error("PA--Performance time: " + durationInSeconds);
    logger.error("PA--responseSendAuditLogstoDB in invokeSendAuditLogstoDB is - "+JSON.stringify(responseSendAuditLogstoDB))
    if(responseSendAuditLogstoDB!=null && responseSendAuditLogstoDB){
        logger.error("PA--apiResult in invokeSendAuditLogstoDB is - "+JSON.stringify(responseSendAuditLogstoDB))
       apiResult.ResponseStatus = responseSendAuditLogstoDB.response.message
        apiResult.code = responseSendAuditLogstoDB.status
        return apiResult

    }

  } catch(error){
    logger.error("PA--Exception in endpoint sendAuditLogstoDB/"+funcName+" is - " + getException(error))
    let detail = requestDetail()
    detail.functionName = funcName
    detail.exception = getException(error)
    throw { code: 500, message: 'Exception in endpoint sendAuditLogstoDB/'+funcName, detail: detail}
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

