/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("primary email from nodestate check email: "+nodeState.get("mail"));
logger.debug("alternate email from nodestate check email : "+nodeState.get("alternatemail"))
outcome = "true";
