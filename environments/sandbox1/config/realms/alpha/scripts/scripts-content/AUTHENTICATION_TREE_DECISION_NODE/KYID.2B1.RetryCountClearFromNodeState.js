/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//Clear the retry counts from nodestate
nodeState.putShared("resendsmsretryCount", null);
nodeState.putShared("resendvoiceretryCount", null);
nodeState.putShared("errorMessage_BlankOTP", null)
nodeState.putShared("incorrectsmsvoiceotpCount", null);
nodeState.putShared("blanksmsvoiceotpCount", null);
outcome = "true";
