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
        code: "KYID-UNR",
        content: "An unexpected error occured while processing the request."
    }

    const EXCEPTION_UNSUPPORTED_OPERATION = {
        code: "KYID-USO",
        content: ""
    }

    const SUCCESS_MESSAGE = {
        code: "KYID-SUS",
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
    const ACTION_PATCH = "2"
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"
    const ACTION_MOCK = "10" //MOCK
    const ACTION_CHECK_LOGIN_PREREQ = "11"

    const ENDPOINT_NAME = "endpoint/invitation"
    const MO_OBJECT_NAME = "managed/alpha_kyid_enrollment_user_prerequisites/"


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
        "_ENDPOINT_NAME": ENDPOINT_NAME,
        "_MO_OBJECT_NAME": MO_OBJECT_NAME,
        "_PROPERTIES": OBJECT_PROPERTIES,
        "transactionId": context.http.headers['x-forgerock-transactionid'] || "",
        "payload": {}
    }


    let response = null

    try {
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
        const userId = context.security && context.security.authorization && context.security.authorization.id;
        // const sessionExpiryEpochSec = context.security && context.security.parent && context.security.parent.rawInfo && context.security.parent.rawInfo.exp
        // logger.error("context.security - endpoint/loginprerequisite - ::"+JSON.stringify(context))
        // logger.error("context.security - endpoint/loginprerequisite Raw Info - ::"+JSON.stringify(context.security.parent.rawInfo.exp))
        let result
        switch (request.method) {

            case REQUEST_POST:
                /* Get request content */

                const action = requestContent.action

                /* Create action */
                if (action == ACTION_CREATE) {
                    input.payload = requestContent.payload
                    /* Create access record. */
                    //response = createAccess(input)
                    result = {}
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                } else if (action == ACTION_SEARCH) {
                    input.payload = requestContent.payload
                    // input.payload["userId"] = userId
                    result = getToDoLoginPrerequisites(input)
          

                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                } else if (action == ACTION_DELETE) {
                    input.payload = requestContent.payload
                    /* Search access records. */
                     result = {}
                } else if (action == ACTION_PATCH) {
                    input.payload = requestContent.payload
                     // result = patchUserPrerequisites(input)
                  result = {}
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })

                } else if (action == ACTION_MOCK) {
                    result = generateMockResponse()
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                } else if (action === ACTION_CHECK_LOGIN_PREREQ) {
                    input.payload = requestContent.payload
                    result = isLoginPrereqRequired(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })

                }
                break;
            case REQUEST_GET:
               // GET Login Prerequisites
                input["payload"] = requestContent.additionalParameters
                input.payload["userId"] = userId
                if(input.payload.logonAppId === "1234567890987654"){
                  result = generateMockResponse()
                }
              else{
                result = getLoginPrerequisites(input)
              }
                
                response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                    result: result
                })


                break;
            case REQUEST_UPDATE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

                break;
            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

                break;
            case REQUEST_DELETE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

                break;

            default:
                break;
        }
        return response
    } catch (error) {

        logException(error)

        if (error && error.code) {
            /* generate error response */
            return generateResponse(error.code, input.transactionId, error.message)
        } else {
            return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }

    }

}())


function getToDoLoginPrerequisites(input) {
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getToDoLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getToDoLoginPrerequisites`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input._ENDPOINT_NAME, "getToDoLoginPrerequisites", `Input parameter: ${JSON.stringify(input.payload)}`)
        // logger.error("the searchInvitationQuery: " + JSON.stringify(input.payload))
        // logDebug(input.tr, endpointName, functionName, message)
        /* Check if  */
        if (input.payload) {
            const prerequisites = []
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter

            if (queryFilter) {
                logger.error("the searchInvitationQuery: " + JSON.stringify(queryFilter))
                logDebug(input.transactionId, input.endPoint, "getToDoLoginPrerequisites", `Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if (searchResponse) {
                  if(input.payload.view && input.payload.view.toLowerCase() === "todologinprereq"){
                    return {prerequisites:formatToDoResponse(searchResponse)}
                  }
                  else{
                    logDebug(input.transactionId, input.endPoint, "getToDoLoginPrerequisites", `Raw search response: ${JSON.stringify(searchResponse)}`)
                    return searchResponse
             
                  }

                } else {
                    return []
                }
            } else {

                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }

}

function formatToDoResponse(searchResponse) {
  try {
    let result =[]
    let TODOLoginPrereqJSON = {}
    if(searchResponse && searchResponse.resultCount>0){
      
      searchResponse.result.forEach(value=>{
       TODOLoginPrereqJSON = {}
        TODOLoginPrereqJSON["userPrereqId"] = value._id || ""
        TODOLoginPrereqJSON["displayName"] = value.preRequisiteId.displayName || ""
        TODOLoginPrereqJSON["displayDescription"] = value.preRequisiteId.displayDescription || ""
        TODOLoginPrereqJSON["status"] = value.status || ""
        TODOLoginPrereqJSON["typeId"] = value.preRequisiteTypeId._id || ""
        TODOLoginPrereqJSON["id"] = value.preRequisiteId._id || ""
        TODOLoginPrereqJSON["typeName"] = value.preRequisiteTypeId.typeName || ""
        TODOLoginPrereqJSON["appDisplayName"] = {}
        TODOLoginPrereqJSON["expiryDate"] =value.expiryDate || ""
        if(value.preRequisiteId && value.preRequisiteId.LoginTriggerCondition && 
           value.preRequisiteId.LoginTriggerCondition.applicationId && 
           value.preRequisiteId.LoginTriggerCondition.applicationId !== null && 
           value.preRequisiteId.LoginTriggerCondition.applicationId !== ""){
          const appId = value.preRequisiteId.LoginTriggerCondition.applicationId
          const getBusinessApp = getMORecord(appId, ["*"], "alpha_kyid_businessapplication")
          if(getBusinessApp){
            if(getBusinessApp.content && getBusinessApp.content[0] && getBusinessApp.content[0].content){
              TODOLoginPrereqJSON["appDisplayName"] = getBusinessApp.content[0].content
            }
          }
          
        }
        result.push(TODOLoginPrereqJSON)
      })
      return result
    }
    else {
      return result
    }
    
    
  } catch (error) {
    throw error
  }
}


//Mock Response 

function generateMockResponse() {
    try {
        const mockJSON = {
            "application": {
                "displayName": {
                    "en": "KYID Portal",
                    "es": "KYID Portal",
                },
                "displayDescription": {
                    "en": "KYID Portal Description",
                    "es": "KYID Portal Description"
                },
                "appLogo": "logo.png",
            },
            "helpdeskContactId": "72ed3dfc-9e6e-4583-b910-3b8498381201",
            "prerequisites": [
                {
                    "id": "dc272480-3149-4aad-aaf1-6c7f5443391b",
                    "userPrereqId": "6b360ecf-c6e5-47f1-be95-80b25b638910",
                    "typeId": "67a27e45-fa04-4e5a-a411-aa5a478a4810",
                    "typeName": "6",
                    "displayName": {
                        "en": "Training Prerequisite EN",
                        "es": "Training Prerequisite ES"
                    },
                    "displayDescription": {
                        "en": "Training Prerequisite Description EN",
                        "es": "Training Prerequisite Description ES"
                    },
                    "status": "0",
                    "displayOrder": 0,
                    "enforcementType": 0
                },
                {
                    "id": "4b67ec7c-c831-4911-bcb5-991cee3bb891",
                    "userPrereqId": "77f2e318-d124-425e-89de-d54db636c926",
                    "typeId": "8f2c44f5-41cd-477c-a144-2d9bf8fc1cb2",
                    "typeName": "6",
                    "displayName": {
                        "en": "Agreement Prerequisite EN",
                        "es": "Agreement Prerequisite ES"
                    },
                    "displayDescription": {
                        "en": "Agreement Prerequisite Description EN",
                        "es": "Agreement Prerequisite Description ES"
                    },
                    "status": "0",
                    "displayOrder": 2,
                    "enforcementType": 0
                },
                {
                    "id": "ae2f091b-bde2-4c60-ae8b-26144e9633cb",
                    "userPrereqId": "0ed6eb0e-8273-4c68-b7e6-922e822cf8f2",
                    "typeId": "769eede8-5afc-4ec1-a229-58e32c2e3106",
                    "typeName": "3",
                    "displayName": {
                        "en": "KYID Account Settings Review EN",
                        "es": "KYID Account Settings Review ES"
                    },
                    "displayDescription": {
                        "en": "KYID Account Settings Review EN",
                        "es": "KYID Account Settings Review ES"
                    },
                    "status": "0",
                    "displayOrder": 3,
                    "enforcementType": 1
                },
                {
                    "id": "3b736551-2eca-466f-b560-00f19443658d",
                    "userPrereqId": "58de2807-1a29-4756-917e-10aefcc09877",
                    "typeId": "18a3ff19-a00f-4145-b8ed-922737a89919 ",
                    "typeName": "5",
                    "displayName": {
                        "en": "Self Enrollment EN",
                        "es": "KSelf Enrollment EN"
                    },
                    "displayDescription": {
                        "en": "Self Enrollment EN",
                        "es": "Self Enrollment EN"
                    },
                    "status": "0",
                    "displayOrder": 4,
                    "enforcementType": 1
                },
                {
                    "id": "d2f2e7f2-f45c-48e4-83ad-39f1d942ddaa",
                    "userPrereqId": "596f5e56-cb53-4714-91dc-b8cbf2f59c5f",
                    "typeId": "0f4340bb-3ea8-4d8e-ae83-a8d45c314e77",
                    "typeName": "2",
                    "displayName": {
                        "en": "KYID Organ Donor EN",
                        "es": "KYID Organ Donor EN"
                    },
                    "displayDescription": {
                        "en": "KYID Organ Donor EN",
                        "es": "KYID Organ Donor EN"
                    },
                    "status": "0",
                    "displayOrder": 4,
                    "enforcementType": 1
                },
                {
                    "id": "5b4926a7-0d81-41eb-ae13-83925e692cc0",
                    "userPrereqId": "21bccc9b-0121-4324-92da-a4808189a09d",
                    "typeId": "8962ee11-bc2b-4e02-a911-6bd8f6e97704",
                    "typeName": "7",
                    "displayName": {
                        "en": "User Profile Review EN",
                        "es": "User Profile Review ES"
                    },
                    "displayDescription": {
                        "en": "User Profile Review Description EN",
                        "es": "User Profile Review Description ES"
                    },
                    "status": "0",
                    "displayOrder": 5,
                    "enforcementType": 1
                }

            ],
            "redirectAppURL": "https://testapp.com/signout"

        }
        return mockJSON

    } catch (error) {
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException

    }
}






