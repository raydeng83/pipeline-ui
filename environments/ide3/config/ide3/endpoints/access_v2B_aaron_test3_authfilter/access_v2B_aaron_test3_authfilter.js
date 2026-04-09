
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

    logger.error("===REQUEST in access_v2B=== " + JSON.stringify(request));
    // Get audit logger context variables
    const auditLoggerObj = getAuditLoggerContext();

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


    const ENDPOINT_NAME = "endpoint/access_v2B_aaron_test3_authfilter"
    const MO_OBJECT_NAME = "managed/alpha_kyid_access/"

    /* POC: Managed object name for role-based data authorization lookup */
    const AUTH_OBJECT_NAME = "alpha_kyid_access"

    let requesterAccountId
    try {
        if (context != null) {
            if (context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.user_id) {
                requesterAccountId = context.oauth2.rawInfo.user_id
            }
        }
        logger.error("****DEBUG: context value from request => " + JSON.stringify(context)) //Remove Later  
    } catch (e) {
        logger.error("Failed to get requesterAccountId from OAuth context: " + e)
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
        "_AUTH_OBJECT_NAME": AUTH_OBJECT_NAME,
        "_PROPERTIES": OBJECT_PROPERTIES,
        "transactionId": "349834038398340",
        "auditLogger": auditLoggerObj,
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

                    /* Add recordState filter to exclude deleted records for UserDelegatedUsers view */
                    if (viewName === "UserDelegatedUsers" && input.payload.queryFilter) {
                        input.payload.queryFilter = input.payload.queryFilter + ' AND (recordState eq "0" or recordState eq "ACTIVE")'
                    }

                    /* Search access records. */
                    result = searchAccess(input)

                } else if (action == ACTION_DELETE) {
                    logger.error("****DEBUG: requestContent value => " + JSON.stringify(requestContent)) //Remove Later
                    input.payload = requestContent.payload

                    input.payload.requester = {
                        displayId: requesterAccountId ? requesterAccountId : input.payload.id
                    }
                    logger.error("****DEBUG: input value => " + JSON.stringify(input)) //Remove Later
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
        logger.error("****DEBUG: Exception caught value => " + JSON.stringify(error)) //Remove Later
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
                        OriginalDelegatorKOGID: null,
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
                                kogRequestPayload.OriginalDelegatorKOGID = originalDelegatorUser.userName
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

                        // If originalDelegator is not provided but currentDelegator is, use currentDelegator
                        if (!kogRequestPayload.OriginalDelegatorKOGID && kogRequestPayload.CurrentDelegatorKOGID) {
                            kogRequestPayload.OriginalDelegatorKOGID = kogRequestPayload.CurrentDelegatorKOGID
                            logger.error("OriginalDelegatorKOGID not provided, using currentDelegator: " + kogRequestPayload.CurrentDelegatorKOGID)
                        }


                        if (accessRequest.isForwardDelegable) {
                            requestPayload.isForwardDelegable = accessRequest.isForwardDelegable
                        }

                        if (accessRequest.expiryDate) {
                            requestPayload.expiryDate = Date.now(accessRequest.expiryDate)
                            requestPayload.expiryDateEpoch = new Date(accessRequest.expiryDate).toISOString()
                        }


                        accessRequest.KOGOrgId ? requestPayload.orgId = accessRequest.KOGOrgId + "" : null
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

                                        // Audit logger for successful role assigning - placed after all operations complete
                                        let eventCode = "ROM001";
                                        let eventName = "Add Role Success";
                                        let eventDetails = requestPayload;

                                        // auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId)
                                        auditLogger(
                                            eventCode,
                                            eventName,
                                            input.auditLogger.sessionDetailsauditLogger,
                                            eventDetails,
                                            requesterUser._id,
                                            requestedUser._id,
                                            input.auditLogger.transactionIdauditLogger,
                                            requestedUser.mail,
                                            app.name,
                                            input.auditLogger.sessionRefIDauditLogger
                                        );
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
                                            "displayId": requesterUser._id
                                        },
                                        confirmation: {
                                            reason: "kogsync",
                                            comment: "This access is deleted as part of the kog sync request."
                                        }
                                    },
                                    "_MO_OBJECT_NAME": input._MO_OBJECT_NAME,
                                    "auditLogger": input.auditLogger
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

                let finalFilter = queryFilter

                /* POC: Get role-based authorization filter and AND it into the query */
                var authFilter = getRoleBasedFilters(input._AUTH_OBJECT_NAME)
                logger.error(input._ENDPOINT_NAME + ": authFilter=" + authFilter)

                if (authFilter === "false") {
                    // No access — return empty immediately
                    logger.error(input._ENDPOINT_NAME + ": authFilter is false, returning empty")
                    return []
                } else if (authFilter && authFilter !== "true") {
                    // AND the auth filter with the existing filter
                    finalFilter = `(${finalFilter}) and (${authFilter})`
                    logger.error(input._ENDPOINT_NAME + ": finalFilter with auth=" + finalFilter)
                }
                // authFilter === "true" means master role, no additional filter needed

                logDebug(input.transactionId, input.endPoint, "searchAccount", `Search filter: ${finalFilter}`)

                logger.error("searchAccess: Access search request: " + input._MO_OBJECT_NAME + " - " + finalFilter)

                let searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`,
                    {
                        "_queryFilter": finalFilter
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
    logger.error("****DEBUG: input value in patchAccess => " + JSON.stringify(input)) //Remove Later
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
                    "value": "KYID-System"
                })

                recordAudit.push({
                    "operation": "replace",
                    "field": "/updatedByID",
                    "value": requesterDisplayId
                })

                /* patch object */
                logger.error("patch access id: " + id)
                logger.error("patch access recordAudit: " + recordAudit)
                logger.error("Managed Object name => " + `${input._MO_OBJECT_NAME}`)
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
        logger.error("****Exception caught during IDM Patch Ops => " + getException(error))
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
    logger.error("Inside Delete Access")
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

    // Declare variables outside try block so catch block can access them
    let patchResponse = []
    let roleIds = []
    let appRolearray = []
    let roleRemovalOperations = []
    let requesterAccountId
    let requestedAccountId  // The user whose role is being removed
    let userEmail = ""      // The email of the user whose role is being removed
    let cascadeResult = null  // Store cascade deletion results for reuse

    // =====================================================================
    // CASCADE DELETION FRAMEWORK - Internal Functions
    // =====================================================================

    /**
     * Main cascade deletion framework for deleteAccess
     * Handles both delegated access and dependent roles
     */
    function cascadeDeleteFramework(config) {
        var input = config.input
        var accessRecords = config.accessRecords
        var processorFunction = config.processorFunction

        var allDeletedRecords = []
        var allKOGPayloads = []
        var processedIds = {}

        // Process each access record
        for (var i = 0; i < accessRecords.length; i++) {
            var record = accessRecords[i]

            // Skip if already processed
            if (processedIds[record._id]) {
                continue
            }

            // Collect all records that need to be cascade deleted
            var cascadeRecords = collectCascadeRecords(input, [record], 0)

            // Mark all as processed to avoid duplicates
            for (var j = 0; j < cascadeRecords.length; j++) {
                processedIds[cascadeRecords[j]._id] = true
            }

            // Process using the specific processor
            var result = processorFunction(input, cascadeRecords)

            // Accumulate results
            allDeletedRecords = allDeletedRecords.concat(result.deletedRecords || [])
            allKOGPayloads = allKOGPayloads.concat(result.kogPayloads || [])
        }

        logger.error("[CASCADE-DEBUG] Cascade deletion completed - deleted " + allDeletedRecords.length + " total records")

        return {
            deletedRecords: allDeletedRecords,
            kogPayloads: allKOGPayloads
        }
    }

    /**
     * Recursively collect all access records that should be cascade deleted
     */
    function collectCascadeRecords(input, initialRecords, depth) {
        var MAX_DEPTH = 10
        if (depth >= MAX_DEPTH) {
            logger.error("Cascade deletion reached max depth limit of " + MAX_DEPTH)
            return []
        }

        logger.error("[CASCADE-DEBUG] collectCascadeRecords - Depth: " + depth + ", Processing " + initialRecords.length + " initial records")

        var collectedRecords = []
        var recordsToSearch = []

        // Process initial records
        for (var i = 0; i < initialRecords.length; i++) {
            var record = initialRecords[i]
            collectedRecords.push(record)
            logger.error("[CASCADE-DEBUG] collectCascadeRecords - Processing record for user: " + record.userIdentifier + ", role: " + record.roleIdentifier)

            // Determine cascade filter
            // When a user's access is deleted, find all records where this user is the currentDelegator
            // This means finding all records that were directly delegated by this user
            var cascadeFilter = '/roleIdentifier eq "' + record.roleIdentifier +
                '" and currentDelegatorIdentifier eq "' + record.userIdentifier +
                '" and recordState eq "0"'

            logger.error("[CASCADE-DEBUG] collectCascadeRecords - Cascade filter: " + cascadeFilter)

            // Find cascade records
            if (cascadeFilter) {
                var cascadeSearchResult = openidm.query(input._MO_OBJECT_NAME, {
                    "_queryFilter": cascadeFilter
                }, ["*", "user/*", "role/*", "app/*", "originalDelegator/*", "currentDelegator/*"])

                logger.error("[CASCADE-DEBUG] collectCascadeRecords - Query result count: " + (cascadeSearchResult.result ? cascadeSearchResult.result.length : 0))

                if (cascadeSearchResult.result && cascadeSearchResult.result.length > 0) {
                    logger.error("Cascade search found " + cascadeSearchResult.result.length +
                        " records at depth " + depth + " for role " + record.roleIdentifier)

                    // Add to records to search in next iteration
                    for (var j = 0; j < cascadeSearchResult.result.length; j++) {
                        var cascadeRecord = cascadeSearchResult.result[j]
                        // Skip the original record
                        if (cascadeRecord._id !== record._id) {
                            logger.error("[CASCADE-DEBUG] collectCascadeRecords - Found cascade record: user=" + cascadeRecord.userIdentifier +
                                ", originalDelegator=" + cascadeRecord.originalDelegatorIdentifier +
                                ", currentDelegator=" + cascadeRecord.currentDelegatorIdentifier)
                            recordsToSearch.push(cascadeRecord)
                        }
                    }
                } else {
                    // If no active records found, query for soft-deleted records (recordState="1") to clean up KOG ghost delegations
                    // Only take the most recent one to avoid processing too many historical records
                    logger.error("[CASCADE-DEBUG] collectCascadeRecords - No active records found, checking for soft-deleted records")

                    var deletedRecordsFilter = '/roleIdentifier eq "' + record.roleIdentifier +
                        '" and currentDelegatorIdentifier eq "' + record.userIdentifier +
                        '" and recordState eq "1"'

                    logger.error("[CASCADE-DEBUG] collectCascadeRecords - Soft-deleted filter: " + deletedRecordsFilter)

                    var deletedRecordsResult = openidm.query(input._MO_OBJECT_NAME, {
                        "_queryFilter": deletedRecordsFilter,
                        "_sortKeys": "-updateDateEpoch",
                        "_pageSize": 1
                    }, ["*", "user/*", "role/*", "app/*", "originalDelegator/*", "currentDelegator/*"])

                    logger.error("[CASCADE-DEBUG] collectCascadeRecords - Soft-deleted query result count: " + (deletedRecordsResult.result ? deletedRecordsResult.result.length : 0))

                    if (deletedRecordsResult.result && deletedRecordsResult.result.length > 0) {
                        var deletedRecord = deletedRecordsResult.result[0]
                        logger.error("[CASCADE-DEBUG] collectCascadeRecords - Found most recent soft-deleted record for KOG cleanup: " + deletedRecord._id +
                            ", user=" + deletedRecord.userIdentifier +
                            ", recordState=" + deletedRecord.recordState)
                        // Add this record for KOG API cleanup
                        // Note: We won't patch it in IDM since it's already soft-deleted, but we need to clean up KOG
                        recordsToSearch.push(deletedRecord)
                    }
                }
            }
        }

        // Recursively collect from found records
        if (recordsToSearch.length > 0) {
            var nextLevelRecords = collectCascadeRecords(input, recordsToSearch, depth + 1)
            collectedRecords = collectedRecords.concat(nextLevelRecords)
        }

        return collectedRecords
    }

    /**
     * Process dependent roles for a single access record
     */
    function processDependentRolesForRecord(accessRecord, config) {
        var input = config.input
        var _MO_ALPHA_ROLE = config._MO_ALPHA_ROLE || "managed/alpha_role/"
        var _MO_ACCESS_POLICY = config._MO_ACCESS_POLICY || "managed/alpha_kyid_enrollment_access_policy/"

        var dependentRoleRecords = []
        var kogPayloads = []

        // Check if the role has dependent roles
        if (accessRecord.role && accessRecord.role._id) {
            var role = openidm.read(_MO_ALPHA_ROLE + accessRecord.role._id, null, ["*", "accessPolicy/*"])

            if (role && role.accessPolicy) {
                var accessPolicy = openidm.read(_MO_ACCESS_POLICY + role.accessPolicy._refResourceId,
                    null, ["*", "dependentRole/*"])

                if (accessPolicy && accessPolicy.dependentRole) {
                    logger.error("[CASCADE-DEBUG] Processing " + accessPolicy.dependentRole.length +
                        " dependent roles for record " + accessRecord._id)

                    // Process each dependent role
                    for (var i = 0; i < accessPolicy.dependentRole.length; i++) {
                        var dependentRole = openidm.read(_MO_ALPHA_ROLE + accessPolicy.dependentRole[i]._id,
                            null, ["*", "businessAppId/*"])

                        if (dependentRole) {
                            // Search for the dependent role access record
                            var searchFilter = 'userIdentifier eq "' + accessRecord.userIdentifier + '"' +
                                ' AND appIdentifier eq "' + dependentRole.businessAppId._refResourceId + '"' +
                                ' AND roleIdentifier eq "' + dependentRole._id + '"' +
                                ' AND recordState eq "0"'

                            if (accessRecord.originalDelegatorIdentifier) {
                                searchFilter += ' AND originalDelegatorIdentifier eq "' +
                                    accessRecord.originalDelegatorIdentifier + '"'
                                searchFilter += ' AND currentDelegatorIdentifier eq "' +
                                    accessRecord.currentDelegatorIdentifier + '"'
                            }

                            var searchResult = openidm.query(input._MO_OBJECT_NAME,
                                { "_queryFilter": searchFilter }, ["*"])

                            if (searchResult.result && searchResult.result.length > 0) {
                                dependentRoleRecords.push(searchResult.result[0])

                                // Create KOG payload for dependent role
                                kogPayloads.push(createKOGPayload(searchResult.result[0]))
                            }
                        }
                    }
                }
            }
        }

        return {
            dependentRoleRecords: dependentRoleRecords,
            kogPayloads: kogPayloads
        }
    }

    /**
     * Create KOG API payload for an access record
     */
    function createKOGPayload(accessRecord) {
        return {
            ApplicationName: accessRecord.app ? accessRecord.app.name : null,
            RoleName: accessRecord.role ? accessRecord.role.name : null,
            OriginalDelegatorKOGID: accessRecord.originalDelegator ?
                accessRecord.originalDelegator.userName : null,
            CurrentDelegatorKOGID: accessRecord.currentDelegator ?
                accessRecord.currentDelegator.userName : null,
            KOGOrgID: accessRecord.user ? accessRecord.user.userName : null,
            OrgBusinessKeyID: accessRecord.businessKey || null
        }
    }

    /**
     * Process cascade deletion for deleteAccess
     * This includes dependent roles processing
     */
    function cascadeDeleteForDeleteAccess(input, accessRecords) {
        return cascadeDeleteFramework({
            input: input,
            accessRecords: accessRecords,
            processorFunction: function (input, cascadeRecords) {
                logger.error("[CASCADE-DEBUG] processorFunction - Received " + cascadeRecords.length + " records to process")
                var deletedRecords = []
                var kogPayloads = []
                var patchRequest = {
                    payload: {
                        updateFields: [
                            {
                                operation: "replace",
                                field: "/recordState",
                                value: "1"
                            },
                            {
                                operation: "add",
                                field: "/audit",
                                value: {
                                    action: "cascade_delete",
                                    reason: "Cascade deletion from parent role removal",
                                    comment: "Automatically deleted due to upstream delegation removal"
                                }
                            }
                        ],
                        requester: input.payload.requester  // Add requester from input
                    },
                    _MO_OBJECT_NAME: input._MO_OBJECT_NAME,
                    _ENDPOINT_NAME: input._ENDPOINT_NAME
                }

                // Reverse cascade records to delete from leaf to root (D→C→B→A instead of A→B→C→D)
                logger.error("[CASCADE-DEBUG] processorFunction - Reversing " + cascadeRecords.length + " records to delete from leaf to root")
                var reversedRecords = []
                for (var r = cascadeRecords.length - 1; r >= 0; r--) {
                    reversedRecords.push(cascadeRecords[r])
                }
                cascadeRecords = reversedRecords
                logger.error("[CASCADE-DEBUG] processorFunction - After reversal, will delete in order: " + cascadeRecords.map(function (rec) { return rec._id }).join(" → "))

                // Process each cascade record
                for (var i = 0; i < cascadeRecords.length; i++) {
                    var record = cascadeRecords[i]
                    logger.error("[CASCADE-DEBUG] processorFunction - Processing record " + i + ": id=" + record._id + ", recordState=" + record.recordState)

                    try {
                        // For soft-deleted records (recordState="1"), skip IDM patch but still call KOG API
                        var isAlreadyDeleted = (record.recordState === "1")

                        if (!isAlreadyDeleted) {
                            logger.error("[CASCADE-DEBUG] processorFunction - Deleting record " + record._id)
                            // Delete the cascade record
                            patchRequest.payload.id = record._id
                            logger.error("[CASCADE-DEBUG] processorFunction - patchRequest: " + JSON.stringify(patchRequest))
                            patchAccess(patchRequest)
                            logger.error("[CASCADE-DEBUG] processorFunction - Successfully deleted record " + record._id)

                            deletedRecords.push(record)
                        } else {
                            logger.error("[CASCADE-DEBUG] processorFunction - Record " + record._id + " already soft-deleted in IDM (recordState=1), skipping IDM patch")
                        }

                        // Call KOG API to remove role from KOG system (for both active and soft-deleted records)
                        // This cleans up ghost delegations in KOG for historical soft-deleted IDM records
                        if (record.user && record.user.userName && record.role && record.role.name && record.app && record.app.name) {
                            logger.error("[CASCADE-DEBUG] processorFunction - Calling KOG API for record " + record._id + " (recordState=" + record.recordState + ")")
                            try {
                                // Get current requester's KOG ID (the user performing the deletion)
                                var requestorKOGID = record.user.userName; // default to record user
                                if (input.payload && input.payload.requester && input.payload.requester.displayId) {
                                    try {
                                        var requesterDetails = getUserDetails(input.payload.requester.displayId);
                                        if (requesterDetails && requesterDetails.userName) {
                                            requestorKOGID = requesterDetails.userName;
                                            logger.error("[CASCADE-DEBUG] processorFunction - Using requester KOG ID: " + requestorKOGID);
                                        }
                                    } catch (e) {
                                        logger.error("[CASCADE-DEBUG] processorFunction - Failed to get requester details: " + e);
                                    }
                                }

                                // Get original delegator userName (KOG ID) - may need to fetch from alpha_user
                                var originalDelegatorKOGID = getDelegatorUserName(record.originalDelegator)

                                // Get current delegator userName (KOG ID)
                                var currentDelegatorKOGID = getDelegatorUserName(record.currentDelegator)

                                // Log org-related fields for debugging
                                logger.error("[CASCADE-DEBUG] processorFunction - record.orgId: " + record.orgId);
                                logger.error("[CASCADE-DEBUG] processorFunction - record.kogOrgBusinessKeyId: " + record.kogOrgBusinessKeyId);
                                logger.error("[CASCADE-DEBUG] processorFunction - Using KOGOrgID: " + ((record.orgId && record.orgId !== "" && record.orgId !== null) ? record.orgId : "0"));
                                logger.error("[CASCADE-DEBUG] processorFunction - Using OrgBusinessKeyID: " + (record.kogOrgBusinessKeyId || null));
                                logger.error("[CASCADE-DEBUG] processorFunction - CurrentDelegatorKOGID: " + currentDelegatorKOGID);

                                // Build KOG API payload with CurrentDelegatorKOGID
                                var userAuth = {
                                    ApplicationName: record.app.name,
                                    RoleName: record.role.name,
                                    CurrentDelegatorKOGID: currentDelegatorKOGID,
                                    OriginalDelegatorKOGID: originalDelegatorKOGID,
                                    KOGOrgID: (record.orgId && record.orgId !== "" && record.orgId !== null) ? record.orgId : "0",
                                    OrgBusinessKeyID: record.kogOrgBusinessKeyId || null
                                }

                                var kogPayload = {
                                    "KOGID": record.user.userName,
                                    "RequestorKOGID": requestorKOGID,
                                    "TransactionID": input.payload.transactionId ? input.payload.transactionId : java.util.UUID.randomUUID().toString(),
                                    "UserAuths": [userAuth]
                                }
                                logger.error("[CASCADE-DEBUG] processorFunction - KOG Payload: " + JSON.stringify(kogPayload))

                                // Query user authorizations BEFORE deletion
                                var beforeAuthPayload = {
                                    "KOGID": record.user.userName
                                }
                                logger.error("[KOG-DELETE-DEBUG-VERIFY] BEFORE deletion - Fetching authorizations for KOGID: " + record.user.userName)
                                var beforeAuthResponse = invokeKOGAPIUserAuthorizations(beforeAuthPayload)
                                if (beforeAuthResponse && beforeAuthResponse.UserAuthorizations) {
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] BEFORE deletion - User has " + beforeAuthResponse.UserAuthorizations.length + " authorizations")
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] BEFORE deletion - Authorizations: " + JSON.stringify(beforeAuthResponse.UserAuthorizations))
                                } else {
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] BEFORE deletion - No authorizations found or error fetching")
                                }

                                // Perform the deletion
                                var kogResponse = invokeKOGAPIRoleRemoval(kogPayload)
                                logger.error("[CASCADE-DEBUG] processorFunction - KOG Response: " + JSON.stringify(kogResponse))

                                // Query user authorizations AFTER deletion
                                var afterAuthPayload = {
                                    "KOGID": record.user.userName
                                }
                                logger.error("[KOG-DELETE-DEBUG-VERIFY] AFTER deletion - Fetching authorizations for KOGID: " + record.user.userName)
                                var afterAuthResponse = invokeKOGAPIUserAuthorizations(afterAuthPayload)
                                if (afterAuthResponse && afterAuthResponse.UserAuthorizations) {
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] AFTER deletion - User has " + afterAuthResponse.UserAuthorizations.length + " authorizations")
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] AFTER deletion - Authorizations: " + JSON.stringify(afterAuthResponse.UserAuthorizations))

                                    // Check if the target role was actually deleted
                                    var targetStillExists = false
                                    for (var a = 0; a < afterAuthResponse.UserAuthorizations.length; a++) {
                                        var auth = afterAuthResponse.UserAuthorizations[a]
                                        if (auth.ApplicationName === userAuth.ApplicationName && auth.RoleName === userAuth.RoleName) {
                                            targetStillExists = true
                                            break
                                        }
                                    }

                                    if (targetStillExists) {
                                        logger.error("[KOG-DELETE-DEBUG-VERIFY] WARNING - Target role still exists after deletion: " + userAuth.ApplicationName + "/" + userAuth.RoleName)
                                    } else {
                                        logger.error("[KOG-DELETE-DEBUG-VERIFY] SUCCESS - Target role has been removed: " + userAuth.ApplicationName + "/" + userAuth.RoleName)
                                    }
                                } else {
                                    logger.error("[KOG-DELETE-DEBUG-VERIFY] AFTER deletion - No authorizations found or error fetching")
                                }
                                kogPayloads.push(kogPayload)
                            } catch (kogError) {
                                logger.error("[CASCADE-DEBUG] processorFunction - KOG API call failed for record " + record._id + ": " + JSON.stringify(kogError))
                                logger.error("[CASCADE-DEBUG] processorFunction - WARNING: KOG API failure may indicate data inconsistency")
                                // Continue with cascade deletion despite KOG error
                            }
                        } else {
                            var missingFields = []
                            if (!record.user || !record.user.userName) missingFields.push("user.userName")
                            if (!record.role || !record.role.name) missingFields.push("role.name")
                            if (!record.app || !record.app.name) missingFields.push("app.name")
                            logger.error("[CASCADE-DEBUG] processorFunction - Skipping KOG API call for record " + record._id + " (missing fields: " + missingFields.join(", ") + ")")
                        }

                        // Process dependent roles for this record
                        var dependentResult = processDependentRolesForRecord(record, {
                            input: input,
                            _MO_ALPHA_ROLE: "managed/alpha_role/",
                            _MO_ACCESS_POLICY: "managed/alpha_kyid_enrollment_access_policy/"
                        })

                        // Delete dependent role records
                        for (var j = 0; j < dependentResult.dependentRoleRecords.length; j++) {
                            var depRecord = dependentResult.dependentRoleRecords[j]
                            patchRequest.payload.id = depRecord._id
                            patchAccess(patchRequest)
                            deletedRecords.push(depRecord)
                        }

                        kogPayloads = kogPayloads.concat(dependentResult.kogPayloads)

                    } catch (e) {
                        logger.error("[CASCADE-DEBUG] Failed to cascade delete record " + record._id + ": " + JSON.stringify(e))
                        logger.error("[CASCADE-DEBUG] Error message: " + (e.message || e.toString()))
                    }
                }

                logger.error("[CASCADE-DEBUG] Cascade deletion - found " + deletedRecords.length + " total records to delete")

                return {
                    deletedRecords: deletedRecords,
                    kogPayloads: kogPayloads
                }
            }
        })
    }

    /**
     * Remove roles from a user if no active access records remain
     * @param {string} userId - The user identifier
     * @param {Array} roleIdsToCheck - Array of role IDs to check for removal
     * @returns {Object} - { roleRemovalOperations: [], appRoleArray: [], removedCount: number }
     */
    function removeRolesFromUserIfNoActiveAccess(userId, roleIdsToCheck) {
        logger.error("[ROLE-REMOVAL] Starting role removal check for user: " + userId + " with " + roleIdsToCheck.length + " roles")

        var result = {
            roleRemovalOperations: [],
            appRoleArray: [],
            removedCount: 0
        }

        try {
            // Get user's existing roles
            var userExistingRoles = openidm.query("managed/alpha_user/" + userId + "/roles", {
                "_queryFilter": "true"
            }, ["*"]).result

            logger.error("[ROLE-REMOVAL] User " + userId + " has " + userExistingRoles.length + " existing roles")

            roleIdsToCheck.forEach(function (roleId) {
                // Check if user still has any active access for this role
                var userAccessResult = openidm.query("managed/alpha_kyid_access", {
                    "_queryFilter": '/roleIdentifier eq "' + roleId + '" and userIdentifier eq "' + userId + '"'
                }, ["*", "role/*", "app/*"])

                var shouldRemoveRole = true
                var userAccessList = userAccessResult.result

                logger.error("[ROLE-REMOVAL] User " + userId + " has " + userAccessList.length + " access records for role " + roleId)

                for (var i = 0; i < userAccessList.length; i++) {
                    if (userAccessList[i].recordState == 0 || userAccessList[i].recordState === "0" || userAccessList[i].recordState === "ACTIVE") {
                        shouldRemoveRole = false
                        logger.error("[ROLE-REMOVAL] User " + userId + " still has active access for role " + roleId + ", skipping removal")
                        break
                    } else {
                        // Collect app/role info for email notification
                        var appRoleJSON = {
                            role: null,
                            app: null
                        }

                        if (userAccessList[i].app != null && userAccessList[i].app) {
                            appRoleJSON.app = userAccessList[i].app.name
                        }

                        if (userAccessList[i].role != null && userAccessList[i].role) {
                            appRoleJSON.role = userAccessList[i].role.name
                        }

                        // Check for duplicates
                        var isDuplicate = false
                        for (var j = 0; j < result.appRoleArray.length; j++) {
                            if (result.appRoleArray[j].role === appRoleJSON.role && result.appRoleArray[j].app === appRoleJSON.app) {
                                isDuplicate = true
                                break
                            }
                        }

                        if (!isDuplicate && appRoleJSON.role && appRoleJSON.app) {
                            result.appRoleArray.push(appRoleJSON)
                        }
                    }
                }

                if (shouldRemoveRole) {
                    // Find the role in user's existing roles and create removal operation
                    for (var k = 0; k < userExistingRoles.length; k++) {
                        if (userExistingRoles[k]._refResourceId == roleId) {
                            var removeRoleOperation = {
                                "operation": "remove",
                                "field": "/roles",
                                "value": {
                                    "_ref": userExistingRoles[k]._ref,
                                    "_refProperties": userExistingRoles[k]._refProperties,
                                    "_refResourceCollection": userExistingRoles[k]._refResourceCollection,
                                    "_refResourceId": userExistingRoles[k]._refResourceId
                                }
                            }
                            result.roleRemovalOperations.push(removeRoleOperation)
                            logger.error("[ROLE-REMOVAL] Adding role removal operation for user " + userId + ", role " + roleId)
                            break
                        }
                    }
                }
            })

            // Execute role removal if there are operations
            if (result.roleRemovalOperations.length > 0) {
                logger.error("[ROLE-REMOVAL] Executing " + result.roleRemovalOperations.length + " role removal operations for user " + userId)
                var removeResponse = openidm.patch("managed/alpha_user/" + userId, null, result.roleRemovalOperations, null, ["*", "*/roles"])
                logger.error("[ROLE-REMOVAL] Role removal response for user " + userId + ": " + JSON.stringify(removeResponse))
                result.removedCount = result.roleRemovalOperations.length
            } else {
                logger.error("[ROLE-REMOVAL] No roles to remove for user " + userId)
            }

        } catch (error) {
            logger.error("[ROLE-REMOVAL] Error removing roles for user " + userId + ": " + JSON.stringify(error))
        }

        return result
    }

    try {
        logDebug(input.transactionId, input.endPoint, "deleteAccess", `Input parameter: ${JSON.stringify(input.payload)}`)

        logger.error("***** DELETE ACCESS - QUERY FILTER: " + (input.payload.queryFilter || "NO QUERY FILTER PROVIDED"))
        logger.error("***** DELETE ACCESS - FULL INPUT PAYLOAD: " + JSON.stringify(input.payload))

        const patchRequest = input

        /* Check if payload exits  */
        if (input.payload) {
            /* Search for access records that need to be deleted */

            const accessResult = searchAccess(input)
            logger.error("access result: " + JSON.stringify(accessResult))
            let appRoleJSON = {}


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

                requestedAccountId = access.userIdentifier
                logger.error("****DEBUG: requestedAccountId value => " + requestedAccountId) //Remove Later
                // Get user email using getUserDetails function
                if (!userEmail && requestedAccountId) {
                    var requestedUserDetails = getUserDetails(requestedAccountId);
                    logger.error("****DEBUG: requestedAccountId value => " + JSON.stringify(requestedUserDetails)) //Remove Later
                    userEmail = requestedUserDetails && requestedUserDetails.mail ? requestedUserDetails.mail : "";
                    logger.error("****DEBUG: userEmail value => " + userEmail) //Remove Later
                }

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

                        /* Cascade delete delegated access records using the new framework */
                        try {
                            logger.error("Using cascade deletion framework for access ID: " + access._id)
                            logger.error("[CASCADE-DEBUG] deleteAccess - Starting cascade for user: " + access.userIdentifier + ", role: " + access.roleIdentifier)

                            // Call the cascade deletion framework
                            cascadeResult = cascadeDeleteForDeleteAccess(input, [access])

                            logger.error("[CASCADE-DEBUG] deleteAccess - Cascade completed, deleted " + cascadeResult.deletedRecords.length + " total records")

                        } catch (cascadeError) {
                            logger.error("[CASCADE-DEBUG] Cascade deletion failed for access " + access._id + ": " + cascadeError)
                            // Continue with the main deletion even if cascade fails
                        }

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
                                            OriginalDelegatorKOGID: getDelegatorUserName(access.originalDelegator),
                                            // CurrentDelegatorKOGID removed to avoid -115 errors
                                            KOGOrgID: access.user.userName,
                                            OrgBusinessKeyID: access.kogOrgBusinessKeyId || null
                                        })
                                    }

                                    logger.error("revoke user auths: " + JSON.stringify(revokeUserAuths))
                                    logger.error("dependent roles: " + dependentRoles)

                                    dependentRoles.forEach(depRole => {
                                        if (!roleIds.includes(depRole._id)) {
                                            roleIds.push(depRole._id);
                                        }
                                    });
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
                                    OriginalDelegatorKOGID: getDelegatorUserName(access.originalDelegator),
                                    // CurrentDelegatorKOGID removed to avoid -115 errors
                                    KOGOrgID: access.user.userName,
                                    OrgBusinessKeyID: access.businessKey ? access.businessKey : null
                                }
                            ]
                        }

                        revokeUserAuths.forEach(authEntry => {
                            kogAPIPayload.UserAuths.push(authEntry)
                        })

                        // Note: KOG API calls are now handled within cascade deletion framework
                        // Each record (including the original and all downstream) gets its KOG API call
                        // during cascade processing, so we don't need to call it again here
                        logger.error("[KOG-DELETE-DEBUG] deleteAccess - KOG API calls completed during cascade deletion")
                        logger.error("[KOG-DELETE-DEBUG] deleteAccess - Skipping redundant KOG API call for access: " + access._id)


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

            // =====================================================================
            // ROLE REMOVAL - Remove roles from the requested user
            // =====================================================================
            logger.error("requested account id: " + requestedAccountId)
            logger.error("role ids are: " + JSON.stringify(roleIds))

            // Use the common function to remove roles from the requested user
            var userRemovalResult = removeRolesFromUserIfNoActiveAccess(requestedAccountId, roleIds)

            // Collect appRolearray for audit logging (merge with existing)
            if (userRemovalResult.appRoleArray && userRemovalResult.appRoleArray.length > 0) {
                userRemovalResult.appRoleArray.forEach(function (appRole) {
                    var isDuplicate = false
                    for (var j = 0; j < appRolearray.length; j++) {
                        if (appRolearray[j].role === appRole.role && appRolearray[j].app === appRole.app) {
                            isDuplicate = true
                            break
                        }
                    }
                    if (!isDuplicate) {
                        appRolearray.push(appRole)
                    }
                })
            }

            // Send email notification if roles were removed for the requested user
            if (userRemovalResult.removedCount > 0 && userRemovalResult.appRoleArray.length > 0) {
                sendEmailfn(requestedAccountId, userRemovalResult.appRoleArray, "kyid2B1RoleRemoved", "KYID-SYSTEM")
                logger.error("[ROLE-REMOVAL] Email sent to requested user " + requestedAccountId + " for " + userRemovalResult.removedCount + " removed roles")
            }

            // =====================================================================
            // CASCADE ROLE REMOVAL - Remove roles from delegatees
            // =====================================================================
            if (cascadeResult && cascadeResult.deletedRecords && cascadeResult.deletedRecords.length > 0) {
                logger.error("[CASCADE-ROLE-REMOVAL] Starting role removal for " + cascadeResult.deletedRecords.length + " cascade-deleted records")
                logger.error("[CASCADE-ROLE-REMOVAL] requestedAccountId: " + requestedAccountId)

                // Log all deleted records for debugging
                for (var d = 0; d < cascadeResult.deletedRecords.length; d++) {
                    logger.error("[CASCADE-ROLE-REMOVAL] deletedRecord[" + d + "]: userIdentifier=" + cascadeResult.deletedRecords[d].userIdentifier + ", roleIdentifier=" + cascadeResult.deletedRecords[d].roleIdentifier)
                }

                // Group deleted records by user
                var delegateeRoleMap = {}  // { userIdentifier: [roleId1, roleId2, ...] }

                for (var i = 0; i < cascadeResult.deletedRecords.length; i++) {
                    var deletedRecord = cascadeResult.deletedRecords[i]
                    var delegateeId = deletedRecord.userIdentifier
                    var deletedRoleId = deletedRecord.roleIdentifier

                    // Skip if this is the requested user (already handled above)
                    if (delegateeId === requestedAccountId) {
                        logger.error("[CASCADE-ROLE-REMOVAL] Skipping requested user: " + delegateeId)
                        continue
                    }

                    if (!delegateeRoleMap[delegateeId]) {
                        delegateeRoleMap[delegateeId] = []
                    }

                    if (delegateeRoleMap[delegateeId].indexOf(deletedRoleId) === -1) {
                        delegateeRoleMap[delegateeId].push(deletedRoleId)
                    }
                }

                // Process each delegatee using the common function
                for (var delegateeId in delegateeRoleMap) {
                    if (delegateeRoleMap.hasOwnProperty(delegateeId)) {
                        var delegateeRoleIds = delegateeRoleMap[delegateeId]
                        logger.error("[CASCADE-ROLE-REMOVAL] Processing delegatee: " + delegateeId + " with roles: " + JSON.stringify(delegateeRoleIds))

                        var removalResult = removeRolesFromUserIfNoActiveAccess(delegateeId, delegateeRoleIds)

                        // Send email notification if roles were removed
                        if (removalResult.removedCount > 0 && removalResult.appRoleArray.length > 0) {
                            sendEmailfn(delegateeId, removalResult.appRoleArray, "kyid2B1RoleRemoved", "KYID-SYSTEM")
                            logger.error("[CASCADE-ROLE-REMOVAL] Email sent to delegatee " + delegateeId + " for " + removalResult.removedCount + " removed roles")
                        }
                    }
                }

                logger.error("[CASCADE-ROLE-REMOVAL] Completed role removal for all delegatees")
            }

            // Audit logger for successful role removal - placed after all operations complete
            let eventCode = "ROM003";
            let eventName = "Remove Role Success";
            let eventDetails = {
                removedRoles: appRolearray || [],  // Contains both role names and app names: [{role:"Admin", app:"Portal"}, ...]
                totalAccessRecords: (patchResponse && patchResponse.length) || 0,
                successCount: (patchResponse && patchResponse.filter(r => r.status === "0").length) || 0,
                failureCount: (patchResponse && patchResponse.filter(r => r.status === "1").length) || 0,
                rolesRemovedCount: (roleRemovalOperations && roleRemovalOperations.length) || 0,
                reason: input.payload.confirmation ? input.payload.confirmation.reason : "",
                comment: input.payload.confirmation ? input.payload.confirmation.comment : "",
                IP: input.auditLogger.clientIP ? input.auditLogger.clientIP : "",
                Browser: input.auditLogger.clientBrowser ? input.auditLogger.clientBrowser : ""
            };

            auditLogger(
                eventCode,
                eventName,
                input.auditLogger.sessionDetailsauditLogger,
                eventDetails,
                input.payload.requester.displayId,
                requestedAccountId,
                input.auditLogger.transactionIdauditLogger,
                userEmail,
                "KYID Business Support Portal",
                input.auditLogger.sessionRefIDauditLogger
            );

            return patchResponse
        } else {
            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "input.payload"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw throwException(JSON.stringify(invalidRequestException))
        }
    } catch (error) {

        // Safely get user email in catch block if not already obtained
        if (!userEmail && requestedAccountId) {
            try {
                var requestedUserDetails = getUserDetails(requestedAccountId);
                userEmail = requestedUserDetails && requestedUserDetails.mail ? requestedUserDetails.mail : "";
            } catch (err) {
                logger.error("Failed to get user email in catch block: " + err);
            }
        }

        // Audit logger for failed role removal - placed in catch block
        let eventCode = "ROM004";
        let eventName = "Remove Role Failure";
        let eventDetails = {
            removedRoles: appRolearray || [],  // Contains both role names and app names: [{role:"Admin", app:"Portal"}, ...]
            totalAccessRecords: patchResponse ? patchResponse.length : 0,
            successCount: patchResponse ? patchResponse.filter(r => r.status === "0").length : 0,
            failureCount: patchResponse ? patchResponse.filter(r => r.status === "1").length : 0,
            queryFilter: input.payload ? input.payload.queryFilter : "",
            error: error.message || JSON.stringify(error),
            reason: input.payload && input.payload.confirmation ? input.payload.confirmation.reason : "",
            comment: input.payload && input.payload.confirmation ? input.payload.confirmation.comment : ""
        };

        auditLogger(
            eventCode,
            eventName,
            input.auditLogger.sessionDetailsauditLogger,
            eventDetails,
            input.payload && input.payload.requester ? input.payload.requester.displayId : "",
            requestedAccountId || "",
            input.auditLogger.transactionIdauditLogger,
            userEmail,
            "",
            input.auditLogger.sessionRefIDauditLogger
        );

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
                    userinKyid = searchObjectByQuery(input, "managed/alpha_user", userIdQueryFilter);
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

                            // Check if this role-app combination already exists - using manual loop for reliability
                            var isDuplicate = false
                            for (var j = 0; j < appRolearray.length; j++) {
                                if (appRolearray[j].role === appRoleJSON.role && appRolearray[j].app === appRoleJSON.app) {
                                    isDuplicate = true
                                    break
                                }
                            }

                            if (!isDuplicate) {
                                // Le: add role in email only if this role exists for user
                                for (let i = 0; i < userExistingRoles.length; i++) {
                                    if (userExistingRoles[i]._refResourceId == roleId) {
                                        appRolearray.push(appRoleJSON)
                                    }
                                }
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

function getLangCode(code, languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}


function sendEmailfn(id, appRolearray, templateId, requesterUser) {

    logger.error("Inside sendEmailfn in endpoint/access_v2B_aaron_test3_authfilter")
    let givenName = null
    let sn = null
    let mail = null
    let phoneContact = null
    let emailContact = null
    let userQueryResult = null
    let appName = "KYID Helpdesk"
    let userResponse = null
    var languageMap = identityServer.getProperty("esv.language.preference");
    var locale = "en"

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
        }, ["mail", "givenName", "sn", "mail", "frIndexedString1", "frIndexedString2", "custom_secondaryMail", "custom_languagePreference"])
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
        if (userResponse && userResponse.custom_languagePreference && userResponse.custom_languagePreference != null) {
            if (languageMap && languageMap != null) {
                locale = getLangCode(userResponse.custom_languagePreference, languageMap);
            }
        }
    }

    // Build roleNamesHtml - list of roles with their applications
    var applicationNames = []
    var roleNames = [];
    var roleNamesHtml = "<ul style='list-style-type:none;padding:0;margin:0'>"
    //var app_Name = null
    appRolearray.forEach(function (appRole) {
        roleNamesHtml += "<li style='padding:5px 0'><strong>" + appRole.app + ":</strong> " + appRole.role + "</li>"
        roleNames.push(appRole.role);
        //app_Name = appRole.app
        // })



        if (applicationNames.indexOf(appRole.app) === -1) {
            applicationNames.push(appRole.app)
        }
    })
    roleNamesHtml += "</ul>"
    var applicationNamesStr = applicationNames.join(", ")

    logger.error("BeforeSendingEmailFn")
    logger.error("roleNamesHtml: " + roleNamesHtml)

    // Send one consolidated email with all roles
    sendMail(mail, givenName, sn, roleNamesHtml, phoneContact, emailContact, templateId, requesterUser, applicationNamesStr, locale)
}


function sendMail(mail, givenName, sn, roleNamesHtml, phoneContact, emailContact, templateId, requesterUser, applicationNames, locale) {
    try {
        var params = new Object();
        var easternTimeStamp = isoToEastern();
        logger.error("Inside sendMail in endpoint/access_v2B_aaron_test3_authfilter")
        //  var easternTimeStamp = dateTime
        params.templateName = templateId
        params.to = mail;
        params._locale = locale || "en"
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "mail": mail,
            "timeStamp": easternTimeStamp,
            "roleNamesHtml": roleNamesHtml,
            "phoneContact": phoneContact,
            "applicationNames": applicationNames,
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


function getDelegateRolesForUser(input) {
    let result = [];
    let userAccessResult = searchAccess(input);
    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"
    const _MO_ALPHA_ROLE = "managed/alpha_role/"
    if (userAccessResult) {
        for (let userAccess of userAccessResult) {
            if (userAccess.role) {
                role = openidm.read(`${_MO_ALPHA_ROLE}${userAccess.role._refResourceId}`, null, ["*", "accessPolicy/*"])
                if (role && role.isDelegable) {
                    let roleAccessPolicy = role.accessPolicy
                    if (roleAccessPolicy) {
                        /* Read access policy */
                        accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "preRequisites/*", "mutuallyExclusiveRole/*"])
                        if (accessPolicy) {
                            if (accessPolicy.preRequisites) {
                                userAccess.preRequisites = accessPolicy.preRequisites
                            }
                        }
                        result.push(userAccess)
                    }
                }
            }
        }
    }
    return result
}

/**
 * Get available roles for delegation to a delegatee
 *
 * SUPPORTS TWO FORMATS:
 * =====================
 *
 * FORMAT 1 - RECOMMENDED (New):
 * -----------------------------
 * Send delegatorId/delegateeId in payload:
 * {
 *   "delegatorId": "{delegatorId}",
 *   "delegateeId": "{delegateeId}"
 * }
 *
 * FORMAT 2 - LEGACY (Has Issues):
 * --------------------------------
 * delegateeAccessQuery = "userIdentifier eq '{delegateeId}' AND currentDelegatorIdentifier eq '{delegatorId}'"
 *
 * PROBLEM WITH LEGACY FORMAT:
 * The legacy query searches for roles ALREADY delegated BY the delegator, not roles OWNED BY the delegator.
 * This causes first-time delegation to return empty results.
 *
 * PROCESSING LOGIC:
 * ----------------
 * 1. Extract delegatorId and delegateeId from either format
 * 2. Query for already delegated roles to avoid duplicates
 * 3. Get delegator's OWN roles (not already-delegated roles)
 * 4. Filter out duplicates from results
 */
function getExistingRolesForDelegatee(delegateeAccessQuery, input) {

    let result = [];
    let delegateeAccessSearchResult;
    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"
    const _MO_ALPHA_ROLE = "managed/alpha_role/"
    let delegatorId = null;
    let delegateeId = null;
    let alreadyDelegatedAccessKeys = new Set();
    let modifiedQuery = "";

    // STEP 1: Extract delegatorId and delegateeId from either format

    // Option 1: Check for recommended format (new)
    if (input.payload && input.payload.delegatorId && input.payload.delegateeId) {
        delegatorId = input.payload.delegatorId;
        delegateeId = input.payload.delegateeId;

        // Option 2: Parse from legacy query string to support delegation
    } else if (delegateeAccessQuery && delegateeAccessQuery.includes("currentDelegatorIdentifier")) {
        const delegatorMatch = delegateeAccessQuery.match(/currentDelegatorIdentifier eq '([^']+)'/);
        const delegateeMatch = delegateeAccessQuery.match(/userIdentifier eq '([^']+)'/);

        if (delegatorMatch && delegateeMatch) {
            delegatorId = delegatorMatch[1];
            delegateeId = delegateeMatch[1];
        }
    }

    // STEP 2: Process delegation if we have both IDs (from either format)
    if (delegatorId && delegateeId) {

        // Check for already delegated roles to avoid duplicates
        const existingDelegationQuery = "userIdentifier eq '" + delegateeId + "' AND currentDelegatorIdentifier eq '" + delegatorId + "'";

        let existingDelegationSearch = JSON.parse(JSON.stringify(input));
        existingDelegationSearch._MO_OBJECT_NAME = "managed/alpha_kyid_access/";
        existingDelegationSearch.payload = {
            queryFilter: existingDelegationQuery + ' AND (recordState eq "0" or recordState eq "ACTIVE")',
            returnProperties: ["roleIdentifier", "appIdentifier", "originalDelegatorIdentifier"]
        };

        var existingDelegations = searchAccess(existingDelegationSearch);
        if (existingDelegations && existingDelegations.length > 0) {
            existingDelegations.forEach(function(d) {
                var effectiveOriginalDelegator = d.originalDelegatorIdentifier || delegatorId || "";
                var key = (d.appIdentifier || "") + "|" + (d.roleIdentifier || "") + "|" + effectiveOriginalDelegator + "|" + delegatorId;
                alreadyDelegatedAccessKeys.add(key);
            });
        }

        // Build query for delegator's OWN roles (not already-delegated roles)
        modifiedQuery = "userIdentifier eq '" + delegatorId + "'";

        // STEP 3: Use original query (includes legacy format)
    } else if (delegateeAccessQuery && delegateeAccessQuery.length > 0) {
        modifiedQuery = delegateeAccessQuery;
    }

    // Common processing for both formats
    if (modifiedQuery && modifiedQuery.length > 0) {
        // Create a deep copy to avoid modifying the original input
        let delegateeAccessSearch = JSON.parse(JSON.stringify(input));

        // Ensure _MO_OBJECT_NAME is set
        if (!delegateeAccessSearch._MO_OBJECT_NAME) {
            delegateeAccessSearch._MO_OBJECT_NAME = "managed/alpha_kyid_access/";
        }

        delegateeAccessSearch.payload = {
            queryFilter: modifiedQuery + ' AND (recordState eq "0" or recordState eq "ACTIVE")',
            returnProperties: input.payload.returnProperties || ["*", "role/*", "user/*", "app/*"]
        }
        /* Search delegatee access - only return active records */
        delegateeAccessSearchResult = searchAccess(delegateeAccessSearch);
        if (delegateeAccessSearchResult) {
            for (let userAccess of delegateeAccessSearchResult) {
                if (userAccess.role) {
                    // Check if this exact access (app+role+delegation chain) is already delegated to the delegatee
                    // NOTE: Using 'var' instead of 'const' because Rhino JS engine does not create
                    // a new block scope per iteration in for...of loops — const/let values become stale.
                    if (alreadyDelegatedAccessKeys.size > 0) {
                        var effectiveOriginalDelegator = userAccess.originalDelegatorIdentifier || userAccess.userIdentifier || "";
                        var accessKey = (userAccess.appIdentifier || "") + "|" + (userAccess.roleIdentifier || "") + "|" + effectiveOriginalDelegator + "|" + (userAccess.userIdentifier || "");
                        if (alreadyDelegatedAccessKeys.has(accessKey)) {
                            logger.error("getExistingRolesForDelegatee: FILTERED already-delegated access roleId=" + userAccess.roleIdentifier + " accessKey=" + accessKey);
                            continue;
                        }
                    }

                    let role = openidm.read(`${_MO_ALPHA_ROLE}${userAccess.role._refResourceId}`, null, ["*", "accessPolicy/*"])

                    if (role) {
                        let roleAccessPolicy = role.accessPolicy
                        if (roleAccessPolicy) {
                            /* Read access policy */
                            accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "preRequisites/*", "mutuallyExclusiveRole/*"])
                            if (accessPolicy) {
                                if (accessPolicy.preRequisites) {
                                    userAccess.preRequisites = accessPolicy.preRequisites
                                }
                            }
                            result.push(userAccess)
                        }
                    }
                }
            }
        }
    }
    return result
}

function getAllRolesForBusinessAppID(input) {
    let result = [];
    const appRoles = getAvailableApplicationRoles(input);
    const _MO_ALPHA_ROLE = "managed/alpha_role/"
    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"

    /* Iterate through user's access result */
    for (let availableRole of appRoles) {
        appRole = openidm.read(`${_MO_ALPHA_ROLE}${availableRole}`, null, ["*", "accessPolicy/*", "businessAppId/*"])
        if (appRole) {
            if (appRole.accessPolicy && appRole.accessPolicy._refResourceId) {
                let accessPolicy = openidm.read(
                    `${_MO_ACCESS_POLICY}${appRole.accessPolicy._refResourceId}`,
                    null,
                    ["*", "preRequisites/*", "mutuallyExclusiveRole/*"]
                )
                if (accessPolicy && accessPolicy.preRequisites) {
                    appRole.preRequisites = accessPolicy.preRequisites
                }
            }
            result.push(appRole)
        }
    }
    return result
}

function getUserExistingRoles(input) {
    let role = null
    let accessPolicy = null
    let result = []
    let userRoleIds = []
    let mutualExRoles = []
    // Extract userIdentifier from the original query filter
    let userIdentifier = null;
    if (input.payload && input.payload.queryFilter) {
        let match = input.payload.queryFilter.match(/userIdentifier eq '([^']+)'/);
        if (match) {
            userIdentifier = match[1];
        }
    }

    // Create a modified input to search for user's existing access
    let userAccessInput = JSON.parse(JSON.stringify(input));
    //if (input.payload && input.payload.appId && userIdentifier) {
    //    userAccessInput.payload.queryFilter = "appIdentifier eq '" + input.payload.appId + "' AND userIdentifier eq '" + userIdentifier + "' AND (recordState eq '0' or recordState eq 'ACTIVE')";
    //}
    if (input.payload && userIdentifier) {
        userAccessInput.payload.queryFilter = "userIdentifier eq '" + userIdentifier + "' AND (recordState eq '0' or recordState eq 'ACTIVE')";
        logger.warn("MODIFIED QUERY FOR USER ACCESS (ALL APPS): " + userAccessInput.payload.queryFilter)
    }

    let userAccessResult = searchAccess(userAccessInput);

    const _MO_ACCESS_POLICY = "managed/alpha_kyid_enrollment_access_policy/"
    const _MO_ALPHA_ROLE = "managed/alpha_role/"
    if (userAccessResult) {
        /* Iterate through user access result. */
        userAccessResult.forEach(access => {
            userRoleIds.push(access.role._refResourceId)
        })
        /* Get all business application roles */
        const availableAppRoles = getAvailableApplicationRoles(input)
        let mergedAppUserRoles = availableAppRoles.concat(userRoleIds);

        /* Iterate through user's access result */
        for (let availableRole of mergedAppUserRoles) {
            role = openidm.read(`${_MO_ALPHA_ROLE}${availableRole}`, null, ["*", "accessPolicy/*", "businessAppId/*"])
            if (role) {
                /* Check if the role is not org scoped. */
                if (!role.isOrgScopedRole) {
                    let roleAccessPolicy = role.accessPolicy
                    if (roleAccessPolicy) {
                        /* Read access policy */
                        accessPolicy = openidm.read(`${_MO_ACCESS_POLICY}${roleAccessPolicy._refResourceId}`, null, ["*", "preRequisites/*", "mutuallyExclusiveRole/*"])

                        /* Add prerequisites to all roles (not just user's existing roles) */
                        if (accessPolicy && accessPolicy.preRequisites) {
                            role.preRequisites = accessPolicy.preRequisites
                        }

                        /* Check mutually exclusive roles only for user's existing roles */
                        if (userRoleIds && userRoleIds.includes(role._id)) {
                            let isAllowedRequesteeTypeCommonwealth = false
                            /* Check if there is any CommonwealthType of access */
                            if (accessPolicy.enrollmentRequestSetting) {
                                for (let enrollmentSetting of accessPolicy.enrollmentRequestSetting) {
                                    if (enrollmentSetting.allowedRequesteeType == '2') {
                                        isAllowedRequesteeTypeCommonwealth = true
                                    }
                                }
                            }
                            if (accessPolicy && accessPolicy.enrollmentRequestSetting && !(isAllowedRequesteeTypeCommonwealth)) {
                                let mutualExclusiveRoles = accessPolicy.mutuallyExclusiveRole
                                /* Check if the user has any of the mutually exclusive roles. */
                                if (mutualExclusiveRoles) {
                                    logger.warn("Role: " + role.name + " (" + role._id + ") has mutually exclusive roles: " + JSON.stringify(mutualExclusiveRoles.map(function (r) { return r.name + " (" + r._id + ")"; })))
                                    mutualExclusiveRoles.forEach(exclusiveRole => {
                                        logger.warn("EXCLUDING Role: " + role.name + " (" + role._id + ") because user has exclusive role: " + exclusiveRole._id)
                                        mutualExRoles.push(exclusiveRole._id)
                                    })
                                }
                            }
                        }
                    }
                }
            }
            result.push(role)
        }
        let tempResult = [];
        if (mutualExRoles && result) {
            result.forEach(role => {
                if (!mutualExRoles.includes(role._id)) {
                    tempResult.push(role);
                }
            })
        }

        if (userRoleIds && tempResult) {
            result = [];
            tempResult.forEach(role => {
                if (!userRoleIds.includes(role._id)) {
                    result.push(role);
                }
            })
        }

        return result
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
        /* Check if payload is present */
        if (input.payload) {
            const isDelegationContext = input.payload.isDelegationContext
            const delegateeAccessQuery = input.payload.delegateeAccessQuery
            /* Search for access records */
            if (!input.payload.returnProperties) {
                input.payload.returnProperties = ["*", "role/*"]
            }
            var queryFilter = input.payload.queryFilter;
            var resultRoles;
            var delegatedAccess;
            //Ben - start
            // Check if user is terminated: try userIdentifier from queryFilter first, then email from payload
            if (queryFilter && queryFilter.includes('userIdentifier')) {
                // Extract userIdentifier from queryFilter
                const userIdentifierMatch = queryFilter.match(/userIdentifier eq '([^']+)'/);
                if (userIdentifierMatch && userIdentifierMatch[1]) {
                    const userIdentifier = userIdentifierMatch[1];
                    try {
                        const userObj = openidm.read("managed/alpha_user/" + userIdentifier, null, ["accountStatus"]);
                        if (userObj && userObj.accountStatus && userObj.accountStatus.toLowerCase() === "terminated") {
                            logDebug(input.transactionId, input.endPoint, "getAvailableRoles", `User ${userIdentifier} is terminated.`);
                            return { isTerminated: true };
                        }
                    } catch (error) {
                        logDebug(input.transactionId, input.endPoint, "getAvailableRoles", `Error reading user ${userIdentifier}: ${JSON.stringify(getException(error))}`);
                    }
                }
            } else if (input.payload && input.payload.email) {
                // BSP flow: user identified by email, not userIdentifier in queryFilter
                try {
                    var userByEmail = openidm.query("managed/alpha_user", {
                        "_queryFilter": 'mail eq "' + input.payload.email + '"'
                    }, ["accountStatus"]);
                    if (userByEmail && userByEmail.result && userByEmail.result.length > 0) {
                        var emailUser = userByEmail.result[0];
                        if (emailUser.accountStatus && emailUser.accountStatus.toLowerCase() === "terminated") {
                            logDebug(input.transactionId, input.endPoint, "getAvailableRoles", "User with email " + input.payload.email + " is terminated.");
                            return { isTerminated: true };
                        }
                    }
                } catch (error) {
                    logDebug(input.transactionId, input.endPoint, "getAvailableRoles", "Error querying user by email " + input.payload.email + ": " + JSON.stringify(getException(error)));
                }
            }
            //Ben - end

            if (isDelegationContext) {
                // Check if delegatee is terminated
                // Extract delegateeId: payload.delegateeId > delegateeAccessQuery > email
                var delegateeId = null;
                if (input.payload && input.payload.delegateeId) {
                    delegateeId = input.payload.delegateeId;
                } else if (delegateeAccessQuery) {
                    var delegateeMatch = delegateeAccessQuery.match(/userIdentifier eq '([^']+)'/);
                    if (delegateeMatch) delegateeId = delegateeMatch[1];
                }
                // Fallback: resolve delegatee from email (BSP flow)
                if (!delegateeId && input.payload && input.payload.email) {
                    try {
                        var delegateeByEmail = openidm.query("managed/alpha_user", {
                            "_queryFilter": 'mail eq "' + input.payload.email + '"'
                        }, ["_id"]);
                        if (delegateeByEmail && delegateeByEmail.result && delegateeByEmail.result.length > 0) {
                            delegateeId = delegateeByEmail.result[0]._id;
                        }
                    } catch (error) {
                        logDebug(input.transactionId, input.endPoint, "getAvailableRoles", "Error querying delegatee by email " + input.payload.email + ": " + JSON.stringify(getException(error)));
                    }
                }
                if (delegateeId) {
                    try {
                        var delegateeObj = openidm.read("managed/alpha_user/" + delegateeId, null, ["accountStatus"]);
                        if (delegateeObj && delegateeObj.accountStatus && delegateeObj.accountStatus.toLowerCase() === "terminated") {
                            logDebug(input.transactionId, input.endPoint, "getAvailableRoles", "Delegatee " + delegateeId + " is terminated.");
                            return { isTerminated: true };
                        }
                    } catch (error) {
                        logDebug(input.transactionId, input.endPoint, "getAvailableRoles", "Error reading delegatee " + delegateeId + ": " + JSON.stringify(getException(error)));
                    }
                }

                // Get delegate roles for logged in user, only if forward delegable
                delegatedAccess = getDelegateRolesForUser(input);
                // List all relevant roles
                //delegatedAccess = delegateRoles.slice();
                // If delegateeAccessQuery is provided, get existing roles for delegated user
                if (delegateeAccessQuery) {
                    delegatedAccess = getExistingRolesForDelegatee(delegateeAccessQuery, input);
                }
                return delegatedAccess;
            } else {
                if (!queryFilter || !queryFilter.includes('userIdentifier')) {
                    resultRoles = getAllRolesForBusinessAppID(input);
                } else {
                    resultRoles = getUserExistingRoles(input);
                }
                return resultRoles;
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
 * @name getApplicationRoles
 * @description Method gets roles associated with the business application
 * 
 * 
 * @return {JSON} application roles
 */
function getAvailableApplicationRoles(input) {

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
                    // if (!userRoleIds.includes(appRole._refResourceId)) {
                    //     roles.push(appRole._refResourceId)
                    // }
                    roles.push(appRole._refResourceId)
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
 * @name getAlreadyAssignedAccessKeys
 * @description Returns a Set of composite keys for existing access records.
 * Composite key = appIdentifier|roleIdentifier|originalDelegatorIdentifier|currentDelegatorIdentifier
 * This allows multiple delegators to delegate the same role to the same user.
 *
 * @param {JSON} input
 * @returns {Set} Set of composite keys
 */
function getAlreadyAssignedAccessKeys(input) {
    let assignedKeys = new Set();
    let requestedUserId = null;

    // Get requestedUserId from payload (supports requestedUserId, email, or parsing from queryFilter)
    if (input.payload) {
        if (input.payload.requestedUserId) {
            requestedUserId = input.payload.requestedUserId;
            logger.error("DEBUG getAlreadyAssignedAccessKeys: using requestedUserId from payload = " + requestedUserId);
        } else if (input.payload.email) {
            try {
                const userObj = searchObjectByIdAttributeValue(input, "managed/alpha_user", "mail", input.payload.email);
                if (userObj && userObj._id) {
                    requestedUserId = userObj._id;
                    logger.error("DEBUG getAlreadyAssignedAccessKeys: resolved email " + input.payload.email + " to userId " + requestedUserId);
                } else {
                    logger.error("DEBUG getAlreadyAssignedAccessKeys: no user found for email " + input.payload.email);
                }
            } catch (e) {
                logger.error("DEBUG getAlreadyAssignedAccessKeys: error querying user by email - " + e);
            }
        } else if (input.payload.queryFilter) {
            // Try to extract userIdentifier from queryFilter string
            // Pattern: userIdentifier eq 'uuid' or userIdentifier eq "uuid"
            var queryFilter = input.payload.queryFilter;
            var userIdMatch = queryFilter.match(/userIdentifier\s+eq\s+['"]([^'"]+)['"]/i);
            if (userIdMatch && userIdMatch[1]) {
                requestedUserId = userIdMatch[1];
                logger.error("DEBUG getAlreadyAssignedAccessKeys: extracted userIdentifier from queryFilter = " + requestedUserId);
            } else {
                logger.error("DEBUG getAlreadyAssignedAccessKeys: queryFilter present but no userIdentifier found: " + queryFilter);
            }
        }
    }

    // Query for ALL access records the target user already has
    if (requestedUserId) {
        let existingAccessQuery = "userIdentifier eq '" + requestedUserId + "' AND (recordState eq \"0\" or recordState eq \"ACTIVE\")";
        logger.error("DEBUG getAlreadyAssignedAccessKeys query: " + existingAccessQuery);

        const existingAccess = openidm.query("managed/alpha_kyid_access", {
            "_queryFilter": existingAccessQuery
        }, ["appIdentifier", "roleIdentifier", "originalDelegatorIdentifier", "currentDelegatorIdentifier"]);

        if (existingAccess && existingAccess.result && existingAccess.result.length > 0) {
            logger.error("DEBUG getAlreadyAssignedAccessKeys found " + existingAccess.result.length + " existing access records");
            existingAccess.result.forEach(function (d, index) {
                // Composite key: appIdentifier|roleIdentifier|originalDelegatorIdentifier|currentDelegatorIdentifier
                var key = (d.appIdentifier || "") + "|" +
                    (d.roleIdentifier || "") + "|" +
                    (d.originalDelegatorIdentifier || "") + "|" +
                    (d.currentDelegatorIdentifier || "");
                assignedKeys.add(key);
                // DEBUG: Log each existing access key
                logger.error("DEBUG getAlreadyAssignedAccessKeys [" + index + "] key=" + key +
                    " (app=" + d.appIdentifier +
                    ", role=" + d.roleIdentifier +
                    ", originalDelegator=" + d.originalDelegatorIdentifier +
                    ", currentDelegator=" + d.currentDelegatorIdentifier + ")");
            });
        }
        logger.error("DEBUG getAlreadyAssignedAccessKeys result count: " + assignedKeys.size);
    }

    return assignedKeys;
}

/**
 * @name buildAccessKey
 * @description Builds a composite key for access deduplication.
 * Composite key = appIdentifier|roleIdentifier|originalDelegatorIdentifier|currentDelegatorIdentifier
 *
 * @param {String} appIdentifier - The application identifier
 * @param {String} roleIdentifier - The role identifier
 * @param {String} originalDelegatorId - The original delegator identifier
 * @param {String} currentDelegatorId - The current delegator identifier
 * @returns {String} Composite key string
 */
function buildAccessKey(appIdentifier, roleIdentifier, originalDelegatorId, currentDelegatorId) {
    return (appIdentifier || "") + "|" +
        (roleIdentifier || "") + "|" +
        (originalDelegatorId || "") + "|" +
        (currentDelegatorId || "");
}

/**
 * @name isDuplicateAccess
 * @description Checks if an access record already exists based on composite key.
 * Used by AvailableAccess and AvailableAccessForDelegation views.
 *
 * Scenarios:
 * 1. Direct assignment (AvailableAccess): both delegators are null → key = app|role||
 * 2. Master delegation (AvailableAccessForDelegation, no originalDelegatorId):
 *    current user becomes both original and current → key = app|role|currentUser|currentUser
 * 3. Forward delegation (AvailableAccessForDelegation, has originalDelegatorId):
 *    keeps original delegator → key = app|role|originalDelegator|currentUser
 *
 * @param {Set} assignedAccessKeys - Set of existing access keys
 * @param {String} appIdentifier - The application identifier
 * @param {String} roleIdentifier - The role identifier
 * @param {String} originalDelegatorId - The original delegator identifier (null for direct assignment or master delegation)
 * @param {String} currentDelegatorId - The delegator making the request (null for direct assignment)
 * @param {String} viewName - The view name for logging purposes
 * @returns {Boolean} true if duplicate exists, false otherwise
 */
function isDuplicateAccess(assignedAccessKeys, appIdentifier, roleIdentifier, originalDelegatorId, currentDelegatorId, viewName) {
    // Build the key based on scenario:
    // - Direct assignment: both delegators empty
    // - Master delegation: currentDelegatorId used for both
    // - Forward delegation: originalDelegatorId kept, currentDelegatorId used
    var effectiveOriginalDelegator = originalDelegatorId || currentDelegatorId || "";
    var effectiveCurrentDelegator = currentDelegatorId || "";

    var newAccessKey = buildAccessKey(appIdentifier, roleIdentifier, effectiveOriginalDelegator, effectiveCurrentDelegator);

    // DEBUG: Log input parameters and computed key
    logger.error("DEBUG isDuplicateAccess [" + viewName + "] input: " +
        "appIdentifier=" + appIdentifier +
        ", roleIdentifier=" + roleIdentifier +
        ", originalDelegatorId=" + originalDelegatorId +
        ", currentDelegatorId=" + currentDelegatorId);
    logger.error("DEBUG isDuplicateAccess [" + viewName + "] computed: " +
        "effectiveOriginalDelegator=" + effectiveOriginalDelegator +
        ", effectiveCurrentDelegator=" + effectiveCurrentDelegator +
        ", newAccessKey=" + newAccessKey);
    logger.error("DEBUG isDuplicateAccess [" + viewName + "] assignedAccessKeys count=" + assignedAccessKeys.size);

    if (assignedAccessKeys.has(newAccessKey)) {
        logger.error("DEBUG isDuplicateAccess [" + viewName + "] RESULT: DUPLICATE FOUND, key=" + newAccessKey);
        return true;
    }
    logger.error("DEBUG isDuplicateAccess [" + viewName + "] RESULT: NOT DUPLICATE");
    return false;
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
                                    tagName: access.role && access.role._id ? searchRoleTag(access.role._id) : []
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
                // Check if result indicates a terminated user
                if (result && result.isTerminated === true) {
                    responseView.data = [];
                    responseView.isTerminated = true;
                    responseView.message = "The user account has been terminated.";
                } else if (result) {
                    roleToInfo = new Map()
                    roleInfo = {};

                    // Get existing access keys for deduplication (composite key: app|role|originalDelegator|currentDelegator)
                    var assignedAccessKeys = getAlreadyAssignedAccessKeys(input);

                    /* Iterate through the result */
                    result.forEach(role => {

                        if (role) {
                            // Get appIdentifier from role's businessAppId
                            var appIdentifier = role.businessAppId ? role.businessAppId._refResourceId : "";

                            // Check 0: Skip if exact same access already exists
                            // AvailableAccess is for direct role assignment (not delegation)
                            // Both originalDelegatorId and currentDelegatorId are null for direct assignment
                            if (isDuplicateAccess(assignedAccessKeys, appIdentifier, role._id, null, null, "AvailableAccess")) {
                                return;
                            }

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
                // Check if result indicates a terminated delegatee
                if (result && result.isTerminated === true) {
                    responseView.data = [];
                    responseView.isTerminated = true;
                    responseView.message = "The delegatee account has been terminated.";
                } else if (result) {
                    roleInfo = {}

                    // If delegateeAccessQuery is provided, getExistingRolesForDelegatee already did deduplication
                    // so we skip the duplicate check here to avoid querying the wrong user (delegator instead of delegatee)
                    var skipDuplicateCheck = !!input.payload.delegateeAccessQuery;
                    var assignedAccessKeys = new Set();
                    if (!skipDuplicateCheck) {
                        // Get existing access keys for deduplication (composite key: app|role|originalDelegator|currentDelegator)
                        assignedAccessKeys = getAlreadyAssignedAccessKeys(input);
                    } else {
                        logger.error("DEBUG AvailableAccessForDelegation: skipping duplicate check - delegateeAccessQuery already handled deduplication");
                    }

                    // DEBUG: Log result count before iteration
                    logger.error("DEBUG AvailableAccessForDelegation result count: " + (result ? result.length : 0))

                    /* Iterate through the result - each access record becomes its own entry */
                    result.forEach(access => {

                        if (access) {
                            // Use originalDelegatorIdentifier as the single source of truth for delegation chain
                            const isDelegated = !!access.originalDelegatorIdentifier
                            const roleIsDelegable = access.role && access.role.isDelegable
                            const roleIsForwardDelegable = access.role && access.role.isForwardDelegable
                            const accessIsForwardDelegable = access.isForwardDelegable

                            // DEBUG: Log filter conditions
                            logger.error("DEBUG AvailableAccessForDelegation filter: roleId=" + (access.role ? access.role._id : "null") +
                                ", isDelegated=" + isDelegated +
                                ", roleIsDelegable=" + roleIsDelegable +
                                ", roleIsForwardDelegable=" + roleIsForwardDelegable +
                                ", accessIsForwardDelegable=" + accessIsForwardDelegable)

                            // Check 0: Skip if exact same delegation already exists (only if not already handled by getExistingRolesForDelegatee)
                            // access.userIdentifier is the delegator (owner of this access record)
                            // For forward delegation: use access.originalDelegatorIdentifier as the original delegator
                            // For master delegator (no originalDelegatorIdentifier): use access.userIdentifier as both
                            if (!skipDuplicateCheck && isDuplicateAccess(assignedAccessKeys, access.appIdentifier, access.roleIdentifier, access.originalDelegatorIdentifier, access.userIdentifier, "AvailableAccessForDelegation")) {
                                return;
                            }

                            // Check 1: For original owned roles, must be delegable
                            if (!isDelegated && !roleIsDelegable) {
                                /* Skip: original role that is not delegable */
                                logger.error("DEBUG AvailableAccessForDelegation SKIP: original role not delegable")
                                return;
                            }

                            // Check 2: Determine forward delegation permission
                            let canForwardDelegate = false;

                            if (!isDelegated) {
                                // Case 1: Original owner (no delegation chain) - only check role.isForwardDelegable
                                canForwardDelegate = roleIsDelegable && roleIsForwardDelegable;
                            } else {
                                // Case 2: Role was delegated - check both role and access isForwardDelegable
                                // access.isForwardDelegable reflects the checkbox choice made by the delegator
                                canForwardDelegate = roleIsDelegable && roleIsForwardDelegable && accessIsForwardDelegable;
                            }

                            logger.error("DEBUG AvailableAccessForDelegation canForwardDelegate=" + canForwardDelegate)

                            // Check 3: For delegated roles, must have forward delegation permission
                            if (isDelegated && !canForwardDelegate) {
                                /* Skip: delegated role without forward delegation permission */
                                logger.error("DEBUG AvailableAccessForDelegation SKIP: delegated role without forward delegation permission")
                                return;
                            }

                            // Build roleInfo per access record (no merge by role)
                            roleInfo = {}

                            // DEBUG: Log access record details for delegationEndDate tracing
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access._id: " + access._id);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access.userIdentifier: " + access.userIdentifier);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access.roleIdentifier: " + access.roleIdentifier);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access.expiryDate: " + access.expiryDate);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access.recordState: " + access.recordState);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - access.createDate: " + access.createDate);

                            roleInfo.id = access._id,
                                roleInfo.roleId = access.role._refResourceId,
                                roleInfo.roleDisplayName = access.role && access.role.content[0] ? access.role.content[0].name : "",
                                roleInfo.roleDisplayDescription = access.role && access.role.content[0] ? access.role.content[0].description : "",
                                roleInfo.isDelegable = access.role.isDelegable,
                                roleInfo.alwaysSendInvitation = access.role.alwaysSendInvitation || false,
                                // Set isForwardDelegable based on delegator type
                                roleInfo.isForwardDelegable = canForwardDelegate,
                                roleInfo.tagName = access.role && access.role._id ? searchRoleTag(access.role._id) : [],
                                roleInfo.assignmentDate = access.createDate ? access.createDate : "",
                                roleInfo.creationDate = access.createDate ? access.createDate : "",
                                roleInfo.expiryDate = access.expiryDate ? access.expiryDate : "",
                                roleInfo.delegationEndDate = access.expiryDate ? access.expiryDate : ""
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - SET roleInfo.expiryDate: " + roleInfo.expiryDate);
                            logger.error("[DEBUG-DELEGATION-ENDDATE] AvailableAccessForDelegation - SET roleInfo.delegationEndDate: " + roleInfo.delegationEndDate);
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

                            // Delegator info - per access record (single-element arrays to keep format consistent)
                            if (access.originalDelegator) {
                                var originalDelegatorInfo = getDelegatorInfo(access.originalDelegator)
                                logger.error("DEBUG AvailableAccessForDelegation originalDelegatorInfo: " + JSON.stringify(originalDelegatorInfo))
                                if (originalDelegatorInfo && originalDelegatorInfo.length > 0) {
                                    roleInfo.originalDelegator = [{
                                        userid: originalDelegatorInfo[0].userid,
                                        firstName: originalDelegatorInfo[0].firstName,
                                        lastName: originalDelegatorInfo[0].lastName,
                                        email: originalDelegatorInfo[0].mail
                                    }]
                                }
                            }
                            if (access.currentDelegator) {
                                var currentDelegatorInfo = getDelegatorInfo(access.currentDelegator)
                                logger.error("DEBUG AvailableAccessForDelegation currentDelegatorInfo: " + JSON.stringify(currentDelegatorInfo))
                                if (currentDelegatorInfo && currentDelegatorInfo.length > 0) {
                                    roleInfo.currentDelegator = [{
                                        userid: currentDelegatorInfo[0].userid,
                                        firstName: currentDelegatorInfo[0].firstName,
                                        lastName: currentDelegatorInfo[0].lastName,
                                        email: currentDelegatorInfo[0].mail
                                    }]
                                }
                            }

                            // DEBUG: Log each roleInfo before pushing to resultView
                            logger.error("DEBUG AvailableAccessForDelegation roleInfo: " + JSON.stringify({
                                roleId: roleInfo.roleId,
                                expiryDate: roleInfo.expiryDate,
                                delegationEndDate: roleInfo.delegationEndDate,
                                isDelegable: roleInfo.isDelegable,
                                isForwardDelegable: roleInfo.isForwardDelegable,
                                originalDelegator: roleInfo.originalDelegator,
                                currentDelegator: roleInfo.currentDelegator,
                                tagName: roleInfo.tagName
                            }))
                            resultView.push(roleInfo)
                        }
                    })

                    // DEBUG: Log final responseView before returning
                    logger.error("DEBUG AvailableAccessForDelegation final resultView count: " + resultView.length)
                    responseView.data = resultView
                    logger.error("DEBUG AvailableAccessForDelegation final responseView: " + JSON.stringify(responseView))
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

/**
 * POC: Get role-based authorization filter string
 *
 * @param {String} objectName - The managed object name (e.g. "alpha_kyid_access")
 * @returns {String} filter string or "false" (no access) or "true" (master/full access)
 */
function getRoleBasedFilters(objectName) {
    var USER_ID = context.oauth2.rawInfo.user_id;

    try {
        var authRequest = {
            action: "getFilter",
            userId: USER_ID,
            objectName: objectName
        };

        logger.info("access_v2B: getRoleBasedFilters authRequest: " + JSON.stringify(authRequest));

        var authResponse = openidm.create("endpoint/dataAuthorizationCheck_aaron_test1", null, authRequest);

        logger.info("access_v2B: getRoleBasedFilters authResponse: " + JSON.stringify(authResponse));

        if (authResponse && authResponse.filter && authResponse.filter.length > 0) {
            var filterStrings = [];
            authResponse.filter.forEach(function(filterObj) {
                if (filterObj.objectFilter) {
                    filterStrings.push(filterObj.objectFilter);
                }
            });

            if (filterStrings.length > 0) {
                var finalFilter = "(" + filterStrings.join(") OR (") + ")";
                logger.info("access_v2B: getRoleBasedFilters result: " + finalFilter);
                return finalFilter;
            }
        }

        logger.info("access_v2B: getRoleBasedFilters no filters, returning 'false'");
        return "false";
    } catch (e) {
        logger.error("access_v2B: getRoleBasedFilters error: " + e.message);
        return "false";
    }
}

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

        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Starting KOG API call")
        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - API URL: " + requestBody.url)
        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Payload UserAuths count: " + (payload.UserAuths ? payload.UserAuths.length : 0))

        while (retryCountForKOGAPI < 3) {
            //Call KOG API endpoint.
            try {
                logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI")
                logger.error("ExternalRoleRemoval: Invoking KOG Role Removal API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Raw response received from invokeCertAPI")
                logger.error("ExternalRoleRemoval: KOG Role Removal Response: " + response)
                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - SUCCESS - ResponseStatus: 0")
                        logger.error("ExternalRoleRemoval: KOG Role Removal Success Response: " + JSON.stringify(response))
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - BUSINESS_VALIDATION - ResponseStatus: 1")
                        logger.error("ExternalRoleRemoval: KOG Role Removal Business Validation Response: " + JSON.stringify(response))
                        return response.response
                    } else {
                        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - UNKNOWN_STATUS - ResponseStatus: " + response.response.ResponseStatus)
                        logger.error("ExternalRoleRemoval: KOG Role Removal Unknown Response: " + JSON.stringify(response))
                        return response.response
                    }
                } else {
                    logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - NON_200_RESPONSE - Status: " + (response ? response.status : "null"))
                    logger.error("ExternalRoleRemoval: KOG Role Removal KOG No-200 Response: " + JSON.stringify(response))
                    return null
                }
            } catch (error) {
                logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - EXCEPTION caught in attempt " + (retryCountForKOGAPI + 1))
                logger.error("ExternalRoleRemoval: KOG Role Removal Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Retry count: " + retryCountForKOGAPI);
                    logger.error("Retry count of kogRemoveRolesToUser is: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - MAX_RETRY_REACHED - Returning null")
                        logger.error("ExternalRoleRemoval: KOG Role Removal Operation Failed. Maximum Retry Limit Reached: " + JSON.stringify(error))
                        return null
                    }
                } else {
                    logger.error("[KOG-DELETE-DEBUG] invokeKOGAPIRoleRemoval - Retry disabled, returning null")
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
    var delegatorArray = []
    var delegatorInfo = {}
    delegatorInfo.firstName = "";
    delegatorInfo.lastName = "";
    delegatorInfo.mail = "";
    delegatorInfo.userid = "";
    try {
        if (user && user._refResourceId) {
            var alphaUser = openidm.read("managed/alpha_user/" + user._refResourceId, null, ["*"]);

            delegatorInfo.userid = alphaUser && alphaUser._id ? alphaUser._id : "";
            delegatorInfo.firstName = alphaUser && alphaUser.givenName ? alphaUser.givenName : "";
            delegatorInfo.lastName = alphaUser && alphaUser.sn ? alphaUser.sn : "";
            delegatorInfo.mail = alphaUser && alphaUser.mail ? alphaUser.mail : "";
        }
        delegatorArray.push(delegatorInfo)
        return delegatorArray
    } catch (error) {
        logger.error("Unable to get delegator information for " + user)
        delegatorArray.push(delegatorInfo)
        return delegatorArray
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

/**
 * Get audit logger context variables with error handling
 * @returns {Object} Object containing transactionId, sessionRefId, and sessionDetails
 */
function getAuditLoggerContext() {
    logger.error("***DEBUG: context value inside getAuditLoggerContext() => " + JSON.stringify(context)) //Remove Later  
    let transactionIdauditLogger = "";
    let sessionRefIDauditLogger = "";
    let sessionDetailsauditLogger = {};

    try {
        if (context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value) {
            transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value
                ? context.transactionId.transactionId.value
                : "";
        }
        logger.error("****DEBUG: transactionIdauditLogger value from context => " + transactionIdauditLogger) //Remove Later  
    } catch (e) {
        logger.error("Failed to get transactionId from context: " + e);
    }

    try {
        if (context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId) {
            sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
                ? context.oauth2.rawInfo.sessionRefId
                : "";
        } 
        logger.error("****DEBUG: sessionRefIDauditLogger value from context => " + JSON.stringify(sessionRefIDauditLogger)) //Remove Later  
    } catch (e) {
        logger.error("Failed to get sessionRefId from context: " + e);
    }

    try {
        sessionDetailsauditLogger = sessionRefIDauditLogger
            ? { "sessionRefId": sessionRefIDauditLogger }
            : {};
        logger.error("****DEBUG: sessionDetailsauditLogger value from context => " + JSON.stringify(sessionDetailsauditLogger)) //Remove Later 
    } catch (e) {
        logger.error("Failed to get sessionDetails from context: " + e);
    }

    try {
        // Try to get headers from both context and request
        var contextHeaders = context.http && context.http.headers ? context.http.headers : {};
        var requestHeaders = request.headers || {};

        // Debug: log request structure to see what's available
        logger.error("DEBUG getAuditLoggerContext :: request keys: " + JSON.stringify(Object.keys(request)));
        if (Object.keys(requestHeaders).length > 0) {
            logger.error("DEBUG getAuditLoggerContext :: request.headers: " + JSON.stringify(requestHeaders));
        }

        // Get IP from context.http.headers - priority: X-Real-IP > X-Trusted-Forwarded-For > X-Forwarded-For
        clientIP = contextHeaders["x-real-ip"] ||
            (contextHeaders["x-trusted-forwarded-for"] ? contextHeaders["x-trusted-forwarded-for"].split(',')[0].trim() : null) ||
            (contextHeaders["x-forwarded-for"] ? contextHeaders["x-forwarded-for"].split(',')[0].trim() : null) ||
            "Unknown";

        // Try to get User-Agent from request.headers or context.http.headers
        clientBrowser = requestHeaders["user-agent"] || requestHeaders["User-Agent"] ||
            contextHeaders["user-agent"] || contextHeaders["User-Agent"] || "Unknown";
    } catch (e) {
        logger.error("Failed to get client info from context: " + e);
    }

    return {
        transactionIdauditLogger: transactionIdauditLogger,
        sessionRefIDauditLogger: sessionRefIDauditLogger,
        sessionDetailsauditLogger: sessionDetailsauditLogger,
        clientIP: clientIP,
        clientBrowser: clientBrowser
    };
}

/**
 * Audit Logger function to capture user activity
 * @param {string} eventCode - Event code (e.g., ROM003, ROM004)
 * @param {string} eventName - Event name (e.g., Remove Role Success)
 * @param {object} sessionDetails - Session details object
 * @param {object} eventDetails - Event details object
 * @param {string} requesterUserId - Requester user ID
 * @param {string} requestedUserId - Requested user ID
 * @param {string} transactionId - Transaction ID
 * @param {string} emailId - Email ID (optional)
 * @param {string} applicationName - Application name (optional)
 * @param {string} sessionRefId - Session reference ID (optional)
 */
function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
    try {
        logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();

      //Fetch the requesterEmail ID
        var requesteremailID ="";
        if(requesterUserId && requesterUserId !== ""){
          var userQueryFilter = '(_id eq "' + requesterUserId + '")';
          var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["mail"]); 
          if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
            requesteremailID = requesterUserObj.result[0].mail;
          }
        }
        var logPayload = {
            eventCode: eventCode,
            eventName: eventName,
            eventDetails: JSON.stringify(eventDetails),
            requesterUserId: requesterUserId,
            requestedUserId: requestedUserId,
            transactionId: transactionId,
            sessionDetails: sessionDetails ? JSON.stringify(sessionDetails) : null,
            createdDate: createdDate,
            createdTimeinEpoch: currentTimeinEpoch,
            emailId: emailId || "",
            applicationName: applicationName || "",
            sessionId: sessionRefId || "",
            requesterUseremailID: requesteremailID,
            requestedUseremailID: emailId || ""
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));

      //23-Feb PA for sending logs to DB
      try{
   const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
   logger.error("Response from sendAuditLogstoDB is - "+JSON.stringify(sendlogstoDB))
   } catch(error){
	logger.error("Exception from sendAuditLogstoDB is -"+error)
   }
      
    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }
}

/**
 * Get user details from Alpha User Managed Object based on userAccountId
 * @param {string} userAccountId - The user account ID
 * @returns {object|null} User object or null if not found
 */
function getUserDetails(userAccountId) {
    var alphaUser = openidm.read("managed/alpha_user/" + userAccountId, null, ["*"]);
    return alphaUser && alphaUser != null ? alphaUser : null;
}
/**
 * Get userName (KOG ID) from a delegator reference object
 * @param {object} delegatorRef - Delegator reference object (may have userName directly or _refResourceId)
 * @returns {string|null} userName (KOG ID) or null if not found
 */
function getDelegatorUserName(delegatorRef) {
    if (!delegatorRef) {
        return null;
    }

    // If userName is already present, return it directly
    if (delegatorRef.userName) {
        return delegatorRef.userName;
    }

    // If only reference ID is present, fetch userName from alpha_user
    if (delegatorRef._refResourceId) {
        try {
            var alphaUser = openidm.read("managed/alpha_user/" + delegatorRef._refResourceId, null, ["userName"]);
            return (alphaUser && alphaUser.userName) ? alphaUser.userName : null;
        } catch (e) {
            logger.error("[CASCADE-DEBUG] getDelegatorUserName - Failed to fetch userName for " + delegatorRef._refResourceId + ": " + e);
            return null;
        }
    }

    return null;
}
