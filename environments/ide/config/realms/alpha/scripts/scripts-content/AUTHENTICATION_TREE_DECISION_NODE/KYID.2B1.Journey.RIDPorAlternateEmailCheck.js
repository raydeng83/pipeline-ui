/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("hasSecondaryEmailRegistered") === "true"){
     logger.debug("secondary email registered so skipping secondary email registration");
     action.goTo("gotoridp")
    } else {
    logger.debug("route to secondary email registration");
        action.goTo("gotoalternateemail")
    }