/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function isLoginPrereqRequired(input) {
    const functionName = "isLoginPrereqRequired"
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, functionName, `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            if (input.payload.logonAppId) {
                const applicationId = input.payload.logonAppId
                const userId = input.payload.userId
                let PrereqForEvaluation = null
                let loginPrereqEvaluationResult = []
                let prereqAppId = null
                let appDisplayName = {}
                let appDispalyDescription = {}
                let appLogo = ""
                let prereqRoleId = null
                let helpDeskContactId = ""
                let redirectAppURL = ""
                // let lastAttemptedLoginPrereq = Date.now()
                let lastAttemptedLoginPrereq = Date.now()
                let prereqResponseArray = []
                const userInfo = getMORecord(userId, ["*"], "alpha_user");
                const businessAppInfo = getMORecord(applicationId, ["*"], "alpha_kyid_businessapplication");
                if (userInfo) {
                    if (businessAppInfo) {
                        if (businessAppInfo.content) {
                            if (businessAppInfo.content[0].title) {
                                appDisplayName = businessAppInfo.content[0].title
                            }
                            if (businessAppInfo.content[0].content) {
                                appDispalyDescription = businessAppInfo.content[0].content
                            }
                        }
                        if (businessAppInfo.logoURL) {
                            appLogo = businessAppInfo.logoURL
                        }
                        if (businessAppInfo.applicationHelpdeskContact) {
                            helpDeskContactId = businessAppInfo.applicationHelpdeskContact._refResourceId
                        }
                        if (businessAppInfo.softLogoutURL) {
                            redirectAppURL = businessAppInfo.softLogoutURL
                        }

                        if (userInfo.custom_lastAttemptedLoginPrereq) {
                            lastAttemptedLoginPrereq = userInfo.custom_lastAttemptedLoginPrereq
                        }


                        // if (userInfo.effectiveRoles && userInfo.effectiveRoles.length > 0) {
                        prereqResponseArray = checkLoginPrereqCondtions(userInfo, applicationId, input)
                        if (prereqResponseArray.length > 0) {
                            PrereqForEvaluation = getPrereqForEvaluation(input, userId, prereqResponseArray, userInfo)
                            if (PrereqForEvaluation !== null) {
                                prerequisites = evaluatePrereq(input, userId, Number(lastAttemptedLoginPrereq), PrereqForEvaluation) //input,userId,lastAttemptLoginPrereqTime,prereqList
                                if (prerequisites) {
                                    loginPrereqEvaluationResult = createPrereqJSON(prerequisites, input)
                                }
                            }
                        }

                        if (loginPrereqEvaluationResult.length > 0) {
                            let mandatoryPrerequisite = loginPrereqEvaluationResult.some(item=>item.enforcementType === 0)
                            let optionalPrerequisite = loginPrereqEvaluationResult.some(item=>item.enforcementType === 1)
                            return { "mandatoryPrerequisite": mandatoryPrerequisite,"optionalPrerequisite":optionalPrerequisite }
                        }
                        else {
                            return { "mandatoryPrerequisite": false,"optionalPrerequisite":false }
                        }




                    }
                    else {
                        /* Throw invalid request exception. */
                        invalidRequestException["code"] = "1"
                        invalidRequestException.message.content = `Invalid Application specified | loginAppId=` + applicationId
                        invalidRequestException.timestamp = new Date().toISOString()
                        throw invalidRequestException

                    }

                }
                else {
                    // User Not Found in Ping
                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `User not found | UserId = ` + userId
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException
                }

            }
            else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "logonAppId"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException

            }

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "Input Payload in Request Body"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        if (error.message.code) {
            unexpectedException.code = error.code
        }
        if (error.message.content) {
            unexpectedException.message.content = error.message.content
        }
        else {
            // unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        }

        unexpectedException.timestamp = new Date().toISOString()
        logDebug(input.transactionId, input.endPoint, functionName, `An unexpected error occured. Error: ${JSON.stringify(error)}`)
        throw unexpectedException
    }

}












/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function getLoginPrerequisites(input) {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "searchAccount", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            if (input.payload.logonAppId) {
                // const applicationId = "789c84c0-0e75-4c2b-af6c-32b07e463334"
                const applicationId = input.payload.logonAppId
                // const userId = "e9dfbded-4387-4cd9-9519-c529807849c3"
                const authTime = input.payload.authTime || null
                const userId = input.payload.userId
                let PrereqForEvaluation = null
                let loginPrereqEvaluationResult = []
                let prereqAppId = null
                let appDisplayName = {}
                let appDispalyDescription = {}
                let appLogo = ""
                let prereqRoleId = null
                let helpDeskContactId = ""
                let redirectAppURL = input.payload.returnURL ? decodeURIComponent(input.payload.returnURL) : ""
                // let lastAttemptedLoginPrereq = new Date().toISOString() 
                let lastAttemptedLoginPrereq = "0"
                let prereqResponseArray = []
                const userInfo = getMORecord(userId, ["*"], "alpha_user");
                const businessAppInfo = getMORecord(applicationId, ["*"], "alpha_kyid_businessapplication");
                let businessRoles = []
                if (userInfo) {
                   if(businessAppInfo){
                     if(businessAppInfo.content){
                       if(businessAppInfo.content[0].title){
                         appDisplayName = businessAppInfo.content[0].title
                       }
                       if(businessAppInfo.content[0].content){
                         appDispalyDescription = businessAppInfo.content[0].content
                       }
                     }
                     if(businessAppInfo.logoURL){
                       appLogo = businessAppInfo.logoURL
                     }
                     if(businessAppInfo.applicationHelpdeskContact){
                       helpDeskContactId=businessAppInfo.applicationHelpdeskContact._refResourceId
                     }
                     if(businessAppInfo.roleAppId && businessAppInfo.roleAppId.length>0){
                       businessAppInfo.roleAppId.forEach(val=>{
                         if(val._refResourceId){
                           businessRoles.push(val._refResourceId)
                         }
                       })
                     }
                     
                     // if(businessAppInfo.softLogoutURL){
                     //   redirectAppURL = businessAppInfo.softLogoutURL
                     // }

                     if(userInfo.custom_lastAttemptedLoginPrereq && userInfo.custom_lastAttemptedLoginPrereq !== null){
                       lastAttemptedLoginPrereq = userInfo.custom_lastAttemptedLoginPrereq
                     }
                     else{
                       userInfo["custom_lastAttemptedLoginPrereq"] = "0"
                       lastAttemptedLoginPrereq = "0"
                     }
                     
                     
                   // if (userInfo.effectiveRoles && userInfo.effectiveRoles.length > 0) {
                        prereqResponseArray = checkLoginPrereqCondtions(userInfo,applicationId,input,businessRoles)
                        if(prereqResponseArray.length>0){
                           PrereqForEvaluation = getPrereqForEvaluation(input,userId,prereqResponseArray,userInfo)
                           if(PrereqForEvaluation !==null){
                             prerequisites = evaluatePrereq(input,userId,Number(lastAttemptedLoginPrereq),PrereqForEvaluation) //input,userId,lastAttemptLoginPrereqTime,prereqList
                             if(prerequisites){
                               loginPrereqEvaluationResult = createPrereqJSON(prerequisites)
                             }
                           }
                        }
                      let loginPrereqJSON = {
                          application:{
                            displayName:appDisplayName,
                            displayDescription:appDispalyDescription,
                            appLogo:appLogo,
                            
                          },
                          helpdeskContactId:helpDeskContactId,
                          redirectAppURL:redirectAppURL,
                          prerequisites:loginPrereqEvaluationResult
                          
                        }
                      if(loginPrereqEvaluationResult.length>0 && authTime && authTime !== null){
                        let hasEnforceMent = loginPrereqEvaluationResult.some(item=>item.enforcementType === 0)
                        logger.error("hasEnforceMent is --> "+ hasEnforceMent)
                        logger.error("prerequisites.updateLastPrereTime is --> "+ prerequisites.updateLastPrereTime)
                        // if(!hasEnforceMent && prerequisites && prerequisites.updateLastPrereTime && authTime !== "0"){
                         if(!hasEnforceMent && prerequisites && prerequisites.updateLastPrereTime){
                          // let userPatchRequest = [{
                          //   "operation": "replace",
                          //   "field": "custom_lastAttemptedLoginPrereq",
                          //   "value": new Date().toISOString()
                          //   }]
                           // let lastPrereqTime = Date.now.to
                            let userPatchRequest = [{
                            "operation": "replace",
                            "field": "custom_lastAttemptedLoginPrereq",
                                "value": Date.now().toString()
                            // "value": authTime
                            }]
                        const userPatchResponse = patchMORecord(userId,"alpha_user",userPatchRequest)
                          
                        }
       
                      }
                        
                        return loginPrereqJSON
                    // }
                    // else {
                    //     // User Not Found in Ping
                    //     /* Throw invalid request exception. */
                    //     invalidRequestException.message.content = `No roles found for user. | UserID | `+userId
                    //     invalidRequestException.code = "1"
                    //     invalidRequestException.timestamp = new Date().toISOString()

                    //     throw invalidRequestException

                    // }
                    // return userInfo
                     
                   }
                  else{
                      /* Throw invalid request exception. */
                      invalidRequestException["code"] = "1"
                      invalidRequestException.message.content = `Invalid Application specified | loginAppId=`+applicationId
                      invalidRequestException.timestamp = new Date().toISOString()
                      throw invalidRequestException
                    
                  }
                   
                }
                else {
                    // User Not Found in Ping
                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `User not found | UserId = `+userId
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException
                }

            }
            else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "logonAppId"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException

            }

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "Input Payload in Request Body"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        if(error.message.code){
          unexpectedException.code = error.code
        }
        if(error.message.content){
          unexpectedException.message.content = error.message.content
        }
        else{
          // unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
          unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        }
        
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
    }

}

function createPrereqJSON(prereq) {
  try {
    let mandatoryEnforcementType = 0
    let optionalEnforcementType = 1
    let displayOrder = 0
    let prerequisites = []
    logger.error("createPrereqJSON prereq JSON is "+JSON.stringify(prereq))
      if(prereq){
        if(prereq.mandatoryPrerequisites && prereq.mandatoryPrerequisites.length>0){
          logger.error("Forming JSON for Mandatory Prereq")
          prereq.mandatoryPrerequisites.forEach(value=>{
            let loginPrereqJSON ={}
            displayOrder++
            loginPrereqJSON["id"]=value.preRequisiteId._id || ""
            loginPrereqJSON["typeId"]=value.preRequisiteTypeId._refResourceId || ""
            loginPrereqJSON["displayDescription"]=value.preRequisiteId.displayDescription || ""
            loginPrereqJSON["displayName"]=value.preRequisiteId.displayName || ""
            loginPrereqJSON["userPrereqId"]=value._id || ""
            loginPrereqJSON["enforcementType"]= mandatoryEnforcementType
            loginPrereqJSON["typeName"]=value.preRequisiteTypeId.typeName || ""
            loginPrereqJSON["status"]=value.status || ""
            loginPrereqJSON["displayOrder"]= displayOrder
            prerequisites.push(loginPrereqJSON)
            
          })


        }
        if(prereq.optionalPrerequisites && prereq.optionalPrerequisites.length>0 ){
          logger.error("Forming JSON for optionalPrerequisites")
            prereq.optionalPrerequisites.forEach(record=>{
            let loginPrereqJSON ={}
            displayOrder++
            loginPrereqJSON["id"]=record.preRequisiteId._id || ""
            loginPrereqJSON["typeId"]=record.preRequisiteTypeId._refResourceId || ""
            loginPrereqJSON["displayDescription"]=record.preRequisiteId.displayDescription || ""
            loginPrereqJSON["displayName"]=record.preRequisiteId.displayName || ""
            loginPrereqJSON["userPrereqId"]=record._id || ""
            loginPrereqJSON["enforcementType"]= optionalEnforcementType
            loginPrereqJSON["typeName"]=record.preRequisiteTypeId.typeName || ""
            loginPrereqJSON["status"]=record.status || ""
            loginPrereqJSON["displayOrder"]= displayOrder
            prerequisites.push(loginPrereqJSON)
             
           })

        }
            return prerequisites
      }
    else{
      throw "Prereq Not Present"
    }


    
  } catch (error) {
    throw error
    
  }
}

function evaluatePrereq(input,userId,lastAttemptLoginPrereqTime,prereqList) {
  const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
  
  try {
    if(userId){
      if(prereqList){
        if(prereqList.prereqForEvaluation && prereqList.expiredPrerequisites){
          const prereqForEvaluation =prereqList.prereqForEvaluation
          const authTime = input.payload.authTime || null
          logger.error("evaluatePrereq Auth Time is "+ authTime)
          const mandatoryPrerequisites =prereqList.expiredPrerequisites
          // lastAttemptLoginPrereqTime = "2025-08-02T05:36:46.747Z"
          let currentDateISO = new Date().toISOString()
          let currentDate = currentDateISO.split('T')[0]
          let optionalPrerequisites =[]
          let updateLastPrereTime = false
          let lastAttemptLoginPrereqTimeEpoch = lastAttemptLoginPrereqTime || null
          if(lastAttemptLoginPrereqTime !== null){
            logger.error("lastAttemptLoginPrereqTime --> "+lastAttemptLoginPrereqTime)
            lastAttemptLoginPrereqTime = new Date(lastAttemptLoginPrereqTime).toISOString()
            logger.error("lastAttemptLoginPrereqTime ISO Format--> "+lastAttemptLoginPrereqTime)
            lastAttemptLoginPrereqDate= lastAttemptLoginPrereqTime.split('T')[0]
            logger.error("lastAttemptLoginPrereqDate is -->"+lastAttemptLoginPrereqDate)
          }
          else{
            lastAttemptLoginPrereqTime = 0
            logger.error("lastAttemptLoginPrereqTime --> "+lastAttemptLoginPrereqTime)
            lastAttemptLoginPrereqTime = new Date(lastAttemptLoginPrereqTime).toISOString()
            logger.error("lastAttemptLoginPrereqTime ISO Format--> "+lastAttemptLoginPrereqTime)
            lastAttemptLoginPrereqDate= lastAttemptLoginPrereqTime.split('T')[0]
            logger.error("lastAttemptLoginPrereqDate is -->"+lastAttemptLoginPrereqDate)
            
          }

          if(prereqForEvaluation.length>0){
            prereqForEvaluation.forEach(value=>{
              let skip = "0"
              let dueDatewithGrace = null
              let dueDate = null
              let numberOfDaysBeforeDueDate = null
              let frequencyInDays =null
              let login = "0"
              // let lastAttemptLoginPrereqDate =null
              let lastAttemptLoginPrereqWithFreqDate= null
              let numberOfDaysBeforeDueDateInDays = "0"
              let userPrereqexpiryDate = null
              let userPrereqcreateDate = null
              let prereqRecord =null
              prereqRecord=value.preRequisiteId
              if(value.expiryDate){
                userPrereqexpiryDate =value.expiryDate.split('T')[0]
              }
              if(value.createDate){
                userPrereqcreateDate =value.createDate.split('T')[0]
              }

              if(prereqRecord.LoginDueCompletion && prereqRecord.LoginDueCompletion !==null ){
              if(prereqRecord.LoginDueCompletion.dueDate !==null && prereqRecord.LoginDueCompletion.dueDate){
                dueDate = prereqRecord.LoginDueCompletion.dueDate
              }
              else if(prereqRecord.LoginDueCompletion.inDays && prereqRecord.LoginDueCompletion.inDays !==null && prereqRecord.LoginDueCompletion.inDays !=="0"){
                if(getFormatedDaysWithAdditional(prereqRecord.LoginTriggerCondition.triggerStartDate, Number(prereqRecord.LoginDueCompletion.inDays), "add")){
                  dueDate = getFormatedDaysWithAdditional(prereqRecord.LoginTriggerCondition.triggerStartDate, Number(prereqRecord.LoginDueCompletion.inDays), "add")
                }
               
                
              }
              if(prereqRecord.LoginDueCompletion.gracePeriodinDays && prereqRecord.LoginDueCompletion.gracePeriodinDays !==null && dueDate !==null){
                dueDatewithGrace =  getFormatedDaysWithAdditional(userPrereqcreateDate, Number(prereqRecord.LoginDueCompletion.gracePeriodinDays), "add")
              }
              logger.error("prereqRecord.LoginDueCompletion.numberOfDaysBeforeDueDate Is --> "+ prereqRecord.LoginDisplayCriteria.numberOfDaysBeforeDueDate)
              if(prereqRecord.LoginDisplayCriteria.numberOfDaysBeforeDueDate && prereqRecord.LoginDisplayCriteria.numberOfDaysBeforeDueDate !== null){
                numberOfDaysBeforeDueDateInDays = prereqRecord.LoginDisplayCriteria.numberOfDaysBeforeDueDate
                numberOfDaysBeforeDueDate = getFormatedDaysWithAdditional(dueDate, Number(prereqRecord.LoginDisplayCriteria.numberOfDaysBeforeDueDate), "sub")
              }
              logger.error("dueDate is --> "+dueDate)
              logger.error("dueDatewithGrace is --> "+dueDatewithGrace)
              logger.error("numberOfDaysBeforeDueDate is --> "+numberOfDaysBeforeDueDate)

              if(prereqRecord.LoginDisplayCriteria !== null && prereqRecord.LoginDisplayCriteria){
                if(prereqRecord.LoginDisplayCriteria.skipOption && prereqRecord.LoginDisplayCriteria.skipOption !== null){
                  skip=prereqRecord.LoginDisplayCriteria.skipOption
                }
                if(prereqRecord.LoginDisplayCriteria.frequencyInDays && prereqRecord.LoginDisplayCriteria.frequencyInDays !== null && prereqRecord.LoginDisplayCriteria.frequencyInDays !== "0"){
                  frequencyInDays = prereqRecord.LoginDisplayCriteria.frequencyInDays
                }
                if(prereqRecord.LoginDisplayCriteria.login !== null && prereqRecord.LoginDisplayCriteria.login){
                  login = prereqRecord.LoginDisplayCriteria.login
                }
                logger.error("login is --> "+login)
                logger.error("frequencyInDays is --> "+frequencyInDays)
                logger.error("skip is --> "+skip)
            }
            if(lastAttemptLoginPrereqDate){
              logger.error("Inside lastAttemptLoginPrereqDate Condition")
              if(frequencyInDays !== null && frequencyInDays !== "0"){
                lastAttemptLoginPrereqWithFreqDate = getFormatedDaysWithAdditional(lastAttemptLoginPrereqDate, Number(frequencyInDays), "add")
                logger.error("lastAttemptLoginPrereqWithFreqDate is --> "+ lastAttemptLoginPrereqWithFreqDate)
                }
                else{
                lastAttemptLoginPrereqWithFreqDate = currentDate
                }
              
              
            }
            else{
              lastAttemptLoginPrereqWithFreqDate = currentDate
            }

            if(skip ==="0"){
              logger.error("Mandatory Login Prereq --> ")
              mandatoryPrerequisites.push(value)
              
            }
            else{
              logger.error("In Skip == 1 Condtion")
              if(userPrereqexpiryDate > dueDate && dueDate !== null && userPrereqexpiryDate !==null){
               logger.error("Inside Grace condition ")
                mandatoryPrerequisites.push(value)
             
              }
              else if(currentDate >= lastAttemptLoginPrereqWithFreqDate){
                logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate Condtion")
               if(numberOfDaysBeforeDueDate !== null && numberOfDaysBeforeDueDateInDays !== "0" ){
                 logger.error("numberOfDaysBeforeDueDate !== null && numberOfDaysBeforeDueDateInDays !==0 ")
                 if((currentDate > numberOfDaysBeforeDueDate) && numberOfDaysBeforeDueDate !== "0"){
                   logger.error("In currentDate > numberOfDaysBeforeDueDate ")
                   if(login === "0"){
                     logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate --> login === 0 ")
                     if(new Date().toISOString() >= lastAttemptLoginPrereqTime){
                       logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate --> new Date().toISOString() > lastAttemptLoginPrereqTime")
                       optionalPrerequisites.push(value)
                       // updateLastPrereTime = true
                     }
                     else{
                       logger.error("In Else -- currentDate >= lastAttemptLoginPrereqWithFreqDate --> new Date().toISOString() > lastAttemptLoginPrereqTime -- Not Display Prereq")
                     }
                   }
                   else{
                     logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate --> login === 1")
                        // logger.error("In login = 1 condtion")
                        if(lastAttemptLoginPrereqDate == lastAttemptLoginPrereqWithFreqDate){
                          logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate --> login === 1 Skipping Prereq in Login Condtion 1")
                          logger.error("Don't Display Login Prerequisites" +prereqForEvaluation._id )
                        }
                        else{
                          logger.error("In currentDate >= lastAttemptLoginPrereqWithFreqDate --> login === 1 Login Condtion 1")
                          optionalPrerequisites.push(value)
                          // updateLastPrereTime = true
                        }
                           // optionalPrerequisites.push(value)
                   }
                 }
                 else{
                   logger.error("Don't Display Login Prerequisites" +prereqForEvaluation._id )
                 }
                 
               }
                else{
                if(login === "0"){
                  logger.error("In login = 0 condtion")
                  
                  // logger.error("authTime is "+ authTime + "lastAttemptLoginPrereqTimeEpoch is "+ lastAttemptLoginPrereqTimeEpoch)
                  if(new Date().toISOString() >= lastAttemptLoginPrereqTime){
                  // if((authTime != lastAttemptLoginPrereqTimeEpoch) && (new Date().toISOString() >= lastAttemptLoginPrereqTime)){
                     logger.error("In login new Date().toISOString() > lastAttemptLoginPrereqTime")
                    optionalPrerequisites.push(value)
                    // updateLastPrereTime = true
                    }
                  else{
                    logger.error("In else- Date().toISOString() > lastAttemptLoginPrereqTimecondtion")
                  }
                  
                }
                else{
                  logger.error("In login = 1 condtion")
                  if(lastAttemptLoginPrereqDate == lastAttemptLoginPrereqWithFreqDate){
                    logger.error("Skipping Prereq in Login Condtion 1")
                    logger.error("Don't Display Login Prerequisites" +prereqForEvaluation._id )
                  }
                  else{
                    logger.error("Login Condtion 1")
                    optionalPrerequisites.push(value)
                    // updateLastPrereTime = true
                  }
                  
                }
                  
                }

              }
              else{
                logger.error("in Else Condition of currentDate >= lastAttemptLoginPrereqWithFreqDate ")
              }
              
            }


              
              
            }
              
            })
          }
          else{
            logger.error("No Prereq Found")
          }
          
          if(mandatoryPrerequisites.length == 0 && optionalPrerequisites.length > 0 ){
              if(authTime !== "0"){
                optionalPrerequisites = []
              }
              updateLastPrereTime = true
          }
          return {"mandatoryPrerequisites":mandatoryPrerequisites,"optionalPrerequisites":optionalPrerequisites,"updateLastPrereTime":updateLastPrereTime}
        }
        else{
          throw "Prerequisites Not Present"
        }
      }
      else{
        throw "Prerequisites Not Present"
      }
    }
    else{
      throw "UserID Not Present"
    }
    
    
  } catch (error) {
    throw error
  }
  
}

function getPrereqForEvaluation(input,userId,prereqArray,userInfo) {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }

    try {
      if(prereqArray.length>0){
          const USER_PREQ_MO_NAME = "managed/alpha_kyid_enrollment_user_prerequisites" 
          const userPrereqRequiredProperties =["preRequisiteTypeId/*","preRequisiteId/*","*"]
          let userPrereqQueryFilter = null
          let getUserPrerequsite = null
          let createUserPrereqResponse = null
          let expiredPrerequisites = []
          let isOrgDonorPrereqCreated = false
          let isSelfEnrollCreated = false
          let prereqForEvaluation =[]
          prereqArray.forEach(prereqRecord=>{
            logger.error("getPrereqForEvaluation -- prereqRecord is --> "+JSON.stringify(prereqRecord))
            //AND (status eq '0' or status eq 'NOT_COMPLETED' or status eq '1' or status eq 'PENDING_APPROVAL' or status eq '7' or status eq 'REVERIFY')
            let triggerStartDateEpoch = null
            let triggerStartDate = null
            let triggerEndDate = null 
            let triggerEndDateEpoch = null
            triggerStartDate = prereqRecord.LoginTriggerCondition.triggerStartDate+"T00:00:00Z"
            triggerStartDateEpoch = new Date(triggerStartDate).getTime()
            logger.error("triggerStartDateEpoch is -->"+triggerStartDateEpoch)
            triggerEndDate = prereqRecord.LoginTriggerCondition.triggerEndDate+"T00:00:00Z"
            triggerEndDateEpoch = new Date(triggerEndDate).getTime() //new Date(expiryDate).getTime()
            logger.error("triggerEndDateEpoch is -->"+triggerEndDateEpoch)
            // userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND preRequisiteId/_refResourceId eq \"" + prereqRecord._id + "\" AND (((status eq '2' or status eq 'COMPLETED' or status eq 'ALREADY_COMPLETED' or status eq '4') AND  (\""+triggerStartDateEpoch+"\" gt completionDate AND \""+triggerEndDateEpoch+"\" lt completionDate ) ) or (status eq 'NOT_COMPLETED' or status eq '0') or (status eq 'EXPIRED' or status eq '5')) AND (recordState eq '0' or recordState eq 'ACTIVE') "
            // userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND preRequisiteId/_refResourceId eq \"" + prereqRecord._id + "\" AND (((status eq '2' or status eq 'COMPLETED' or status eq 'ALREADY_COMPLETED' or status eq '4') AND  (completionDateEpoch gt +"triggerStartDateEpoch+" AND completionDateEpoch lt "+triggerEndDateEpoch+" ) ) or (status eq 'NOT_COMPLETED' or status eq '0') or (status eq 'EXPIRED' or status eq '5')) AND (recordState eq '0' or recordState eq 'ACTIVE') "
            if(prereqRecord.prereqTypeId && prereqRecord.prereqTypeId.typeName && ((prereqRecord.prereqTypeId.typeName === "2" && userInfo.custom_organdonor === true) || prereqRecord.prereqTypeId.typeName === "5" && userInfo.custom_selfEnrollMFA === true)){
              logger.error("Prerequisite Already Completed")
              userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND  preRequisiteId/_refResourceId/ eq \"" + prereqRecord._id + "\" AND (recordState eq '0' or recordState eq 'ACTIVE') AND (status eq '0' or status eq 'NOT_STARTED')"
              getUserPrerequsite = searchMO(USER_PREQ_MO_NAME, userPrereqQueryFilter, userPrereqRequiredProperties);
              if(getUserPrerequsite){
                getUserPrerequsite.forEach(val=>{
                  let completionDate = new Date().toISOString()
                  let competionDateEpoch = Date.now()
                    const jsonArray = [
                      {
                      "operation": "replace",
                      "field": "status",
                      "value": "2"
                      },
                      {
                        "operation": "replace",
                        "field": "completionDateEpoch",
                        "value": competionDateEpoch
                      },
                      {
                        "operation": "replace",
                        "field": "completionDate",
                        "value": completionDate
                        
                      }
                    
                    ]

                patchMORecord(val._id,"alpha_kyid_enrollment_user_prerequisites",jsonArray)
              })
                  
                }

            }
            else{
            // userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND preRequisiteId/_refResourceId eq \"" 
            //                   + prereqRecord._id + "\" AND (((status eq '2' or status eq 'COMPLETED' or status eq 'ALREADY_COMPLETED' or status eq '4') AND  ( completionDateEpoch gt "+triggerStartDateEpoch+" AND completionDateEpoch lt "
            //               +triggerEndDateEpoch+" ) ) or (status eq 'NOT_COMPLETED' or status eq '0') or (status eq 'PENDING' or status eq '7') or (status eq 'EXPIRED' or status eq '5')) AND (recordState eq '0' or recordState eq 'ACTIVE') "
            userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND preRequisiteId/_refResourceId eq \"" 
                              + prereqRecord._id + "\" AND (((status eq '2' or status eq 'COMPLETED' or status eq 'ALREADY_COMPLETED' or status eq '4') AND  ( completionDateEpoch gt "+triggerStartDateEpoch+" AND completionDateEpoch lt "
                          +triggerEndDateEpoch+" ) ) or (status eq 'NOT_COMPLETED' or status eq '0') or (status eq 'PENDING' or status eq '7') ) AND (recordState eq '0' or recordState eq 'ACTIVE') "
            getUserPrerequsite = searchMO(USER_PREQ_MO_NAME, userPrereqQueryFilter, userPrereqRequiredProperties);
            logger.error("prereqRecord.prereqTypeId.typeName" +prereqRecord.prereqTypeId.typeName)
            logger.error("isOrgDonorPrereqCreated -- " + isOrgDonorPrereqCreated)
            logger.error("isSelfEnrollCreated -- " + isSelfEnrollCreated)
            // if(getUserPrerequsite && ((prereqRecord.prereqTypeId.typeName === "2" && isOrgDonorPrereqCreated === true) || (prereqRecord.prereqTypeId.typeName === "5" && isSelfEnrollCreated === true) )){
            if(getUserPrerequsite){
              logger.error("prereqRecord.prereqTypeId.typeName" +prereqRecord.prereqTypeId.typeName)
              logger.error("isOrgDonorPrereqCreated -- " + isOrgDonorPrereqCreated)
              logger.error("isSelfEnrollCreated -- " + isSelfEnrollCreated)
              getUserPrerequsite.forEach(value=>{
              if(value.status === "EXPIRED" || value.status === "5"){
                let idSet = new Set(expiredPrerequisites.map(item => item._id))
                if(!idSet.has(value["_id"])){
                  expiredPrerequisites.push(value)
                  idSet.add(value["_id"])
                }
              
              }

              else if(value.status === "COMPLETED" || value.status === "2" || value.status === "AlREADY_COMPLETED" || value.status === "4"){
                logger.error("Skipping Prereq As Already Completed"+"Prereq Id --"+value._id+"::Status::"+value.status)
              }
              else{

               let idSet1 = new Set(prereqForEvaluation.map(item => item._id))

                if(!idSet1.has(value["_id"])){
                  prereqForEvaluation.push(value)
                  idSet1.add(value["_id"])
                }
               
              }
                
              })

              
            }
            else{
              // Create User Login Prerequisites
               logger.error("prereqRecord.prereqTypeId.typeName" +prereqRecord.prereqTypeId.typeName)
              logger.error("isOrgDonorPrereqCreated -- " + isOrgDonorPrereqCreated)
              logger.error("isSelfEnrollCreated -- " + isSelfEnrollCreated)
              createUserPrereqResponse = createUserPrereq(prereqRecord,userId)
              if(createUserPrereqResponse){
                // if(prereqRecord.prereqTypeId.typeName === "2"){
                //   isOrgDonorPrereqCreated = true
                // }
                // if(prereqRecord.prereqTypeId.typeName === "5"){
                //   isSelfEnrollCreated = true
                // }
                if(createUserPrereqResponse.status === "0"){
                  userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND _id/ eq \"" + createUserPrereqResponse._id + "\" AND (recordState eq '0' or recordState eq 'ACTIVE') "
                   getUserPrerequsite = searchMO(USER_PREQ_MO_NAME, userPrereqQueryFilter,userPrereqRequiredProperties);
                      if(getUserPrerequsite){
                        getUserPrerequsite = getUserPrerequsite[0]
                      }
                      
                      let idSet2 = new Set(prereqForEvaluation.map(item => item._id))
                    
                      if(!idSet2.has(getUserPrerequsite["_id"])){
                        prereqForEvaluation.push(getUserPrerequsite)
                        idSet2.add(getUserPrerequsite["_id"])
                      }
                        
                      }

              }
            }
              
            }
          
          }) 
        // userPrereqQueryFilter = " !(enrollmentRequestId pr) AND !(associatedRoleIds pr) AND requestedUserAccountId/ eq \"" + userId + "\" AND (status eq '5' or status eq 'EXPIRED')  AND (recordState eq '0' or recordState eq 'ACTIVE') "
        // getUserPrerequsite = searchMO(USER_PREQ_MO_NAME, userPrereqQueryFilter, userPrereqRequiredProperties);
        // if(getUserPrerequsite){
        //   getUserPrerequsite.forEach(record=>{

        //       let idSet = new Set(expiredPrerequisites.map(item => item._id))

        //         if(!idSet.has(record["_id"])){
        //           expiredPrerequisites.push(record)
        //           idSet.add(record["_id"])
        //         }

        //   })
        // }
        
        logger.error("expiredPrerequisites are --"+ JSON.stringify(expiredPrerequisites))
        logger.error("prereqForEvaluation are --"+ JSON.stringify(prereqForEvaluation))
        return {"expiredPrerequisites":expiredPrerequisites,"prereqForEvaluation":prereqForEvaluation}
          
          
          
        
      }


    
  } catch (error) {
    throw error
  }
  
}

function checkLoginPrereqCondtions(userInfo,applicationId,input,businessRoles) {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getLoginPrerequisites`,
        "timestamp": ""
    }
    try {
        // const sessionCreateTime = "2025-08-02T05:36:46.747Z"
        let sessionCreateTimeEpoch = input.payload.authTime || null
        // if(sessionCreateTime){
        //  sessionCreateTimeEpoch = new Date(sessionCreateTime).getTime()
        // }
        // let roleId = "045ca71f-b6e2-4c81-9058-423a8919b37d"
        let currentDateISO = new Date().toISOString()
        let currentDate = currentDateISO.split('T')[0]
        let roleInfo = null
        let firstLogin = true
        let userRoles = []
        let commonRoles = []
        let prereqRoles = []
        let policyInfo = null
        let prereqResponse = null
        let userApprovalUnit1 = null
        let userApprovalUnit2 = null
        let userApprovalUnit3 = null
        let userApprovalUnit4 = null
        let userApprovalUnit5 = null
        let userAccountType = null
        let lastAttemptedLoginPrereq =null
        let lastAttemptedLoginPrereqEpoch = null
        let prereqResponseArray = []
        if (userInfo) {
            if (userInfo.custom_approvalUnit1Code) {
                userApprovalUnit1 = userInfo.custom_approvalUnit1Code
            }
            if (userInfo.custom_approvalUnit2Code) {
                userApprovalUnit2 = userInfo.custom_approvalUnit2Code
            }
            if (userInfo.custom_approvalUnit3Code) {
                userApprovalUnit3 = userInfo.userApprovalUnit3
            }
            if (userInfo.custom_approvalUnit4Code) {
                userApprovalUnit4 = userInfo.userApprovalUnit4
            }
            if (userInfo.custom_approvalUnit5Code) {
                userApprovalUnit5 = userInfo.userApprovalUnit5
            }
            if (userInfo.custom_kyidAccountType) {
                userAccountType = userInfo.custom_kyidAccountType
            }
            if(userInfo.custom_lastAttemptedLoginPrereq){
              lastAttemptedLoginPrereq = userInfo.custom_lastAttemptedLoginPrereq
              logger.error("lastAttemptedLoginPrereq is -> "+ lastAttemptedLoginPrereq)
              lastAttemptedLoginPrereqEpoch = new Date(lastAttemptedLoginPrereq).getTime()
            }
            if(userInfo.effectiveRoles && userInfo.effectiveRoles.length>0){
              userInfo.effectiveRoles.forEach(val=>{
                if(val._refResourceId){
                  userRoles.push(val._refResourceId)
                }
              })
            }
          if(userRoles.length>0 && businessRoles && businessRoles.length>0){
            let commonRoles = userRoles.filter(item=>businessRoles.includes(item))
          }
            logger.error("lastAttemptedLoginPrereqEpoch is --> "+ lastAttemptedLoginPrereqEpoch)
            logger.error("sessionCreateTimeEpoch is --> "+ sessionCreateTimeEpoch)
            if(sessionCreateTimeEpoch !== null && lastAttemptedLoginPrereqEpoch !== null){
              // if(lastAttemptedLoginPrereqEpoch === sessionCreateTimeEpoch){
              // if((lastAttemptedLoginPrereq === sessionCreateTimeEpoch){
              // if(sessionCreateTimeEpoch !== "0"){
              //   firstLogin = false
              // }
            }
          
            
            logger.error("User's Role are --> "+ JSON.stringify(userInfo.effectiveRoles))
            logger.error("businessRoles are --> "+businessRoles)
            logger.error("userRoles are --> "+userRoles)
            logger.error("commonRoles are --> "+ commonRoles)
            const PREREQ_MO_NAME = "managed/alpha_kyid_enrollment_prerequisite"
            let PrereqQueryFilter = null
            const PrereqyRequiredProperties = ["*", "prereqTypeId/*"]
            if (firstLogin === true) {
              
              logger.error("Inside firstLogin True Condtion ::: firstLogin:"+firstLogin)
          
                if(commonRoles.length>0){
                  commonRoles.forEach(roleId=>{
                    
                PrereqQueryFilter = " (LoginTriggerCondition/[accountType eq \"" + userAccountType + "\" ] or applicationId/_refResourceId eq \"" + applicationId
                    + "\" or LoginTriggerCondition/[approvalUnit1 eq \"" + userApprovalUnit1 + "\"] or LoginTriggerCondition/[approvalUnit2 eq \"" + userApprovalUnit2 + "\"] or LoginTriggerCondition/[approvalUnit3 eq \"" + userApprovalUnit3
                    + "\"] or LoginTriggerCondition/[approvalUnit4 eq \"" + userApprovalUnit4 + "\"] or LoginTriggerCondition/[approvalUnit5 eq \"" + userApprovalUnit5 + "\"]) or (roleId/_refResourceId eq \"" + roleId + "\") AND (recordState eq \"0\" or recordState eq 'ACTIVE') "
                    
                    prereqResponse = searchMO(PREREQ_MO_NAME, PrereqQueryFilter, PrereqyRequiredProperties);
                      if (prereqResponse && prereqResponse !== null) {
                          prereqResponse.forEach(prereqRecord => {
                              logger.error("prereqResponse.forEach(prereqRecord --> " + JSON.stringify(prereqRecord))
                              if (prereqRecord.LoginDisplayCriteria && prereqRecord.LoginDueCompletion && prereqRecord.LoginTriggerCondition && prereqRecord.LoginTriggerCondition.triggerStartDate && prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                  validatePrereqConfiguration(input, prereqRecord)
          
                                  if (currentDate >= prereqRecord.LoginTriggerCondition.triggerStartDate && currentDate < prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                      logger.error("Considering For LoginPrereq -->" + prereqRecord.name)
                                      prereqResponseArray.push(prereqRecord)
                                  }
                              }
                              else {
                                  invalidRequestException.message.content = `Invalid Trigger Configuration | Trigger StartDate and Trigger EndDate Missing | PrerequisiteId = ` + prereqResponse._id
                                  invalidRequestException.timestamp = new Date().toISOString()
                                  throw invalidRequestException
      
                              }
                          })
                      }
                    
                  })
                }
              else{
                PrereqQueryFilter = " (LoginTriggerCondition/[accountType eq \"" + userAccountType + "\" ] or applicationId/_refResourceId eq \"" + applicationId
                    + "\" or LoginTriggerCondition/[approvalUnit1 eq \"" + userApprovalUnit1 + "\"] or LoginTriggerCondition/[approvalUnit2 eq \"" + userApprovalUnit2 + "\"] or LoginTriggerCondition/[approvalUnit3 eq \"" + userApprovalUnit3
                    + "\"] or LoginTriggerCondition/[approvalUnit4 eq \"" + userApprovalUnit4 + "\"] or LoginTriggerCondition/[approvalUnit5 eq \"" + userApprovalUnit5 + "\"]) AND (recordState eq \"0\" or recordState eq 'ACTIVE') "
                    
                    prereqResponse = searchMO(PREREQ_MO_NAME, PrereqQueryFilter, PrereqyRequiredProperties);
                      if (prereqResponse && prereqResponse !== null) {
                          prereqResponse.forEach(prereqRecord => {
                              logger.error("prereqResponse.forEach(prereqRecord --> " + JSON.stringify(prereqRecord))
                              if (prereqRecord.LoginDisplayCriteria && prereqRecord.LoginDueCompletion && prereqRecord.LoginTriggerCondition && prereqRecord.LoginTriggerCondition.triggerStartDate && prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                  validatePrereqConfiguration(input, prereqRecord)
          
                                  if (currentDate >= prereqRecord.LoginTriggerCondition.triggerStartDate && currentDate < prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                      logger.error("Considering For LoginPrereq -->" + prereqRecord.name)
                                      prereqResponseArray.push(prereqRecord)
                                  }
                              }
                              else {
                                  invalidRequestException.message.content = `Invalid Trigger Configuration | Trigger StartDate and Trigger EndDate Missing | PrerequisiteId = ` + prereqResponse._id
                                  invalidRequestException.timestamp = new Date().toISOString()
                                  throw invalidRequestException
      
                              }
                          })
                      }
                
              }
                


            }
            else {

              logger.error("Inside firstLogin False Condtion ::: firstLogin:"+firstLogin)

                if(commonRoles.length>0){
                  commonRoles.forEach(roleId=>{
                  logger.error("roleId is "+ roleId)
                    logger.error("applicationId is "+ applicationId)
                // PrereqQueryFilter = "(roleId/_refResourceId eq \"" + roleId + "\") or applicationId/_refResourceId eq \"" + applicationId + "\" AND (recordState eq \"0\" or recordState eq 'ACTIVE') "
                    PrereqQueryFilter = "( (roleId/_refResourceId eq \"" + roleId + "\") or (applicationId/_refResourceId eq \"" + applicationId + "\") ) AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                    
                    prereqResponse = searchMO(PREREQ_MO_NAME, PrereqQueryFilter, PrereqyRequiredProperties);
                      if (prereqResponse && prereqResponse !== null) {
                          prereqResponse.forEach(prereqRecord => {
                              logger.error("prereqResponse.forEach(prereqRecord --> " + JSON.stringify(prereqRecord))
                              if (prereqRecord.LoginDisplayCriteria && prereqRecord.LoginDueCompletion && prereqRecord.LoginTriggerCondition && prereqRecord.LoginTriggerCondition.triggerStartDate && prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                  validatePrereqConfiguration(input, prereqRecord)
          
                                  if (currentDate >= prereqRecord.LoginTriggerCondition.triggerStartDate && currentDate < prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                      logger.error("Considering For LoginPrereq -->" + prereqRecord.name)
                                      prereqResponseArray.push(prereqRecord)
                                  }
                              }
                              else {
                                  invalidRequestException.message.content = `Invalid Trigger Configuration | Trigger StartDate and Trigger EndDate Missing | PrerequisiteId = ` + prereqResponse._id
                                  invalidRequestException.timestamp = new Date().toISOString()
                                  throw invalidRequestException
      
                              }
                          })
                      }
                    
                  })
                }
              else{
                logger.error("Else Condtion Role Not Present")
                PrereqQueryFilter = "applicationId/_refResourceId eq \"" + applicationId + "\" AND (recordState eq \"0\" or recordState eq 'ACTIVE') "
                    
                    prereqResponse = searchMO(PREREQ_MO_NAME, PrereqQueryFilter, PrereqyRequiredProperties);
                      if (prereqResponse && prereqResponse !== null) {
                          prereqResponse.forEach(prereqRecord => {
                              logger.error("prereqResponse.forEach(prereqRecord --> " + JSON.stringify(prereqRecord))
                              if (prereqRecord.LoginDisplayCriteria && prereqRecord.LoginDueCompletion && prereqRecord.LoginTriggerCondition && prereqRecord.LoginTriggerCondition.triggerStartDate && prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                  validatePrereqConfiguration(input, prereqRecord)
          
                                  if (currentDate >= prereqRecord.LoginTriggerCondition.triggerStartDate && currentDate < prereqRecord.LoginTriggerCondition.triggerEndDate) {
                                      logger.error("Considering For LoginPrereq -->" + prereqRecord.name)
                                      prereqResponseArray.push(prereqRecord)
                                  }
                              }
                              else {
                                  invalidRequestException.message.content = `Invalid Trigger Configuration | Trigger StartDate and Trigger EndDate Missing | PrerequisiteId = ` + prereqResponse._id
                                  invalidRequestException.timestamp = new Date().toISOString()
                                  throw invalidRequestException
      
                              }
                          })
                      }

              }

            }


          


          
    }
      else{
                invalidRequestException.message.content = `UserID Not Found`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
        
      }
      logger.error("prereqResponseArray Length is --> "+ prereqResponseArray.length)
      return prereqResponseArray

    } catch (error) {
        throw error
    }

}

