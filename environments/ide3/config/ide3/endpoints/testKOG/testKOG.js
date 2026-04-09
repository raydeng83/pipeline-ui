/**
 * @name testKOG
 * @description Test endpoint for KOG operations: create account, get user details, verify prerequisites, query authorizations, assign and delete roles, typeof tests
 *
 * Usage:
 *   GET  /openidm/endpoint/testKOG - Show usage info
 *   POST /openidm/endpoint/testKOG - Get user details, verify prerequisites, query, assign, or delete KOG roles
 *
 * Create Account Mode (create a new user in KOG for testing):
 *   POST /openidm/endpoint/testKOG
 *   { "createAccount": true, "emailAddress": "test@example.com", "firstName": "Test", "lastName": "User", "password": "TempPass123!" }
 *   Returns: Created account details (KOGID, UPN, Logon) + verification query
 *
 * Get User Details Mode (emailaddress or kogId with getUserDetails flag):
 *   POST /openidm/endpoint/testKOG
 *   { "emailaddress": "user@example.com" }
 *   OR
 *   { "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777", "getUserDetails": true }
 *   Returns: Complete user profile information from KOG
 *
 * Verify Prerequisite Mode (kogId with verifyPrerequisite flag):
 *   POST /openidm/endpoint/testKOG
 *   { "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777", "verifyPrerequisite": true }
 *   Returns: All user prerequisites
 *   OR
 *   { "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777", "verifyPrerequisite": true, "prereqName": "Remote Identity Proofing: LexisNexis" }
 *   Returns: Verification result (exists: true/false) and matched prerequisite details
 *
 * Query Authorizations Mode (only kogId):
 *   POST /openidm/endpoint/testKOG
 *   { "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777" }
 *   Returns: All authorizations (roles) for the user
 *
 * Assign Mode (kogId + requestorKogId + userAuths):
 *   POST /openidm/endpoint/testKOG
 *   {
 *     "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777",
 *     "requestorKogId": "f32fba76-3b76-4c93-bf48-bf4737536d13",
 *     "userAuths": [
 *       {
 *         "ApplicationName": "Priyas Test App",
 *         "RoleName": "Non - OrgAuth Delegation - Del RC",
 *         "CurrentDelegatorKOGID": "4c70d11c-343b-46cc-8782-29be6a02aae4",
 *         "OriginalDelegatorKOGID": null,
 *         "KOGOrgID": "0",
 *         "OrgBusinessKeyID": null
 *       }
 *     ],
 *     "kyidContextId": "..." (optional)
 *   }
 *
 * Delete Mode (kogId + requestorKogId + applicationName + roleName):
 *   POST /openidm/endpoint/testKOG
 *   {
 *     "kogId": "18aebb6d-3610-4f02-82d3-c6b8e308d777",
 *     "requestorKogId": "f32fba76-3b76-4c93-bf48-bf4737536d13",
 *     "applicationName": "Priyas Test App",
 *     "roleName": "Non - OrgAuth Delegation - Del RC",
 *     "currentDelegatorKogId": "4c70d11c-343b-46cc-8782-29be6a02aae4" (optional),
 *     "originalDelegatorKogId": "f32fba76-3b76-4c93-bf48-bf4737536d13" (optional)
 *   }
 *
 */

var UUID = java.util.UUID;

/**
 * Call KOG API for assigning role to user
 */
function invokeKOGAPIRoleAssignment(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        const requestBody = {
            "url": identityServer.getProperty("esv.assignrolestouser.api"),
            "scope": identityServer.getProperty("esv.assignrolestouser.api.scope"),
            "method": "POST",
            "payload": payload
        }

        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Starting KOG API call")
        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - API URL: " + requestBody.url)
        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Payload UserAuths count: " + (payload.UserAuths ? payload.UserAuths.length : 0))

        while (retryCountForKOGAPI < 3) {
            //Call KOG API endpoint.
            try {
                logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI")
                logger.error("[KOG-ASSIGN-DEBUG] Invoking KOG Role Assignment API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Raw response received from invokeCertAPI")
                logger.error("[KOG-ASSIGN-DEBUG] KOG Role Assignment Response: " + JSON.stringify(response))
                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - SUCCESS - ResponseStatus: 0")
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - BUSINESS_VALIDATION - ResponseStatus: 1")
                        return response.response
                    } else {
                        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - UNKNOWN_STATUS - ResponseStatus: " + response.response.ResponseStatus)
                        return response.response
                    }
                } else {
                    logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - NON_200_RESPONSE - Status: " + (response ? response.status : "null"))
                    return null
                }
            } catch (error) {
                logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - EXCEPTION caught in attempt " + (retryCountForKOGAPI + 1))
                logger.error("[KOG-ASSIGN-DEBUG] KOG Role Assignment Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Retry count: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - MAX_RETRY_REACHED - Returning null")
                        return null
                    }
                } else {
                    logger.error("[KOG-ASSIGN-DEBUG] invokeKOGAPIRoleAssignment - Retry disabled, returning null")
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("[KOG-ASSIGN-DEBUG] KOG Role Assignment Outer Failure Response is: " + JSON.stringify(error))
        return null
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
 * Call KOG API for getting User Prerequisites
 */
function invokeKOGAPIGetUserPrerequisites(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        // Try to get URL from ESV, fallback to hardcoded URL if not configured
        var apiUrl = identityServer.getProperty("esv.kyid.usr.jitprerequisites");
        if (!apiUrl || apiUrl === null) {
            logger.error("[KOG-PREREQ-DEBUG] ESV 'esv.kyid.usr.jitprerequisites' not configured, using hardcoded URL");
            apiUrl = "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/getuserprerequisites";
        }

        const requestBody = {
            "url": apiUrl,
            "scope": "kogkyidapi.getuserprerequisites",
            "method": "POST",
            "payload": payload
        }

        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - Starting KOG API call")
        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - API URL: " + requestBody.url)

        while (retryCountForKOGAPI < 3) {
            try {
                logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI")
                logger.error("[KOG-PREREQ-DEBUG] Invoking KOG Get User Prerequisites API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - Raw response received from invokeCertAPI")
                logger.error("[KOG-PREREQ-DEBUG] KOG Get User Prerequisites Response: " + JSON.stringify(response))

                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - SUCCESS - ResponseStatus: 0")
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - BUSINESS_VALIDATION - ResponseStatus: 1")
                        logger.error("[KOG-PREREQ-DEBUG] Response message: " + (response.response.ResponseMessage || "No message"))
                        return response.response
                    } else {
                        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - UNKNOWN_STATUS - ResponseStatus: " + response.response.ResponseStatus)
                        return response.response
                    }
                } else {
                    logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - NON_200_RESPONSE - Status: " + (response ? response.status : "null"))
                    return null
                }
            } catch (error) {
                logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - EXCEPTION caught in attempt " + (retryCountForKOGAPI + 1))
                logger.error("[KOG-PREREQ-DEBUG] KOG Get User Prerequisites Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - Retry count: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - MAX_RETRY_REACHED - Returning null")
                        return null
                    }
                } else {
                    logger.error("[KOG-PREREQ-DEBUG] invokeKOGAPIGetUserPrerequisites - Retry disabled, returning null")
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("[KOG-PREREQ-DEBUG] KOG Get User Prerequisites Outer Failure Response is: " + JSON.stringify(error))
        return null
    }
}

