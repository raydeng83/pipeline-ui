//https://<PingHostURL>/openidm/endpoint/genericWorkflowProvisioning]

/**
 * @name [@endpointname]
 * @description [@description]
 * 
 * @param {request} request - This is the request object contains the following
 * resourceName - The name of the resource, without the endpoint/ prefix.
 * newResourceId - The identifier of the new object, available as the results of a create request.
 * revision - The revision of the object.
 * parameters - Any additional parameters provided in the request. The sample code returns request parameters from an HTTP GET with ?param=x, as "parameters":{"param":"x"}.
 * content - Content based on the latest revision of the object, using getObject.
 * context - The context of the request, including headers and security. For more information, refer to Request context chain.
 * Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. For more information refer to Page Query Results.
 * Query parameters - The queryId and queryFilter parameters are specific to query methods. For more information refer to Construct Queries.
 *
 * @date  [@date]
 * @author {<authorname>@deloitte.com}
 */
/**
 * action - create:{
 *      action: 1
 *      requestId: 7878-78687
 * }
 */

logger.error("Inside generic workflow provisioning endpoint");
var koCredsAPI = identityServer.getProperty("esv.addremoveusercredential.api")
logger.error("Value of creds url is - " + koCredsAPI)
var kogCredsAPIScope = identityServer.getProperty("esv.addremoveusercredential.api.scope")
logger.error("Value of creds scope is - " + kogCredsAPIScope)
var koOrgAPI = identityServer.getProperty("esv.addremoveuseronboarding.api")
logger.error("Value of org url is - " + koOrgAPI)
var kogOrgAPIScope = identityServer.getProperty("esv.addremoveuseronboarding.api.scope")
logger.error("Value of org scope is - " + kogOrgAPIScope)

var failureReason = null;
var requestObj = null;
var shouldPatchUserPrerequisite = false;


(function () {

    const requestAction = request.content.action
    const requestId = request.content.requestId

    try {

        if (request.method == "create") {       /* This is HTTP POST operation. */        // {requestedUserAccountId="", action="0-Search | X - customAction (e.g 9-getActiveEnrollments) "}
            if (requestAction == "1") {

                ///////////////
                // Main
                ///////////////

                try {
                    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
                    logger.error("kyid-workflow requestObj: " + requestObj);
                } catch (e) {
                    failureReason = "kyid-workflow error: " + e;
                }

                if (requestObj && !failureReason) {
                    logger.error("kyid-workflow inside requestObj");
                    try {
                        ///////////////
                        // TBD, Logic to provisioning access to user 
                        ///////////////

                    } catch (e) {
                        var err = e.javaException;
                        failureReason = "kyid-workflow provisioning failed:  " + e;
                    }

                    var decision = {
                        'status': 'complete',
                        'decision': 'approved'
                    };

                    if (failureReason) {
                        decision.outcome = 'not provisioned';
                        decision.comment = failureReason;
                        decision.failure = true;
                    } else {
                        decision.outcome = 'provisioned';

                        saveUserPrerequisiteValues(requestObj, requestId);
                    }

                    var queryParams = {
                        '_action': 'update'
                    };
                    openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
                    logger.error("Request " + requestId + " completed.");
                }
                if (failureReason) {
                    return failureReason
                } else {
                    return null
                }

                //execution.setVariable("failureReason", failureReason);

            } else {
                throw { code: 500, message: "Unsupported requestAction." };
            }

        } else if (request.method == "update") { /* This is HTTP PUT operation. */
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method == "patch") {  /* This is HTTP PATCH operation. */
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method == "delete") { /* This is HTTP DELETE operation. */
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method == "read") {   /* This is HTTP GET operation. */
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        }

    } catch (error) {
        /* Returns error response. */
        // return {
        //     "code": "", 
        //     "message": "",
        //     "params" : [""]
        // }
        return error;
    }
})()


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
        }
        else {
            logger.error("User Prereq Not Found")
            return null
        }
    }
    catch (error) {
        logger.error("Error Occurred while fetching pending prerequsites" + error)
        return { code: 400, message: "Error Occurred while Prereq Summary " + error.message }
    }

}


function saveUserPrerequisiteValues(requestObj, requestId) {
    var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);
    logger.error("userPrerequisite response - " + JSON.stringify(userPrerequisite))
    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;
    var requestedUserAccountId = userPrerequisite.requestedUserAccountId;
    var prerequisite = openidm.read('managed/alpha_kyid_enrollment_prerequisite/' + prerequisiteId, null, ['*']);

    logger.error("kyid-workflow prerequisite: " + prerequisite);

    var enrollmentActionSettings = prerequisite.enrollmentActionSettings;

    logger.error("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);

    var expiryDateObject = prerequisite.expiry;

    logger.error("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));

    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);

    logger.error("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));
    shouldPatchUserPrerequisite = true

    if (shouldPatchUserPrerequisite) {
        let dateTimeISO = new Date().toISOString();
        let currentEpoch = Date.now();
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
        }, {
            "operation": "replace",
            "field": "/updatedDateEpoch",
            "value": currentEpoch
        }, {
            "operation": "replace",
            "field": "/updatedByID",
            "value": userPrerequisite.requestedUserAccountId
        }, {
            "operation": "replace",
            "field": "/updatedBy",
            "value": "KYID-System"
        }, {
            "operation": "replace",
            "field": "/updateDate",
            "value": dateTimeISO
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
    } else {
        logger.error("No provision access  --> ")
        return null
    }

}



