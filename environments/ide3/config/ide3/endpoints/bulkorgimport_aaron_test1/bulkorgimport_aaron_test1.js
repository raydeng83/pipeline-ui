/**
 * @name bulkorgimport
 * @description Bulk Import: Organization & Organization Profile endpoint.
 *              Handles create/update (upsert) and soft delete of organizations
 *              and their associated organization profiles.
 *
 * @param {request} request - The request object
 * @param {context} context - The context of the request
 *
 * @date  2026-03-31
 * @author aaronwang
 */

(function () {

    // NOTE: Authorization check disabled for testing via REST calls
    // const validateEndptRequestBody = {
    //     "payload": context,
    //     "action": 0
    // }
    //
    // try {
    //     let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
    //     logger.error("Validate endpoint authorization response => " + JSON.stringify(res))
    //     if (res.status === 200) {
    //         logger.error("Continue executing endpoint...")
    //     } else {
    //         return res
    //     }
    // } catch (error) {
    //     logger.error("Exception caught => " + getException(error))
    //     return { "status": 500, "message": error }
    // }

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

    const ACTION_IMPORT = "1"
    const ACTION_REMOVE = "2"
    const ACTION_SEARCH = "3"

    const ENDPOINT_NAME = "endpoint/bulkorgimport_aaron_test1"
    const ORG_MO = "managed/alpha_organization"
    const ORG_PROFILE_MO = "managed/alpha_kyid_organization_profile"

    /* Input */
    const input = {
        "_ENDPOINT_NAME": ENDPOINT_NAME,
        "_ORG_MO": ORG_MO,
        "_ORG_PROFILE_MO": ORG_PROFILE_MO,
        "transactionId": "349834038398340",
        "auditLogger": auditLoggerObj,
        "payload": {}
    }

    let response = null

    try {
        const requestContent = getRequestContent(context, request, ENDPOINT_NAME)
        var authenticatedUserId = context.security && context.security.authorization && context.security.authorization.id;
        logger.error("the user id bulkorgimport : " + authenticatedUserId);

        let result
        switch (request.method) {

            case REQUEST_POST:
                const action = requestContent.action

                if (action == ACTION_IMPORT) {
                    input.payload = requestContent.payload
                    input.payload.requesterAccountId = authenticatedUserId;

                    result = processOrgImport(input)
                    logger.error("result is: " + JSON.stringify(result))
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                    logger.error("Bulk Org Import final response : " + JSON.stringify(response));

                } else if (action == ACTION_REMOVE) {
                    input.payload = requestContent.payload
                    input.payload.requesterAccountId = authenticatedUserId;

                    result = processOrgRemove(input)
                    logger.error("result is: " + JSON.stringify(result))
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })

                } else if (action == ACTION_SEARCH) {
                    input.payload = requestContent.payload
                    result = searchOrgs(input)
                    response = generateResponse(RESPONSE_CODE_SUCCESS, input.transactionId, SUCCESS_MESSAGE, {
                        result: result
                    })
                }
                break;

            case REQUEST_GET:
                EXCEPTION_UNSUPPORTED_OPERATION.content = "The requested operation \"read\" is not supported for \"" + ENDPOINT_NAME + "\" endpoint."
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_UPDATE:
                EXCEPTION_UNSUPPORTED_OPERATION.content = "The requested operation \"update\" is not supported for \"" + ENDPOINT_NAME + "\" endpoint."
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_PATCH:
                EXCEPTION_UNSUPPORTED_OPERATION.content = "The requested operation \"patch\" is not supported for \"" + ENDPOINT_NAME + "\" endpoint."
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            case REQUEST_DELETE:
                EXCEPTION_UNSUPPORTED_OPERATION.content = "The requested operation \"delete\" is not supported for \"" + ENDPOINT_NAME + "\" endpoint."
                return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNSUPPORTED_OPERATION)

            default:
                break;
        }
        return response
    } catch (error) {

        logException(error)

        if (error && error.code) {
            return generateResponse(error.code, input.transactionId, error.message)
        } else {
            return generateResponse(RESPONSE_CODE_ERROR, input.transactionId, EXCEPTION_UNEXPECTED_ERROR)
        }

    }

}())


