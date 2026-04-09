// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

var jsonObj = {};
var createUserSuccess = false;

/**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};



    
       
 
 
 var phone =     nodeState.get("phone")

 var usrKOGID = nodeState.get("usrKOGID");


    try {
    
            if (phone != null && typeof phone != "undefined") {
                logger.error("In Side If Line 59")
                if (!lookupInMFAObject(usrKOGID, phone)) {
                    logger.error("Creating MFA Email factor");
                    createMFAObject(usrKOGID, "PHONE", phone, "ACTIVE");
                }
            }               

        }

     catch (error) {
        logger.error(error);
        action.goTo(nodeOutcome.ERROR);
    }

    action.goTo(nodeOutcome.SUCCESS);




function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    //logger.error("MFA Method is being registered for " + usrKOGID + " and the method is "+method+" and value is "+usrMfaValue);
    var mfajsonObj = {};
    mfajsonObj['KOGId'] = usrKOGID;
    mfajsonObj['MFAMethod'] = method;
    mfajsonObj['MFAValue'] = usrMfaValue;
    mfajsonObj['MFAStatus'] = status;
    nodeLogger.error("Line 85 Create MFA Object" + JSON.stringify(mfajsonObj));
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}


function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                return true;
            }
        }
    }
    return false;
}



