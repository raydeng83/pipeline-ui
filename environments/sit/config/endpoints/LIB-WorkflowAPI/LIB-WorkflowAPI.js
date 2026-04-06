var requestObj = null;
var shouldPatchUserPrerequisite = false;
var requestId = null;


(function () {
    if (request.method === 'create') {
        logger.error("Inside function")
        // POST
        var response = {}
        var payload = request.content.payload;
        var action = request.content.action
        logger.error("Before checking action")

        if (action === 0) {
            response = initialize(payload)
        } else if (action === 1) {
            response = provisionAccess(payload);
        } else if (action === 2) {
            response = rejectRequest(payload)
        } else if (action == 3) {
            response = sendApprovalNotification(payload)
        } else if (action == 4) {
            response = sendRejectNotification(payload)
        } else if (action == 5) {
            response = addWorkflowComments(payload)
        }

        logger.error("Returning response: " + response)

        return response;
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

function addWorkflowComments(payload) {
    logger.error("inside workflow library endpoint script addWorkflowComments method")
    logger.error("payload is " + payload)
    requestId = payload.requestId
    var phaseDisplayName = payload.displayName

    logger.info("Add approval comment for request: " + requestId);
    logger.error("Adding comments for " + phaseDisplayName);

    var requestObj;

    try {
        requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
        logger.info("kyid-workflow requestObj: " + requestObj);
    } catch (e) {
        logger.error("Failed to read request " + requestId + " for approval comment: " + e);
    }

    if (!requestObj || !requestObj.decision || !requestObj.decision.phases || !Array.isArray(requestObj.decision.phases)) {
        logger.error("No decision phases found for request " + requestId + ", no approval comment added.");
    }

    var phases = requestObj.decision.phases;
    var chosenPhase = null;

    for (var i = 0; i < phases.length; i++) {
        var p = phases[i];
        if (!p) {
            continue;
        }

        if (p.displayName == phaseDisplayName) {
            chosenPhase = p;
            break;
        }
    }

    if (!chosenPhase) {
        logger.error("No phase with approver found for request " + requestId + ", no comment added.");

    }

    var phase = chosenPhase;
    var cb = phase.completedBy;

    var name;
    if (cb.givenName && cb.sn) {
        name = cb.givenName + " " + cb.sn;
    } else {
        name = cb.userName || cb.id || "unknown";
    }

    var email = cb.mail;
    var approverText = email ? (name + " (" + email + ")") : name;

    var stageName = phase.displayName || phase.name || "";
    var commentText;

    if (stageName) {
        commentText = "Request " + phase.decision + "d by " + approverText + " at " + stageName + ".";
    } else {
        commentText = "Request " + phase.decision + "d by " + approverText + ".";
    }

    try {
        openidm.action(
            'iga/governance/requests/' + requestId,
            'POST',
            { comment: commentText },
            { _action: 'update' }
        );
        logger.info("Comment added for request " + requestId + ": " + commentText);
    } catch (e) {
        logger.error("Failed to add comment for request " + requestId + ": " + e);
    }
}

function initialize(payload) {
    var userPrerequisite = null
    var requestType = null;
    requestId = payload.requestId

    logger.error("inside workflow library endpoint script initialize method")
    logger.error("payload is " + payload)
    logger.info("kyid-workflow starting workflow with request id: " + requestId);

    try {
        requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
        logger.info("kyid-workflow requestObj: " + requestObj);

        requestType = requestObj.requestType;

        userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);
        logger.info("kyid-workflow userPrerequisite: " + userPrerequisite);

    } catch (e) {
        failureReason = "kyid-workflow error: " + e;
        return {
            "failureReason": failureReason
        }
    }

    if (userPrerequisite && requestType) {
        try {
            openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [
                { "operation": "replace", "field": "/status", "value": "PENDING_APPROVAL" },
                { "operation": "replace", "field": "/pingApprovalWorkflowId", "value": requestId }
            ]);

            openidm.action(
                'iga/governance/requests/' + requestId,
                'POST',
                { comment: "Access request initialized." },
                { _action: 'update' }
            );

            return {
                "result": "kyid-workflow init done"
            }
        } catch (e) {
            logger.info("kyid-workflow init script failed with reason: " + e);
        }
    } else {
        failureReason = "kyid-workflow error: User Prerequisite or Request Type not found";
    }
}

function epochToCustomDate(epoch) {
    let date = new Date(epoch);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function getLangCode(code, languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}

function sendRejectNotification(payload) {
    try {
        logger.error("inside workflow library endpoint script sendRejectNotification method")
        logger.error("payload is " + payload)
        requestId = payload.requestId

        var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
        var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;

        var requesterUserId = requestObj.request.custom.requesterUser.requesterUserId;
        var languageMap = identityServer.getProperty("esv.language.preference");
        var locale = "en"
        if (requesterUserId && requesterUserId != null) {
            var requesterUserInfo = openidm.read("managed/alpha_user/" + requesterUserId);
            if (requesterUserInfo && requesterUserInfo.custom_languagePreference) {
                langPref = requesterUserInfo.custom_languagePreference || "1"
                if (languageMap && languageMap != null) {
                    locale = getLangCode(langPref, languageMap);
                }
            }

        }

        var requestBody = {}
        requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName
        requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn
        requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName
        requestBody.roleName = requestObj.request.custom.requesterUser.roleName
        requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail
        const now = new Date();
        const timestamp = epochToCustomDate(now)
        requestBody.timeStamp = timestamp.replace(" UTC", "");
        var body = {
            subject: "Request Rejected",
            to: requesterEmail,
            templateName: "kyidRequestRejected",
            object: requestBody,
            _locale: locale
        };
        openidm.action("external/email", "sendTemplate", body);
    }
    catch (e) {
        logger.info("Unable to send rejection notification email: " + e);
    }
}

function sendApprovalNotification(payload) {
    try {
        logger.error("inside workflow library endpoint script sendApprovalNotification method")
        requestId = payload.requestId

        var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
        var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;

        var requesterUserId = requestObj.request.custom.requesterUser.requesterUserId;
        var languageMap = identityServer.getProperty("esv.language.preference");
        var locale = "en"
        if (requesterUserId && requesterUserId != null) {
            var requesterUserInfo = openidm.read("managed/alpha_user/" + requesterUserId);
            if (requesterUserInfo && requesterUserInfo.custom_languagePreference) {
                langPref = requesterUserInfo.custom_languagePreference || "1"
                if (languageMap && languageMap != null) {
                    locale = getLangCode(langPref, languageMap);
                }
            }

        }

        var requestBody = {}
        requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName
        requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn
        requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName
        requestBody.roleName = requestObj.request.custom.requesterUser.roleName
        requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail
        const now = new Date();
        const timestamp = epochToCustomDate(now)
        requestBody.timeStamp = timestamp.replace(" UTC", "");
        var body = {
            subject: "Request Approved",
            to: requesterEmail,
            templateName: "kyidRequestApproved",
            object: requestBody,
            _locale: locale
        };

        openidm.action("external/email", "sendTemplate", body);
    }
    catch (e) {
        logger.info("Unable to send approval notification email");
    }
}

function getUserPrerequisites(userId, prereqId) {
    try {
        logger.error("Executing getUserPrerequisites Function for allowReuse")
        var userPrereqIds = []
        var query = `requestedUserAccountId eq '${userId}' AND preRequisiteId/_refResourceId eq '${prereqId}' AND (status eq '0' OR status eq 'NOT_STARTED' OR status eq '1' OR status eq 'PENDING_APPROVAL' OR status eq 'REVERIFY' OR status eq '8' OR status eq '7' OR status eq 'PENDING') AND (recordState eq '0' OR recordState eq 'ACTIVE')`
        var userQueryResult = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
            _queryFilter: query
        }, ["*"]);
        if (userQueryResult && userQueryResult.resultCount > 0) {
            logger.error("getUserPrerequisites :  Found User Prereq ")
            userQueryResult.result.forEach(userPrereq => {
                if (userPrereq._id) {
                    userPrereqIds.push(userPrereq._id)
                }
            })
        }
        return userPrereqIds
    } catch (error) {
        logger.error("getUserPrerequisites :  Error Occurred While Getting User Prerequisites" + error)
        return []
    }

}