// function validatePrereqConfiguration(input,data) {
//      const EXCEPTION_UNEXPECTED_ERROR = {
//         code: "KYID-EUE",
//         content: ""
//     }
//     const EXCEPTION_INVALID_REQUEST = {
//         code: "KYID-IRE",
//         content: ""
//     }

//     const invalidRequestException = {
//         "code": "2",
//         "level": "ERROR",
//         "message": {
//             "code": EXCEPTION_INVALID_REQUEST.code,
//             "content": ""
//         },
//         "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
//         "timestamp": ""
//     }
//     const unexpectedException = {
//         "code": "2",
//         "level": "ERROR",
//         "message": {
//             "code": EXCEPTION_UNEXPECTED_ERROR.code,
//             "content": ""
//         },
//         "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
//         "timestamp": ""
//     }
//   try {
//    const errors = [];
//      const displayCriteria = data.LoginDisplayCriteria ? data.LoginDisplayCriteria : {};
//      const dueCompletion = data.LoginDueCompletion ? data.LoginDueCompletion : {};
//      const triggerCondition = data.LoginTriggerCondition ?  data.LoginTriggerCondition :{};

//     // Validate "days" fields
//     const daysFields = [
//         { key: "LoginDisplayCriteria.frequencyInDays", value: displayCriteria.frequencyInDays },
//         { key: "LoginDueCompletion.gracePeriodinDays", value: dueCompletion.gracePeriodinDays },
//         { key: "LoginDueCompletion.inDays", value: dueCompletion.inDays }
//     ];

