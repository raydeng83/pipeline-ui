const tenantBaseUrl = identityServer.getProperty("esv.kyid.tenant.fqdn");

if (tenantBaseUrl && tenantBaseUrl != null) {
    logger.error("tenantBaseUrl is: " + tenantBaseUrl)
} else {
    logger.error("tenantBaseUrl error, esv.kyid.tenant.fqdn value is: " + tenantBaseUrl)
}

var UUID = java.util.UUID;

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
  
    // Audit logger related variables
    const transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value ? context.transactionId.transactionId.value : ""
    const sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId ? context.oauth2.rawInfo.sessionRefId : ""
    const sessionDetailsauditLogger = sessionRefIDauditLogger ? { "sessionRefId": sessionRefIDauditLogger } : {}

    const authenticatedUserId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sub ? context.oauth2.rawInfo.sub : ""
    var currentTimeinEpoch = Date.now()
    var currentDate = new Date().toISOString()
    if (request.method === 'create') {
        const payload = request.content.payload
        const view = payload.view
        const action = request.content.action
        // var view = payload.view;
        var queryFilter = payload.queryFilter;
        var returnProperties = payload.returnProperties;
        var auditReason = (payload.confirmation && payload.confirmation.reason) ? payload.confirmation.reason : "";
        var auditComment = (payload.confirmation && payload.confirmation.comment) ? payload.confirmation.comment : "";
        var transactionId = request.content.transactionId || transactionIdauditLogger || "N/A";
        // logger.info("View: " + view);
        logger.info("Query Filter: " + queryFilter);
        logger.info("Return Properties: " + returnProperties);

        if (action === 2) {
            return cancelWorkflowRequest(payload.requestId, payload.accessToken);
        } else if (action === 3) {
            var filter = payload.UserPrerequisitiesIDs.map(id => "_id eq '" + id + "'").join(" or ");
            var queryParams = {
                _queryFilter: filter,
                _fields: "*" // Get all fields for update
            };

            var searchResult = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", queryParams);
            var updateResults = [];
            var removedRoles = [];
            var actionType = "DELETE";
            if (searchResult && searchResult.result && searchResult.result.length > 0) {
                const auditLoggerObj = {
                    transactionIdauditLogger: transactionIdauditLogger,
                    sessionRefIDauditLogger: sessionRefIDauditLogger,
                    sessionDetailsauditLogger: sessionDetailsauditLogger
                };

                // Use for loop instead of forEach to enable early return on first error (fail-fast)
                for (var i = 0; i < searchResult.result.length; i++) {
                    var obj = searchResult.result[i];

                    try {
                        // Mark as REMOVED and audit
                        obj.recordState = "1";
                        logger.debug("object value - " + JSON.stringify(obj))
                        cascadeDeleteAndCollectRoles(obj, obj.requesterUserAccountId, removedRoles, auditReason, auditComment, actionType, updateResults, auditLoggerObj);

                    } catch (e) {
                        // Add PRE002 audit log for main loop exception
                        var eventCode = "PRE002";
                        var eventName = "Remove Pre-requisite Failure";
                        var eventDetails = {
                            error: String(e),
                            userPrerequisiteId: obj._id,
                            failurePoint: "Main loop exception during prerequisite removal",
                            enrollmentContextID: obj.enrollmentRequestId || "N/A",
                            requestedUserAccountId: obj.requestedUserAccountId || "N/A"
                        };

                        // Safely get user details
                        var requestedAlphaUser = null;
                        var userMail = null;
                        try {
                            requestedAlphaUser = getUserDetails(obj.requestedUserAccountId);
                            userMail = requestedAlphaUser && requestedAlphaUser.mail ? requestedAlphaUser.mail : null;
                        } catch (err) {
                            logger.error("Failed to get user details in catch block: " + err);
                        }

                        auditLogger(eventCode, eventName, auditLoggerObj.sessionDetailsauditLogger, eventDetails,
                            obj.requesterUserAccountId, obj.requestedUserAccountId,
                            auditLoggerObj.transactionIdauditLogger, userMail, "",
                            auditLoggerObj.sessionRefIDauditLogger);

                        return {
                            "responseCode": 2,
                            "transactionId": transactionIdauditLogger || "N/A",
                            "message": {
                                "content": "An unexpected error occurred when submitting the request. Please try again later. REF-001",
                                "code": "2"
                            }
                        };
                    }
                }
            } else {
                // Add PRE002 audit log when no records found
                var eventCode = "PRE002";
                var eventName = "Remove Pre-requisite Failure";
                var eventDetails = {
                    error: "No user prerequisites found",
                    queryFilter: queryFilter,
                    userPrerequisiteIds: payload.UserPrerequisitiesIDs ? payload.UserPrerequisitiesIDs.join(", ") : "N/A",
                    failurePoint: "Query returned no results"
                };

                auditLogger(eventCode, eventName, sessionDetailsauditLogger, eventDetails,
                    authenticatedUserId, null, transactionIdauditLogger, null, "",
                    sessionRefIDauditLogger);

                return {
                    "responseCode": 2,
                    "transactionId": transactionIdauditLogger || "N/A",
                    "message": {
                        "content": "An unexpected error occurred when submitting the request. Please try again later. REF-002",
                        "code": "2"
                    }
                };
            }

            // --------- OUTPUT ---------
            // Check if there are any failures in updateResults
            var hasFailures = false;
            var failureDetails = [];

            for (var i = 0; i < updateResults.length; i++) {
                if (updateResults[i].status !== "Updated") {
                    hasFailures = true;
                    failureDetails.push({
                        userPrerequisiteId: updateResults[i].enrollmentRequestID,
                        status: updateResults[i].status,
                        error: updateResults[i].error
                    });
                }
            }

            if (hasFailures) {
                return {
                    "responseCode": 2,
                    "transactionId": transactionIdauditLogger || "N/A",
                    "message": {
                        "content": "An unexpected error occurred when submitting the request. Please try again later. REF-003",
                        "code": "2"
                    }
                };
            }

            // Success case
            const userPreReqData = updateResults.map(result => ({
                userPrerequisiteId: result.enrollmentRequestID,
                message: "User Pre-requisite removed successfully"
            }));

            let returnPayload = {
                "responseCode": 0,
                "transactionId": transactionIdauditLogger || "N/A",
                "message": {
                    "content": "Success",
                    "code": "0"
                },
                "payload": {
                    "data": userPreReqData
                }
            }
            return returnPayload;

        } else if (action === 4) {
            try {
                if (view && view == "InfoForPendingApproval") {
                    return getInfoForPendingApproval(payload.userPrerequisiteId)
                }

                var results = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
                    "_queryFilter": queryFilter
                }, ["*", "preRequisiteId/*", "preRequisiteTypeId/*"]);

                var prerequisites = buildPrerequisitesPayload(results);

                // Add FAQ helpTopics to response
                var helpTopic = getFaqTopidId("expiredPrerequisites", "expiredPrerequisitesSummary");
                logger.error("helpTopic: " + JSON.stringify(helpTopic));

                let returnPayload = {
                    "responseCode": 0,
                    "transactionId": transactionIdauditLogger || "",
                    "message": {
                        "content": "Success",
                        "code": "0"
                    },
                    "payload": {
                        "data": prerequisites
                    },
                    "helpTopics": helpTopic
                }

                return returnPayload;

            } catch (error) {
                logger.error("getUserPrerequsities endpoint error: " + error);
                let returnPayload = {
                    "responseCode": 2,
                    "transactionId": transactionIdauditLogger || "",
                    "message": {
                        "content": "An unexpected error occurred when submitting the request. Please try again later. REF-004",
                        "code": "2"
                    }
                }
                return returnPayload;
            }

        }

        // POST
        return {};
    } else if (request.method === 'read') {
        // GET
        return {};
    } else if (request.method === 'update') {
        // PUT
        return {};
    } else if (request.method === 'patch') {
        return {};
    } else if (request.method === 'delete') {
        return {};
    }
    throw {
        code: 500,
        message: 'Unknown error'
    };
}());