function patchUserPrerequisite(apiRequestPayload, recordID, serviceEndptRequestObj, expiryDate, status) {
    logger.error("Inside patchUserPrerequisite")
    let funcName = "patchUserPrerequisite"
    currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();
    logger.error("Current time in Epoch - " + currentTimeinEpoch)
    logger.error("Current Date - " + currentDate)
    let jsonArray = []
    let jsonObj = null
    let values = null

    try {
        if (serviceEndptRequestObj != null && serviceEndptRequestObj && (status != null && status && status == "COMPLETED")) {
            values = getprerequisiteValuesForUsrPrereq(serviceEndptRequestObj)
            jsonObj = {
                "operation": "replace",
                "field": "prerequisiteValues",
                "value": values
            }
            jsonArray.push(jsonObj)
        }

        jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": status //"2"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": Number(Date.now())
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": new Date().toISOString()
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "completionDateEpoch",
            "value": Number(Date.now())
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "completionDate",
            "value": new Date().toISOString()
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updatedBy",
            "value": "KYID-System" //**Pending: Compute Logic based human readable format later from alpha_user
        }
        jsonArray.push(jsonObj)

        jsonObj = {
            "operation": "replace",
            "field": "updatedByID",
            "value": apiRequestPayload.requestedUserAccountId //**Pending: Compute Logic based human readable format later from alpha_user
        }
        jsonArray.push(jsonObj)

        if (expiryDate != null && expiryDate) {
            jsonObj = {
                "operation": "replace",
                "field": "expiryDate",
                "value": expiryDate.expiryDate
            }
            jsonArray.push(jsonObj)
            jsonObj = {
                "operation": "replace",
                "field": "expiryDateEpoch",
                "value": Number(expiryDate.expiryEpoch)
            }
            jsonArray.push(jsonObj)
        }

        logger.error("UserPrerequisite jsonArray to patch - " + JSON.stringify(jsonArray))

        openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + recordID, null, jsonArray);

        //dharjani BEGIN - Invoking Common Endpoint for User Activity Logging
        try {
            var eventCode = "PRE004"
            let userActivityPayload = {
                eventCode: eventCode,
                eventName: "Completed Prerequisite",
                eventDetails: {
                    prerequisiteTypeId: recordID
                },
                requesterUserId: apiRequestPayload.requestedUserAccountId,
                requestedUserId: apiRequestPayload.requestedUserAccountId
            }
            let userActivityRequestBody = {
                action: 1,
                payload: userActivityPayload
            }
            logger.error("Creating audit log for " + eventCode + ":" + JSON.stringify(userActivityRequestBody))
            var userActivityLoggingResponse = openidm.create("endpoint/useractivity", null, userActivityRequestBody)
            logger.error("Creating audit log for " + eventCode + " successful. Response = " + JSON.stringify(userActivityLoggingResponse))
        } catch (error) {
            logger.error("Exception creating audit log for " + eventCode + " : " + error)
        }
        //dharjani END

        return {
            "status": "success",
            "message": "success"
        }

    } catch (error) {
        //Return error response
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-054")
    }
}