//   for (var i = 0; i < daysFields.length; i++) {
//       var field = daysFields[i];
//       var key = field.key;
//       var value = field.value;
  
//       if (value !== null && value !== undefined && value !== "") {
//           if (!isPositiveIntegerString(value)) {
//               errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a positive whole number as string.");
//           }
//       }
//   }

//     // Validate "date" fields
//     const dateFields = [
//         { key: "LoginTriggerCondition.triggerStartDate", value: triggerCondition.triggerStartDate },
//         { key: "LoginTriggerCondition.triggerEndDate", value: triggerCondition.triggerEndDate }
//     ];

// for (var i = 0; i < dateFields.length; i++) {
//     var field = dateFields[i];
//     var key = field.key;
//     var value = field.value;

//     if (value !== null && value !== undefined && value !== "") {
//         if (!isValidDateFormat(value)) {
//             errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a valid date in YYYY-MM-DD format.");
//         }
//     }
// }

//     if (errors.length > 0) {
//         // throw JSON.stringify(("Validation failed: | for Prereq ID +data._id+\n" + errors.join('\n')));
//        // throw JSON.stringify(errors)
//       // throw "Error Occurred"
//       invalidRequestException.message.content = `Validation failed: | for Prereq ID +`+data._id+'\n' + errors.join('\n')
//       invalidRequestException.timestamp = new Date().toISOString()
//       throw invalidRequestException
//     }

