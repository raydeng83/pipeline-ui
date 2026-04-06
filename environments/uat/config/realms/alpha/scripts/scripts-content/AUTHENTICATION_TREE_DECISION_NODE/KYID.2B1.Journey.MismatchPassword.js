/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var mismatchPasswordErrorMessage = "mismatch_password";
logger.debug("mismatch_password");
nodeState.putShared("mismatchPasswordErrorMessage",mismatchPasswordErrorMessage);
action.goTo("true");
