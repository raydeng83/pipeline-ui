var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if(endpointExecution === "true"){
    function validateDateRange(input) {
    // Regular expression to match the date format MM/DD/YYYY-MM/DD/YYYY
        const dateRangeRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}-(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

        if (!dateRangeRegex.test(input)) {
            throw { code: 400, message: 'Please use MM/DD/YYYY-MM/DD/YYYY.' };
            return false;
        }

        const [startDateStr, endDateStr] = input.split("-");
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate) || isNaN(endDate)) {
            throw { code: 400, message: 'Invalid dates provided.' };
            return false;
        }

        if (startDate > endDate) {
            throw { code: 400, message: 'Start date must be before or equal to end date.' };
            return false;
        }

        return true;
    }

    if (object.backupApproverL1DateRange && object.backupApproverL1DateRange != null) {
        if (!validateDateRange(object.backupApproverL1DateRange)) {
            throw { code: 400, message: '' };

        }
    }

    if (object.backupApproverL2DateRange && object.backupApproverL2DateRange != null) {
        if (!validateDateRange(object.backupApproverL2DateRange)) {
            throw { code: 400, message: '' };

        }
    }
}
else{
    //throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }
