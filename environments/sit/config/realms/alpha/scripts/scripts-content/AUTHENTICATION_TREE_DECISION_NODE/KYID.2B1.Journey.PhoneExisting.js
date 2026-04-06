/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var phoneExistingMessage = "PhoneNumber_Existing";
logger.error("PhoneNumber_Existing");
nodeState.putShared("phoneExistingMessage",phoneExistingMessage);
outcome = "true";
