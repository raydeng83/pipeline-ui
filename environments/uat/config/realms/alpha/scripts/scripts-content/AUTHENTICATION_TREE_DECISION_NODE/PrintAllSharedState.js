/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// nodeState.putShared("username","IDE_KYJUL_TI2@mailinator.com")
// nodeState.putShared("mail","IDE_KYJUL_TI2@mailinator.com")

logger.debug("Printing all Shared State Data ::::::::::::"+ nodeState.get("username"));
outcome = "true";