/**
 * @name processOrgImport
 * @description Handles ACTION_IMPORT ("1") — upsert org + profile.
 *
 * @param {JSON} input
 * @returns {JSON} response with results array
 */
function processOrgImport(input) {
    logger.error("processOrgImport Input --> " + JSON.stringify(input))

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
        "logger": input._ENDPOINT_NAME + "/processOrgImport",
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/processOrgImport",
        "timestamp": ""
    }

    let validEntries = []
    let invalidEntries = []
    let results = []

    try {
        logDebug(input.transactionId, input._ENDPOINT_NAME, "processOrgImport", "Input parameter: " + JSON.stringify(input.payload))

        if (!input.payload) {
            invalidRequestException.message.content = "Invalid request. Missing payload."
            invalidRequestException.timestamp = new Date().toISOString()
            throw invalidRequestException
        }

        const payload = input.payload
        const orgName = payload.name || null

        // Validate required field: name
        if (!orgName) {
            invalidRequestException.message.content = "Invalid request. Missing required field: \"name\""
            invalidRequestException.timestamp = new Date().toISOString()
            throw invalidRequestException
        }

        var orgId = null
        var orgExists = false
        var profileId = null
        var profileExists = false

        // Step 1: Query for existing org by name
        let existingOrg = searchObjectByIdAttributeValue(input, input._ORG_MO, "name", orgName)

        if (existingOrg) {
            // Org exists → patch (upsert update path)
            orgExists = true
            orgId = existingOrg._id
            logger.error("Org found, updating: " + orgId)

            try {
                let patchArray = buildOrgPatchArray(payload)
                if (patchArray.length > 0) {
                    openidm.patch(input._ORG_MO + "/" + orgId, null, patchArray)
                    logger.error("Org patched successfully: " + orgId)
                }
            } catch (patchError) {
                logger.error("Error patching org: " + JSON.stringify(patchError))
                invalidEntries.push({
                    entry: 1,
                    orgName: orgName,
                    profileName: payload.orgProfileSystemName || "",
                    type: "ORG_UPDATE",
                    status: "FAILURE",
                    error: "Failed to update org: " + orgName
                })
            }
        } else {
            // Org does not exist → create
            logger.error("Org not found, creating: " + orgName)

            try {
                let orgBody = buildOrgCreateBody(payload)
                let createResponse = openidm.create(input._ORG_MO, null, orgBody)
                if (createResponse) {
                    orgId = createResponse._id
                    logger.error("Org created successfully: " + orgId)
                }
            } catch (createError) {
                logger.error("Error creating org: " + JSON.stringify(createError))
                invalidEntries.push({
                    entry: 1,
                    orgName: orgName,
                    profileName: payload.orgProfileSystemName || "",
                    type: "ORG_CREATE",
                    status: "FAILURE",
                    error: "Failed to create org: " + orgName
                })
            }
        }

        // Step 2: Handle parent relationship
        if (orgId && payload.parentName) {
            try {
                let parentOrg = searchObjectByIdAttributeValue(input, input._ORG_MO, "name", payload.parentName)
                var parentOrgId = null

                if (parentOrg) {
                    parentOrgId = parentOrg._id
                    logger.error("Parent org found: " + parentOrgId)
                } else {
                    // Auto-create stub parent org
                    logger.error("Parent org not found, auto-creating stub: " + payload.parentName)
                    let stubBody = {
                        "name": payload.parentName,
                        "createDate": new Date().toISOString(),
                        "createDateEpoch": Date.now(),
                        "createdBy": "KYID-System",
                        "createdByID": "KYID-System",
                        "updateDate": new Date().toISOString(),
                        "updateDateEpoch": Date.now(),
                        "updatedBy": "KYID-System",
                        "updatedByID": "KYID-System"
                    }
                    let parentCreateResponse = openidm.create(input._ORG_MO, null, stubBody)
                    if (parentCreateResponse) {
                        parentOrgId = parentCreateResponse._id
                        logger.error("Stub parent org created: " + parentOrgId)
                    }
                }

                // Set parent relationship
                if (parentOrgId) {
                    openidm.patch(input._ORG_MO + "/" + orgId, null, [{
                        "operation": "replace",
                        "field": "/parent",
                        "value": { "_ref": input._ORG_MO + "/" + parentOrgId }
                    }])
                    logger.error("Parent relationship set: " + orgId + " → " + parentOrgId)
                }
            } catch (parentError) {
                logger.error("Error setting parent relationship: " + JSON.stringify(parentError))
                invalidEntries.push({
                    entry: 1,
                    orgName: orgName,
                    profileName: "",
                    type: "PARENT_LINK",
                    status: "FAILURE",
                    error: "Failed to set parent relationship for org: " + orgName
                })
            }
        }

        // Step 3: Handle org profile
        if (orgId && payload.orgProfileSystemName) {
            let existingProfile = searchObjectByIdAttributeValue(input, input._ORG_PROFILE_MO, "orgProfileSystemName", payload.orgProfileSystemName)

            if (existingProfile) {
                // Profile exists → patch
                profileExists = true
                profileId = existingProfile._id
                logger.error("Profile found, updating: " + profileId)

                try {
                    let profilePatchArray = buildProfilePatchArray(payload)
                    if (profilePatchArray.length > 0) {
                        openidm.patch(input._ORG_PROFILE_MO + "/" + profileId, null, profilePatchArray)
                        logger.error("Profile patched successfully: " + profileId)
                    }
                } catch (profilePatchError) {
                    logger.error("Error patching profile: " + JSON.stringify(profilePatchError))
                    invalidEntries.push({
                        entry: 1,
                        orgName: orgName,
                        profileName: payload.orgProfileSystemName,
                        type: "PROFILE_UPDATE",
                        status: "FAILURE",
                        error: "Failed to update profile: " + payload.orgProfileSystemName
                    })
                }
            } else {
                // Profile does not exist → create + link
                logger.error("Profile not found, creating: " + payload.orgProfileSystemName)

                try {
                    let profileBody = buildProfileCreateBody(payload, orgId)
                    let profileCreateResponse = openidm.create(input._ORG_PROFILE_MO, null, profileBody)
                    if (profileCreateResponse) {
                        profileId = profileCreateResponse._id
                        logger.error("Profile created successfully: " + profileId)

                        // Link profile to org via orgProfile[] relationship
                        linkProfileToOrg(input._ORG_MO, orgId, input._ORG_PROFILE_MO, profileId)
                        logger.error("Profile linked to org: " + profileId + " → " + orgId)
                    }
                } catch (profileCreateError) {
                    logger.error("Error creating profile: " + JSON.stringify(profileCreateError))
                    invalidEntries.push({
                        entry: 1,
                        orgName: orgName,
                        profileName: payload.orgProfileSystemName,
                        type: "PROFILE_CREATE",
                        status: "FAILURE",
                        error: "Failed to create profile: " + payload.orgProfileSystemName
                    })
                }
            }
        }

        // Build results
        if (orgId && invalidEntries.length === 0) {
            results.push({
                entry: 1,
                orgName: orgName,
                orgId: orgId,
                profileName: payload.orgProfileSystemName || "",
                profileId: profileId || "",
                type: orgExists ? "ORG_UPDATE" : "ORG_CREATE",
                status: "SUCCESS"
            })
        }

        let finalResults = results.concat(invalidEntries)
        logger.error("finalResults is: " + JSON.stringify(finalResults))

        // Audit logging
        const successCount = finalResults.filter(function (r) { return r.status === "SUCCESS" }).length
        const failureCount = finalResults.filter(function (r) { return r.status === "FAILURE" }).length

        const orgDetails = finalResults.map(function (result) {
            return {
                entry: result.entry,
                orgName: result.orgName,
                profileName: result.profileName,
                type: result.type || "",
                id: result.orgId || null,
                status: result.status,
                error: result.error || undefined
            }
        })

        if (finalResults.length > 0 && invalidEntries.length === 0) {
            logger.error("all records successful")
            try {
                var bopEventDetails = {
                    totalRecords: finalResults.length,
                    successRecords: successCount,
                    failedRecords: 0,
                    orgDetails: orgDetails
                }
                auditLogger(
                    "BOP001",
                    "Bulk Org Import Uploaded",
                    input.auditLogger.sessionDetailsauditLogger,
                    bopEventDetails,
                    input.payload.requesterAccountId || "",
                    "",
                    input.auditLogger.transactionIdauditLogger,
                    "",
                    "",
                    input.auditLogger.sessionRefIDauditLogger
                )
            } catch (auditError) {
                logger.error("BOP001 Audit Logger Error: " + JSON.stringify(auditError))
            }
        } else {
            logger.error("partial or all records failure")
            try {
                var bopEventDetails = {
                    totalRecords: finalResults.length,
                    successRecords: successCount,
                    failedRecords: failureCount,
                    orgDetails: orgDetails
                }
                auditLogger(
                    "BOP002",
                    "Bulk Org Import Failure",
                    input.auditLogger.sessionDetailsauditLogger,
                    bopEventDetails,
                    input.payload.requesterAccountId || "",
                    "",
                    input.auditLogger.transactionIdauditLogger,
                    "",
                    "",
                    input.auditLogger.sessionRefIDauditLogger
                )
            } catch (auditError) {
                logger.error("BOP002 Audit Logger Error: " + JSON.stringify(auditError))
            }
        }

        return {
            results: finalResults
        }

    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)

        try {
            var bopEventDetails = {
                error: "An unexpected error occured. Error: " + JSON.stringify(getException(error))
            }
            auditLogger(
                "BOP002",
                "Bulk Org Import Failure",
                input.auditLogger.sessionDetailsauditLogger,
                bopEventDetails,
                input.payload.requesterAccountId || "",
                "",
                input.auditLogger.transactionIdauditLogger,
                "",
                "",
                input.auditLogger.sessionRefIDauditLogger
            )
        } catch (auditError) {
            logger.error("BOP002 Audit Logger Error in catch block: " + JSON.stringify(auditError))
        }

        unexpectedException.message.content = "An unexpected error occured. Error: " + JSON.stringify(getException(error))
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}


