/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var emptyPasswordErrorMessage = "blank_password";
logger.error("blank_password");
nodeState.putShared("emptyPasswordErrorMessage",emptyPasswordErrorMessage);
action.goTo("true");
outcome = "true";