/**
 * Call KOG API for creating a new account
 */
function invokeKOGAPICreateAccount(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        var apiUrl = identityServer.getProperty("esv.kyid.kogapi.createaccount");
        if (!apiUrl || apiUrl === null) {
            logger.error("[KOG-CREATEACCOUNT-DEBUG] ESV 'esv.kyid.kogapi.createaccount' not configured, using hardcoded URL");
            apiUrl = "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/createaccount";
        }

        const requestBody = {
            "url": apiUrl,
            "scope": "kogkyidapi.createaccount",
            "method": "POST",
            "payload": payload
        }

        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - Starting KOG API call")
        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - API URL: " + requestBody.url)

        while (retryCountForKOGAPI < 3) {
            try {
                logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI")
                logger.error("[KOG-CREATEACCOUNT-DEBUG] Invoking KOG Create Account API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - Raw response received from invokeCertAPI")
                logger.error("[KOG-CREATEACCOUNT-DEBUG] KOG Create Account Response: " + JSON.stringify(response))

                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - SUCCESS - ResponseStatus: 0")
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - BUSINESS_VALIDATION - ResponseStatus: 1")
                        logger.error("[KOG-CREATEACCOUNT-DEBUG] Response message: " + (response.response.ResponseMessage || "No message"))
                        return response.response
                    } else {
                        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - UNKNOWN_STATUS - ResponseStatus: " + response.response.ResponseStatus)
                        return response.response
                    }
                } else {
                    logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - NON_200_RESPONSE - Status: " + (response ? response.status : "null"))
                    return null
                }
            } catch (error) {
                logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - EXCEPTION caught in attempt " + (retryCountForKOGAPI + 1))
                logger.error("[KOG-CREATEACCOUNT-DEBUG] KOG Create Account Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - Retry count: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - MAX_RETRY_REACHED - Returning null")
                        return null
                    }
                } else {
                    logger.error("[KOG-CREATEACCOUNT-DEBUG] invokeKOGAPICreateAccount - Retry disabled, returning null")
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("[KOG-CREATEACCOUNT-DEBUG] KOG Create Account Outer Failure Response is: " + JSON.stringify(error))
        return null
    }
}

/**
 * Call KOG API for getting User Details
 */
function invokeKOGAPIGetUserDetails(payload) {
    try {
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        // Try to get URL from ESV, fallback to hardcoded URL if not configured
        var apiUrl = identityServer.getProperty("esv.kyid.usr.getuserdetails");
        if (!apiUrl || apiUrl === null) {
            logger.error("[KOG-USERDETAILS-DEBUG] ESV 'esv.kyid.usr.getuserdetails' not configured, using hardcoded URL");
            apiUrl = "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/getuserdetails";
        }

        const requestBody = {
            "url": apiUrl,
            "scope": "kogkyidapi.getuserdetails",
            "method": "POST",
            "payload": payload
        }

        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - Starting KOG API call")
        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - API URL: " + requestBody.url)

        while (retryCountForKOGAPI < 3) {
            try {
                logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI")
                logger.error("[KOG-USERDETAILS-DEBUG] Invoking KOG Get User Details API Request Body: " + JSON.stringify(requestBody))
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - Raw response received from invokeCertAPI")
                logger.error("[KOG-USERDETAILS-DEBUG] KOG Get User Details Response: " + JSON.stringify(response))

                if (response && response.status === "200") {
                    if (response.response.ResponseStatus === 0) {
                        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - SUCCESS - ResponseStatus: 0")
                        return response.response
                    } else if (response.response.ResponseStatus === 1) {
                        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - BUSINESS_VALIDATION - ResponseStatus: 1")
                        logger.error("[KOG-USERDETAILS-DEBUG] Response message: " + (response.response.ResponseMessage || "No message"))
                        return response.response
                    } else {
                        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - UNKNOWN_STATUS - ResponseStatus: " + response.response.ResponseStatus)
                        return response.response
                    }
                } else {
                    logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - NON_200_RESPONSE - Status: " + (response ? response.status : "null"))
                    return null
                }
            } catch (error) {
                logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - EXCEPTION caught in attempt " + (retryCountForKOGAPI + 1))
                logger.error("[KOG-USERDETAILS-DEBUG] KOG Get User Details Failure Response is: " + JSON.stringify(error))
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - Retry count: " + retryCountForKOGAPI);
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - MAX_RETRY_REACHED - Returning null")
                        return null
                    }
                } else {
                    logger.error("[KOG-USERDETAILS-DEBUG] invokeKOGAPIGetUserDetails - Retry disabled, returning null")
                    return null
                }
            }
        }
    } catch (error) {
        logger.error("[KOG-USERDETAILS-DEBUG] KOG Get User Details Outer Failure Response is: " + JSON.stringify(error))
        return null
    }
}

/**
 * Lookup Ping User — read-only query of alpha_user + MFA + access by email
 */
function lookupPingUser(params) {
    try {
        logger.error("[TEST-KOG-LOOKUP] Lookup Ping User Mode - email: " + params.email);

        if (!params.email) {
            throw { code: 400, message: "lookupPingUser: Missing required parameter: email" };
        }

        var lookupEmail = params.email;

        var lookupUserResponse = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + lookupEmail + '"'
        }, ["_id", "userName", "mail", "givenName", "sn", "accountStatus"]);

        if (!lookupUserResponse || lookupUserResponse.resultCount === 0) {
            return { mode: "lookupPingUser", email: lookupEmail, message: "User not found in Ping", user: null, mfa: [], access: [] };
        }

        var lookupUser = lookupUserResponse.result[0];
        var lookupUserId = lookupUser._id;
        var lookupKogId = lookupUser.userName;
        logger.error("[TEST-KOG-LOOKUP] Found user - _id: " + lookupUserId + ", userName(KOGID): " + lookupKogId);

        var lookupMfaResponse = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + lookupKogId + '"'
        }, ["_id", "MFAMethod", "MFAValue"]);
        var mfaRecords = (lookupMfaResponse && lookupMfaResponse.result) ? lookupMfaResponse.result : [];

        var lookupAccessResponse = openidm.query("managed/alpha_kyid_access", {
            "_queryFilter": 'userIdentifier eq "' + lookupUserId + '"'
        }, ["_id", "appIdentifier", "roleIdentifier", "accessStatus"]);
        var accessRecords = (lookupAccessResponse && lookupAccessResponse.result) ? lookupAccessResponse.result : [];

        var lookupIdentityResponse = openidm.query("managed/alpha_kyid_user_identity", {
            "_queryFilter": '/account/_refResourceId eq "' + lookupUserId + '"'
        }, ["*"]);
        var identityRecords = (lookupIdentityResponse && lookupIdentityResponse.result) ? lookupIdentityResponse.result : [];

        return { mode: "lookupPingUser", email: lookupEmail, message: "User found", user: lookupUser, mfa: mfaRecords, access: accessRecords, userIdentity: identityRecords };

    } catch (error) {
        logger.error("[TEST-KOG-LOOKUP] Exception: " + JSON.stringify(error));
        throw { code: 500, message: "Error in lookupPingUser: " + JSON.stringify(error) };
    }
}