/**
 * @name processOrgRemove
 * @description Handles ACTION_REMOVE ("2") — soft delete org + profile.
 *
 * @param {JSON} input
 * @returns {JSON} response with results array
 */
function processOrgRemove(input) {
    logger.error("processOrgRemove Input --> " + JSON.stringify(input))

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
        "logger": input._ENDPOINT_NAME + "/processOrgRemove",
        "timestamp": ""
    }
    const unexpectedException = {
        "code": "2",
        "level": "ERROR",
        "message": {
            "code": EXCEPTION_UNEXPECTED_ERROR.code,
            "content": ""
        },
        "logger": input._ENDPOINT_NAME + "/processOrgRemove",
        "timestamp": ""
    }

    let results = []
    let invalidEntries = []

    try {
        const payload = input.payload
        const orgName = payload.name || null

        if (!orgName) {
            invalidRequestException.message.content = "Invalid request. Missing required field: \"name\""
            invalidRequestException.timestamp = new Date().toISOString()
            throw invalidRequestException
        }

        // Find org
        let existingOrg = searchObjectByIdAttributeValue(input, input._ORG_MO, "name", orgName)

        if (!existingOrg) {
            invalidEntries.push({
                entry: 1,
                orgName: orgName,
                profileName: payload.orgProfileSystemName || "",
                type: "ORG_REMOVE",
                status: "FAILURE",
                error: "Org not found: " + orgName
            })
        } else {
            // Soft delete org
            try {
                openidm.patch(input._ORG_MO + "/" + existingOrg._id, null, [
                    { "operation": "replace", "field": "/orgStatus", "value": "inactive" },
                    { "operation": "replace", "field": "/updateDate", "value": new Date().toISOString() },
                    { "operation": "replace", "field": "/updateDateEpoch", "value": Date.now() },
                    { "operation": "replace", "field": "/updatedBy", "value": "KYID-System" },
                    { "operation": "replace", "field": "/updatedByID", "value": "KYID-System" }
                ])
                logger.error("Org soft deleted: " + existingOrg._id)

                results.push({
                    entry: 1,
                    orgName: orgName,
                    orgId: existingOrg._id,
                    profileName: payload.orgProfileSystemName || "",
                    type: "ORG_REMOVE",
                    status: "SUCCESS"
                })
            } catch (removeError) {
                logger.error("Error removing org: " + JSON.stringify(removeError))
                invalidEntries.push({
                    entry: 1,
                    orgName: orgName,
                    profileName: "",
                    type: "ORG_REMOVE",
                    status: "FAILURE",
                    error: "Failed to remove org: " + orgName
                })
            }

            // Soft delete profile if specified
            if (payload.orgProfileSystemName) {
                let existingProfile = searchObjectByIdAttributeValue(input, input._ORG_PROFILE_MO, "orgProfileSystemName", payload.orgProfileSystemName)
                if (existingProfile) {
                    try {
                        openidm.patch(input._ORG_PROFILE_MO + "/" + existingProfile._id, null, [
                            { "operation": "replace", "field": "/orgProfileStatus", "value": "inactive" },
                            { "operation": "replace", "field": "/updateDateEpoch", "value": String(Date.now()) },
                            { "operation": "replace", "field": "/updatedBy", "value": "KYID-System" },
                            { "operation": "replace", "field": "/updatedByID", "value": "KYID-System" }
                        ])
                        logger.error("Profile soft deleted: " + existingProfile._id)
                    } catch (profileRemoveError) {
                        logger.error("Error removing profile: " + JSON.stringify(profileRemoveError))
                    }
                }
            }
        }

        let finalResults = results.concat(invalidEntries)

        // Audit logging
        try {
            var eventCode = invalidEntries.length === 0 ? "BOP001" : "BOP002"
            var eventName = invalidEntries.length === 0 ? "Bulk Org Remove Success" : "Bulk Org Remove Failure"
            auditLogger(
                eventCode,
                eventName,
                input.auditLogger.sessionDetailsauditLogger,
                { results: finalResults },
                input.payload.requesterAccountId || "",
                "",
                input.auditLogger.transactionIdauditLogger,
                "",
                "",
                input.auditLogger.sessionRefIDauditLogger
            )
        } catch (auditError) {
            logger.error("Audit Logger Error: " + JSON.stringify(auditError))
        }

        return {
            results: finalResults
        }

    } catch (error) {
        logger.error("An unexpected error occured. Error" + error)
        unexpectedException.message.content = "An unexpected error occured. Error: " + JSON.stringify(getException(error))
        unexpectedException.timestamp = new Date().toISOString()
        throw unexpectedException
    }
}