function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now(); // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString(); // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate); // Convert the ISO string into a Date object

        let expiryDate;

        switch (option) {
            case 0: // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000); // Add one day (24 hours) to the current time
                break;
            case 1: // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000); // Add one week (7 days)
                break;
            case 2: // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1) // Add one month to the current date
                break;
            case 3: // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3); // Add 3 months to the current date
                break;
            case 4: // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6); // Add 6 months to the current date
                break;
            case 5: // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1); // Add 1 year to the current date
                break;
            case 6: // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day); // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1); // If the date is already passed this year, set it to the next year
                }
                break;
            case 7: // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000); // Add 'value' days in milliseconds
                break;
            case 8: // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value); // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                failureReason = "kyid-workflow error encountered while getExpiryDate: " + error;

        }

        const expiryEpochMillis = new Date(expiryDate).getTime(); // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return {
            expiryEpoch: expiryEpochMillis,
            expiryDate: expiryDate
        };

    } catch (error) {
        logger.error("Error Occurred While getExpiryDate " + error)
        failureReason = "kyid-workflow error encountered while getExpiryDate: " + error;
    }

}

function invokeKOGCredentialsAPI(payload) {
    logger.error("kyid-workflow Inside invokeKOGCredentialsAPI")
    var koCredsAPI = identityServer.getProperty("esv.addremoveusercredential.api")
    var kogCredsAPIScope = identityServer.getProperty("esv.addremoveusercredential.api.scope")

    logger.error("kog request payload is: " + payload)

    let KOGUserCredential = payload.KOGUserCredential;

    if (KOGUserCredential && KOGUserCredential != null) {
        let CredentialDetails = KOGUserCredential.CredentialDetails

        if (CredentialDetails && CredentialDetails != null && CredentialDetails.length > 0) {
            for (let i = 0; i < CredentialDetails.length; i++) {
                let CredentialDetailValues = CredentialDetails[i].CredentialDetailValues

                if (CredentialDetailValues && CredentialDetailValues != null && CredentialDetailValues.length > 0) {
                    let arrayVals = []

                    for (let j = 0; j < CredentialDetailValues.length; j++) {
                        let totValues = CredentialDetailValues[j].split(",")

                        logger.error("Total values present for field in default is - " + totValues)

                        if (totValues.length > 1) {
                            for (let k = 0; k < totValues.length; k++) {
                                arrayVals.push(totValues[k])
                            }
                        } else {
                            arrayVals.push(CredentialDetailValues[j])
                        }
                    }

                    payload.KOGUserCredential.CredentialDetails[i].CredentialDetailValues = arrayVals.slice() // use slice() method to pass value instead of object reference
                }
            }
        }
    }

    logger.error("kog request payload after CSV is: " + payload)



    let funcName = "invokeKOGCredentialsAPI"
    let responseKOGCredentialsAPI = null
    let retryCountForKOG = 0
    let shouldRetryForKOG = true
    let requestBody = {
        url: koCredsAPI,
        scope: kogCredsAPIScope,
        method: "POST",
        payload: payload
    }
    let apiResult = {
        apiStatus: null,
        ResponseStatus: null,
        MessageResponses: null
    }

    try {
        logger.error("kyid-workflow Request Body for invokeKOGCredentialsAPI is - " + JSON.stringify(requestBody))
        openidm.action(
            'iga/governance/requests/' + requestId,
            'POST', {
            comment: 'Start to invoke KOG Credentials API'
        }, {
            _action: 'update'
        }
        );
        logger.info("Start to invoke KOG Credentials API for request " + requestId);
        while (shouldRetryForKOG && retryCountForKOG < 3) {
            try {
                responseKOGCredentialsAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForKOG = false
            } catch (error) {
                logger.error("Exception in " + funcName + " is - " + error)
                retryCountForKOG++;
                logger.error("Retry count of invokeKOGCredentialsAPI is: " + retryCountForKOG);
                if (retryCountForKOG == 3) {
                    logger.error("kyid-workflow Exception is - " + error)
                    failureReason = "kyid-workflow error encountered while invokeKOGCredentialsAPI: " + error;
                }
            }
        }
        logger.error("kyid-workflow responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - " + JSON.stringify(responseKOGCredentialsAPI))
        if (responseKOGCredentialsAPI != null && responseKOGCredentialsAPI) {
            if (responseKOGCredentialsAPI.response.ResponseStatus == 0) {
                apiResult.ResponseStatus = 0
                apiResult.apiStatus = 200

                openidm.action(
                    'iga/governance/requests/' + requestId,
                    'POST', {
                    comment: 'Invoke KOG Credentials API returns success'
                }, {
                    _action: 'update'
                }
                );
                logger.info("Invoke KOG Credentials API returns success for request " + requestId);
            } else {
                apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus
                apiResult.MessageResponses = responseKOGCredentialsAPI.response.MessageResponses
                apiResult.apiStatus = 400

                openidm.action(
                    'iga/governance/requests/' + requestId,
                    'POST', {
                    comment: 'Error encountered invoking KOG Credentials API'
                }, {
                    _action: 'update'
                }
                );
                logger.info("Error encountered invoking KOG Credentials API for request " + requestId)
            }
        }

        logger.error("apiResult in invokeKOGCredentialsAPI is - " + JSON.stringify(apiResult))
        return apiResult

    } catch (error) {
        //Return error response
        logger.error("kyid-workflow Exception is - " + error)
        failureReason = "kyid-workflow error encountered while invokeKOGCredentialsAPI: " + error;

        openidm.action(
            'iga/governance/requests/' + requestId,
            'POST', {
            comment: 'Error encountered invoking KOG Credentials API'
        }, {
            _action: 'update'
        }
        );
        logger.info("Error encountered invoking KOG Credentials API for request " + requestId);
    }
}

