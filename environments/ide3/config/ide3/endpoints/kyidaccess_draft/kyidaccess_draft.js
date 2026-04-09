/**
 * @name [@endpointname]
 * @description [@description]
 * 
 * @param {request} request - The request object contains the following - 
 *      resourceName - The name of the resource, without the endpoint/ prefix.
 *      newResourceId - The identifier of the new object, available as the results of a create request.
 *      revision - The revision of the object.
 *      parameters - Any additional parameters provided in the request. The sample code returns request parameters from an HTTP GET with ?param=x, as "parameters":{"param":"x"}.
 *      content - Content based on the latest revision of the object, using getObject.
 *      context - The context of the request, including headers and security. For more information, refer to Request context chain.
 *      Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. For more information refer to Page Query Results.
 *      Query parameters - The queryId and queryFilter parameters are specific to query methods. For more information refer to Construct Queries.
 *
 * @date  [@date]
 * @author ampatil@deloitte.com
 */

(function () {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-UNR",
        content:"An unexpected error occured while processing the request."
    }

    const EXCEPTION_UNSUPPORTED_OPERATION = {
        code:"KYID-USO",
        content:""
    }
  
    const SUCCESS_MESSAGE = {
      code:"KYID-SUS",
      content: "Success"
    }

    const RESPONSE_CODE_ERROR = "2"
    const RESPONSE_CODE_FAILURE = "1"
    const RESPONSE_CODE_SUCCESS = "0"

    const REQUEST_POST = "create"
    const REQUEST_GET = "read"
    const REQUEST_UPDATE = "update"
    const REQUEST_PATCH = "patch"
    const REQUEST_DELETE = "delete"
    
    const ACTION_CREATE = "1"
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"

    const ENDPOINT_NAME = "endpoint/accessapi_draft"
    const MO_OBJECT_NAME = "managed/alpha_kyid_access/"

    
    /* Object properties */
    const OBJECT_PROPERTIES = {
        
        "appIdentifier": null,
        "userIdentifier": null,
        "roleIdentifier": null,
        
        "app": null,
        "user": null,
        "role": null,
        
        "originalDelegatorIdentifier": null,
        "currentDelegatorIdentifier": null,
        "currentDelegator": null,
        "originalDelegator": null,
        "isForwardDelegable": false,
        
        "assignmentDate": null,
        "assignmentDateEpoch": null,
        
        "recordState": "0",
        "recordSource": "1",
        "createDate": null,
        "createDateEpoch": null,
        "updateDate": null,
        "updateDateEpoch": null,
        "createdBy": null,
        "updatedBy": null,
    }

    /* Input */
    const input = {
        "_ENDPOINT_NAME":ENDPOINT_NAME,
        "_MO_OBJECT_NAME":MO_OBJECT_NAME,
        "_PROPERTIES":OBJECT_PROPERTIES,
        "transactionId":"349834038398340",
        "payload":{}
    }

    let response = null

    try {
        switch (request.method) {
        
            case REQUEST_POST:
                /* Get request content */
                const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
                const action = requestContent.action
                
                /* Create action */
                if(action == ACTION_CREATE){
                    input.payload = requestContent.payload
                    /* Create access record. */
                    //response = createAccess(input)
                }else if(action == ACTION_SEARCH){
                    input.payload = requestContent.payload
                    /* Search access records. */
                    const result = searchAccess(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                        result: result
                    })
                }else if(action == ACTION_DELETE){
                    input.payload = requestContent.payload
                    /* Search access records. */
                    response = searchAccess(input)
                }
                break;
            case REQUEST_GET:
                
                break;
            case REQUEST_UPDATE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
            case REQUEST_DELETE:
                
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)
                
                break;
        
            default:
                break;
        }
        return response
    }catch(error){

        logException(error)
        
        if(error && error.type){
            /* generate error response */
            return generateResponse(error.type,input.transactionId, error.message)
        }else{
            return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
    }
    
}())

/**
 * @name searchAccess
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchAccess(input){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchAccess`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchAccess`,
        "timestamp":""
    }

    try{
        logDebug(input.transactionId,input.endPoint,"searchAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
      
        /* Check if  */
        if(input.payload){
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            const isUniqueResponseByRole = input.payload.isUniqueResponseByRole

            if(input._MO_OBJECT_NAME && queryFilter){
                logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`, 
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if(searchResponse){
                    logDebug(input.transactionId,input.endPoint,"searchAccount",`Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                   
                        let uniqueItems = []
                        const accessResult =[]
                        let businessApp = null
                        let localizedContent
                  
                        /* Iterate through search response*/
                        if(searchResponse.result){
                            if(isUniqueResponseByApp || isUniqueResponseByUser || isUniqueResponseByRole){
                                /* Iterate through the result */  
                                searchResponse.result.forEach(access=>{
                                          /* Filter records to get unique entries by app*/ 
                                          if(isUniqueResponseByApp){
                                                if(access.app && uniqueItems.includes(access.app.name)){
                                                }else{
                                                    accessResult.push(access)
                                                    if(access.app && access.app.content && access.app.content.length>0){
                                                        localizedContent = access.app.content
                                                        access.app.title = localizedContent[0].title
                                                        access.app.content = localizedContent[0].content
                                                    }
                                                    uniqueItems.push(access.app.name)
                                                }
                                          /* Filter records to get unique entries by app*/ 
                                          }else if(isUniqueResponseByUser){
                                                
                                                if(access.user && uniqueItems.includes(access.user.mail)){
                                                }else{
                                                    accessResult.push(access)
                                                    if(access.app && access.app.content && access.app.content.length>0){
                                                        localizedContent = access.app.content
                                                        access.app.name = localizedContent[0].title
                                                        access.app.description = localizedContent[0].content
                                                    }
                                                    uniqueItems.push(access.user.mail)
                                                }
                                          /* Filter records to get unique entries by role */ 
                                          }else if(isUniqueResponseByRole){
                                              if(access.role && uniqueItems.includes(access.role.name)){
                                              }else{
                                                  accessResult.push(access)
                                                  if(access.role && access.role.content && access.role.content.length>0){
                                                      localizedContent = access.role.content
                                                      access.role.name = localizedContent[0].name
                                                      access.role.description = localizedContent[0].description
                                                  }
                                                  uniqueItems.push(access.role.name)
                                              }
                                          }
                                  })
                            }
                            
                          if(accessResult && accessResult.length>0){
                                searchResponse.result = accessResult
                          }
                          return searchResponse.result  
                        }else{
                            return []
                        }
                    
                }else{
                    return []
                }
            }else{
                
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()
               
                throw invalidRequestException
            }
            
        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }
    
}