/**
 * Remove a role for a user using only user ID and role ID.
 * This will remove all matching access records for the user/role combination.
 */
function removeUserRole(requestedUserId, roleId, requesterUserId, reason, comment) {
    var LOG_PREFIX = "[UserPrereq_v2B][RemoveRole]";
    var endpointPath = "endpoint/access_v2B";
    var payload = {
        "payload": {
            "queryFilter": "user/_refResourceId eq '" + requestedUserId + "' and role/_refResourceId eq '" + roleId + "'",
            "id": requesterUserId,
            "confirmation": {
                "reason": reason || "Role removal requested",
                "comment": comment || "Removed via user prerequisite"
            }
        },
        "action": "3"
    };

    // Call the endpoint

    var response = openidm.create(endpointPath, null, payload);

    if (response && response.responseCode !== "0") {
        logger.error(LOG_PREFIX + " Role removal failed - roleId: " + roleId + ", response: " + JSON.stringify(response));
    }

    return response;
}


function getLangCode(code, languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}


function markUserPrerequisiteRemoved(userPrereqObj, actionType, auditReason, auditComment, requesterUserId, updateResults, auditLoggerObj) {
    var LOG_PREFIX = "[UserPrereq_v2B]";
    var updateStatus = "Updated";
    var errorMessage = "";
    var eventCode = "PRE002";
    var eventName = "Remove Pre-requisite Failure";
    if (typeof userPrereqObj.audit !== 'object' || userPrereqObj.audit === null || Array.isArray(userPrereqObj.audit)) {
        userPrereqObj.audit = {};
    }
    userPrereqObj.audit = {
        action: actionType,
        reason: auditReason,
        comment: auditComment,
        requesterUserId: requesterUserId
    };
    // audit record
    let eventDetails;
    try {
        var prereq = userPrereqObj.preRequisiteId && userPrereqObj.preRequisiteId._refResourceId
            ? fetchPrerequisite(userPrereqObj.preRequisiteId._refResourceId)
            : null;
        var prereqName = prereq && prereq.name ? prereq.name : "";
        var prereqDisplayName = prereq && prereq.displayName && prereq.displayName["en"] ? prereq.displayName["en"] : "N/A";
        var associatedRoleIds = userPrereqObj.associatedRoleIds || "";
        var roleDetails = associatedRoleIds ? fetchRoleDetails(associatedRoleIds.trim()) : null;

        eventDetails = {
            prerequisiteName: prereqDisplayName,
            roleName: roleDetails && roleDetails.roleName && roleDetails.roleName["en"] ? roleDetails.roleName["en"] : "N/A",
            applicationName: roleDetails && roleDetails.applicationName && roleDetails.applicationName["en"] ? roleDetails.applicationName["en"] : "N/A",
            enrollmentContextID: userPrereqObj.enrollmentRequestId
        };

        var requesterAlphaUser = getUserDetails(userPrereqObj.requesterUserAccountId);
        var requestorKOGID = requesterAlphaUser && requesterAlphaUser != null ? requesterAlphaUser.userName : null;
        var requestedAlphaUser = getUserDetails(userPrereqObj.requestedUserAccountId);
        var kogId = requestedAlphaUser && requestedAlphaUser != null ? requestedAlphaUser.userName : null;

        // Check if KOG API call is enabled for UserPrerequisite via ESV (default: disabled unless explicitly set to "true")
        var enableKOGAPI = identityServer.getProperty("esv.kyid.userprerequisite.enable.kog");
        var isKOGEnabled = (enableKOGAPI === "true");

        if (isKOGEnabled) {
            // ===== STEP 1: Call KOG API FIRST (before updating KYID database) =====
            // This ensures data consistency - if KOG fails, KYID data remains unchanged
            var kogTransactionId = UUID.randomUUID().toString();
            logger.error(LOG_PREFIX + " STEP 1: Calling KOG API - prereqName: " + prereqName + ", TransactionID: " + kogTransactionId);

            var kogAPIResponse = invokeKOGAPI(userPrereqObj, prereqName, kogId, requestorKOGID, kogTransactionId);

            if (!kogAPIResponse || kogAPIResponse.ResponseStatus !== 0) {
                // KOG API failed - do NOT update KYID database
                logger.error(LOG_PREFIX + " KOG API failed - prereqName: " + prereqName +
                    ", ResponseStatus: " + (kogAPIResponse ? kogAPIResponse.ResponseStatus : "null"));

                updateStatus = "Failed at KOG";
                errorMessage = "KOG API returned non-zero response status or failed";
                eventCode = "PRE002";
                eventName = "Remove Pre-requisite Failure";
                eventDetails.kogError = kogAPIResponse ? JSON.stringify(kogAPIResponse) : "KOG API returned null/undefined";

                auditLogger(eventCode, eventName, auditLoggerObj.sessionDetailsauditLogger, eventDetails,
                    userPrereqObj.requesterUserAccountId, userPrereqObj.requestedUserAccountId,
                    auditLoggerObj.transactionIdauditLogger, requestedAlphaUser ? requestedAlphaUser.mail : null,
                    roleDetails && roleDetails.applicationName && roleDetails.applicationName["en"] ? roleDetails.applicationName["en"] : "",
                    auditLoggerObj.sessionRefIDauditLogger);

                updateResults.push({
                    enrollmentRequestID: userPrereqObj._id,
                    status: updateStatus,
                    error: errorMessage
                });

                // Return early - do not update KYID or send email
                return;
            }
        } else {
            // KOG API is disabled - skip KOG call
            logger.error(LOG_PREFIX + " STEP 1: KOG API disabled (esv.kyid.userprerequisite.enable.kog not set to true), skipping KOG call");
        }

        // ===== STEP 2: Update KYID database =====
        logger.error(LOG_PREFIX + " STEP 2: " + (isKOGEnabled ? "KOG succeeded, updating KYID database" : "Updating KYID database (KOG API skipped)"));

        var patchOperations = [
            {
                "operation": "replace",
                "field": "/recordState",
                "value": userPrereqObj.recordState
            },
            {
                "operation": "replace",
                "field": "/audit",
                "value": userPrereqObj.audit
            }
        ];

        var httpResult = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqObj._id, null, patchOperations);

        if (!httpResult) {
            // KYID patch failed
            logger.error(LOG_PREFIX + " WARNING: " + (isKOGEnabled ? "KOG API succeeded but KYID patch failed - data inconsistency!" : "KYID patch failed (KOG API was skipped)"));
            updateStatus = "Failed at KYID";
            errorMessage = isKOGEnabled ? "KYID patch failed but KOG API succeeded - manual intervention may be required" : "KYID patch failed (KOG API was skipped)";

            eventCode = "PRE002";
            eventName = "Remove Pre-requisite Failure";
            eventDetails.error = errorMessage;
            if (isKOGEnabled) {
                eventDetails.kogSuccess = true;
            }
            eventDetails.kyidFailed = true;

            auditLogger(eventCode, eventName, auditLoggerObj.sessionDetailsauditLogger, eventDetails,
                userPrereqObj.requesterUserAccountId, userPrereqObj.requestedUserAccountId,
                auditLoggerObj.transactionIdauditLogger, requestedAlphaUser ? requestedAlphaUser.mail : null,
                roleDetails && roleDetails.applicationName && roleDetails.applicationName["en"] ? roleDetails.applicationName["en"] : "",
                auditLoggerObj.sessionRefIDauditLogger);

            updateResults.push({
                enrollmentRequestID: userPrereqObj._id,
                status: updateStatus,
                error: errorMessage
            });
            return;
        }

        // ===== STEP 3: Send email notification (only if KYID succeeded) =====
        var locale = "en"
        // fix for ticket 202679
        var languageMap = identityServer.getProperty("esv.language.preference");
        var mail = requestedAlphaUser && requestedAlphaUser != null ? requestedAlphaUser.mail : null;
        var givenName = requestedAlphaUser && requestedAlphaUser != null ? requestedAlphaUser.givenName : null;
        var lastName = requestedAlphaUser && requestedAlphaUser != null ? requestedAlphaUser.sn : null;
        var languagePreference = requestedAlphaUser && requestedAlphaUser != null ? requestedAlphaUser.custom_languagePreference : null;
        if (languageMap && languageMap != null) {
            locale = getLangCode(requestedAlphaUser.custom_languagePreference, languageMap);
        }

        var templateID = "kyid2B1UsrprereqRemoval";
        var helpdeskPhoneNunber = getHelpdeskNumber();
        var dateTime = isoToEastern();
        var payload = {
            mail: mail,
            timeStamp: dateTime,
            givenName: givenName,
            sn: lastName,
            preReqName: prereqDisplayName,
            phoneContact: helpdeskPhoneNunber
        };

        sendMail(mail, payload, templateID, locale);
        logger.error(LOG_PREFIX + " STEP 3: Email sent to " + mail);

        // All operations succeeded
        updateStatus = "Updated";

    } catch (error) {
        logger.error(LOG_PREFIX + " Exception in markUserPrerequisiteRemoved - UserPrereqId: " + userPrereqObj._id + ", Error: " + String(error))
        updateStatus = "Failed - Exception";
        errorMessage = "An unexpected error occurred during prerequisite removal";

        eventCode = "PRE002";
        eventName = "Remove Pre-requisite Failure";

        // Build event details for error case
        eventDetails = {
            error: errorMessage,
            userPrerequisiteId: userPrereqObj._id,
            failurePoint: "Exception during prerequisite removal operation"
        };

        auditLogger(eventCode, eventName, auditLoggerObj.sessionDetailsauditLogger, eventDetails,
            userPrereqObj.requesterUserAccountId, userPrereqObj.requestedUserAccountId,
            auditLoggerObj.transactionIdauditLogger, requestedAlphaUser ? requestedAlphaUser.mail : null,
            roleDetails && roleDetails.applicationName && roleDetails.applicationName["en"] ? roleDetails.applicationName["en"] : "",
            auditLoggerObj.sessionRefIDauditLogger);

        updateResults.push({
            enrollmentRequestID: userPrereqObj._id,
            status: updateStatus,
            error: errorMessage
        });

        return;
    }

    // If we reach here, all operations succeeded (KOG API, KYID patch, email)
    if (updateStatus === "Updated") {
        eventCode = "PRE001";
        eventName = "Remove Pre-requisite Success";

        auditLogger(eventCode, eventName, auditLoggerObj.sessionDetailsauditLogger, eventDetails,
            userPrereqObj.requesterUserAccountId, userPrereqObj.requestedUserAccountId,
            auditLoggerObj.transactionIdauditLogger, requestedAlphaUser ? requestedAlphaUser.mail : null,
            roleDetails && roleDetails.applicationName && roleDetails.applicationName["en"] ? roleDetails.applicationName["en"] : "",
            auditLoggerObj.sessionRefIDauditLogger);

        updateResults.push({
            enrollmentRequestID: userPrereqObj._id,
            status: updateStatus,
            error: errorMessage
        });
    }
    // Note: All failure cases (KOG failure, KYID failure, exceptions) have already been handled
    // with audit logging and early return, so they don't reach this point
}


