/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//Clear the retry counts from nodestate
//logger.debug("Existing session properties in KYID.2B1.Registration_Acceptance.RetryCountClearFromNodeState :: => " + existingSession);
nodeState.putShared("resendsmsretryCount", null);
nodeState.putShared("resendvoiceretryCount", null);
nodeState.putShared("errorMessage_BlankOTP", null)
nodeState.putShared("incorrectsmsvoiceotpCount", null);
nodeState.putShared("blanksmsvoiceotpCount", null);
nodeState.putShared("errorMessage_ExpiredOTP", null);
nodeState.putShared("Journey_Phone_Verification",null);
logger.debug("MFA method isssssss" +nodeState.get("MFAMethod"));
// if(nodeState.get("MaxLimitReachedSkipPhone") == "false"){
//     nodeState.putShared("chooseanothermethod",null);
//     action.goTo("false");
// }
// else{
    outcome = "true";
// }
