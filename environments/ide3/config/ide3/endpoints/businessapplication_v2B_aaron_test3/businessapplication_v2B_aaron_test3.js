
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

    const SUCCESS_MESSAGE = {
      code:"KYID-SUS",
      content: "Success"
    }

    const RESPONSE_CODE_ERROR = "2"
    const RESPONSE_CODE_SUCCESS = "0"

    const REQUEST_POST = "create"
    const REQUEST_GET = "read"
    const REQUEST_UPDATE = "update"
    const REQUEST_PATCH = "patch"
    const REQUEST_DELETE = "delete"

    const ACTION_CREATE = "1"
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"

    const ENDPOINT_NAME = "endpoint/businessapplication_v2B_aaron_test3"
    const MO_OBJECT_NAME = "managed/alpha_kyid_businessapplication/"

    /* POC: Managed object name for role-based data authorization lookup */
    const AUTH_OBJECT_NAME = "alpha_kyid_businessapplication"

    let result = null

    /* Object properties */
    const OBJECT_PROPERTIES = {

        "name": null,
        "description": null,
        "applicationURL": null,

        "content": null,
        "kogAppId": null,
        "kogParentAppName": null,

        "adminDescription": null,
        "softLogoutURL": null,
        "applicationHelpdeskContact": null,
        "roleAppId": null,

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
        "_AUTH_OBJECT_NAME":AUTH_OBJECT_NAME,
        "_PROPERTIES":OBJECT_PROPERTIES,
        "transactionId":"349834038398340",
        "payload":{}
    }
    let viewName = null
    try {
        switch (request.method) {

            case REQUEST_POST: {
                /* Get request content */
                const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
                const action = requestContent.action

                /* Create action */
                if(action == ACTION_CREATE){
                    /* This operation is not supported by the endpoint. */
                    EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "create" is not supported for "${ENDPOINT_NAME}" endpoint.`
                    return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)


                }else if(action == ACTION_SEARCH){
                    input.payload = requestContent.payload
                    viewName = input.payload.view
                    /* Search business applications. */
                    result =  searchBusinessApplication(input)

                }else if(action == ACTION_DELETE){
                    /* This operation is not supported by the endpoint. */
                    EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${ENDPOINT_NAME}" endpoint.`
                    return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

                }
                break
            }

            case REQUEST_GET:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "Get" is not supported for "${ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_UPDATE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_DELETE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)


            default:
                break;
        }
        /* View name */
        if(viewName){
            return generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                result: getView(viewName, result, INCLUDE_CHILD_APPLICATIONS)

            })
        }else{
            return generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                result: result
            })
        }
    }catch(error){

        logException(input.transactionId,error)

        if(error && error.type){
            /* generate error response */
            return generateResponse(error.type,input.transactionId, error.message)
        }else{
            return generateResponse(RESPONSE_CODE_ERROR,input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
    }
})()

/* Configuration: Control application filtering behavior */
/* Set to false to show only apps where kogParentAppName equals app.name */
/* Set to true to include all applications */
const INCLUDE_CHILD_APPLICATIONS = false

