/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("KYID-Journey-PrintAllSharedStateData ::::::::::");
var email = nodeState.get("mail")
nodeState.putShared("username", email )
logger.debug("KYID-Journey-PrintAllSharedStateData ::::::::::"+nodeState.get("username"))
outcome = "true";