function invokeUserOnboardingAPI(payload) {
    logger.error("kyid-workflow Inside invokeUserOnboardingAPI");

    var koOrgAPI = identityServer.getProperty("esv.addremoveuseronboarding.api")
    var kogOrgAPIScope = identityServer.getProperty("esv.addremoveuseronboarding.api.scope")

    logger.error("kog request payload is: " + payload)

    let KOGUserCredential = payload.KOGUserCredential;

    if (KOGUserCredential && KOGUserCredential != null) {
        let CredentialDetails = KOGUserCredential.CredentialDetails

        if (CredentialDetails && CredentialDetails != null && CredentialDetails.length > 0) {
            for (let i = 0; i < CredentialDetails.length; i++) {
                let CredentialDetailValues = CredentialDetails[i].CredentialDetailValues

                if (CredentialDetailValues && CredentialDetailValues != null && CredentialDetailValues.length > 0) {
                    let arrayVals = []

                    for (let j = 0; j < CredentialDetailValues.length; j++) {
                        let totValues = CredentialDetailValues[j].split(",")

                        logger.error("Total values present for field in default is - " + totValues)

                        if (totValues.length > 1) {
                            for (let k = 0; k < totValues.length; k++) {
                                arrayVals.push(totValues[k])
                            }
                        } else {
                            arrayVals.push(CredentialDetailValues[j])
                        }
                    }

                    payload.KOGUserCredential.CredentialDetails[i].CredentialDetailValues = arrayVals.slice() // use slice() method to pass value instead of object reference
                }
            }
        }
    }

    logger.error("kog request payload after CSV is: " + payload)

    let funcName = "invokeUserOnboardingAPI";
    let responseUserOnboardingAPI = null;
    let retryCountForOnboarding = 0
    let shouldRetryForOnboarding = true
    let requestBody = {
        url: koOrgAPI,
        scope: kogOrgAPIScope,
        method: "POST",
        payload: payload
    }
    let apiResult = {
        apiStatus: null,
        ResponseStatus: null,
        MessageResponses: null
    }

    try {
        logger.error("kyid-workflow Request Body for invokeUserOnboardingAPI is - " + JSON.stringify(requestBody))
        openidm.action(
            'iga/governance/requests/' + requestId,
            'POST', {
            comment: 'Start to invoke KOG User Onboarding API'
        }, {
            _action: 'update'
        }
        );
        logger.info("Start to invoke KOG User Onboarding API for request " + requestId);
        while (shouldRetryForOnboarding && retryCountForOnboarding < 3) {
            try {
                responseUserOnboardingAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForOnboarding = false
            } catch (error) {
                logger.error("Exception in " + funcName + " is - " + error)
                retryCountForOnboarding++;
                logger.error("Retry count of invokeUserOnboardingAPI is: " + retryCountForOnboarding);
                if (retryCountForOnboarding == 3) {
                    logger.error("kyid-workflow Exception is - " + error)
                    failureReason = "kyid-workflow error encountered while invokeUserOnboardingAPI: " + error;
                }
            }
        }
        logger.error("kyid-workflow responseUserOnboardingAPI in invokeUserOnboardingAPI is - " + JSON.stringify(responseUserOnboardingAPI))
        if (responseUserOnboardingAPI != null && responseUserOnboardingAPI) {
            if (responseUserOnboardingAPI.response.ResponseStatus == 0) {
                apiResult.ResponseStatus = 0
                apiResult.apiStatus = 200

                openidm.action(
                    'iga/governance/requests/' + requestId,
                    'POST', {
                    comment: 'Invoke KOG User Onboarding API returns success'
                }, {
                    _action: 'update'
                }
                );
                logger.info("Invoke KOG User Onboarding API returns success for request " + requestId);
            } else {
                apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus
                apiResult.MessageResponses = responseUserOnboardingAPI.response.MessageResponses
                apiResult.apiStatus = 400

                openidm.action(
                    'iga/governance/requests/' + requestId,
                    'POST', {
                    comment: 'Error encountered invoking KOG User Onboarding API'
                }, {
                    _action: 'update'
                }
                );
                logger.info("Error encountered invoking KOG User Onboarding API for request " + requestId);
            }
        }
        return apiResult

    } catch (error) {
        //Return error response
        logger.error("kyid-workflow Exception is - " + error)

        openidm.action(
            'iga/governance/requests/' + requestId,
            'POST', {
            comment: 'Error encountered invoking KOG User Onboarding API'
        }, {
            _action: 'update'
        }
        );
        logger.info("Error encountered invoking KOG User Onboarding API for request " + requestId);
    }
}

