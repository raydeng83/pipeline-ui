
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
var UUID = java.util.UUID;
var dateTime = new Date().toISOString();
var transactionid = UUID.randomUUID().toString();
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
    const ACTION_DELETE = "3"
    const ACTION_SEARCH = "4"
    const ACTION_AVAILABLEROLES = "5"
    const ACTION_SIMPLE_DELETE = "6"


    const ENDPOINT_NAME = "endpoint/access_v2B"
    const MO_OBJECT_NAME = "managed/alpha_kyid_access/"

    let requesterAccountId
    if (context.current.parent.parent.parent.parent.parent.rawInfo) {
        requesterAccountId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
    }


    let result = null

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
    let input = {
        "_ENDPOINT_NAME": ENDPOINT_NAME,
        "_MO_OBJECT_NAME": MO_OBJECT_NAME,
        "_PROPERTIES": OBJECT_PROPERTIES,
        "transactionId": "349834038398340",
        "payload": {}
    }
    let viewName = null
    try {
        switch (request.method) {

            case REQUEST_POST:
                /* Get request content */
                const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
                const action = requestContent.action

                /* Create action */
                if (action == ACTION_CREATE) {
                    input.payload = requestContent.payload
                    // input.payload.requester = {
                    //     displayId: requesterAccountId
                    // }
                    /* Create access record. */
                    result = createAccess(input)

                } else if (action == ACTION_SEARCH) {
                    input.payload = requestContent.payload
                    viewName = input.payload.view
                    /* Search access records. */
                    result = searchAccess(input)

                } else if (action == ACTION_DELETE) {
                    input.payload = requestContent.payload

                    input.payload.requester = {
                        displayId: requesterAccountId ? requesterAccountId : input.payload.id
                    }

                    /* Delete access records. */
                    result = deleteAccess(input)
                } else if (action == ACTION_SIMPLE_DELETE) {
                    input.payload = requestContent.payload

                    input.payload.requester = {
                        displayId: requesterAccountId ? requesterAccountId : input.payload.id
                    }

                    /* Delete access records. */
                    result = simpleDeleteAccess(input)
                } else if (action == ACTION_AVAILABLEROLES) {
                    input.payload = requestContent.payload
                    viewName = input.payload.view

                    /* Available access records. */
                    result = getAvailableRoles(input)
                }
                break

            case REQUEST_GET:
                const requestParameters = request.additionalParameters
                const id = requestParameters.id
                viewName = requestParameters.view
                if (id) {
                    input.payload.id = id
                    /* Get access */
                    result = getAccess(input)
                } else {

                    const EXCEPTION_INVALID_REQUEST = {
                        code: "KYID-IRE",
                        content: ""
                    }

                    const invalidRequestException = {
                        "code": "2",
                        "level": "ERROR",
                        "message": {
                            "code": "KYID-EUE",
                            "content": ""
                        },
                        "logger": `${input._ENDPOINT_NAME}`,
                        "timestamp": ""
                    }
                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw throwException(JSON.stringify(invalidRequestException))
                }
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
        /* View name */
        if (viewName) {
            return generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                result: getView(input, viewName, result)

            })
        } else {
            return generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                result: result
            })
        }
    } catch (error) {

        logException(input.transactionId, error)

        if (error) {
            /* generate error response */
            return generateResponse(error.type, input.transactionId, error.message)
        } else {
            return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
    }
})()


/**
 * @name createAccess
 * @description Method creates access record
 * 
 * @param {JSON} input 
 * @returns JSON access record
 */