//     return true;
    
//   } catch (error) {
//     throw error
//   }
  
// }

function validatePrereqConfiguration(input,data) {
  // logger.error("validatePrereqConfiguration Data is --> "+ JSON.Stringify(data))
     const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
        "timestamp": ""
    }
  try {
   const errors = [];
     const displayCriteria = data.LoginDisplayCriteria ? data.LoginDisplayCriteria : {};
     const dueCompletion = data.LoginDueCompletion ? data.LoginDueCompletion : {};
     const triggerCondition = data.LoginTriggerCondition ?  data.LoginTriggerCondition :{};

    // Validate "days" fields
    const daysFields = [
        { key: "LoginDisplayCriteria.frequencyInDays", value: displayCriteria.frequencyInDays },
        { key: "LoginDueCompletion.gracePeriodinDays", value: dueCompletion.gracePeriodinDays },
        { key: "LoginDueCompletion.inDays", value: dueCompletion.inDays }
    ];

  for (var i = 0; i < daysFields.length; i++) {
      var field = daysFields[i];
      var key = field.key;
      var value = field.value;
  
      if (value !== null && value !== undefined && value !== "") {
          if (!isPositiveIntegerString(value)) {
              errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a positive whole number as string.");
          }
      }
  }

    // Validate "date" fields
    const dateFields = [
        { key: "LoginTriggerCondition.triggerStartDate", value: triggerCondition.triggerStartDate },
        { key: "LoginTriggerCondition.triggerEndDate", value: triggerCondition.triggerEndDate },
        { key: "LoginDueCompletion.dueDate", value: dueCompletion.dueDate}
    ];

for (var i = 0; i < dateFields.length; i++) {
    var field = dateFields[i];
    var key = field.key;
    var value = field.value;

    if (value !== null && value !== undefined && value !== "") {
        if (!isValidDateFormat(value)) {
            errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a valid date in YYYY-MM-DD format.");
        }
    }
}

// Validate "LoginDueCompletion" fields
    const LoginDueCompletion = [
        { key: "LoginDueCompletion.dueDate", value: dueCompletion.dueDate},
        { key: "LoginDueCompletion.gracePeriodinDays", value: dueCompletion.gracePeriodinDays},
        { key: "LoginDueCompletion.inDays", value: dueCompletion.inDays}
        
    ];
    let isGracePeriodPresent = false
    let isCompletionInDays = false
    let isCompletionDueDate = false
    for (var i = 0; i < LoginDueCompletion.length; i++) {
    var field = LoginDueCompletion[i];
    var key = field.key;
    var value = field.value;
    

    if (value !== null && value !== undefined && value !== "") {
        if(key === "LoginDueCompletion.gracePeriodinDays"){
          isGracePeriodPresent = true
        }
        if(key === "LoginDueCompletion.inDays"){
          if(value =="0"){
            isCompletionInDays = false
          }
          else{
            isCompletionInDays = true
          }
          
        }
        if(key === "LoginDueCompletion.dueDate"){
          isCompletionDueDate = true
        }

    }
}
  if(isGracePeriodPresent && !isCompletionInDays && !isCompletionDueDate){
      errors.push("Invalid value for '" + "LoginDueCompletion.inDays" + "' OR  '" + "LoginDueCompletion.dueDate" + "'. dueDate or dueDays is Missing.");
  }

    // Validate "LoginDueCompletion" fields
    const LoginDisplayCriteria = [
        { key: "LoginDisplayCriteria.login", value: displayCriteria.login},
        { key: "LoginDisplayCriteria.skipOption", value: displayCriteria.skipOption}
      ];


    for (var i = 0; i < LoginDisplayCriteria.length; i++) {
    var field = LoginDisplayCriteria[i];
    var key = field.key;
    var value = field.value;
    var allowedValues = ["0","1"]

    if (value !== null && value !== undefined && value !== "") {
      if(!allowedValues.includes(value)){
        errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a valid value 0 or 1");
      }

    }
    else{
        errors.push("Invalid value for '" + key + "': '" + value + "'. Must be a valid value 0 or 1");
      }
}
    if(errors.length > 0) {
        // throw JSON.stringify(("Validation failed: | for Prereq ID +data._id+\n" + errors.join('\n')));
       // throw JSON.stringify(errors)
      // throw "Error Occurred"
      invalidRequestException.message.content = `Validation failed: | for Prereq ID :: `+data._id+'\n' + errors.join('\n')
      invalidRequestException.timestamp = new Date().toISOString()
      throw invalidRequestException
    }

    return true;
    
  } catch (error) {
    throw error
  }
  
}