function getPrerequisite(preReqId) {
    logger.error("Inside getPrerequisite")
    let funcName = "getPrerequisite"
    let response = null
    let status = "ACTIVE"
    try {
        response = openidm.query("managed/alpha_kyid_enrollment_prerequisite/", {
            "_queryFilter": '/_id/ eq "' + preReqId + '"' +
                ' AND (recordState eq "' + status + '" OR recordState eq "0")'
        }, ["prereqTypeId/*", "*"])
        if (response != null && response.resultCount > 0) {
            logger.error("getPrerequisite response is - " + JSON.stringify(response))
            return response
        } else {
            return logDebug(funcName, null, 'Prerequisite_Configuration_Not_Found', "REF-052")
        }
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-053")
    }
}

function getPrerequisites(apiRequestPayload) {
    try {
        let isPendingPrereq = true;
        logger.error("apiRequestPayload.requestedUserAccountId --> " + apiRequestPayload.requestedUserAccountId)
        logger.error("apiRequestPayload.enrollmentRequestId -->" + apiRequestPayload.enrollmentRequestId)
        let completedCounter = 0;
        const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
            "_queryFilter": '/enrollmentRequestId/ eq "' +
                apiRequestPayload.enrollmentRequestId + '"' + ' AND (recordState eq "ACTIVE" OR recordState eq "0")' + ' AND requestedUserAccountId eq "' + apiRequestPayload.requestedUserAccountId + '"'
        }, ["status", "displayOrder", "preRequisiteType", "preRequisiteTypeId/_id", "preRequisiteTypeId/typeName", "preRequisiteId/displayName", "preRequisiteId/displayDescription"])

        logger.error("Get Prereq Summary Response is --> " + response)
        if (response != null && response.resultCount > 0) {
            for (let i = 0; i < response.resultCount; i++) {
                if (response.result[i].status === "COMPLETED" || response.result[i].status === "ALREADY_COMPLETED") {
                    completedCounter++
                }
            }
            if (completedCounter === response.resultCount) {
                isPendingPrereq = false
            }
            return isPendingPrereq
        } else {
            logger.error("User Prereq Not Found")
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while fetching pending prerequsites" + error)
        return {
            code: 400,
            message: "Error Occurred while Prereq Summary " + error.message
        }
    }

}