/**
 * @name searchBusinessApplication
 * @description Method searches business application.
 *              POC: Integrates role-based data authorization filter.
 *
 * @param {JSON} input
 * @returns Array<JSON> Array of JSON access
 */
 function searchBusinessApplication(input){

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
        "logger":`${input._ENDPOINT_NAME}/searchBusinessApplication`,
        "timestamp":""
    }
    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content":""
        },
        "logger":`${input._ENDPOINT_NAME}/searchBusinessApplication`,
        "timestamp":""
    }

    try{
        logDebug(input.transactionId,input.endPoint,"searchBusinessApplication",`Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if(input.payload){
            let returnProperties = input.payload.returnProperties?input.payload.returnProperties:["*"]

            // Ensure kogParentAppName and name are always included in returnProperties
            if(Array.isArray(returnProperties) && returnProperties[0] !== "*"){
                if(!returnProperties.includes("kogParentAppName")){
                    returnProperties.push("kogParentAppName")
                }
                if(!returnProperties.includes("name")){
                    returnProperties.push("name")
                }
            }

            const queryFilter = input.payload.queryFilter

            if(input._MO_OBJECT_NAME && queryFilter){
                let finalFilter = queryFilter

                if (!INCLUDE_CHILD_APPLICATIONS) {
                    finalFilter = `(${queryFilter}) and (kogParentAppName pr)`
                }

                /* POC: Get role-based authorization filter and AND it into the query */
                var authFilter = getRoleBasedFilters(input._AUTH_OBJECT_NAME)
                logger.error(input._ENDPOINT_NAME + ": authFilter=" + authFilter)

                finalFilter = `(${finalFilter}) and (${authFilter})`

                if (authFilter && authFilter !== "true") {
                    // AND the auth filter with the existing filter
                    finalFilter = `(${finalFilter}) and (${authFilter})`
                    logger.error(input._ENDPOINT_NAME + ": finalFilter with auth=" + finalFilter)
                } else if (authFilter === "false") {
                    // No access — return empty immediately
                    logger.error(input._ENDPOINT_NAME + ": authFilter is false, returning empty")
                    return []
                }
                
                // authFilter === "true" means master role, no additional filter needed

                logger.error(input._ENDPOINT_NAME + ": executing query with finalFilter=" + finalFilter)

                const searchResponse =  openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": finalFilter
                    },
                    returnProperties
                )
                if(searchResponse){
                    logDebug(input.transactionId,input.endPoint,"searchBusinessApplication",`Response: ${JSON.stringify(searchResponse)}`)
                    return searchResponse.result

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
 * @name getView
 * @description Method returns page view
 *
 * @param {String} viewName
 * @param {JSON} result
 * @param {Boolean} includeChildApplications - Control whether to include child applications (from INCLUDE_CHILD_APPLICATIONS constant)
 * @returns JSON page view
 */
function getView(viewName, result, includeChildApplications){

    const responseView = {
        data:{}
    }

    const unexpectedException = {
        "code":"2",
        "level":"ERROR",
        "message":{
            "code": "KYIDUEE",
            "content":""
        },
        "logger":`/getView`,
        "timestamp":""
    }

    try{

        switch (viewName) {

            case "BusinessAdminApplications":

                if(result){
                    const resultView = []

                    result.forEach(app=>{
                        if(!includeChildApplications) {
                            if(!app.kogParentAppName || app.kogParentAppName === "" || app.kogParentAppName !== app.name) {
                                return
                            }
                        }
                        logger.error("Business App Details: --> "+JSON.stringify(app));
                        let appName = ''
                        let appDescription = ''
                        let logoURL = ''
                        let tagResults = []


                        if(app.content[0]){
                            appName = app.content[0].title
                            appDescription = app.content[0].content
                        }

                        if(app.logoURL){
                            logoURL = app.logoURL
                        }

                        if(app.tags){

                            app.tags.forEach(tag => {

                                let tagQueriedResults = openidm.read(tag._ref, null, ["localizedContent"]).localizedContent
                                if(tagQueriedResults){

                                    tagResults.push({
                                        name: tagQueriedResults[0].displayTitle,
                                        description: tagQueriedResults[0].displayDescription,
                                    })
                                }

                            })


                        }
                        resultView.push({
                            id:app._id,
                            applicationName:appName,
                            appDescription:appDescription,
                            logo:logoURL,
                            tags: tagResults,
                            isFeatured: false
                        })
                    })

                    responseView.data = resultView
                }
                break

            default:
                break
        }

    }catch(error){
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw throwException(JSON.stringify(unexpectedException))
    }

    return responseView
}


/**
 * POC: Get role-based authorization filter string
 * Consistent with account_v2B_aaron_test3 pattern.
 *
 * @param {String} objectName - The managed object name (e.g. "alpha_kyid_businessapplication")
 * @returns {String} filter string or "false" (no access) or "true" (master/full access)
 */
function getRoleBasedFilters(objectName) {
    // var USER_ID = context.oauth2.rawInfo.user_id;
    var USER_ID = "2ae33a24-16b0-409b-9fd1-6afddc9d64f0"; // hardcoded for testing

    try {
        var authRequest = {
            action: "getFilter",
            userId: USER_ID,
            objectName: objectName
        };

        logger.info("businessapplication_v2B_aaron_test3: getRoleBasedFilters authRequest: " + JSON.stringify(authRequest));

        var authResponse = openidm.create("endpoint/dataAuthorizationCheck_aaron_test1", null, authRequest);

        logger.info("businessapplication_v2B_aaron_test3: getRoleBasedFilters authResponse: " + JSON.stringify(authResponse));

        if (authResponse && authResponse.filter && authResponse.filter.length > 0) {
            var filterStrings = [];
            authResponse.filter.forEach(function(filterObj) {
                if (filterObj.objectFilter) {
                    filterStrings.push(filterObj.objectFilter);
                }
            });

            if (filterStrings.length > 0) {
                // Use OR - user with multiple roles sees apps from ALL their authorized roles
                var finalFilter = "(" + filterStrings.join(") OR (") + ")";
                logger.info("businessapplication_v2B_aaron_test3: getRoleBasedFilters result: " + finalFilter);
                return finalFilter;
            }
        }

        // No filters found (404 cases: user not found, no filter, no internal role)
        logger.info("businessapplication_v2B_aaron_test3: getRoleBasedFilters no filters, returning 'false'");
        return "false";
    } catch (e) {
        // Error cases (including 404 responses) - return false to deny access
        logger.error("businessapplication_v2B_aaron_test3: getRoleBasedFilters error: " + e.message);
        return "false";
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

    const EXCEPTION_UNEXPECTED_ERROR = {
        code:"UNERROR",
        message:""
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

        if(request.content){
            if(!request.content.payload){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.payload"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }
            if(!request.content.action){
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.action"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }

            logDebug(context.transactionId,endpoint,"getRequestContent",`Response: ${request.content}`)

            /* Determine if the requester is present in the request and populate the requester details in payload */
            request.content.payload.requester = {
                displayId:"1234578"
            }
            return request.content

        }else{

            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    }catch(error){
        if(error && error.code == 400){
            throwException(error.message)
        }else{
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
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
function logException(transactionId, exception) {

    logger.error(JSON.stringify({
        transactionId:transactionId,
        kyidException:exception
    }))

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
