/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//outcome = "true";
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var nodeOutcome = {
    SUCCESS: "true",
  //  ERROR: "false",
    PASS:"pass"
};
var mail = nodeState.get("objectAttributes").get("mail");
var Secondary_Email = nodeState.get("Secondary_Email");

//nodeState.putShared("mail", mail);
logger.error("-------------------------------------mail--------------------"+ mail)
logger.error("-------------------------------------secondry mail------------------------------"+Secondary_Email)
if(mail===Secondary_Email){  
    logger.error("-------------------------------------same primary and alternate mail--------------------"+ mail)
    action.goTo("true")
}
/*else if (lookupInMFAObject(usrKOGID, Secondary_Email)){
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
         
    logger.error("-------------------------------------different--------------------"+mail)
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
                logger.error("In Side If Line 59")
               // if (lookupInMFAObject(usrKOGID, Secondary_Email)) {
                    logger.error("already existed mail in MFA ");
                    //createMFAObject(usrKOGID, "SECONDARY_EMAIL", Secondary_Email, "ACTIVE");
                    action.goTo("false")

                  //  callbacksBuilder.textOutputCallback(0, "Existed account")


                }*/
    else{
        logger.info("-------------------------------------different primary and alternate mail--------------------"+mail)
        //callbacksBuilder.textOutputCallback(0, "Existed account")
        action.goTo("pass");
    }
// var usrKOGID = nodeState.get("usrKOGID");

/*function lookupInMFAObject(usrKOGID, usrMfaValue) {
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
*/