function createUserPrereq(prereqResponse,userId) {
  try {
        let dueDate = null
        let dueDatewithGrace =null
        let currentDate = new Date().toISOString().split('T')[0]
        let requestBody = {
            preRequisiteType: null,
            enrollmentRequestId: null,
            associatedRoleIds: null,
            createDate: new Date().toISOString(),
            completionDate: null,
            expiryDate: null,
            expiryDateEpoch: null,
            status: "0",
            updateDate: new Date().toISOString(),
            updateDateEpoch: Date.now(),
            createdBy: "KYID-System",
            updatedBy: "KYID-System",
            allowReuseIfDaysOld: null,
            completionDateEpoch: null,
            createDateEpoch: Date.now(),
            displayOrder: null,
            pingApprovalWorkflowId: null,
            recordSource: "KYID-System",
            recordState: "0",
            requestedUserAccountId: userId,
            requesterUserAccountId: userId,
            preRequisiteTypeId: {},
            preRequisiteId: {}
        }
    if(prereqResponse && userId){
      logger.error("createUserPrereq -> createUserPrereq -> "+prereqResponse )
      if(prereqResponse._id){
        requestBody.preRequisiteId = { "_ref": "managed/alpha_kyid_enrollment_prerequisite/" + prereqResponse._id, "_refProperties": {} }
      }
      if(prereqResponse.prereqTypeId){
        requestBody.preRequisiteTypeId = { "_ref": "managed/alpha_kyid_enrollment_prerequisite_type/" + prereqResponse.prereqTypeId._refResourceId, "_refProperties": {} }
      }
      if(prereqResponse.LoginDueCompletion){
        if(prereqResponse.LoginDueCompletion.dueDate && prereqResponse.LoginDueCompletion.dueDate !== null && prereqResponse.LoginDueCompletion.dueDate !== "0" && prereqResponse.LoginDueCompletion.dueDate !==""){
          dueDate = prereqResponse.LoginDueCompletion.dueDate
        }
        else if(prereqResponse.LoginDueCompletion.inDays && prereqResponse.LoginDueCompletion.inDays !==null && prereqResponse.LoginDueCompletion.inDays !=="0" && prereqResponse.LoginDueCompletion.inDays !==""){
          if(getFormatedDaysWithAdditional(prereqResponse.LoginTriggerCondition.triggerStartDate, Number(prereqResponse.LoginDueCompletion.inDays), "add")){
          dueDate = getFormatedDaysWithAdditional(prereqResponse.LoginTriggerCondition.triggerStartDate, Number(prereqResponse.LoginDueCompletion.inDays), "add")
          }
               
                
          }
        logger.error("due Completion Date is--> "+ dueDate)
        if(dueDate && dueDate !== null){
          logger.error("Due Date Present")
              if(prereqResponse.LoginDueCompletion.gracePeriodinDays && prereqResponse.LoginDueCompletion.gracePeriodinDays !==null && prereqResponse.LoginDueCompletion.gracePeriodinDays !=="0" & prereqResponse.LoginDueCompletion.gracePeriodinDays !==""){
                 dueDatewithGrace =  getFormatedDaysWithAdditional(currentDate, Number(prereqResponse.LoginDueCompletion.gracePeriodinDays), "add")
              }
              logger.error("dueDatewithGrace date is --> "+ dueDatewithGrace)
          // if(dueDatewithGrace){
            if(dueDatewithGrace>dueDate){
              requestBody.expiryDate = dueDatewithGrace+"T00:00:00Z"
              requestBody.expiryDateEpoch = new Date(requestBody.expiryDate).getTime()
 
            }
            else{
              requestBody.expiryDate = dueDate+"T00:00:00Z"
              requestBody.expiryDateEpoch = new Date(requestBody.expiryDate).getTime()
            }
          // }
          
        }
        

      }

      if(requestBody.preRequisiteTypeId && requestBody.preRequisiteId ){
        const MOName = "alpha_kyid_enrollment_user_prerequisites"
        const createResponse = createRecord(MOName, requestBody)
        if(createResponse){
          logger.error("createUserPrereq -> createResponse -> "+createResponse )
          return createResponse
        }
        else{
          throw "error occurred while creating userPrereq" +"::FunctionName::createUserPrereq::"
        }
      }
      
    }
    else{
      throw "Prerequsiste or User ID not Present"+"::FunctionName::createUserPrereq::"
    }
    
    
  } catch (error) {
    throw error+"::FunctionName::createUserPrereq::"
  }
  
}

