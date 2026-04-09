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
        "auditLogger": auditLoggerObj,
        "payload": {}
    }

    let response = null

    try {
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
        let searchResponse = null;
        var authenticatedUserId = context.security && context.security.authorization && context.security.authorization.id;
        //var authenticatedUserId = "e84e33b0-e127-4df0-99fe-b9d01300bcbf";
        logger.error("the user id invitation_draftV3 : " + authenticatedUserId);

        let result
        switch (request.method) {

            case REQUEST_POST:
                /* Get request content */

                const action = requestContent.action

                /* Create action */
                if (action == ACTION_INVITE) {
                    input.payload = requestContent.payload
                    // input.payload.userid = authenticatedUserId;
                    input.payload.requesterAccountId = authenticatedUserId;
                    /* Create access record. */

                    result = sendInvitationAPI(input)
                    logger.error("result is: " + JSON.stringify(result))
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                    logger.error("Bulk Operation final response : " + JSON.stringify(response));

                } else if (action == ACTION_SEARCH) {
                    logger.error("action is search")
                    input.payload = requestContent.payload
                    input.payload.userid = authenticatedUserId;
                    /* Search access records. */
                    let view = null
                    if (input.payload.view) {
                        view = input.payload.view
                        logger.error("line 133")
                    }
                    if (view.toLowerCase() === "helpdeskactiveinvitation") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = searchHelpDeskActiveInvitation(input);

                    } else if (view.toLowerCase() === "delegationmanageinvitation") {
                        result = searchDelManageInvitation(input)
                    } else if (view.toLowerCase() === "delegationActiveInvitation") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = searchDelManageInvitation(input)
                    } else if (view.toLowerCase() === "helpdeskactiveinvitationbyuser") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = helpdeskactiveinvitationbyUser(input)
                    } else if (view.toLowerCase() === "helpdeskmanageinvitationbyapp") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = helpdeskmanageinvitationbyapp(input)
                    } else if (view.toLowerCase() === "delegationactiveinvitationbyuser") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = delegationactiveinvitationbyuser(input)
                    } else if (view.toLowerCase() === "delegationmanageinvitationbydelegator") {
                        searchResponse = searchInvitationQuery(input);
                        input.searchResponse = searchResponse;
                        result = delegationmanageinvitationbydelegator(input)
                    } else if (view.toLowerCase() === "searchrole") {
                        result = searchRole(input);
                    } else {
                        result = searchInvitationQuery(input)
                    }

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
                    input.payload.requesterAccountId = authenticatedUserId
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

/**
 * @name searchRole
 * @description Method searches role. 
 * 
 * @param {JSON} input 
 * @returns {JSON} response
 */
