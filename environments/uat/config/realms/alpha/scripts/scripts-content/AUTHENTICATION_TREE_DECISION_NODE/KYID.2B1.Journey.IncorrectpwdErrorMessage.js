/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var errorMessage = "Incorrect current password";
var errorCode = "ERR-CHN-PWD-001";
var errors = {};
errors["code"] = errorCode;
errors["message"] = errorMessage;
nodeState.putShared("changePasswordValidationError", errors);
outcome = "true";

