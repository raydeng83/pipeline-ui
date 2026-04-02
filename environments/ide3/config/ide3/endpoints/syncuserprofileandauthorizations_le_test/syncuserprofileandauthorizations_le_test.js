/**
 * @name SyncUserProfileAndAuthorizations
 * @description This endpoint synchromizes user profile and authorization.
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
 * @date  08/15/2025
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

    const requesterAccountId = context.current.parent.parent.parent.parent.parent.rawInfo.sub

    let result = null
    const ENDPOINT_NAME = 'SyncUserProfileAndAuthorizations'
    const ACCESS_ENDPOINT_NAME = 'endpoint/access_v2B_le_test'
    const UPDATE_USER_PROFILE_ENDPOINT_NAME = 'endpoint/account_v2B_le_test'
    try {
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME)

        switch (request.method) {

            case REQUEST_POST:
                /* Get request content */
                if (requestContent.ServiceCallID &&
                    requestContent.SyncCode &&
                    requestContent.XmitDate &&
                    requestContent.Action &&
                    requestContent.UserIdentifier &&
                    requestContent.UserProfileInfo
                ) {

                    let requestInput = {
                        ServiceCallID: requestContent.ServiceCallID,
                        SyncCode: requestContent.SyncCode,
                        XmitDate: requestContent.XmitDate,
                        Action: requestContent.Action,
                        UserIdentifier: requestContent.UserIdentifier,
                        UserProfileInfo: requestContent.UserProfileInfo,
                        UserAuthorizations: requestContent.UserAuthorizations
                    }

                    let requestedUser = {}
                    if (requestInput.UserIdentifier.KOGID) {
                        requestedUser.userIdAttributeName = "userName"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.KOGID
                    } else if (requestInput.UserIdentifier.UPN) {
                        requestedUser.userIdAttributeName = "frindexstring1"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.UPN
                    } else if (requestInput.UserIdentifier.EmailAddress) {
                        requestedUser.userIdAttributeName = "mail"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.EmailAddress
                    } else if (requestInput.UserIdentifier.Logon) {
                        requestedUser.userIdAttributeName = "frindexstring1"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.Logon
                    } else if (requestInput.UserIdentifier.EmployeeID) {
                        //requestedUser.userIdAttributeName = "mail"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.EmployeeID
                    } else if (requestInput.UserIdentifier.WindowsAccountName) {
                        requestedUser.userIdAttributeName = "custom_windowsAccountName"
                        requestedUser.userIdAttributeValue = requestInput.UserIdentifier.WindowsAccountName
                    }

                    let createRequest
                    let response
                    let returnResponse

                    let checkConditionResponse = checkConditions(requestContent, requestedUser)


                    if (checkConditionResponse && checkConditionResponse != null) {

                        if (checkConditionResponse.noAction && checkConditionResponse.noAction != null) {
                            return checkConditionResponse.noAction
                        }

                        if (checkConditionResponse.error && checkConditionResponse.error != null) {
                            return checkConditionResponse.error
                        }

                        if (checkConditionResponse.userAuthorizations && checkConditionResponse.userAuthorizations.length > 0) {
                          
                            requestInput.UserAuthorizations = checkConditionResponse.userAuthorizations
                        } else {
                          
                          return returnResponse = {
                            ServiceCallID: requestInput.ServiceCallID,
                            ResponseStatus: 0
                          }
                        }
                    }

                  
                    if (requestContent.Action.toLowerCase() == "authchanged") {

                        response = handleAuthChanged(requestInput, requestedUser, ACCESS_ENDPOINT_NAME)

                        returnResponse = {
                            ServiceCallID: requestInput.ServiceCallID,
                            ResponseStatus: 0
                        }

                        let responseResultList

                        if (response.payload.result[0].status) {
                            responseResultList = response.payload.result
                        } else if (response.payload.result[0][0].status) {
                            responseResultList = response.payload.result[0]
                        }


                        for (let i = 0; i < responseResultList.length; i++) {
                            if (responseResultList[i].status != "0") {
                                returnResponse.ResponseStatus = 1
                                returnResponse.MessageResponses = []
                                returnResponse.MessageResponses.push(responseResultList[i])
                            }
                        }
                    }

                    if (requestContent.Action.toLowerCase() == "profilechanged") {

                        response = handleProfileChanged(requestContent, requestedUser, UPDATE_USER_PROFILE_ENDPOINT_NAME)
                        return {"test":response}

                        returnResponse = {
                            ServiceCallID: requestInput.ServiceCallID,
                            ResponseStatus: response.responseCode
                        }

                        if (response.responseCode != 0) {
                            returnResponse.ResponseStatus = 1
                            returnResponse.MessageResponses = []
                            returnResponse.MessageResponses.push(response.message)
                        }

                    }

                    if (requestContent.Action.toLowerCase() == "profileandauthchanged") {
                        let handleProfileChangedResponse = handleProfileChanged(requestContent, requestedUser, UPDATE_USER_PROFILE_ENDPOINT_NAME)

                        let returnResponseProfileChanged = {
                            ServiceCallID: requestInput.ServiceCallID,
                            ResponseStatus: 0
                        }

                        if (handleProfileChangedResponse.responseCode != 0) {
                            returnResponseProfileChanged.ResponseStatus = 1
                            returnResponse.MessageResponses = []
                            returnResponseProfileChanged.MessageResponses.push(handleProfileChangedResponse.message)
                        }

                        let handleAuthChangedResponse = handleAuthChanged(requestInput, requestedUser, ACCESS_ENDPOINT_NAME)

                        let returnResponseAuthChanged = {
                            ServiceCallID: requestInput.ServiceCallID,
                            ResponseStatus: handleAuthChangedResponse.responseCode
                        }

                        let responseResultList = handleAuthChangedResponse.payload.result

                        for (let i = 0; i < responseResultList.length; i++) {
                            if (responseResultList[i].status != 0) {
                                returnResponseAuthChanged.ResponseStatus = 1
                                returnResponse.MessageResponses = []
                                returnResponseAuthChanged.MessageResponses.push(responseResultList[i])
                            }
                        }

                        if (returnResponseProfileChanged.ResponseStatus == 0 && returnResponseAuthChanged.ResponseStatus == 0) {
                            returnResponse = {
                                ServiceCallID: requestInput.ServiceCallID,
                                ResponseStatus: 0
                            }
                        } else {
                            returnResponse = {
                                "ProfileChangedResponse": returnResponseProfileChanged,
                                "AuthChangedResponse": returnResponseAuthChanged
                            }
                        }
                    }

                    return returnResponse
                    // try {
                    //     /* call access endpoint to create access request. */
                    //     // if (response &&  response.responseCode == "0") {
                    //     //     return {
                    //     //         ServiceCallID: requestInput.ServiceCallID,
                    //     //         ResponseStatus: 0,
                    //     //         MessageResponses: [{
                    //     //             MessageCode: "000",
                    //     //             MessageDescription: "Success"
                    //     //         }]
                    //     //     }
                    //     // } else {
                    //     //     return {
                    //     //         ServiceCallID: requestInput.ServiceCallID,
                    //     //         ResponseStatus: 1,
                    //     //         MessageResponses: [{
                    //     //             MessageCode: "999",
                    //     //             MessageDescription: "An Unknown error has occurred. Please try again later."
                    //     //         }]
                    //     //     }
                    //     // }

                    //     if (response) {
                    //         if (requestContent.Action == "AuthChanged") {
                    //             let responseResultList = response.payload.result

                    //             for (let i = 0; i < responseResultList.length; i++) {
                    //                 if (responseResultList[i].status == 1) {
                    //                     return {
                    //                         ServiceCallID: requestInput.ServiceCallID,
                    //                         ResponseStatus: 1,
                    //                         MessageResponses: [{
                    //                             MessageCode: "999",
                    //                             MessageDescription: "An Unknown error has occurred. Please try again later."
                    //                         }]
                    //                     }
                    //                 }
                    //             }

                    //             return {
                    //                 ServiceCallID: requestInput.ServiceCallID,
                    //                 ResponseStatus: 0,
                    //                 MessageResponses: [{
                    //                     MessageCode: "000",
                    //                     MessageDescription: "Success"
                    //                 }]
                    //             }
                    //         }

                    //         if (requestContent.Action == "ProfileChanged") {
                    //             if (response.responseCode != 0 || (response.message && response.message.code != 0)) {
                    //                 return {
                    //                     ServiceCallID: requestInput.ServiceCallID,
                    //                     ResponseStatus: 1,
                    //                     MessageResponses: [{
                    //                         MessageCode: "999",
                    //                         MessageDescription: "An Unknown error has occurred. Please try again later."
                    //                     }]
                    //                 }
                    //             }

                    //             return {
                    //                 ServiceCallID: requestInput.ServiceCallID,
                    //                 ResponseStatus: 0,
                    //                 MessageResponses: [{
                    //                     MessageCode: "000",
                    //                     MessageDescription: "Success"
                    //                 }]
                    //             }
                    //         }

                    //     }
                    // } catch (error) {
                    //     return {
                    //         ServiceCallID: requestInput.ServiceCallID,
                    //         ResponseStatus: 1,
                    //         MessageResponses: [{
                    //             MessageCode: error.message.code,
                    //             MessageDescription: error.message.content
                    //         }]
                    //     }
                    // }
                } else {
                    return {
                        ServiceCallID: requestInput.ServiceCallID ? requestInput.ServiceCallID : "",
                        ResponseStatus: 1,
                        MessageResponses: [{
                            MessageCode: "INVALID",
                            MessageDescription: "Required fields are missing."
                        }]
                    }
                }

                break;
            case REQUEST_GET:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, requestContent.ServiceCallID, EXCEPTION_UNSUPPORTED_OPERATION)
                break;
            case REQUEST_UPDATE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "update" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, requestContent.ServiceCallID, EXCEPTION_UNSUPPORTED_OPERATION)

                break;
            case REQUEST_PATCH:
                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "patch" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, requestContent.ServiceCallID, EXCEPTION_UNSUPPORTED_OPERATION)

                break;
            case REQUEST_DELETE:

                /* This operation is not supported by the endpoint. */
                EXCEPTION_UNSUPPORTED_OPERATION.content = `The requested operation "delete" is not supported for "${_ENDPOINT_NAME}" endpoint.`
                return generateResponse(RESPONSE_CODE_ERROR, requestContent.ServiceCallID, EXCEPTION_UNSUPPORTED_OPERATION)

                break;

            default:
                break;
        }
    } catch (error) {
        /* Log exception */
        //logException(input.transactionId,error)
        /* Check if the error is caught exception */
        if (error && JSON.parse(error.message).code == "2") {
            /* generate error response */
            return generateResponse(error.type, input.transactionId, error.message)
        } else {
            return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }
    }
}())

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
        "logger": `${endpoint}/getRequestContent`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": "KYID-IRE",
            "content": ""
        },
        "logger": `${endpoint}/getRequestContent`,
        "timestamp": ""
    }

    try {

        if (request.content) {
            logDebug(context.transactionId, endpoint, "getRequestContent", `Input parameter: ${request.content}`)

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

function handleAuthChanged(requestInput, requestedUser, ACCESS_ENDPOINT_NAME) {
    try {
        let authRequests = []


        /* Iterate through each authorization entry */
        requestInput.UserAuthorizations.forEach(auth => {
            let authRequest = {}

            authRequest.businessApplicationIdAttributeName = "name"
            authRequest.businessApplicationAttributeValue = auth.ApplicationName
            authRequest.roleIdAttributeName = "name"
            authRequest.roleAttributeValue = auth.RoleName

            if (auth.DelegatorKOGID) {
                authRequest.originalDelegatorUserIdAttributeName = "userName"
                authRequest.originalDelegatorUserAttributeValue = auth.DelegatorKOGID
                authRequest.currentDelegatorUserIdAttributeName = "userName"
                authRequest.currentDelegatorUserAttributeValue = auth.DelegatorKOGID
            }

            auth.KOGOrgID ? authRequest.KOGOrgId = auth.KOGOrgID : null
            auth.OrgType ? authRequest.orgType = auth.OrgType : null
            auth.OrgSourceUniqueID ? authRequest.sourceUniqueId = auth.OrgSourceUniqueID : null
            auth.BusinessKeyType ? authRequest.businessKeyTypeName = auth.BusinessKeyType : null
            auth.BusinessKeyID ? authRequest.businessKeyName = auth.BusinessKeyID : null
            auth.BusinessKeyValue ? authRequest.businessKeyValue = auth.BusinessKeyValue : null
            auth.BusinessKeyDescription ? authRequest.businessKeyDescription = auth.BusinessKeyDescription : null
            auth.AuthorizationAction ? authRequest.authorizationAction = auth.AuthorizationAction : ""

            authRequests.push(authRequest)
        })

        /* Create Request */
        createRequest = {
            sub: "5d34b6b2-4b6f-43a5-9483-506dc6b6ddd8",
            payload: {
                requester: {
                    userIdAttributeName: "userName",
                    userIdAttributeValue: "KYIDSystemUser"
                },
                requestedUser: {
                    userIdAttributeName: requestedUser.userIdAttributeName,
                    userIdAttributeValue: requestedUser.userIdAttributeValue
                },
                requests: authRequests,
                isSyncRequest: true
            },
            action: 1
        }
        return openidm.create(ACCESS_ENDPOINT_NAME, null, createRequest)
    } catch (error) {
        return {
            "error": error
        }
    }
}

function handleProfileChanged(requestContent, requestedUser, UPDATE_USER_PROFILE_ENDPOINT_NAME) {
    let userProfileInfo = requestContent.UserProfileInfo

    let userProfileArray = {
        "KOGID": requestContent.UserIdentifier.KOGID,
        "alpha_user": [{
            "propertyName": "userName",
            "propertyValue": userProfileInfo.KOGID
        },
        {
            "propertyName": "givenName",
            "propertyValue": userProfileInfo.FirstName
        },
        {
            "propertyName": "sn",
            "propertyValue": userProfileInfo.LastName
        },
        {
            "propertyName": "accountStatus",
            "propertyValue": userProfileInfo.UserStatus + ""
        },
        // {
        //     "propertyName": "custom_kogAccountType",
        //     "propertyValue": userProfileInfo.UserType
        // },
        // {
        //     "propertyName": "frIndexedString1",
        //     "propertyValue": userProfileInfo.UPN
        // },
        // {
        //     "propertyName": "custom_logon",
        //     "propertyValue": userProfileInfo.LOGON
        // }
        // {
        //     "propertyName": "custom_windowsAccountName",
        //     "propertyValue": userProfileInfo.WindowsAccountName
        // },
        {
            "propertyName": "mail",
            "propertyValue": userProfileInfo.EmailAddress
        },
        {
            "propertyName": "custom_languagePreference",
            "propertyValue": userProfileInfo.LanguagePreference
        },
        {
            "propertyName": "custom_approvalUnit5Code",
            "propertyValue": userProfileInfo.AULevel5
        },
        {
            "propertyName": "custom_approvalUnit4Code",
            "propertyValue": userProfileInfo.AULevel4
        },
        {
            "propertyName": "custom_approvalUnit3Code",
            "propertyValue": userProfileInfo.AULevel3
        },
        {
            "propertyName": "custom_approvalUnit2Code",
            "propertyValue": userProfileInfo.AULevel2
        },
        {
            "propertyName": "custom_approvalUnit1Code",
            "propertyValue": userProfileInfo.AULevel1
        },
                        {
            "propertyName": "postalAddress",
            "propertyValue": userProfileInfo.Address1
        },
        {
            "propertyName": "custom_postalAddress2",
            "propertyValue": userProfileInfo.Address2
        },
        {
            "propertyName": "city",
            "propertyValue": userProfileInfo.City
        },
        {
            "propertyName": "stateProvince",
            "propertyValue": userProfileInfo.State
        },
        {
            "propertyName": "postalCode",
            "propertyValue": userProfileInfo.Zip
        }
        ],
      
        "user_identity": [{
            "propertyName": "givenName",
            "propertyValue": userProfileInfo.FirstName
        },
        {
            "propertyName": "sn",
            "propertyValue": userProfileInfo.LastName
        },
        {
            "propertyName": "addressLine1",
            "propertyValue": userProfileInfo.Address1
        },
        {
            "propertyName": "addressLine2",
            "propertyValue": userProfileInfo.Address2
        },
        {
            "propertyName": "city",
            "propertyValue": userProfileInfo.City
        },
        {
            "propertyName": "stateCode",
            "propertyValue": userProfileInfo.State
        },
        {
            "propertyName": "zip",
            "propertyValue": userProfileInfo.zip
        }
        ],
        "alpha_kyid_mfa_methods": [{
            "propertyName": "MFAValue",
            "propertyValue": userProfileInfo.MobileNumber
        }]
    }

    /* Create Request */
    createRequest = {
        sub: "5d34b6b2-4b6f-43a5-9483-506dc6b6ddd8",
        payload: {
            requester: {
                userIdAttributeName: "userName",
                userIdAttributeValue: "KYIDSystemUser"
            },
            requestedUser: {
                userIdAttributeName: requestedUser.userIdAttributeName,
                userIdAttributeValue: requestedUser.userIdAttributeValue
            },
            requests: userProfileArray,
            isSyncRequest: true
        },
        action: 5
    }

    return response = openidm.create(UPDATE_USER_PROFILE_ENDPOINT_NAME, null, createRequest)
}


function checkConditions(requestContent, requestedUser) {
    let userIdentifier = requestContent.UserIdentifier
    let userProfileInfo = requestContent.UserProfileInfo
    let userAuthorizations = requestContent.UserAuthorizations
    let action = requestContent.Action

    let kogID = userIdentifier.KOGID
    let alphaUser

    if (!kogID) {
        kogID = UserProfileInfo.KOGID
    }

    if (kogID) {
        alphaUserResult = openidm.query("managed/alpha_user", {
            "_queryFilter": `/userName eq "${kogID}"`
        }, ["*"]).result
        if (alphaUserResult && alphaUserResult.length == 0) { // if KOGID doesn't exist in Ping
            logger.error("KOGID " + kogID + " not found during sync profile and auth ")
            return {
                "noAction": {
                    "ServiceCallID": requestContent.ServiceCallID,
                    "ResponseStatus": 0
                }
            }
        } else {
            alphaUser = alphaUserResult[0]
        }

    } else {
        let filter = {
            _queryFilter: `${requestedUser.userIdAttributeName} eq '${requestedUser.userIdAttributeValue}'`
        }


        let userResponse = openidm.query("managed/alpha_user", filter, ["*"]).result

        if (userResponse.length > 0) {
            alphaUser = userResponse[0]
        } else {
            logger.error("User with  " + requestedUser.userIdAttributeName + ":" + requestedUser.userIdAttributeValue + " not found during sync profile and auth ")
            return {
                "noAction": {
                    "ServiceCallID": requestContent.ServiceCallID,
                    "ResponseStatus": 0
                }
            }
        }
    }

    if (userAuthorizations && userAuthorizations.length > 0) {
        for (let i = userAuthorizations.length - 1; i >= 0; i--) {
          
            let applicationName = userAuthorizations[i].ApplicationName
            let roleName = userAuthorizations[i].RoleName
            let roleResult

            let businessApp
            let role

            let originalDelegatorKOGID = userAuthorizations[i].DelegatorKOGID
            let currentDelegatorKOGID = userAuthorizations[i].CurrentDelegatorKOGID

            let originalDelegatorResult
            let originalDelegator
            let currentDelegatorResult
            let currentDelegator
            let searchFilter = ""

            let KOGOrgID = userAuthorizations[i].KOGOrgID
            let OrgType = userAuthorizations[i].OrgType
            let OrgSourceUniqueID = userAuthorizations[i].OrgSourceUniqueID

            let BusinessKeyType = userAuthorizations[i].BusinessKeyType
            let BusinessKeyID = userAuthorizations[i].BusinessKeyID
            let BusinessKeyValue = userAuthorizations[i].BusinessKeyValue
            let BusinessKeyDescription = userAuthorizations[i].BusinessKeyDescription

            if (applicationName) {
                let businessAppResult = openidm.query("managed/alpha_kyid_businessapplication", {
                    "_queryFilter": `/name eq "${applicationName}"`
                }, ["*"]).result

                if (businessAppResult && businessAppResult.length == 0) { // app not found in KYID
                    logger.error("Application with name " + applicationName + " not found during sync profile and auth ")

                    return {
                        "error": {
                            "ServiceCallID": requestContent.ServiceCallID,
                            "ResponseStatus": 1,
                            "MessageResponses": [{
                                "MessageCocde": "-107",
                                "MessageDescription": "Application with name " + applicationName + " not found in KYID "
                            }]
                        }

                    }
                } else {
                    businessApp = businessAppResult[0]
                }
            } else {
                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-106",
                            "MessageDescription": "Application is required for UserAuth"
                        }]
                    }

                }
            }


            if (roleName) {
                roleResult = openidm.query("managed/alpha_role", {
                    "_queryFilter": `/name eq "${roleName}"`
                }, ["*"]).result

                if (roleResult && roleResult.length == 0) { // role not found in KYID
                    logger.error("Role with name " + roleName + " not found during sync profile and auth ")

                    return {
                        "error": {
                            "ServiceCallID": requestContent.ServiceCallID,
                            "ResponseStatus": 1,
                            "MessageResponses": [{
                                "MessageCocde": "-108",
                                "MessageDescription": "Role with name " + roleName + " not found in KYID "
                            }]
                        }
                    }
                } else if (roleResult && roleResult.length == 1) {
                    role = roleResult[0]
                    let roleState = roleResult[0].recordState

                    if (roleState && roleState.toLowerCase() != "active" && roleState != "0") {
                        logger.error("Role with name " + roleName + " is not active during sync profile and auth ")
                        userAuthorizations.splice(i, 1); // remove current authorization
                        continue
                    }
                }
            } else {
                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-109",
                            "MessageDescription": "Role name is required for UserAuth"
                        }]
                    }

                }
            }

            if (currentDelegatorKOGID && currentDelegatorKOGID != null && (!originalDelegatorKOGID || originalDelegatorKOGID == null)) {
                logger.error(" OriginalDelegator is missing, while currentDelegatorKOGID is present. CurrentDelegator: " + currentDelegatorKOGID + ", OriginalDelegator: " + originalDelegatorKOGID)

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-119",
                            "MessageDescription": "Delegator should not be missing while CurrentDelegator is present"
                        }]
                    }
                }
            }

            if ((!currentDelegatorKOGID || currentDelegatorKOGID == null) && originalDelegatorKOGID && originalDelegatorKOGID != null) {
                logger.error(" currentDelegatorKOGID is missing, while originalDelegatorKOGIDis present. CurrentDelegator: " + currentDelegatorKOGID + ", OriginalDelegator: " + originalDelegatorKOGID)

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-120",
                            "MessageDescription": "CurrentDelegator should not be missing while Delegator is present"
                        }]
                    }
                }
            }

            if (BusinessKeyID &&
                !KOGOrgID) {
                logger.error(" Business key information is present but org information is not for sync profile and auth")

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-121",
                            "MessageDescription": " Business key information is present but org information is not"
                        }]
                    }
                }
            }

            if (action.toLowerCase() == "profilechanged" && (!userProfileInfo || userProfileInfo == null)) {
                logger.error(" Action is ProfileChange but no user profile info is present for sync profile and auth")

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-130",
                            "MessageDescription": " Action is ProfileChange but no user profile info is present"
                        }]
                    }
                }
            }

            if (action.toLowerCase() == "authchanged" && (!userAuthorizations || userAuthorizations == null)) {
                logger.error(" Action is AuthChanged but no user auth info is present for sync profile and auth")

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-131",
                            "MessageDescription": " Action is AuthChanged but no user auth info is present"
                        }]
                    }
                }
            }

            if (action.toLowerCase() == "profileandauthchanged" && ((!userAuthorizations || userAuthorizations == null) || (!userProfileInfo || userProfileInfo == null))) {
                logger.error(" Action is ProfileAndAuthChanged but user profile or auth info is missing for sync profile and auth")

                return {
                    "error": {
                        "ServiceCallID": requestContent.ServiceCallID,
                        "ResponseStatus": 1,
                        "MessageResponses": [{
                            "MessageCocde": "-132",
                            "MessageDescription": " Action is ProfileAndAuthChanged but user profile or auth info is missing"
                        }]
                    }
                }
            }




            if (originalDelegatorKOGID) {
                originalDelegatorResult = openidm.query("managed/alpha_user", {
                    "_queryFilter": `/userName eq "${originalDelegatorKOGID}"`
                }, ["*"]).result

                if (originalDelegatorResult && originalDelegatorResult.length == 0) { // if KOGID doesn't exist in Ping
                    logger.error("Original Delegator KOGID " + originalDelegatorKOGID + " not found during sync profile and auth ")
                    userAuthorizations.splice(i, 1); // remove current authorization
                    continue
                } else {
                    originalDelegator = originalDelegatorResult[0]
                }
            }


            if (currentDelegatorKOGID) {
                currentDelegatorResult = openidm.query("managed/alpha_user", {
                    "_queryFilter": `/userName eq "${currentDelegatorKOGID}"`
                }, ["*"]).result

                if (currentDelegatorResult && currentDelegatorResult.length == 0) { // if KOGID doesn't exist in Ping
                    logger.error("Original Delegator KOGID " + currentDelegatorKOGID + " not found during sync profile and auth ")
                    userAuthorizations.splice(i, 1); // remove current authorization
                    continue
                } else {
                    currentDelegator = currentDelegatorResult[0]
                }
            }


            // check for existing access entry

            searchFilter = searchFilter.concat(`userIdentifier eq '${alphaUser._id}'`)

            searchFilter = searchFilter.concat(` AND appIdentifier eq '${businessApp._id}'`)
            searchFilter = searchFilter.concat(` AND roleIdentifier eq '${role._id}'`)
            searchFilter = searchFilter.concat(` AND recordState eq '0'`)


            if (originalDelegatorKOGID) {
                searchFilter = searchFilter.concat(` AND originalDelegatorIdentifier eq '${originalDelegator._id}'`)
                searchFilter = searchFilter.concat(` AND currentDelegatorIdentifier eq '${currentDelegator._id}'`)
            }
            if (KOGOrgID) {
                searchFilter = searchFilter.concat(` AND orgId eq '${KOGOrgID}'`)
            }
            if (BusinessKeyID) {
                searchFilter = searchFilter.concat(` AND kogOrgBusinessKeyId eq '${BusinessKeyID}'`)
            }


            let searchResponse = openidm.query("managed/alpha_kyid_access", {
                "_queryFilter": searchFilter
            },
                ["*"]
            ).result

            if (userAuthorizations[i].AuthorizationAction && userAuthorizations[i].AuthorizationAction.toLowerCase() == "add") {
                if (searchResponse.length > 0) {
                    logger.error("The access entry already exists. Ignore it for add operation.")
                    userAuthorizations.splice(i, 1); // remove current authorization
                    continue
                }
            }
            else if (userAuthorizations[i].AuthorizationAction && userAuthorizations[i].AuthorizationAction.toLowerCase() == "remove") {
                if (searchResponse.length == 0) {
                    logger.error("The access entry can not be found. Ignore it for remove operation.")
                    userAuthorizations.splice(i, 1); // remove current authorization
                    continue
                }
            }
        }

        return {
            "userAuthorizations": userAuthorizations
        }
    }

}