function createAccess(input) {
    /**
     *  requesterUserIdAttributeName
     *  requesterUserAttributeValue
     *  requestedUserIdAttributeName
     *  requestedUserAttributeValue
     *  businessApplicationIdAttributeName
     *  businessApplicationAttributeValue
     *  roleIdAttributeName
     *  roleAttributeValue
     *  originalDelegatorUserIdAttributeName
     *  originalDelegatorUserAttributeValue
     *  currentDelegatorUserIdAttributeName
     *  currentDelegatorUserAttributeValue
     *  orgId
     *  orgType
     *  businessKeyName
     *  businessKeyValue
     */
    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYIDIRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/createAccess`,
        "timestamp": ""
    }

    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchAccess`,
        "timestamp": ""
    }

    const _MO_USER = "managed/alpha_user/"
    const _MO_APPLICATION = "managed/alpha_kyid_businessapplication/"
    const _MO_ROLE = "managed/alpha_role/"

    const responsePayload = []
    let accessRequest = null
    try {

        /* Check if payload is present */
        if (input.payload) {
            logger.error("input payload: " + JSON.stringify(input.payload))
            logger.error("input payload requests: " + JSON.stringify(input.payload.requests))

            logDebug(input.transactionId, input.endPoint, "createAccess", `Input parameter: ${JSON.stringify(input.payload)}`)

            let currentTimeinEpoch = Date.now()
            let currentDate = new Date().toISOString()

            let inputAccessRequests = input.payload.requests
            let inputRequesterUser = input.payload.requester
            let inputRequestedUser = input.payload.requestedUser
            let isSyncRequest = input.payload.isSyncRequest

            let searchResult

            if (inputAccessRequests) {
                const RECORD_STATE_ACTIVE = "0"
                const RECORD_SOURCE_KYID = "1"
                const recordSearchQuery = []
                let requesterUser
                let requestedUser
                let originalDelegatorUser
                let currentDelegatorUser
                let app
                let role
                let orgId
                let orgType
                let businessKey
                let accessPolicy = ""
                let allowAccessProvisioning = true
                let requestedUserPayload = {}
                let requesterUserPayload = {}

                // var requestPayload = {}
                /* Get requester user */
                if (inputRequesterUser.userIdAttributeName && inputRequesterUser.userIdAttributeValue && inputRequesterUser.userIdAttributeName.length > 0 && inputRequesterUser.userIdAttributeValue.length > 0) {

                    requesterUser = searchObjectByIdAttributeValue(input, _MO_USER, inputRequesterUser.userIdAttributeName, inputRequesterUser.userIdAttributeValue)
                    /* Check if the requested user present within the KYID. */

                    if (requesterUser && requesterUser._id) {
                        requesterUserPayload.requesterUserIdentifier = requesterUser._id

                        requesterUserPayload.requesterUser = {
                            "_ref": `managed/alpha_user/${requesterUser._id}`
                        }

                    } else {
                        /* Throw invalid accessRequest exception. */
                        invalidRequestException.message.content = `Invalid accessRequest. The requested user record does not present in KYID for parameter name: ${inputRequesterUser.userIdAttributeName} parameter value: ${inputRequesterUser.userIdAttributeValue}`
                        invalidRequestException.timestamp = new Date().toISOString()
                        throw throwException(JSON.stringify(invalidRequestException))
                    }

                } else {
                    /* Throw invalid accessRequest exception. */
                    invalidRequestException.message.content = `Invalid accessRequest. The request does not contain the required parameters. Missing parameter(s): "input.payload.requester"`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw throwException(JSON.stringify(invalidRequestException))
                }



                /* Get requested user */
                if (inputRequestedUser.userIdAttributeName && inputRequestedUser.userIdAttributeValue) {


                    requestedUser = searchObjectByIdAttributeValue(input, _MO_USER, inputRequestedUser.userIdAttributeName, inputRequestedUser.userIdAttributeValue)
                    /* Check if the requested user present within the KYID. */
                    if (requestedUser && requestedUser._id) {
                        requestedUserPayload.userIdentifier = requestedUser._id
                        requestedUserPayload.user = {
                            "_ref": `managed/alpha_user/${requestedUser._id}`
                        }

                        let searchInput = input
                        searchInput.payload = {
                            queryFilter: `userIdentifier eq '${requestedUser._id}'`,
                            returnProperties: ["*", "app/*", "role/*", "user/*", "originalDelegator/*", "currentDelegator/*"]
                        }

                        /* Search access */
                        searchResult = searchAccess(searchInput)

                    } else {
                        /* Throw invalid accessRequest exception. */
                        invalidRequestException.message.content = `Invalid accessRequest. The requested user record does not present in KYID for parameter name: ${accessRequest.requestedUserIdAttributeName} parameter value: ${accessRequest.requestedUserAttributeValue}`
                        invalidRequestException.timestamp = new Date().toISOString()

                        throw throwException(JSON.stringify(invalidRequestException))
                    }

                } else {
                    /* Throw invalid accessRequest exception. */
                    invalidRequestException.message.content = `Invalid accessRequest. The request does not contain the required parameters. Missing parameter(s): "input.payload.requests.requestedUserIdAttributeName, input.payload.requests.requestedUserIdAttributeValue"`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw throwException(JSON.stringify(invalidRequestException))
                }
                let kogRequestPayload = {}
                let provisioningRoles = []

                /* Iterate through access requestes */
                for (accessRequest of inputAccessRequests) {
                    let accessSearchQuery = ""
                    logger.error("access request: " + JSON.stringify(accessRequest))
                    logger.error("input access requests: " + inputAccessRequests)
                    accessPolicy = ""
                    kogRequestPayload = {
                        ApplicationName: null,
                        RoleName: null,
                        OrginalDelegatorKOGID: null,
                        CurrentDelegatorKOGID: null,
                        KOGOrgID: null,
                        OrgBusinessKeyID: null
                    }
                    let requestPayload = null
                    requestPayload = {

                        originalDelegatorIdentifier: null,
                        currentDelegatorIdentifier: null,

                        assignmentDate: currentDate,
                        assignmentDateEpoch: currentTimeinEpoch,
                        isForwardDelegable: false,
                        createdBy: requesterUser.userName,
                        createDate: currentDate,
                        createDateEpoch: currentTimeinEpoch,
                        updatedBy: requesterUser.userName,
                        updateDate: currentDate,
                        updateDateEpoch: currentTimeinEpoch,
                        recordState: RECORD_STATE_ACTIVE,
                        recordSource: RECORD_SOURCE_KYID

                    }

                    try {

                        requestPayload.userIdentifier = requestedUserPayload.userIdentifier
                        requestPayload.user = requestedUserPayload.user
                        accessSearchQuery = accessSearchQuery.concat(`userIdentifier eq '${requestPayload.userIdentifier}'`)

                        if (accessRequest.businessApplicationIdAttributeName && accessRequest.businessApplicationAttributeValue) {

                            app = searchObjectByIdAttributeValue(input, _MO_APPLICATION, accessRequest.businessApplicationIdAttributeName, accessRequest.businessApplicationAttributeValue)
                            logger.error("app info: " + JSON.stringify(app))
                            if (app && app._id) {
                                requestPayload.appIdentifier = app._id
                                requestPayload.app = {
                                    _ref: `managed/alpha_kyid_businessapplication/${app._id}`
                                }
                                kogRequestPayload.ApplicationName = app.name
                                accessSearchQuery = accessSearchQuery.concat(` AND appIdentifier eq '${requestPayload.appIdentifier}'`)

                            } else {
                                /* Throw invalid accessRequest exception. */
                                invalidRequestException.message.content = `Invalid accessRequest. The app record does not present in KYID for parameter name: ${accessRequest.businessApplicationIdAttributeName} parameter value: ${accessRequest.businessApplicationAttributeValue}`
                                invalidRequestException.timestamp = new Date().toISOString()

                                throw throwException(JSON.stringify(invalidRequestException))
                            }
                        } else {
                            /* Throw invalid request exception. */
                            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.requests.businessApplicationIdAttributeName, input.payload.requests.businessApplicationIdAttributeValue"`
                            invalidRequestException.timestamp = new Date().toISOString()

                            throw throwException(JSON.stringify(invalidRequestException))
                        }

                        if (accessRequest.roleIdAttributeName && accessRequest.roleAttributeValue) {
                            let roleFilter = {
                                "_queryFilter": `(name eq '${accessRequest.roleAttributeValue}' AND businessAppId/_refResourceId eq '${app._id}')`
                            }

                            logger.error("roleFilter: " + roleFilter)

                            role = searchObjectByQuery(input, _MO_ROLE, roleFilter)

                            if (role && role._id) {
                                requestPayload.roleIdentifier = role._id
                                requestPayload.role = {
                                    _ref: `managed/alpha_role/${role._id}`
                                }
                                kogRequestPayload.RoleName = role.name
                                accessSearchQuery = accessSearchQuery.concat(` AND roleIdentifier eq '${requestPayload.roleIdentifier}'`)

                                !provisioningRoles.includes(role._id) ? provisioningRoles.push(role._id) : ""

                            } else {
                                /* Throw invalid request exception. */
                                invalidRequestException.message.content = `Invalid accessRequest. The role record does not present in KYID for parameter name: ${accessRequest.roleIdAttributeName} parameter value: ${accessRequest.roleAttributeValue}`
                                invalidRequestException.timestamp = new Date().toISOString()

                                throw throwException(JSON.stringify(invalidRequestException))
                            }
                        } else {
                            /* Throw invalid accessRequest exception. */
                            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.requests.roleIdAttributeName, input.payload.requests.roleIdAttributeValue"`
                            invalidRequestException.timestamp = new Date().toISOString()

                            throw throwException(JSON.stringify(invalidRequestException))
                        }

                        if (accessRequest.originalDelegatorUserIdAttributeName && accessRequest.originalDelegatorUserAttributeValue) {
                            originalDelegatorUser = searchObjectByIdAttributeValue(input, _MO_USER, accessRequest.originalDelegatorUserIdAttributeName, accessRequest.originalDelegatorUserAttributeValue)

                            if (originalDelegatorUser && originalDelegatorUser._id) {
                                requestPayload.originalDelegatorIdentifier = originalDelegatorUser._id
                                requestPayload.originalDelegator = {
                                    "_ref": `managed/alpha_user/${originalDelegatorUser._id}`
                                }
                                kogRequestPayload.OrginalDelegatorKOGID = originalDelegatorUser.userName
                                accessSearchQuery = accessSearchQuery.concat(` AND originalDelegatorIdentifier eq '${requestPayload.originalDelegatorIdentifier}'`)
                            }
                        }

                        if (accessRequest.currentDelegatorUserIdAttributeName && accessRequest.currentDelegatorUserAttributeValue) {
                            currentDelegatorUser = searchObjectByIdAttributeValue(input, _MO_USER, accessRequest.currentDelegatorUserIdAttributeName, accessRequest.currentDelegatorUserAttributeValue)
                            if (currentDelegatorUser && currentDelegatorUser._id) {
                                requestPayload.currentDelegatorIdentifier = currentDelegatorUser._id
                                requestPayload.currentDelegator = {
                                    "_ref": `managed/alpha_user/${currentDelegatorUser._id}`
                                }
                                kogRequestPayload.CurrentDelegatorKOGID = currentDelegatorUser.userName
                                accessSearchQuery = accessSearchQuery.concat(` AND currentDelegatorIdentifier eq '${requestPayload.currentDelegatorIdentifier}'`)

                            }
                        }


                        if (accessRequest.isForwardDelegable) {
                            requestPayload.isForwardDelegable = accessRequest.isForwardDelegable
                        }

                        if (accessRequest.expiryDate) {
                            requestPayload.expiryDate = Date.now(accessRequest.expiryDate)
                            requestPayload.expiryDateEpoch = new Date(accessRequest.expiryDate).toISOString()
                        }


                        accessRequest.KOGOrgId ? requestPayload.orgId = accessRequest.KOGOrgId : null
                        kogRequestPayload.KOGOrgID = accessRequest.KOGOrgId
                        accessRequest.KOGOrgId ? accessSearchQuery = accessSearchQuery.concat(` AND orgId eq '${requestPayload.orgId}'`) : null

                        accessRequest.sourceUniqueId ? requestPayload.sourceUniqueId = accessRequest.sourceUniqueId : null
                        accessRequest.orgType ? requestPayload.orgType = accessRequest.orgType : null
                        accessRequest.orgName ? requestPayload.orgName = accessRequest.orgName : null

                        accessRequest.kogOrgBusinessKeyId ? requestPayload.kogOrgBusinessKeyId = accessRequest.kogOrgBusinessKeyId : null
                        kogRequestPayload.OrgBusinessKeyID = accessRequest.kogOrgBusinessKeyId

                        accessRequest.businessKeyTypeName ? requestPayload.businessKeyTypeName = accessRequest.businessKeyTypeName : null
                        accessRequest.businessKeyName ? requestPayload.businessKeyName = accessRequest.businessKeyName : null
                        accessRequest.businessKeyValue ? requestPayload.businessKeyValue = accessRequest.businessKeyValue : null
                        accessRequest.businessKeyDescription ? requestPayload.businessKeyDescription = accessRequest.businessKeyDescription : null

                        accessRequest.businessKeyName ? accessSearchQuery = accessSearchQuery.concat(` AND businessKeyName eq '${requestPayload.businessKeyName}'`) : null

                        logger.error("access search query: " + accessSearchQuery)

                        var kogAPIRequestPayload = {}

                        if (!isSyncRequest) {
                            /* Check if the request is allowed for provisioning  */

                            let preConditionResponse = checkAccessPreConditions(input, requestedUser._id, searchResult, requestPayload)

                            var kogAPIRequest = {}
                            /* If all provisioning criterias are met then provision the access. */
                            if (preConditionResponse.status == "0") {

                                kogAPIRequestPayload = {
                                    KOGID: requestedUser.userName,
                                    TransactionID: "123",//UUID.randomUUID().toString(), // This should be from SIH.
                                    RequestorKOGID: requesterUser.userName,
                                    UserAuths: []
                                }
                                kogAPIRequestPayload.UserAuths.push(kogRequestPayload)

                                /* Invoke KOG API */
                                kogAPIRequest = {
                                    payload: kogAPIRequestPayload,
                                    action: 1
                                }
                                /* Invoke KOG call to provision access. */
                                //invokeKOGAPI(kogAPIRequest)

                                /* Create entry in the access MO */
                                let response = openidm.create(input._MO_OBJECT_NAME, null, requestPayload, ["*"])
                                if (response) {
                                    responsePayload.push({
                                        status: "0",
                                        request: response
                                    })
                                }


                                /* Check if the role is present */
                                role = openidm.read(`${_MO_ALPHA_ROLE}${requestPayload.role._refResourceId}`, null, ["*", "accessPolicy/*"])

                                if (role && role.accessPolicy) {
                                    /* Check if the access policy has depedent roles */
                                    if (accessPolicy.dependentRole) {

                                        for (let dependentRole of accessPolicy.dependentRole) {
                                            /* Get dependent role */
                                            let depedentRole = openidm.read(`${_MO_ROLE}${dependentRole._id}`, null, ["*", "businessAppId/*"])

                                            if (depedentRole && depedentRole.businessAppId) {
                                                if (depedentRole.businessAppId && depedentRole.businessAppId._refResourceId) {
                                                    requestPayload.appIdentifier = depedentRole.businessAppId._refResourceId
                                                    requestPayload.app = {
                                                        _ref: `managed/alpha_kyid_businessapplication/${depedentRole.businessAppId._refResourceId}`
                                                    }
                                                    kogRequestPayload.ApplicationName = depedentRole.businessAppId.name
                                                } else {
                                                    /* Throw invalid accessRequest exception. */
                                                    invalidRequestException.message.content = `Invalid accessRequest. The app record does not present in KYID for parameter name: ${accessRequest.businessApplicationIdAttributeName} parameter value: ${accessRequest.businessApplicationAttributeValue}`
                                                    invalidRequestException.timestamp = new Date().toISOString()

                                                    throw throwException(JSON.stringify(invalidRequestException))
                                                }
                                            } else {
                                                /* Throw invalid request exception. */
                                                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.requests.businessApplicationIdAttributeName, input.payload.requests.businessApplicationIdAttributeValue"`
                                                invalidRequestException.timestamp = new Date().toISOString()

                                                throw throwException(JSON.stringify(invalidRequestException))
                                            }

                                            if (depedentRole && depedentRole._id) {
                                                requestPayload.roleIdentifier = depedentRole._id
                                                requestPayload.role = {
                                                    _ref: `managed/alpha_role/${depedentRole._id}`
                                                }
                                                !provisioningRoles.includes(depedentRole._id) ? provisioningRoles.push(depedentRole._id) : ""
                                                kogRequestPayload.ApplicationName = depedentRole.name
                                            } else {
                                                /* Throw invalid request exception. */
                                                invalidRequestException.message.content = `Invalid accessRequest. The role record does not present in KYID for parameter name: ${accessRequest.roleIdAttributeName} parameter value: ${accessRequest.roleAttributeValue}`
                                                invalidRequestException.timestamp = new Date().toISOString()

                                                throw throwException(JSON.stringify(invalidRequestException))
                                            }
                                            /* Check if the dependent role is delegable */
                                            if (!depedentRole.isDelegable) {
                                                requestPayload.originalDelegator = null
                                                requestPayload.currentDelegator = null
                                                requestPayload.originalDelegatorIdentifier = null
                                                requestPayload.currentDelegatorIdentifier = null
                                            }

                                            let preConditionResponseForDependentRole = checkAccessPreConditions(input, requestedUser._id, searchResult, requestPayload)

                                            /* Check if the access provisioning is allowed. */
                                            if (preConditionResponseForDependentRole && preConditionResponseForDependentRole.status == "0") {

                                                /* Invoke KOG API */
                                                kogAPIRequestPayload = {
                                                    KOGID: requestedUser.userName,
                                                    TransactionID: "123",//UUID.randomUUID().toString(), // This should be from SIH.
                                                    RequestorKOGID: requesterUser.userName,
                                                    UserAuths: []
                                                }
                                                kogAPIRequestPayload.UserAuths.push(kogRequestPayload)

                                                /* Invoke KOG call to provision access. */
                                                //invokeKOGAPI(kogAPIRequest)
                                                /* Create entry in the access MO */
                                                let response = openidm.create(input._MO_OBJECT_NAME, null, requestPayload, ["*"])
                                                if (response) {
                                                    responsePayload.push({
                                                        status: "0",
                                                        request: requestPayload
                                                    })
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                responsePayload.push(preConditionResponse)
                            }
                        } else {
                            if (accessRequest.authorizationAction && accessRequest.authorizationAction.toLowerCase() == "add") {
                                try {
                                    /* Create entry in the access MO */
                                    logger.error("request payload1: " + JSON.stringify(requestPayload))
                                    let response = openidm.create(input._MO_OBJECT_NAME, null, requestPayload, ["*"])

                                    if (response) {
                                        responsePayload.push({
                                            status: "0",
                                            request: response
                                        })
                                    }

                                } catch (error) {
                                    responsePayload.push({
                                        status: "1",
                                        request: response
                                    })

                                }
                            } else if (accessRequest.authorizationAction && accessRequest.authorizationAction.toLowerCase() == "remove") {
                                logger.error("delete access accessRequest: " + JSON.stringify(accessRequest))
                                let deleteRequest = {
                                    payload: {
                                        queryFilter: `${accessSearchQuery} AND (recordState eq '0')`,
                                        requester: {
                                            "displayId": requestedUser._id
                                        },
                                        confirmation: {
                                            reason: "kogsync",
                                            comment: "This access is deleted as part of the kog sync request."
                                        }
                                    },
                                    "_MO_OBJECT_NAME": input._MO_OBJECT_NAME
                                }
                                let deleteAccessResponse = deleteAccess(deleteRequest)
                                responsePayload.push(deleteAccessResponse)
                            }
                        }


                    } catch (error) {
                        responsePayload.push({
                            status: "1",
                            reason: error.message,
                            request: requestPayload
                        })
                    }
                }

                if (accessRequest.authorizationAction && accessRequest.authorizationAction.toLowerCase() == "add") {
                    /* Patch alpha user effective roles property. */
                    let userExistingRoles = openidm.read("managed/alpha_user/" + requestedUserPayload.userIdentifier, null, ["*", "roles/*"]).roles

                    logger.error("user existing roles are: " + userExistingRoles)

                    logger.error("provisioning roles" + provisioningRoles)

                    const patchRequest = []
                    provisioningRoles.forEach(role => {
                        // skip current role user already has it
                        let userHasThisRole = false


                        for (let i = 0; i < userExistingRoles.length; i++) {
                            if (userExistingRoles[i]._id == role) {
                                userHasThisRole = true
                                break;
                            }
                        }

                        if (userHasThisRole) {
                            return //skip current and continue next forEach
                        } else {
                            let patchOperation = {
                                "operation": "add",
                                "field": "/roles/-",
                                "value": { "_ref": "managed/alpha_role/" + role }
                            }
                            patchRequest.push(patchOperation);
                        }
                    })



                    openidm.patch("managed/alpha_user/" + requestedUserPayload.userIdentifier, null, patchRequest)

                    return responsePayload
                } else {
                    return responsePayload
                }



            } else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.requests"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && JSON.parse(error.message).code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }

}



/**
 * @name getAccess
 * @description Method returns access record
 * 
 * @param {JSON} input 
 * @returns JSON access record
 */
function getAccess(input) {

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAccess`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAccess`,
        "timestamp": ""
    }

    try {

        logDebug(input.transactionId, input.endPoint, "getAccess", `Input parameter: ${JSON.stringify(input.payload)}`)

        /* Check if payload is present */
        if (input.payload) {

            const id = input.payload.id
            /* Read access record */
            return openidm.read(`${input._MO_OBJECT_NAME}${id}`, null, ["*", "role/*", "user/*", "originalDelegator/*", "currentDelegator/*"])

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }

}

/**
 * @name searchAccess
 * @description Method searches access.
 *
 * @param {JSON} input
 * @returns Array<JSON> Array of JSON access
 */
function searchAccess(input) {

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchAccess`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchAccess`,
        "timestamp": ""
    }

    try {
        /* Check if payload exists */
        if (input.payload) {

            logDebug(input.transactionId, input.endPoint, "searchAccount", `Input parameter: ${JSON.stringify(input.payload)}`)

            let returnProperties = input.payload.returnProperties ? input.payload.returnProperties : ["*", "app/*", "role/*", "user/*"]

            let queryFilter = input.payload.queryFilter
            if (input._MO_OBJECT_NAME && queryFilter) {


                logDebug(input.transactionId, input.endPoint, "searchAccount", `Search filter: ${queryFilter}`)

                logger.error("searchAccess: Access search request: " + input._MO_OBJECT_NAME + " - " + queryFilter)

                let searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )

                logger.error("searchAccess: Access search response: " + JSON.stringify(searchResponse))

                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                    return searchResponse.result

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
 * @name patchAccess
 * @description Methods patches access.
 * 
 * @param {JSON} input 
 */
function patchAccess(input) {
    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchAccess`,
        "timestamp": ""
    }

    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/patchAccess`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "patchAccess", `Input parameter: ${JSON.stringify(input.payload)}`)

        const currentTimeinEpoch = Date.now()
        const currentDate = new Date().toISOString()

        /* Check if payload exists */
        if (input.payload) {
            const requesterDisplayId = input.payload.requester.displayId
            const updateFields = input.payload.updateFields
            const returnProperties = ["*"]//Object.keys(input._PROPERTIES)
            const id = input.payload.id

            let recordAudit = []
            if (input._MO_OBJECT_NAME && id && updateFields) {
                /* push the update field records */
                recordAudit = updateFields
                recordAudit.push({
                    "operation": "replace",
                    "field": "/updateDate",
                    "value": currentDate
                })
                recordAudit.push({
                    "operation": "replace",
                    "field": "/updateDateEpoch",
                    "value": currentTimeinEpoch
                })
                recordAudit.push({
                    "operation": "replace",
                    "field": "/updatedBy",
                    "value": requesterDisplayId
                })

                /* patch object */
                logger.error("patch access id: " + id)
                logger.error("patch access recordAudit: " + recordAudit)
                const patchResponse = openidm.patch(`${input._MO_OBJECT_NAME}` + id, null, recordAudit, null, returnProperties);


                if (patchResponse) {
                    logDebug(input.transactionId, input.endPoint, "patchAccess", `Successful update on ${input._MO_OBJECT_NAME} for record id ${id} for fields ${JSON.stringify(recordAudit)}`)
                    return patchResponse
                } else {
                    /* Throw invalid request exception. */
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.updateFields: ${updateFields}, input.payload.accessId: ${accessId}, input._MO_OBJECT_NAME: ${input._MO_OBJECT_NAME}"`
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw throwException(JSON.stringify(invalidRequestException))
                }

            } else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload.updateFields: ${updateFields}, input.payload.accessId: ${accessId}, input._MO_OBJECT_NAME: ${input._MO_OBJECT_NAME}"`
                invalidRequestException.timestamp = new Date().toISOString()
                throw throwException(JSON.stringify(invalidRequestException))
            }
        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()
            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {
        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }
}

/**
 * @name deleteAccess
 * @description Methods deletes access.
 * 
 * @param {JSON} input 
 */
function deleteAccess(input) {

    const _MO_ALPHA_ROLE = "managed/alpha_role/"
    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"
    logger.error("Inside Delete Access ")
    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/deleteAccess`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/deleteAccess`,
        "timestamp": ""
    }


    try {
        logDebug(input.transactionId, input.endPoint, "deleteAccess", `Input parameter: ${JSON.stringify(input.payload)}`)

        const patchRequest = input
        const patchResponse = []

        /* Check if payload exits  */
        if (input.payload) {
            /* Search for access records that need to be deleted */

            const accessResult = searchAccess(input)

            logger.error("access result: " + JSON.stringify(accessResult))
            let roleIds = [];
            let appRoleJSON = {}
            let appRolearray = []
            let requesterAccountId


            if (accessResult.length == 0) {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. No records identified to remove access for input ${JSON.stringify(input)}`
                invalidRequestException.timestamp = new Date().toISOString()
                logger.error("Invalid request. No records identified to remove access for input: " + JSON.stringify(input))
                throw throwException(JSON.stringify(invalidRequestException))
            }

            /* Iterate through each access result */
            accessResult.forEach(access => {
                let dependentRoles = []
                let revokeUserAuths = []

                let revokeRoleRequest = {
                    "payload": {
                        "UserAuths": revokeUserAuths
                    }
                }

                requesterAccountId = access.userIdentifier

                if (access && access._id) {




                    patchRequest.payload.updateFields = [
                        {
                            operation: "replace",
                            field: "/recordState",
                            value: "1"
                        }
                    ]
                    if (input.payload.confirmation) {
                        patchRequest.payload.updateFields.push(
                            {
                                "operation": "add",
                                "field": "/audit",
                                "value": {
                                    action: "delete",
                                    reason: input.payload.confirmation.reason,
                                    comment: input.payload.confirmation.comment
                                }
                            })
                    }
                    patchRequest.payload.id = access._id
                    logger.error("patch Request is --> " + JSON.stringify(patchRequest))


                    try {
                        patchAccess(patchRequest)

                        patchResponse.push({
                            id: access._id,
                            status: "0"
                        })

                        /* Check if the access role has dependent role assigned */
                        /* If all provisioning criterias are met then provision the access. */
                        if (access.role) {
                            logger.error("check access role")


                            let role = openidm.read(`${_MO_ALPHA_ROLE}${access.role._refResourceId}`, null, ["*", "accessPolicy/*", "mutuallyExclusiveRole/*"])

                            /* Check if the role has access policy configured. */
                            let roleAccessPolicy = role.accessPolicy
                            if (roleAccessPolicy) {
                                /* Read access policy */
                                let accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "dependentRole/*"])
                                logger.error("access policy: " + JSON.stringify(accessPolicy))

                                if (accessPolicy && accessPolicy.dependentRole) {
                                    logger.error("access policy dependent role: " + accessPolicy.dependentRole)
                                    /* Iterate through all dependent roles. */
                                    for (let accessPolicyDependentRole of accessPolicy.dependentRole) {


                                        /* Get dependent role information */
                                        let dependentRole = openidm.read(`${_MO_ALPHA_ROLE}${accessPolicyDependentRole._id}`, null, ["*", "businessAppId/*"])
                                        dependentRoles.push(dependentRole)
                                        /* Check if the role is delegable */
                                        revokeUserAuths.push({
                                            ApplicationName: dependentRole.businessAppId.name,
                                            RoleName: dependentRole.name,
                                            OrginalDelegatorKOGID: access.originalDelegator ? access.originalDelegator.userName : null,
                                            CurrentDelegatorKOGID: access.currentDate ? access.currentDelegator.userName : null,
                                            KOGOrgID: access.user.userName,
                                            OrgBusinessKeyID: access.businessKey ? access.businessKey : null
                                        })
                                    }

                                    logger.error("revoke user auths: " + JSON.stringify(revokeUserAuths))
                                    logger.error("dependent roles: " + dependentRoles)

                                }

                                /* patch request for dependent roles. */
                                for (let dependepentRole of dependentRoles) {
                                    let searchFilter = ""
                                    searchFilter = searchFilter.concat(`userIdentifier eq '${access.userIdentifier}'`)
                                    searchFilter = searchFilter.concat(` AND appIdentifier eq '${dependepentRole.businessAppId._refResourceId}'`)
                                    searchFilter = searchFilter.concat(` AND roleIdentifier eq '${dependepentRole._id}'`)
                                    if (access.originalDelegatorIdentifier) {
                                        searchFilter = searchFilter.concat(` AND originalDelegatorIdentifier eq '${access.originalDelegatorIdentifier}'`)
                                        searchFilter = searchFilter.concat(` AND currentDelegatorIdentifier eq '${access.currentDelegatorIdentifier}'`)
                                    }
                                    if (access.orgId) {
                                        searchFilter = searchFilter.concat(` AND orgId eq '${access.orgId}'`)
                                    }
                                    if (access.kogOrgBusinessKeyId) {
                                        searchFilter = searchFilter.concat(` AND kogOrgBusinessKeyId eq '${access.kogOrgBusinessKeyId}'`)
                                    }

                                    logger.error("input _MO_OBJECT_NAME: " + input._MO_OBJECT_NAME)
                                    logger.error("dependent role search filter: " + searchFilter)
                                    let searchResult = openidm.query(input._MO_OBJECT_NAME, {
                                        "_queryFilter": searchFilter
                                    }, ["*"]).result
                                    logger.error("dependent role search result: " + searchResult)
                                    if (searchResult && searchResult.length > 0) {
                                        patchRequest.payload.id = searchResult[0]._id
                                        access._id = searchResult[0]._id // assign dependent role access id in case error thrown and correct access id can be captured
                                        logger.error("access search result: " + searchResult[0])
                                        roleIds.push(searchResult[0].roleIdentifier)
                                        /* Patch the response */
                                        patchAccess(patchRequest)

                                        patchResponse.push({
                                            id: access._id,
                                            status: "0"
                                        })
                                    }
                                }


                            } else {

                                incorrectConfigurationException.message.content = `Misconfiguration. Access policy is missing for role ${access.role}.`
                                incorrectConfigurationException.timestamp = new Date().toISOString()

                                throw throwException(JSON.stringify(incorrectConfigurationException))
                            }
                        }

                        let kogAPIPayload = {
                            "KOGID": access.user.userName,
                            "RequestorKOGID": access.user.userName,
                            "TransactionID": input.payload.transactionId ? input.payload.transactionId : java.util.UUID.randomUUID().toString(),
                            "UserAuths": [
                                {
                                    ApplicationName: access.app.name,
                                    RoleName: access.role.name,
                                    OrginalDelegatorKOGID: access.originalDelegator ? access.originalDelegator.userName : null,
                                    CurrentDelegatorKOGID: access.currentDelegator ? access.currentDelegator.userName : null,
                                    KOGOrgID: access.user.userName,
                                    OrgBusinessKeyID: access.businessKey ? access.businessKey : null
                                }
                            ]
                        }

                        revokeUserAuths.forEach(authEntry => {
                            kogAPIPayload.UserAuths.push(authEntry)
                        })

                        logger.error("kog request payload is: " + JSON.stringify(kogAPIPayload))

                        let kogResponse = invokeKOGAPIRoleRemoval(kogAPIPayload)
                        logger.error("kogResponse is: " + kogResponse)


                        logger.error("access is: " + JSON.stringify(access))
                        logger.error("access role identifier: " + access.roleIdentifier)

                        if (!roleIds.includes(access.roleIdentifier)) {  // add role id if not added yet
                            roleIds.push(access.roleIdentifier);
                        }
                    } catch (error) {

                        patchResponse.push({
                            id: access._id,
                            status: "1",
                            message: error.message
                        })
                    }

                }
            })

            //loop through each role and check if needs to be removed
            let roleRemovalOperations = []

            logger.error("requester account id: " + requesterAccountId)
            let userExistingRoles = openidm.query("managed/alpha_user/" + requesterAccountId + "/roles", {
                "_queryFilter": "true"
            }, ["*"]).result

            logger.error("user existing roles: " + userExistingRoles)
            logger.error("role ids are: " + JSON.stringify(roleIds))

            roleIds.forEach(roleId => {
                let userAccessListForSpecificRoleResult = openidm.query("managed/alpha_kyid_access", {
                    "_queryFilter": '/roleIdentifier eq "' + roleId + '" and userIdentifier eq "' + requesterAccountId + '"'
                }, ["*", "role/*", "app/*"])

                let shouldRemoveRole = true

                let userAccessListForSpecificRole = userAccessListForSpecificRoleResult.result

                logger.error(`user access list for role ${roleId}: ` + userAccessListForSpecificRoleResult)

                for (let i = 0; i < userAccessListForSpecificRole.length; i++) {
                    if (userAccessListForSpecificRole[i].recordState == 0) {
                        shouldRemoveRole = false
                        break
                    } else {
                        appRoleJSON = {
                            role: null,
                            app: null
                        }

                        if (userAccessListForSpecificRole[i].app != null && userAccessListForSpecificRole[i].app) {
                            appRoleJSON.app = userAccessListForSpecificRole[i].app.name
                        }

                        if (userAccessListForSpecificRole[i].role != null && userAccessListForSpecificRole[i].role) {
                            appRoleJSON.role = userAccessListForSpecificRole[i].role.name
                        }

                        if (!appRolearray.includes(appRoleJSON)) {
                            appRolearray.push(appRoleJSON)
                        }
                    }
                }

                if (shouldRemoveRole) {
                    for (let i = 0; i < userExistingRoles.length; i++) {
                        if (userExistingRoles[i]._refResourceId == roleId) {
                            let removeRoleOperation = {
                                "operation": "remove",
                                "field": "/roles",
                                "value": {
                                    "_ref": userExistingRoles[i]._ref,
                                    "_refProperties": userExistingRoles[i]._refProperties,
                                    "_refResourceCollection": userExistingRoles[i]._refResourceCollection,
                                    "_refResourceId": userExistingRoles[i]._refResourceId
                                }
                            }

                            roleRemovalOperations.push(removeRoleOperation)
                            break
                        }
                    }
                } else {
                    return //continue to next role
                }
            })
            //
            logger.error("role list remove operations: " + JSON.stringify(roleRemovalOperations))
            /*logger.error("requesterAccountId:"+requesterAccountId)
            logger.error("RoleIDS:"+JSON.stringify(roleIds))
            let roleArray = [];
            roleIds.forEach(roleId => {
              try{
              var queryRole=openidm.query("managed/alpha_role",{
            "_queryFilter": '_id eq "' + roleId + '"',
              "_fields": "*"
            });

           if(queryRole && queryRole.result && queryRole.result.length>0){
             roleName=queryRole.result[0].name
             logger.error("Role_Name:"+roleName)
             roleArray.push(queryRole.result[0]);
             logger.error("PrintingRoleArray:"+JSON.stringify(queryRole.result[0]));
             }
            }
              
          catch(e){
            logger.error("Fetching Rolename Failed"+e)
          }
            })*/

            if (roleRemovalOperations.length > 0) {
                let removeRoleResponse = openidm.patch("managed/alpha_user/" + requesterAccountId, null, roleRemovalOperations, null, ["*", "*/roles"])
                logger.error("role remove response: " + removeRoleResponse)
                logger.error("appRolearray values are: " + JSON.stringify(appRolearray))
                sendEmailfn(requesterAccountId, appRolearray, "kyid2B1RoleRemoved", "KYID-SYSTEM")
            }


            return patchResponse
        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }

    }
}

/**
 * @name deleteAccess
 * @description Methods deletes access.
 * 
 * @param {JSON} input 
 */
function simpleDeleteAccess(input) {
    logger.error("Inside Simplified Delete Access ")
    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/simpleDeleteAccess`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/simpleDeleteAccess`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "simpleDeleteAccess", `Input parameter: ${JSON.stringify(input.payload)}`)
        logger.error("Inside Simplified Delete Access ")

        const patchRequest = input
        const patchResponse = []
        let kogRemovalStepSuccessful = true
        let kogIdForRoleRemoval = null
        let kogAppRoleCombinations = [];
        //let userExistingRolesinKyid = null;
        let userinKyid = null;

        /* Check if payload exits  */
        if (input.payload) {
            logger.error("ExternalRoleRemoval: Inside Simplified Delete Access: Request Payload: " + JSON.stringify(input.payload))

            // STEP 1: REMOVE ROLE FROM KOG
            try {

                if (input.payload.originalRequestPayload && input.payload.originalRequestPayload.userIdentifier) {
                    kogIdForRoleRemoval = input.payload.originalRequestPayload.userIdentifier.kogId;
                    logger.error("ExternalRoleRemoval: kogIdForRoleRemoval: " + JSON.stringify(kogIdForRoleRemoval));
                }

                if (!kogIdForRoleRemoval) {
                    let userIdQueryFilter = '_id eq "' + input.payload.id + '"';
                    var userinKyid = searchObjectByQuery(input, "managed/alpha_user", userIdQueryFilter);
                    logger.error("ExternalRoleRemoval: Fetching User KOGId : " + JSON.stringify(userinKyid))
                    if (userinKyid && userinKyid.userName) {
                        kogIdForRoleRemoval = userinKyid.userName;
                        logger.error("ExternalRoleRemoval: KOGId Found : " + JSON.stringify(kogIdForRoleRemoval))
                    }
                }

                if (!kogIdForRoleRemoval) {
                    logger.error("ExternalRoleRemoval: KOG ID Not Found");
                    //return null
                    invalidRequestException.message.content = `An Unexpected Error Occurred. Please try again later.`
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw throwException(JSON.stringify(invalidRequestException))
                }

                if (input.payload.originalRequestPayload && input.payload.originalRequestPayload.authorizations) {
                    let rawAuthorizations = input.payload.originalRequestPayload.authorizations;
                    let removeAuthorizations;
                    if (Array.isArray(rawAuthorizations)) {
                        removeAuthorizations = rawAuthorizations;
                    } else if (typeof rawAuthorizations === "object") {
                        removeAuthorizations = Object.values(rawAuthorizations);
                    } else if (typeof rawAuthorizations === "string") {
                        try {
                            const parsed = JSON.parse(rawAuthorizations);
                            removeAuthorizations = Array.isArray(parsed) ? parsed : Object.values(parsed);
                        } catch (e) {
                            logger.error("Could not parse authorizations string: " + rawAuthorizations);
                            removeAuthorizations = [];
                        }
                    } else {
                        removeAuthorizations = [];
                    }

                    const requestedAppRolesForRemoval = removeAuthorizations.map(auth => ({
                        applicationName: auth.applicationName,
                        roleName: auth.roleName
                    }));

                    logger.error("ExternalRoleRemoval: Requested App Roles For Removal: " + JSON.stringify(requestedAppRolesForRemoval));
                    kogAppRoleCombinations = requestedAppRolesForRemoval;
                    logger.error("ExternalRoleRemoval: requestedAppRolesForRemoval" + JSON.stringify(kogAppRoleCombinations));
                }
                logger.error("ExternalRoleRemoval: kogIdForRoleRemoval:" + JSON.stringify(kogIdForRoleRemoval));
                logger.error("ExternalRoleRemoval: requestedAppRolesForRemoval: " + JSON.stringify(kogAppRoleCombinations));

                // Fetch User Authorizations In KOG
                let kogFetchUserAuthPayload = {
                    "KOGID": kogIdForRoleRemoval
                }
                logger.error("ExternalRoleRemoval: Fetch User Auth KOG Request Payload is: " + JSON.stringify(kogFetchUserAuthPayload))
                let kogUserAuthResponse = invokeKOGAPIUserAuthorizations(kogFetchUserAuthPayload)
                logger.error("ExternalRoleRemoval: Fetch User Auth KOG Response is: " + kogUserAuthResponse)

                let kogUserAuthCombos = [];
                if (kogUserAuthResponse && kogUserAuthResponse.ResponseStatus === 0 && kogUserAuthResponse.UserAuthorizations) {
                    kogUserAuthCombos = kogUserAuthResponse.UserAuthorizations.map(auth => ({
                        applicationName: auth.ApplicationName,
                        roleName: auth.RoleName
                    }));
                }
                const comboKey = combo => `${combo.applicationName}|${combo.roleName}`;
                const uniqueUserAuthComboKeys = new Set(kogUserAuthCombos.map(comboKey));
                logger.error("ExternalRoleRemoval: uniqueUserAuthComboKeys = " + JSON.stringify(uniqueUserAuthComboKeys));

                //Check if User Has Auth in KOG for which Role Removal is requested
                const kogAppRoleCombos = requestedAppRolesForRemoval.filter(combo => uniqueUserAuthComboKeys.has(comboKey(combo)));
                logger.error("ExternalRoleRemoval: kogAppRoleCombinations = " + JSON.stringify(kogAppRoleCombos));
                logger.error("ExternalRoleRemoval: kogRemovalStepSuccessful = " + kogRemovalStepSuccessful);

                //If KOG Also has roles, remove it
                if (kogAppRoleCombos.length > 0) {
                    kogRemovalStepSuccessful = false;
                    //Remove Role from KOG
                    let kogAPIPayload = {
                        "KOGID": kogIdForRoleRemoval,
                        "RequestorKOGID": kogIdForRoleRemoval,
                        "TransactionID": input.payload.originalRequestPayload.transactionId ? input.payload.originalRequestPayload.transactionId : java.util.UUID.randomUUID().toString(),
                        "UserAuths": kogAppRoleCombos.map(auth => ({
                            ApplicationName: auth.applicationName,
                            RoleName: auth.roleName
                        }))
                    }
                    logger.error("ExternalRoleRemoval: KOG Role Removal Request Payload: " + JSON.stringify(kogAPIPayload))
                    let kogResponse = invokeKOGAPIRoleRemoval(kogAPIPayload)
                    logger.error("ExternalRoleRemoval: KOG Role Removal Response: " + JSON.stringify(kogResponse))
                    if (kogResponse && kogResponse.ResponseStatus == 0) {
                        kogRemovalStepSuccessful = true;
                    }
                    logger.error("ExternalRoleRemoval: KOG Remove Call Success = " + kogRemovalStepSuccessful);
                } else {
                    logger.error("ExternalRoleRemoval: KOG Role Removal Request Payload Not Found: No Records To Remove.")
                }
            } catch (error) {
                logger.error("ExternalRoleRemoval: KOG Role Removal Process Failed" + error);
                //return null
                invalidRequestException.message.content = `An Unexpected Error Occurred. Please try again later.`
                invalidRequestException.timestamp = new Date().toISOString()
                throw throwException(JSON.stringify(invalidRequestException))
            }
            //kogRemovalStepSuccessful = true
            if (kogRemovalStepSuccessful) {
                logger.error("ExternalRoleRemoval: KOG Role Removal Process Successful. Inside KYID Remove Access");
                let roleIds = [];
                let inputRoleIds = [];
                let appRoleJSON = {}
                let appRolearray = []
                let requesterAccountId = input.payload.id;
                //Search for access records that need to be deleted
                try {
                    logger.error("ExternalRoleRemoval: Search Access Input: " + JSON.stringify(input))
                    const accessResult = searchAccess(input)
                    logger.error("ExternalRoleRemoval: Search Access Result: " + JSON.stringify(accessResult))

                    const queryFilter = input.payload.queryFilter;
                    const roleIdMatches = queryFilter.match(/roleIdentifier\s+eq\s+'([a-fA-F0-9-]+)'/g) || [];
                    inputRoleIds = roleIdMatches.map(match => {
                        const idMatch = match.match(/'([a-fA-F0-9-]+)'/);
                        return idMatch ? idMatch[1] : null;
                    }).filter(Boolean);

                    if (accessResult.length == 0) {
                        invalidRequestException.message.content = `Invalid request. No records identified to remove access for input ${JSON.stringify(input)}`
                        invalidRequestException.timestamp = new Date().toISOString()
                        logger.error("ExternalRoleRemoval: Invalid Remove Access Request. No records identified to remove access for input: " + JSON.stringify(input))

                        roleIds = inputRoleIds
                        logger.error("ExternalRoleRemoval: Invalid Remove Access Request. No records identified to remove access for input. User Account ID: " + JSON.stringify(requesterAccountId))
                        logger.error("ExternalRoleRemoval: Invalid Remove Access Request. No records identified to remove access for input. User Account ID: " + JSON.stringify(roleIds))
                    } else {
                        //Iterate through each access result
                        accessResult.forEach(access => {
                            requesterAccountId = access.userIdentifier
                            if (access && access._id) {
                                patchRequest.payload.updateFields = [
                                    {
                                        operation: "replace",
                                        field: "/recordState",
                                        value: "1"
                                    }
                                ]
                                if (input.payload.confirmation) {
                                    patchRequest.payload.updateFields.push(
                                        {
                                            "operation": "add",
                                            "field": "/audit",
                                            "value": {
                                                action: "delete",
                                                reason: input.payload.confirmation.reason,
                                                comment: input.payload.confirmation.comment
                                            }
                                        })
                                }
                                patchRequest.payload.id = access._id
                                logger.error("ExternalRoleRemoval: Access Patch Request is --> " + JSON.stringify(patchRequest))

                                try {
                                    patchAccess(patchRequest)
                                    patchResponse.push({
                                        id: access._id,
                                        status: "0"
                                    })
                                    logger.error("ExternalRoleRemoval: access is: " + JSON.stringify(access))
                                    logger.error("ExternalRoleRemoval: access role identifier: " + access.roleIdentifier)

                                    if (!roleIds.includes(access.roleIdentifier)) {  // add role id if not added yet
                                        roleIds.push(access.roleIdentifier);
                                    }
                                } catch (error) {
                                    patchResponse.push({
                                        id: access._id,
                                        status: "1",
                                        message: error.message
                                    })
                                }
                            }
                        })
                    }
                } catch (error) {
                    logger.error("ExternalRoleRemoval: Unexpected Error Removing Access: " + JSON.stringify(error))
                    //return null;
                    invalidRequestException.message.content = `An Unexpected Error Occurred. Please try again later.`
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw throwException(JSON.stringify(invalidRequestException))
                }

                //loop through each role and check if needs to be removed
                let roleRemovalOperations = []
                logger.error("ExternalRoleRemoval: requester account id: " + requesterAccountId)
                let userExistingRoles = openidm.query("managed/alpha_user/" + requesterAccountId + "/roles", {
                    "_queryFilter": "true"
                }, ["*"]).result
                logger.error("ExternalRoleRemoval: user existing roles: " + userExistingRoles)
                logger.error("ExternalRoleRemoval: role ids are: " + JSON.stringify(roleIds))

                // Add any missing role IDs from inputRoleIds to roleIds
                inputRoleIds.forEach(id => {
                    if (!roleIds.includes(id)) {
                        roleIds.push(id);
                    }
                });

                roleIds.forEach(roleId => {
                    let userAccessListForSpecificRoleResult = openidm.query("managed/alpha_kyid_access", {
                        "_queryFilter": '/roleIdentifier eq "' + roleId + '" and userIdentifier eq "' + requesterAccountId + '"'
                    }, ["*", "role/*", "app/*"])

                    let shouldRemoveRole = true
                    let userAccessListForSpecificRole = userAccessListForSpecificRoleResult.result
                    logger.error(`ExternalRoleRemoval: user access list for role ${roleId}: ` + userAccessListForSpecificRoleResult)
                    for (let i = 0; i < userAccessListForSpecificRole.length; i++) {
                        if (userAccessListForSpecificRole[i].recordState == 0) {
                            shouldRemoveRole = false
                            break
                        } else {
                            appRoleJSON = {
                                role: null,
                                app: null
                            }
                            if (userAccessListForSpecificRole[i].app != null && userAccessListForSpecificRole[i].app) {
                                appRoleJSON.app = userAccessListForSpecificRole[i].app.name
                            }
                            if (userAccessListForSpecificRole[i].role != null && userAccessListForSpecificRole[i].role) {
                                appRoleJSON.role = userAccessListForSpecificRole[i].role.name
                            }
                            if (!appRolearray.includes(appRoleJSON)) {
                                appRolearray.push(appRoleJSON)
                            }
                        }
                    }
                    logger.error("ExternalRoleRemoval: Simplified Delete Method Should Remove Flag: " + shouldRemoveRole)

                    if (!shouldRemoveRole) {
                        shouldRemoveRole = true;
                        logger.error("ExternalRoleRemoval: Overriding Simplified Delete Method Should Remove Flag: " + shouldRemoveRole)
                    }

                    if (shouldRemoveRole) {
                        for (let i = 0; i < userExistingRoles.length; i++) {
                            if (userExistingRoles[i]._refResourceId == roleId) {
                                let removeRoleOperation = {
                                    "operation": "remove",
                                    "field": "/roles",
                                    "value": {
                                        "_ref": userExistingRoles[i]._ref,
                                        "_refProperties": userExistingRoles[i]._refProperties,
                                        "_refResourceCollection": userExistingRoles[i]._refResourceCollection,
                                        "_refResourceId": userExistingRoles[i]._refResourceId
                                    }
                                }
                                roleRemovalOperations.push(removeRoleOperation)
                                break
                            }
                        }
                    } else {
                        return //continue to next role
                    }
                })

                logger.error("ExternalRoleRemoval: role list remove operations: " + JSON.stringify(roleRemovalOperations))

                if (roleRemovalOperations.length > 0) {
                    let removeRoleResponse = openidm.patch("managed/alpha_user/" + requesterAccountId, null, roleRemovalOperations, null, ["*", "*/roles"])
                    logger.error("ExternalRoleRemoval: role remove response: " + removeRoleResponse)
                    logger.error("ExternalRoleRemoval: appRolearray values are: " + JSON.stringify(appRolearray))
                    sendEmailfn(requesterAccountId, appRolearray, "kyid2B1RoleRemoved", "KYID-SYSTEM")
                }
                return patchResponse
            } else {
                logger.error("ExternalRoleRemoval: role remove response: " + removeRoleResponse)
                invalidRequestException.message.content = `An Unexpected Error Occurred. Please try again later.`
                invalidRequestException.timestamp = new Date().toISOString()
                throw throwException(JSON.stringify(invalidRequestException))
            }
        } else {
            invalidRequestException.message.content = `ExternalRoleRemoval: Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()
            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }

    }
}

function sendEmailfn(id, appRolearray, templateId, requesterUser) {

    logger.error("Inside sendEmailfn in endpoint/access_v2B")
    let givenName = null
    let sn = null
    let mail = null
    let phoneContact = null
    let emailContact = null
    let userQueryResult = null
    let appName = "KYID Helpdesk"
    let userResponse = null

    try {
        let userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", { _queryFilter: 'name eq "' + appName + '"' }, ["phoneContact", "emailContact"])
        phoneContact = userQueryResult2.result[0].phoneContact[0].phoneNumber
        emailContact = userQueryResult2.result[0].emailContact[0].emailAddress

    } catch (error) {
        logger.error("Error in catch of helpdesk retrieval :: => " + error)
    }

    let filter = '_id eq "' + id + '"';

    try {
        userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": filter
        }, ["mail", "givenName", "sn", "mail", "frIndexedString1", "frIndexedString2", "custom_secondaryMail"])
    } catch (error) {
        logger.error("Error in catch of alpha_user retrieval :: => " + error)
    }

    logger.error("userQueryResult is -- " + JSON.stringify(userQueryResult))

    if (userQueryResult && userQueryResult.result && userQueryResult.result.length > 0) {
        // logger.error("userQueryResult.result[0] : "+userQueryResult.result[0]);
        // logger.error("typeof result : "+ typeof(userQueryResult.result[0]))
        userResponse = userQueryResult.result[0]
        givenName = userResponse.givenName
        sn = userResponse.sn
        mail = userResponse.mail
    }

    appRolearray.forEach(function (appRole) {
        logger.error("BeforeSendingEmailFn")
        sendMail(mail, givenName, sn, appRole.role, phoneContact, emailContact, appRole.app, templateId, requesterUser)
    })
}


function sendMail(mail, givenName, sn, role, phoneContact, emailContact, appName, templateId, requesterUser) {
    try {
        var params = new Object();
        var easternTimeStamp = isoToEastern();
        logger.error("Inside sendMail in endpoint/access_v2B")
        //  var easternTimeStamp = dateTime
        params.templateName = templateId
        params.to = mail;
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "mail": mail,
            "timeStamp": easternTimeStamp,
            "roleName": role,
            "phoneContact": phoneContact,
            "appName": appName,
            "requesterUser": "KYID-System"
        };
        logger.error("Values for mail: " + JSON.stringify(params.object));
        //nodeLogger.info(params.object);
        openidm.action("external/email", "sendTemplate", params);
        logger.error(transactionid + "Email OTP Notification sent successfully to " + mail)
        // nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
        return;

    } catch (error) {
        logger.error("Exception in sening email...Exception - " + error);
        //logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
        return;
    }
}


/**
 * @name getAvailableRoles
 * @description Methods returns user's available roles.
 * 
 * @param {JSON} input 
 * @returns Array<JSON> returns application roles.
 */

function getAvailableRoles(input) {
    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"
    const _MO_ALPHA_ROLE = "managed/alpha_role/"

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAvailableRoles`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAvailableRoles`,
        "timestamp": ""
    }

    try {
        logDebug(input.transactionId, input.endPoint, "getAvailableRoles", `Input parameter: ${JSON.stringify(input.payload)}`)

        let role = null
        let accessPolicy = null
        let userRoleIdQuery = ''
        let result = []
        let userRoleIds = []
        /* Check if payload is present */
        if (input.payload) {

            const isDelegationContext = input.payload.isDelegationContext
            const delegateeAccesQuery = input.payload.delegateeAccessQuery
            /* Search for access records */
            if (!input.payload.returnProperties) {
                input.payload.returnProperties = ["*", "role/*"]
            }

            const userAccessResult = searchAccess(input)
            /* If delegation context is there, return the access search result. */
            // if(isDelegationContext){

            //     for (let userAccess of userAccessResult){

            //         if(userAccess.role){

            //             role = openidm.read(`${_MO_ALPHA_ROLE}${userAccess.role._refResourceId}`,null,["*","accessPolicy/*"])

            //             if(role && role.isDelegable){

            //                 let roleAccessPolicy = role.accessPolicy
            //                 if(roleAccessPolicy){
            //                     /* Read access policy */
            //                     accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`,null,["*","preRequisites/*","mutuallyExclusiveRole/*"])

            //                     if(accessPolicy){
            //                         if(accessPolicy.preRequisites){
            //                             userAccess.preRequisites = accessPolicy.preRequisites
            //                         }
            //                         result.push(userAccess)
            //                     }
            //                 }
            //             }     
            //         }
            //     }
            //     return result
            // }

            if (isDelegationContext) {

                const delegateeRoles = []

                if (delegateeAccesQuery && delegateeAccesQuery.length > 0) {
                    /* Search delegatee access */
                    // const delegateeAccessSearch = {
                    //     payload:{
                    //         queryFilter:delegateeAccesQuery,
                    //         returnProperties:["*"]
                    //     }
                    // }
                    let delegateeAccessSearch = input

                    delegateeAccessSearch.payload = {
                        queryFilter: delegateeAccesQuery,
                        returnProperties: ["*"]
                    }
                    /* Search delegatee access */
                    const delegateeAccessSearchResult = searchAccess(delegateeAccessSearch)

                    /*  */
                    delegateeAccessSearchResult.forEach(access => {
                        if (access.userIdentifier && !delegateeRoles.includes(access.userIdentifier)) {
                            delegateeRoles.push(access.userIdentifier)
                        }
                    })
                }

                for (let userAccess of userAccessResult) {

                    if (userAccess.role) {

                        role = openidm.read(`${_MO_ALPHA_ROLE}${userAccess.role._refResourceId}`, null, ["*", "accessPolicy/*"])

                        if (!delegateeRoles.includes(role._id) && role && role.isDelegable) {
                            let roleAccessPolicy = role.accessPolicy
                            if (roleAccessPolicy) {
                                /* Read access policy */
                                accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "preRequisites/*", "mutuallyExclusiveRole/*"])

                                if (accessPolicy) {
                                    if (accessPolicy.preRequisites) {
                                        userAccess.preRequisites = accessPolicy.preRequisites
                                    }
                                    result.push(userAccess)
                                }
                            }
                        }
                    }
                }

                return result
            }
            if (userAccessResult) {

                /* Iterate through user access result. */
                userAccessResult.forEach(access => {
                    userRoleIds.push(access.role._refResourceId)
                    if (access.role._refResourceId) {
                        userRoleIdQuery = userRoleIdQuery + `"${access.role._refResourceId}",`
                    }
                })
                userRoleIdQuery = userRoleIdQuery + `""`

                /* Get all business application roles */
                const availableAppRoles = getAvailableApplicationRoles(input, userRoleIds)

                /* Iterate through user's access result */
                for (let availableRole of availableAppRoles) {

                    role = openidm.read(`${_MO_ALPHA_ROLE}${availableRole}`, null, ["*", "accessPolicy/*", "businessAppId/*"])

                    if (role) {
                        /* Check if the role is not org scoped. */
                        if (!role.isOrgScopedRole) {
                            let roleAccessPolicy = role.accessPolicy

                            if (roleAccessPolicy) {
                                /* Read access policy */
                                accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "preRequisites/*", "mutuallyExclusiveRole/*"])
                                let isAllowedRequesteeTypeCommonwealth = false
                                /* Check if there is any CommonwealthType of access */
                                for (let enrollmentSetting of accessPolicy.enrollmentRequestSetting) {
                                    if (enrollmentSetting.allowedRequesteeType == '2') {
                                        isAllowedRequesteeTypeCommonwealth = true
                                    }
                                }
                                if (accessPolicy && accessPolicy.enrollmentRequestSetting && !(isAllowedRequesteeTypeCommonwealth)) {

                                    let isRoleMutuallyExclusive = false
                                    let mutualExclusiveRoles = accessPolicy.mutuallyExclusiveRole

                                    /* Check if the user has any of the mutually exclusive roles. */
                                    if (mutualExclusiveRoles) {
                                        mutualExclusiveRoles.forEach(exclusiveRole => {
                                            if (userRoleIds && userRoleIds.includes(exclusiveRole._id)) {
                                                isRoleMutuallyExclusive = true
                                            }
                                        })
                                    }

                                    /* If the role is not mutually exclusive */
                                    if (!isRoleMutuallyExclusive) {
                                        if (accessPolicy.preRequisites) {
                                            role.preRequisites = accessPolicy.preRequisites
                                        }
                                        result.push(role)
                                    }
                                }
                            }
                        }
                    }

                }
            }

            return result
        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }
}


