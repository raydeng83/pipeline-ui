// Node outcomes

logger.error("*******************Start with creation***************")
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








var usrEmailAddress =nodeState.get("mail");
var usrLastName = nodeState.get("sn");
var usrFirstName = nodeState.get("givenName");
//var usrKOGID = nodeState.get("mail");


var usrKOGID = generateGUID();
nodeState.putShared("usrKOGID",usrKOGID);
//var accountstatus=nodeState.get("accountStatus");
    // callbacksBuilder.textOutputCallback(1, accountstatus);
//nodeState.putShared("unregistered",accountstatus);
var accountstatus="Active";
//nodeState.putShared("accountStatus",accountstatus);

    jsonObj['givenName'] = usrFirstName;
    jsonObj['sn'] = usrLastName;
    jsonObj['mail'] = usrEmailAddress;
    jsonObj['userName'] = usrKOGID;
    jsonObj['accountStatus'] = accountstatus;

    // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(jsonObj));

    try {
        //An exception is thrown if the object could not be created.
        var createUserResponse = openidm.create("managed/alpha_user", null, jsonObj);
        var createdId = createUserResponse._id;
        nodeState.putShared("_id",createdId);
        logger.error("********************user created*******************")
        action.goTo(nodeOutcome.SUCCESS)
       
    } catch (error) {
        // nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.idmCreateOperationFailed + "::" + error);
        action.goTo(nodeOutcome.ERROR);
    }


    try {
        logger.error("createUserResponse is :: "+createUserResponse )
        if (createUserResponse) {
            logger.error("Creating user with following MFA details: " + usrEmailAddress );
            if (usrEmailAddress != null && typeof usrEmailAddress != "undefined") {
                logger.error("In Side If Line 59")
                if (!lookupInMFAObject(usrKOGID, usrEmailAddress)) {
                    logger.error("Creating MFA Email factor");
                    createMFAObject(usrKOGID, "EMAIL", usrEmailAddress, "ACTIVE");
                }
            }               

        }

    } catch (error) {
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

function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, 
            value = c == 'x' ? r : (r & 0x3 | 0x8);
        return value.toString(16);
    });
}
logger.error("*************************************Created user in alpha*********************************")