/**
 * @name searchOrgs
 * @description Placeholder for ACTION_SEARCH ("3") — search organizations.
 *
 * @param {JSON} input
 * @returns {JSON} search results
 */
function searchOrgs(input) {
    // Future: implement org search
    return { results: [] }
}


// ==================== HELPER FUNCTIONS ====================

/**
 * @name buildOrgCreateBody
 * @description Build the create body for alpha_organization from payload fields.
 */
function buildOrgCreateBody(payload) {
    var body = {
        "name": payload.name,
        "createDate": new Date().toISOString(),
        "createDateEpoch": Date.now(),
        "createdBy": "KYID-System",
        "createdByID": "KYID-System",
        "updateDate": new Date().toISOString(),
        "updateDateEpoch": Date.now(),
        "updatedBy": "KYID-System",
        "updatedByID": "KYID-System"
    }

    // Map all optional org fields from payload
    var orgFields = [
        "description", "orgSystemName", "orgDisplayName", "orgDescription",
        "orgStatus", "organizationTerminationStatus", "orgSourceID", "orgSourceName",
        "enforceDomainRestriction", "invitationValidityPeriod"
    ]

    for (var i = 0; i < orgFields.length; i++) {
        var field = orgFields[i]
        if (payload[field] && payload[field] !== "") {
            body[field] = payload[field]
        }
    }

    // Parse emailDomains
    if (payload.emailDomains && payload.emailDomains !== "") {
        body.emailDomains = parseEmailDomains(payload.emailDomains)
    }

    return body
}