/**
 * Get user details from Alpha User Managed Object based on userAccountId
 */
function getUserDetails(userAccountId) {
    var alphaUser = openidm.read("managed/alpha_user/" + userAccountId, null, ["*"]);
    return alphaUser && alphaUser != null ? alphaUser : null;
}

function invokeKOGAPI(userPrereqObj, PrereqName, kogId, requestorKOGID, transactionId) {
    var LOG_PREFIX = "[UserPrereq_v2B][KOG_API]";

    try {
        // Get URL from ESV, fallback to hardcoded URL if ESV is not configured
        var kogApiUrl = identityServer.getProperty("esv.kyid.usr.addremoveuserprereq");
        if (!kogApiUrl) {
            kogApiUrl = "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/addremoveuserprereq";
            logger.error(LOG_PREFIX + " ESV 'esv.kyid.usr.addremoveuserprereq' not configured, using fallback URL: " + kogApiUrl);
        }

        const requestBody = {
            "url": kogApiUrl,
            "scope": "kogkyidapi.addremoveuserprereq",
            "method": "POST",
            "payload": {
                //"KOGID": userPrereqObj._id,
                "KOGID": kogId,
                "ActionFlag": 2,
                "TransactionID": transactionId,
                "RequestorKOGID": requestorKOGID,
                "KOGUserPrereq": {
                    // "PrereqName": fetchPrerequisite(userPrereqObj._id).displayName,
                    "PrereqName": PrereqName,
                    "CompletionDate": null,
                    "UserRoles": null
                },
                "KYIDUserProfile": null
            }
        }

        const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);

        if (response && response.status === "200") {
            // Response structure: response.response.ResponseStatus
            var kogResponse = response.response;
            if (!kogResponse) {
                logger.error(LOG_PREFIX + " Invalid response structure - Missing response.response");
                throw "Invalid KOG API response: Missing response.response";
            }

            if (kogResponse.ResponseStatus === 0) {
                return kogResponse
            } else {
                logger.error(LOG_PREFIX + " Failed - PrereqName: " + PrereqName +
                    ", ResponseStatus: " + kogResponse.ResponseStatus +
                    ", Message: " + (kogResponse.ResponseMessage || "N/A"));
                return null
            }
        } else {
            logger.error(LOG_PREFIX + " Invalid response - Status: " + (response ? response.status : "null"));
            return null
        }
    } catch (error) {
        logger.error(LOG_PREFIX + " Exception - UserPrereqId: " + userPrereqObj._id +
            ", PrereqName: " + PrereqName +
            ", TransactionId: " + transactionId +
            ", Error: " + String(error));
        throw error;  // Preserve original error instead of just PrereqName
    }
}

