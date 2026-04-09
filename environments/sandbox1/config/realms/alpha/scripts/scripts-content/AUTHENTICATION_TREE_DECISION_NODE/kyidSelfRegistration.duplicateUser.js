/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//outcome = "true";
logger.error("User mail already exists");
sharedState.put("errorMessage", "User mail exists");
outcome = "true";