/**
 * @name getApplicationRoles
 * @description Method gets roles associated with the business application
 * 
 * @param {Array} userRoleIds
 * @return {JSON} application roles
 */
function getAvailableApplicationRoles(input, userRoleIds) {

    const _MO_OBJECT_APPLICATION = "managed/alpha_kyid_businessapplication/"

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAvailableApplicationRoles`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getAvailableApplicationRoles`,
        "timestamp": ""
    }

    try {


        /* Check if payload is present */
        if (input.payload) {

            logDebug(input.transactionId, input.endPoint, "getAvailableApplicationRoles", `Input parameter: ${JSON.stringify(input.payload)}`)

            const appId = input.payload.appId

            /* Search application roles */
            const filter = {
                _queryFilter: `(_id eq '${appId}')`
                //  _queryFilter: `true`

            }

            /* Search application roles that are not assigned to the user. */
            const application = openidm.query(`${_MO_OBJECT_APPLICATION}`, filter, ["roleAppId/*"])
            const roles = []

            if (application && application.result) {

                logDebug(input.transactionId, input.endPoint, "getAvailableApplicationRoles", `Search result for app id '${appId}': ${JSON.stringify(application.result)}`)
                const appRoles = application.result[0].roleAppId
                /* Iterate through application roles */
                for (let appRole of appRoles) {
                    /* Dont include the roles that are already assigned to the user. */
                    if (!userRoleIds.includes(appRole._refResourceId)) {
                        roles.push(appRole._refResourceId)
                    }
                }
                return roles
            } else {
                logDebug(input.transactionId, input.endPoint, "getAvailableApplicationRoles", `No search result.`)
                return []
            }

        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }

    }
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
function searchObjectByIdAttributeValue(input, resource, attribute, value) {

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchObjectByIdAttributeValue`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchObjectByIdAttributeValue`,
        "timestamp": ""
    }
    try {

        logDebug(input.transactionId, input.endPoint, "searchObjectByAttributeValue", `Input parameter: Resource: ${resource}, Attribute: ${attribute} Value:${value}`)
        let filter = {
            _queryFilter: `${attribute} eq '${value}'`
        }


        let response = openidm.query(resource, filter, ["*"])


        if (response && response.resultCount > 0) {
            if (response.result.length == 1) {
                let objectRecord = response.result[0]
                return objectRecord
            } else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request contains id attribute which is returning multiple entries. Id Attribute : ${attribute}`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }
        } else {
            /* Throw invalid request exception. */

            invalidRequestException.message.content = `Invalid request. The request contains id attribute which is NOT returning any entries. Id Attribute : ${attribute}`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }
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
function searchObjectByQuery(input, resource, queryFilter) {

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchObjectByQuery`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/searchObjectByQuery`,
        "timestamp": ""
    }
    try {

        logDebug(input.transactionId, input.endPoint, "searchObjectByQuery", `Input parameter: Resource: ${resource}, queryFilter: ${queryFilter}`)
        const filter = queryFilter

        const response = openidm.query(resource, filter, ["*"])


        if (response && response.resultCount > 0) {
            if (response.result.length == 1) {
                const objectRecord = response.result[0]
                return objectRecord
            } else {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request contains queryFilter which is returning multiple entries. Id queryFilter : ${queryFilter}`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }
        } else {
            /* Throw invalid request exception. */

            invalidRequestException.message.content = `Invalid request. The request contains queryFilter which is NOT returning any entries. Id queryFilter : ${queryFilter}`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }
}



