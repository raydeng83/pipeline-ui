/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var errorMessage = "ERR-INP-LOG-001 The email or password you entered is invalid. Please re-enter the email and password and try again.";
nodeState.putShared("failedOrInactive", errorMessage);
logger.error("inside KYID.2B1.Journey.PTAFailed" +nodeState.get("failedOrInactive"));
outcome = "true";

