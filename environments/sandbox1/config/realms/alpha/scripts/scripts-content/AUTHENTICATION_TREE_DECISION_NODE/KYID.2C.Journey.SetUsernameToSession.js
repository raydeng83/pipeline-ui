/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
  - Note: This script isn't fault-tolerant. It's meant to give an idea about how script nodes might be used in the context of the webinar.
 */
try {
    logger.error("KYID.2C.Journey.SetUsernameToSession: start");

    // get the user name from the node state.
    var userName = nodeState.get("username");

    logger.error("KYID.2C.Journey.SetUsernameToSession: username: " + userName);


// add username to the session property.
    action.goTo("true")
      .putSessionProperty("am.protected.username", userName);

} catch (error) {
    logger.error("KYID.2C.Journey.SetUsernameToSession: error: " + error)
        action.goTo("false");
    
}