// /**
//  * @name getView
//  * @description Method returns page view
//  * 
//  * @param {String} viewName 
//  * @param {JSON} result 
//  * @returns JSON page view
//  */
// function getView(input, viewName, result) {

//     const unexpectedException = {
//         "code": "2",
//         "level": "ERROR",
//         "message": {
//             "code": "KYID-IRE",
//             "content": ""
//         },
//         "logger": `${input._ENDPOINT_NAME}/searchAccess`,
//         "timestamp": ""
//     }

//     const responseView = {
//         data: {}
//     }

//     const appToInfo = new Map()
//     const appToRoles = new Map()
//     const roleToInfo = new Map()
//     const userToAppRoles = new Map()

//     const roleToOriginalDelegators = new Map()
//     const roleToCurrentDelegators = new Map()
//     const roleToAssociatedPrerequisites = new Map()
//     let originalDelegators = []
//     let currentDelegators = []
//     let applicationRoles = []

//     try {
//         const resultView = []

//         switch (viewName) {

//             case "UsersByApp":

//                 if (result) {
//                     /* Iterate through the result */
//                     result.forEach(access => {

//                         if (access.user) {

//                             resultView.push({
//                                 enrollmentID: access.user._refResourceId,
//                                 firtName: access.user.givenName ? access.user.givenName : "",
//                                 lastName: access.user.sn ? access.user.sn : "",
//                                 email: access.user.mail ? access.user.mail : "",
//                                 logon: access.user.custom_logon ? access.user.custom_logon : "",
//                                 upn: access.user.custom_upn ? access.user.custom_upn : "",
//                                 userType: access.user.custom_kyidAccountType ? access.user.custom_kyidAccountType : ""
//                             })