function saveUserPrerequisiteValues(requestObj) {
    try {
        var failureReason = null;
        var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);

        var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
        var enrollmentRequestId = userPrerequisite.enrollmentRequestId;
        var requestedUserAccountId = userPrerequisite.requestedUserAccountId;
        var prerequisite = openidm.read('managed/alpha_kyid_enrollment_prerequisite/' + prerequisiteId, null, ['*']);
        //logger.info("kyid-workflow prerequisite: " + prerequisite);
        logger.error("kyid-workflow prerequisite: " + prerequisite);


        var enrollmentActionSettings = prerequisite.enrollmentActionSettings;
        //logger.info("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);
        logger.error("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);

        var expiryDateObject = prerequisite.expiry;
        //  logger.info("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));
        logger.error("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));

        var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);
        //logger.info("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));
        logger.error("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));

        var saveInput = enrollmentActionSettings.saveInput;
        //logger.info("kyid-workflow saveInput: " + saveInput);
        logger.error("kyid-workflow saveInput: " + saveInput);

        if (saveInput) {
            logger.error("kyid-workflow request custom propery - payload: " + requestObj.request.custom.payload);
            var responseKOGCredentialsAPI = invokeKOGCredentialsAPI(requestObj.request.custom.payload);
            logger.error("kyid-workflow responseKOGCredentialsAPI: " + JSON.stringify(responseKOGCredentialsAPI));
            if (responseKOGCredentialsAPI.apiStatus == 200) {
                if (responseKOGCredentialsAPI.ResponseStatus == 0) {
                    try {
                        logger.error("kyid-workflow Patch UserPrerequisite");
                        if (requestObj.request.custom.page.values && requestObj.request.custom.page.values != null) {
                            var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);
                            logger.info("kyid-workflow fieldValuesJson: " + JSON.stringify(fieldValuesJson));

                            var result = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [{
                                "operation": "replace",
                                "field": "/prerequisiteValues",
                                "value": fieldValuesJson
                            }]);
                            logger.info("kyid-workflow patch result: " + result);
                        }

                        shouldPatchUserPrerequisite = true;


                    } catch (error) {
                        logger.error("kyid-workflow error encountered during patching user prerequisite: " + error);
                        failureReason = "kyid-workflow error encountered during patching user prerequisite: " + error;
                    }
                } else {
                    logger.error("kyid-workflow error encountered during KOG credential API invoking: " + responseKOGCredentialsAPI.MessageResponses);
                    failureReason = "kyid-workflow error encountered during KOG credential API invoking: " + responseKOGCredentialsAPI.MessageResponses;
                }
            } else {
                logger.error("kyid-workflow Error getting Credentials API response");
                failureReason = "kyid-workflow Error getting Credentials API response";
            }

        } else {

            var responseUserOnboardingAPI = invokeUserOnboardingAPI(requestObj.request.custom.payload);


            if (responseUserOnboardingAPI.apiStatus == 200) {
                if (responseUserOnboardingAPI.ResponseStatus == 0) {
                    logger.error("kyid-workflow invokeUserOnboardingAPI is success");
                    shouldPatchUserPrerequisite = true;
                } else {
                    logger.error("kyid-workflow error encountered during KOG user onboarding API invoking: " + responseUserOnboardingAPI.MessageResponses);
                    failureReason = "kyid-workflow error encountered during KOG user onboarding API invoking: " + responseUserOnboardingAPI.MessageResponses;
                }
            } else {
                logger.error("kyid-workflow Error getting KOG user onboarding API response");
                failureReason = "kyid-workflow Error getting KOG user onboarding API response";
            }
        }

        if (shouldPatchUserPrerequisite) {
            openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [{
                "operation": "replace",
                "field": "/status",
                "value": "COMPLETED"
            },
            {
                "operation": "replace",
                "field": "/expiryDate",
                "value": calculatedExpiryDate.expiryDate
            },
            {
                "operation": "replace",
                "field": "/expiryDateEpoch",
                "value": Number(calculatedExpiryDate.expiryEpoch)
            },
            {
                "operation": "replace",
                "field": "/completionDate",
                "value": new Date().toISOString()
            },
            {
                "operation": "replace",
                "field": "/completionDateEpoch",
                "value": Number(Date.now())
            },
            {
                "operation": "replace",
                "field": "/pingApprovalWorkflowId",
                "value": requestId
            }
            ]);
        }

        let apiRequestPayload = {
            requestedUserAccountId: requestedUserAccountId,
            enrollmentRequestId: enrollmentRequestId,
            preReqId: null
        }

        // *** check reuseAllowed and pending userPrereq ***
        // let prereqResponse = getPrerequisite(prerequisiteId)
        // logger.error("prereqResponse is: " + prereqResponse)
        // if (prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount > 0 && prereqResponse.result[0].enrollmentActionSettings && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true &&
        //     (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld && Number(prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld)) > 0) {
        //     logger.error("allow reuse is found")
        //     let pendingUserPrereqIds = getUserPrerequisites(requestObj.request.custom.requestedUser.requestedUserId, prerequisiteId)

        //     logger.error("pendingUserPrereqIds are: " + pendingUserPrereqIds)
        //     pendingUserPrereqIds.forEach(userPrereqId => {
        //         patchUserPrerequisite(apiRequestPayload, userPrereqId, null, calculatedExpiryDate, "ALREADY_COMPLETED")
        //     })
        // }


        logger.error("apiRequestPayload for getPrerequisites --> " + JSON.stringify(apiRequestPayload))
        var isPendingPrereq = getPrerequisites(apiRequestPayload)
        logger.error("isPendingPrereq response --> " + JSON.stringify(isPendingPrereq))
        if (isPendingPrereq == false) {
            let payload = {
                requestedUserAccountId: requestedUserAccountId,
                enrollmentRequestId: enrollmentRequestId
            }
            let requestBody = {
                action: "1",
                payload: payload
            }
            responseAccess = openidm.create("endpoint/access", null, requestBody)
            logger.error("provision access response  --> " + JSON.stringify(responseAccess))

            if (responseAccess && responseAccess.status && responseAccess.status.toLowerCase() == "success") {
                // Audit logger for successful role assigning - placed after all operations complete
                let eventCode = "ROM001";
                let eventName = "Add Role Success";
                let eventDetails = requestObj;

                // auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId)
                auditLogger(
                    eventCode,
                    eventName,
                    "",
                    eventDetails,
                    requestObj.request.custom.requesterUser.requesterUserId,
                    requestObj.request.custom.requestedUser.requestedUserId,
                    "",
                    requestObj.request.custom.requestedUser.requestedUserMail,
                    requestObj.request.custom.requestedUser.applicationName,
                    ""
                );
            }

            return failureReason
        } else {
            logger.error("No provision access  --> ")
            return "No provision access"
        }
    } catch (e) {

        // Audit logger for successful role assigning - placed after all operations complete
        let eventCode = "ROM002";
        let eventName = "Add Role Failure";
        let eventDetails = requestObj;

        // auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId)
        auditLogger(
            eventCode,
            eventName,
            "",
            eventDetails,
            requestObj.request.custom.requesterUser.requesterUserId,
            requestObj.request.custom.requestedUser.requestedUserId,
            "",
            requestObj.request.custom.requestedUser.requestedUserMail,
            requestObj.request.custom.requestedUser.applicationName,
            ""
        );

        return "error encountered: " + e
    }
}

