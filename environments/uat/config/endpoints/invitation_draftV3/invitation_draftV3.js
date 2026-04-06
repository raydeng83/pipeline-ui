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


(function() {

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
  
    logger.error("===REQUEST in invitation_draftV3=== " + JSON.stringify(request));

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

    const transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value ? context.transactionId.transactionId.value : ""
    const sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId ? context.oauth2.rawInfo.sessionRefId : ""


    const sessionDetailsauditLogger = sessionRefIDauditLogger ? {
        "sessionRefId": sessionRefIDauditLogger
    } : {}

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
        "auditLogger": {
            transactionIdauditLogger: transactionIdauditLogger,
            sessionRefIDauditLogger: sessionRefIDauditLogger,
            sessionDetailsauditLogger: sessionDetailsauditLogger
        },

        "payload": {}
    }

    let response = null
    let emailTemplateName = null
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
                    if (!input.payload.requesterAccountId) {
                        input.payload.requesterAccountId = authenticatedUserId;
                    }

                    /* Create access record. */


                    result = sendInvitationAPI(input)
                    // response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE,{
                    //       result: result
                    //   })
                    if (result.responseCode === "0") {
                        // Success response
                        response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, result.message, {
                            result: result.payload
                        });
                    } else {
                        // Failure response
                        response = generateResponse(RESPONSE_CODE_FAILURE, input.transactionId, result.message, {
                            result: result.payload
                        });
                    }
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
                        logger.error("[DELEGATION_VIEW] delegationactiveinvitationbyuser - queryFilter: " + (input.payload.queryFilter || 'N/A'));

                        // If email is provided, search by email in requestedUserAccountAttibutes directly
                        if (input.payload.email) {
                            logger.error("[DELEGATION_VIEW] Email provided: " + input.payload.email);
                            var emailCondition = '(' +
                                'requestedUserAccountAttibutes/[attributeName eq "primaryEmailAddress" AND attributeValue eq "' + input.payload.email + '"] OR ' +
                                'requestedUserAccountAttibutes/[attributeName eq "mail" AND attributeValue eq "' + input.payload.email + '"]' +
                                ')';
                            // Remove requestedUserAccountId condition from existing queryFilter and combine with email condition
                            if (input.payload.queryFilter) {
                                // Remove requestedUserAccountId eq "xxx" pattern from queryFilter
                                var cleanedFilter = input.payload.queryFilter.replace(/requestedUserAccountId eq "[^"]*"\s*(AND\s*)?/gi, '');
                                // Remove leading/trailing AND
                                cleanedFilter = cleanedFilter.replace(/^\s*AND\s*/i, '').replace(/\s*AND\s*$/i, '');
                                if (cleanedFilter) {
                                    input.payload.queryFilter = emailCondition + ' AND ' + cleanedFilter;
                                } else {
                                    input.payload.queryFilter = emailCondition + ' AND status eq "0" AND (recordState eq "0" or recordState eq "ACTIVE")';
                                }
                            } else {
                                input.payload.queryFilter = emailCondition + ' AND status eq "0" AND (recordState eq "0" or recordState eq "ACTIVE")';
                            }
                            logger.error("[DELEGATION_VIEW] Using requestedUserAccountAttibutes queryFilter: " + input.payload.queryFilter);
                        }

                        searchResponse = searchInvitationQuery(input);
                        logger.error("[DELEGATION_VIEW] searchResponse resultCount: " + (searchResponse && searchResponse.resultCount !== undefined ? searchResponse.resultCount : 'N/A'));
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

//Mock Response 