/**
 * Call KOG API for removing user prerequisite
 */
/*function invokeKOGAPI(userPrereqObj) {
    try {
     const requestBody = {
       //"url": identityServer.getProperty("esv.kyid.usr.addremoveuserprereq"),
       "url" : "https://dev.sih.ngateway.ky.gov/dev2/kyidapi/V1/addremoveuserprereq",
       //"scope": identityServer.getProperty("esv.kyid.kogapi.token.addremoveuserprereq"),
       "scope" : "kogkyidapi.addremoveuserprereq",
       "method": "POST",
       "payload": {
         //"KOGID": userPrereqObj._id,
        // "KOGID" : getKOGIDForUser(userPrereqObj.requestedUserAccountId),
          "KOGID" : null,
         "ActionFlag": 2,
         //"TransactionID": request.content.transactionId || "N/A",
         "TransactionID": null,
         //"RequestorKOGID": getKOGIDForUser(userPrereqObj.requesterUserAccountId),
         "RequestorKOGID": null,
         "KOGUserPrereq": {
         //"PrereqName": fetchPrerequisite(userPrereqObj._id).name,
          "PrereqName" : "DOI Agent Credential",
           "CompletionDate": null,
           "UserRoles": null
           
         },
         "KYIDUserProfile": null
       }
     }
     const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
     return response;
     if (response && response.status === "200") {
       if (response.ResponseStatus === 0) {
         return response
       } else if (response.ResponseStatus === 1) {
         return null
       } else {
         throw JSON.stringify(response)
       }
     }
  } catch (error) {
    throw JSON.stringify(error)
  }
}*/