function saveUserPrerequisiteValuesGeneric(requestObj) {
    try {
        var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);
        logger.error("userPrerequisite response - " + JSON.stringify(userPrerequisite))
        var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
        var enrollmentRequestId = userPrerequisite.enrollmentRequestId;
        var requestedUserAccountId = userPrerequisite.requestedUserAccountId;
        var prerequisite = openidm.read('managed/alpha_kyid_enrollment_prerequisite/' + prerequisiteId, null, ['*']);
        //logger.info("kyid-workflow prerequisite: " + prerequisite);
        logger.error("kyid-workflow prerequisite: " + prerequisite);

        var enrollmentActionSettings = prerequisite.enrollmentActionSettings;
        //logger.info("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);
        logger.error("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);

        var expiryDateObject = prerequisite.expiry;
        //  logger.info("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));
        logger.error("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));

        var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);
        //logger.info("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));
        logger.error("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));

        var saveInput = enrollmentActionSettings.saveInput;
        //logger.info("kyid-workflow saveInput: " + saveInput);
        logger.error("kyid-workflow saveInput: " + saveInput);

        shouldPatchUserPrerequisite = true;

        if (shouldPatchUserPrerequisite) {
            openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [{
                "operation": "replace",
                "field": "/status",
                "value": "COMPLETED"
            },
            {
                "operation": "replace",
                "field": "/expiryDate",
                "value": calculatedExpiryDate.expiryDate
            },
            {
                "operation": "replace",
                "field": "/expiryDateEpoch",
                "value": Number(calculatedExpiryDate.expiryEpoch)
            },
            {
                "operation": "replace",
                "field": "/completionDate",
                "value": new Date().toISOString()
            },
            {
                "operation": "replace",
                "field": "/completionDateEpoch",
                "value": Number(Date.now())
            },
            {
                "operation": "replace",
                "field": "/pingApprovalWorkflowId",
                "value": requestId
            }
            ]);
        }


        let apiRequestPayload = {
            requestedUserAccountId: requestedUserAccountId,
            enrollmentRequestId: enrollmentRequestId,
            preReqId: null
        }
        logger.error("apiRequestPayload for getPrerequisites --> " + JSON.stringify(apiRequestPayload))
        var isPendingPrereq = getPrerequisites(apiRequestPayload)
        logger.error("isPendingPrereq response --> " + JSON.stringify(isPendingPrereq))
        if (isPendingPrereq == false) {
            let payload = {
                requestedUserAccountId: requestedUserAccountId,
                enrollmentRequestId: enrollmentRequestId
            }
            let requestBody = {
                action: "1",
                payload: payload
            }
            responseAccess = openidm.create("endpoint/access", null, requestBody)
            logger.error("provision access response  --> " + JSON.stringify(responseAccess))

            if (responseAccess && responseAccess.status && responseAccess.status.toLowerCase() == "success") {
                // Audit logger for successful role assigning - placed after all operations complete
                let eventCode = "ROM001";
                let eventName = "Add Role Success";
                let eventDetails = requestObj;

                // auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId)
                auditLogger(
                    eventCode,
                    eventName,
                    "",
                    eventDetails,
                    requestObj.request.custom.requesterUser.requesterUserId,
                    requestObj.request.custom.requestedUser.requestedUserId,
                    "",
                    requestObj.request.custom.requestedUser.requestedUserMail,
                    requestObj.request.custom.requestedUser.applicationName,
                    ""
                );
            }

            return null //return null for no error message
        } else {
            logger.error("No provision access  --> ")
            return "No provision access"
        }
    } catch (e) {
        // Audit logger for successful role assigning - placed after all operations complete
        let eventCode = "ROM002";
        let eventName = "Add Role Failure";
        let eventDetails = requestObj;

        // auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId)
        auditLogger(
            eventCode,
            eventName,
            "",
            eventDetails,
            requestObj.request.custom.requesterUser.requesterUserId,
            requestObj.request.custom.requestedUser.requestedUserId,
            "",
            requestObj.request.custom.requestedUser.requestedUserMail,
            requestObj.request.custom.requestedUser.applicationName,
            ""
        );

        return "error encountered: " + e
    }
}