//                         }
//                     })

//                     responseView.data = resultView
//                 }
//                 break
//             case "AppsByUser":

//                 if (result) {
//                     appToInfo = new Map()
//                     appToRoles = new Map()

//                     /* Iterate through the result */
//                     result.forEach(access => {

//                         if (access.user && access.app) {
//                             if (!appToInfo.get(access.app._id)) {
//                                 appToInfo.set(access.app._id,
//                                     {
//                                         applicationId: access.app._id,
//                                         applicationDisplayName: access.app.content[0] ? access.app.content[0].title : "",
//                                         applicationDisplayDescription: access.app.content[0] ? access.app.content[0].content : "",
//                                         logo: access.app.logoURL

//                                     })
//                             }
//                             if (appToInfo.get(access.app._id)) {
//                                 appToRoles.set(access.app._id, {
//                                     roleId: access._id,
//                                     roleName: access.role.content[0] ? access.role.content[0].name : "",
//                                     roleDescription: access.role.content[0] ? access.role.content[0].description : "",
//                                     tagName: ""
//                                 })
//                             }
//                         }
//                     })

//                     for (let appId of appToInfo.keys()) {
//                         const businessAppInfo = appToInfo.get(appId)
//                         const appRoles = appToRoles.get(appId)
//                         if (businessAppInfo && appRoles) {
//                             businessAppInfo.applicationRoles = appRoles
//                             resultView.push(businessAppInfo)
//                         }
//                     }
//                     responseView.data = resultView
//                 }
//                 break
//             case "RolesByUserAndApp":

