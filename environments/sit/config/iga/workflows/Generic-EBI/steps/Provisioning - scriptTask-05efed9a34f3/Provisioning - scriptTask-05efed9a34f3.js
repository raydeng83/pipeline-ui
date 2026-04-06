var content = execution.getVariables();
var requestId = content.get('id');
//logger.info("kyid-workflow provisioning for request with id: " + requestId);
logger.error("kyid-workflow provisioning for request with id: " + requestId);

var failureReason = null;
var requestObj = null;
var shouldPatchUserPrerequisite = false;

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
    let funcName = "invokeKOGCredentialsAPI"
    let responseKOGCredentialsAPI = null
    let requestBody = {
        url: identityServer.getProperty("esv.addremoveusercredential.api"),
        scope: identityServer.getProperty("esv.addremoveusercredential.api.scope"),
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
        responseKOGCredentialsAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("kyid-workflow responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - " + JSON.stringify(responseKOGCredentialsAPI))
        if (responseKOGCredentialsAPI != null && responseKOGCredentialsAPI) {
            if (responseKOGCredentialsAPI.ResponseStatus == 0) {
                apiResult.ResponseStatus = 0
                apiResult.apiStatus = 201
            } else {
                apiResult.ResponseStatus = responseKOGCredentialsAPI.ResponseStatus
                apiResult.MessageResponses = responseKOGCredentialsAPI.MessageResponses
                apiResult.apiStatus = 400
            }
        }
        return apiResult

    } catch (error) {
        //Return error response
        logger.error("kyid-workflow Exception is - " + error)
        failureReason = "kyid-workflow error encountered while invokeKOGCredentialsAPI: " + error;
    }
}

function invokeUserOnboardingAPI(payload) {
    logger.error("kyid-workflow Inside invokeUserOnboardingAPI");
    let funcName = "invokeUserOnboardingAPI";
    let responseUserOnboardingAPI = null;
    let requestBody = {
        url: identityServer.getProperty("esv.addremoveuseronboarding.api"),
        scope: identityServer.getProperty("esv.addremoveuseronboarding.api.scope"),
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
        responseUserOnboardingAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("kyid-workflow responseUserOnboardingAPI in invokeUserOnboardingAPI is - " + JSON.stringify(responseUserOnboardingAPI))
        if (responseUserOnboardingAPI != null && responseUserOnboardingAPI) {
            if (responseUserOnboardingAPI.ResponseStatus == 0) {
                apiResult.ResponseStatus = 0
                apiResult.apiStatus = 201
            } else {
                apiResult.ResponseStatus = responseUserOnboardingAPI.ResponseStatus
                apiResult.MessageResponses = responseUserOnboardingAPI.MessageResponses
                apiResult.apiStatus = 400
            }
        }
        return apiResult

    } catch (error) {
        //Return error response
        logger.error("kyid-workflow Exception is - " + error)
        failureReason = "kyid-workflow error encountered while invokeUserOnboardingAPI: " + error;
    }
}

function saveUserPrerequisiteValues(requestObj) {
    var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);

    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
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
        // var responseKOGCredentialsAPI = invokeKOGCredentialsAPI(requestObj.request.custom.payload);
        // logger.error("kyid-workflow responseKOGCredentialsAPI: " + JSON.stringify(responseKOGCredentialsAPI));
        // if (responseKOGCredentialsAPI.apiStatus == 201) {
            // if (responseKOGCredentialsAPI.ResponseStatus == 0) {
                try {
                    logger.error("kyid-workflow Patch UserPrerequisite");
                    if (requestObj.request.custom.page.values && requestObj.request.custom.page.values != null){
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
            // } else {
                // logger.error("kyid-workflow error encountered during patching user prerequisite: " + responseKOGCredentialsAPI.MessageResponses);
                // failureReason = "kyid-workflow Error getting Credentials API payload";
            // }
        // } else {
        //     logger.error("kyid-workflow Error getting Credentials API payload");
        //     failureReason = "kyid-workflow Error getting Credentials API payload";
        // }

    } else {
        // var responseUserOnboardingAPI = invokeUserOnboardingAPI(requestObj.request.custom.payload);


        // if (responseUserOnboardingAPI.apiStatus == 201) {
            // if (responseUserOnboardingAPI.ResponseStatus == 0) {
                // logger.error("kyid-workflow invokeUserOnboardingAPI is success");
                shouldPatchUserPrerequisite = true;
            // } else {
                // logger.error("kyid-workflow error encountered during patching user prerequisite: " + responseUserOnboardingAPI.MessageResponses);
                // failureReason = "kyid-workflow error encountered during patching user prerequisite: " + responseUserOnboardingAPI.MessageResponses;
            // }

        // } else {
            // logger.error("kyid-workflow Error getting user onboarding API payload");
            // failureReason = "kyid-workflow Error getting user onboarding API payload";
        // }
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
}



///////////////
// Main
///////////////

try {
    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    logger.info("kyid-workflow requestObj: " + requestObj);
} catch (e) {
    failureReason = "kyid-workflow error: " + e;
}

if (requestObj && !failureReason) {
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

        saveUserPrerequisiteValues(requestObj);
    }

    var queryParams = {
        '_action': 'update'
    };
    openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
    logger.info("Request " + requestId + " completed.");
}


execution.setVariable("failureReason", failureReason);