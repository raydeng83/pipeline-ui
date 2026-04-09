/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
sharedState.put("errorMessage", "User doesn't exist");
logger.error("User Not Found");
outcome = "true";
