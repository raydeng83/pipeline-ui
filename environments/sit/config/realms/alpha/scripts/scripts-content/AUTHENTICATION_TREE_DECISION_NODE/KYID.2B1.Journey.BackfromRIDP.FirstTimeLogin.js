/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("hasSecondaryEmailRegistered") === "true" && nodeState.get("action") === "back"){
    action.goTo("goToMobileReg")
}
 else if(nodeState.get("backfromridp") || nodeState.get("action")==="back"){
     action.goTo("true")
} else {
    action.goTo("false")
}