/**
 * @name buildOrgPatchArray
 * @description Build patch operations array for alpha_organization from non-empty payload fields.
 */
function buildOrgPatchArray(payload) {
    var patchArray = []

    var orgFields = [
        "name", "description", "orgSystemName", "orgDisplayName", "orgDescription",
        "orgStatus", "organizationTerminationStatus", "orgSourceID", "orgSourceName",
        "enforceDomainRestriction", "invitationValidityPeriod"
    ]

    for (var i = 0; i < orgFields.length; i++) {
        var field = orgFields[i]
        if (payload[field] && payload[field] !== "") {
            patchArray.push({
                "operation": "replace",
                "field": "/" + field,
                "value": payload[field]
            })
        }
    }

    // Parse emailDomains
    if (payload.emailDomains && payload.emailDomains !== "") {
        patchArray.push({
            "operation": "replace",
            "field": "/emailDomains",
            "value": parseEmailDomains(payload.emailDomains)
        })
    }

    // Update audit fields
    patchArray.push({ "operation": "replace", "field": "/updateDate", "value": new Date().toISOString() })
    patchArray.push({ "operation": "replace", "field": "/updateDateEpoch", "value": Date.now() })
    patchArray.push({ "operation": "replace", "field": "/updatedBy", "value": "KYID-System" })
    patchArray.push({ "operation": "replace", "field": "/updatedByID", "value": "KYID-System" })

    return patchArray
}