function getFormatedDaysWithAdditional(formatedDate, days, operation) {
  try {
    if (operation == null) {
        operation = "add"
    }
    let date = new Date(formatedDate);
    if (operation === "add") {
        date.setDate(date.getDate() + days - 1 );//
    }
    else {
        date.setDate(date.getDate() - days + 1 );
    }
    // date.setDate(date.getDate() + days);
    var result = date.toISOString().split('T')[0];
    return result;
    
  } catch (error) {
    throw error+"::FunctionName::getFormatedDaysWithAdditional::"
  }

}


function getMORecord(id, roleReturnProperties, MOName) {
    try {
        logger.error("Inside getMORecord Function ")
        logger.error("roleReturnProperties" + roleReturnProperties)
        if (roleReturnProperties === null) {
            roleReturnProperties = ["*"]
        }

        let getResponse = null
        if (MOName && id) {

            getResponse = openidm.read("managed/" + MOName + "/" + id, [roleReturnProperties]);
            logger.error("Inside getMORecord getResponse " + getResponse)
            if (getResponse) {
                return getResponse
            }
            else {
                return null
            }


        }
        return null

    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("getMORecord Error --> " + error)
        throw error

    }
}



function patchMORecord(id,MO_NAME,jsonArray) {
    try {

      const response = openidm.patch("managed/"+MO_NAME+"/" + id, null, jsonArray)
        if (response) {
            return response
        }
        else {
            throw "Error Occurred While Patching MO Record"+"::FunctionName::patchMORecord::"
        }
    } catch (error) {
        throw error
    }

}