function generateMockResponse() {
    try {
        const mockJSON = {
            "invitations": [{
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
                    "roles": [{
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
                    "roles": [{
                        "roleName": {
                            "en": "Editor",
                            "es": "Editor"
                        },
                        "tag": {
                            "en": "Active",
                            "es": "Activo"
                        }
                    }]
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
                    "roles": [{
                        "roleName": {
                            "en": "Contributor",
                            "es": "Colaborador"
                        },
                        "tag": {
                            "en": "Inactive",
                            "es": "Inactivo"
                        }
                    }]
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
        roleNames = {
            en: role.name,
            es: role.name
        };
    }
    if (Object.keys(roleDescriptions).length === 0 && role.description) {
        roleDescriptions = {
            en: role.description,
            es: role.description
        };
    }

    // Get business application details
    var businessApp = null;
    if (role.businessAppId && role.businessAppId._refResourceId) {
        businessApp = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
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
                    if (tagObj.name) {
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

    // Get access policy details
    var accessPolicy = null;
    if (role.accessPolicy && role.accessPolicy._refResourceId) {
        accessPolicy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
    }

    // Get prerequisites from access policy
    var prerequisites = [];
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

    var roleDetails = {
        roleDisplayName: roleNames,
        roleDisplayDescription: roleDescriptions,
        tagNames: tagNames,
        businessAppName: businessApp ? businessApp.name : null,
        associatedPreReqs: prerequisites,
        isDelegable: role.isDelegable,
        isForwardDelegable: role.isForwardDelegable
    };

    // Build response object
    var response = {
        "data": roleDetails
    }


    return response;


}

/**
 * @name searchInvitationQuery
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function searchInvitationQuery(input) {

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
        logger.error("the searchInvitationQuery 1: " + JSON.stringify(input.payload))
        /* Check if  */
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter

            if (queryFilter) {
                logDebug(input.transactionId, input.endPoint, "searchAccount", `Search filter: ${queryFilter}`)
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`, {
                        "_queryFilter": queryFilter
                    },
                    returnProperties
                )
                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Raw search response: ${JSON.stringify(searchResponse)}`)
                    return searchResponse

                    // Le: Add check to exclude expired invitations
                    // if (input.excludeExpiredInvitation) {
                    // if (!input.payload.view) {
                        // if (searchResponse.result.length > 0) {
                        //     var invitationList = searchResponse.result
                        //     for (let i = invitationList.length; i >= 0; i--) { // loop backward to avoid list index shift issue
                        //         if (invitationList[i].expiryDateEpoch && Number(invitationList[i].expiryDateEpoch) <= Date.now()) {
                        //             invitationList.splice(i, 1)
                        //         }
                        //     }
                        // }
                    // }

                    // logger.error("invitation_draftV3 searchResponse: " + searchResponse)

                    // if (searchResponse.result.length == 0) {
                    //   return []
                    // } else {
                    //   return searchResponse
                    // }

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

function helpdeskactiveinvitationbyUser(input) {
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
            logger.error("going inside helpdeskactiveinvitationbyUser")
            const searchResponse = input.searchResponse;
            const invitations = [];

            if (searchResponse && searchResponse.result) {
                logger.error("going inside searchResponse helpdeskactiveinvitationbyUser")
                searchResponse.result.forEach(function(entry) {

                    if (!entry.requestedUserAccountAttibutes || entry.requestedUserAccountAttibutes.length === 0) {
                        return;
                    }
                    entry.applicationRoles.forEach(function(role) {
                        var appId = role.applicationId;

                        if (entry.status === "ACTIVE" || entry.status === "0") {
                            var statusEn = null;
                            var statusEs = null;
                            if (entry.status === "ACTIVE" || entry.status === "0") {
                                statusEn = "Active";
                                statusEs = "Activo";
                            }
                            //             else {
                            //                 statusEn = "Pending";
                            //                 statusEs = "Pendiente";
                            //             }
                            // }

                            var invitation = {
                                invitationId: entry._id,
                                applicationLogo: null,
                                applicationName: null,
                                applicationDisplayName: {
                                    "en": "",
                                    "es": ""
                                },
                                status: {
                                    en: statusEn,
                                    es: statusEs
                                },
                                invitedBy: null,
                                invitationDate: entry.createDate ? entry.createDate.split("T")[0] : null,
                                invitationExpiryDate: entry.expiryDate ? entry.expiryDate.split("T")[0] : null,
                                roles: []
                            };


                            // Fetch invitedBy info
                            if (entry.requesterUserAccountId) {
                                var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                if (inviter) {
                                    var fullName = [];
                                    if (inviter.givenName) {
                                        fullName.push(inviter.givenName);
                                    }
                                    if (inviter.sn) {
                                        fullName.push(inviter.sn);
                                    }
                                    invitation.invitedBy = fullName.join(" ");
                                }
                            }

                            // Fetch app info
                            var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                            if (appInfo) {
                                if (appInfo.logoFileName) {
                                    invitation.applicationLogo = appInfo.logoFileName;
                                }
                                if (appInfo.content && appInfo.content[0].title && appInfo.content[0].title.en) {
                                    invitation.applicationDisplayName = appInfo.content[0].title
                                    invitation.applicationName = appInfo.content[0].title.en;

                                } else {
                                    invitation.applicationName = appInfo.name
                                }
                            }

                            // Fetch role info
                            var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                            if (roleInfo) {
                                var roleEntry = {
                                    roleId: role.roleId,
                                    roleName: {
                                        en: null,
                                        es: null
                                    },
                                    tagName: []
                                };

                                if (roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                                    roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                    roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                                }

                                // Fetch tag info - Loop through all tags
                                if (Array.isArray(roleInfo.tags)) {
                                    roleInfo.tags.forEach(function(tagRef) {
                                        if (tagRef && tagRef._refResourceId) {
                                            var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                            if (tagInfo && Array.isArray(tagInfo.localizedContent) && tagInfo.localizedContent[0]) {
                                                var localizedTag = tagInfo.localizedContent[0];
                                                var tagObj = {
                                                    en: (localizedTag.displayTitle && localizedTag.displayTitle.en) || null,
                                                    es: (localizedTag.displayTitle && localizedTag.displayTitle.es) || null
                                                };
                                                roleEntry.tagName.push(tagObj);
                                            }
                                        }
                                    });
                                }

                                invitation.roles.push(roleEntry);
                            }

                            invitations.push(invitation);
                        }
                    });
                });

                //return { data: { activeInvitations: invitations } };
                return {
                    data: invitations
                };
            } else {
                //return { data: { activeInvitations: [] } };
                return {
                    data: []
                };
            }
        } else {
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "Unexpected error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function helpdeskmanageinvitationbyapp(input) {
    logger.error("going inside helpdeskmanageinvitationbyapp")
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
            logger.error("going inside helpdeskmanageinvitationbyapp1")
            const searchResponse = input.searchResponse;
            const invitations = [];

            let appId = null;
            if (input.payload.queryFilter && typeof input.payload.queryFilter === "string") {
                const appIdMatch = input.payload.queryFilter.match(/applicationRoles\/\[applicationId eq "([^"]+)"\]/);
                if (appIdMatch && appIdMatch[1]) {
                    appId = appIdMatch[1];
                }
            }

            if (!appId) {
                invalidRequestException.message.content = 'Invalid request. Could not extract "appId" from queryFilter.';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }

            if (searchResponse && searchResponse.result) {
                logger.error("the searchresponse in helpdeskmanageinvitationbyapp : " + JSON.stringify(searchResponse))
                searchResponse.result.forEach(entry => {

                    if (!entry.requestedUserAccountAttibutes || entry.requestedUserAccountAttibutes.length === 0) {
                        return;
                    }

                    const fullName = [];
                    let firstName = "";
                    let lastName = "";
                    let email = "";

                    if (entry.requestedUserAccountId) {
                        const user = getMORecord(entry.requestedUserAccountId, ["*"], "alpha_user");
                        if (user) {
                            firstName = user.givenName || "";
                            lastName = user.sn || "";
                            email = user.mail || "";
                        }
                    } else {
                        logger.error("ntry.requestedUserAccountAttibutes.forEach" + entry.requestedUserAccountAttibutes)
                        entry.requestedUserAccountAttibutes.forEach(val => {
                            if ((val.attributeName === "legalFirstName" || val.attributeName === "givenName") && val.attributeValue !== null) {
                                firstName = val.attributeValue
                            }
                            if ((val.attributeName === "legalLastName" || val.attributeName === "sn") && val.attributeValue !== null) {
                                lastName = val.attributeValue
                            }
                            if ((val.attributeName === "primaryEmailAddress" || val.attributeName === "mail") && val.attributeValue !== null) {
                                email = val.attributeValue
                            }
                        })
                        logger.error("firstName is --> " + firstName)
                        logger.error("lastName is --> " + lastName)
                        logger.error("email is --> " + email)
                    }

                    let statusEn = "";
                    let statusEs = "";
                    if (entry.status === "ACTIVE" || entry.status === "0") {
                        statusEn = "Active";
                        statusEs = "Activo";
                    } else {
                        statusEn = "Expired";
                        statusEs = "Expirado";
                    }

                    const invitedByName = {
                        en: "",
                        es: ""
                    };

                    if (entry.requesterUserAccountId) {
                        var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                        if (inviter) {

                            if (inviter.givenName) {
                                fullName.push(inviter.givenName);
                            }
                            if (inviter.sn) {
                                fullName.push(inviter.sn);
                            }
                            const nameStr = fullName.join(" ");
                            invitedByName.en = nameStr;
                            invitedByName.es = nameStr;
                        }
                    }

                    const roles = [];
                    entry.applicationRoles.forEach(role => {
                        if (role.applicationId === appId) {
                            const roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                            const roleObj = {
                                role: {
                                    en: "",
                                    es: ""
                                },
                                roleid: role.roleId,
                                tag: [], // Role can have multiple tag
                                // Business Key fields from enrollment_contextId.applicationRoles
                                businessKeyTypeName: role.businessKeyTypeName || "",
                                businessKeyId: role.businessKeyId || "",
                                businessKeyName: role.businessKeyName || "",
                                businessKeyDescription: role.businessKeyDescription || "",
                                // Org fields from enrollment_contextId.applicationRoles
                                orgId: role.orgId || "",
                                orgType: role.orgType || "",
                                orgName: role.orgName || "",
                                orgSourceUniqueId: role.orgSourceUniqueId || "",
                                // KOG Business Key ID
                                kogOrgBusinessKeyId: role.kogOrgBusinessKeyId || ""
                            };

                            if (roleInfo && roleInfo.content && Array.isArray(roleInfo.content) && roleInfo.content[0] && roleInfo.content[0].name) {
                                roleObj.role.en = roleInfo.content[0].name.en || "";
                                roleObj.role.es = roleInfo.content[0].name.es || "";
                            }



                            // Handle tags as relationship array
                            if (roleInfo && Array.isArray(roleInfo.tags)) {

                                roleInfo.tags.forEach(tagRel => {
                                    if (tagRel && tagRel._refResourceId) {
                                        logger.error("the tag info:" + tagRel._refResourceId)
                                        const tagInfo = getMORecord(tagRel._refResourceId, ["*"], "alpha_kyid_tag");
                                        logger.error("the tag json info:" + JSON.stringify(tagInfo))
                                        if (
                                            tagInfo &&
                                            Array.isArray(tagInfo.localizedContent) &&
                                            tagInfo.localizedContent[0]
                                        ) {

                                            const displayTitle = tagInfo.localizedContent[0].displayTitle || {};
                                            const tagEntry = {
                                                en: displayTitle.en || "",
                                                es: displayTitle.es || ""
                                            };
                                            roleObj.tag.push(tagEntry);
                                        }
                                    }
                                });
                            }

                            roles.push(roleObj);
                        }
                    });

                    var invitationDate = null;
                    if (entry.createDate && typeof entry.createDate === "string") {
                        invitationDate = entry.createDate.split("T")[0];
                    }

                    var invitationExpiryDate = null;
                    if (entry.expiryDate && typeof entry.expiryDate === "string") {
                        invitationExpiryDate = entry.expiryDate.split("T")[0];
                    }

                    const invitationObj = {
                        id: entry.requestedUserAccountId,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        status: {
                            en: statusEn,
                            es: statusEs
                        },
                        invitationDetails: {
                            invitedBy: invitedByName,
                            invitationDate: invitationDate,
                            invitationExpiryDate: invitationExpiryDate,
                            invitationID: entry._id
                        },
                        roles: roles
                    };

                    invitations.push(invitationObj);
                });
                logger.error("invitations is --> " + JSON.stringify(invitations))

                return {
                    data: invitations
                };
            } else {
                return {
                    data: []
                };
            }
        } else {
            invalidRequestException.message.content = 'Missing required parameters.';
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occurred. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function delegationactiveinvitationbyuser(input) {
    logger.error("[DELEGATION_FUNC] delegationactiveinvitationbyuser called - resultCount: " +
        (input.searchResponse && input.searchResponse.resultCount !== undefined ? input.searchResponse.resultCount : 'N/A'));

    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
            logger.error("[DELEGATION_FUNC] Validation passed, processing searchResponse")
            const searchResponse = input.searchResponse;
            const invitations = [];

            if (searchResponse && searchResponse.result) {
                logger.error("[DELEGATION_FUNC] Processing " + searchResponse.result.length + " entries")
                var processedCount = 0;
                var skippedByStatusCount = 0;
                searchResponse.result.forEach(function(entry) {
                    logger.error("[DELEGATION_FUNC] Processing entry: " + entry._id + ", status: " + entry.status + ", roles: " + (entry.applicationRoles ? entry.applicationRoles.length : 0));

                    if (entry.status === "ACTIVE" || entry.status === "0") {
                        processedCount++;
                        var statusEn = null;
                        var statusEs = null;
                        if (entry.status === "ACTIVE" || entry.status === "0") {
                            statusEn = "Active";
                            statusEs = "Activo";
                        }

                        // Use first role's app info for backward compatibility
                        var firstAppId = entry.applicationRoles[0] ? entry.applicationRoles[0].applicationId : null;
                        var firstAppInfo = firstAppId ? getMORecord(firstAppId, ["*"], "alpha_kyid_businessapplication") : null;

                        var invitation = {
                            invitationId: entry._id,
                            applicationLogo: firstAppInfo ? firstAppInfo.logoFileName : null,
                            applicationName: firstAppInfo ? firstAppInfo.name : null,
                            status: {
                                en: statusEn,
                                es: statusEs
                            },
                            invitedBy: null,
                            invitationDate: entry.createDate ? entry.createDate.split("T")[0] : null,
                            invitationExpiryDate: entry.expiryDate ? entry.expiryDate.split("T")[0] : null,
                            roles: []
                        };


                        // Fetch invitedBy info
                        if (entry.requesterUserAccountId) {
                            var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                            if (inviter) {
                                var fullName = [];
                                if (inviter.givenName) {
                                    fullName.push(inviter.givenName);
                                }
                                if (inviter.sn) {
                                    fullName.push(inviter.sn);
                                }
                                invitation.invitedBy = fullName.join(" ");
                            }
                        }

                        // Process all roles for this invitation
                        entry.applicationRoles.forEach(function(role) {
                            var appId = role.applicationId;

                            // Fetch app info
                            var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");

                            // Fetch role info
                            var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                            if (roleInfo) {
                                var roleEntry = {
                                    roleId: role.roleId,
                                    applicationId: appId,
                                    applicationName: appInfo ? appInfo.name : null,
                                    roleName: {
                                        en: null,
                                        es: null
                                    },
                                    tagName: []
                                };

                                if (roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                                    roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                    roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                                }

                                // Fetch tag info
                                if (roleInfo && Array.isArray(roleInfo.tags)) {
                                    roleInfo.tags.forEach(tagRel => {
                                        if (tagRel && tagRel._refResourceId) {
                                            // logger.error("The tag reference ID: " + tagRel._refResourceId);  
                                            const tagInfo = getMORecord(tagRel._refResourceId, ["*"], "alpha_kyid_tag");
                                            //logger.error("The tag JSON info: " + JSON.stringify(tagInfo));  

                                            if (
                                                tagInfo &&
                                                Array.isArray(tagInfo.localizedContent) &&
                                                tagInfo.localizedContent.length > 0
                                            ) {
                                                const displayTitle = tagInfo.localizedContent[0].displayTitle || {};

                                                // Create a tag entry for the role entry object
                                                const tagEntry = {
                                                    en: displayTitle.en || "",
                                                    es: displayTitle.es || ""
                                                };
                                                roleEntry.tagName.push(tagEntry);
                                            }
                                        }
                                    });
                                }

                                invitation.roles.push(roleEntry);
                            }
                        });

                        invitations.push(invitation);
                    } else {
                        skippedByStatusCount++;
                    }
                });

                logger.error("[DELEGATION_FUNC] Processing complete - processed: " + processedCount + ", skipped by status: " + skippedByStatusCount + ", final invitations: " + invitations.length);
                //return { data: { activeInvitations: invitations } };
                return {
                    data: invitations
                };
            } else {
                logger.error("[DELEGATION_FUNC] searchResponse.result is empty or null - returning empty array");
                //return { data: { activeInvitations: [] } };
                return {
                    data: []
                };
            }
        } else {
            logger.error("[DELEGATION_FUNC] Validation failed - missing required parameters");
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        logger.error("[DELEGATION_FUNC] Exception caught: " + JSON.stringify(getException(error)));
        unexpectedException.message.content = "Unexpected error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}

function delegationmanageinvitationbydelegator(input) {
    logger.error("going inside delegationmanageinvitationbydelegator")
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };



    try {
        if (input.payload && input._MO_OBJECT_NAME && input.searchResponse) {
            logger.error("inputpayload" + input.payload)
            logger.error("searchResponse:::" + input.searchResponse)
            const searchResponse = input.searchResponse;
            const invitationsMap = {};

            if (searchResponse && searchResponse.result) {
                searchResponse.result.forEach(function(entry) {

                    if (!entry.requestedUserAccountAttibutes || entry.requestedUserAccountAttibutes.length === 0) {
                        return;
                    }
                    entry.applicationRoles.forEach(function(role) {
                        const appId = role.applicationId;

                        // --- Status mapping ---
                        var statusEn = null;
                        var statusEs = null;

                        // Check if invitation is expired
                        var isExpired = false;
                        if (entry.expiryDate) {
                            var expiryDateEpoch = new Date(entry.expiryDate).getTime();
                            if (currentDateEpoch > expiryDateEpoch) {
                                isExpired = true;
                            }
                        }

                        if (isExpired) {
                            statusEn = "Expired";
                            statusEs = "Expirado";
                        } else if (entry.status === "ACTIVE" || entry.status === "0") {
                            statusEn = "Active";
                            statusEs = "Activo";
                        } else {
                            statusEn = entry.status || "Unknown";
                            statusEs = entry.status || "Desconocido";
                        }

                        // --- Requested user info ---
                        var firstName = "";
                        var lastName = "";
                        var email = "";
                        if (entry.requestedUserAccountId) {
                            var user = getMORecord(entry.requestedUserAccountId, ["*"], "alpha_user");
                            if (user) {
                                logger.error("user found in alpha_user:" + JSON.stringify(user))
                                if (user.givenName) {
                                    firstName = user.givenName;
                                }
                                if (user.sn) {
                                    lastName = user.sn;
                                }
                                if (user.mail) {
                                    email = user.mail;
                                }
                            }
                        } else if (entry.requestedUserAccountAttibutes && Array.isArray(entry.requestedUserAccountAttibutes)) {
                            entry.requestedUserAccountAttibutes.forEach(function(attr) {
                                if ((attr.attributeName === "legalFirstName" || attr.attributeName === "givenName") && attr.attributeValue) {
                                    firstName = attr.attributeValue;
                                }
                                if ((attr.attributeName === "legalLastName" || attr.attributeName === "sn") && attr.attributeValue) {
                                    lastName = attr.attributeValue;
                                }
                                if ((attr.attributeName === "primaryEmailAddress" || attr.attributeName === "mail") && attr.attributeValue) {
                                    email = attr.attributeValue;
                                }
                            });
                        }

                        // --- Build / fetch invitation object ---
                        if (!invitationsMap[entry._id]) {
                            invitationsMap[entry._id] = {
                                invitationId: entry._id,
                                id: entry.requestedUserAccountId,
                                firstName: firstName,
                                lastName: lastName,
                                email: email,
                                // applicationLogo: null,
                                // applicationName: null,
                                status: {
                                    en: statusEn,
                                    es: statusEs
                                },
                                invitedBy: null,
                                invitationDate: null,
                                invitationExpiryDate: null,
                                approles: []
                            };

                            if (entry.createDate) {
                                invitationsMap[entry._id].invitationDate = entry.createDate.split("T")[0];
                            }
                            if (entry.expiryDate) {
                                invitationsMap[entry._id].invitationExpiryDate = entry.expiryDate.split("T")[0];
                            }

                            // Invited By
                            if (entry.requesterUserAccountId) {
                                var inviter = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");
                                if (inviter) {
                                    var fullName = [];
                                    if (inviter.givenName) {
                                        fullName.push(inviter.givenName);
                                    }
                                    if (inviter.sn) {
                                        fullName.push(inviter.sn);
                                    }
                                    invitationsMap[entry._id].invitedBy = fullName.join(" ");
                                }
                            }
                        }

                        // --- Application info ---
                        var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                        var appObj = {
                            applicationLogo: null,
                            applicationName: null
                        };
                        if (appInfo) {
                            if (appInfo.logoFileName) {
                                appObj.applicationLogo = appInfo.logoFileName;
                            }
                            if (appInfo.name) {
                                appObj.applicationName = appInfo.name;
                            }
                        }

                        // --- Role info ---
                        var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                        var roleEntry = {
                            roleId: role.roleId,
                            roleName: {
                                en: null,
                                es: null
                            },
                            tagName: []
                        };

                        if (roleInfo && roleInfo.content && roleInfo.content.length > 0 && roleInfo.content[0].name) {
                            if (roleInfo.content[0].name.en) {
                                roleEntry.roleName.en = roleInfo.content[0].name.en;
                            }
                            if (roleInfo.content[0].name.es) {
                                roleEntry.roleName.es = roleInfo.content[0].name.es;
                            }
                        }

                        if (roleInfo && roleInfo.tags) {
                            roleInfo.tags.forEach(function(tagRef) {
                                if (tagRef && tagRef._refResourceId) {
                                    var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                    if (tagInfo && tagInfo.localizedContent && tagInfo.localizedContent.length > 0) {
                                        var localizedTag = tagInfo.localizedContent[0];
                                        var tagObj = {
                                            en: null,
                                            es: null
                                        };
                                        if (localizedTag.displayTitle && localizedTag.displayTitle.en) {
                                            tagObj.en = localizedTag.displayTitle.en;
                                        }
                                        if (localizedTag.displayTitle && localizedTag.displayTitle.es) {
                                            tagObj.es = localizedTag.displayTitle.es;
                                        }
                                        roleEntry.tagName.push(tagObj);
                                    }
                                }
                            });
                        }

                        // --- Push app-role entry ---
                        invitationsMap[entry._id].approles.push({
                            app: appObj,
                            role: roleEntry
                        });
                    });
                });

                // Convert map → array
                var invitations = [];
                for (var key in invitationsMap) {
                    invitations.push(invitationsMap[key]);
                }
                return {
                    data: invitations
                };
            } else {
                return {
                    data: []
                };
            }
        } else {
            invalidRequestException.message.content = "Missing required parameters.";
            invalidRequestException.timestamp = new Date().toISOString();
            throw invalidRequestException;
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occurred. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
    }
}


function searchHelpDeskActiveInvitation(input) {
    const currentDateEpoch = Date.now();
    const EXCEPTION_UNEXPECTED_ERROR = {
        code: "KYID-EUE",
        content: ""
    };
    const EXCEPTION_INVALID_REQUEST = {
        code: "KYID-IRE",
        content: ""
    };

    const invalidRequestException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_INVALID_REQUEST.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/searchInvitation",
        "timestamp": ""
    };

    try {
        logDebug(input.transactionId, input.endPoint, "searchAccount", "Input parameter: " + JSON.stringify(input.payload));

        if (input.payload) {
            const returnProperties = input.payload.returnProperties;

            var appId = null;
            if (input.payload.queryFilter && typeof input.payload.queryFilter === "string") {
                var appIdMatch = input.payload.queryFilter.match(/applicationRoles\/\[applicationId eq "([^"]+)"\]/);
                if (appIdMatch && appIdMatch.length > 1) {
                    appId = appIdMatch[1];
                }
            }

            if (!appId) {
                invalidRequestException.message.content = 'Invalid request. Could not extract "appId" from queryFilter.';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }

            if (input._MO_OBJECT_NAME && input.searchResponse) {
                logDebug(input.transactionId, input.endPoint, "searchAccount", "Search filter: " + input.searchResponse);

                const searchResponse = input.searchResponse;

                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", "Response: " + JSON.stringify(searchResponse));

                    if (searchResponse.result) {
                        const invitations = [];

                        searchResponse.result.forEach(function(entry) {

                            //only show the ones which has requestedUserAccountAttibutes
                            if (!entry.requestedUserAccountAttibutes || entry.requestedUserAccountAttibutes.length === 0) {
                                return;
                            }

                            //Show only the active ones. Rest skip
                            if (!(entry.status === "ACTIVE" || entry.status === "0")) {
                                return; // skip this entry
                            }

                            var grouped = {};
                            entry.applicationRoles.forEach(function(role) {
                                if (!grouped[appId]) {
                                    // Prepare invitationDate
                                    var invitationDate = null;
                                    if (entry.createDate && typeof entry.createDate === "string") {
                                        invitationDate = entry.createDate.split("T")[0];
                                    }

                                    // Prepare invitationExpiryDate
                                    var invitationExpiryDate = null;
                                    if (entry.expiryDate && typeof entry.expiryDate === "string") {
                                        invitationExpiryDate = entry.expiryDate.split("T")[0];
                                    }

                                    // Prepare status
                                    var statusEn = null;
                                    var statusEs = null;
                                    if (entry.status === "ACTIVE" || entry.status === "0") {
                                        statusEn = "Active";
                                        statusEs = "Activo";
                                    }
                                    // else {
                                    //     statusEn = "Expired";
                                    //     statusEs = "Expirado";
                                    // }

                                    grouped[appId] = {
                                        status: {
                                            en: statusEn,
                                            es: statusEs
                                        },
                                        roles: [],
                                        invitedBy: {
                                            en: null,
                                            es: null
                                        },
                                        invitationDate: invitationDate,
                                        invitationExpiryDate: invitationExpiryDate,
                                        invitationID: entry._id,
                                        id: entry.requestedUserAccountId
                                    };
                                }

                                // Set invitedBy info (full name)
                                if (entry.requesterUserAccountId) {
                                    logger.error("searchHelpDeskActiveInvitation :: Attempting to read requesterUserAccountId: " + entry.requesterUserAccountId);
                                    var invitedByInfo = getMORecord(entry.requesterUserAccountId, ["*"], "alpha_user");

                                    if (invitedByInfo) {
                                        logger.error("searchHelpDeskActiveInvitation :: invitedByInfo._id = " + invitedByInfo._id);
                                        if (invitedByInfo._id) {
                                            grouped[appId].id = invitedByInfo._id; // id of the requester
                                        }

                                        var en = invitedByInfo.givenName + " " + invitedByInfo.sn
                                        var es = invitedByInfo.givenName + " " + invitedByInfo.sn
                                        grouped[appId].invitedBy.en = en;
                                        grouped[appId].invitedBy.es = es;
                                    } else {
                                        logger.error("searchHelpDeskActiveInvitation :: invitedByInfo is NULL for requesterUserAccountId: " + entry.requesterUserAccountId);
                                        // Set default values when invitedByInfo is null
                                        grouped[appId].invitedBy.en = null;
                                        grouped[appId].invitedBy.es = null;
                                    }
                                } else {
                                    logger.error("searchHelpDeskActiveInvitation :: entry.requesterUserAccountId is NULL or undefined");
                                }

                                // Set application info
                                logger.error("searchHelpDeskActiveInvitation :: Attempting to read appId: " + appId);
                                var appInfo = getMORecord(appId, ["*"], "alpha_kyid_businessapplication");
                                if (!appInfo) {
                                    logger.error("searchHelpDeskActiveInvitation :: appInfo is NULL for appId: " + appId);
                                } else {
                                    logger.error("searchHelpDeskActiveInvitation :: appInfo._id = " + appInfo._id);
                                }

                                // Process role info
                                grouped[appId].roles = grouped[appId].roles || [];

                                // Fetch role info
                                logger.error("searchHelpDeskActiveInvitation :: Attempting to read roleId: " + role.roleId);
                                var roleInfo = getMORecord(role.roleId, ["*"], "alpha_role");
                                if (!roleInfo) {
                                    logger.error("searchHelpDeskActiveInvitation :: roleInfo is NULL for roleId: " + role.roleId);
                                } else {
                                    logger.error("searchHelpDeskActiveInvitation :: roleInfo._id = " + roleInfo._id);
                                }
                                if (roleInfo) {
                                    var roleEntry = {
                                        roleId: role.roleId,
                                        roleName: {
                                            en: null,
                                            es: null
                                        },
                                        tagName: [] // now an array
                                    };

                                    // Set role name (localized)
                                    if (roleInfo.content && Array.isArray(roleInfo.content) && roleInfo.content[0] && roleInfo.content[0].name) {
                                        roleEntry.roleName.en = roleInfo.content[0].name.en || null;
                                        roleEntry.roleName.es = roleInfo.content[0].name.es || null;
                                    }

                                    // Loop through all tags
                                    if (Array.isArray(roleInfo.tags)) {
                                        roleInfo.tags.forEach(function(tagRef) {
                                            if (tagRef && tagRef._refResourceId) {
                                                var tagInfo = getMORecord(tagRef._refResourceId, ["*"], "alpha_kyid_tag");
                                                if (tagInfo && Array.isArray(tagInfo.localizedContent) && tagInfo.localizedContent[0]) {
                                                    var localizedTag = tagInfo.localizedContent[0];
                                                    var tagObj = {
                                                        en: (localizedTag.displayTitle && localizedTag.displayTitle.en) || null,
                                                        es: (localizedTag.displayTitle && localizedTag.displayTitle.es) || null
                                                    };
                                                    roleEntry.tagName.push(tagObj);
                                                }
                                            }
                                        });
                                    }

                                    // Push role entry to roles array
                                    grouped[appId].roles.push(roleEntry);
                                }



                            });

                            // Add all grouped invites to invitations list
                            var groupedValues = Object.values(grouped);
                            for (var i = 0; i < groupedValues.length; i++) {
                                invitations.push(groupedValues[i]);
                            }
                        });

                        //return { "invitations": invitations };

                        return {
                            data: invitations
                        };
                    } else {
                        return [];
                    }
                } else {
                    return [];
                }
            } else {
                invalidRequestException.message.content = 'Invalid request. The request does not contain the required parameters. Missing parameter(s): "searchResponse"';
                invalidRequestException.timestamp = new Date().toISOString();
                throw invalidRequestException;
            }
        }
    } catch (error) {
        unexpectedException.message.content = "An unexpected error occured. Error: " + JSON.stringify(getException(error));
        unexpectedException.timestamp = new Date().toISOString();
        throw unexpectedException;
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
                const searchResponse = openidm.query(`${input._MO_OBJECT_NAME}`, {
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
                                    invitedBy: {
                                        userId: null,
                                        givenName: null,
                                        sn: null,
                                        mail: null
                                    },
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

                            return {
                                "invitations": deleActiveInvitation
                            }

                        } else {

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
                                            invitedBy: {
                                                userId: null,
                                                givenName: null,
                                                sn: null,
                                                mail: null
                                            },
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

                            return {
                                "invitations": invitations
                            }
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


function getMORecord(id, roleReturnProperties, MOName) {
    try {
        logger.error("getMORecord :: START - MOName: " + MOName + ", id: " + id + ", roleReturnProperties: " + roleReturnProperties)

        if (roleReturnProperties === null) {
            roleReturnProperties = ["*"]
        }

        let getResponse = null
        if (MOName && id) {
            logger.error("getMORecord :: Attempting openidm.read for managed/" + MOName + "/" + id);
            getResponse = openidm.read("managed/" + MOName + "/" + id, [roleReturnProperties]);

            if (getResponse) {
                logger.error("getMORecord :: SUCCESS - Retrieved record with _id: " + (getResponse._id || "NO_ID"));
                return getResponse
            } else {
                logger.error("getMORecord :: WARNING - openidm.read returned null for managed/" + MOName + "/" + id);
                return null
            }
        } else {
            logger.error("getMORecord :: ERROR - Missing required parameter. MOName: " + MOName + ", id: " + id);
            return null
        }

    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("getMORecord :: EXCEPTION - MOName: " + MOName + ", id: " + id + ", Error: " + error)
        logger.error("getMORecord :: EXCEPTION Details: " + JSON.stringify(error))
        throw error

    }
}

function patchMORecord(id, payload) {
    try {
        let jsonArray = []

        // Always update status to 2
        let jsonObj = {
            "operation": "replace",
            "field": "recordState",
            "value": "1"
        }
        jsonArray.push(jsonObj)

        // If confirmation details are present, add audit field
        if (payload && payload.confirmation) {
            jsonArray.push({
                "operation": "replace",
                "field": "/audit",
                "value": {
                    action: "cancel",
                    reason: payload.confirmation.reason,
                    comment: payload.confirmation.comment,
                    requesterUserId: payload.requesterAccountId
                }
            })
        }
        logger.error("the jsonArray in cancel invitation is: " + JSON.stringify(jsonArray))
        const response = openidm.patch("managed/alpha_kyid_enrollment_contextId/" + id, null, jsonArray)

        if (response) {
            return response
        } else {
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
            var locale = "en"
            var languageMap = identityServer.getProperty("esv.language.preference");
            const id = input.payload.invitationId || input.payload.invitationID
            let roleInfo = null
            let userInfo = null
            let patchResponse = null

            if (input._MO_OBJECT_NAME) {
                logger.error("Inside In Condition")
                // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME + id
                logger.error("input._MO_OBJECT_NAME --> " + input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse in cancelinvite is -->" + searchResponse)
                if (searchResponse) {
                    logDebug(input.transactionId, input.endPoint, "searchAccount", `Response: ${JSON.stringify(searchResponse)}`)
                    /* Temp code until app relationship is populated in the provisioning api. */
                    if (searchResponse.requestedUserAccountId !== null) {
                        //logger.error("cancelInvite function::enduserexist"+searchResponse.requestedUserAccountId)
                        const queryUserResponse = searchObjectByIdAttributeValue(
                            input,
                            "managed/alpha_user",
                            "_id",
                            searchResponse.requestedUserAccountId
                        );

                        if (queryUserResponse) {
                            //logger.error("cancelInvite function::queryUserResponse"+queryUserResponse)
                            let userlanguage = queryUserResponse.custom_languagePreference || "1";
                            if (languageMap && languageMap != null) {
                                locale = getLangCode(queryUserResponse.custom_languagePreference, languageMap);
                                // logger.error("cancelInvite function::locale"+locale)
                            }
                        }
                    }

                    //if(searchResponse.status !== "2" && searchResponse.status !== "1"){
                    patchResponse = patchMORecord(id, input.payload)
                    // patchResponse = true
                    if (patchResponse) {

                        //auditlogger lines
                        let roleAppObjects = searchResponse.applicationRoles
                        let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                        let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                        let eventDetails = {
                            roleNames: roleNames,
                            applicationNames: applicationNames,
                            invitationId: id,
                            confirmation: input.payload.confirmation
                        }
                        if (searchResponse.requestedUserAccountAttibutes.length > 0) {

                            for (let i = 0; i < searchResponse.requestedUserAccountAttibutes.length; i++) {
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "givenName" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalFirstName") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    givenName = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "sn" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalLastName") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    sn = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "mail" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "primaryEmailAddress") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    mail = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                            }
                        }

                        emailTemplateName = "kyid2B1InviteCancel";
                        //*****************************************
                        var canceledApp = applicationNames[0];
                        // const EmailResponse = sendEmail(emailTemplateName,null,givenName,sn,mail,null,canceledApp);
                        const EmailResponse = sendEmail(emailTemplateName, null, givenName, sn, mail, null, null, null, canceledApp, false, locale);
                        auditLogger("INA003", "Cancel Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                        return {
                            "message": "Invitation Cancelled Successfully"
                        }
                        // return patchResponse
                    } else {

                        //auditlogger lines
                        let roleAppObjects = searchResponse.applicationRoles
                        let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                        let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                        let eventDetails = {
                            roleNames: roleNames,
                            applicationNames: applicationNames,
                            invitationId: id,
                            failure: "Error Occurred While Cancelling The Invitation"
                        }

                        auditLogger("INA004", "Cancel Invitation Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                        invalidRequestException.message.content = `Error Occurred While Cancelling The Invitation`
                        invalidRequestException.timestamp = new Date().toISOString()

                        throw invalidRequestException

                    }
                    //}

                    // else{
                    // /* Throw invalid request exception. */
                    // invalidRequestException.message.content = `Request is State is `+searchResponse.status
                    // invalidRequestException.timestamp = new Date().toISOString()

                    // throw invalidRequestException
                    // }



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
            case 1:
                return d + "st";
            case 2:
                return d + "nd";
            case 3:
                return d + "rd";
            default:
                return d + "th";
        }
    }

    // Format time
    var hours = local.getUTCHours();
    var minutes = local.getUTCMinutes();
    var seconds = local.getUTCSeconds();

    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    var month = months[local.getUTCMonth()];
    var day = getOrdinalSuffix(local.getUTCDate());
    var time = hour12 + ":" + pad(minutes) + ":" + pad(seconds);

    return month + ", " + day + " " + local.getUTCFullYear() + " - " + time + " " + ampm + " " + tzAbbr;

}

/**
 * Format ISO date string to "Month, DayOrd Year" (e.g. "March, 1st 2026")
 * Matches isoToEastern() date format, without time component.
 */
function formatDateDisplay(isoDate) {
    if (!isoDate) return null;
    var d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    function getOrdinalSuffix(n) {
        if (n >= 11 && n <= 13) return n + "th";
        switch (n % 10) {
            case 1: return n + "st";
            case 2: return n + "nd";
            case 3: return n + "rd";
            default: return n + "th";
        }
    }
    return months[d.getUTCMonth()] + ", " + getOrdinalSuffix(d.getUTCDate()) + " " + d.getUTCFullYear();
}

// Send Email
function sendEmail(templateName, contextId, givenName, sn, mail, isUserExist, requesterFullName, roleNamesHtml, applicationNamesHtml, isDelegation, locale, hasDelegationEndDate) {
    try {
        logger.error("contextId is -->" + contextId)

        var params = new Object();
        var phoneContact = null;
        var emailContact = null;
        var appName = "KYID Helpdesk"
        try {

            var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", {
                _queryFilter: 'name eq "' + appName + '"'
            }, ["phoneContact", "emailContact"])
            phoneContact = userQueryResult2.result[0].phoneContact[0].phoneNumber
            emailContact = userQueryResult2.result[0].emailContact[0].emailAddress
            logger.error("phone contact is" + phoneContact);
        } catch (error) {
            logger.error("Error in catch of helpdesk retrieval :: => " + error)
        }
        params.templateName = templateName;
        params.to = mail;
        params._locale = locale || "en";
        var timeStamp = isoToEastern();
        params.object = {
            "givenName": givenName,
            "sn": sn,
            requestUri: null,
            "applicationNames": applicationNamesHtml,
            "requesterFullName": requesterFullName,
            "roleNamesHtml": roleNamesHtml,
            "phoneContact": phoneContact,
            "emailContact": emailContact,
            "timeStamp": timeStamp,
            "hasDelegationEndDate": hasDelegationEndDate || false
        };
        //params.object.requestUri = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=RIDP_kyid_2B1_MasterLogin&contextId="+contextId
        //  params.object.requestUri = "/enrolment/"+contextId

        logger.error("the userExist in sendEmail::" + isUserExist)
        var portalURL = identityServer.getProperty("esv.portal.url")
        //send URL path based on user exist paramter

        // If contextId is null or empty, use portal URL only (notification email)
        if (contextId === null || contextId === "" || contextId === undefined) {
            logger.error("sendEmail::contextId is null/empty - using portalURL only");
            params.object.requestUri = portalURL;
        } else if ((isDelegation === true || isDelegation === "true") && (isUserExist === true || isUserExist === "true")) {
            logger.error("sendEmail::isDelegation - isUserExist=true, using /appenroll/ path")
            logger.error("sendEmail::isDelegation - contextId: " + contextId)
            params.object.requestUri = portalURL + "/appenroll/" + contextId;
        } else if (isUserExist === true || isUserExist === "true") {
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


/**
 * @name resendInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
// function resendInvitation(input){
//   logger.error("resendInvitation Input --> "+JSON.stringify(input))

//     const EXCEPTION_UNEXPECTED_ERROR = {
//         code:"KYID-EUE",
//         content: ""
//     }
//     const EXCEPTION_INVALID_REQUEST = {
//         code:"KYID-IRE",
//         content: ""
//     }

//     const invalidRequestException = {
//         "code":"2",
//         "level":"ERROR",
//         "message":{
//             "code": EXCEPTION_INVALID_REQUEST.code,
//             "content":""
//         },
//         "logger":`${input._ENDPOINT_NAME}/resendInvitation`,
//         "timestamp":""
//     }
//     const unexpectedException = {
//         "code":"2",
//         "level":"ERROR",
//         "message":{
//             "code": EXCEPTION_UNEXPECTED_ERROR.code,
//             "content":""
//         },
//         "logger":`${input._ENDPOINT_NAME}/resendInvitation`,
//         "timestamp":""
//     }

//     try{
//         logDebug(input.transactionId,input.endPoint,"resendInvitation",`Input parameter: ${JSON.stringify(input.payload)}`)

//         /* Check if  */
//         if(input.payload){
//             const id = input.payload.invitationId
//             // const returnProperties = input.payload.returnProperties
//             const returnProperties = ["*"]
//             let givenName = null
//             let sn = null
//             let mail = null
//             // const queryFilter = input.payload.queryFilter
//             // const isUniqueResponseByApp = input.payload.isUniqueResponseByApp
//             // const isUniqueResponseByUser = input.payload.isUniqueResponseByUser
//             // const isUniqueResponseByRole = input.payload.isUniqueResponseByRole
//             let roleInfo = null 
//             let userInfo = null

//             if(input._MO_OBJECT_NAME){
//               logger.error("Inside In Condition")
//                 // logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${queryFilter}`)
//                 input._MO_OBJECT_NAME = input._MO_OBJECT_NAME+id
//                 logger.error("input._MO_OBJECT_NAME --> "+input._MO_OBJECT_NAME)
//                 const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
//                 logger.error("searchResponse is -->"+searchResponse)
//                 if(searchResponse){
//                     // logDebug(input.transactionId,input.endPoint,"resendInvitation",`Response: ${JSON.stringify(searchResponse)}`)
//                     /* Temp code until app relationship is populated in the provisioning api. */
//                    // if(searchResponse.expiryDateEpoch > Date.now() && searchResponse.status === "0" && (searchResponse.recordState === "0" ||searchResponse.recordState == "ACTIVE" ) && searchResponse.requestedUserAccountAttibutes) {

//                   if (
//                     searchResponse.expiryDateEpoch &&
//                     (searchResponse.expiryDateEpoch * 1000) > Date.now() &&
//                     searchResponse.status === "0" &&
//                     (
//                       searchResponse.recordState === "0" ||
//                       searchResponse.recordState === "ACTIVE"
//                     ) &&
//                     searchResponse.requestedUserAccountAttibutes &&
//                     searchResponse.requestedUserAccountAttibutes.length > 0
//                   ){
//                   logger.error("Meeting Condtions")
//                       if(searchResponse.requestedUserAccountAttibutes.length>0){
//                         for(let i=0; i<searchResponse.requestedUserAccountAttibutes.length ; i++){
//                           if((searchResponse.requestedUserAccountAttibutes[i].attributeName == "givenName" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalFirstName")&& searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
//                             givenName =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
//                           }
//                           if((searchResponse.requestedUserAccountAttibutes[i].attributeName == "sn" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalLastName")&& searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
//                             sn =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
//                           }
//                           if((searchResponse.requestedUserAccountAttibutes[i].attributeName == "mail" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "primaryEmailAddress") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null ){
//                             mail =searchResponse.requestedUserAccountAttibutes[i].attributeValue 
//                           }

//                         }
//                         if(givenName !== null && sn !== null && mail !== null){
//                           logger.error("Sending Invitation ")
//                          // const sendEmailResponse = sendEmail(searchResponse._id,givenName,sn,mail)
//                           emailTemplateName = "kyid2B1AccessDelegationInviteTemplate";
//                           const sendEmailResponse = sendEmail(emailTemplateName,searchResponse._id,givenName,sn,mail, true)
//                           if(sendEmailResponse){                              

//                             //auditlogger lines
//                             let roleAppObjects = searchResponse.applicationRoles
//                             let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
//                             let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
//                             let eventDetails = {
//                                     roleNames: roleNames,
//                                     applicationNames: applicationNames,
//                                     invitationId: id
//                                   }

//                             auditLogger("INA005", "Resend Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

//                             return {"message":"Email Sent Successfully"}

//                                                       }else{

//                              //auditlogger lines
//                             let roleAppObjects = searchResponse.applicationRoles
//                             let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
//                             let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
//                             let eventDetails = {
//                                     roleNames: roleNames,
//                                     applicationNames: applicationNames,
//                                     invitationId: id,
//                                     message: "Email Failed to send"
//                                   }
//                             auditLogger("INA006", "Resend Invitation failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

//                             return {"message":"Email Failed to send"}
//                           }
//                         }
//                         else{

//                             /* Throw invalid request exception. */
//                             unexpectedException.message.content = `Invalid request. mail or givenName or sn is null or blank"`
//                             unexpectedException.timestamp = new Date().toISOString()

//                             throw unexpectedException
//                         }
//                       }
//                       else{

//                         /* Throw invalid request exception. */
//                         invalidRequestException.message.content = `Invalid request. The request does not contain requestedUserAccountAttibutes"`
//                         invalidRequestException.timestamp = new Date().toISOString()

//                         throw invalidRequestException

//                       }

//                     }
//                   else{

//                 /* Throw invalid request exception. */
//                 invalidRequestException.message.content = `Invalid request. Invitation is Expired"`
//                 invalidRequestException.timestamp = new Date().toISOString()

//                 throw invalidRequestException
//                   }



//                 }else{

//                 /* Throw invalid request exception. */
//                 invalidRequestException.message.content = `Invalid request. Record not found"`
//                 invalidRequestException.timestamp = new Date().toISOString()

//                 throw invalidRequestException
//                 }
//             }else{

//                 /* Throw invalid request exception. */
//                 invalidRequestException.message.content = `Invalid request. Managed Object Not Found"`
//                 invalidRequestException.timestamp = new Date().toISOString()

//                 throw invalidRequestException
//             }

//         }else{
//             /* Throw invalid request exception. */
//             logger.error("`An unexpected error occured. Error")
//             invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "payload"`
//             invalidRequestException.timestamp = new Date().toISOString()

//             throw invalidRequestException
//         }
//     }catch(error){
//         /* Throw unexpected exception. */
//        logger.error("`An unexpected error occured. Error"+error)
//         unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
//         unexpectedException.timestamp = new Date().toISOString()

//         throw unexpectedException
//     }

// }

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
            const id = input.payload.invitationId || input.payload.invitationID
            // const returnProperties = input.payload.returnProperties
            const returnProperties = ["*"]
            let givenName = null
            let sn = null
            let mail = null

            let roleInfo = null
            let userInfo = null
            let isUserExist = false;
            let isDelegation = false;
            let requesterFirstName = ""
            let requesterLastName = ""
            let requesterFullName = ""
            let locale = "en"
            if (input._MO_OBJECT_NAME) {
                logger.error("Inside In Condition")

                input._MO_OBJECT_NAME = input._MO_OBJECT_NAME + id
                logger.error("input._MO_OBJECT_NAME --> " + input._MO_OBJECT_NAME)
                const searchResponse = openidm.read(`${input._MO_OBJECT_NAME}`, returnProperties)
                logger.error("searchResponse is -->" + searchResponse)
                if (searchResponse) {

                    if (searchResponse && searchResponse.applicationRoles && searchResponse.applicationRoles.length > 0) {
                        searchResponse.applicationRoles.forEach(function(role) {
                            if (
                                role.currentDelegatorUserAccountId ||
                                role.currentDelegatorIdentifierAttributeValue ||
                                role.originalDelegatorUserAccountId ||
                                role.orginalDelegatorIdentifierAttributeValue
                            ) {
                                isDelegation = true;
                            }
                        });
                    }
                    if (
                        (
                            searchResponse.recordState === "0" ||
                            searchResponse.recordState === "ACTIVE"
                        ) &&
                        searchResponse.requestedUserAccountAttibutes &&
                        searchResponse.requestedUserAccountAttibutes.length > 0
                    ) {
                        logger.error("Meeting Condtions")
                        if (searchResponse.requestedUserAccountAttibutes.length > 0) {
                            for (let i = 0; i < searchResponse.requestedUserAccountAttibutes.length; i++) {
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "givenName" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalFirstName") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    givenName = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "sn" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "legalLastName") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    sn = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }
                                if ((searchResponse.requestedUserAccountAttibutes[i].attributeName == "mail" || searchResponse.requestedUserAccountAttibutes[i].attributeName == "primaryEmailAddress") && searchResponse.requestedUserAccountAttibutes[i].attributeValue !== null) {
                                    mail = searchResponse.requestedUserAccountAttibutes[i].attributeValue
                                }


                                if (searchResponse.requesterUserAccountId !== null) {
                                    logger.error("Resend function::requesterinfofetch")
                                    const requesterUser = searchObjectByIdAttributeValue(
                                        input,
                                        "managed/alpha_user",
                                        "_id",
                                        searchResponse.requesterUserAccountId
                                    );

                                    if (requesterUser) {
                                        requesterFirstName = requesterUser.givenName || "";
                                        requesterLastName = requesterUser.sn || "";
                                        requesterFullName = requesterFirstName + " " + requesterLastName;
                                    }
                                }


                                if (searchResponse.requestedUserAccountId !== null) {
                                    logger.error("Resend function::enduserexist")
                                    const queryUserResponse = searchObjectByIdAttributeValue(
                                        input,
                                        "managed/alpha_user",
                                        "_id",
                                        searchResponse.requestedUserAccountId
                                    );
                                    if (queryUserResponse && queryUserResponse.custom_languagePreference) {
                                        let languageMap = identityServer.getProperty("esv.language.preference");
                                        let langPref = queryUserResponse.custom_languagePreference || "1"
                                        if (languageMap && languageMap != null) {
                                            locale = getLangCode(langPref, languageMap);
                                        }
                                    }
                                    isUserExist = true
                                }

                            }

                            let roleAppObjects = searchResponse.applicationRoles
                            let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                            let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                            let eventDetails = {
                                roleNames: roleNames,
                                applicationNames: applicationNames,
                                invitationId: id
                            }
                            const applicationNamesStr = applicationNames.join(", ");
                            var roleNamesHtml = '<ul style="padding-left:20px; margin:5px 0; text-align:left;">';


                            if (givenName !== null && sn !== null && mail !== null) {
                                logger.error("Sending Invitation ")

                                // emailTemplateName = "kyid2B1AccessDelegationInviteTemplate";
                                // const sendEmailResponse = sendEmail(emailTemplateName,searchResponse._id,givenName,sn,mail, isUserExist, applicationNamesStr, requesterFullName,roleNamesHtml,false)
                                let sendEmailResponse = ""
                                if (isDelegation === true) {
                                    logger.error("send the email using template kyid2B1DelegationInvitationTemplate")
                                    // Reuse buildRoleEmailContent - map field names
                                    let rolesForEmail = roleAppObjects.map(function(r) {
                                        return { appName: r.applicationName, roleName: r.roleName, delegationEndDate: r.delegationEndDate };
                                    });
                                    let emailContent = buildRoleEmailContent(rolesForEmail, requesterFullName);
                                    emailTemplateName = "kyid2B1DelegationInvitationTemplate";
                                    logger.error("Sending Invitation values = " + applicationNamesStr + " :: " + emailContent.roleNamesHtml)
                                    sendEmailResponse = sendEmail(emailTemplateName, searchResponse._id, givenName, sn, mail, isUserExist, requesterFullName, emailContent.roleNamesHtml, applicationNamesStr, true, locale, emailContent.hasDelegationEndDate)
                                } else {
                                    let roleNamesHtml = "<ul style='list-style-type:none;padding:0;margin:0'>";
                                    if (roleAppObjects && roleAppObjects.length > 0) {
                                        logger.error("send the email using template kyid2B1AccessDelegationInviteTemplate")
                                        roleAppObjects.forEach((roleAppObject, index) => {
                                            roleNamesHtml += "<li style='padding:5px 0'><strong>" + roleAppObject.applicationName + ":</strong> " + roleAppObject.roleName + "</li>";
                                        });
                                    }
                                    roleNamesHtml += "</ul>";
                                    emailTemplateName = "kyid2B1AccessDelegationInviteTemplate";
                                    logger.error("Sending Invitation values = 2 " + applicationNamesStr + " :: " + roleNamesHtml)
                                    sendEmailResponse = sendEmail(emailTemplateName, searchResponse._id, givenName, sn, mail, isUserExist, requesterFullName, roleNamesHtml, applicationNamesStr, false, locale)
                                }
                                if (sendEmailResponse) {

                                    // Update resendDate, expiryDate, and status on resend
                                    try {
                                        let resendExpiryDays = isDelegation
                                            ? getDelegationInvitationExpiryDays(searchResponse.applicationRoles)
                                            : (identityServer.getProperty("esv.enrollment.context.defaultexpiry") || 1)
                                        let nowEpoch = Date.now()
                                        let now = new Date().toISOString()
                                        let newExpiryDateEpoch = nowEpoch + resendExpiryDays * 24 * 60 * 60 * 1000
                                        let newExpiryDate = new Date(newExpiryDateEpoch).toISOString()

                                        let resendPatchArray = [
                                            {
                                                "operation": "replace",
                                                "field": "resendDate",
                                                "value": now
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "resendDateEpoch",
                                                "value": nowEpoch
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "expiryDate",
                                                "value": newExpiryDate
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "expiryDateEpoch",
                                                "value": newExpiryDateEpoch
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "updateDate",
                                                "value": now
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "updateDateEpoch",
                                                "value": nowEpoch
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "updatedBy",
                                                "value": "KYID-System"
                                            },
                                            {
                                                "operation": "replace",
                                                "field": "status",
                                                "value": "0"
                                            }
                                        ]
                                        let patchResponse = openidm.patch("managed/alpha_kyid_enrollment_contextId/" + id, null, resendPatchArray)
                                        logger.debug("resendInvitation patchResponse --> " + JSON.stringify(patchResponse))
                                    } catch (patchError) {
                                        logger.error("resendInvitation: Error updating invitation record on resend: " + patchError)
                                    }

                                    //auditlogger lines


                                    auditLogger("INA005", "Resend Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                                    return {
                                        "message": "Email Sent Successfully"
                                    }

                                } else {

                                    //auditlogger lines
                                    let roleAppObjects = searchResponse.applicationRoles
                                    let roleNames = roleAppObjects.map(roleAppObject => roleAppObject.roleName)
                                    let applicationNames = roleAppObjects.map(roleAppObject => roleAppObject.applicationName)
                                    let eventDetails = {
                                        roleNames: roleNames,
                                        applicationNames: applicationNames,
                                        invitationId: id,
                                        message: "Email Failed to send"
                                    }
                                    auditLogger("INA006", "Resend Invitation failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, searchResponse.requesterUserAccountId, searchResponse.requestedUserAccountId, input.auditLogger.transactionIdauditLogger, mail, eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                                    return {
                                        "message": "Email Failed to send"
                                    }
                                }
                            } else {

                                /* Throw invalid request exception. */
                                unexpectedException.message.content = `Invalid request. mail or givenName or sn is null or blank`
                                unexpectedException.timestamp = new Date().toISOString()

                                throw unexpectedException
                            }
                        } else {

                            /* Throw invalid request exception. */
                            invalidRequestException.message.content = `Invalid request. The request does not contain requestedUserAccountAttibutes`
                            invalidRequestException.timestamp = new Date().toISOString()

                            throw invalidRequestException

                        }

                    } else {

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

/**
 * @name resendInvitation
 * @description Method searches access. 
 * 
 * @param {JSON} input 
 * @returns Array<JSON> Array of JSON access
 */
function sendInvitation(input) {
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
            const invitedUser = input.payload.user || null
            const roles = input.payload.roles || null
            const context = input.payload.context || null
            const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");
            let isExternalUser = true
            let isUserExist = true
            let KOGID = null
            let userDomain = null
            let requestedUserAccountId = null
            let requestedUserIdentifierAttributeName = null
            let requestedUserIdentifierAttributeValue = null

            if (invitedUser) {
                if (invitedUser.userId) {
                    let getUserbyIdPing = getMORecord(invitedUser.userId, ["*"], "alpha_user")
                    if (getUserbyIdPing) {
                        if (getUserbyIdPing.accountStatus == "active") {
                            requestedUserAccountId = getUserbyIdPing._id,
                                requestedUserIdentifierAttributeName = "KYID",
                                requestedUserIdentifierAttributeValue = getUserbyIdPing._id,
                                userDomain = getUserbyIdPing.frIndexedString2 || null
                            if (userDomain) {
                                userDomain = userDomain.split('@')[1]
                                if (userDomain.toLowerCase() === extDomain.toLowerCase) {
                                    isExternalUser = true
                                    isUserExist = true
                                }

                            }
                        }
                    }
                } else if (invitedUser.mail) {
                    let KOGUserResponse = invokeKOGAPI(mail)
                    if (KOGUserResponse) {
                        if (KOGUserResponse.UPN) {
                            KOGID = KOGUserResponse.KOGID || null
                            if (KOGID) {
                                requestedUserIdentifierAttributeName = "KOGID"
                                requestedUserIdentifierAttributeValue = KOGID
                            }

                            userDomain = KOGUserResponse.UPN.toLowerCase() || null
                            if (userDomain) {
                                userDomain = userDomain.split('@')[1]
                                if (userDomain.toLowerCase() === extDomain.toLowerCase) {
                                    isExternalUser = true
                                    isUserExist = true
                                }

                            }
                        }

                    }
                }
                if (isExternalUser === true) {
                    let rolewithPrereq = []
                    let rolewithoutPrereq = []
                    let roleJSONWithPrereq = {}

                    let roleJSONWithoutPrereq = {}
                    if (roles !== null) {
                        if (roles.length > 0) {
                            let contextRequestBody = {
                                applicationRoles: [],
                                "createDate": new Date().toISOString(),
                                "createDateEpoch": Date.now(),
                                "createdBy": "KYID-System",
                                "expiryDate": null,
                                "expiryDateEpoch": null,
                                "recordSource": "1",
                                "recordState": "0",
                                "requestedUserAccountAttibutes": [{
                                        "attributeName": "givenName",
                                        "attributeValue": input.payload.user.givenName || null,
                                        "isReadOnly": false
                                    },
                                    {
                                        "attributeName": "sn",
                                        "attributeValue": input.payload.user.sn || null,
                                        "isReadOnly": false
                                    },
                                    {
                                        "attributeName": "mail",
                                        "attributeValue": input.payload.user.mail || null,
                                        "isReadOnly": true
                                    }
                                ],
                                "requestedUserAccountId": requestedUserAccountId,
                                "requestedUserIdentifierAttributeName": requestedUserIdentifierAttributeName,
                                "requestedUserIdentifierAttributeValue": requestedUserIdentifierAttributeValue,
                                "requesterUserAccountId": input.payload.userId,
                                "requesterUserIdentifierAttributeName": "KYID",
                                "requesterUserIdentifierAttributeValue": input.payload.userId,
                                "status": "0",
                                "updateDate": new Date().toISOString(),
                                "updateDateEpoch": Date.now(),
                                "updatedBy": "KYID-System"
                            }
                            let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")
                            let enrollExpiryDateEpoch = Date.now() + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
                            let enrollExpiryDate = new Date(enrollExpiryDateEpoch).toISOString();
                            let enrollmentReqTemplate = {
                                createDate: new Date().toISOString(),
                                createDateEpoch: Date.now(),
                                expiryDate: enrollExpiryDate, // if expiry not present in enrollment context how to get the expiry date
                                expiryDateEpoch: enrollExpiryDateEpoch,
                                status: "IN_PROGRESS",
                                requestedUserId: requestedUserAccountId,
                                requesterId: input.payload.userId,
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


                            let expiryDate = getExpiryDate("0", null)
                            if (expiryDate) {
                                contextRequestBody.expiryDate = expiryDate.expiryDate
                                contextRequestBody.expiryDateEpoch = expiryDate.expiryEpochMillis
                            }
                            roles.forEach(value => {
                                if (value.roleId) {
                                    let roleInfo = getMORecord(value.roleId, ["*"], "alpha_role")
                                    if (roleInfo) {
                                        if (roleInfo.accessPolicy) {
                                            let businessInfo = getMORecord(roleInfo.businessAppId._refResourceId, ["*"], "alpha_kyid_businessapplication")
                                            let rolePolicy = getMORecord(roleInfo.accessPolicy._refResourceId, ["*"], "alpha_kyid_enrollment_access_policy")
                                            if (rolePolicy) {
                                                if (rolePolicy.preRequisites && rolePolicy.preRequisites.length > 0) {
                                                    roleJSONWithPrereq["applicationId"] = null
                                                    roleJSONWithPrereq["roleId"] = value.roleId || null
                                                    roleJSONWithPrereq["roleName"] = null
                                                    roleJSONWithPrereq["applicationName"] = null
                                                    roleJSONWithPrereq["isForwardDelegable"] = value.isForwardDelegable || false
                                                    roleJSONWithPrereq["delegationEndDate"] = value.delegationEndDate || null
                                                    roleJSONWithPrereq["delegationEndDateEpoch"] = null
                                                    if (value.delegationEndDate) {
                                                        roleJSONWithPrereq["delegationEndDateEpoch"] = new Date(value.delegationEndDate).getTime()
                                                    }
                                                    if (roleInfo.businessAppId) {
                                                        roleJSONWithPrereq["applicationId"] = roleInfo.businessAppId._refResourceId
                                                    }
                                                    if (roleInfo.name) {
                                                        roleJSONWithPrereq["roleName"] = roleInfo.name
                                                    }
                                                    if (roleInfo.businessAppId) {
                                                        if (businessInfo) {
                                                            if (businessInfo.name) {
                                                                roleJSONWithPrereq["applicationName"] = businessInfo.name
                                                            }

                                                        }

                                                    }



                                                    if (context === "delegation") {
                                                        roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = "KYID"
                                                        roleJSONWithPrereq["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                                        let originalDeligatorQueryFilter = "originalDelegator pr AND role/_refResourceId eq \"" + value.roleId + "\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                                        let originalDelegatorInfo = searchMO("alpha_kyid_access", originalDeligatorQueryFilter, ["*"])
                                                        logger.error("originalDelegatorInfo --> " + JSON.stringify(originalDelegatorInfo))
                                                        if (originalDelegatorInfo) {
                                                            if (originalDelegatorInfo.originalDelegator) {
                                                                roleJSONWithPrereq["originalDelegatorUserAccountId"] = originalDelegatorInfo.originalDelegator._refResourceId
                                                                roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = originalDelegatorInfo.originalDelegator._refResourceId
                                                                roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                                            } else {
                                                                roleJSONWithPrereq["originalDelegatorUserAccountId"] = input.payload.userId
                                                                roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = input.payload.userId
                                                                roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"

                                                            }

                                                        } else {
                                                            roleJSONWithPrereq["originalDelegatorUserAccountId"] = input.payload.userId
                                                            roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = input.payload.userId
                                                            roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"


                                                        }
                                                    }
                                                    rolewithPrereq.push(roleJSONWithPrereq)



                                                } else {
                                                    logger.error("Without Prereq Condition1")
                                                    if (isUserExist === false) {
                                                        roleJSONWithPrereq["applicationId"] = roleInfo.businessAppId || null
                                                        roleJSONWithPrereq["roleId"] = value.roleId || null
                                                        roleJSONWithPrereq["roleName"] = roleInfo.name || null
                                                        roleJSONWithPrereq["applicationName"] = roleInfo.businessAppId.name || null
                                                        roleJSONWithPrereq["isForwardDelegable"] = value.isForwardDelegable || null
                                                        roleJSONWithPrereq["delegationEndDate"] = value.delegationEndDate || null
                                                        roleJSONWithPrereq["delegationEndDateEpoch"] = 123456
                                                        if (context === "delegation") {
                                                            roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = "KYID"
                                                            roleJSONWithPrereq["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                                            roleJSONWithPrereq["currentDelegatorIdentifierAttributeName"] = input.payload.userId
                                                            let originalDeligatorQueryFilter = "originalDelegator pr AND role eq \"" + value.roleId + "\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                                            let originalDelegatorInfo = searchMO("managed/alpha_kyid_access", originalDeligatorQueryFilter, ["*"])
                                                            if (originalDelegatorInfo) {
                                                                if (originalDelegatorInfo[0].originalDelegator) {
                                                                    roleJSONWithPrereq["originalDelegatorUserAccountId"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                                                    roleJSONWithPrereq["orginalDelegatorIdentifierAttributeValue"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                                                    roleJSONWithPrereq["orginalDelegatorIdentifierAttributeName"] = "KYID"
                                                                }

                                                            }

                                                        }
                                                        rolewithPrereq.push(roleJSONWithPrereq)

                                                    } else {
                                                        logger.error("Without Prereq Condition")
                                                        let roleContextTemplate = {
                                                            appName: null,
                                                            businessKeys: [],
                                                            currentDelegatorId: null,
                                                            orgId: null,
                                                            orgName: null,
                                                            orgType: null,
                                                            orginalDelegatorId: null,
                                                            roleName: null
                                                        }


                                                        enrollmentReqTemplate.roleIds.push({
                                                            "_ref": "managed/alpha_role/" + roleInfo._id,
                                                            "_refProperties": {}
                                                        })
                                                        roleContextTemplate["appName"] = roleInfo.businessAppId.name || null
                                                        roleContextTemplate["roleName"] = roleInfo.name || null
                                                        roleContextTemplate["isForwardDelegable"] = value.isForwardDelegable || null
                                                        roleContextTemplate["delegationEndDate"] = value.delegationEndDate || null
                                                        roleContextTemplate["delegationEndDateEpoch"] = 123456
                                                        if (context === "delegation") {
                                                            currentDelegatorId["currentDelegatorIdentifierAttributeValue"] = input.payload.userId
                                                            let originalDeligatorQueryFilter = "originalDelegator pr AND role eq \"" + value.roleId + "\"] AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
                                                            let originalDelegatorInfo = searchMO("alpha_kyid_access", originalDeligatorQueryFilter, ["*"])
                                                            if (originalDelegatorInfo) {
                                                                if (originalDelegatorInfo[0].originalDelegator) {
                                                                    roleContextTemplate["orginalDelegatorId"] = originalDelegatorInfo[0].originalDelegator._refResourceId
                                                                }

                                                            }
                                                        }
                                                        enrollmentReqTemplate.roleContext.push(roleContextTemplate)
                                                    }

                                                }
                                            } else {
                                                /* Throw invalid request exception. */

                                                logger.error("`An unexpected error occured. Error")
                                                invalidRequestException.message.content = `Invalid request. Policy is not congigured for Role :: "` + value.roleId
                                                invalidRequestException.timestamp = new Date().toISOString()

                                                throw invalidRequestException

                                            }
                                        } else {
                                            /* Throw invalid request exception. */
                                            logger.error("`An unexpected error occured. Error")
                                            invalidRequestException.message.content = `Invalid request. Policy is not congigured for Role :: "` + value.roleId
                                            invalidRequestException.timestamp = new Date().toISOString()

                                            throw invalidRequestException

                                        }

                                    } else {
                                        /* Throw invalid request exception. */
                                        logger.error("`An unexpected error occured. Error")
                                        invalidRequestException.message.content = `Invalid request. Role Not Found :: "` + value.roleId
                                        invalidRequestException.timestamp = new Date().toISOString()

                                        throw invalidRequestException

                                    }

                                } else {
                                    /* Throw invalid request exception. */
                                    logger.error("`An unexpected error occured. Error")
                                    invalidRequestException.message.content = `Invalid request. Role Not Found :: "` + value.roleId
                                    invalidRequestException.timestamp = new Date().toISOString()

                                    throw invalidRequestException

                                }
                            })
                            let createEnrollmentRequestResponse = null
                            let createContextIdResponse = null
                            if (rolewithPrereq && rolewithPrereq.length > 0) {
                                contextRequestBody.applicationRoles = rolewithPrereq
                                // return {"contextRequestBody":contextRequestBody}
                                createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId", contextRequestBody)
                                // return {"createContextIdResponse":createContextIdResponse}
                            }
                            if (enrollmentReqTemplate.roleContext && enrollmentReqTemplate.roleContext.length > 0) {
                                logger.error("enrollmentReqTemplate --> " + JSON.stringify(enrollmentReqTemplate))
                                createEnrollmentRequestResponse = createRecord("alpha_kyid_enrollment_request", enrollmentReqTemplate)
                                return createEnrollmentRequestResponse
                            }
                            if (rolewithPrereq.length === 0 && enrollmentReqTemplate.roleContext === 0) {
                                invalidRequestException.message.content = `Unexpected Error Occurred While Sending Invite rolewithPrereq is Empty and rolewithoutPrereq is Empty "`
                                invalidRequestException.timestamp = new Date().toISOString()
                                throw invalidRequestException

                            }

                            if (createEnrollmentRequestResponse) {

                                let enrollmentRequest = createEnrollmentRequestResponse._id
                                // let provisionROleRsponse = provisionRole()
                            }
                            if (createContextIdResponse) {
                                let ContextId = createContextIdResponse._id

                                // Get requester information
                                let requesterUser = getMORecord(input.payload.userId, ["givenName", "sn"], "alpha_user")
                                let requesterFullName = ""
                                if (requesterUser && requesterUser.givenName && requesterUser.sn) {
                                    requesterFullName = requesterUser.givenName + " " + requesterUser.sn
                                }

                                // Generate roleNamesHtml and applicationNames
                                let roleNamesHtml = "<ul style='list-style-type:none;padding:0;margin:0'>";
                                let applicationNames = []
                                rolewithPrereq.forEach((role) => {
                                    roleNamesHtml += "<li style='padding:5px 0'><strong>" + role.applicationName + ":</strong> " + role.roleName + "</li>";
                                    if (applicationNames.indexOf(role.applicationName) === -1) {
                                        applicationNames.push(role.applicationName)
                                    }
                                });
                                roleNamesHtml += "</ul>";
                                let applicationNamesStr = applicationNames.join(", ")

                                var emailTemplateName = "kyid2B1AccessDelegationInviteTemplate";
                                const sendEmailResponse = sendEmail(emailTemplateName, ContextId, input.payload.user.givenName, input.payload.user.sn, input.payload.user.mail, false, requesterFullName, roleNamesHtml, applicationNamesStr, false)
                                if (sendEmailResponse) {
                                    //return {"message":"Email Sent Successfully"}
                                    return {
                                        "message": ContextId
                                    }
                                }

                            }
                        }
                    }


                } else {
                    /* Throw invalid request exception. */
                    logger.error("`An unexpected error occured. Error")
                    invalidRequestException.message.content = `Invalid request. The request contain Internal User, Only External Users are allowed"`
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
        }
    } catch (error) {
        /* Throw unexpected exception. */
        logger.error("`An unexpected error occured. Error" + error)
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()

        throw unexpectedException
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
            } else {
                logger.error("KOG API: user not found for email " + mail);
                return null;
            }
        }

    } catch (error) {
        logger.error("Exception Found::function invokeKOGAPI" + JSON.stringify(error));
        return null;
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
    return new Date(currentDate).toISOString();

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

function searchObjectByQuery(input, objectName, queryFilter) {
    try {
        if (!queryFilter) {
            logger.error("searchObjectByQuery :: Missing queryFilter");
            return null;
        }


        let result = openidm.query(objectName, {
            "_queryFilter": queryFilter
        });

        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            logger.error("searchObjectByQuery :: No object found in " + objectName +
                " where " + queryFilter);
            return null;
        }
    } catch (e) {
        logger.error("searchObjectByQuery :: Exception - " + e);
        return null;
    }
}


function getLangCode(code, languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}


function sendInvitationAPI(input) {
    logger.error("sendInvitationAPI Input --> " + JSON.stringify(input))

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
        "logger": `${input._ENDPOINT_NAME}/sendInvitationAPI`,
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": `${input._ENDPOINT_NAME}/sendInvitationAPI`,
        "timestamp": ""
    }

    let roleAppObjects = {
        roleNames: [],
        applicationNames: []
    }

    // --- Shared delegation end date validation function ---
    function validateDelegationEndDate(value, roleId, logPrefix) {
        if (value.currentDelegatorIdAttributeValue && value.originalDelegatorIdAttributeValue
            && value.currentDelegatorIdAttributeValue !== value.originalDelegatorIdAttributeValue) {

            var delegatorAccessFilter = '/userIdentifier eq "' + value.currentDelegatorIdAttributeValue + '"'
                + ' and /roleIdentifier eq "' + roleId + '"'
                + ' and /originalDelegatorIdentifier eq "' + value.originalDelegatorIdAttributeValue + '"'
                + ' and (/recordState eq "0" or /recordState eq "ACTIVE")';

            logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " Querying delegator access with filter: " + delegatorAccessFilter);

            var delegatorAccessResult = openidm.query("managed/alpha_kyid_access",
                { "_queryFilter": delegatorAccessFilter },
                ["expiryDate", "expiryDateEpoch", "_id"]);

            if (delegatorAccessResult && delegatorAccessResult.result && delegatorAccessResult.result.length > 0) {
                var delegatorAccess = delegatorAccessResult.result[0];
                var delegatorExpiryDate = delegatorAccess.expiryDate;

                logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " Delegator expiryDate = " + delegatorExpiryDate);

                if (delegatorExpiryDate) {
                    if (value.delegationEndDate) {
                        var newEndEpoch = new Date(value.delegationEndDate).getTime();
                        var delegatorEndEpoch = new Date(delegatorExpiryDate).getTime();

                        if (newEndEpoch > delegatorEndEpoch) {
                            logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " Capping date " + value.delegationEndDate + " to delegator date " + delegatorExpiryDate);
                            value.delegationEndDate = delegatorExpiryDate;
                        } else {
                            logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " PASSED - new date within delegator's range");
                        }
                    } else {
                        logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " Auto-filling blank delegationEndDate with delegator's: " + delegatorExpiryDate);
                        value.delegationEndDate = delegatorExpiryDate;
                    }
                } else {
                    logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " Delegator has no expiryDate (indefinite) — skipping validation");
                }
            } else {
                logger.error("[DELEGATION-ENDDATE-VALIDATION] " + logPrefix + " No active access record found for delegator — skipping validation");
            }
        }
    }
    // --- End shared delegation end date validation function ---

    try {
        logDebug(input.transactionId, input.endPoint, "sendInvitationAPI", `Input parameter: ${JSON.stringify(input.payload)}`)

        if (input.payload) {
            const invitedUser = input.payload.requestedUser || null
            const access = input.payload.access || null
            const extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain");

            let isExternalUser = true
            // let isExternalUser = false
            let isUserExist = true
            // let isUserExist = false
            let KOGID = null
            let userDomain = null
            let requestedUserAccountId = null
            let requestedUserIdentifierAttributeName = null
            let requestedUserIdentifierAttributeValue = null
            let isDelegation = false
            //For mutually Exclusive
            var requestedRoleApps = [];
            let ContextIds = null;
            let queryFilterContext = null;
            let locale = "en;"
            let languagePreference = null;
            let languageMap = identityServer.getProperty("esv.language.preference");
            //Setting for isReverify prerequisite
            let isReverify = false
            if (input.payload.isReverify === true) {
                logger.error("this is the reverify prerequisite")
                isReverify = true
            }

            if (invitedUser) {
                //if (invitedUser._id) {
                if (invitedUser && invitedUser._id && invitedUser._id !== null && invitedUser._id !== "") {
                    // requestedUser has ID
                    logger.error("the _id of user is present")
                    let getUserbyIdPing = searchObjectByIdAttributeValue(
                        input,
                        "managed/alpha_user",
                        "_id",
                        invitedUser._id
                    )
                    if (getUserbyIdPing && getUserbyIdPing.accountStatus && getUserbyIdPing.accountStatus.toLowerCase() === "active") {
                        requestedUserAccountId = getUserbyIdPing._id
                        requestedUserIdentifierAttributeName = "KYID"
                        requestedUserIdentifierAttributeValue = getUserbyIdPing._id
                        userDomain = getUserbyIdPing.frIndexedString2 || null;
                        languagePreference = getUserbyIdPing.custom_languagePreference || "1";
                        if (languageMap && languageMap != null) {
                            locale = getLangCode(languagePreference, languageMap);
                        }
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    }
                } else if (invitedUser && invitedUser.email) {

                    let getUserbyIdPing = searchObjectByIdAttributeValue(
                        input,
                        "managed/alpha_user",
                        "mail",
                        invitedUser.email
                    )
                    if (getUserbyIdPing && getUserbyIdPing.accountStatus && getUserbyIdPing.accountStatus.toLowerCase() === "active") {
                        logger.error("invited user's id not present but found in ping by email")
                        requestedUserAccountId = getUserbyIdPing._id
                        requestedUserIdentifierAttributeName = "KYID"
                        requestedUserIdentifierAttributeValue = getUserbyIdPing._id
                        userDomain = getUserbyIdPing.frIndexedString2 || null
                        if (userDomain) {
                            userDomain = userDomain.split('@')[1]
                            if (userDomain.toLowerCase() === extDomain.toLowerCase()) {
                                isExternalUser = true
                                isUserExist = true
                            }
                        }
                    } else {
                        // requestedUser has NO ID, lookup by mail
                        logger.error("searching the user from email" + invitedUser.email)
                        let KOGUserResponse = invokeKOGAPI(invitedUser.email)

                        //var apiResponse = JSON.parse(KOGUserResponse.text());
                        //logger.error("the KOGUserResponse is:: "+KOGUserResponse.UserDetails.UPN)
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
                        "expiryDate": contextExpiryDate,
                        "expiryDateEpoch": contextExpiryDateEpoch,
                        "recordSource": "1",
                        "recordState": "0",
                        "showConfirmationPage": "false",
                        "requestedUserAccountAttibutes": [{
                                "attributeName": "legalFirstName",
                                "attributeValue": input.payload.requestedUser.firstName || null,
                                "isReadOnly": false
                            },
                            {
                                "attributeName": "legalLastName",
                                "attributeValue": input.payload.requestedUser.lastName || null,
                                "isReadOnly": false
                            },
                            {
                                "attributeName": "primaryEmailAddress",
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
                        "updatedBy": "KYID-System"
                    }

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

                    // If invitedUser has _id
                    if ((invitedUser._id || isUserExist) && access && access.length > 0) {
                        access.forEach(value => {
                            //let roleInfo = searchObjectByIdAttributeValue(input, "managed/alpha_role", value.roleIdAttribute, value.roleIdAttributeValue)

                            let businessInfo = null
                            if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                businessInfo = searchObjectByIdAttributeValue(
                                    input,
                                    "managed/alpha_kyid_businessapplication",
                                    value.businessAppIdAttribute,
                                    value.businessAppIdAttributeValue
                                )
                            }

                            //Role Search

                            let query = `${value.roleIdAttribute} eq "${value.roleIdAttributeValue}" and businessAppId/_refResourceId eq "${businessInfo._id}"`;
                            let roleInfo = searchObjectByQuery(input, "managed/alpha_role", query)
                            logger.error("the roleInfo::: " + roleInfo)

                            //get names for aduit logger
                            roleAppObjects.roleNames.push(roleInfo.name)
                            roleAppObjects.applicationNames.push(businessInfo.name)

                            //Check mutually exclusive role
                            requestedRoleApps.push({
                                roleName: roleInfo.name,
                                businessName: businessInfo.name
                            });

                            // Validate delegationEndDate against current delegator's delegation end date
                            validateDelegationEndDate(value, roleInfo._id, "(existing user)");

                            if (roleInfo && roleInfo.accessPolicy) {
                                let rolePolicy = searchObjectByIdAttributeValue(input, "managed/alpha_kyid_enrollment_access_policy", "_id", roleInfo.accessPolicy._refResourceId)
                                if (rolePolicy && rolePolicy.preRequisites && rolePolicy.preRequisites.length > 0) {
                                    logger.error("Role needs prerequisites - Enrollment Context")


                                    let prereqObj = {
                                        roleId: roleInfo._id,
                                        applicationId: businessInfo._id,
                                        roleName: roleInfo.name,
                                        applicationName: businessInfo.name
                                    };

                                    // push delegation attributes only if present
                                    if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue || value.originalDelegatorIdAttributeValue) {
                                        isDelegation = true
                                        prereqObj.isForwardDelegable = value.isForwardDelegable;
                                        prereqObj.delegationEndDate = value.delegationEndDate;
                                        prereqObj.delegationEndDateEpoch = value.delegationEndDate || null;
                                        prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                        prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                        prereqObj.currentDelegatorUserAccountId = value.currentDelegatorIdAttributeValue;
                                        prereqObj.originalDelegatorUserAccountId = value.originalDelegatorIdAttributeValue
                                        prereqObj.orginalDelegatorIdentifierAttributeValue = value.originalDelegatorIdAttributeValue
                                        prereqObj.orginalDelegatorIdentifierAttributeName = "KYID"
                                    }


                                    rolewithPrereq.push(prereqObj);
                                    logger.error("the data for rolewithPreReq" + JSON.stringify(rolewithPrereq))

                                } else {
                                    logger.error("No prerequisites.Create Enrollment Request")
                                    enrollmentReqTemplate.roleIds.push({
                                        "_ref": "managed/alpha_role/" + roleInfo._id,
                                        "_refProperties": {}
                                    })

                                    let roleContextObj = {
                                        appName: businessInfo.name,
                                        roleName: roleInfo.name,
                                        applicationId: businessInfo._id,
                                        roleId: roleInfo._id,
                                        alwaysSendInvitation: roleInfo.alwaysSendInvitation || false
                                    };

                                    if (value.isForwardDelegable || value.delegationEndDate || value.currentDelegatorIdAttributeValue || value.originalDelegatorIdAttributeValue) {
                                        isDelegation = true
                                        logger.error("[DEBUG-DELEGATION-ENDDATE] INPUT from request - value.delegationEndDate = " + value.delegationEndDate);
                                        roleContextObj.isForwardDelegable = value.isForwardDelegable;
                                        roleContextObj.delegationEndDate = value.delegationEndDate;
                                        roleContextObj.delegationEndDateEpoch = new Date(value.delegationEndDate).getTime() || "";
                                        roleContextObj.currentDelegatorId = value.currentDelegatorIdAttributeValue;
                                        roleContextObj.orginalDelegatorId = value.originalDelegatorIdAttributeValue;
                                        logger.error("[DEBUG-DELEGATION-ENDDATE] Built roleContextObj.delegationEndDate = " + roleContextObj.delegationEndDate);
                                    }

                                    enrollmentReqTemplate.roleContext.push(roleContextObj);
                                    logger.error("the data for enrollmentReqTemplate" + JSON.stringify(enrollmentReqTemplate.roleContext))
                                }
                            } else {
                                invalidRequestException.message.content = "Invalid request. Role Not Found :: " + value.roleIdAttributeValue;
                                invalidRequestException.timestamp = new Date().toISOString()
                                throw invalidRequestException
                            }
                        })
                    } else if (!isUserExist && !invitedUser._id) {
                        logger.error("user does not exist in ping or kog and _id is not there in payload")
                        // User does not exist or has no _id. create Enrollment Context
                        if (access && access.length > 0) {
                            access.forEach(value => {

                                let businessInfo = null;
                                if (value.businessAppIdAttribute && value.businessAppIdAttributeValue) {
                                    businessInfo = searchObjectByIdAttributeValue(
                                        input,
                                        "managed/alpha_kyid_businessapplication",
                                        value.businessAppIdAttribute,
                                        value.businessAppIdAttributeValue
                                    );
                                }

                                let query = `${value.roleIdAttribute} eq "${value.roleIdAttributeValue}" and businessAppId/_refResourceId eq "${businessInfo._id}"`;
                                let roleInfo = searchObjectByQuery(input, "managed/alpha_role", query)
                                logger.error("the roleInfo when user doesnt exist::: " + roleInfo)

                                //get names for aduit logger
                                roleAppObjects.roleNames.push(roleInfo.name)
                                roleAppObjects.applicationNames.push(businessInfo.name)

                                //For mutuallyExclusive function
                                requestedRoleApps.push({
                                    roleName: roleInfo.name,
                                    businessName: businessInfo.name
                                });

                                // Validate delegationEndDate against current delegator's delegation end date
                                validateDelegationEndDate(value, roleInfo._id, "(new user)");

                                // Create prereq object
                                let prereqObj = {
                                    roleId: roleInfo._id,
                                    applicationId: businessInfo._id,
                                    roleName: roleInfo.name,
                                    applicationName: businessInfo.name
                                };

                                logger.error("the prereqObj when _id is not present:::" + JSON.stringify(prereqObj))
                                rolewithPrereq.push(prereqObj);
                                // Push only if delegation-related attributes are present
                                if (
                                    value.isForwardDelegable ||
                                    value.delegationEndDate ||
                                    value.currentDelegatorIdAttributeValue ||
                                    value.originalDelegatorIdAttributeValue
                                ) {
                                    isDelegation = true
                                    prereqObj.isForwardDelegable = value.isForwardDelegable;
                                    prereqObj.delegationEndDate = value.delegationEndDate;
                                    prereqObj.delegationEndDateEpoch = value.delegationEndDate;
                                    prereqObj.currentDelegatorIdentifierAttributeName = value.currentDelegatorIdAttribute;
                                    prereqObj.currentDelegatorIdentifierAttributeValue = value.currentDelegatorIdAttributeValue;
                                    prereqObj.currentDelegatorUserAccountId = value.currentDelegatorIdAttributeValue;
                                    prereqObj.originalDelegatorUserAccountId = value.originalDelegatorIdAttributeValue;
                                    prereqObj.orginalDelegatorIdentifierAttributeValue = value.originalDelegatorIdAttributeValue;
                                    prereqObj.orginalDelegatorIdentifierAttributeName = value.originalDelegatorIdAttribute;

                                    // rolewithPrereq.push(prereqObj);
                                }

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

                    //Check if delegation invitation has original delegator attribute. If not, stop from sending invitation or creating enrollment request
                    if (isDelegation === true) {
                        let hasMissingDelegator =
                            (
                                rolewithPrereq &&
                                (
                                    rolewithPrereq.some(prereq => !prereq.orginalDelegatorIdentifierAttributeValue) ||
                                    rolewithPrereq.some(prereq => !prereq.currentDelegatorIdentifierAttributeValue)
                                )
                            ) ||
                            (
                                enrollmentReqTemplate.roleContext &&
                                (
                                    enrollmentReqTemplate.roleContext.some(ctx => !ctx.orginalDelegatorId) ||
                                    enrollmentReqTemplate.roleContext.some(ctx => !ctx.currentDelegatorId)
                                )
                            );

                        if (hasMissingDelegator) {
                            logger.error("Delegation Invitation::Payload missing originalDelegatorId or currentDelegatorId. Throwing error.");
                            return {
                                responseCode: "1",
                                message: {
                                    code: "KYID-EUE",
                                    content: "Role Provisioning Failed"
                                }
                            };
                        }
                    }
                    //For mutuallyExclusive Check for both the enrollment context and request
                    if (requestedRoleApps.length > 0) {
                        const conflictResult = checkMutuallyExclusiveRoles(requestedRoleApps, requestedUserAccountId || null);
                        if (conflictResult) {
                            logger.error("Conflict detected among requested roles. Throwing error.");
                            return {
                                responseCode: "1",
                                message: {
                                    code: "KYID-EUE",
                                    content: "Roles conflict - mutually exclusive roles cannot be requested together"
                                }
                            };
                        }
                    }

                    var finalResponse = null
                    // Create Enrollment Context if roles present
                    if (rolewithPrereq.length > 0) {
                        var currentEpoch = Date.now();
                        if (isUserExist) {
                            logger.error("user exist::createenrollmentContext")
                            queryFilterContext =
                                'requestedUserAccountId eq "' + requestedUserAccountId + '" AND ' +
                                '(recordState eq "0" OR recordState eq "ACTIVE") AND ' +
                                'status eq "0" AND ' +
                                'expiryDateEpoch gt ' + currentEpoch + ' AND ' +
                                'applicationRoles/[applicationId eq "' + rolewithPrereq[0].applicationId + '" AND ' +
                                'roleId eq "' + rolewithPrereq[0].roleId + '"]';
                        } else {
                            logger.error("user does not exist::createenrollmentContext")
                            const email = input.payload && input.payload.requestedUser && input.payload.requestedUser.email;
                            queryFilterContext =
                                '(' +
                                'requestedUserAccountAttibutes/[attributeName eq "primaryEmailAddress" AND attributeValue eq "' + email + '"] OR ' +
                                'requestedUserAccountAttibutes/[attributeName eq "mail" AND attributeValue eq "' + email + '"]' +
                                ') AND ' +
                                '(recordState eq "0" OR recordState eq "ACTIVE") AND ' +
                                'status eq "0" AND ' +
                                'expiryDateEpoch gt ' + currentEpoch + ' AND ' +
                                'applicationRoles/[applicationId eq "' + rolewithPrereq[0].applicationId + '" AND ' +
                                'roleId eq "' + rolewithPrereq[0].roleId + '"]';
                        }
                        let enrollmentContextResponse = openidm.query("managed/alpha_kyid_enrollment_contextId", {
                            "_queryFilter": queryFilterContext
                        });
                        if (enrollmentContextResponse && enrollmentContextResponse.result.length > 0) {
                            ContextIds = enrollmentContextResponse.result[0]._id;
                            logger.debug("existing enrollment context ID is " + ContextIds);
                        } else {
                            logger.error("rolewithPrereq length is gt 0" + JSON.stringify(rolewithPrereq))
                            contextRequestBody.applicationRoles = rolewithPrereq
                            if (isDelegation === true) {
                                let delegationExpiryDays = getDelegationInvitationExpiryDays(rolewithPrereq);
                                let delegationExpiryEpoch = Date.now() + delegationExpiryDays * 24 * 60 * 60 * 1000;
                                contextRequestBody.expiryDate = new Date(delegationExpiryEpoch).toISOString();
                                contextRequestBody.expiryDateEpoch = delegationExpiryEpoch;
                                logger.info("[DELEGATION] rolewithPrereq path: expiry set to " + delegationExpiryDays + " days");
                            }
                            let createContextIdResponse = createRecord("alpha_kyid_enrollment_contextId", contextRequestBody)
                            ContextIds = createContextIdResponse._id;
                        }
                        if (ContextIds) {
                            logger.error("createContextIdResponse successful")
                            const ContextId = ContextIds

                            if (isReverify === true) {
                                logger.error("createContextIdResponse successful for reverify prerequisite. No invitation Email to be sent.")

                                finalResponse = {
                                    responseCode: "0",
                                    message: {
                                        code: "000",
                                        content: "success"
                                    },
                                    payload: {
                                        message: ContextId
                                    }
                                };

                            } else {

                                //Email Fields
                                var applicationNames = roleAppObjects.applicationNames.toString() || ""
                                logger.error("application Name is ---->>>" + applicationNames);

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

                                //Get the role names for email template

                                //for unique application name
                                var uniqueAppNamesObj = {};
                                var uniqueAppNamesArr = [];
                                for (var i = 0; i < roleAppObjects.applicationNames.length; i++) {
                                    var app = roleAppObjects.applicationNames[i];
                                    if (!uniqueAppNamesObj[app]) {
                                        uniqueAppNamesObj[app] = true;
                                        uniqueAppNamesArr.push(app);
                                    }
                                }
                                var applicationNamesHtml = uniqueAppNamesArr.join(", ");
                                let sendEmailResponse = ""
                                let emailTemplateName = ""
                                if (isDelegation === true) {
                                    logger.error("invitation::isDelegation TRUE")
                                    emailTemplateName = "kyid2B1DelegationInvitationTemplate";

                                    // Reuse buildRoleEmailContent - map field names
                                    let rolesForEmail2 = rolewithPrereq.map(function(r) {
                                        return { appName: r.applicationName, roleName: r.roleName, delegationEndDate: r.delegationEndDate };
                                    });
                                    let emailContent2 = buildRoleEmailContent(rolesForEmail2, requesterFullName);

                                    //logger.error("Invitation values = "+":"+emailTemplateName+":"+ ContextId+":"+ input.payload.requestedUser.firstName+":"+ input.payload.requestedUser.lastName+":"+ input.payload.requestedUser.email+":"+ isUserExist+":"+ applicationNamesHtml+":"+requesterFullName+":"+emailContent2.roleNamesHtml)
                                    sendEmailResponse = sendEmail(emailTemplateName, ContextId, input.payload.requestedUser.firstName, input.payload.requestedUser.lastName, input.payload.requestedUser.email, isUserExist, requesterFullName, emailContent2.roleNamesHtml, applicationNamesHtml, true, locale, emailContent2.hasDelegationEndDate)

                                } else {
                                    let roleNamesHtml = "<ul style='list-style-type:none;padding:0;margin:0'>";

                                    rolewithPrereq.forEach(function(role, index) {
                                        if (role.roleName && role.applicationName) {
                                            roleNamesHtml += "<li style='padding:5px 0'><strong>" + role.applicationName + ":</strong> " + role.roleName + "</li>";
                                        }
                                    });
                                    roleNamesHtml += "</ul>";

                                    emailTemplateName = "kyid2B1AccessDelegationInviteTemplate";
                                    // logger.error("Invitation values = 2"+":"+emailTemplateName+":"+ ContextId+":"+ input.payload.requestedUser.firstName+":"+ input.payload.requestedUser.lastName+":"+ input.payload.requestedUser.email+":"+ isUserExist+":"+ applicationNamesHtml+":"+requesterFullName+":"+roleNamesHtml)

                                    sendEmailResponse = sendEmail(emailTemplateName, ContextId, input.payload.requestedUser.firstName, input.payload.requestedUser.lastName, input.payload.requestedUser.email, isUserExist, requesterFullName, roleNamesHtml, applicationNamesHtml, false, locale)

                                }

                                if (sendEmailResponse) {

                                    //auditlogger lines
                                    let eventDetails = {
                                        roleNames: roleAppObjects.roleNames,
                                        applicationNames: roleAppObjects.applicationNames,
                                        invitationId: ContextId
                                    }

                                    auditLogger("INA001", "Send Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                                    finalResponse = {
                                        responseCode: "0",
                                        message: {
                                            code: "KYID-SUS",
                                            content: "success"
                                        },
                                        payload: {
                                            message: ContextId,
                                            status: "Invitation Sent Successfully",
                                        }
                                    };

                                } else {

                                    //auditlogger lines
                                    let eventDetails = {
                                        roleNames: roleAppObjects.roleNames,
                                        applicationNames: roleAppObjects.applicationNames,
                                        invitationId: ContextId,
                                        message: "Invitation sent Failure"
                                    }

                                    auditLogger("INA002", "Send Invitation Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger)

                                    finalResponse = {
                                        responseCode: "1",
                                        message: {
                                            code: "KYID-EUE",
                                            content: "failed"
                                        },
                                        payload: {
                                            message: null,
                                            status: "Invitation Sending Failed",
                                        }
                                    };
                                }
                            }
                        } else {
                            logger.error("Enrollment Context is not created")
                            finalResponse = {
                                responseCode: "1",
                                message: {
                                    code: "KYID-EUE",
                                    content: "failed"
                                },
                                payload: {
                                    message: null,
                                    status: "Invitation Sending Failed",
                                }
                            };
                        }
                    }

                    // Create Enrollment Request if roles present
                    if (enrollmentReqTemplate.roleContext.length > 0) {
                        logger.error("the enrollmentReqTemplate length is greater than 0 " + JSON.stringify(enrollmentReqTemplate))

                        // For delegation, split roles by alwaysSendInvitation
                        let rolesImmediate = []; // alwaysSendInvitation=false or non-delegation
                        let rolesNeedEmail = []; // alwaysSendInvitation=true (delegation only)

                        if (isDelegation === true) {
                            enrollmentReqTemplate.roleContext.forEach(function(ctx) {
                                if (ctx.alwaysSendInvitation === true) {
                                    rolesNeedEmail.push(ctx);
                                } else {
                                    rolesImmediate.push(ctx);
                                }
                            });
                            logger.error("[DELEGATION] Total roles: " + enrollmentReqTemplate.roleContext.length);
                            logger.error("[DELEGATION] Roles immediate (alwaysSendInvitation=false): " + rolesImmediate.length);
                            logger.error("[DELEGATION] Roles need email (alwaysSendInvitation=true): " + rolesNeedEmail.length);
                        } else {
                            // Non-delegation: all roles are immediate
                            rolesImmediate = enrollmentReqTemplate.roleContext;
                            logger.error("[NON-DELEGATION] Processing all " + rolesImmediate.length + " roles");
                        }

                        // ============================================================
                        // PART 1: Immediate role assignment (non-delegation OR delegation with alwaysSendInvitation=false)
                        // ============================================================
                        if (rolesImmediate.length > 0) {
                            let immediateResult = findOrCreateEnrollmentRequest(rolesImmediate, requestedUserAccountId, enrollmentReqTemplate);
                            if (immediateResult && immediateResult.requestId) {
                                let immediateRequestId = immediateResult.requestId;
                                logger.error("[IMMEDIATE] Using enrollment_request: " + immediateRequestId);

                                // Assign roles immediately
                                const accessResponse = invokeRoleAccess(requestedUserAccountId, immediateRequestId);
                                if (accessResponse && accessResponse.status === "success") {
                                    logger.error("[IMMEDIATE] Access provisioned successfully for user: " + requestedUserAccountId);
                                    // Note: Email is already sent by access.js addRolesToUser() using kyid2B1RoleAdded template
                                    // No need to send duplicate email here

                                    // Audit log and response
                                    let eventDetails = {
                                        roleNames: rolesImmediate.map(function(r) {
                                            return r.roleName;
                                        }),
                                        applicationNames: rolesImmediate.map(function(r) {
                                            return r.appName;
                                        }),
                                        enrollmentRequestID: immediateRequestId
                                    };
                                    auditLogger("ROM001", "Add Role Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id || requestedUserAccountId, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger);

                                    // Set success response if no email roles to process
                                    if (rolesNeedEmail.length === 0) {
                                        finalResponse = {
                                            responseCode: "0",
                                            message: {
                                                code: "KYID-SUS",
                                                content: "success"
                                            },
                                            payload: {
                                                message: immediateRequestId
                                            }
                                        };
                                    }
                                } else {
                                    logger.error("[IMMEDIATE] Access provisioning failed: " + JSON.stringify(accessResponse));
                                    let eventDetails = {
                                        roleNames: rolesImmediate.map(function(r) {
                                            return r.roleName;
                                        }),
                                        applicationNames: rolesImmediate.map(function(r) {
                                            return r.appName;
                                        }),
                                        enrollmentRequestID: immediateRequestId,
                                        message: JSON.stringify(accessResponse)
                                    };
                                    auditLogger("ROM002", "Add Role Failure", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id || requestedUserAccountId, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger);
                                    finalResponse = {
                                        responseCode: "1",
                                        message: {
                                            code: "KYID-EUE",
                                            content: "Role Provisioning Failed"
                                        }
                                    };
                                }
                            }
                        }

                        // ============================================================
                        // PART 2: Delegation with alwaysSendInvitation=true -> send invitation email (with link)
                        // ============================================================
                        if (isDelegation === true && rolesNeedEmail.length > 0) {
                            logger.error("[DELEGATION-EMAIL] Processing " + rolesNeedEmail.length + " roles that need email invitation");

                            // Build applicationRoles for enrollment_contextId
                            let delegationAppRoles = rolesNeedEmail.map(function(ctx) {
                                return buildDelegationAppRole(ctx);
                            });
                            let delegationContextBody = buildEnrollmentContextBody(delegationAppRoles, enrollmentReqTemplate, input, requestedUserAccountId);

                            // Override expiry for delegation invitation
                            let delegationExpiryDays = getDelegationInvitationExpiryDays(delegationAppRoles);
                            let delegationExpiryEpoch = Date.now() + delegationExpiryDays * 24 * 60 * 60 * 1000;
                            delegationContextBody.expiryDate = new Date(delegationExpiryEpoch).toISOString();
                            delegationContextBody.expiryDateEpoch = delegationExpiryEpoch;
                            logger.info("[DELEGATION-EMAIL] alwaysSendInvitation path: expiry set to " + delegationExpiryDays + " days");

                            // Find or create enrollment_contextId
                            let userEmail = input.payload && input.payload.requestedUser && input.payload.requestedUser.email;
                            let contextResult = findOrCreateEnrollmentContextId(rolesNeedEmail, requestedUserAccountId, delegationContextBody, isUserExist, userEmail);

                            if (contextResult && contextResult.contextId) {
                                let delegationContextId = contextResult.contextId;
                                logger.error("[DELEGATION-EMAIL] " + (contextResult.isNew ? "Created" : "Reused") + " enrollment_contextId: " + delegationContextId);

                                // FIX: Do NOT create enrollment_request here for delegation roles with alwaysSendInvitation=true
                                // The enrollment_request will be created by enrollment.js when user clicks the invitation link
                                // This prevents:
                                // 1. Duplicate enrollment_request records (one IN_PROGRESS here, one COMPLETED later)
                                // 2. The bug where getActiveEnrollmentRequest() finds the existing record and takes early return path
                                //    (which skips updating enrollment_contextId status from ACTIVE to USED)
                                logger.error("[DELEGATION-EMAIL] Skipping enrollment_request creation - will be created when user clicks link");

                                // Get requester info for email
                                let emailRequesterFirstName = "";
                                let emailRequesterLastName = "";
                                if (input.payload.requesterAccountId) {
                                    let emailRequesterUser = searchObjectByIdAttributeValue(input, "managed/alpha_user", "_id", input.payload.requesterAccountId);
                                    if (emailRequesterUser) {
                                        emailRequesterFirstName = emailRequesterUser.firstName || emailRequesterUser.givenName || "";
                                        emailRequesterLastName = emailRequesterUser.lastName || emailRequesterUser.sn || "";
                                    }
                                }
                                let emailRequesterFullName = (emailRequesterFirstName + " " + emailRequesterLastName).trim();

                                // Generate roleNamesHtml for email roles
                                let emailContent = buildRoleEmailContent(rolesNeedEmail, emailRequesterFullName);

                                // Send invitation email with link
                                let delegationSendEmailResponse = sendEmail(
                                    "kyid2B1DelegationInvitationTemplate",
                                    delegationContextId, // contextId - creates link in email (enrollment_contextId ID)
                                    input.payload.requestedUser.firstName,
                                    input.payload.requestedUser.lastName,
                                    input.payload.requestedUser.email,
                                    isUserExist,
                                    emailRequesterFullName,
                                    emailContent.roleNamesHtml,
                                    emailContent.applicationNames.join(", "),
                                    true,
                                    locale,
                                    emailContent.hasDelegationEndDate
                                );

                                if (delegationSendEmailResponse) {
                                    logger.error("[DELEGATION-EMAIL] Email sent successfully");
                                    let eventDetails = {
                                        roleNames: rolesNeedEmail.map(function(r) {
                                            return r.roleName;
                                        }),
                                        applicationNames: emailContent.applicationNames,
                                        enrollmentContextId: delegationContextId
                                    };
                                    auditLogger("INA001", "Send Invitation Success", input.auditLogger.sessionDetailsauditLogger, eventDetails, input.payload.requesterAccountId, input.payload.requestedUser._id, input.auditLogger.transactionIdauditLogger, input.payload.requestedUser.email || "", eventDetails.applicationNames.toString(), input.auditLogger.sessionRefIDauditLogger);

                                    finalResponse = {
                                        responseCode: "0",
                                        message: {
                                            code: "KYID-SUS",
                                            content: "success"
                                        },
                                        payload: {
                                            message: delegationContextId
                                        }
                                    };
                                } else {
                                    logger.error("[DELEGATION-EMAIL] Failed to send email");
                                    finalResponse = {
                                        responseCode: "1",
                                        message: {
                                            code: "KYID-EUE",
                                            content: "Failed to send invitation email"
                                        }
                                    };
                                }
                            } else {
                                logger.error("[DELEGATION-EMAIL] Failed to get or create enrollment_contextId");
                            }
                        }

                    }
                    return finalResponse
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
        unexpectedException.message.content = `An unexpected error occured. Error: ${JSON.stringify(getException(error))}`
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}

// Helper function: Build applicationRole object for enrollment_contextId
function buildDelegationAppRole(ctx) {
    return {
        roleId: ctx.roleId,
        applicationId: ctx.applicationId,
        roleName: ctx.roleName,
        applicationName: ctx.appName,
        isForwardDelegable: ctx.isForwardDelegable || false,
        delegationEndDate: ctx.delegationEndDate || null,
        delegationEndDateEpoch: ctx.delegationEndDateEpoch || null,
        currentDelegatorIdentifierAttributeName: "KYID",
        currentDelegatorIdentifierAttributeValue: ctx.currentDelegatorId,
        currentDelegatorUserAccountId: ctx.currentDelegatorId,
        originalDelegatorUserAccountId: ctx.orginalDelegatorId,
        orginalDelegatorIdentifierAttributeValue: ctx.orginalDelegatorId,
        orginalDelegatorIdentifierAttributeName: "KYID"
    };
}

// Helper function: Build enrollment_contextId body
function buildEnrollmentContextBody(appRoles, enrollmentReqTemplate, input, requestedUserAccountId) {
    return {
        applicationRoles: appRoles,
        "createDate": new Date().toISOString(),
        "createDateEpoch": Date.now(),
        "createdBy": "KYID-System",
        "expiryDate": enrollmentReqTemplate.expiryDate,
        "expiryDateEpoch": enrollmentReqTemplate.expiryDateEpoch,
        "recordSource": "1",
        "recordState": "0",
        "showConfirmationPage": "false",
        "requestedUserAccountAttibutes": [{
                "attributeName": "legalFirstName",
                "attributeValue": input.payload.requestedUser.firstName || null,
                "isReadOnly": false
            },
            {
                "attributeName": "legalLastName",
                "attributeValue": input.payload.requestedUser.lastName || null,
                "isReadOnly": false
            },
            {
                "attributeName": "primaryEmailAddress",
                "attributeValue": input.payload.requestedUser.email || null,
                "isReadOnly": true
            }
        ],
        "requestedUserAccountId": requestedUserAccountId || null,
        "requestedUserIdentifierAttributeName": "KYID",
        "requestedUserIdentifierAttributeValue": requestedUserAccountId || null,
        "requesterUserAccountId": input.payload.requesterAccountId,
        "requesterUserIdentifierAttributeName": "KYID",
        "requesterUserIdentifierAttributeValue": input.payload.requesterAccountId,
        "status": "0",
        "updateDate": new Date().toISOString(),
        "updateDateEpoch": Date.now(),
        "updatedBy": "KYID-System"
    };
}

// Helper function: Get delegation invitation expiry days
// Priority: role.invitationExpiryDuration (max) → ESV → default 7 days
function getDelegationInvitationExpiryDays(applicationRoles) {
    let maxRoleExpiry = 0;
    if (applicationRoles && applicationRoles.length > 0) {
        applicationRoles.forEach(function(role) {
            try {
                let roleObj = openidm.read("managed/alpha_role/" + role.roleId);
                if (roleObj && roleObj.invitationExpiryDuration && Number(roleObj.invitationExpiryDuration) > 0) {
                    let dur = Number(roleObj.invitationExpiryDuration);
                    if (dur > maxRoleExpiry) {
                        maxRoleExpiry = dur;
                    }
                }
            } catch (e) {
                logger.warn("getDelegationInvitationExpiryDays: Error reading role " + role.roleId + ": " + e);
            }
        });
    }
    if (maxRoleExpiry > 0) {
        logger.info("getDelegationInvitationExpiryDays: Using role invitationExpiryDuration = " + maxRoleExpiry + " days");
        return maxRoleExpiry;
    }
    let esvExpiry = identityServer.getProperty("esv.enrollment.defaultdelegationexpiryduration");

    if (esvExpiry && Number(esvExpiry) > 0) {
        logger.info("getDelegationInvitationExpiryDays: Using ESV defaultdelegationexpiryduration = " + esvExpiry + " days");
        return Number(esvExpiry);
    }
    logger.warn("getDelegationInvitationExpiryDays: No role or ESV config found, using default 7 days");
    return 7;
}

// Helper function: Build roleIds array from roleContext
function buildRoleIds(roles) {
    let roleIds = [];
    roles.forEach(function(ctx) {
        roleIds.push({
            "_ref": "managed/alpha_role/" + ctx.roleId,
            "_refProperties": {}
        });
    });
    return roleIds;
}

// Helper function: Build roleNamesHtml (full table) and applicationNames from roles
function buildRoleEmailContent(roles, addedBy) {
    let applicationNames = [];

    // Check if any role has delegationEndDate
    var hasDelegationEndDate = false;
    roles.forEach(function(role) {
        if (role.delegationEndDate) hasDelegationEndDate = true;
    });

    var emailTimeStamp = isoToEastern();
    var rowCount = roles.length;

    // Build only <tr> rows (table/thead are in the email template)
    let roleNamesHtml = "";
    roles.forEach(function(role, index) {
        roleNamesHtml += "<tr>";
        roleNamesHtml += "<td>" + role.appName + "</td>";
        roleNamesHtml += "<td>" + role.roleName + "</td>";
        if (hasDelegationEndDate) {
            roleNamesHtml += "<td>" + (role.delegationEndDate ? formatDateDisplay(role.delegationEndDate) : "") + "</td>";
        }
        if (index === 0) {
            roleNamesHtml += "<td rowspan='" + rowCount + "' style='vertical-align:middle'>" + (addedBy || "") + "</td>";
            roleNamesHtml += "<td rowspan='" + rowCount + "' style='vertical-align:middle'>" + emailTimeStamp + "</td>";
        }
        roleNamesHtml += "</tr>";
        if (role.appName && applicationNames.indexOf(role.appName) === -1) {
            applicationNames.push(role.appName);
        }
    });

    return {
        roleNamesHtml: roleNamesHtml,
        applicationNames: applicationNames,
        hasDelegationEndDate: hasDelegationEndDate
    };
}

// Helper function: Find existing enrollment_contextId or create new one
function findOrCreateEnrollmentContextId(roleContext, requestedUserAccountId, contextBody, isUserExist, email) {
    // Build query filter for existing enrollment_contextId
    var roleFilters = [];
    for (var i = 0; i < roleContext.length; i++) {
        var ctx = roleContext[i];
        var filter = 'applicationRoles/[applicationId eq "' + ctx.applicationId + '" AND roleId eq "' + ctx.roleId + '"';
        if (ctx.currentDelegatorId) {
            filter += ' AND currentDelegatorUserAccountId eq "' + ctx.currentDelegatorId + '"';
        }
        if (ctx.originalDelegatorId) {
            filter += ' AND originalDelegatorUserAccountId eq "' + ctx.originalDelegatorId + '"';
        }
        filter += ']';
        roleFilters.push(filter);
    }
    var combinedRoleFilter = roleFilters.join(' AND ');

    var currentEpoch = Date.now();
    var queryFilter;
    if (isUserExist && requestedUserAccountId) {
        // User exists - query by requestedUserAccountId
        queryFilter = 'requestedUserAccountId eq "' + requestedUserAccountId + '" AND ' +
            '(recordState eq "0" OR recordState eq "ACTIVE") AND ' +
            'status eq "0" AND ' +
            'expiryDateEpoch gt ' + currentEpoch + ' AND ' +
            '(' + combinedRoleFilter + ')';
    } else if (email) {
        // User does not exist - query by email
        queryFilter = '(' +
            'requestedUserAccountAttibutes/[attributeName eq "primaryEmailAddress" AND attributeValue eq "' + email + '"] OR ' +
            'requestedUserAccountAttibutes/[attributeName eq "mail" AND attributeValue eq "' + email + '"]' +
            ') AND ' +
            '(recordState eq "0" OR recordState eq "ACTIVE") AND ' +
            'status eq "0" AND ' +
            'expiryDateEpoch gt ' + currentEpoch + ' AND ' +
            '(' + combinedRoleFilter + ')';
    } else {
        logger.error("[ENROLLMENT-CONTEXT] Cannot build query - no requestedUserAccountId or email");
        return null;
    }

    logger.error("[ENROLLMENT-CONTEXT] Checking for existing enrollment_contextId with query: " + queryFilter);
    var existingResponse = openidm.query("managed/alpha_kyid_enrollment_contextId", {
        "_queryFilter": queryFilter
    });

    if (existingResponse && existingResponse.result && existingResponse.result.length > 0) {
        // Reuse existing enrollment_contextId
        var existingContextId = existingResponse.result[0]._id;
        logger.error("[ENROLLMENT-CONTEXT] Reusing existing enrollment_contextId: " + existingContextId);
        return {
            contextId: existingContextId,
            isNew: false
        };
    } else {
        // Create new enrollment_contextId
        logger.error("[ENROLLMENT-CONTEXT] Creating new enrollment_contextId");
        var createResponse = createRecord("alpha_kyid_enrollment_contextId", contextBody);
        if (createResponse && createResponse._id) {
            logger.error("[ENROLLMENT-CONTEXT] Created new enrollment_contextId: " + createResponse._id);
            return {
                contextId: createResponse._id,
                isNew: true
            };
        }
        logger.error("[ENROLLMENT-CONTEXT] Failed to create enrollment_contextId");
        return null;
    }
}

// Helper function: Find existing enrollment_request or create new one
function findOrCreateEnrollmentRequest(roleContext, requestedUserAccountId, enrollmentReqTemplate) {
    // Build query filter for existing enrollment_request
    var roleFilters = [];
    for (var rc = 0; rc < roleContext.length; rc++) {
        var currentRole = roleContext[rc];
        roleFilters.push(
            'roleContext/[applicationId eq "' + currentRole.applicationId + '" AND roleId eq "' + currentRole.roleId + '"]'
        );
    }
    var combinedRoleFilter = roleFilters.join(' AND ');
    var currentEpoch = Date.now();
    var queryFilterRequest =
        '(status eq "IN_PROGRESS") AND ' +
        '(recordState eq "0" OR recordState eq "ACTIVE") AND ' +
        'requestedUserId eq "' + requestedUserAccountId + '" AND ' +
        'expiryDateEpoch gt ' + currentEpoch + ' AND ' +
        '(' + combinedRoleFilter + ')';

    let enrollmentResponse = openidm.query("managed/alpha_kyid_enrollment_request", {
        "_queryFilter": queryFilterRequest
    });

    if (enrollmentResponse && enrollmentResponse.result.length > 0) {
        // Reuse existing enrollment_request and update roleContext
        let existingRequestId = enrollmentResponse.result[0]._id;
        logger.error("[ENROLLMENT-REUSE] Reusing existing enrollment_request: " + existingRequestId);

        // Update roleContext and roleIds with new values
        try {
            let updatedRoleIds = buildRoleIds(roleContext);
            openidm.patch("managed/alpha_kyid_enrollment_request/" + existingRequestId, null, [{
                    "operation": "replace",
                    "field": "/roleContext",
                    "value": roleContext
                },
                {
                    "operation": "replace",
                    "field": "/roleIds",
                    "value": updatedRoleIds
                }
            ]);
            logger.error("[ENROLLMENT-REUSE] Updated roleContext and roleIds for existing enrollment_request");
        } catch (patchErr) {
            logger.error("[ENROLLMENT-REUSE] Failed to update roleContext/roleIds: " + patchErr);
        }

        return {
            requestId: existingRequestId,
            isNew: false
        };
    } else {
        // Create new enrollment_request
        let newEnrollmentReq = JSON.parse(JSON.stringify(enrollmentReqTemplate));
        newEnrollmentReq.roleContext = roleContext;
        newEnrollmentReq.roleIds = buildRoleIds(roleContext);

        let createResponse = createRecord("alpha_kyid_enrollment_request", newEnrollmentReq);
        if (createResponse && createResponse._id) {
            logger.error("[ENROLLMENT-NEW] Created new enrollment_request: " + createResponse._id);
            return {
                requestId: createResponse._id,
                isNew: true
            };
        }
        return null;
    }
}

function addRolesToUser(roles, id) {
    try {
        let patchArray = [];

        roles.forEach(function(role) {
            let patchOperation = {
                "operation": "add",
                "field": "/roles/-",
                "value": {
                    "_ref": "managed/alpha_role/" + role._id
                }
            };
            patchArray.push(patchOperation);
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
        logger.error("invokeRoleAccess raw response for access endpoint: " + JSON.stringify(response));

        if (response && response.status) {
            if (response.status === "success") {
                logger.error("invokeRoleAccess SUCCESS: " + JSON.stringify(response));
                return response;
            } else {
                logger.error("invokeRoleAccess FAILED: " + JSON.stringify(response));
                return {
                    status: "failed",
                    rawResponse: response
                };
            }
        } else {
            logger.error("invokeRoleAccess EMPTY or invalid response.");
            return {
                status: "error",
                rawResponse: response
            };
        }

        // Always return response, even if it's empty or failed
        //return response || {};
    } catch (error) {
        logger.error("invokeRoleAccess ERROR: " + JSON.stringify(error));
        // just return error object
        //return { error: error };
        return {
            status: "error",
            error: error
        };
    }
}

/**This is audit logger to capture user activity
 *
 * @param eventCode
 * @param sessionDetails
 * @param eventName
 * @param eventDetails
 * @param requesterUserId
 * @param requestedUserId
 * @param transactionId
 * @param emailId
 * @param applicationName
 * @param sessionRefId
 */
function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
    try {
        logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();
        let userAgent = context.http && context.http.headers && context.http.headers['User-Agent'] ? context.http.headers['User-Agent'] : "";
        let Ipaddress = context.http && context.http.headers && context.http.headers['x-real-ip'] ? context.http.headers['x-real-ip'] : "";
        let os = context.http && context.http.headers && context.http.headers['sec-ch-ua-platform'] ? context.http.headers['sec-ch-ua-platform'] : "";
        os = os ? os.replace(/^"|"$/g, '').replace(/\\"/g, '') : "";
        //Fetch the requesterEmail ID
        var requesteremailID ="";
        if(requesterUserId && requesterUserId !== ""){
          var userQueryFilter = '(_id eq "' + requesterUserId + '")';
          var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["mail"]); 
          if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
            requesteremailID = requesterUserObj.result[0].mail;
          }
        }
        if (eventDetails) {
            eventDetails.browser = typeof userAgent !== "undefined" ? userAgent : "";
            eventDetails.os = typeof os !== "undefined" ? os : "";
            eventDetails.IP = typeof Ipaddress !== "undefined" ? Ipaddress : "";
        }

       //Defect Fix# 211192 (Unknown Location) - 03/12  ----BEGIN
          sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
           sessionRefId = deepParse(sessionRefId)
           logger.error("In endpoint/invitation_draftV3:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))

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
        
            logger.error("***placeParts in endpoint/invitation_draftV3 => "+placeParts)
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
          requesterUseremailID: requesteremailID,
          requestedUseremailID: emailId || "",
          place: place || ""   //Defect Fix# 211192 (Unknown Location) - 03/12
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        var sendLogstoDBandMO = identityServer.getProperty("esv.sendauditlogs.db.mo");
      if(sendLogstoDBandMO === "true"|| sendLogstoDBandMO === true){
       const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
      }

      //23-Feb (PA) for sending logs to DB
      try{
   const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
   logger.error("Response from sendAuditLogstoDB is - "+JSON.stringify(sendlogstoDB))
   } catch(error){
	logger.error("Exception is -"+error)
   }
      
    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
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


function checkMutuallyExclusiveRoles(requestedRoleApps, requestedUserId) {
    logger.error("=== Start: checkMutuallyExclusiveRoles ===");
    logger.error("checkMutuallyExclusiveRoles Requested User ID: " + requestedUserId);
    logger.error("checkMutuallyExclusiveRoles Requested Role Apps: " + JSON.stringify(requestedRoleApps));

    // Build current user roles if user already exists
    var currentRoleIds = [];
    if (requestedUserId) {
        logger.error("checkMutuallyExclusiveRoles Fetching existing roles for user: " + requestedUserId);
        var userObj = openidm.read("managed/alpha_user/" + requestedUserId);
        if (userObj && userObj.effectiveRoles) {
            logger.error("checkMutuallyExclusiveRoles User found. Effective roles: " + JSON.stringify(userObj.effectiveRoles));
            for (var i = 0; i < userObj.effectiveRoles.length; i++) {
                currentRoleIds.push(userObj.effectiveRoles[i]._refResourceId);
            }
        } else {
            logger.error("checkMutuallyExclusiveRoles User has no effective roles or userObj not found.");
        }
    } else {
        logger.error("checkMutuallyExclusiveRoles No requestedUserId provided, skipping existing role check.");
    }
    logger.error("checkMutuallyExclusiveRoles Current Role IDs: " + JSON.stringify(currentRoleIds));

    // Gather requested roleIds + exclusive mappings
    var requestedRoleIds = [];
    var exclusiveMap = {};

    for (var i = 0; i < requestedRoleApps.length; i++) {
        var r = requestedRoleApps[i];
        logger.error("checkMutuallyExclusiveRoles Processing requested role: " + JSON.stringify(r));

        // Find businessApp by name
        var appQuery = openidm.query("managed/alpha_kyid_businessapplication", {
            "_queryFilter": 'name eq "' + r.businessName + '"'
        });
        if (!appQuery || !appQuery.result || appQuery.result.length === 0) {
            logger.error("Business app not found: " + r.businessName);
            continue;
        }
        var appId = appQuery.result[0]._id;
        logger.error("checkMutuallyExclusiveRoles Business App found: " + r.businessName + " --> " + appId);

        // Find role by name + appId
        var roleQuery = openidm.query("managed/alpha_role", {
            "_queryFilter": 'name eq "' + r.roleName + '" and businessAppId/_refResourceId eq "' + appId + '"'
        });
        if (!roleQuery || !roleQuery.result || roleQuery.result.length === 0) {
            logger.error("Role not found: " + r.roleName + " for app " + r.businessName);
            continue;
        }

        var role = roleQuery.result[0];
        requestedRoleIds.push(role._id);
        logger.error("Role found: " + role.name + " --> " + role._id);

        // Read access policy → mutuallyExclusiveRole list
        if (role.accessPolicy && role.accessPolicy._refResourceId) {
           logger.error("checkMutuallyExclusiveRoles RoleInfo found for role: " + role);
            logger.error("checkMutuallyExclusiveRoles Access policy found for role: " + role.name);
            var policy = openidm.read("managed/alpha_kyid_enrollment_access_policy/" + role.accessPolicy._refResourceId);
            if (policy && policy.mutuallyExclusiveRole && policy.mutuallyExclusiveRole.length > 0) {
                logger.error("checkMutuallyExclusiveRoles Mutually exclusive roles defined: " + JSON.stringify(policy.mutuallyExclusiveRole));
                if (!exclusiveMap[role._id]) {
                    exclusiveMap[role._id] = [];
                }
                for (var k = 0; k < policy.mutuallyExclusiveRole.length; k++) {
                    var exclusiveRoleId = policy.mutuallyExclusiveRole[k]._refResourceId || policy.mutuallyExclusiveRole[k]._id

                    exclusiveMap[role._id].push(exclusiveRoleId);
                }
            } else {
                logger.error("checkMutuallyExclusiveRoles No mutually exclusive roles for policy: " + role.accessPolicy._refResourceId);
            }
        } else {
            logger.error("checkMutuallyExclusiveRoles No access policy for role: " + role.name);
        }
    }

    logger.error("checkMutuallyExclusiveRoles Exclusive Map: " + JSON.stringify(exclusiveMap));
    logger.error("checkMutuallyExclusiveRoles Requested Role IDs: " + JSON.stringify(requestedRoleIds));

    // Check conflicts with current roles
    for (var base in exclusiveMap) {
        for (var j = 0; j < currentRoleIds.length; j++) {
            if (exclusiveMap[base].indexOf(currentRoleIds[j]) > -1) {
                logger.error("checkMutuallyExclusiveRoles Conflict detected with current role: " + currentRoleIds[j] + " for base role: " + base);
                return true;
            }
        }
    }

    // Check conflicts among requested roles themselves
    for (var x = 0; x < requestedRoleIds.length; x++) {
        for (var y = x + 1; y < requestedRoleIds.length; y++) {
            var baseId = requestedRoleIds[x];
            if (exclusiveMap[baseId] && exclusiveMap[baseId].indexOf(requestedRoleIds[y]) > -1) {
                logger.error("checkMutuallyExclusiveRoles Conflict detected among requested roles: " + requestedRoleIds[x] + " & " + requestedRoleIds[y]);
                return true;
            }
        }
    }

    logger.error("checkMutuallyExclusiveRoles No conflicts detected. Exiting checkMutuallyExclusiveRoles.");
    return false;
}