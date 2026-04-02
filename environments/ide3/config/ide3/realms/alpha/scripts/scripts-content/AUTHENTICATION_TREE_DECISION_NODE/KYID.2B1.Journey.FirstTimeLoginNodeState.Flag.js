/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

nodeState.putShared("firstTimeLoginPerformed","true")
nodeState.putShared("firsttimemfaheader",null)
if(nodeState.get("journeyNameReporting")=="FirstTimeLoginJourney"){
    nodeState.putShared("journeyNameReporting",null)
}
outcome = "true";
