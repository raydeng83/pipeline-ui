var content = execution.getVariables();
var requestId = content.get('id');
logger.info("kyid-workflow provisioning for request with id: " + requestId);

var failureReason = null;
var requestObj = null;

function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now();  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString();  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate);  // Convert the ISO string into a Date object

        let expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000);  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000);  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3);  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6);  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1);  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day);  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1);  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000);  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return { code: 400, message: "Invalid Input" }
        }

        const expiryEpochMillis = new Date(expiryDate).getTime();  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { 
                expiryEpoch: expiryEpochMillis, 
                expiryDate: expiryDate 
              };

    } catch (error) {
        return { code: 400, message: "Error Occurred While getExpiryDate " }
        logger.error("Error Occurred While getExpiryDate " + error)
    }

}
 

function saveUserPrerequisiteValues(requestObj) {
    var userPrerequisite = openidm.read('managed/alpha_kyid_enrollment_user_prerequisites/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);

    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;
    var prerequisite = openidm.read('managed/alpha_kyid_enrollment_prerequisite/' + prerequisiteId, null, [ '*' ]);
    logger.info("kyid-workflow prerequisite: " + prerequisite);

    var enrollmentActionSettings = prerequisite.enrollmentActionSettings;
    logger.info("kyid-workflow enrollmentActionSettings: " + enrollmentActionSettings);

    var expiryDateObject = prerequisite.expiry;
    logger.info("kyid-workflow expiryDateObject: " + JSON.stringify(expiryDateObject));
    
    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);
    logger.info("kyid-workflow calculated expiry: " + JSON.stringify(calculatedExpiryDate));

    var saveInput = enrollmentActionSettings.saveInput;
    logger.info("kyid-workflow saveInput: " + saveInput);

    if (saveInput) {
        var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);
        logger.info("kyid-workflow fieldValuesJson: " + JSON.stringify(fieldValuesJson));
        var result = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [
            {"operation":"replace","field":"/prerequisiteValues","value":fieldValuesJson} 
        ]);
        logger.info("kyid-workflow patch result: " + result);
    }

    openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + requestObj.request.custom.userPrerequisiteId, null, [
            {"operation":"replace","field":"/status","value":"REJECTED"},
            {"operation":"replace","field":"/expiryDate","value": calculatedExpiryDate.expiryDate},
            {"operation":"replace","field":"/expiryDateEpoch","value": Number(calculatedExpiryDate.expiryEpoch)},
            {"operation":"replace","field":"/completionDate","value": new Date().toISOString()},
            {"operation":"replace","field":"/completionDateEpoch","value": Number(Date.now())},
            {"operation":"replace","field":"/pingApprovalWorkflowId","value":requestId}
    ]);
}

try {
    requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    logger.info("kyid-workflow requestObj: " + requestObj);
} catch (e) {
    failureReason = "kyid-workflow error: " + e;
}

if (requestObj  && !failureReason) {
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
        'decision': 'rejected'
    };
    
    if (failureReason) {
        decision.outcome = 'not provisioned';
        decision.comment = failureReason;
        decision.failure = true;
    } else {
        decision.outcome = 'denied';

       

        saveUserPrerequisiteValues(requestObj);
    }

    var queryParams = {
        '_action': 'update'
    };
    openidm.action('iga/governance/requests/' + requestId, 'POST', decision, queryParams);
    logger.info("Request " + requestId + " completed.");
}