function updatePrerequisite(requestObj) {
    var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);

    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
    var prerequisite = openidm.read('managed/alpha_kyid_enrollment_prerequisite/' + prerequisiteId, null, ['*']);
    logger.info("kyid-workflow prerequisite: " + prerequisite);

    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;
    var enrollmentRequest = openidm.read('managed/alpha_kyid_enrollment_request/' + enrollmentRequestId, null, ['*']);
    logger.error("kyid-workflow enrollmentRequest: " + enrollmentRequest);

    var enrollmentRequestResult = openidm.patch("managed/alpha_kyid_enrollment_request/" + enrollmentRequestId, null, [{
        "operation": "replace",
        "field": "/status",
        "value": "REJECTED"
    }]);
    logger.error("kyid-workflow reject status update result: " + enrollmentRequestResult);

    // var enrollmentActionSettings = prerequisite.enrollmentActionSettings;
    // logger.info("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);

    var expiryDateObject = prerequisite.expiry;
    logger.error("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));

    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);
    logger.error("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));

    // var saveInput = enrollmentActionSettings.saveInput;
    // logger.info("kyid-workflow saveInput: " + saveInput);

    // if (saveInput) {
    //     var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);
    //     logger.info("kyid-workflow fieldValuesJson: " + JSON.stringify(fieldValuesJson));
    //     var result = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [
    //         {"operation":"replace","field":"/prerequisiteValues","value":fieldValuesJson} 
    //     ]);
    //     logger.info("kyid-workflow patch result: " + result);
    // }

    var userPrerequisiteResult = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [{
        "operation": "replace",
        "field": "/status",
        "value": "REJECTED"
    },
    {
        "operation": "replace",
        "field": "/expiryDate",
        "value": calculatedExpiryDate.expiryDate
    },
    {
        "operation": "replace",
        "field": "/expiryDateEpoch",
        "value": Number(calculatedExpiryDate.expiryEpoch)
    },
    {
        "operation": "replace",
        "field": "/completionDate",
        "value": new Date().toISOString()
    },
    {
        "operation": "replace",
        "field": "/completionDateEpoch",
        "value": Number(Date.now())
    },
    {
        "operation": "replace",
        "field": "/pingApprovalWorkflowId",
        "value": requestId
    }
    ]);

    logger.error("kyid-workflow userPrerequisite patch result: " + userPrerequisiteResult);
}



function provisionAccess(payload) {
    var failureReason = null
    logger.error("inside workflow library endpoint script provisionAccess method")
    requestId = payload.requestId
    var workflowType = payload.workflowType
    var updateAccessRequestDecisionResponse
    try {
        requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
        logger.info("kyid-workflow requestObj: " + requestObj);

        if (workflowType && workflowType == "credential") {
            failureReason = saveUserPrerequisiteValues(requestObj); //failureReason is null if success
        } else {
            failureReason = saveUserPrerequisiteValuesGeneric(requestObj); //failureReason is null if success
        }
        logger.error("failureReason is: " + failureReason)

        var decision = {};

        if (failureReason) {
            decision.status = 'cancelled';
            decision.decision = 'approved';
            decision.outcome = 'cancelled';
            decision.comment = failureReason;

            updateAccessRequestDecisionResponse = openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
            logger.info("Request " + requestId + " completed.");
            logger.error("updateAccessRequestDecisionResponse is: " + updateAccessRequestDecisionResponse)
        } else {
            decision.status = 'complete';
            decision.outcome = 'provisioned';
            decision.decision = 'approved'

            var queryParams = {
                '_action': 'update'
            };
            updateAccessRequestDecisionResponse = openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
            logger.info("Request " + requestId + " completed.");
            logger.error("updateAccessRequestDecisionResponse is: " + updateAccessRequestDecisionResponse)
        }

        return {
            "provisionResult": updateAccessRequestDecisionResponse,
            "failureReason": failureReason
        }
    } catch (e) {
        logger.error("kyid-workflow error: " + e)

        return {
            "provisionResult": null,
            "failureReason": e
        }
    }
}

function rejectRequest(payload) {

    logger.error("inside workflow library endpoint script rejectRequest method")
    requestId = payload.requestId
    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    var rejectionResult
    try {
        if (!requestObj || !requestObj.decision || !requestObj.decision.phases) {
            logger.error("No decision phases found for request " + requestId + ". No rejection comment added.");
        } else {

            var phases = requestObj.decision.phases;
            var phase = null;
            var cb = null;


            for (var i = 0; i < phases.length; i++) {
                var p = phases[i];

                if (p.status === "complete" &&
                    p.decision === "reject" &&
                    p.completedBy && p.completedBy.id.toLowerCase() != "system") {

                    phase = p;
                    cb = p.completedBy;
                    break;
                }

            }

            if (cb) {
                var name;
                if (cb.givenName && cb.sn) {
                    name = cb.givenName + " " + cb.sn;
                } else {
                    name = cb.userName || cb.id || "unknown";
                }

                var email = cb.mail;
                var approverText = email ? (name + " (" + email + ")") : name;

                var commentText = "Request rejected by " + approverText + " at " + p.displayName + ".";

                try {
                    openidm.action(
                        "iga/governance/requests/" + requestId,
                        "POST", {
                        comment: commentText
                    }, {
                        _action: "update"
                    }
                    );
                    logger.info("Rejection comment added for request " + requestId + ": " + commentText);
                } catch (e) {
                    logger.error("Failed to add rejection comment for request " + requestId + ": " + e);
                }
            } else {
                logger.error("No completed Level 1 rejection phase / completedBy found for request " +
                    requestId + ". No rejection comment added.");
            }
        }

        if (requestObj) {
            var decision = {
                'status': 'complete',
                'decision': 'rejected',
                'outcome': 'denied'
            };

            updatePrerequisite(requestObj);

            var queryParams = {
                '_action': 'update'
            };
            rejectionResult = openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
            logger.info("Request " + requestId + " completed.");

            return rejectionResult
        }

    } catch (e) {
        logger.error("kyid-workflow error: " + e)

        return e
    }
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
            sessionId: sessionRefId || ""
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }
}