/**
 * @name buildProfileCreateBody
 * @description Build the create body for alpha_kyid_organization_profile from payload fields.
 */
function buildProfileCreateBody(payload, orgId) {
    var body = {
        "orgProfileSystemName": payload.orgProfileSystemName,
        "createDateEpoch": String(Date.now()),
        "updateDateEpoch": String(Date.now()),
        "createdBy": "KYID-System",
        "createdByID": "KYID-System",
        "updatedBy": "KYID-System",
        "updatedByID": "KYID-System"
    }

    // Map optional profile fields
    var profileFields = [
        "orgProfileDisplayName", "orgProfileDescription",
        "orgProfileType", "orgProfileSubType", "orgProfileStatus"
    ]

    for (var i = 0; i < profileFields.length; i++) {
        var field = profileFields[i]
        if (payload[field] && payload[field] !== "") {
            body[field] = payload[field]
        }
    }

    // Set parentOrgID relationship back to the org
    if (orgId) {
        body.parentOrgID = [{ "_ref": "managed/alpha_organization/" + orgId }]
    }

    return body
}


/**
 * @name buildProfilePatchArray
 * @description Build patch operations array for alpha_kyid_organization_profile from non-empty payload fields.
 */
function buildProfilePatchArray(payload) {
    var patchArray = []

    var profileFields = [
        "orgProfileSystemName", "orgProfileDisplayName", "orgProfileDescription",
        "orgProfileType", "orgProfileSubType", "orgProfileStatus"
    ]

    for (var i = 0; i < profileFields.length; i++) {
        var field = profileFields[i]
        if (payload[field] && payload[field] !== "") {
            patchArray.push({
                "operation": "replace",
                "field": "/" + field,
                "value": payload[field]
            })
        }
    }

    // Update audit fields
    patchArray.push({ "operation": "replace", "field": "/updateDateEpoch", "value": String(Date.now()) })
    patchArray.push({ "operation": "replace", "field": "/updatedBy", "value": "KYID-System" })
    patchArray.push({ "operation": "replace", "field": "/updatedByID", "value": "KYID-System" })

    return patchArray
}


/**
 * @name parseEmailDomains
 * @description Parse semicolon-separated email domains string into array of objects.
 *
 * @param {string} str - e.g. "ky.gov;dot.ky.gov"
 * @returns {Array} - e.g. [{domainName:"ky.gov",domainDesc:"",domainStatus:"active"}, ...]
 */
