/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("backfromridploginsecurity") === "true") {
    action.goTo("backtomfa")
} else {
    action.goTo("true")
}