//                 if (result) {
//                     roleToInfo = new Map()
//                     roleToOriginalDelegators = new Map()
//                     roleToCurrentDelegators = new Map()
//                     roleToAssociatedPrerequisites = new Map()
//                     originalDelegators = []
//                     currentDelegators = []
//                     /* Iterate through the result */
//                     result.forEach(access => {

//                         if (access.user && access.role) {
//                             if (!roleToInfo.get(access.role._id)) {
//                                 roleToInfo.set(access.role._id,
//                                     {
//                                         enrollmentID: access._id,
//                                         roleDisplayName: access.role.content[0] ? access.role.content[0].name : "",
//                                         roleDisplayDescription: access.role.content[0] ? access.role.content[0].description : "",
//                                         creationDate: access.createDate,
//                                         assignmentDate: access.assignmentDate ? access.assignmentDate : "",
//                                         delegationEndDate: access.expiryDate ? access.expiryDate : "",
//                                         expiryDate: access.expiryDate ? access.expiryDate : "",
//                                         tagName: ""
//                                     })
//                             }
//                             if (roleToInfo.get(access.role._id)) {
//                                 if (access.originalDelegator) {
//                                     originalDelegators = roleToOriginalDelegators.get(access.role._id)
//                                     if (!originalDelegators) {
//                                         originalDelegators = []
//                                     }
//                                     originalDelegators.push({
//                                         firstName: access.originalDelegator.givenName,
//                                         lastName: access.originalDelegator.sn,
//                                         email: access.originalDelegator.mail
//                                     })
//                                     roleToOriginalDelegators.set(access.role._id, originalDelegators)
//                                 }
//                                 if (access.currentDelegator) {
//                                     currentDelegators = roleToCurrentDelegators.get(access.role._id)
//                                     if (!currentDelegators) {
//                                         currentDelegators = []
//                                     }
//                                     currentDelegators.push({
//                                         firstName: access.currentDelegator.givenName,
//                                         lastName: access.currentDelegator.sn,
//                                         email: access.currentDelegator.mail
//                                     })
//                                     roleToCurrentDelegators.set(access.role._id, currentDelegators)
//                                 }
//                             }
//                             if (roleToInfo.get(access.role._id)) {
//                                 roleToAssociatedPrerequisites.set(access.role._id, [{
//                                     es: "Hardcoded - English - To be replaced",
//                                     en: "Hardcoded - Spanish - To be replaced"

//                                 }])
//                             }
//                         }
//                     })

//                     for (let roleId of roleToInfo.keys()) {
//                         originalDelegators = roleToOriginalDelegators.get(roleId)
//                         currentDelegators = roleToCurrentDelegators.get(roleId)

//                         if (originalDelegators && currentDelegators) {
//                             roleInfo = roleToInfo.get(roleId)
//                             roleInfo.originalDelegator = originalDelegators
//                             roleInfo.currentDelegator = currentDelegators
//                             resultView.push(roleInfo)
//                         }
//                     }
//                     responseView.data = resultView
//                 }
//                 break
//             case "UserDelegatedUsers":
//                 userToInfo = new Map()
//                 userToAppRoles = new Map()
//                 applicationRoles = []

//                 if (result) {
//                     /* Iterate through the result */
//                     result.forEach(access => {

//                         if (access.user) {
//                             /*  */
//                             if (!userToInfo.get(access.user._refResourceId)) {
//                                 userToInfo.set(access.user._refResourceId, {
//                                     enrollmentID: access.user._refResourceId,
//                                     firtName: access.user.givenName ? access.user.givenName : "",
//                                     lastName: access.user.sn ? access.user.sn : "",
//                                     email: access.user.mail ? access.user.mail : "",
//                                 })
//                             }
//                             if (userToInfo.get(access.user._refResourceId)) {
//                                 applicationRoles = userToAppRoles.get(access.user._id)
//                                 if (!applicationRoles) {
//                                     applicationRoles = []
//                                 }
//                                 applicationRoles.push({
//                                     applicationName: access.app.content[0] ? access.app.content[0].title : "",
//                                     roleName: access.role.content[0] ? access.role.content[0].name : "",
//                                     tagName: ""
//                                 })
//                                 userToAppRoles.set(access.user._refResourceId, applicationRoles)
//                             }

//                         }
//                     })
//                     let userInfo = {}

//                     for (let userId of userToInfo.keys()) {
//                         userInfo = userToInfo.get(userId)
//                         applicationRoles = userToAppRoles.get(userId)
//                         userInfo.applicationData = applicationRoles
//                         resultView.push(userInfo)
//                     }
//                     responseView.data = resultView
//                 }
//                 break
//             case "AvailableAccess":
//                 if (result) {
//                     roleToInfo = new Map()
//                     roleInfo = {};

//                     /* Iterate through the result */
//                     result.forEach(role => {

//                         if (role) {
//                             if (!roleToInfo.get(role._id)) {
//                                 roleInfo.id = role._id,
//                                     roleInfo.roleDisplayName = role.content[0] ? role.content[0].name : "",
//                                     roleInfo.roleDisplayDescription = role.content[0] ? role.content[0].description : "",
//                                     roleInfo.tagName = ""
//                                 if (role.businessAppId) {
//                                     roleInfo.businessAppDisplayName = role.businessAppId.content[0] ? role.businessAppId.content[0].title : ""
//                                 }
//                                 if (role.preRequisites) {
//                                     const preRequisteName = []
//                                     role.preRequisites.forEach(preRequisite => {
//                                         preRequisteName.push(preRequisite.displayName)
//                                     })
//                                     roleInfo.associatedPrerequisites = preRequisteName
//                                 }
//                                 roleToInfo.set(role._id, roleInfo)
//                             }
//                         }
//                     })

//                     for (let roleId of roleToInfo.keys()) {
//                         roleInfo = roleToInfo.get(roleId)
//                         resultView.push(roleInfo)

//                     }
//                     responseView.data = resultView
//                 }
//                 break
//             case "AvailableAccessForDelegation":
//                 if (result) {
//                     roleToInfo = new Map()
//                     roleToOriginalDelegators = new Map()
//                     roleToCurrentDelegators = new Map()
//                     originalDelegators = []
//                     currentDelegators = []

//                     roleInfo = {};

//                     /* Iterate through the result */
//                     result.forEach(access => {

//                         if (access) {
//                             if (!roleToInfo.get(access.role._id)) {
//                                 roleInfo.id = access.role._id,
//                                     roleInfo.roleDisplayName = access.role.content[0] ? access.role.content[0].name : "",
//                                     roleInfo.roleDisplayDescription = access.role.content[0] ? access.role.content[0].description : "",
//                                     roleInfo.tagName = ""
//                                 if (access.app) {
//                                     roleInfo.businessAppDisplayName = access.app.content[0] ? access.app.content[0].title : ""
//                                 }
//                                 if (access.preRequisites) {
//                                     const preRequisteName = []
//                                     access.preRequisites.forEach(preRequisite => {
//                                         preRequisteName.push(preRequisite.displayName)
//                                     })
//                                     roleInfo.associatedPrerequisites = preRequisteName
//                                 }
//                                 roleToInfo.set(access.role._id, roleInfo)
//                             }
//                             if (roleToInfo.get(access.role._id)) {
//                                 if (access.originalDelegator) {
//                                     originalDelegators = roleToOriginalDelegators.get(access.role._id)
//                                     if (!originalDelegators) {
//                                         originalDelegators = []
//                                     }
//                                     originalDelegators.push({
//                                         firstName: access.originalDelegator.givenName,
//                                         lastName: access.originalDelegator.sn,
//                                         email: access.originalDelegator.mail
//                                     })
//                                     roleToOriginalDelegators.set(access.role._id, originalDelegators)
//                                 }
//                                 if (access.currentDelegator) {
//                                     currentDelegators = roleToCurrentDelegators.get(access.role._id)
//                                     if (!currentDelegators) {
//                                         currentDelegators = []
//                                     }
//                                     currentDelegators.push({
//                                         firstName: access.currentDelegator.givenName,
//                                         lastName: access.currentDelegator.sn,
//                                         email: access.currentDelegator.mail
//                                     })
//                                     roleToCurrentDelegators.set(access.role._id, currentDelegators)
//                                 }
//                             }
//                         }
//                     })

//                     for (let roleId of roleToInfo.keys()) {
//                         roleInfo = roleToInfo.get(roleId)
//                         originalDelegators = roleToOriginalDelegators.get(roleId)
//                         currentDelegators = roleToCurrentDelegators.get(roleId)

//                         if (originalDelegators && currentDelegators) {
//                             roleInfo.originalDelegator = originalDelegators
//                             roleInfo.currentDelegator = currentDelegators
//                         }
//                         resultView.push(roleInfo)

//                     }
//                     responseView.data = resultView
//                 }
//                 break

//             default:
//                 break;
//         }

//     } catch (error) {
//         if (error && error.code == "2") {
//             throwException(error.message)
//         } else {
//             /* Throw unexpected exception. */
//             unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
//             unexpectedException.timestamp = new Date().toISOString()

//             throw throwException(JSON.stringify(unexpectedException))
//         }
//     }

//     return responseView
// }

/**
 * @name searchRoleTag
 * @description Method searches role Tag
 * 
 * @param {JSON} input 
 * @returns [JSON] TagNames
 */
