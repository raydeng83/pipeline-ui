/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


logger.debug("KYID.2B1.Journey.BackFromRIDP --> "+nodeState.get("action"))
if(nodeState.get("backfromridp") || nodeState.get("action")==="back"){
     action.goTo("true")
} else {
    action.goTo("false")
}