/**
 * @name patchAccess
 * @description Methods patches access.
 * 
 * @param {JSON} input 
 */
function patchAccess(input){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${endpoint}/patchAccess`,
        "timestamp":""
    }

    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${endpoint}/patchAccess`,
        "timestamp":""
    }

    try{

        logDebug(input.transactionId,input.endPoint,"patchAccess",`Input parameter: ${JSON.stringify(input.payload)}`)
        
        const currentTimeinEpoch = Date.now()
        const currentDate = new Date().toISOString()
        
        /* Check if payload exists */
        if(input.payload){
            
            const updateFields = input.payload.updateFields
            const returnProperties = input.payload.OBJECT_PROPERTIES
            const accessId = input.payload.accessId
            
            const recordAudit = [
                {
                    "operation": "replace",
                    "field": "/updateDate",
                    "value": currentDate
                },
                {
                    "operation": "replace",
                    "field": "/updateDateEpoch",
                    "value": currentTimeinEpoch
                },
                {
                    "operation": "replace",
                    "field": "/updatedBy",
                    "value": requesterDisplayId
                }
            ]
            
            if(input._MO_OBJECT_NAME && accessId && updateFields){
                /* push the update field records */
                recordAudit.push(updateFields)
            
                /* patch object */
                const patchResponse = openidm.patch(`${input._MO_OBJECT_NAME}` + accessId, null, recordAudit,null,returnProperties);
                
                if (patchResponse) {
                    logDebug(input.transactionId,input.endPoint,"patchAccess",`Successful update on ${input._MO_OBJECT_NAME} for record id ${accessId} for fields ${JSON.stringify(recordAudit)}`)
                    return patchResponse
                }else {
                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.updateFields: ${updateFields}, input.payload.accessId: ${accessId}, input._MO_OBJECT_NAME: ${input._MO_OBJECT_NAME}"`
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw invalidRequestException
                }

            }else{
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.updateFields: ${updateFields}, input.payload.accessId: ${accessId}, input._MO_OBJECT_NAME: ${input._MO_OBJECT_NAME}"`
                invalidRequestException.timestamp = new Date().toISOString()
                throw invalidRequestException
            }
        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}

/**
 * @name deleteAccess
 * @description Methods deletes access.
 * 
 * @param {JSON} input 
 */
function deleteAccess(input){
    
    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-IRE",
        content: ""
    }
    
    const invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${endpoint}/deleteAccess`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${endpoint}/deleteAccess`,
        "timestamp":""
    }

    try{

        logDebug(input.transactionId,input.endPoint,"deleteAccess",`Input parameter: ${JSON.stringify(input.payload)}`)
        
        const originalRequest = input.payload
        
        /* Check if  */
        if(input.payload){
            const accessResult = searchAccess(input)

            input.payload.updateFields = [
                    {
                        "operation": "replace",
                        "field": "/recordState",
                        "value": "0"
                    }
                ]
            
            patchAccess(input)
        }else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }
}

/**
 * @name getRequestContent
 * @description Method returns request content.
 * 
 * @param {string} endpoint 
 * @param {string} request 
 * @returns {JSON} request content
 * @throws Exception
 */
function getRequestContent(context,request,endpoint){
    
    logDebug(context.transactionId,endpoint,"getRequestContent",`Input parameter: ${request.content}`)
    
    const EXCEPTION_INVALID_REQUEST = {
        code:"KYID-INE",
        content: ""
    }

    let invalidRequestException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content":""
        },
        "logger":`${endpoint}`,
        "timestamp":""
    }

    try{

        if(request.content){
            if(!request.content.payload){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.payload"`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
            }
            if(!request.content.action){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.action"`
                invalidRequestException.timestamp = new Date().toISOString()
                
                throw invalidRequestException
            }

            logDebug(context.transactionId,endpoint,"getRequestContent",`Response: ${request.content}`)
            return request.content

        }else{
        
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()
            
            throw invalidRequestException
        }
    }catch(error){
        throw error
    }
    
}

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
                code:EXCEPTION_UNEXPECTED_ERROR.code,
                message:EXCEPTION_UNEXPECTED_ERROR.content
            }
        }
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
    logger.info(JSON.stringify({
        "transactionId":transactionId,
        "endpointName":endpointName,
        "functionName":functionName,
        "message":message
    }))
}

/**
 * @name logException
 * This function logs exception.
 *
 * @param {JSON} exception
 */
function logException(exception) {
    logger.error(exception)
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
