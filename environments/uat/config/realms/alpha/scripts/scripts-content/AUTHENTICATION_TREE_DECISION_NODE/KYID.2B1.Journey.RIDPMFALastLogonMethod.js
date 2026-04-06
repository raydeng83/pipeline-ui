/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("MFAMethod") === "IdentityProofing" || nodeState.get("FirstTimeMFAMethod") === "IdentityProofing"){
    logger.debug("skipRidp")
    action.goTo("skipRidp")
}
else {
    logger.debug("go to Ridp")
    nodeState.putShared("journeyName","createAccount")
    action.goTo("Ridp")
}
