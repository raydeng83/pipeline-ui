
var nodeOutcome = {
    SUCCESS: "true",
    ERROR: "false",

};
//var mail = nodeState.get("objectAttributes").get("mail");
var Secondary_Email = nodeState.get("Secondary_Email");
logger.error("-------------------------------------------Email---------------------------"+Secondary_Email);

//openidm.read("managed/alpha_kyid_mfa_methods/" + Secondary_Email , null, [{"operation":"replace", "field":"accountStatus", "value":"active"}]);
//var usrKOGID = openidm.query("managed/alpha_kyid_mfa_methods", {"_queryFilter": "MFAValue eq Secondary_Email"}).result[0] || {}.KOGId;
//var usrKOGID = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/MFAValue eq "' + Secondary_Email + '"' }).KOGId;

 if (lookupInMFAObject(usrKOGID, Secondary_Email)){
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
         
    //logger.error("-------------------------------------different--------------------"+mail)
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
                logger.error("In Side If Line 59")
               // if (lookupInMFAObject(usrKOGID, Secondary_Email)) {
                    logger.error("already existed mail in MFA ");
                    //createMFAObject(usrKOGID, "SECONDARY_EMAIL", Secondary_Email, "ACTIVE");
                    action.goTo("true")

                  //  callbacksBuilder.textOutputCallback(0, "Existed account")


                }
    else{
        logger.error("-------------------------------------different else--------------------"+mail)
        //callbacksBuilder.textOutputCallback(0, "Existed account")
        action.goTo("false");
    }
 //var usrKOGID = nodeState.get("usrKOGID");

function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/MFAValue eq "' + Secondary_Email + '"' });
    logger.error("-------------------------------------mfaMethodResponse outer--------------------"+ mfaMethodResponses)
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            logger.error("-------------------------------------mfaMethodResponse--------------------"+ mfaMethodResponses)
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                return true;
            }
        }
    }
    return false;
}

function lookupInMFA_for_KOGID(usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/MFAValue eq "' + usrMfaValue + '"' });
    logger.error("-------------------------------------mfaMethodResponse outer--------------------"+ mfaMethodResponses)
    var kogidArray=[];
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            logger.error("-------------------------------------mfaMethodResponse--------------------"+ mfaMethodResponses)
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                kogidArray.push(mfaMethodResponse["KOGId"]);
            }
        }
    }
    logger.error("**************Collected KOGID values:"+ JSON.stringify(kogidArray));
    return kogidArray;
}

var usrKOGID=lookupInMFA_for_KOGID(Secondary_Email);
logger.error("-------------------------------------------dffdd---------------------------"+usrKOGID);

nodeState.putShared("usrKOGID", usrKOGID);

