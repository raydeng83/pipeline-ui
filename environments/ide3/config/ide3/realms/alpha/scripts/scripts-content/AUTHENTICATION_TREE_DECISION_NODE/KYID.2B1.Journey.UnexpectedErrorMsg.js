/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var errorMessage = "An unexpected error has occurred while processing the request.Please try again";
var errorCode = "ERR-SMW-TEC-000";
var errors = {};
errors["code"] = errorCode;
errors["message"] = errorMessage;
nodeState.putShared("changePasswordValidationError", errors);
outcome = "true";

