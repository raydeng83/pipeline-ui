/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if (nodeState.get("needregistration") === "MOBILE" ) {
    logger.debug("Routing to Phone Registration")
action.goTo("phone")
}
else if(nodeState.get("needregistration") === "AUTHENTICATOR") {
    logger.debug("Routing to Authenticator Registration")
    action.goTo("authenticator")
} else {
    action.goTo("failed")
}