/**
 * Helper function to handle parameter validation errors consistently
 */
function handleParamValidationError(errorMsg, failurePoint, userPrereqObj, requesterUserId, updateResults, auditLoggerObj) {
    var LOG_PREFIX = "[UserPrereq_v2B]";
    logger.error(LOG_PREFIX + " Parameter validation failed: " + errorMsg);

    if (!auditLoggerObj || !updateResults || !Array.isArray(updateResults)) {
        return;
    }

    var eventDetails = {
        error: errorMsg,
        userPrerequisiteId: userPrereqObj ? userPrereqObj._id : "N/A",
        failurePoint: failurePoint
    };

    auditLogger("PRE002", "Remove Pre-requisite Failure",
        auditLoggerObj.sessionDetailsauditLogger || {},
        eventDetails,
        requesterUserId || "N/A",
        userPrereqObj ? userPrereqObj.requestedUserAccountId : "N/A",
        auditLoggerObj.transactionIdauditLogger || "N/A",
        null, "",
        auditLoggerObj.sessionRefIDauditLogger || "");

    updateResults.push({
        enrollmentRequestID: userPrereqObj ? userPrereqObj._id : "N/A",
        status: "Failed - Invalid Parameters",
        error: errorMsg
    });
}

/**
 * Cascading delete and role collection for user prerequisites.
 */
function cascadeDeleteAndCollectRoles(userPrereqObj, requesterUserId, removedRoles, auditReason, auditComment, actionType, updateResults, auditLoggerObj) {
    var LOG_PREFIX = "[UserPrereq_v2B]";

    // Parameter validation
    if (!userPrereqObj || !userPrereqObj._id || !userPrereqObj.requestedUserAccountId) {
        var errorMsg = "Invalid userPrereqObj: " + JSON.stringify({
            exists: !!userPrereqObj,
            hasId: userPrereqObj ? !!userPrereqObj._id : false,
            hasRequestedUserId: userPrereqObj ? !!userPrereqObj.requestedUserAccountId : false
        });
        handleParamValidationError(errorMsg, "Invalid userPrereqObj", userPrereqObj, requesterUserId, updateResults, auditLoggerObj);
        return;
    }

    if (!requesterUserId) {
        handleParamValidationError("Missing requesterUserId parameter", "Missing requesterUserId", userPrereqObj, requesterUserId, updateResults, auditLoggerObj);
        return;
    }

    if (!updateResults || !Array.isArray(updateResults)) {
        logger.error(LOG_PREFIX + " Parameter validation failed: updateResults is not an array");
        return;
    }

    if (!auditLoggerObj) {
        logger.error(LOG_PREFIX + " Parameter validation failed: missing auditLoggerObj");
        return;
    }

    markUserPrerequisiteRemoved(userPrereqObj, actionType, auditReason, auditComment, requesterUserId, updateResults, auditLoggerObj);

    //  Check associated prerequisite for disenrollment action
    var prereqObj = null;
    if (userPrereqObj.preRequisiteId && userPrereqObj.preRequisiteId._id) {
        try {
            prereqObj = openidm.read("managed/alpha_kyid_enrollment_prerequisite/" + userPrereqObj.preRequisiteId._id);
        } catch (e) {
            logger.error(LOG_PREFIX + " Failed to read prerequisite: " + e);
        }
    }
    if (prereqObj && prereqObj.disenrollmentActionSettings && prereqObj.disenrollmentActionSettings.removePrerequisite) {
        var roleId = userPrereqObj.associatedRoleIds;
        if (roleId) {
            removeUserRole(userPrereqObj.requestedUserAccountId, roleId, requesterUserId, auditReason, auditComment);
            removedRoles.push({
                roleId: roleId,
                status: "Updated"
            });
        }
        // 3. Find other user prerequisites for same user and role, not DELETED
        var queryFilter = 'associatedRoleIds eq "' + roleId + '" and requestedUserAccountId eq "' + userPrereqObj.requestedUserAccountId + '" and recordState ne "1"';
        var otherUserPrereqs = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
            _queryFilter: queryFilter,
            _fields: "*"
        });

        if (otherUserPrereqs && otherUserPrereqs.result && otherUserPrereqs.result.length > 0) {
            otherUserPrereqs.result.forEach(function (otherObj) {
                if (otherObj._id !== userPrereqObj._id) {
                    // Recursive cascade
                    cascadeDeleteAndCollectRoles(otherObj, requesterUserId, removedRoles, auditReason, auditComment, actionType, updateResults, auditLoggerObj);
                }
            });
        }
    }
}

/**
 * Builds an array of prerequisite payloads from the results object.
 * @param {Object} results - The input results containing prerequisite items.
 * @returns {Array} Array of attributes/objects for each prerequisite.
 */
