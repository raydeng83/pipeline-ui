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

    const ACTION_INVITE = "1"
    const ACTION_PATCH = "2"
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"
    const ACTION_RESEND = "5"
    const ACTION_MOCK = "10" //MOCK

    const ENDPOINT_NAME = "endpoint/invitation"
    const MO_OBJECT_NAME = "managed/alpha_kyid_enrollment_contextId/"


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
        "transactionId": "349834038398340",
        "payload": {}
    }

    let response = null

    try {
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
        let result
        switch (request.method) {

            case REQUEST_POST:
                /* Get request content */

                const action = requestContent.action

                /* Create action */
                if (action == ACTION_INVITE) {
                    input.payload = requestContent.payload
                    /* Create access record. */
                    //response = createAccess(input)
                    result = { "message": "Email Sent Successfully" }
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                } else if (action == ACTION_SEARCH) {
                    input.payload = requestContent.payload
                    /* Search access records. */
                    result = searchInvitationV2(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                } else if (action == ACTION_DELETE) {
                    input.payload = requestContent.payload
                    /* Search access records. */
                    response = searchAccess(input)
                } else if (action == ACTION_RESEND) {
                    input.payload = requestContent.payload

                    result = resendInvitation(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })

                } else if (action == ACTION_PATCH) {
                    input.payload = requestContent.payload

                    result = cancelInvite(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })

                } else if (action == ACTION_MOCK) {
                    result = generateMockResponse()
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                }
                break;
            case REQUEST_GET:
                /* Get Invitation By ID */
                input["payload"] = requestContent
                result = getInvitation(input)
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

//Mock Response 

function generateMockResponse() {
    try {
        const mockJSON = {
            "invitations": [
                {
                    "invitationId": "INV12345",
                    "applicationName": {
                        "en": "Test Application",
                        "es": "Test Application"
                    },
                    "applicationLogo": "https://example.com/logo12345.png",
                    "status": {
                        "en": "Active",
                        "es": "Activo"
                    },
                    "action": {
                        "en": "Accept",
                        "es": "Aceptar"
                    },
                    "invitedBy": "johndoe@mail.com",
                    "invitationDate": "2025-08-01",
                    "invitationExpiryDate": "2025-08-15",
                    "roles": [
                        {
                            "roleName": {
                                "en": "Administrator",
                                "es": "Administrador"
                            },
                            "tag": {
                                "en": "Active",
                                "es": "Activo"
                            }
                        },
                        {
                            "roleName": {
                                "en": "Viewer",
                                "es": "Espectador"
                            },
                            "tag": {
                                "en": "Accept",
                                "es": "Aceptar"
                            }
                        }
                    ]
                },
                {
                    "invitationId": "INV67890",
                    "applicationName": {
                        "en": "Test Application",
                        "es": "Test Application"
                    },
                    "applicationLogo": "https://example.com/logo67890.png",
                    "status": {
                        "en": "Active",
                        "es": "Activo"
                    },
                    "action": {
                        "en": "Accept",
                        "es": "Aceptar"
                    },
                    "invitedBy": "johndoe@mail.com",
                    "invitationDate": "2025-07-20",
                    "invitationExpiryDate": "2025-08-05",
                    "roles": [
                        {
                            "roleName": {
                                "en": "Editor",
                                "es": "Editor"
                            },
                            "tag": {
                                "en": "Active",
                                "es": "Activo"
                            }
                        }
                    ]
                },
                {
                    "invitationId": "INV54321",
                    "applicationName": {
                        "en": "Test Application",
                        "es": "Test Application"
                    },
                    "applicationLogo": "https://example.com/logo54321.png",
                    "status": {
                        "en": "Active",
                        "es": "Activo"
                    },
                    "action": {
                        "en": "Accept",
                        "es": "Aceptar"
                    },
                    "invitedBy": "johndoe@mail.com",
                    "invitationDate": "2025-06-15",
                    "invitationExpiryDate": "2025-07-01",
                    "roles": [
                        {
                            "roleName": {
                                "en": "Contributor",
                                "es": "Colaborador"
                            },
                            "tag": {
                                "en": "Inactive",
                                "es": "Inactivo"
                            }
                        }
                    ]
                }
            ]
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
 * @name searchInvitationV2
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchInvitationV2(input) {

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
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "searchAccount", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
            let isDelegationContext = false
            if (input.payload.isDelegationContext) {
                isDelegationContext = input.payload.isDelegationContext
            }

            if (input._MO_OBJECT_NAME && queryFilter) {
                logDebug(input.transactionId, input.endPoint, "searchAccount", `Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */

                    let uniqueItems = []
                    const accessResult = []
                    let businessApp = null
                    let localizedContent
                    let deleActiveInvitation

                    /* Iterate through search response*/
                    if (searchResponse.result) {
                        const invitations = [];
                        if (isDelegationContext === true) {
                            searchResponse.result.forEach(entry => {
                                deleActiveInvitation = {
                                    invitationId: entry._id,
                                    status: entry.status,
                                    invitedBy: { userId: null, givenName: null, sn: null, mail: null },
                                    invitationDate: entry.createDate.split("T")[0],
                                    invitationExpiryDate: entry.expiryDate.split("T")[0],
                                    roles: []
                                }
                                var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                if (invitedByInfo) {
                                    if (invitedByInfo._id) {
                                        deleActiveInvitation.invitedBy.userId = invitedByInfo._id
                                    }
                                    if (invitedByInfo.givenName) {
                                        deleActiveInvitation.invitedBy.givenName = invitedByInfo.givenName
                                    }
                                    if (invitedByInfo.sn) {
                                        deleActiveInvitation.invitedBy.sn = invitedByInfo.sn
                                    }
                                    if (invitedByInfo.mail) {
                                        deleActiveInvitation.invitedBy.mail = invitedByInfo.mail
                                    }

                                }
                                var roleJSON = {
                                    roleId: null,
                                    roleName: null,
                                    roleDescription: null,
                                    tags: []
                                }
                                if (entry.applicationRoles) {
                                    entry.applicationRoles.forEach(role => {
                                        var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                                        if (roleInfo) {
                                            roleJSON.roleId = roleInfo._id
                                            if (roleInfo.content) {
                                                if (roleInfo.content[0].name) {
                                                    roleJSON.roleName = roleInfo.content[0].name
                                                }
                                                if (roleInfo.content[0].description) {
                                                    roleJSON.roleDescription = roleInfo.content[0].description
                                                }
                                            }
                                        }

                                    })
                                }
                                deleActiveInvitation.roles.push(roleJSON)

                            })
                            if (deleActiveInvitation.roles.length == 0) {
                                deleActiveInvitation.roles.push(roleJSON)
                            }

                            return { "invitations": deleActiveInvitation }

                        }
                        else {

                            searchResponse.result.forEach(entry => {
                                const grouped = {};
                                entry.applicationRoles.forEach(role => {
                                    const appId = role.applicationId;
                                    if (!grouped[appId]) {
                                        grouped[appId] = {
                                            invitationId: entry._id,
                                            applicationId: appId,
                                            applicationName: null,
                                            applicationDescription: null,
                                            applicationLogo: null,
                                            status: entry.status,
                                            invitedBy: { userId: null, givenName: null, sn: null, mail: null },
                                            invitationDate: entry.createDate.split("T")[0],
                                            invitationExpiryDate: entry.expiryDate.split("T")[0],
                                            roles: []
                                        };
                                    }
                                    if (entry.requesterUserAccountId) {
                                        var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                        if (invitedByInfo) {
                                            if (invitedByInfo._id) {
                                                grouped[appId].invitedBy.userId = invitedByInfo._id
                                            }
                                            if (invitedByInfo.givenName) {
                                                grouped[appId].invitedBy.givenName = invitedByInfo.givenName
                                            }
                                            if (invitedByInfo.sn) {
                                                grouped[appId].invitedBy.sn = invitedByInfo.sn
                                            }
                                            if (invitedByInfo.mail) {
                                                grouped[appId].invitedBy.mail = invitedByInfo.mail
                                            }

                                        }

                                    }
                                    const appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                                    if (appInfo) {
                                        if (appInfo.logoURL) {
                                            grouped[appId].applicationLogo = appInfo.logoURL
                                        }
                                        if (appInfo.content) {
                                            if (appInfo.content[0].title) {
                                                grouped[appId].applicationName = appInfo.content[0].title
                                            }
                                            if (appInfo.content[0].content) {
                                                grouped[appId].applicationDescription = appInfo.content[0].content
                                            }
                                        }
                                    }
                                    var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                                    var roleJSON = {
                                        roleId: null,
                                        roleName: null,
                                        roleDescription: null,
                                        tags: []
                                    }
                                    roleJSON.roleId = role.roleId
                                    if (roleInfo) {
                                        if (roleInfo.content) {
                                            if (roleInfo.content[0].name) {
                                                roleJSON.roleName = roleInfo.content[0].name
                                            }
                                            if (roleInfo.content[0].description) {
                                                roleJSON.roleDescription = roleInfo.content[0].description
                                            }
                                        }

                                        grouped[appId].roles.push(roleJSON);

                                    }

                                })
                                Object.values(grouped).forEach(invite => invitations.push(invite));
                            })

                            return { "invitations": invitations }
                        }
                    } else {
                        return []
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

/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchInvitation(input) {

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
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "searchAccount", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            const isUniqueResponseByRole = input.payload.isUniqueResponseByRole

            if (input._MO_OBJECT_NAME && queryFilter) {
                logDebug(input.transactionId, input.endPoint, "searchAccount", `Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */

                    let uniqueItems = []
                    const accessResult = []
                    let businessApp = null
                    let localizedContent

                    /* Iterate through search response*/
                    if (searchResponse.result) {

                        return searchResponse.result
                    } else {
                        return []
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

/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function getInvitation(input) {
    logger.error("getInvitation Input --> " + JSON.stringify(input))

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
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchInvitation`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "getInvitation", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            const id = input.payload.id
            // const returnProperties = input.payload.returnProperties
            const returnProperties = ["*"]
            const userReturnProperties = ["givenName", "sn", "mail"]
            const roleReturnProperties = ["content"]
            const ROLE_MO_OBJECT_NAME = "alpha_role"
            const USER_MO_OBJECT_NAME = "alpha_user"
            // const queryFilter = input.payload.queryFilter
            // const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            // const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            // const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
            let roleInfo = null
            let userInfo = null
            let finalResponse = {
                createDate: null,
                expiryDate: null,
                _id: null,
                roles: [],
                invitedBy: null

            }

            if (input._MO_OBJECT_NAME) {
                logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME + id
                logger.error("input._MO_OBJECT_NAME --> " + input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse is -->" + searchResponse)
                if (searchResponse) {
                    if (searchResponse.createDate) {
                        finalResponse.createDate = searchResponse.createDate
                    }
                    if (searchResponse.expiryDate) {
                        finalResponse.expiryDate = searchResponse.expiryDate
                    }

                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                    if (searchResponse.applicationRoles) {
                        searchResponse.applicationRoles.forEach(val => {
                            if (val.roleId) {
                                roleInfo = getMORecord(val.roleId, roleReturnProperties, ROLE_MO_OBJECT_NAME)
                                logger.error("roleInfo" + roleInfo)
                                if (roleInfo && roleInfo !== null) {
                                    if (roleInfo.content) {
                                        finalResponse.roles.push({ "displayName": roleInfo.content[0].name, "displayDescription": roleInfo.content[0].description })
                                    }



                                }

                            }

                        })


                        if (searchResponse.requesterUserAccountId) {
                            userInfo = getMORecord(searchResponse.requesterUserAccountId, userReturnProperties, USER_MO_OBJECT_NAME)
                            if (userInfo) {
                                finalResponse.invitedBy = { "givenName": userInfo.givenName, "sn": userInfo.sn, "mail": userInfo.mail }
                            }
                        }
                    }
                    return finalResponse


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
            logger.error("`An unexpected error occured. Error")
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("`An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }

}

function patchMORecord(id, payload) {
    try {
          let dateTimeISO = new Date().toISOString();
        let currentEpoch = Date.now();
        let jsonArray = []
        let jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": "2"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "/updatedDateEpoch",
            "value": currentEpoch
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "/updatedByID",
            "value": "KYID-System"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "/updatedBy",
            "value": "KYID-System"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "/updateDate",
            "value": dateTimeISO
        }

        jsonArray.push(jsonObj)
        const response = openidm.patch("managed/alpha_kyid_enrollment_contextId/" + id, null, jsonArray)
        if (response) {
            return response
        }
        else {
            throw "Error Occurred While Patching MO Record"
        }
    } catch (error) {
        throw error
    }

}


/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function cancelInvite(input) {
    logger.error("getInvitation Input --> " + JSON.stringify(input))

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
        "logger": `${input._ENDPOINT_NAME}/cancelInvite`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/cancelInvite`,
        "timestamp": ""
    }

    try {
        let returnProperties = ["*"]
        logDebug(input.transactionId, input.endPoint, "getInvitation", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {

            const id = input.payload.invitationId
            let roleInfo = null
            let userInfo = null
            let patchResponse = null

            if (input._MO_OBJECT_NAME) {
                logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME + id
                logger.error("input._MO_OBJECT_NAME --> " + input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse is -->" + searchResponse)
                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */


                    if (searchResponse.status !== "2" && searchResponse.status !== "1") {
                        patchResponse = patchMORecord(id)
                        // patchResponse = true
                        if (patchResponse) {
                            return { "message": "Invitation Cancelled Successfully" }
                            // return patchResponse
                        }
                        else {
                            invalidRequestException.message.content = `Error Occurred While Cancelling The Invitation`
                            invalidRequestException.timestamp = new Date().toISOString()

                            throw invalidRequestException

                        }
                    }

                    else {
                        /* Throw invalid request exception. */
                        invalidRequestException.message.content = `Request is State is ` + searchResponse.status
                        invalidRequestException.timestamp = new Date().toISOString()

                        throw invalidRequestException
                    }



                } else {
                    invalidRequestException.message.content = `Invalid request. Record Not Found`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException
                }
            } else {

                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }

        } else {
            /* Throw invalid request exception. */
            logger.error("`An unexpected error occured. Error")
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "queryFilter"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("`An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }

}


// Send Email
function sendEmail(contextId, givenName, sn, mail) {
    try {
        logger.error("contextId is -->" + contextId)
        var params = new Object();
        var phoneContact = null;
        var emailContact = null;
        var appName = "KYID Helpdesk";
        try {

            var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", { _queryFilter: 'name eq "' + appName + '"' }, ["phoneContact", "emailContact"]);

            phoneContact = userQueryResult2.result[0].phoneContact[0].phoneNumber
            emailContact = userQueryResult2.result[0].emailContact[0].emailAddress

        }
        catch (error) {
            logger.error("Error in catch of helpdesk retrieval :: => " + error);
        }
        params.templateName = "kyid2B1AccessDelegationInviteTemplate";
        params.to = mail;
        params._locale = "en";
        params.object = {
            "phoneContact": phoneContact,
            "givenName": givenName,
            "sn": sn,
            requestUri: null

        };

        params.object.requestUri = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=RIDP_kyid_2B1_MasterLogin&contextId=" + contextId

        var response = openidm.action("external/email", "sendTemplate", params);
        logger.error("Email Sent SuccessFully to: " + mail)
        if (response) {
            return response
        }
        else {
            // invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            // invalidRequestException.timestamp = new Date().toISOString()

            throw "invalidRequestException"
        }

    }
    catch (error) {
        logger.error("Error Occurred while sending Email to ::" + mail + " error::" + error);
        /* Throw invalid request exception. */
        throw error

    }
}


/**
 * @name searchInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function resendInvitation(input) {
    logger.error("resendInvitation Input --> " + JSON.stringify(input))

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
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/resendInvitation`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "resendInvitation", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if  */
        if (input.payload) {
            const id = input.payload.invitationId
            // const returnProperties = input.payload.returnProperties
            const returnProperties = ["*"]
            let givenName = null
            let sn = null
            let mail = null
            // const queryFilter = input.payload.queryFilter
            // const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
            // const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
            // const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
            let roleInfo = null
            let userInfo = null

            if (input._MO_OBJECT_NAME) {
                logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME + id
                logger.error("input._MO_OBJECT_NAME --> " + input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse is -->" + searchResponse)
                if (searchResponse) {
                    // logDebug(input.transactionId,input.endPoint,"resendInvitation",`Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                    if (searchResponse.expiryDateEpoch > Date.now() && searchResponse.status === "0" && (searchResponse.recordState === "0" || searchResponse.recordState == "ACTIVE") && searchResponse.requestedUserAccountAttibutes) {
                        logger.error("Meeting Condtions")
                        if (searchResponse.requestedUserAccountAttibutes.length > 0) {
                            for (let i = 0; i < searchResponse.requestedUserAccountAttibutes.length; i++) {
                                if (searchResponse.requestedUserAccountAttibutes[i].attributeName == "givenName" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    givenName = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if (searchResponse.requestedUserAccountAttibutes[i].attributeName == "sn" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    sn = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if (searchResponse.requestedUserAccountAttibutes[i].attributeName == "mail" && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    mail = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }

                            }
                            if (givenName !== null && sn !== null && mail !== null) {
                                logger.error("Sending Invitation ")
                                const sendEmailResponse = sendEmail(searchResponse._id, givenName, sn, mail)
                                if (sendEmailResponse) {
                                    return { "message": "Email Sent Successfully" }

                                }
                            }
                            else {

                                /* Throw invalid request exception. */
                                unexpectedException.message.content = `Invalid request. mail or givenName or sn is null or blank"`
                                unexpectedException.timestamp = new Date().toISOString()

                                throw unexpectedException
                            }
                        }
                        else {

                            /* Throw invalid request exception. */
                            invalidRequestException.message.content = `Invalid request. The request does not contain requestedUserAccountAttibutes"`
                            invalidRequestException.timestamp = new Date().toISOString()

                            throw invalidRequestException

                        }

                    }
                    else {

                        /* Throw invalid request exception. */
                        invalidRequestException.message.content = `Invalid request. Invitation is Expired"`
                        invalidRequestException.timestamp = new Date().toISOString()

                        throw invalidRequestException
                    }



                } else {

                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `Invalid request. Record not found"`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException
                }
            } else {

                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. Managed Object Not Found"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw invalidRequestException
            }

        } else {
            /* Throw invalid request exception. */
            logger.error("`An unexpected error occured. Error")
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("`An unexpected error occured. Error" + error)
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
            logger.error("request.additionalParameters are " + JSON.stringify(request.additionalParameters))
            return request.additionalParameters

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