/**
 * Cleanup Ping User — delete alpha_user + MFA + access + user_identity by email
 */
function cleanupPingUser(params) {
    try {
        logger.error("[TEST-KOG-CLEANUP] Cleanup Ping User Mode - email: " + params.email);

        if (!params.email) {
            throw { code: 400, message: "cleanupPingUser: Missing required parameter: email" };
        }

        var cleanupEmail = params.email;
        var cleanupResult = { user: null, mfa: { deleted: 0, errors: 0 }, access: { deleted: 0, errors: 0 }, userIdentity: { deleted: 0, errors: 0 } };

        var userResponse = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + cleanupEmail + '"'
        }, ["_id", "userName", "mail"]);

        if (!userResponse || userResponse.resultCount === 0) {
            return { mode: "cleanupPingUser", email: cleanupEmail, message: "User not found in Ping", result: cleanupResult };
        }

        var user = userResponse.result[0];
        var userId = user._id;
        var kogId = user.userName;
        logger.error("[TEST-KOG-CLEANUP] Found user - _id: " + userId + ", userName(KOGID): " + kogId);

        // Step 2: Delete MFA records
        var mfaResponse = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + kogId + '"' }, ["_id", "MFAMethod", "MFAValue"]);
        if (mfaResponse && mfaResponse.result) {
            for (var mi = 0; mi < mfaResponse.result.length; mi++) {
                try { openidm.delete("managed/alpha_kyid_mfa_methods/" + mfaResponse.result[mi]._id, null); cleanupResult.mfa.deleted++; } catch (e) { cleanupResult.mfa.errors++; }
            }
        }

        // Step 3: Delete access records
        var accessResponse = openidm.query("managed/alpha_kyid_access", { "_queryFilter": 'userIdentifier eq "' + userId + '"' }, ["_id"]);
        if (accessResponse && accessResponse.result) {
            for (var ai = 0; ai < accessResponse.result.length; ai++) {
                try { openidm.delete("managed/alpha_kyid_access/" + accessResponse.result[ai]._id, null); cleanupResult.access.deleted++; } catch (e) { cleanupResult.access.errors++; }
            }
        }

        // Step 3.5: Delete user identity records
        var identityResponse = openidm.query("managed/alpha_kyid_user_identity", { "_queryFilter": '/account/_refResourceId eq "' + userId + '"' }, ["*"]);
        if (identityResponse && identityResponse.result) {
            for (var ii = 0; ii < identityResponse.result.length; ii++) {
                try { openidm.delete("managed/alpha_kyid_user_identity/" + identityResponse.result[ii]._id, null); cleanupResult.userIdentity.deleted++; } catch (e) { cleanupResult.userIdentity.errors++; }
            }
        }

        // Step 4: Delete the user
        try { openidm.delete("managed/alpha_user/" + userId, null); cleanupResult.user = { deleted: true, _id: userId, userName: kogId, mail: cleanupEmail }; } catch (e) { cleanupResult.user = { deleted: false, error: String(e) }; }

        logger.error("[TEST-KOG-CLEANUP] Cleanup complete - MFA: " + cleanupResult.mfa.deleted + ", Access: " + cleanupResult.access.deleted + ", Identity: " + cleanupResult.userIdentity.deleted);

        return { mode: "cleanupPingUser", email: cleanupEmail, message: "Cleanup complete", result: cleanupResult };

    } catch (error) {
        logger.error("[TEST-KOG-CLEANUP] Exception: " + JSON.stringify(error));
        throw { code: 500, message: "Error in cleanupPingUser: " + JSON.stringify(error) };
    }
}