function buildPrerequisitesPayload(results) {
    return (results.result || []).filter(function (item) {
        // Check preRequisiteId, and preRequisiteTypeId
        var hasValidPreReqId = item.preRequisiteId && item.preRequisiteId._id;
        var hasValidPreReqTypeId = (item.preRequisiteTypeId && item.preRequisiteTypeId._id);

        // Allow if any one is present AND not null/empty/undefined
        return hasValidPreReqId || hasValidPreReqTypeId;
    }).map(function (item, idx) {
        // Fetch prerequisite object
        var prereq = item.preRequisiteId && item.preRequisiteId._id ? fetchPrerequisite(item.preRequisiteId._id) : "";
        // Fetch prerequisitetype object
        var prereqTypeId = prereq && prereq.prereqTypeId && prereq.prereqTypeId._id ?
            prereq.prereqTypeId._id :
            (item.preRequisiteTypeId && item.preRequisiteTypeId._id ? item.preRequisiteTypeId._id : "");
        var prereqType = prereqTypeId ? fetchPrerequisiteType(prereqTypeId) : "";

        // Localized name
        var name = prereq && prereq.displayName ?
            prereq.displayName :
            (item.displayName || { en: "", es: "" });

        // Localized type
        var type = prereqType && prereqType.typeName ?
            { en: prereqType.typeName, es: prereqType.typeName } :
            (prereq && prereq.prereqTypeId && prereq.prereqTypeId.typeName ?
                { en: prereq.prereqTypeId.typeName, es: prereq.prereqTypeId.typeName } :
                { en: item.preRequisiteType || "", es: item.preRequisiteType || "" });

        // Localized description
        var description = prereq && prereq.displayDescription ?
            prereq.displayDescription :
            (prereq && prereq.description ?
                { en: prereq.description, es: prereq.description } :
                { en: "", es: "" });

        // Associated roles
        var associatedRoles = buildAssociatedRoles(item.associatedRoleIds);


        // Status
        var status = localizeStatus(item.status);
        var recordState = localizeStatus(item.recordState);

        // Dates
        var completionDate = formatDate(item.completionDate);
        var expiryDate = formatDate(item.expiryDate);

        // prerequisiteSourceName
        var prerequisiteSourceName = prereqType && prereqType.prerequisiteSourceName ? prereqType.prerequisiteSourceName : "";

        // Build and return the flat prerequisite object
        return {
            id: item._id || String(idx + 1),
            name: name ? name : "",
            type: type ? type : "",
            status: status ? status : "",
            recordState: recordState ? recordState : "",
            completionDate: completionDate ? completionDate : "",
            expiryDate: expiryDate ? expiryDate : "",
            associatedRoles: associatedRoles,
            description: description ? description : "",
            prerequisiteSourceName: prerequisiteSourceName ? prerequisiteSourceName : ""
        };
    });
}

function localizeStatus(status) {
    const map = {
        "COMPLETED": { en: "Completed", es: "Completado" },
        "NOT_STARTED": { en: "Pending", es: "Pendiente" },
        "IN_PROGRESS": { en: "In Progress", es: "En Progreso" },
        "CANCELLED": { en: "Cancelled", es: "Cancelado" },
        "REMOVED": { en: "Removed", es: "remota" },
        "0": { en: "Not started", es: "Not started" },
        "1": { en: "In Progress", es: "En Progreso" },
        "2": { en: "Completed", es: "Completado" },
        "3": { en: "Expired", es: "Expired" },
        "4": { en: "Timed Out", es: "Timed Out" },
        "5": { en: "Resubmitted", es: "Resubmitted" },
        "6": { en: "Cancelled", es: "Cancelado" }
    };
    return map[status] || { en: status, es: status };
}

function formatDate(dateString) {
    if (!dateString) return null;
    return dateString.split("T")[0];
}

// Fetch role details from alpha_role managed object
function fetchRoleDetails(roleId) {
    var role = openidm.read("managed/alpha_role/" + roleId, null, ["*", "businessAppId/*"]);
    if (!role) return null;

    // Get localized role name
    var roleName = { en: "", es: "" };
    var roleDesc = { en: "", es: "" };

    if (role.content && role.content.length > 0 && role.content[0].name) {
        roleName = {
            en: role.content[0].name.en || "",
            es: role.content[0].name.es || ""
        };
    } else if (role.name) {
        // Fallback: use role.name as both en and es
        roleName = { en: role.name, es: role.name };
    }


    if (role.content && role.content.length > 0 && role.content[0].description) {
        roleDesc = {
            en: role.content[0].description.en || "",
            es: role.content[0].description.es || ""
        };
    }

    // Get application name
    var applicationName = { "en": "", "es": "" };
    if (role.businessAppId && role.businessAppId.content[0].title) {
        applicationName = role.businessAppId.content[0].title;
    }
    var applicationDesc = { "en": "", "es": "" };
    if (role.businessAppId && role.businessAppId.content[0].content) {
        applicationDesc = role.businessAppId.content[0].content;
    }
    var applicationID = "";
    if (role.businessAppId && role.businessAppId) {
        applicationID = role.businessAppId._id;
    }



    return {
        roleId: roleId,
        applicationName: applicationName,
        roleName: roleName,
        roleDesc: roleDesc,
        applicationDesc: applicationDesc,
        applicationID: applicationID

    };
}

function buildAssociatedRoles(associatedRoleIds) {
    if (!associatedRoleIds) return [];
    var ids = associatedRoleIds.split(",");
    var roles = [];
    ids.forEach(function (roleId) {
        var roleDetails = fetchRoleDetails(roleId.trim());
        if (roleDetails) {
            roles.push(roleDetails);
        }
    });
    return roles;
}

function fetchPrerequisite(prereqId) {
    if (!prereqId) return null;
    var output = openidm.read("managed/alpha_kyid_enrollment_prerequisite/" + prereqId);
    return output;
}

function fetchPrerequisiteType(typeId) {
    if (!typeId) return null;
    var output = openidm.read("managed/alpha_kyid_enrollment_prerequisite_type/" + typeId);
    return output;
}

