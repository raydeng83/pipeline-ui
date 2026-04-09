/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var phoneNumber = nodeState.get("telephoneNumber");
//var S = nodeState.get("mail");

 var usrKOGID = nodeState.get("usrKOGID");


if (lookupInMFAObject(usrKOGID, phoneNumber)){
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
             //logger.error("-------------------------------------different--------------------"+S)

    logger.error("-------------------------------------different--------------------"+phoneNumber)
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
                logger.error("In Side If Line 59")
               // if (lookupInMFAObject(usrKOGID, Secondary_Email)) {
                    logger.error("already existed mail in MFA ");
                    //createMFAObject(usrKOGID, "SECONDARY_EMAIL", Secondary_Email, "ACTIVE");
                    
                        nodeState.putShared("phoneexist","true");

                    action.goTo("true")

                  //  callbacksBuilder.textOutputCallback(0, "Existed account")

                }
else{
    action.goTo("false");
}
function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/MFAValue eq "' + phoneNumber + '"' });
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
