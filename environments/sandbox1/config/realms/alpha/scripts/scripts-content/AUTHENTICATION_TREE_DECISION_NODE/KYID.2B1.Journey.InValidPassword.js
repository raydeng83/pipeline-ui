/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var inValidPasswordErrorMessage = "invalid_password";
logger.error("invalid_password");
nodeState.putShared("inValidPasswordErrorMessage",inValidPasswordErrorMessage);
action.goTo("true");