function searchRole(input) {
    var roleId = input.payload.roleId;

    if (!roleId) {
        return {
            error: "Missing role ID (roleId) parameter."
        };
    }

    // Query the alpha_role managed object
    var role = openidm.read("managed/alpha_role/" + roleId);

    if (!role) {
        return {
            error: "Role not found for ID: " + roleId
        };
    }

    var roleNames = {};
    var roleDescriptions = {};
    if (role.content && role.content.length > 0) {
        var contentObj = role.content[0];
        if (contentObj.name) {
            for (var lang in contentObj.name) {
                if (contentObj.name.hasOwnProperty(lang)) {
                    roleNames[lang] = contentObj.name[lang];
                }
            }
        }
        if (contentObj.description) {
            for (var lang2 in contentObj.description) {
                if (contentObj.description.hasOwnProperty(lang2)) {
                    roleDescriptions[lang2] = contentObj.description[lang2];
                }
            }
        }
    }
    // Fallbacks if no localization found
    if (Object.keys(roleNames).length === 0 && role.name) {
        roleNames["default"] = role.name;
    }
    if (Object.keys(roleDescriptions).length === 0 && role.description) {
        roleDescriptions["default"] = role.description;
    }

    // Get business application details
    var businessApp = null;
    if (role.businessAppId && role.businessAppId._refResourceId) {
        businessApp = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
    }

    // Get access policy details
    var accessPolicy = null;
    if (role.accessPolicy && role.accessPolicy._refResourceId) {
        accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
    }

    // Get prerequisites from access policy
    var prerequisites = [];
    //var prereqIds = [];
    if (accessPolicy && accessPolicy.preRequisites && accessPolicy.preRequisites.length > 0) {
        for (var i = 0; i < accessPolicy.preRequisites.length; i++) {
            var prereqRef = accessPolicy.preRequisites[i];
            if (prereqRef._refResourceId) {
                var prereq = openidm.read("managed/alpha_kyid_enrollment_prerequisite/" + prereqRef._refResourceId);
                if (prereq) {
                    var displayNameObj = {};
                    var displayDescObj = {};
                    if (prereq.displayName) {
                        for (var lang3 in prereq.displayName) {
                            if (prereq.displayName.hasOwnProperty(lang3) && prereq.displayName[lang3]) {
                                displayNameObj[lang3] = prereq.displayName[lang3];
                            }
                        }
                    }

                    if (prereq.displayDescription) {
                        for (var lang4 in prereq.displayDescription) {
                            if (prereq.displayDescription.hasOwnProperty(lang4) && prereq.displayDescription[lang4]) {
                                displayDescObj[lang4] = prereq.displayDescription[lang4];
                            }
                        }
                    }

                    prerequisites.push({
                        name: prereq.name,
                        description: prereq.description,
                        displayName: displayNameObj,
                        displayDescription: displayDescObj
                    });
                }
            }
        }
    }

    // Build response object
    var response = {
        roleName: roleNames,
        roleDescription: roleDescriptions,
        businessAppName: businessApp ? businessApp.name : null,
        prerequisites: prerequisites
    };

    return response;


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
            } else {
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




// Send Email
function sendEmail(contextId, givenName, sn, mail, isUserExist, applicationNames, requesterFullName,roleNamesHtml) {
    try {
        logger.error("contextId is -->" + contextId)
        var params = new Object();
      var phoneContact = null;
      var emailContact = null;
      var appName = "KYID Helpdesk";
      try{
        var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", { _queryFilter: 'name eq "' + appName + '"' }, ["phoneContact", "emailContact"]);

        phoneContact = userQueryResult2.result[0].phoneContact[0].phoneNumber
        emailContact = userQueryResult2.result[0].emailContact[0].emailAddress
      }
      catch (error){
        logger.error("Error in catch of helpdesk retrieval.");
      }
        params.templateName = "kyid2B1AccessDelegationInviteTemplate";
        params.to = mail;
        params._locale = "en";
        params.object = {
            "phoneContact":phoneContact,
            "givenName": givenName,
            "sn": sn,
            requestUri: null,
            "applicationNames": applicationNames,
            "requesterFullName": requesterFullName,
           "roleNamesHtml": roleNamesHtml

        };


        logger.error("the userExist in sendEmail::" + isUserExist)
        var portalURL = identityServer.getProperty("esv.portal.url")
        //send URL path based on user exist paramter
        if (isUserExist === true || isUserExist === "true") {
            params.object.requestUri = portalURL + "/appenroll/" + contextId;
        } else if (isUserExist === false || isUserExist === "false") {
            params.object.requestUri = portalURL + "/createaccount/" + contextId;
        }

        var portalURL = identityServer.getProperty("esv.portal.url")
        // params.object.requestUri = portalURL+ "/appenroll/" +contextId

        var response = openidm.action("external/email", "sendTemplate", params);
        logger.error("Email Sent SuccessFully to: " + mail)
        if (response) {
            return response
        } else {

            throw "invalidRequestException"
        }

    } catch (error) {
        logger.error("Error Occurred while sending Email to ::" + mail + " error::" + error);
        /* Throw invalid request exception. */
        throw error

    }
}


function createContextId(payload) {
    try {
        const searchResponse = openidm.query(`${MOName}`, {
            "_queryFilter": queryFilter
        },
            returnProperties
        )
        if (searchResponse && searchResponse.resultCount > 0) {
            return searchResponse.result
        } else {
            return null
        }

    } catch (error) {
        throw JSON.stringify(error)
    }

}

function createRecord(MOName, enrollmentReqTemplate) {
    try {

        const response = openidm.create("managed/" + MOName, null, enrollmentReqTemplate)

        if (response) {
            return response
        } else {
            throw ("Error Occurred while creating Enrollment request")
        }

    } catch (error) {
        throw JSON.stringify(error)
    }

}

function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now() // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString() // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate) // Convert the ISO string into a Date object

        var expiryDate;

        switch (option) {
            case 0: // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000) // Add one day (24 hours) to the current time
                break;
            case 1: // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000) // Add one week (7 days)
                break;
            case 2: // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1) // Add one month to the current date
                break;
            case 3: // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3) // Add 3 months to the current date
                break;
            case 4: // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6) // Add 6 months to the current date
                break;
            case 5: // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // Add 1 year to the current date
                break;
            case 6: // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day) // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // If the date is already passed this year, set it to the next year
                }
                break;
            case 7: // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000) // Add 'value' days in milliseconds
                break;
            case 8: // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value); // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return null
        }

        const expiryEpochMillis = new Date(expiryDate).getTime() // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return {
            "expiryEpochMillis": expiryEpochMillis,
            "expiryDate": expiryDate
        };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        return JSON.stringify(error)

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
            if (request.content.action === 4 && request.content.view) {
                /* Throw invalid request exception. */
                let view = request.content.view.toLowerCase()
                if (view === "dashboardactiveinvitation" && !(request.content.userId)) {
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException

                } else if (view === "helpdeskmanageinvitation" && !(request.content.userId)) {
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException

                } else if (view === "helpdeskactiveinvitation" && !(request.content.userId) && !(request.content.searchUserId)) {
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException

                } else if (view === "delegationmanageinvitation" && !(request.content.userId)) {
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException

                } else if (view === "delegationactiveinvitation" && !(request.content.userId)) {
                    invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content.userId`
                    invalidRequestException.timestamp = new Date().toISOString()

                    throw invalidRequestException

                }


            }


            logDebug(context.transactionId, endpoint, "getRequestContent", `Response: ${request.content}`)
            return request.content

        } else if (request.additionalParameters) {
            logger.error("request.additionalParameters are " + JSON.stringify(request.additionalParameters))
            return request.additionalParameters

        } else {

            /* Throw invalid request exception. */
            invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            invalidRequestException.timestamp = new Date().toISOString()

            throw invalidRequestException
        }
    } catch (error) {
        throw error
    }

}


function invokeKOGAPI(mail) {
    try {
        const requestBody = {
            "url": identityServer.getProperty("esv.kyid.kogapi.userprofile"),
            "scope": identityServer.getProperty("esv.kyid.kogapi.token.scope"),
            "method": "POST",
            "payload": {
                "EmailAddress": mail
            }

        }

        const response = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("the response from invokeAPI function::" + JSON.stringify(response));

        // check top-level status
        if (response && response.status === "200") {
            const kogResponse = response.response;

            if (kogResponse.ResponseStatus === 0) {
                return kogResponse;
            } else if (kogResponse.ResponseStatus === 1) {
                logger.error("KOG API: user not found for email " + mail);
                return {
                    UserDetails: null
                };
                // return null;
            } else {
                throw JSON.stringify(kogResponse);
            }
        }

    } catch (error) {
        throw JSON.stringify(error);
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

function searchObjectByIdAttributeValue(input, objectName, attributeName, attributeValue) {
    try {
        if (!attributeName || !attributeValue) {
            logger.error("searchObjectByIdAttributeValue :: Missing attributeName or attributeValue");
            return null;
        }

        let queryFilter = attributeName + ' eq "' + attributeValue + '"';
        let result = openidm.query(objectName, {
            "_queryFilter": queryFilter
        });

        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            logger.error("searchObjectByIdAttributeValue :: No object found in " + objectName +
                " where " + attributeName + " = " + attributeValue);
            return null;
        }
    } catch (e) {
        logger.error("searchObjectByIdAttributeValue :: Exception - " + e);
        return null;
    }
}

// function sendInvitationAPI(input) {
//     logger.error("resendInvitation Input --> " + JSON.stringify(input))

//     const EXCEPTION_UNEXPECTED_ERROR = {
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
//         "logger": `${input._ENDPOINT_NAME}/bulkoperation`,
//         "timestamp": ""
//     }
//     const unexpectedException = {
//         "code": "2",
//         "level": "ERROR",
//         "message": {
//             "code": EXCEPTION_UNEXPECTED_ERROR.code,
//             "content": ""
//         },
//         "logger": `${input._ENDPOINT_NAME}/bulkoperation`,
//         "timestamp": ""
//     }

//     let validEntries = []
//     let invalidEntries = []

//     try {
//         logDebug(input.transactionId, input.endPoint, "bulkoperation", `Input parameter: ${JSON.stringify(input.payload)}`)

//         if (input.payload) {
//             const invitedUser = input.payload.requestedUser || null
//             const access = input.payload.access || null
//             const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");

//             let isExternalUser = true
//             let isUserExist = true
//             let KOGID = null
//             let userDomain = null
//             let requestedUserAccountId = null
//             let requestedUserIdentifierAttributeName = null
//             let requestedUserIdentifierAttributeValue = null

//             if (invitedUser) {
//                 if (invitedUser && invitedUser.email) {

//                     logger.error("searching the user from email")
//                      let getUserbyIdPing = searchObjectByIdAttributeValue(
//                         input,
//                         "managed/alpha_user",
//                         "_id",
//                         invitedUser._id
//                     )
//                     if (getUserbyIdPing && getUserbyIdPing.accountStatus == "active") {
//                         logger.error("user found in ping")
//                         requestedUserAccountId = getUserbyIdPing._id
//                         requestedUserIdentifierAttributeName = "KYID"
//                         requestedUserIdentifierAttributeValue = getUserbyIdPing._id
//                         userDomain = getUserbyIdPing.frIndexedString2 || null
//                         if (userDomain) {
//                             userDomain = userDomain.split('@')[1]
//                             if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
//                                 isExternalUser = true
//                                 isUserExist = true
//                             }
//                         }
//                     } else {
//                       let KOGUserResponse = invokeKOGAPI(invitedUser.email)
//                     if (KOGUserResponse && KOGUserResponse.UserDetails && KOGUserResponse.UserDetails.UPN) {
//                         logger.error("user found in kog")
//                         KOGID = KOGUserResponse.UserDetails.KOGID || null
//                         if (KOGID) {
//                             requestedUserIdentifierAttributeName = "KOGID"
//                             requestedUserIdentifierAttributeValue = KOGID
//                         }
//                         userDomain = KOGUserResponse.UserDetails.UPN.toLowerCase() || null
//                         if (userDomain) {
//                             userDomain = userDomain.split('@')[1]
//                             if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
//                                 isExternalUser = true
//                                 isUserExist = true
//                             }
//                         }
//                     } else {
//                         isUserExist = false
//                     }
//                     }

//                 }

//                 if (isExternalUser === true) {
//                     logger.error("user is external")

//                     let rolewithPrereq = []
//                     let rolewithoutPrereq = []

//                     let defaultContextxpiryInDays = identityServer.getProperty("esv.enrollment.context.defaultexpiry")
//                     let contextExpiryDateEpoch = Date.now() + defaultContextxpiryInDays * 24 * 60 * 60 * 1000
//                     let contextExpiryDate = new Date(contextExpiryDateEpoch).toISOString();

//                     let contextRequestBody = {
//                         applicationRoles: [],
//                         createDate: new Date().toISOString(),
//                         createDateEpoch: Date.now(),
//                         createdBy: "KYID-System",
//                         expiryDate: contextExpiryDate,
//                         expiryDateEpoch: contextExpiryDateEpoch,
//                         recordSource: "1",
//                         recordState: "0",
//                         requestedUserAccountAttibutes: [
//                             { attributeName: "givenName", attributeValue: input.payload.requestedUser.firstName || null, isReadOnly: false },
//                             { attributeName: "sn", attributeValue: input.payload.requestedUser.lastName || null, isReadOnly: false },
//                             { attributeName: "mail", attributeValue: input.payload.requestedUser.email || null, isReadOnly: true }
//                         ],
//                         requestedUserAccountId: requestedUserAccountId || null,
//                         requestedUserIdentifierAttributeName,
//                         requestedUserIdentifierAttributeValue,
//                         requesterUserAccountId: input.payload.requesterAccountId,
//                         requesterUserIdentifierAttributeName: "KYID",
//                         requesterUserIdentifierAttributeValue: input.payload.requesterAccountId,
//                         status: "0",
//                         updateDate: new Date().toISOString(),
//                         updateDateEpoch: Date.now(),
//                         updatedBy: "KYID-System"
//                     }

//                     let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")
//                     let enrollExpiryDateEpoch = Date.now() + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
//                     let enrollExpiryDate = new Date(enrollExpiryDateEpoch).toISOString();

//                     let enrollmentReqTemplate = {
//                         createDate: new Date().toISOString(),
//                         createDateEpoch: Date.now(),
//                         expiryDate: enrollExpiryDate,
//                         expiryDateEpoch: enrollExpiryDateEpoch,
//                         status: "IN_PROGRESS",
//                         requestedUserId: requestedUserAccountId || null,
//                         requesterId: input.payload.requesterAccountId,
//                         recordState: "ACTIVE",
//                         enrollmentContextId: null,
//                         updateDate: new Date().toISOString(),
//                         updateDateEpoch: Date.now(),
//                         createdBy: "KYID-System",
//                         updatedBy: "KYID-System",
//                         appSystemName: [],
//                         roleIds: [],
//                         roleContext: []
//                     }

//                     if (access && access.length > 0) {
//                         access.forEach((value, index) => {
//                             let roleInfo = searchObjectByIdAttributeValue(input, "managed/alpha_role", value.roleIdAttribute, value.roleIdAttributeValue)
//                             let businessInfo = null
//                             if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
//                                 businessInfo = searchObjectByIdAttributeValue(
//                                     input,
//                                     "managed/alpha_kyid_businessapplication",
//                                     value.businessAppIdAttribute,
//                                     value.businessAppIdAttributeValue
//                                 )
//                             }

//                             if (!roleInfo) {
//                                 invalidEntries.push({ entry: index + 1, error: `Role not found: ${value.roleIdAttributeValue}` })
//                                 return
//                             }
//                             if (!businessInfo) {
//                                 invalidEntries.push({ entry: index + 1, error: `Business App not found for role: ${value.roleIdAttributeValue}` })
//                                 return
//                             }
//                             if (!roleInfo.businessAppId || roleInfo.businessAppId._refResourceId !== businessInfo._id) {
//                             invalidEntries.push({ entry: index + 1, error: `Role and BusinessApp mismatch: ${value.roleIdAttributeValue}` })
//                             return
//                         }

//                             validEntries.push({ entry: index + 1, role: roleInfo.name, businessApp: businessInfo.name })

//                             if (roleInfo && roleInfo.accessPolicy) {
//                                 let rolePolicy = searchObjectByIdAttributeValue(input, "managed/alpha_kyid_enrollment_access_policy", "_id", roleInfo.accessPolicy._refResourceId)
//                                 if (rolePolicy && rolePolicy.preRequisites && rolePolicy.preRequisites.length > 0) {
//                                     rolewithPrereq.push({
//                                         roleId: roleInfo._id,
//                                         applicationId: businessInfo._id,
//                                         roleName: roleInfo.name,
//                                         applicationName: businessInfo.name
//                                     })
//                                 } else {
//                                     enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + roleInfo._id, "_refProperties": {} })
//                                     enrollmentReqTemplate.roleContext.push({ appName: businessInfo.name, roleName: roleInfo.name })
//                                 }
//                             }
//                         })
//                     }

//                     // Create Enrollment Context if roles present
//                     if (rolewithPrereq.length > 0) {
//                         contextRequestBody.applicationRoles = rolewithPrereq
//                         let createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId", contextRequestBody)
//                         if (createContextIdResponse) {
//                             const ContextId = createContextIdResponse._id
//                             sendEmail(ContextId, input.payload.requestedUser.firstName, input.payload.requestedUser.lastName, input.payload.requestedUser.email, isUserExist)
//                         }
//                     }

//                     // Create Enrollment Request if roles present
//                     if (enrollmentReqTemplate.roleContext.length > 0) {
//                         let createEnrollmentRequestResponse = createRecord("alpha_kyid_enrollment_request", enrollmentReqTemplate)
//                         if (createEnrollmentRequestResponse) {
//                             const RequestId = createEnrollmentRequestResponse._id
//                             invokeRoleAccess(null, RequestId) // removed invitedUser._id usage
//                         }
//                     }

//                     // ==== Final Response ====
//                     if (validEntries.length > 0 && invalidEntries.length === 0) {
//                         return { status: "SUCCESS", valid: validEntries }
//                     } else if (validEntries.length === 0 && invalidEntries.length > 0) {
//                         return { status: "FAILURE", invalid: invalidEntries }
//                     } else {
//                         return { status: "PARTIAL_SUCCESS", valid: validEntries, invalid: invalidEntries }
//                     }

//                 } else {
//                     logger.error("Invalid request - Internal User")
//                     invalidRequestException.message.content = "Invalid request. The request contains an Internal User, only External Users are allowed"
//                     invalidRequestException.timestamp = new Date().toISOString()
//                     throw invalidRequestException
//                 }
//             } else {
//                 logger.error("Invalid request - Missing payload.requestedUser")
//                 invalidRequestException.message.content = "Invalid request. The request does not contain the required parameters. Missing parameter(s): \"payload\""
//                 invalidRequestException.timestamp = new Date().toISOString()
//                 throw invalidRequestException
//             }
//         }
//     } catch (error) {
//         logger.error("An unexpected error occured. Error" + error)
//         unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
//         unexpectedException.timestamp = new Date().toISOString()
//         throw unexpectedException
//     }
// }



function sendInvitationAPI(input) {
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
        "logger": `${input._ENDPOINT_NAME}/bulkoperation`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/bulkoperation`,
        "timestamp": ""
    }

    let validEntries = []
    let invalidEntries = []

    let createdContexts = []
    let createdRequests = []

    try {
        logDebug(input.transactionId, input.endPoint, "bulkoperation", `Input parameter: ${JSON.stringify(input.payload)}`)

        if (input.payload) {
            const invitedUser = input.payload.requestedUser || null
            const access = input.payload.access || null
            const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");

            let isExternalUser = true
            let isUserExist = false
            let KOGID = null
            let isPingUser = false
            let userDomain = null
            let requestedUserAccountId = null
            let requestedUserIdentifierAttributeName = null
            let requestedUserIdentifierAttributeValue = null

            if (invitedUser) {

                if (invitedUser && invitedUser.email) {
        
                    // requestedUser has email
                    logger.error("the email of user is present in reques")
                    let getUserbyIdPing = searchObjectByIdAttributeValue(
                        input,
                        "managed/alpha_user",
                        "mail",
                        invitedUser.email
                    )
                    logger.error("getUserbyIdPing: " + getUserbyIdPing)
                    if (getUserbyIdPing && getUserbyIdPing.accountStatus == "active") {
                        logger.error("user found in ping")
                        requestedUserAccountId = getUserbyIdPing._id
                        logger.error("requestedUserAccountId in ping::" + requestedUserAccountId)
                        requestedUserIdentifierAttributeName = "KYID"
                        requestedUserIdentifierAttributeValue = getUserbyIdPing._id
                        isPingUser = true
                        isUserExist = true
                        userDomain = getUserbyIdPing.frIndexedString2 || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true

                            }
                        }
                    }
                } else {
                    // lookup by mail in kog
                    logger.error("searching the user from email")
                    let KOGUserResponse = invokeKOGAPI(invitedUser.email)

                    if (KOGUserResponse && KOGUserResponse.UserDetails && KOGUserResponse.UserDetails.UPN) {
                        logger.error("user found in kog")
                        KOGID = KOGUserResponse.UserDetails.KOGID || null
                        if (KOGID) {
                            requestedUserIdentifierAttributeName = "KOGID"
                            requestedUserIdentifierAttributeValue = KOGID
                        }
                        userDomain = KOGUserResponse.UserDetails.UPN.toLowerCase() || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    } else {
                        isUserExist = false
                    }
                }

                if (isExternalUser === true) {
                    logger.error("user is external")

                    let rolewithPrereq = []
                    let rolewithoutPrereq = []

                    // Expiry dates for enrolment context
                    let defaultContextxpiryInDays = identityServer.getProperty("esv.enrollment.context.defaultexpiry")
                    let contextExpiryDateEpoch = Date.now() + defaultContextxpiryInDays * 24 * 60 * 60 * 1000
                    let contextExpiryDate = new Date(contextExpiryDateEpoch).toISOString();

                    // Enrollment Context + Request templates
                    let contextRequestBody = {
                        applicationRoles: [],
                        "createDate": new Date().toISOString(),
                        "createDateEpoch": Date.now(),
                        "createdBy": "KYID-System",
                        "createdByID": "KYID-System",
                        "expiryDate": contextExpiryDate,
                        "expiryDateEpoch": contextExpiryDateEpoch,
                        "recordSource": "1",
                        "recordState": "0",
                        "requestedUserAccountAttibutes": [{
                            "attributeName": "givenName",
                            "attributeValue": input.payload.requestedUser.firstName || null,
                            "isReadOnly": false
                        },
                        {
                            "attributeName": "sn",
                            "attributeValue": input.payload.requestedUser.lastName || null,
                            "isReadOnly": false
                        },
                        {
                            "attributeName": "mail",
                            "attributeValue": input.payload.requestedUser.email || null,
                            "isReadOnly": true
                        }
                        ],
                        "requestedUserAccountId": requestedUserAccountId || null,
                        "requestedUserIdentifierAttributeName": requestedUserIdentifierAttributeName,
                        "requestedUserIdentifierAttributeValue": requestedUserIdentifierAttributeValue,
                        "requesterUserAccountId": input.payload.requesterAccountId,
                        "requesterUserIdentifierAttributeName": "KYID",
                        "requesterUserIdentifierAttributeValue": input.payload.requesterAccountId,
                        "status": "0",
                        "updateDate": new Date().toISOString(),
                        "updateDateEpoch": Date.now(),
                        "updatedBy": "KYID-System",
                        "updatedByID": "KYID-System"
                    }

                    logger.error("contextRequestBody: " + contextRequestBody);

                    //Logic for expirydate. Its mandatory attribute in enrolment request MO
                    let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")
                    let enrollExpiryDateEpoch = Date.now() + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
                    let enrollExpiryDate = new Date(enrollExpiryDateEpoch).toISOString();

                    let enrollmentReqTemplate = {
                        createDate: new Date().toISOString(),
                        createDateEpoch: Date.now(),
                        expiryDate: enrollExpiryDate,
                        expiryDateEpoch: enrollExpiryDateEpoch,
                        status: "IN_PROGRESS",
                        requestedUserId: requestedUserAccountId || null,
                        requesterId: input.payload.requesterAccountId,
                        recordState: "ACTIVE",
                        enrollmentContextId: null,
                        updateDate: new Date().toISOString(),
                        updateDateEpoch: Date.now(),
                        createdBy: "KYID-System",
                        updatedBy: "KYID-System",
                        appSystemName: [],
                        roleIds: [],
                        roleContext: []
                    }

                    logger.error("enrollmentReqTemplate: " + enrollmentReqTemplate)

                    // If invitedUser has _id
                    if (isUserExist && isPingUser && access && access.length > 0) {
                        logger.error("invitedUser has _id")
                        access.forEach((value, index) => {
                            value.businessAppIdAttribute = "name";
                            value.roleIdAttribute = "name";
                         //   value.businessAppIdAttributeValue = value.applicationSystemName;
                          //  value.roleIdAttributeValue = value.roleSystemName;



                            

                            let businessInfo = null
                            if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                businessInfo = searchObjectByIdAttributeValue(
                                    input,
                                    "managed/alpha_kyid_businessapplication",
                                    value.businessAppIdAttribute,
                                    value.businessAppIdAttributeValue
                                )
                            }
                           
                            var queryFilter = "name eq '" + value.roleIdAttributeValue + "' and businessAppId/_refResourceId eq '" + businessInfo._id + "'";

                            var roleResult = openidm.query("managed/alpha_role", {
                                    "_queryFilter": queryFilter
                            });
                            var roleInfo = {};
                          
                            if (roleResult && roleResult.result && Array.isArray(roleResult.result) && roleResult.result.length > 0) {
                                roleInfo = roleResult.result[0]; // First matching role object
                            }

                            if(roleInfo && businessInfo && value.actionType === "remove") {
                                let queryFilter = "/userIdentifier eq \"" + requestedUserAccountId + "\" AND /roleIdentifier eq \"" + roleInfo._id + "\" AND /appIdentifier eq \"" + businessInfo._id + "\" AND /recordState eq \"0\"";
                                let accessResponse = openidm.query("/managed/alpha_kyid_access", {"_queryFilter": queryFilter}, ["enrollmentRequestId"]);
                                logger.error("access response is: " + accessResponse)
                                if(accessResponse && accessResponse.result && accessResponse.result[0]) {
                                    let enrollmentRequest = accessResponse.result[0].enrollmentRequestId;
                                    let deprovPayload = {
                                        "payload": {
                                            "id": requestedUserAccountId,
                                            "queryFilter": "_id eq '" + accessResponse.result[0]._id +"' AND (recordState eq \"0\" or recordState eq 'ACTIVE')",
                                        },
                                         "confirmation":{
                                            "reason":"bulkOperation",
                                            "comment":"This access is deleted from bulk operation."
                                        },
                                        "action": "3"
                                    }
                                    logger.error("deprovPayload is: " + JSON.stringify(deprovPayload))

                                    try {
                                        let deprovResponse = openidm.create("endpoint/access_v2B", null, deprovPayload);
                                        logger.error("deprovResponse is: " + deprovResponse)
                                    } catch(error) {
                                        logger.error("bulkoperation error on remove: " + JSON.stringify(error));
                                        invalidEntries.push({
                                            entry: index + 1,
                                            appName: value.businessAppIdAttributeValue,
                                            roleName: value.roleIdAttributeValue,
                                            type: "",
                                            status: "FAILURE",
                                            error: `Failure in removing role from user: ${value.roleIdAttributeValue}`
                                        })
                                        //throw error;
                                    }
                                }
                                return;
                            }

                            if (!roleInfo) {
                                invalidEntries.push({
                                    entry: index + 1,
                                    appName: value.businessAppIdAttributeValue,
                                    roleName: value.roleIdAttributeValue,
                                    type: "",
                                    status: "FAILURE",
                                    error: `Role not found: ${value.roleIdAttributeValue}`
                                })
                                return
                            }

                            if (!businessInfo) {
                                invalidEntries.push({
                                    entry: index + 1,
                                    appName: value.businessAppIdAttributeValue,
                                    roleName: value.roleIdAttributeValue,
                                    type: "",
                                    status: "FAILURE",
                                    error: `Business App not found for role: ${value.roleIdAttributeValue}`
                                })
                                return
                            }

                            if (!roleInfo.businessAppId || roleInfo.businessAppId._refResourceId !== businessInfo._id) {
                                invalidEntries.push({
                                    entry: index + 1,
                                    appName: value.businessAppIdAttributeValue,
                                    roleName: value.roleIdAttributeValue,
                                    type: "",
                                    status: "FAILURE",
                                    error: `Role and BusinessApp mismatch: ${value.roleIdAttributeValue}`
                                })
                                return
                            }


                            validEntries.push({
                                entry: index + 1,
                                role: roleInfo.name,
                                businessApp: businessInfo.name
                            })

                            if (roleInfo && roleInfo.accessPolicy) {
                                let rolePolicy = searchObjectByIdAttributeValue(input, "managed/alpha_kyid_enrollment_access_policy", "_id", roleInfo.accessPolicy._refResourceId)
                                if (rolePolicy && rolePolicy.preRequisites && rolePolicy.preRequisites.length > 0) {
                                    logger.error("Role needs prerequisites - Enrollment Context")


                                    let prereqObj = {
                                        entry: index + 1,
                                        roleId: roleInfo._id,
                                        applicationId: businessInfo._id,
                                        roleName: roleInfo.name,
                                        applicationName: businessInfo.name
                                    };

                                    // push delegation attributes only if present
                                    if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue) {
                                        prereqObj.isForwardDelegable = value.isForwardDelegable;
                                        prereqObj.delegationEndDate = value.delegationEndDate;
                                        prereqObj.delegationEndDateEpoch = value.delegationEndDate || null;
                                        prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                        prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                        prereqObj.originalDelegatorUserAccountId = value.originalDelegatorIdAttributeValue
                                        prereqObj.orginalDelegatorIdentifierAttributeValue = value.originalDelegatorIdAttributeValue
                                        prereqObj.orginalDelegatorIdentifierAttributeName = value.orginalDelegatorIdentifierAttributeName
                                    }
                                    if (
                                        value.kogorganizationID || value.kogBusinessKeyID
                                    ) {
                                        prereqObj.orgId = value.kogorganizationID;
                                        prereqObj.orgType = value.organizationType;
                                        prereqObj.orgName = value.organizationName || null;
                                        prereqObj.orgSourceUniqueId = value.organizationSourceUniqueID;
                                        prereqObj.businessKeyId = value.kogBusinessKeyID;
                                        prereqObj.businessKeyName = value.businessKeyName;
                                        prereqObj.businessKeyValue = value.businessKeyValue;
                                        prereqObj.businessKeyDescription = value.businessKeyDescription
                                    }


                                    rolewithPrereq.push(prereqObj);

                                } else {
                                    logger.error("No prerequisites.Create Enrollment Request")
                                    enrollmentReqTemplate.roleIds.push({
                                        "_ref": "managed/alpha_role/" + roleInfo._id,
                                        "_refProperties": {}
                                    })

                                    let roleContextObj = {
                                        entry: index + 1,
                                        appName: businessInfo.name,
                                        roleName: roleInfo.name,
                                        roleId: roleInfo._id
                                    };

                                    if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue) {
                                        roleContextObj.isForwardDelegable = value.isForwardDelegable;
                                        roleContextObj.delegationEndDate = value.delegationEndDate;
                                        roleContextObj.delegationEndDateEpoch = value.delegationEndDate;
                                        roleContextObj.currentDelegatorId = value.currentDelegatorIdAttributeValue;
                                        roleContextObj.orginalDelegatorId = value.originalDelegatorIdAttributeValue;
                                    }

                                    enrollmentReqTemplate.roleContext.push(roleContextObj);

                                }
                            } else {
                                invalidRequestException.message.content = "Invalid request. Role Not Found :: " + value.roleIdAttributeValue;
                                invalidRequestException.timestamp = new Date().toISOString()
                                throw invalidRequestException
                            }
                        })
                    } else if (!isUserExist && !isPingUser && access && access.length > 0) {

                      var tst = [];
                        // User does not exist in kog or ping. create Enrollment Context
                        logger.error("User does not exist in kog or ping")
                        if (access && access.length > 0) {
                            access.forEach((value, index) => {
                                value.businessAppIdAttribute = "name";
                                value.roleIdAttribute = "name";
                           //     value.businessAppIdAttributeValue = value.applicationSystemName;
                            //    value.roleIdAttributeValue = value.roleSystemName;


                                if(value.actionType && value.actionType === "remove") {
                                    invalidEntries.push({
                                        entry: index + 1,
                                        appName: value.businessAppIdAttributeValue,
                                        roleName: value.roleIdAttributeValue,
                                        type: "",
                                        status: "FAILURE",
                                        error: `User does not exist for role action 'remove': ${value.roleIdAttributeValue}`
                                    });
                                  return;
                                }


                                let businessInfo = null;
                                if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                    businessInfo = searchObjectByIdAttributeValue(
                                        input,
                                        "managed/alpha_kyid_businessapplication",
                                        value.businessAppIdAttribute,
                                        value.businessAppIdAttributeValue
                                    );
                                }


                                //     if (!roleInfo) {
                                //         invalidEntries.push({ entry: index + 1, error: `Role not found: ${value.roleIdAttributeValue}` })
                                //         return
                                //     }
                                //     if (!businessInfo) {
                                //         invalidEntries.push({ entry: index + 1, error: `Business App not found for role: ${value.roleIdAttributeValue}` })
                                //         return
                                //     }
                                //     if (!roleInfo.businessAppId || roleInfo.businessAppId._refResourceId !== businessInfo._id) {
                                //     invalidEntries.push({ entry: index + 1, error: `Role and BusinessApp mismatch: ${value.roleIdAttributeValue}` })
                                //     return
                                // }

                                var queryFilter = "name eq '" + value.roleIdAttributeValue + "' and businessAppId/_refResourceId eq '" + businessInfo._id + "'";

                                var roleResult = openidm.query("managed/alpha_role", {
                                    "_queryFilter": queryFilter
                                });
                                var roleInfo = {};
                              
                                if (roleResult && roleResult.result && Array.isArray(roleResult.result) && roleResult.result.length > 0) {
                                    roleInfo = roleResult.result[0]; // First matching role object
                                }

                                if (!roleInfo) {
                                    invalidEntries.push({
                                        entry: index + 1,
                                        appName: value.businessAppIdAttributeValue,
                                        roleName: value.roleIdAttributeValue,
                                        type: "",
                                        status: "FAILURE",
                                        error: `Role not found: ${value.roleIdAttributeValue}`
                                    })
                                    return
                                }

                                if (!businessInfo) {
                                    invalidEntries.push({
                                        entry: index + 1,
                                        appName: value.businessAppIdAttributeValue,
                                        roleName: value.roleIdAttributeValue,
                                        type: "",
                                        status: "FAILURE",
                                        error: `Business App not found for role: ${value.roleIdAttributeValue}`
                                    })
                                    return
                                }
                               

                                if (!roleInfo.businessAppId || roleInfo.businessAppId._refResourceId !== businessInfo._id) {
                                    invalidEntries.push({
                                        entry: index + 1,
                                        appName: value.businessAppIdAttributeValue,
                                        roleName: value.roleIdAttributeValue,
                                        type: "",
                                        status: "FAILURE",
                                        error: `Role and BusinessApp mismatch: ${value.roleIdAttributeValue}`
                                    })
                                    return
                                }


                                validEntries.push({
                                    entry: index + 1,
                                    role: roleInfo.name,
                                    businessApp: businessInfo.name
                                })

                                // Create prereq object
                                let prereqObj = {

                                    roleId: roleInfo._id,
                                    applicationId: businessInfo._id,
                                    roleName: roleInfo.name,
                                    applicationName: businessInfo.name
                                };

                                // Push only if delegation-related attributes are present
                                if (
                                    value.isForwardDelegable ||
                                    value.delegationEndDate ||
                                    value.currentDelegatorIdAttributeValue ||
                                    value.originalDelegatorIdAttributeValue
                                ) {
                                    prereqObj.isForwardDelegable = value.isForwardDelegable;
                                    prereqObj.delegationEndDate = value.delegationEndDate;
                                    prereqObj.delegationEndDateEpoch = value.delegationEndDate || null;
                                    prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                    prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                    prereqObj.originalDelegatorUserAccountId = value.originalDelegatorIdAttributeValue
                                    prereqObj.orginalDelegatorIdentifierAttributeValue = value.originalDelegatorIdAttributeValue
                                    prereqObj.orginalDelegatorIdentifierAttributeName = value.orginalDelegatorIdentifierAttributeName

                                }

                                if (
                                    value.kogorganizationID || value.kogBusinessKeyID
                                ) {
                                    prereqObj.orgId = value.kogorganizationID;
                                    prereqObj.orgType = value.organizationType;
                                    prereqObj.orgName = value.organizationName || null;
                                    prereqObj.orgSourceUniqueId = value.organizationSourceUniqueID;
                                    prereqObj.businessKeyId = value.kogBusinessKeyID;
                                    prereqObj.businessKeyName = value.businessKeyName;
                                    prereqObj.businessKeyValue = value.businessKeyValue;
                                    prereqObj.businessKeyDescription = value.businessKeyDescription
                                }

                                logger.error("the prereqObj when _id is not present:::" + JSON.stringify(prereqObj))
                                rolewithPrereq.push(prereqObj);


                            });
                        }
                    } else {
                        //Error condition
                        rolewithPrereq.push({
                            roleId: null,
                            applicationId: null,
                            roleName: null
                        })
                    }

                    // BOP003: Record validation results
                    try {
                        const validRoleDetails = validEntries.map(entry => ({
                            entry: entry.entry,
                            role: entry.role,
                            application: entry.businessApp
                        }));

                        const invalidRoleDetails = invalidEntries.map(entry => ({
                            entry: entry.entry,
                            role: entry.roleName,
                            application: entry.appName,
                            error: entry.error
                        }));

                        const bop003EventDetails = {
                            totalRoles: validEntries.length + invalidEntries.length,
                            validRoles: validEntries.length,
                            invalidRoles: invalidEntries.length,
                            validRoleDetails: validRoleDetails,
                            invalidRoleDetails: invalidRoleDetails
                        };

                        auditLogger(
                            "BOP003",
                            "Bulk Operation File Validated",
                            input.auditLogger.sessionDetailsauditLogger,
                            bop003EventDetails,
                            input.payload.requesterAccountId || "",
                            requestedUserAccountId || "",
                            input.auditLogger.transactionIdauditLogger,
                            invitedUser.email || "",
                            "",
                            input.auditLogger.sessionRefIDauditLogger
                        );
                    } catch (auditError) {
                        logger.error("BOP003 Audit Logger Error: " + JSON.stringify(auditError));
                    }

                    let results = []
                    if (rolewithPrereq.length > 0) {
                        contextRequestBody.applicationRoles = rolewithPrereq
                        let createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId", contextRequestBody)
                        if (createContextIdResponse) {
                            const ContextId = createContextIdResponse._id
                            var uniqueAppNamesArr = [];
                            var roleNamesHtml = '<ul style="padding-left:20px; margin:5px 0; text-align:left;">';
                            rolewithPrereq.forEach((rp, index) => {
                                results.push({
                                    entry: index + 1,
                                    appName: rp.applicationName,
                                    roleName: rp.roleName,
                                    type: "CONTEXT",
                                    id: ContextId,
                                    status: "SUCCESS"
                                })
                              roleNamesHtml += '<li style="margin:2px 0; font-size:10pt; color:#5e5e5e; font-family:Arial, Verdana, Helvetica;">' + rp.roleName + '</li>';
                              uniqueAppNamesArr.push(rp.applicationName);
                            })
                            roleNamesHtml += '</ul>';
                              let requesterFirstName = "";
                              let requesterLastName = "";
                              
                              if (input.payload.requesterAccountId) {
                                  const requesterUser = searchObjectByIdAttributeValue(
                                      input,
                                      "managed/alpha_user",
                                      "_id",
                                      input.payload.requesterAccountId
                                  );
                              
                                  if (requesterUser) {
                                      requesterFirstName = requesterUser.givenName || "";
                                      requesterLastName = requesterUser.sn || "";
                                  }
                              }
                              
                            const requesterFullName = requesterFirstName + " " + requesterLastName;
                            var applicationNameshtml = uniqueAppNamesArr.join(", ");
                             
                            sendEmail(ContextId, invitedUser.firstName, invitedUser.lastName, invitedUser.email, isUserExist, applicationNameshtml, requesterFullName,roleNamesHtml)
                        } else {
                            rolewithPrereq.forEach((rp, index) => {
                                results.push({
                                    entry: index + 1,
                                    appName: rp.applicationName,
                                    roleName: rp.roleName,
                                    type: "CONTEXT",
                                    id: null,
                                    status: "FAILURE"
                                })
                            })
                        }
                    }

                    // Create Enrollment Request if roles present
                    logger.error("enrollmentReqTemplate is: " + JSON.stringify(enrollmentReqTemplate))
                    if (enrollmentReqTemplate.roleContext.length > 0) {
                        logger.error("Create Enrollment Request as roles are present")
                        let createEnrollmentRequestResponse = createRecord("alpha_kyid_enrollment_request", enrollmentReqTemplate)
                        if (createEnrollmentRequestResponse) {
                            const RequestId = createEnrollmentRequestResponse._id

                            enrollmentReqTemplate.roleContext.forEach((rc, index) => {
                                results.push({
                                    entry: index + 1,
                                    appName: rc.appName,
                                    roleName: rc.roleName,
                                    type: "REQUEST",
                                    id: RequestId,
                                    status: "SUCCESS"
                                })
                            })

                            const accessResponse = invokeRoleAccess(requestedUserAccountId, RequestId)
                            if (!accessResponse || accessResponse.status !== "success") {
                                logger.error("Access provisioning failed or invalid response")
                            }
                        } else {
                            enrollmentReqTemplate.roleContext.forEach((rc, index) => {
                                results.push({
                                    entry: index + 1,
                                    appName: rc.appName,
                                    roleName: rc.roleName,
                                    type: "REQUEST",
                                    id: null,
                                    status: "FAILURE"
                                })
                            })
                        }
                    }
                    let finalResults = results.concat(invalidEntries);
                    logger.error("finalResults is: " + JSON.stringify(finalResults))

                    // Prepare role details for audit logging
                    const roleDetails = finalResults.map(result => ({
                        entry: result.entry,
                        role: result.roleName,
                        application: result.appName,
                        type: result.type || "",
                        id: result.id || null,
                        status: result.status,
                        error: result.error || undefined
                    }));

                    const successCount = finalResults.filter(r => r.status === "SUCCESS").length;
                    const failureCount = finalResults.filter(r => r.status === "FAILURE").length;

                    if (finalResults.length > 0 && invalidEntries.length === 0) {
                        logger.error("all records successful")

                        // BOP001: All successful
                        try {
                            const bop001EventDetails = {
                                totalRoles: finalResults.length,
                                successRoles: successCount,
                                failedRoles: 0,
                                roleDetails: roleDetails
                            };

                            auditLogger(
                                "BOP001",
                                "Bulk Operation File Uploaded",
                                input.auditLogger.sessionDetailsauditLogger,
                                bop001EventDetails,
                                input.payload.requesterAccountId || "",
                                requestedUserAccountId || "",
                                input.auditLogger.transactionIdauditLogger,
                                invitedUser.email || "",
                                "",
                                input.auditLogger.sessionRefIDauditLogger
                            );
                        } catch (auditError) {
                            logger.error("BOP001 Audit Logger Error: " + JSON.stringify(auditError));
                        }

                        return {
                            results: finalResults
                        };
                    } else if (finalResults.length > 0 && invalidEntries.length > 0) {
                        logger.error("partial records successful")

                        // BOP002: Partial failure
                        try {
                            let bop002EventDetails = {
                                totalRoles: finalResults.length,
                                successRoles: successCount,
                                failedRoles: failureCount,
                                roleDetails: roleDetails
                            };

                            auditLogger(
                                "BOP002",
                                "Bulk Operation File Upload Failure",
                                input.auditLogger.sessionDetailsauditLogger,
                                bop002EventDetails,
                                input.payload.requesterAccountId || "",
                                requestedUserAccountId || "",
                                input.auditLogger.transactionIdauditLogger,
                                invitedUser.email || "",
                                "",
                                input.auditLogger.sessionRefIDauditLogger
                            );
                        } catch (auditError) {
                            logger.error("BOP002 Audit Logger Error: " + JSON.stringify(auditError));
                        }

                        return {
                            results: finalResults
                        };
                    } else {
                        logger.error("all records failure")

                        // BOP002: All failure
                        try {
                            let bop002EventDetails = {
                                totalRoles: finalResults.length,
                                successRoles: 0,
                                failedRoles: failureCount,
                                roleDetails: roleDetails
                            };

                            auditLogger(
                                "BOP002",
                                "Bulk Operation File Upload Failure",
                                input.auditLogger.sessionDetailsauditLogger,
                                bop002EventDetails,
                                input.payload.requesterAccountId || "",
                                requestedUserAccountId || "",
                                input.auditLogger.transactionIdauditLogger,
                                invitedUser.email || "",
                                "",
                                input.auditLogger.sessionRefIDauditLogger
                            );
                        } catch (auditError) {
                            logger.error("BOP002 Audit Logger Error: " + JSON.stringify(auditError));
                        }

                        return {
                            results: finalResults
                        };
                    }

                } else {
                    // Invalid request: internal user
                    logger.error("Invalid request - Internal User")
                    invalidRequestException.message.content = "Invalid request. The request contains an Internal User, only External Users are allowed"
                    invalidRequestException.timestamp = new Date().toISOString()
                    throw invalidRequestException
                }
            } else {
                // Invalid request: missing requestedUser
                logger.error("Invalid request - Missing payload.requestedUser")
                invalidRequestException.message.content = "Invalid request. The request does not contain the required parameters. Missing parameter(s): \"payload\""
                invalidRequestException.timestamp = new Date().toISOString()
                throw invalidRequestException
            }
        }
    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)

        // BOP002: Exception handling
        try {
            let bop002EventDetails = {
                error: `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
            };

            auditLogger(
                "BOP002",
                "Bulk Operation File Upload Failure",
                input.auditLogger.sessionDetailsauditLogger,
                bop002EventDetails,
                input.payload.requesterAccountId || "",
                input.payload.requestedUser ? input.payload.requestedUser.accountId : "",
                input.auditLogger.transactionIdauditLogger,
                input.payload.requestedUser ? input.payload.requestedUser.email : "",
                "",
                input.auditLogger.sessionRefIDauditLogger
            );
        } catch (auditError) {
            logger.error("BOP002 Audit Logger Error in catch block: " + JSON.stringify(auditError));
        }

        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}

/**
 * Get audit logger context variables with error handling
 * @returns {Object} Object containing transactionId, sessionRefId, and sessionDetails
 */
function getAuditLoggerContext() {
    let transactionIdauditLogger = "";
    let sessionRefIDauditLogger = "";
    let sessionDetailsauditLogger = {};

    try {
        transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value
            ? context.transactionId.transactionId.value
            : "";
    } catch (e) {
        logger.error("Failed to get transactionId from context: " + e);
    }

    try {
        sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
    } catch (e) {
        logger.error("Failed to get sessionRefId from context: " + e);
    }

    try {
        sessionDetailsauditLogger = sessionRefIDauditLogger
            ? {"sessionRefId": sessionRefIDauditLogger}
            : {};
    } catch (e) {
        logger.error("Failed to get sessionDetails from context: " + e);
    }

    return {
        transactionIdauditLogger: transactionIdauditLogger,
        sessionRefIDauditLogger: sessionRefIDauditLogger,
        sessionDetailsauditLogger: sessionDetailsauditLogger
    };
}

function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
    try {
        logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();

        //Defect Fix# 211192 (Unknown Location) - 03/12  ----BEGIN
        sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
       sessionRefId = deepParse(sessionRefId)
       logger.error("In endpoint/bulkoperation:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))
           var city = sessionRefId.city || "";
            var state = sessionRefId.state || "";
            var country = sessionRefId.country || "";
              
            var placeParts = [];
            if (city && city !== undefined && city !== "undefined") {
              placeParts.push(city);
            }
            if (state && state !== undefined && state !== "undefined") {
              placeParts.push(state);
            }
            if (country && country !== undefined && country !== "undefined" && (country.toUpperCase() !== "US" || country.toUpperCase() !== "UNITED STATES" )) {
              placeParts.push(country);
            }
        
            logger.error("***placeParts in endpoint/bulkoperation => "+placeParts)
            var place = "";
             if(!city){
                 logger.error("city empty in event details")
                 place = "Unknown Location"
             } else{
                 logger.error("placeParts")
              place = placeParts.join(", ");
             }
         //Defect Fix# 211192 (Unknown Location) - 03/12 ----END

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
            sessionId: sessionRefId.sessionRefId || "",      //Defect Fix# 211192 (Unknown Location) - 03/12
            place: place || ""   //Defect Fix# 211192 (Unknown Location) - 03/12
            //sessionId: sessionRefId || ""
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        var sendLogstoDBandMO = identityServer.getProperty("esv.sendauditlogs.db.mo");
      if(sendLogstoDBandMO === "true"|| sendLogstoDBandMO === true){
         const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
      }

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

function addRolesToUser(roles, id) {
    try {
        let dateTimeISO = new Date().toISOString();
            let currentEpoch = Date.now();
        let patchArray = [];

        roles.forEach(function (role) {
            let patchOperation = {
                "operation": "add",
                "field": "/roles/-",
                "value": {
                    "_ref": "managed/alpha_role/" + role._id
                }
            };
             patchArray.push(patchOperation);
             patchArray.push({
                        "operation": "replace",
                        "field": "/custom_updatedDateEpoch",
                        "value": currentEpoch
                    });

                    patchArray.push({
                        "operation": "replace",
                        "field": "/custom_updatedByID",
                        "value": id
                    });

                    patchArray.push({
                        "operation": "replace",
                        "field": "/custom_updatedBy",
                        "value": "KYID-System"
                    });

                    patchArray.push({
                        "operation": "replace",
                        "field": "/custom_updatedDateISO",
                        "value": dateTimeISO
                    });
           
        });

        let patchResponse = openidm.patch("managed/alpha_user/" + id, null, patchArray);
        return patchResponse; // return actual patched user
    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}


function invokeRoleAccess(invitedUserId, requestId) {
    try {
        const requestBody = {
            "payload": {
                "requestedUserAccountId": invitedUserId,
                "enrollmentRequestId": requestId
            },
            "action": "1"
        };

        logger.error("invokeRoleAccess request body: " + JSON.stringify(requestBody));

        const response = openidm.create("endpoint/access", null, requestBody);
        logger.error("invokeRoleAccess raw response: " + JSON.stringify(response));

        if (response && response.status) {
            if (response.status === "success") {
                logger.error("invokeRoleAccess SUCCESS: " + JSON.stringify(response));
            } else {
                logger.error("invokeRoleAccess FAILED: " + JSON.stringify(response));
            }
        } else {
            logger.error("invokeRoleAccess EMPTY or invalid response.");
        }

        // Always return response, even if it's empty or failed
        return response || {};
    } catch (error) {
        logger.error("invokeRoleAccess ERROR: " + JSON.stringify(error));
        // just return error object
        return {
            error: error
        };
    }
}


function deepParse(data) {
  // If it's not a string, we can't parse it further
  if (typeof data !== 'string') {
    return data;
  }

  try {
    const parsed = JSON.parse(data);
    // If the parsed result is still a string, keep parsing
    return deepParse(parsed);
  } catch (e) {
    // If JSON.parse fails, it's a regular string, so return it
    return data;
  }
}