function searchRoleTag(roleId) {

    if (!roleId) {
        return { error: "Missing role ID (roleId) parameter." };
    }

    // Query the alpha_role managed object
    var role = openidm.read("managed/alpha_role/" + roleId);

    if (!role) {
        return { error: "Role not found for ID: " + roleId };
    }

    var tagNames = [];
    var tagQuery = "";
    if (role.tags && role.tags.length > 0) {
        var tagIds = [];
        for (var i = 0; i < role.tags.length; i++) {
            var tagRef = role.tags[i];
            if (tagRef._refResourceId) {
                tagIds.push("'" + tagRef._refResourceId + "'");
            }
        }
        if (tagIds.length > 0) {

            if (tagIds.length === 1) {
                tagQuery = "_id eq " + tagIds[0];
            } else if (tagIds.length > 1) {
                var orParts = [];
                for (var i = 0; i < tagIds.length; i++) {
                    orParts.push("_id eq " + tagIds[i]);
                }
                tagQuery = orParts.join(" or ");
            } else {
                // No tags to query
                tagQuery = 'false'; // Will return no results
            }

            var tagResults = openidm.query("managed/alpha_kyid_tag", {
                "_queryFilter": tagQuery
            });
            if (tagResults && tagResults.result) {

                for (var j = 0; j < tagResults.result.length; j++) {
                    var tagObj = tagResults.result[j];
                    // If tagObj.name is localized (object), use as is; else, wrap as default
                    if (tagObj && Array.isArray(tagObj.localizedContent) && tagObj.localizedContent.length > 0 && tagObj.localizedContent[0].displayTitle) {
                        tagNames.push({
                            displayName: {
                                en: tagObj.localizedContent[0].displayTitle.en || "",
                                es: tagObj.localizedContent[0].displayTitle.es || ""
                            }
                        });
                    } else if (tagObj.name) {
                        tagNames.push({
                            displayName: {
                                en: tagObj.name,
                                es: tagObj.name
                            }
                        });
                        //tagNames.push(tagObj.name);
                    }
                }
            }
        }
    }

    return tagNames;

}

/**
 * Determines the flag based on role and Accesspolicy as described.
 * @param {String} roleId - The alpha_role managed object
 * @returns {Boolean} - false if isOrgScopedRole true or allowedRequestTypes is "2", true otherwise
 */
function isRoleRemovable(roleId) {

    if (!roleId) {
        return { error: "Missing role ID (roleId) parameter." };
    }

    // Query the alpha_role managed object
    var role = openidm.read("managed/alpha_role/" + roleId);

    if (!role) {
        return { error: "Role not found for ID: " + roleId };
    }


    // Check if role.isOrgScopedRole is true
    if (role && Boolean(role.isOrgScopedRole)) {
        return false;
    }

    // Get access policy details
    var accessPolicy = null;
    if (role.accessPolicy && role.accessPolicy._refResourceId) {
        accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
    }

    // Check if any enrollmentRequestSetting.allowedRequestTypes is "2"
    if (accessPolicy && Array.isArray(accessPolicy.enrollmentRequestSetting)) {
        for (var i = 0; i < accessPolicy.enrollmentRequestSetting.length; i++) {
            if (String(accessPolicy.enrollmentRequestSetting[i].allowedRequestTypes) === "2") {
                return false;
            }
        }
    }

    // If neither condition is met, return true
    return true;
}


/**
 * @name getView
 * @description Method returns page view
 *
 * @param {String} viewName
 * @param {JSON} result
 * @returns JSON page view
 */