function parseEmailDomains(str) {
    var domains = str.split(";")
    var result = []
    for (var i = 0; i < domains.length; i++) {
        var domain = domains[i].trim()
        if (domain !== "") {
            result.push({
                "domainName": domain,
                "domainDesc": "",
                "domainStatus": "active"
            })
        }
    }
    return result
}


/**
 * @name linkProfileToOrg
 * @description Add profile to org's orgProfile[] relationship via patch.
 */
function linkProfileToOrg(orgMo, orgId, profileMo, profileId) {
    try {
        openidm.patch(orgMo + "/" + orgId, null, [{
            "operation": "add",
            "field": "/orgProfile/-",
            "value": { "_ref": profileMo + "/" + profileId }
        }])
    } catch (error) {
        logger.error("Error linking profile to org: " + JSON.stringify(error))
        throw error
    }
}


// ==================== REUSABLE UTILITY FUNCTIONS (from bulkoperation.idm.js) ====================

/**
 * @name searchObjectByIdAttributeValue
 * @description Query a managed object by attribute name and value.
 */
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


/**
 * @name getRequestContent
 * @description Method returns request content.
 */
function getRequestContent(context, request, endpoint) {
    if (request.content) {
        logDebug(context.transactionId, endpoint, "getRequestContent", "Input parameter: " + request.content)
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
        "logger": endpoint,
        "timestamp": ""
    }

    try {
        if (request.content) {
            if (!request.content.payload) {
                invalidRequestException.message.content = "Invalid request. Missing parameter(s): \"request.content.payload\""
                invalidRequestException.timestamp = new Date().toISOString()
                throw invalidRequestException
            }
            if (!request.content.action) {
                invalidRequestException.message.content = "Invalid request. Missing parameter(s): \"request.content.action\""
                invalidRequestException.timestamp = new Date().toISOString()
                throw invalidRequestException
            }

            logDebug(context.transactionId, endpoint, "getRequestContent", "Response: " + request.content)
            return request.content

        } else if (request.additionalParameters) {
            logger.error("request.additionalParameters are " + JSON.stringify(request.additionalParameters))
            return request.additionalParameters

        } else {
            invalidRequestException.message.content = "Invalid request. Missing parameter(s): \"request.content\""
            invalidRequestException.timestamp = new Date().toISOString()
            throw invalidRequestException
        }
    } catch (error) {
        throw error
    }
}


/**
 * @name generateResponse
 * @description Method generates response.
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
 */
function logException(exception) {
    logger.error(JSON.stringify(exception))
}


/**
 * @name getException
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
 * @name getAuditLoggerContext
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
            ? { "sessionRefId": sessionRefIDauditLogger }
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


/**
 * @name auditLogger
 */
function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
    try {
        logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();

        sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
        sessionRefId = deepParse(sessionRefId)
        logger.error("In endpoint/bulkorgimport_aaron_test1:: Typeof sessionRefId - " + typeof sessionRefId + " and value is - " + JSON.stringify(sessionRefId))
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
        if (country && country !== undefined && country !== "undefined" && (country.toUpperCase() !== "US" || country.toUpperCase() !== "UNITED STATES")) {
            placeParts.push(country);
        }

        logger.error("***placeParts in endpoint/bulkorgimport_aaron_test1 => " + placeParts)
        var place = "";
        if (!city) {
            logger.error("city empty in event details")
            place = "Unknown Location"
        } else {
            logger.error("placeParts")
            place = placeParts.join(", ");
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
            sessionId: sessionRefId.sessionRefId || "",
            place: place || ""
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        var sendLogstoDBandMO = identityServer.getProperty("esv.sendauditlogs.db.mo");
        if (sendLogstoDBandMO === "true" || sendLogstoDBandMO === true) {
            const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
            logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
        }

        try {
            const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
            logger.error("Response from sendAuditLogstoDB is - " + JSON.stringify(sendlogstoDB))
        } catch (error) {
            logger.error("Exception from sendAuditLogstoDB is -" + error)
        }

    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }
}


/**
 * @name deepParse
 */
function deepParse(data) {
    if (typeof data !== 'string') {
        return data;
    }
    try {
        const parsed = JSON.parse(data);
        return deepParse(parsed);
    } catch (e) {
        return data;
    }
}