(function () {
    logger.error("[TEST-KOG-DELETE] Request received: " + JSON.stringify(request));

    if (request.method === 'create') {
        try {
            const params = request.content;
            let transactionId = UUID.randomUUID().toString();

            // Create Account Mode: If createAccount flag is set
            if (params.createAccount) {
                logger.error("[TEST-KOG-CREATEACCOUNT] Create Account Mode - Detected");
                logger.error("[TEST-KOG-CREATEACCOUNT] Input params: " + JSON.stringify(params));

                // Validate required parameters
                if (!params.emailAddress) {
                    throw { code: 400, message: "Create Account Mode: Missing required parameter: emailAddress" };
                }
                if (!params.firstName) {
                    throw { code: 400, message: "Create Account Mode: Missing required parameter: firstName" };
                }
                if (!params.lastName) {
                    throw { code: 400, message: "Create Account Mode: Missing required parameter: lastName" };
                }
                if (!params.password) {
                    throw { code: 400, message: "Create Account Mode: Missing required parameter: password" };
                }

                var contextId = params.contextId || transactionId;

                var createPayload = {
                    "LegalFirstName": params.firstName,
                    "LegalLastName": params.lastName,
                    "EmailAddress": params.emailAddress,
                    "Password": params.password,
                    "AlternateEmailAddress": params.alternateEmail || "",
                    "MobilePhone": params.mobilePhone || "",
                    "KYID": "34567890",
                    "TransactionID": transactionId,
                    "ContextID": contextId
                };

                // Optional address fields
                if (params.address1) createPayload["Address1"] = params.address1;
                if (params.address2) createPayload["Address2"] = params.address2;
                if (params.city) createPayload["City"] = params.city;
                if (params.state) createPayload["State"] = params.state;
                if (params.zipcode) createPayload["Zipcode"] = params.zipcode;
                if (params.countyCode) createPayload["CountyCode"] = params.countyCode;
                if (params.languagePreference) {
                    createPayload["LanguagePreference"] = params.languagePreference;
                } else {
                    createPayload["LanguagePreference"] = "1";
                }

                logger.error("[TEST-KOG-CREATEACCOUNT] Create Account Payload: " + JSON.stringify(createPayload));

                var createResponse = invokeKOGAPICreateAccount(createPayload);

                logger.error("[TEST-KOG-CREATEACCOUNT] Create Account Response: " + JSON.stringify(createResponse));

                if (!createResponse) {
                    logger.error("[TEST-KOG-CREATEACCOUNT] FAILED - null response from KOG API");
                    return {
                        success: false,
                        mode: "createAccount",
                        message: "Failed to create account - KOG API returned null response",
                        transactionId: transactionId,
                        requestDetails: {
                            apiPayload: createPayload
                        }
                    };
                }

                if (createResponse.ResponseStatus !== 0) {
                    logger.error("[TEST-KOG-CREATEACCOUNT] FAILED - ResponseStatus: " + createResponse.ResponseStatus);
                    var errorMessages = (createResponse.MessageResponses && createResponse.MessageResponses.length > 0)
                        ? createResponse.MessageResponses.map(function(m) { return "[" + m.MessageCode + "] " + m.MessageDescription; }).join(" | ")
                        : "No error details";
                    return {
                        success: false,
                        mode: "createAccount",
                        message: "KOG API returned error: " + errorMessages,
                        transactionId: transactionId,
                        requestDetails: {
                            apiPayload: createPayload
                        },
                        kogResponse: createResponse
                    };
                }

                // Success — extract AccountDetails
                var accountDetails = createResponse.AccountDetails || {};
                logger.error("[TEST-KOG-CREATEACCOUNT] SUCCESS - KOGID: " + accountDetails.KOGID + ", UPN: " + accountDetails.UPN + ", Logon: " + accountDetails.Logon);

                // Verify: query back the newly created user
                logger.error("[TEST-KOG-CREATEACCOUNT] ===== Verifying: Query created user by email =====");
                var verifyResponse = invokeKOGAPIGetUserDetails({ "emailaddress": params.emailAddress });

                return {
                    success: true,
                    mode: "createAccount",
                    message: "Account created successfully in KOG",
                    transactionId: transactionId,
                    requestDetails: {
                        apiPayload: createPayload
                    },
                    accountDetails: {
                        KOGID: accountDetails.KOGID,
                        UPN: accountDetails.UPN,
                        Logon: accountDetails.Logon
                    },
                    fullCreateResponse: createResponse,
                    verification: {
                        queryByEmail: params.emailAddress,
                        userFound: verifyResponse ? (verifyResponse.ResponseStatus === 0) : false,
                        verifyResponse: verifyResponse
                    }
                };
            }

            // Get User Details Mode: If emailaddress or getUserDetails flag is provided
            if (params.emailaddress || params.getUserDetails) {
                logger.error("[TEST-KOG-USERDETAILS] Get User Details Mode - Detected");
                logger.error("[TEST-KOG-USERDETAILS] Input params: " + JSON.stringify(params));

                // Determine API URL (same logic as in invokeKOGAPIGetUserDetails)
                var apiUrl = identityServer.getProperty("esv.kyid.usr.getuserdetails");
                if (!apiUrl || apiUrl === null) {
                    apiUrl = "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/getuserdetails";
                }

                const userDetailsPayload = {};

                // Support both emailaddress and kogId for querying
                if (params.emailaddress) {
                    userDetailsPayload.emailaddress = params.emailaddress;
                    logger.error("[TEST-KOG-USERDETAILS] Query by emailaddress: " + params.emailaddress);
                } else if (params.kogId) {
                    userDetailsPayload.KOGID = params.kogId;
                    logger.error("[TEST-KOG-USERDETAILS] Query by KOGID: " + params.kogId);
                } else {
                    throw { code: 400, message: "Get User Details Mode: Missing required parameter: emailaddress or kogId" };
                }

                logger.error("[TEST-KOG-USERDETAILS] KOG API Request Payload: " + JSON.stringify(userDetailsPayload));
                logger.error("[TEST-KOG-USERDETAILS] KOG API URL: " + apiUrl);

                const userDetailsResponse = invokeKOGAPIGetUserDetails(userDetailsPayload);

                logger.error("[TEST-KOG-USERDETAILS] KOG API Response received: " + JSON.stringify(userDetailsResponse));

                // Handle null response (API call failed)
                if (!userDetailsResponse) {
                    logger.error("[TEST-KOG-USERDETAILS] ✗ FAILED - null response from KOG API");
                    return {
                        success: false,
                        mode: "getUserDetails",
                        message: "Failed to get user details - KOG API returned null response (possible network error or API timeout)",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: userDetailsPayload,
                            apiUrl: apiUrl
                        },
                        error: "Null response from invokeKOGAPIGetUserDetails - check logs for details"
                    };
                }

                logger.error("[TEST-KOG-USERDETAILS] Response status: " + userDetailsResponse.ResponseStatus);
                logger.error("[TEST-KOG-USERDETAILS] Response message: " + (userDetailsResponse.ResponseMessage || "No message"));

                // Handle unsuccessful ResponseStatus
                if (userDetailsResponse.ResponseStatus !== 0) {
                    logger.error("[TEST-KOG-USERDETAILS] ✗ FAILED - ResponseStatus is " + userDetailsResponse.ResponseStatus + " (not 0)");
                    return {
                        success: false,
                        mode: "getUserDetails",
                        message: "KOG API returned error status",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: userDetailsPayload,
                            apiUrl: apiUrl
                        },
                        kogResponse: {
                            responseStatus: userDetailsResponse.ResponseStatus,
                            responseMessage: userDetailsResponse.ResponseMessage || "No error message provided",
                            fullResponse: userDetailsResponse
                        }
                    };
                }

                // Success case
                logger.error("[TEST-KOG-USERDETAILS] ✓ SUCCESS - User details retrieved successfully");
                return {
                    success: true,
                    mode: "getUserDetails",
                    transactionId: transactionId,
                    requestDetails: {
                        inputParams: params,
                        apiPayload: userDetailsPayload,
                        apiUrl: apiUrl
                    },
                    responseStatus: userDetailsResponse.ResponseStatus,
                    responseMessage: userDetailsResponse.ResponseMessage || "",
                    userDetails: userDetailsResponse.UserData || null,
                    fullResponse: userDetailsResponse
                };
            }

            // ======== Test Typeof Mode ========
            // Test typeof behavior in Rhino engine for debugging cancel enrollment email bug
            // POST { "testTypeof": true }
            if (params.testTypeof) {
                logger.error("[TEST-TYPEOF] ===== Starting typeof tests =====");
                var results = {};

                // Test 1: Native JS object literal
                var jsObj = { reason: "User cancelled the request", cancelledBy: "User", comment: "" };
                results.test1_jsObject = {
                    description: "Native JS object literal {reason, cancelledBy, comment}",
                    typeof: typeof jsObj,
                    typeofIsObject: (typeof jsObj === 'object'),
                    isNull: (jsObj === null),
                    typeofAndNotNull: (typeof jsObj === 'object' && jsObj !== null),
                    reasonValue: jsObj.reason,
                    reasonViaBracket: jsObj["reason"],
                    cancelledByValue: jsObj.cancelledBy,
                    commentValue: jsObj.comment,
                    jsonStringify: JSON.stringify(jsObj),
                    toString: String(jsObj),
                    hasReasonProp: (jsObj.reason !== undefined),
                    constructorName: jsObj.constructor ? String(jsObj.constructor) : "N/A"
                };
                try {
                    results.test1_jsObject.javaClass = String(jsObj.getClass());
                } catch (e1) {
                    results.test1_jsObject.javaClass = "N/A (not a Java object): " + String(e1);
                }
                logger.error("[TEST-TYPEOF] Test1 jsObject typeof: " + typeof jsObj);
                logger.error("[TEST-TYPEOF] Test1 jsObject result: " + JSON.stringify(results.test1_jsObject));

                // Test 2: String
                var str = "just a string";
                results.test2_string = {
                    description: "Plain string",
                    typeof: typeof str,
                    typeofIsObject: (typeof str === 'object'),
                    typeofIsString: (typeof str === 'string')
                };
                logger.error("[TEST-TYPEOF] Test2 string typeof: " + typeof str);

                // Test 3: null
                results.test3_null = {
                    description: "null value",
                    typeof: typeof null,
                    typeofIsObject: (typeof null === 'object'),
                    isNull: (null === null)
                };
                logger.error("[TEST-TYPEOF] Test3 null typeof: " + typeof null);

                // Test 4: undefined
                results.test4_undefined = {
                    description: "undefined value",
                    typeof: typeof undefined,
                    typeofIsObject: (typeof undefined === 'object')
                };
                logger.error("[TEST-TYPEOF] Test4 undefined typeof: " + typeof undefined);

                // Test 5: Simulate what enrollment code does — build cancellationDetails object
                var cancellationReason = "User cancelled the request";
                var cancellationComment = "";
                var cancelledByUser = "User";
                var cancellationDetails = {
                    reason: cancellationReason,
                    cancelledBy: cancelledByUser,
                    comment: cancellationComment
                };

                var typeofCheck = (typeof cancellationDetails === 'object' && cancellationDetails !== null);
                var reason, comment, cancelledBy;
                if (typeofCheck) {
                    reason = cancellationDetails.reason || "";
                    comment = cancellationDetails.comment || "";
                    cancelledBy = cancellationDetails.cancelledBy || "";
                } else {
                    reason = cancellationDetails;
                    comment = "";
                    cancelledBy = "";
                }
                results.test5_enrollmentSimulation = {
                    description: "Simulates enrollment cancel code: build object then typeof check",
                    cancellationDetails: JSON.stringify(cancellationDetails),
                    typeofResult: typeof cancellationDetails,
                    typeofCheck: typeofCheck,
                    extractedReason: reason,
                    extractedComment: comment,
                    extractedCancelledBy: cancelledBy,
                    pathTaken: typeofCheck ? "OBJECT branch (correct)" : "STRING branch (bug!)"
                };
                logger.error("[TEST-TYPEOF] Test5 enrollment simulation: " + JSON.stringify(results.test5_enrollmentSimulation));

                // Test 6: Java-native objects
                try {
                    var javaMap = new java.util.HashMap();
                    javaMap.put("reason", "test reason from HashMap");
                    javaMap.put("cancelledBy", "BSP");
                    results.test6_javaHashMap = {
                        description: "java.util.HashMap",
                        typeof: typeof javaMap,
                        typeofIsObject: (typeof javaMap === 'object'),
                        reasonViaGet: String(javaMap.get("reason")),
                        reasonViaDot: (function() { try { return String(javaMap.reason); } catch(e) { return "ERROR: " + String(e); } })(),
                        reasonViaBracket: (function() { try { return String(javaMap["reason"]); } catch(e) { return "ERROR: " + String(e); } })(),
                        toString: String(javaMap),
                        javaClass: String(javaMap.getClass())
                    };
                    logger.error("[TEST-TYPEOF] Test6 HashMap typeof: " + typeof javaMap);
                    logger.error("[TEST-TYPEOF] Test6 HashMap result: " + JSON.stringify(results.test6_javaHashMap));
                } catch (e6) {
                    results.test6_javaHashMap = { error: String(e6) };
                    logger.error("[TEST-TYPEOF] Test6 HashMap error: " + String(e6));
                }

                // Test 7: Object created then passed through JSON round-trip
                var original = { reason: "test", cancelledBy: "BSP", comment: "my comment" };
                var roundTripped = JSON.parse(JSON.stringify(original));
                results.test7_jsonRoundTrip = {
                    description: "Object after JSON.parse(JSON.stringify(...))",
                    typeof: typeof roundTripped,
                    typeofIsObject: (typeof roundTripped === 'object'),
                    reasonValue: roundTripped.reason,
                    constructorName: roundTripped.constructor ? String(roundTripped.constructor) : "N/A"
                };
                logger.error("[TEST-TYPEOF] Test7 JSON round-trip typeof: " + typeof roundTripped);

                // Test 8: Alternative detection methods
                results.test8_alternativeChecks = {
                    description: "Alternative ways to detect objects vs strings",
                    obj: {
                        hasReasonProp: (jsObj.reason !== undefined),
                        inOperator: ("reason" in jsObj),
                        instanceofObject: (jsObj instanceof Object),
                        jsonStartsWithBrace: (JSON.stringify(jsObj).charAt(0) === '{'),
                        constructorIsObject: (jsObj.constructor === Object)
                    },
                    str: {
                        hasReasonProp: (str.reason !== undefined),
                        inOperator: (function() { try { return ("reason" in str); } catch(e) { return "ERROR: " + String(e); } })(),
                        instanceofObject: (str instanceof Object),
                        jsonStartsWithBrace: (JSON.stringify(str).charAt(0) === '{'),
                        typeofIsString: (typeof str === 'string')
                    }
                };
                logger.error("[TEST-TYPEOF] Test8 alternatives: " + JSON.stringify(results.test8_alternativeChecks));

                // Test 9: String coercion
                results.test9_stringCoercion = {
                    description: "String coercion with + '' and String()",
                    objPlusEmpty: (jsObj + ""),
                    objString: String(jsObj),
                    strPlusEmpty: (str + ""),
                    strString: String(str)
                };
                logger.error("[TEST-TYPEOF] Test9 coercion: " + JSON.stringify(results.test9_stringCoercion));

                logger.error("[TEST-TYPEOF] ===== All tests complete =====");

                return {
                    mode: "testTypeof",
                    message: "typeof behavior tests in PingIDM Rhino engine",
                    results: results
                };
            }

            // ======== Lookup Ping User Mode ========
            if (params.lookupPingUser) {
                return lookupPingUser(params);
            }

            // ======== Clean Up Ping User Mode ========
            if (params.cleanupPingUser) {
                return cleanupPingUser(params);
            }

            // ===== All remaining modes require kogId =====
            if (!params.kogId) {
                throw { code: 400, message: "This mode requires kogId. Available modes without kogId: createAccount, emailaddress/getUserDetails, lookupPingUser, cleanupPingUser, testTypeof" };
            }

            // Verify Prerequisite Mode: If verifyPrerequisite flag is set
            if (params.verifyPrerequisite) {
                logger.error("[TEST-KOG-PREREQ] Verify Prerequisite Mode - Detected");
                logger.error("[TEST-KOG-PREREQ] Input params: " + JSON.stringify(params));

                const prereqPayload = {
                    "KOGID": params.kogId,
                    "TransactionID": transactionId
                };

                logger.error("[TEST-KOG-PREREQ] KOG API Request Payload: " + JSON.stringify(prereqPayload));

                const prereqResponse = invokeKOGAPIGetUserPrerequisites(prereqPayload);

                logger.error("[TEST-KOG-PREREQ] KOG API Response received: " + JSON.stringify(prereqResponse));

                // Handle null response (API call failed)
                if (!prereqResponse) {
                    logger.error("[TEST-KOG-PREREQ] ✗ FAILED - null response from KOG API");
                    return {
                        success: false,
                        mode: "verifyPrerequisite",
                        message: "Failed to get user prerequisites - KOG API returned null response",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: prereqPayload
                        },
                        error: "Null response from invokeKOGAPIGetUserPrerequisites"
                    };
                }

                logger.error("[TEST-KOG-PREREQ] Response status: " + prereqResponse.ResponseStatus);
                logger.error("[TEST-KOG-PREREQ] Response message: " + (prereqResponse.ResponseMessage || "No message"));

                // Handle unsuccessful ResponseStatus
                if (prereqResponse.ResponseStatus !== 0) {
                    logger.error("[TEST-KOG-PREREQ] ✗ FAILED - ResponseStatus is " + prereqResponse.ResponseStatus + " (not 0)");
                    return {
                        success: false,
                        mode: "verifyPrerequisite",
                        message: "KOG API returned error status",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: prereqPayload
                        },
                        kogResponse: {
                            responseStatus: prereqResponse.ResponseStatus,
                            responseMessage: prereqResponse.ResponseMessage || "No error message provided",
                            fullResponse: prereqResponse
                        }
                    };
                }

                // Success case - parse prerequisites
                const prerequisites = prereqResponse.KOGUserPrerequisites || [];
                logger.error("[TEST-KOG-PREREQ] Total prerequisites found: " + prerequisites.length);

                // If prereqName is provided, verify if it exists
                if (params.prereqName) {
                    logger.error("[TEST-KOG-PREREQ] Verifying if prerequisite exists: " + params.prereqName);

                    let found = false;
                    let matchedPrereq = null;

                    for (let i = 0; i < prerequisites.length; i++) {
                        if (prerequisites[i].PrereqName === params.prereqName) {
                            found = true;
                            matchedPrereq = prerequisites[i];
                            logger.error("[TEST-KOG-PREREQ] ✓ FOUND - Prerequisite exists at index " + i);
                            break;
                        }
                    }

                    if (!found) {
                        logger.error("[TEST-KOG-PREREQ] ✗ NOT FOUND - Prerequisite does not exist in KOG");
                    }

                    return {
                        success: true,
                        mode: "verifyPrerequisite",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: prereqPayload
                        },
                        responseStatus: prereqResponse.ResponseStatus,
                        responseMessage: prereqResponse.ResponseMessage || "",
                        verification: {
                            prereqName: params.prereqName,
                            exists: found,
                            matchedPrerequisite: matchedPrereq
                        },
                        allPrerequisites: {
                            totalCount: prerequisites.length,
                            list: prerequisites
                        }
                    };
                } else {
                    // No specific prereqName provided, return all prerequisites
                    logger.error("[TEST-KOG-PREREQ] ✓ SUCCESS - Retrieved all user prerequisites");

                    return {
                        success: true,
                        mode: "verifyPrerequisite",
                        transactionId: transactionId,
                        requestDetails: {
                            inputParams: params,
                            apiPayload: prereqPayload
                        },
                        responseStatus: prereqResponse.ResponseStatus,
                        responseMessage: prereqResponse.ResponseMessage || "",
                        prerequisites: {
                            totalCount: prerequisites.length,
                            list: prerequisites
                        }
                    };
                }
            }

            // Query Authorizations Mode: If only kogId is provided, return authorizations
            if (!params.requestorKogId && !params.applicationName && !params.roleName && !params.userAuths) {
                logger.error("[TEST-KOG] Query Authorizations Mode - kogId only: " + params.kogId);
                const authPayload = {
                    "KOGID": params.kogId,
                    "TransactionID": transactionId
                };

                const authResponse = invokeKOGAPIUserAuthorizations(authPayload);

                if (!authResponse) {
                    logger.error("[TEST-KOG] Failed to get authorizations");
                    return {
                        success: false,
                        message: "Failed to get authorizations",
                        transactionId: transactionId
                    };
                }

                const auths = authResponse.UserAuthorizations || [];
                logger.error("[TEST-KOG] Query Authorizations Mode - Total authorizations: " + auths.length);

                return {
                    success: true,
                    mode: "queryAuthorizations",
                    transactionId: transactionId,
                    kogId: params.kogId,
                    totalCount: auths.length,
                    authorizations: auths
                };
            }

            // Assign Mode: If userAuths array is provided
            if (params.userAuths && Array.isArray(params.userAuths) && params.userAuths.length > 0) {
                logger.error("[TEST-KOG-ASSIGN] Assign Mode - Detected");

                // Validate required parameters for assign mode
                if (!params.requestorKogId) {
                    throw { code: 400, message: "Assign Mode: Missing required parameter: requestorKogId" };
                }

                logger.error("[TEST-KOG-ASSIGN] kogId: " + params.kogId);
                logger.error("[TEST-KOG-ASSIGN] requestorKogId: " + params.requestorKogId);
                logger.error("[TEST-KOG-ASSIGN] userAuths count: " + params.userAuths.length);

                // Build assign payload
                const assignPayload = {
                    "KOGID": params.kogId,
                    "RequestorKOGID": params.requestorKogId,
                    "TransactionID": transactionId,
                    "UserAuths": params.userAuths
                };

                // Add optional KYIDContextID if provided
                if (params.kyidContextId) {
                    assignPayload.KYIDContextID = params.kyidContextId;
                    logger.error("[TEST-KOG-ASSIGN] KYIDContextID: " + params.kyidContextId);
                }

                logger.error("[TEST-KOG-ASSIGN] Assign payload: " + JSON.stringify(assignPayload));

                // Get authorizations BEFORE assignment
                logger.error("[TEST-KOG-ASSIGN] ===== STEP 1: Get authorizations BEFORE assignment =====");
                const beforeAuthPayload = {
                    "KOGID": params.kogId,
                    "TransactionID": transactionId
                };
                const beforeAssignResponse = invokeKOGAPIUserAuthorizations(beforeAuthPayload);

                const beforeAssignAuths = beforeAssignResponse ? (beforeAssignResponse.UserAuthorizations || []) : [];
                logger.error("[TEST-KOG-ASSIGN] BEFORE assignment - Total authorizations: " + beforeAssignAuths.length);

                // Call KOG assign API
                logger.error("[TEST-KOG-ASSIGN] ===== STEP 2: Assign roles =====");
                const assignResponse = invokeKOGAPIRoleAssignment(assignPayload);

                if (!assignResponse) {
                    logger.error("[TEST-KOG-ASSIGN] Failed to assign roles - null response");
                    return {
                        success: false,
                        mode: "assign",
                        message: "Failed to assign roles - null response from KOG API",
                        transactionId: transactionId,
                        assignPayload: assignPayload,
                        beforeAssignment: {
                            totalCount: beforeAssignAuths.length,
                            authorizations: beforeAssignAuths
                        }
                    };
                }

                logger.error("[TEST-KOG-ASSIGN] Assign response status: " + assignResponse.ResponseStatus);
                logger.error("[TEST-KOG-ASSIGN] Assign response: " + JSON.stringify(assignResponse));

                // Get authorizations AFTER assignment
                logger.error("[TEST-KOG-ASSIGN] ===== STEP 3: Get authorizations AFTER assignment =====");
                const afterAuthPayload = {
                    "KOGID": params.kogId,
                    "TransactionID": transactionId
                };
                const afterAssignResponse = invokeKOGAPIUserAuthorizations(afterAuthPayload);

                const afterAssignAuths = afterAssignResponse ? (afterAssignResponse.UserAuthorizations || []) : [];
                logger.error("[TEST-KOG-ASSIGN] AFTER assignment - Total authorizations: " + afterAssignAuths.length);

                // Verify assignment
                const assignmentSuccessful = assignResponse.ResponseStatus === 0;
                logger.error("[TEST-KOG-ASSIGN] ===== STEP 4: Verify assignment =====");
                logger.error("[TEST-KOG-ASSIGN] Assignment successful: " + assignmentSuccessful);

                return {
                    success: true,
                    mode: "assign",
                    transactionId: transactionId,
                    assignOperation: {
                        payload: assignPayload,
                        response: assignResponse
                    },
                    verification: {
                        assignmentSuccessful: assignmentSuccessful,
                        beforeCount: beforeAssignAuths.length,
                        afterCount: afterAssignAuths.length,
                        rolesAdded: afterAssignAuths.length - beforeAssignAuths.length
                    },
                    beforeAssignment: {
                        totalCount: beforeAssignAuths.length,
                        authorizations: beforeAssignAuths
                    },
                    afterAssignment: {
                        totalCount: afterAssignAuths.length,
                        authorizations: afterAssignAuths
                    }
                };
            }

            // Delete Mode: Validate all required parameters
            if (!params.requestorKogId) {
                throw { code: 400, message: "Missing required parameter: requestorKogId" };
            }
            if (!params.applicationName) {
                throw { code: 400, message: "Missing required parameter: applicationName" };
            }
            if (!params.roleName) {
                throw { code: 400, message: "Missing required parameter: roleName" };
            }

            logger.error("[TEST-KOG-DELETE] Delete Mode - Parameters validated");
            logger.error("[TEST-KOG-DELETE] kogId: " + params.kogId);
            logger.error("[TEST-KOG-DELETE] requestorKogId: " + params.requestorKogId);
            logger.error("[TEST-KOG-DELETE] applicationName: " + params.applicationName);
            logger.error("[TEST-KOG-DELETE] roleName: " + params.roleName);
            logger.error("[TEST-KOG-DELETE] TransactionID: " + transactionId);

            // Step 1: Get authorizations BEFORE deletion
            logger.error("[TEST-KOG-DELETE] ===== STEP 1: Get authorizations BEFORE deletion =====");
            const beforePayload = {
                "KOGID": params.kogId,
                "TransactionID": transactionId
            };
            const beforeDeleteResponse = invokeKOGAPIUserAuthorizations(beforePayload);

            if (!beforeDeleteResponse) {
                logger.error("[TEST-KOG-DELETE] Failed to get BEFORE authorizations");
                return {
                    success: false,
                    message: "Failed to get authorizations before deletion",
                    transactionId: transactionId
                };
            }

            const beforeDeleteAuths = beforeDeleteResponse.UserAuthorizations || [];
            logger.error("[TEST-KOG-DELETE] BEFORE deletion - Total authorizations: " + beforeDeleteAuths.length);

            // Find the target role in before state
            let targetRoleBeforeExists = false;
            for (let i = 0; i < beforeDeleteAuths.length; i++) {
                if (beforeDeleteAuths[i].ApplicationName === params.applicationName &&
                    beforeDeleteAuths[i].RoleName === params.roleName) {
                    targetRoleBeforeExists = true;
                    logger.error("[TEST-KOG-DELETE] Target role found at index " + i + ": " + JSON.stringify(beforeDeleteAuths[i]));
                    break;
                }
            }

            if (!targetRoleBeforeExists) {
                logger.error("[TEST-KOG-DELETE] WARNING: Target role NOT found in BEFORE state");
            }

            // Step 2: Delete the role
            logger.error("[TEST-KOG-DELETE] ===== STEP 2: Delete the role =====");

            const userAuth = {
                ApplicationName: params.applicationName,
                RoleName: params.roleName,
                KOGOrgID: params.kogOrgId || "0",
                OrgBusinessKeyID: params.orgBusinessKeyId || null
            };

            // Add optional delegator IDs if provided
            if (params.currentDelegatorKogId) {
                userAuth.CurrentDelegatorKOGID = params.currentDelegatorKogId;
            }
            if (params.originalDelegatorKogId) {
                userAuth.OriginalDelegatorKOGID = params.originalDelegatorKogId;
            }

            const deletePayload = {
                "KOGID": params.kogId,
                "RequestorKOGID": params.requestorKogId,
                "TransactionID": transactionId,
                "UserAuths": [userAuth]
            };

            logger.error("[TEST-KOG-DELETE] Delete payload: " + JSON.stringify(deletePayload));
            const deleteResponse = invokeKOGAPIRoleRemoval(deletePayload);

            if (!deleteResponse) {
                logger.error("[TEST-KOG-DELETE] Failed to delete role - null response");
                return {
                    success: false,
                    message: "Failed to delete role - null response from KOG API",
                    transactionId: transactionId,
                    beforeAuthorizations: beforeDeleteAuths,
                    deletePayload: deletePayload
                };
            }

            logger.error("[TEST-KOG-DELETE] Delete response status: " + deleteResponse.ResponseStatus);
            logger.error("[TEST-KOG-DELETE] Delete response message: " + deleteResponse.ResponseMessage);

            // Step 3: Get authorizations AFTER deletion
            logger.error("[TEST-KOG-DELETE] ===== STEP 3: Get authorizations AFTER deletion =====");
            const afterPayload = {
                "KOGID": params.kogId,
                "TransactionID": transactionId
            };
            const afterDeleteResponse = invokeKOGAPIUserAuthorizations(afterPayload);

            if (!afterDeleteResponse) {
                logger.error("[TEST-KOG-DELETE] Failed to get AFTER authorizations");
                return {
                    success: false,
                    message: "Failed to get authorizations after deletion",
                    transactionId: transactionId,
                    beforeAuthorizations: beforeDeleteAuths,
                    deleteResponse: deleteResponse,
                    deletePayload: deletePayload
                };
            }

            const afterDeleteAuths = afterDeleteResponse.UserAuthorizations || [];
            logger.error("[TEST-KOG-DELETE] AFTER deletion - Total authorizations: " + afterDeleteAuths.length);

            // Find the target role in after state
            let targetRoleAfterExists = false;
            for (let i = 0; i < afterDeleteAuths.length; i++) {
                if (afterDeleteAuths[i].ApplicationName === params.applicationName &&
                    afterDeleteAuths[i].RoleName === params.roleName) {
                    targetRoleAfterExists = true;
                    logger.error("[TEST-KOG-DELETE] WARNING: Target role STILL EXISTS at index " + i + ": " + JSON.stringify(afterDeleteAuths[i]));
                    break;
                }
            }

            // Step 4: Verify deletion
            logger.error("[TEST-KOG-DELETE] ===== STEP 4: Verify deletion =====");
            const deletionSuccessful = targetRoleBeforeExists && !targetRoleAfterExists;

            if (deletionSuccessful) {
                logger.error("[TEST-KOG-DELETE] SUCCESS: Target role was deleted");
            } else if (!targetRoleBeforeExists) {
                logger.error("[TEST-KOG-DELETE] WARNING: Target role did not exist before deletion");
            } else if (targetRoleAfterExists) {
                logger.error("[TEST-KOG-DELETE] FAILURE: Target role still exists after deletion");
            }

            return {
                success: true,
                transactionId: transactionId,
                targetRole: {
                    applicationName: params.applicationName,
                    roleName: params.roleName
                },
                verification: {
                    existedBefore: targetRoleBeforeExists,
                    existsAfter: targetRoleAfterExists,
                    deletionSuccessful: deletionSuccessful
                },
                beforeDeletion: {
                    totalCount: beforeDeleteAuths.length,
                    authorizations: beforeDeleteAuths
                },
                deleteOperation: {
                    payload: deletePayload,
                    response: deleteResponse
                },
                afterDeletion: {
                    totalCount: afterDeleteAuths.length,
                    authorizations: afterDeleteAuths
                }
            };

        } catch (error) {
            logger.error("[TEST-KOG-DELETE] Exception: " + JSON.stringify(error));
            throw { code: 500, message: "Error in testKOGDelete: " + JSON.stringify(error) };
        }

    } else if (request.method === 'read') {
        return {
            message: "testKOG endpoint - Test KOG operations: get user details, verify prerequisites, query authorizations, assign and delete roles",
            modes: {
                createAccount: {
                    description: "Create a new user account in KOG (for testing JIT flow)",
                    requiredParameters: {
                        createAccount: "Set to true to enable this mode",
                        emailAddress: "User's email address",
                        firstName: "User's first name",
                        lastName: "User's last name",
                        password: "User's password"
                    },
                    optionalParameters: {
                        alternateEmail: "Alternate email address",
                        mobilePhone: "Mobile phone number",
                        address1: "Address line 1",
                        address2: "Address line 2",
                        city: "City",
                        state: "State (2-letter code)",
                        zipcode: "Zip code",
                        countyCode: "County code",
                        languagePreference: "1=English (default), 2=Spanish",
                        contextId: "Context ID (auto-generated if not provided)"
                    },
                    example: {
                        createAccount: true,
                        emailAddress: "testuser@example.com",
                        firstName: "Test",
                        lastName: "User",
                        password: "TempPass123!",
                        mobilePhone: "5025551234",
                        state: "KY"
                    },
                    notes: "Creates user in KOG only (not in PingAIC). Use this to create test users for JIT provisioning testing."
                },
                getUserDetails: {
                    description: "Get complete user profile information from KOG",
                    requiredParameters: {
                        emailaddress: "User's email address"
                    },
                    alternativeParameters: {
                        kogId: "Target user's KOG ID (userName)",
                        getUserDetails: "Set to true when using kogId"
                    },
                    example1: {
                        emailaddress: "user@example.com"
                    },
                    example2: {
                        kogId: "18aebb6d-3610-4f02-82d3-c6b8e308d777",
                        getUserDetails: true
                    }
                },
                verifyPrerequisite: {
                    description: "Verify if a prerequisite exists in KOG or list all user prerequisites",
                    requiredParameters: {
                        kogId: "Target user's KOG ID (userName)",
                        verifyPrerequisite: "Set to true to enable this mode"
                    },
                    optionalParameters: {
                        prereqName: "Prerequisite name to verify (if not provided, returns all prerequisites)"
                    },
                    example1: {
                        kogId: "18aebb6d-3610-4f02-82d3-c6b8e308d777",
                        verifyPrerequisite: true,
                        prereqName: "Remote Identity Proofing: LexisNexis"
                    },
                    example2: {
                        kogId: "18aebb6d-3610-4f02-82d3-c6b8e308d777",
                        verifyPrerequisite: true
                    },
                    notes: "Use example1 to verify a specific prerequisite exists, or example2 to list all prerequisites"
                },
                queryAuthorizations: {
                    description: "Query user authorizations/roles (provide only kogId)",
                    requiredParameters: {
                        kogId: "Target user's KOG ID (userName)"
                    },
                    example: {
                        kogId: "18aebb6d-3610-4f02-82d3-c6b8e308d777"
                    }
                },
                assign: {
                    description: "Assign roles to user and verify (provide kogId, requestorKogId, userAuths)",
                    requiredParameters: {
                        kogId: "Target user's KOG ID (userName)",
                        requestorKogId: "Requestor's KOG ID",
                        userAuths: "Array of roles to assign"
                    },
                    optionalParameters: {
                        kyidContextId: "KYID Context ID"
                    },
                    userAuthsFormat: {
                        ApplicationName: "Application name",
                        RoleName: "Role name",
                        CurrentDelegatorKOGID: "Current delegator's KOG ID (optional)",
                        OriginalDelegatorKOGID: "Original delegator's KOG ID (optional)",
                        KOGOrgID: "Organization ID (optional, default '0')",
                        OrgBusinessKeyID: "Organization business key ID (optional)"
                    }
                },
                delete: {
                    description: "Delete role and verify (provide kogId, requestorKogId, applicationName, roleName)",
                    requiredParameters: {
                        kogId: "Target user's KOG ID (userName)",
                        requestorKogId: "Requestor's KOG ID",
                        applicationName: "Application name",
                        roleName: "Role name"
                    },
                    optionalParameters: {
                        currentDelegatorKogId: "Current delegator's KOG ID",
                        originalDelegatorKogId: "Original delegator's KOG ID",
                        kogOrgId: "Organization ID (default: '0')",
                        orgBusinessKeyId: "Organization business key ID"
                    }
                },
                testTypeof: {
                    description: "Test typeof behavior in PingIDM's Rhino engine (for debugging cancel enrollment email bug)",
                    requiredParameters: {
                        testTypeof: "Set to true to run typeof tests"
                    },
                    example: {
                        testTypeof: true
                    },
                    notes: "Tests typeof on JS objects, Java Maps, strings, null, and simulates enrollment cancel code path"
                }
            }
        };

    } else {
        throw { code: 405, message: "Method not allowed. Use POST for role operations or GET for usage info." };
    }
}());