function getView(input, viewName, result) {

    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/getView`,
        "timestamp": ""
    }

    const responseView = {
        data: {}
    }

    let appToInfo = new Map()
    let appToRoles = new Map()
    let roleToInfo = new Map()
    let userToAppRoles = new Map()

    let roleToOriginalDelegators = new Map()
    let roleToCurrentDelegators = new Map()
    let roleToAssociatedPrerequisites = new Map()
    let originalDelegators = []
    let currentDelegators = []
    let applicationRoles = []
    let roleInfo = {}
    try {
        let resultView = []
        let userByApp = []

        switch (viewName) {

            case "UsersByApp":

                if (result) {

                    /* Iterate through the result */
                    result.forEach(access => {

                        if (access.user) {
                            if (!userByApp.includes(access.user._refResourceId)) {

                                resultView.push({
                                    enrollmentID: access.user._refResourceId,
                                    firtName: access.user.givenName ? access.user.givenName : "",
                                    lastName: access.user.sn ? access.user.sn : "",
                                    email: access.user.mail ? access.user.mail : "",
                                    logon: access.user.frIndexedString2 ? access.user.frIndexedString2 : "",
                                    upn: access.user.frIndexedString1 ? access.user.frIndexedString1 : "",
                                    userType: access.user.custom_kyidAccountType ? access.user.custom_kyidAccountType : ""
                                })
                                userByApp.push(access.user._refResourceId)
                            }

                        }
                    })

                    responseView.data = resultView
                }
                break
            case "AppsByUser":

                if (result) {
                    appToInfo = new Map()
                    appToRoles = new Map()


                    /* Iterate through the result */
                    result.forEach(access => {

                        if (access.user && access.app) {
                            if (!appToInfo.get(access.app._id)) {
                                appToInfo.set(access.app._id,
                                    {
                                        enrollmentID: access._id,
                                        applicationId: access.app._id,
                                        applicationDisplayName: access.app && access.app.content[0] ? access.app.content[0].title : "",
                                        applicationDisplayDescription: access.app && access.app.content[0] ? access.app.content[0].content : "",
                                        logo: access.app.logoURL

                                    })
                            }
                            if (appToInfo.get(access.app._id)) {
                                // appToRoles.set(access.app._id, {
                                //     roleId: access._id,
                                //     roleName: access.role.content[0] ? access.role.content[0].name : "",
                                //     roleDescription: access.role.content[0] ? access.role.content[0].description : "",
                                //     tagName: ""
                                // })
                                let roleCollection = appToRoles.get(access.app._id)
                                if (!roleCollection) {
                                    roleCollection = []
                                }
                                var originalDelegator = getDelegatorInfo(access.originalDelegator)
                                var currentDelegator = getDelegatorInfo(access.currentDelegator)
                                roleCollection.push({
                                    roleId: access._id,
                                    roleName: access.role && access.role.content[0] ? access.role.content[0].name : "",
                                    roleDescription: access.role && access.role.content[0] ? access.role.content[0].description : "",
                                    tagName: access.role && access.role._id ? searchRoleTag(access.role._id) : [],
                                    isDelegable: access.role && access.role.content[0] ? access.role.isDelegable : false,
                                    isForwardDelegable: access.role && access.role.content[0] ? access.role.isForwardDelegable : false,
                                    isOrgScopedRole: access.role && access.role.content[0] ? access.role.isOrgScopedRole : false,
                                    isRoleRemovable: access.role && access.role._id ? isRoleRemovable(access.role._id) : false,
                                    orgType: access.orgType || "",
                                    orgName: access.orgName || "",
                                    businessKeyTypeName: access.businessKeyTypeName || "",
                                    businessKeyValue: access.businessKeyValue || "",
                                    businessKeyName: access.businessKeyName || "",
                                    originalDelegator: originalDelegator,
                                    currentDelegator: currentDelegator,
                                    associatedPreRequisites: getPreRequsitesbyRole(access.role._id)
                                })
                                appToRoles.set(access.app._id, roleCollection)
                            }



                        }

                    })

                    var businessAppInfo
                    var appRoles

                    for (let appId of appToInfo.keys()) {
                        businessAppInfo = appToInfo.get(appId)
                        appRoles = appToRoles.get(appId)

                        if (businessAppInfo && appRoles) {
                            businessAppInfo.applicationRoles = appRoles
                            resultView.push(businessAppInfo)
                        }
                    }
                    responseView.data = resultView
                }
                break
            case "RolesByUserAndApp":

                if (result) {
                    roleToInfo = new Map()
                    roleToOriginalDelegators = new Map()
                    roleToCurrentDelegators = new Map()
                    roleToAssociatedPrerequisites = new Map()
                    /* Iterate through the result */
                    result.forEach(access => {

                        if (access.role) {


                            var originalDelegator = getDelegatorInfo(access.originalDelegator)
                            var currentDelegator = getDelegatorInfo(access.currentDelegator)

                            roleToInfo.set(access.role._id,
                                {
                                    enrollmentID: access._id,
                                    roleDisplayName: access.role && access.role.content[0] ? access.role.content[0].name : "",
                                    roleDisplayDescription: access.role && access.role.content[0] ? access.role.content[0].description : "",
                                    creationDate: access.createDate,
                                    assignmentDate: access.assignmentDate ? access.assignmentDate : "",
                                    delegationEndDate: access.expiryDate ? access.expiryDate : "",
                                    expiryDate: access.expiryDate ? access.expiryDate : "",
                                    tagName: access.role && access.role._id ? searchRoleTag(access.role._id) : [],
                                    isDelegable: access.role && access.role.content[0] ? access.role.isDelegable : false,
                                    isForwardDelegable: access.role && access.role.content[0] ? access.role.isForwardDelegable : false,
                                    isOrgScopedRole: access.role && access.role.content[0] ? access.role.isOrgScopedRole : false,
                                    isRoleRemovable: access.role && access.role._id ? isRoleRemovable(access.role._id) : false,
                                    originalDelegator: originalDelegator,
                                    currentDelegator: currentDelegator,
                                    orgType: access.orgType || "",
                                    orgName: access.orgName || "",
                                    businessKeyTypeName: access.businessKeyTypeName || "",
                                    businessKeyValue: access.businessKeyValue || "",
                                    businessKeyName: access.businessKeyName || "",
                                    associatedPreRequisites: getPreRequsitesbyRole(access.role._id)
                                })


                        }
                    })

                    roleInfo = {}

                    for (let roleId of roleToInfo.keys()) {
                        roleInfo = roleToInfo.get(roleId)

                        resultView.push(roleInfo)
                    }

                    responseView.data = resultView
                }
                break
            case "UserDelegatedUsers":
                userToInfo = new Map()
                userToAppRoles = new Map()
                applicationRoles = []

                if (result) {
                    /* Iterate through the result */
                    result.forEach(access => {

                        if (access.user) {
                            /*  */
                            if (!userToInfo.get(access.user._refResourceId)) {
                                userToInfo.set(access.user._refResourceId, {
                                    userId: access.user._id,
                                    firstName: access.user.givenName ? access.user.givenName : "",
                                    lastName: access.user.sn ? access.user.sn : "",
                                    email: access.user.mail ? access.user.mail : "",
                                })
                            }
                            if (userToInfo.get(access.user._refResourceId)) {
                                applicationRoles = userToAppRoles.get(access.user._id)
                                if (!applicationRoles) {
                                    applicationRoles = []
                                }
                                applicationRoles.push({
                                    enrollmentID: access._id,
                                    applicationName: access.app && access.app.content[0] ? access.app.content[0].title : "",
                                    roleName: access.role && access.role.content[0] ? access.role.content[0].name : "",
                                    tagName: ""
                                })
                                userToAppRoles.set(access.user._refResourceId, applicationRoles)
                            }

                        }
                    })
                    let userInfo = {}

                    for (let userId of userToInfo.keys()) {
                        userInfo = userToInfo.get(userId)
                        applicationRoles = userToAppRoles.get(userId)
                        userInfo.applicationData = applicationRoles
                        resultView.push(userInfo)
                    }
                    responseView.data = resultView
                }
                break
            case "AvailableAccess":
                if (result) {
                    roleToInfo = new Map()
                    roleInfo = {};

                    /* Iterate through the result */
                    result.forEach(role => {

                        if (role) {
                            roleInfo = {};
                            if (!roleToInfo.get(role._id)) {
                                roleInfo.id = role._id,
                                    roleInfo.roleId = role._id,
                                    roleInfo.roleDisplayName = role.content[0] ? role.content[0].name : "",
                                    roleInfo.roleDisplayDescription = role.content[0] ? role.content[0].description : "",
                                    roleInfo.isDelegable = role.isDelegable,
                                    roleInfo.isForwardDelegable = role.isForwardDelegable,
                                    roleInfo.tagName = ""
                                if (role.businessAppId) {
                                    roleInfo.businessAppId = role.businessAppId._refResourceId,
                                        roleInfo.businessAppDisplayName = role.businessAppId.content[0] ? role.businessAppId.content[0].title : ""
                                }
                                if (role.preRequisites) {
                                    const preRequisteName = []

                                    role.preRequisites.forEach(preRequisite => {
                                        preRequisteName.push(preRequisite.displayName)
                                    })
                                    roleInfo.associatedPreRequisites = preRequisteName
                                }
                                roleToInfo.set(role._id, roleInfo)
                            }
                        }
                    })

                    for (let roleId of roleToInfo.keys()) {
                        roleInfo = roleToInfo.get(roleId)
                        resultView.push(roleInfo)

                    }
                    responseView.data = resultView
                }
                break
            case "AvailableAccessForDelegation":
                if (result) {
                    roleToInfo = new Map()
                    roleToOriginalDelegators = new Map()
                    roleToCurrentDelegators = new Map()
                    originalDelegators = []
                    currentDelegators = []

                    roleInfo = {}

                    /* Iterate through the result */
                    result.forEach(access => {

                        if (access) {
                            roleInfo = {}

                            if (!roleToInfo.get(access.role._id)) {
                                roleInfo.id = access._id,
                                    roleInfo.roleId = access.role._refResourceId,
                                    roleInfo.roleDisplayName = access.role && access.role.content[0] ? access.role.content[0].name : "",
                                    roleInfo.roleDisplayDescription = access.role && access.role.content[0] ? access.role.content[0].description : "",
                                    roleInfo.isDelegable = access.role.isDelegable,
                                    roleInfo.isForwardDelegable = access.role.isForwardDelegable,
                                    roleInfo.tagName = ""
                                if (access.app) {
                                    roleInfo.businessAppId = access.app._refResourceId,
                                        roleInfo.businessAppDisplayName = access.app.content[0] ? access.app.content[0].title : ""
                                }
                                if (access.preRequisites) {
                                    const preRequisteName = []
                                    access.preRequisites.forEach(preRequisite => {
                                        preRequisteName.push(preRequisite.displayName)
                                    })
                                    roleInfo.associatedPreRequisites = preRequisteName
                                }
                                roleToInfo.set(access.role._id, roleInfo)
                            }
                            if (roleToInfo.get(access.role._id)) {
                                if (access.originalDelegator) {
                                    originalDelegators = roleToOriginalDelegators.get(access.role._id)
                                    if (!originalDelegators) {
                                        originalDelegators = []
                                    }
                                    originalDelegators.push({
                                        firstName: access.originalDelegator.givenName,
                                        lastName: access.originalDelegator.sn,
                                        email: access.originalDelegator.mail
                                    })
                                    roleToOriginalDelegators.set(access.role._id, originalDelegators)
                                }
                                if (access.currentDelegator) {
                                    currentDelegators = roleToCurrentDelegators.get(access.role._id)
                                    if (!currentDelegators) {
                                        currentDelegators = []
                                    }
                                    currentDelegators.push({
                                        firstName: access.currentDelegator.givenName,
                                        lastName: access.currentDelegator.sn,
                                        email: access.currentDelegator.mail
                                    })
                                    roleToCurrentDelegators.set(access.role._id, currentDelegators)
                                }
                            }
                        }
                    })
                    let userInfo = {}
                    for (let roleId of roleToInfo.keys()) {
                        roleInfo = roleToInfo.get(roleId)
                        originalDelegators = roleToOriginalDelegators.get(roleId)
                        currentDelegators = roleToCurrentDelegators.get(roleId)

                        if (originalDelegators && currentDelegators) {
                            roleInfo.originalDelegator = originalDelegators
                            roleInfo.currentDelegator = currentDelegators
                        }
                        resultView.push(roleInfo)

                    }
                    responseView.data = resultView
                }
                break
            case "AccessView":
                if (result) {
                    const access = result
                    roleInfo = {}
                    roleToInfo = new Map()
                    roleToOriginalDelegators = new Map()
                    roleToCurrentDelegators = new Map()
                    roleToAssociatedPrerequisites = new Map()

                    logger.error("Access View : Info " + JSON.stringify(access))
                    /* Iterate through the result */
                    if (access) {

                        if (access.app && access.role) {
                            if (!roleToInfo.get(access.role._id)) {

                                var originalDelegator = getDelegatorInfo(access.originalDelegator)
                                var currentDelegator = getDelegatorInfo(access.currentDelegator)

                                roleToInfo.set(access.role._id,
                                    {
                                        enrollmentID: access._id,
                                        roleDisplayName: access.role && access.role.content[0] ? access.role.content[0].name : "",
                                        roleDisplayDescription: access.role && access.role.content[0] ? access.role.content[0].description : "",
                                        creationDate: access.createDate,
                                        assignmentDate: access.assignmentDate ? access.assignmentDate : "",
                                        delegationEndDate: access.expiryDate ? access.expiryDate : "",
                                        expiryDate: access.expiryDate ? access.expiryDate : "",
                                        tagName: access.role && access.role._id ? searchRoleTag(access.role._id) : [],
                                        isRoleRemovable: access.role && access.role._id ? isRoleRemovable(access.role._id) : false,
                                        orgType: access.orgType || "",
                                        orgName: access.orgName || "",
                                        businessKeyTypeName: access.businessKeyTypeName || "",
                                        businessKeyValue: access.businessKeyValue || "",
                                        businessKeyName: access.businessKeyName || "",
                                        originalDelegator: originalDelegator,
                                        currentDelegator: currentDelegator,
                                        associatedPreRequisites: getPreRequsitesbyRole(access.role._id)
                                    })
                            }


                        }
                    }

                    for (let roleId of roleToInfo.keys()) {
                        roleInfo = roleToInfo.get(roleId)
                        resultView.push(roleInfo)

                    }
                    responseView.data = resultView
                }
            default:
                break;
        }

    } catch (error) {
        if (error && error.code == "2") {
            throwException(error.message)
        } else {
            /* Throw unexpected exception. */
            unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            unexpectedException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(unexpectedException))
        }
    }

    return responseView
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

    let invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-EUE",
            "content": ""
        },
        "logger": `${endpoint}`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${endpoint}/deleteAccess`,
        "timestamp": ""
    }

    try {

        if (request.content) {
            logDebug(context.transactionId, endpoint, "getRequestContent", `Input parameter: ${request.content}`)

            if (!request.content.payload) {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.payload"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }
            if (!request.content.action) {
                /* Throw invalid request exception. */
                invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.action"`
                invalidRequestException.timestamp = new Date().toISOString()

                throw throwException(JSON.stringify(invalidRequestException))
            }

            logDebug(context.transactionId, endpoint, "getRequestContent", `Response: ${request.content}`)

            /* Determine if the requester is present in the request and populate the requester details in payload */
            // request.content.payload.requester = {
            //     displayId: "1234578"
            // }
            return request.content

        } else {

            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        if (error && error.code == "2") {
            throwException(error.message)
        } else {
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
                code: "KYID-IRE",
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
function logException(transactionId, exception) {

    logger.error(JSON.stringify({
        transactionId: transactionId,
        kyidException: exception
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
 * @name {currentDate}
 * @description Method returns current date.
 * 
 * @returns Date
 */
function currentDate() {
    let currentDate = Date.now();
    return new Date(current).toISOString();

}

/**
 * @name {isoToEastern}
 * @description Method returns current date EST format
 * 
 * @returns Date
 */

function isoToEastern() {
    var date = new Date();

    var year = date.getUTCFullYear();

    // DST calculation
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7; // 2nd Sunday
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0)); // 2am EST == 7am UTC

    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7; // 1st Sunday
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0)); // 2am EDT == 6am UTC

    var isDST = (date >= dstStart && date < dstEnd);
    var offset = isDST ? -4 : -5;
    var tzAbbr = isDST ? "EST" : "EST"; //Earlier was EDT:EST

    var local = new Date(date.getTime() + offset * 60 * 60 * 1000);

    // Month names
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Day suffix
    function getOrdinalSuffix(d) {
        if (d >= 11 && d <= 13) return d + "th";
        switch (d % 10) {
            case 1: return d + "st";
            case 2: return d + "nd";
            case 3: return d + "rd";
            default: return d + "th";
        }
    }

    // Format time
    var hours = local.getUTCHours();
    var minutes = local.getUTCMinutes();
    var seconds = local.getUTCSeconds();

    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;

    function pad(n) { return n < 10 ? '0' + n : n; }

    var month = months[local.getUTCMonth()];
    var day = getOrdinalSuffix(local.getUTCDate());
    var time = hour12 + ":" + pad(minutes) + ":" + pad(seconds);

    return month + ", " + day + " " + local.getUTCFullYear() + " - " + time + " " + ampm + " " + tzAbbr;

}

/**
 * @name throwException
 * @description Method throws exception.
 * 
 * @param {JSON} exception 
 * @throws {Exception} Throws exception
 */
function throwException(exception) {
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "UNERROR",
        message: "An unexpected error occured while processing the request."
    };
    if (exception) {
        throw { code: 400, message: exception }
    } else {
        throw { code: 400, message: JSON.stringify(EXCEPTION_UNEXPECTED_ERROR) }
    }
}

/**
 * Call KOG API for removing role
 */
function invokeKOGAPIRoleRemoval(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        const requestBody = {
            "url": identityServer.getProperty("esv.kyid.role.removerolesfromuser"),
            // "url": "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/removerolesfromuser",
            "scope": "kogkyidapi.removerolesfromuser ",
            "method": "POST",
            "payload": payload
        }
        while (retryCountForKOGAPI < 3) {
            //Call KOG API endpoint.
            try {
                logger.error("ExternalRoleRemoval: Invoking KOG Role Removal API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("ExternalRoleRemoval: KOG Role Removal Response: " + response)
                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("ExternalRoleRemoval: KOG Role Removal Success Response: " + JSON.stringify(response))
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("ExternalRoleRemoval: KOG Role Removal Business Validation Response: " + JSON.stringify(response))
                        return response.response
                    } else {
                        logger.error("ExternalRoleRemoval: KOG Role Removal Unknown Response: " + JSON.stringify(response))
                        return response.response
                    }
                } else {
                    logger.error("ExternalRoleRemoval: KOG Role Removal KOG No-200 Response: " + JSON.stringify(response))
                    return null
                }
            } catch (error) {
                logger.error("ExternalRoleRemoval: KOG Role Removal Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("Retry count of kogRemoveRolesToUser is: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("ExternalRoleRemoval: KOG Role Removal Operation Failed. Maximum Retry Limit Reached: " + JSON.stringify(error))
                        return null
                    }
                } else {
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("ExternalRoleRemoval: KOG Role Removal Failure Response is: " + JSON.stringify(error))
        //throw JSON.stringify(error)
        return null
    }
}


/**
 * Call KOG API for fetching User Authorizations
 */
function invokeKOGAPIUserAuthorizations(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        const requestBody = {
            "url": identityServer.getProperty("esv.kyid.usr.authorization"),
            //"url": "https://dev.sih.ngateway.ky.gov/ide/kyidapi/V1/getuserauthorizations",
            "scope": "kogkyidapi.getuserauthorizations ",
            "method": "POST",
            "payload": payload
        }

        while (retryCountForKOGAPI < 3) {
            //Call KOG API endpoint.
            try {
                logger.error("ExternalRoleRemoval: Invoking KOG Get User Authorizations API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("ExternalRoleRemoval: kog api invoke response: " + response)
                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Success Response: " + JSON.stringify(response))
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Business Validation Response: " + JSON.stringify(response))
                        return response.response
                    } else {
                        logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Unknown Response: " + JSON.stringify(response))
                        return response.response
                    }
                } else {
                    logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG No-200 Response: " + JSON.stringify(response))
                    return null
                }
            } catch (error) {
                logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("Retry count of kogAddRolesToUser is: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Operation Failed. Maximum Retry Limit Reached: " + JSON.stringify(error))
                        return null
                    }
                } else {
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("ExternalRoleRemoval: KOG Fetch User Auth KOG Failure Response is: " + JSON.stringify(error))
        return null
    }
}



/**
 * Call KOG API for removing role
 */
function getDelegatorInfo(user) {
    var delegatorInfo = {}
    delegatorInfo.firstName = "";
    delegatorInfo.lastName = "";
    delegatorInfo.mail = "";
    try {
        if (user && user._refResourceId) {
            var alphaUser = openidm.read("managed/alpha_user/" + user._refResourceId, null, ["*"]);

            delegatorInfo.firstName = alphaUser && alphaUser.givenName ? alphaUser.givenName : "";
            delegatorInfo.lastName = alphaUser && alphaUser.sn ? alphaUser.sn : "";
            delegatorInfo.mail = alphaUser && alphaUser.mail ? alphaUser.mail : "";
        }
        return delegatorInfo
    } catch (error) {
        logger.error("Unable to get delegator information for " + user)
        return delegatorInfo
    }
}


function getPreRequsitesbyRole(roleId) {
    var prerequisites = [];

    if (!roleId) {
        return { error: "Missing role ID (roleId) parameter." };
    }

    try {

        // Query the alpha_role managed object
        var role = openidm.read("managed/alpha_role/" + roleId);

        if (!role) {
            return { error: "Role not found for ID: " + roleId };
        }

        // Get access policy details
        var accessPolicy = null;
        if (role.accessPolicy && role.accessPolicy._refResourceId) {
            accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
        }

        // Get prerequisites from access policy

        var prereqIds = [];
        if (accessPolicy && accessPolicy.preRequisites && accessPolicy.preRequisites.length > 0) {

            for (var i = 0; i < accessPolicy.preRequisites.length; i++) {
                var prereqRef = accessPolicy.preRequisites[i];
                if (prereqRef._refResourceId) {
                    prereqIds.push("'" + prereqRef._refResourceId + "'");
                }
            }
            var prereqQuery = "";
            if (prereqIds.length === 1) {
                prereqQuery = "_id eq " + prereqIds[0];
            } else if (prereqIds.length > 1) {
                var orParts = [];
                for (var i = 0; i < prereqIds.length; i++) {
                    orParts.push("_id eq " + prereqIds[i]);
                }
                prereqQuery = orParts.join(" or ");
            } else {
                prereqQuery = 'false'; // No prerequisites to query
            }

            var prereqResults = openidm.query("managed/alpha_kyid_enrollment_prerequisite", {
                "_queryFilter": prereqQuery
            });

            if (prereqResults && prereqResults.result) {

                for (var j = 0; j < prereqResults.result.length; j++) {
                    var prereq = prereqResults.result[j];
                    if (prereq) {
                        var displayName = prereq.displayName;

                        if (prereq.displayName) {
                            prerequisites.push({
                                "en": displayName.en,
                                "es": displayName.es
                            });

                            /*       for (var lang3 in prereq.displayName) {
                                       if (prereq.displayName.hasOwnProperty(lang3) && prereq.displayName[lang3]) {
                                           displayNameObj[lang3] = prereq.displayName[lang3];
                                       }
                                   }*/
                        }

                    }
                }
            }
        }



        return prerequisites;

    } catch (error) {
        logger.error("Unable to get pre-requisites for the role id" + error)
        return prerequisites;
    }


}