function patchUserPrerequisites(input) {
   const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    }
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    }

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchUserPrerequisites`,
        "timestamp": ""
    }
  
  
  try {
       
    if(input){
    const id = request.content.payload.id
    const status = request.content.payload.status
    const MO_NAME = "alpha_kyid_enrollment_user_prerequisites"
    const jsonArray = [{
      "operation": "replace",
      "field": "status",
      "value": status
      
    }]
    const response = openidm.patch("managed/"+MO_NAME+"/" + id, null, jsonArray)
    if(response){
      return response
    }
      else{
        invalidRequestException.message.content = `Response not Found`
        invalidRequestException.timestamp = new Date().toISOString()
         throw invalidRequestException

      }
      
    }
    else{
        invalidRequestException.message.content = `InputNotFound`
        invalidRequestException.timestamp = new Date().toISOString()
        throw invalidRequestException

    }

  } catch (error) {
        /* Throw unexpected exception. */
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException

  }
  
}



function searchMO(MO_NAME, queryFilter, requiredProperties) {
    try {

        const searchResponse = openidm.query(MO_NAME, { "_queryFilter": queryFilter }, requiredProperties);
        if (searchResponse && searchResponse.resultCount > 0) {
            return searchResponse.result
        }
        else {
            return null
        }

    } catch (error) {
        throw error
    }

}


function createRecord(MOName, requestBody) {
    try {

        const response = openidm.create("managed/" + MOName, null, requestBody)

        if (response) {
            return response
        }
        else {
            throw "Error Occurred while creating Enrollment request"+"::FunctionName::createRecord::+MOName"
        }

    } catch (error) {
        throw error+"::FunctionName::createRecord::+MOName"
    }

}


function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now()  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString()  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate)  // Convert the ISO string into a Date object

        var expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000)  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000)  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3)  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6)  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day)  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000)  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return null
        }

        const expiryEpochMillis = new Date(expiryDate).getTime()  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { "expiryEpochMillis": expiryEpochMillis, "expiryDate": expiryDate };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        throw error

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
function getRequestContent(context, request, endpoint) {
    if (request.content) {
        logDebug(context.transactionId, endpoint, "getRequestContent", `Input parameter: ${request.content}`)
    }
    if (request.additionalParameters) {
        logDebug(context.transactionId, endpoint, "getRequestContent", `Input parameter: ${request.additionalParameters}`)
    }


    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-INE",
        content: ""
    }

    let invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": `${endpoint}`,
        "timestamp": ""
    }

    try {
        if (request.content) {
            if (!request.content.payload) {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.payload"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }
            if (!request.content.action) {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.action"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }


            logDebug(context.transactionId, endpoint, "getRequestContent", `Response: ${request.content}`)
            return request.content

        }
        else if (request.additionalParameters) {
          const params = request.additionalParameters;
          const paramKeys = Object.keys(params);
          const allowedKeys = ["logonAppId","authTime","returnURL"];
          if (allowedKeys.sort().toString() === paramKeys.sort().toString()){
            // if (allowedKeys.includes("logonAppId")){
           if(validateReturnURL(request.additionalParameters.returnURL,request.additionalParameters.logonAppId) == false){
              /* Throw invalid request exception. */
              invalidRequestException.message.content = `Invalid request. Invalid returnURL `
              invalidRequestException.timestamp = new Date().toISOString()
  
              throw invalidRequestException
                
              }
            return request
          }
          else{
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.additionalParameters"`+allowedKeys
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
            
          }


        }
        else {

            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        throw error
    }

}

function validateReturnURL(returnURL,logonAppId) {
  try {
    if(logonAppId){
      let applicationURL = null
      let softLogoutURL = null 
      let appURL = null
      let  defaultURL = identityServer.getProperty("esv.focussed.signin.url");
      let getBusinessApp = getMORecord(logonAppId, ["*"], "alpha_kyid_businessapplication")
      if(getBusinessApp){
        logger.error("BusinessApp Present")
        if(getBusinessApp.applicationURL){
          logger.error("getBusinessApp.applicationURL" +getBusinessApp.applicationURL)
          applicationURL = getDomainAndFirstSegment(getBusinessApp.applicationURL)
          if(getBusinessApp.softLogoutURL){
            softLogoutURL = getDomainAndFirstSegment(getBusinessApp.softLogoutURL)
          }
          
          defaultURL = getDomainAndFirstSegment(defaultURL)
          returnURL = decodeURIComponent(returnURL)
          if(getReturnURLAlt(returnURL)){
            appURL = getReturnURLAlt(returnURL)
            appURL = getDomainAndFirstSegment(appURL)
          }
          returnURL = getDomainAndFirstSegment(returnURL)
          
          
        }
        logger.error("softLogoutURL is -->  "+ softLogoutURL)
        logger.error("applicationURL is --> "+ applicationURL)
        logger.error("ReturnURL is --> "+ returnURL)
        logger.error("Default URL is --> "+ defaultURL)
        if(returnURL === applicationURL || returnURL === softLogoutURL || returnURL === defaultURL ){
            return true
          }
          else{
            return false
          }
        
       
        
      }
      else{
        logger.error("BusinessApp Not Present validateReturnURL Function")
        return false
      }

      
    }
    else{
      return false
    }
    
    
    
    
    
  } catch (error) {
    logger.error("Execption Occurred While  "+ error)
    return false
  }
  
}

function getDomainAndFirstSegment(url) {
  const match = url.match(/^https?:\/\/[^\/]+/)
    if (match) {
      logger.error("Inside Match")
        const baseUrl = match ? match[0] : ""
      logger.error("Base URL is --> "+ baseUrl)
        return baseUrl
    }
  else{
    logger.error("Not Matched")
  }
}

function getReturnURLAlt(url) {
    const match = url.match(/[?&]returnURL=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function isValidDateFormat(dateString) {
  // Regular expression for YYYY-MM-DD format
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  if (!regex.test(dateString)) {
    return false;
  }

  // Further validate the actual date (e.g., no Feb 30)
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(Number);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

function isPositiveIntegerString(str) {
  // Regular expression: one or more digits, no decimals, no signs
  const regex = /^\d+$/;
  return typeof str === 'string' && regex.test(str);
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
function generateResponse(responseCode, transactionId, message, payload) {

    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "UNERROR",
        message: "An unexpected error occured while processing the request."
    }

    if (payload) {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: message,
            payload: payload
        }
    } else if (message) {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: message
        }
    } else {
        return {
            responseCode: responseCode,
            transactionId: transactionId,
            message: {
                code: EXCEPTION_UNEXPECTED_ERROR.code,
                message: EXCEPTION_UNEXPECTED_ERROR.content
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
function logDebug(transactionId, endpointName, functionName, message) {
    logger.info(JSON.stringify({
        "transactionId": transactionId,
        "endpointName": endpointName,
        "functionName": functionName,
        "message": message
    }))
}

/**
 * @name logException
 * This function logs exception.
 *
 * @param {JSON} exception
 */
function logException(exception) {
    logger.error(JSON.stringify(exception))
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
