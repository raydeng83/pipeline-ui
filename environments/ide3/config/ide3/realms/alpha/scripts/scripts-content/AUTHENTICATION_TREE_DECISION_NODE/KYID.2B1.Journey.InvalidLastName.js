/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var errorInvalidLastName = "invalid_lastname";
logger.error("invalid_lastname");
nodeState.putShared("errorInvalidLastName",errorInvalidLastName);
action.goTo("true");