function httpCall(url, method, header, body) {
    try {
        var params = {
            url: url,
            method: method,
            headers: header,
            body: body
        }

        logger.error("custom-endpoint workflow Http REST call payload: " + JSON.stringify(params));

        var httpResult = openidm.action("/external/rest", "call", params);

        logger.error("custom-endpoint workflow Http REST call result: " + httpResult);

        return httpResult;
    } catch (error) {
        logger.error("custom-endpoint workflow Http REST call error: " + error);
        throw {
            "error": "custom-endpoint workflow Http REST call error: " + error
        };
    }

}

function cancelWorkflowRequest(requestId, accessToken) {
    try {
        return httpCall(tenantBaseUrl + "/iga/governance/requests/" + requestId, "GET", {
            "Authorization": "Bearer " + accessToken
        });
    } catch (error) {
        return {
            "error": error
        }
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
        if (eventDetails) {
            if (!eventDetails.browser) {
                eventDetails.browser = typeof userAgent !== "undefined" ? userAgent : "";
            }
            if (!eventDetails.os) {
                eventDetails.os = typeof os !== "undefined" ? os : "";
            }
            if (!eventDetails.IP) {
                eventDetails.IP = typeof Ipaddress !== "undefined" ? Ipaddress : "";
            }
        }

      //Fetch the requesterEmail ID
        var requesteremailID ="";
        if(requesterUserId && requesterUserId !== ""){
          var userQueryFilter = '(_id eq "' + requesterUserId + '")';
          var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["mail"]); 
          if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
            requesteremailID = requesterUserObj.result[0].mail;
          }
        }

        //Defect Fix# 211192 (Unknown Location) - 03/12  ----BEGIN
           sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
           sessionRefId = deepParse(sessionRefId)
           logger.error("In endpoint/userprerequisite_v2B:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))
      
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
        
            logger.error("***placeParts in endpoint/userprerequisite_v2B => "+placeParts)
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
            //sessionId: sessionRefId || "",
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

function decodeAccessToken(token) {
    try {
        logger.error("decodeAccessToken ::inside ");
        //get the payload and replace the invalid character for base64url
        let tokenPayload = token.split(".")[1]
        tokenPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/')

        //padding with =
        let pad = tokenPayload.length % 4
        if (pad) {

            tokenPayload += new Array(5 - pad).join('=')
        }

        //Decode the String
        let decodedTokenPayload = java.lang.String(java.util.Base64.getDecoder().decode(tokenPayload), "UTF-8").toString()

        logger.error("decodeAccessToken ::inside " + JSON.parse(decodedTokenPayload).sessionRefId);
        return JSON.parse(decodedTokenPayload).sessionRefId

    } catch (error) {
        logger.error("decodeAccessToken ::inside " + error);
        throw {
            code: 400,
            message: "Exception when decode access token"
        }
    }
}

function sendMail(mail, payload, templateID, locale) {
    try {
        var params = new Object();
        params.templateName = templateID;
        params.to = mail;
        params.object = payload;
        params._locale = locale || "en"

        openidm.action("external/email", "sendTemplate", params);

    }
    catch (error) {

    }
}

function getHelpdeskNumber() {
    try {
        var appName = "KYID Helpdesk";
        var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact", { _queryFilter: 'name eq "' + appName + '"' }, ["phoneContact", "emailContact"]);
        var phoneContact = userQueryResult2.result[0].phoneContact[0].phoneNumber
        if (phoneContact && phoneContact != null) {
            return phoneContact;
        } else {
            return " ";
        }
    }
    catch (error) {
        logger.error("Error in catch of helpdesk retrieval :: => " + error);
        return " ";
    }
}

//BenPark TFS-204103
function standardMobileNumber(phoneNumber) {
    if (!phoneNumber) {
        return "";
    }
    var cleaned = String(phoneNumber).replace(/[\s\(\)\-]/g, '');

    if (cleaned.charAt(0) === '+') {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10 && cleaned.charAt(0) !== '1') {
        cleaned = '1' + cleaned;
    }
    return '+' + cleaned;
}

function getInfoForPendingApproval(userPrerequisiteId) {
    logger.error('inside getInfoForPendingApproval method')
    let userPrerequisite = openidm.read("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrerequisiteId, null, ["*"]);

    if (userPrerequisite && userPrerequisite != null) {
        let requesterDetails
        let requesterMobileNumbers = []
        let requesterUserAccount = openidm.read("managed/alpha_user/" + userPrerequisite.requesterUserAccountId, null, ["*"]);

        let requestedUserDetails
        let requestedUserMobileNumbers = []
        let requestedUserAccount = openidm.read("managed/alpha_user/" + userPrerequisite.requestedUserAccountId, null, ["*"]);

        if (requesterUserAccount && requesterUserAccount != null) {
            let userMFAMethods = openidm.query("managed/alpha_kyid_mfa_methods", { _queryFilter: 'KOGId eq "' + requesterUserAccount.userName + '"' }, ["*"]).result;
            if (userMFAMethods && userMFAMethods.length > 0) {
                for (let i = 0; i < userMFAMethods.length; i++) {
                    if (userMFAMethods[i].MFAMethod == "SMSVOICE") {
                        //Benpark TFS-204103 
                        let standardizedNumber = standardMobileNumber(userMFAMethods[i].MFAValue);
                        if (requesterMobileNumbers.indexOf(standardizedNumber) === -1) {
                            requesterMobileNumbers.push(standardizedNumber)
                        }
                    }
                }
            }

            requesterDetails = {
                "requesterUserId": requesterUserAccount._id,
                "requesterUserSn": requesterUserAccount.sn,
                "requesterUserGivenName": requesterUserAccount.givenName,
                "requesterUserMail": requesterUserAccount.mail,
                "requesterMobileNumbers": requesterMobileNumbers
            }
        } else {
            throw {
                code: 400,
                message: `Requester user with id ${userPrerequisiteId} not found`
            }
        }

        if (requestedUserAccount && requestedUserAccount != null) {
            let userMFAMethods = openidm.query("managed/alpha_kyid_mfa_methods", { _queryFilter: 'KOGId eq "' + requesterUserAccount.userName + '"' }, ["*"]).result;

            if (userMFAMethods && userMFAMethods.length > 0) {
                for (let i = 0; i < userMFAMethods.length; i++) {
                    if (userMFAMethods[i].MFAMethod == "SMSVOICE") {
                        //Benpark TFS-204103
                        let standardizedNumber = standardMobileNumber(userMFAMethods[i].MFAValue);
                        if (requestedUserMobileNumbers.indexOf(standardizedNumber) === -1) {
                            requestedUserMobileNumbers.push(standardizedNumber)
                        }
                    }
                }
            }

            requestedUserDetails = {
                "requestedUserId": requestedUserAccount._id,
                "requestedUserSn": requestedUserAccount.sn,
                "requestedUserGivenName": requestedUserAccount.givenName,
                "requestedUserMail": requestedUserAccount.mail,
                "requestedUserMobileNumbers": requestedUserMobileNumbers
            }
        } else {
            throw {
                code: 400,
                message: `Requester user with id ${userPrerequisiteId} not found`
            }
        }

        let workflowRequest
        let progress = []
        let workflowRequestId = userPrerequisite.pingApprovalWorkflowId

        if (workflowRequestId && workflowRequestId != null) {
            workflowRequest = openidm.action("/iga/governance/requests/" + workflowRequestId, "GET", {});

            let phases = workflowRequest.decision.phases
            logger.error("phases value is: " + phases)
            if (phases && phases.length > 0) {

                for (let i = 0; i < phases.length; i++) {
                    let phase = phases[i]
                    logger.error("phase value is: " + phase)
                    let approvers = []
                    let actors = workflowRequest.decision.actors
                    if (actors.active.length > 0) {
                        actors.active.forEach(actor => {
                            if (actor.phase && actor.phase == phase.name) {
                                approvers.push({
                                    "firstName": actor.givenName,
                                    "lastName": actor.sn,
                                    "email": actor.mail
                                })
                            }
                        })
                    }

                    if (actors.inactive.length > 0) {
                        actors.inactive.forEach(actor => {
                            if (actor.phase && actor.phase == phase.name) {
                                approvers.push({
                                    "firstName": actor.givenName,
                                    "lastName": actor.sn,
                                    "email": actor.mail
                                })
                            }
                        })
                    }


                    progress.push({
                        "submissionDate": workflowRequest.metadata.createdDate,
                        "name": phase.displayName,
                        "decision": phase.decision,
                        "status": phase.status,
                        "approvers": approvers,
                        "completion": {
                            "date": phase.completionDate,
                            "by": {
                                "firstName": phase.completedBy ? phase.completedBy.givenName : null,
                                "lastName": phase.completedBy ? phase.completedBy.sn : null,
                                "id": phase.completedBy ? phase.completedBy.id : null,
                                "mail": phase.completedBy ? phase.completedBy.mail : null,
                                "userName": phase.completedBy ? phase.completedBy.userName : null
                            }
                        }
                    })
                }
            }
        }

        return {
            "enrollmentRequestId": userPrerequisite.enrollmentRequestId,
            "requesterDetails": requesterDetails,
            "requestedUserDetails": requestedUserDetails,
            "expiryDate": userPrerequisite.expiryDate,
            "preRequisiteType": {
                "id": userPrerequisite.preRequisiteTypeId ? userPrerequisite.preRequisiteTypeId._id : null,
                "name": userPrerequisite.preRequisiteTypeId ? userPrerequisite.preRequisiteTypeId.name : null
            },
            "preRequisite": {
                "id": userPrerequisite.preRequisiteId ? userPrerequisite.preRequisiteId._id : null,
                "name": {
                    "en": userPrerequisite.preRequisiteId && userPrerequisite.preRequisiteId.displayName ? userPrerequisite.preRequisiteId.displayName.en : null,
                    "es": userPrerequisite.preRequisiteId && userPrerequisite.preRequisiteId.displayName ? userPrerequisite.preRequisiteId.displayName.es : null
                },
                "description": {
                    "en": userPrerequisite.preRequisiteId && userPrerequisite.preRequisiteId.displayDescription ? userPrerequisite.preRequisiteId.displayDescription.en : null,
                    "es": userPrerequisite.preRequisiteId && userPrerequisite.preRequisiteId.displayDescription ? userPrerequisite.preRequisiteId.displayDescription.es : null
                }
            },
            "workflowRequest": {
                "requestSummary": {
                    "status": workflowRequest.decision.status,
                    "requestId": workflowRequest.id
                },
                "requestDetails": workflowRequest.request.custom.page,
                "progress": progress,
                "comments": workflowRequest.decision.comments
            }
        }


    } else {
        throw {
            code: 400,
            message: `User Prerequisite with id ${userPrerequisiteId} not found`
        }
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
 * Get FAQ Topic ID for help topics
 * @param {string} pageHeader - The page header identifier
 * @param {string} Process - The process identifier
 * @returns {Array|null} Array of FAQ topic IDs or null if not found
 */
function getFaqTopidId(pageHeader, Process) {
    try {
        logger.error("**Inside getFaqTopidId function**");
        let response = openidm.query("managed/alpha_kyid_faq_mapping", { "_queryFilter": 'process eq "' + Process + '" AND pageHeader eq "' + pageHeader + '"' }, [""]);
        if (response && response.resultCount > 0) {
            let faqTopicId = response.result[0].faqTopics;
            return faqTopicId;
        } else {
            return null;
        }
    } catch (error) {
        logger.error("Error Occurred while Executing getFaqTopidId -> " + error);
        return null;
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